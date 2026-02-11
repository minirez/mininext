import EmailLog from './emailLog.model.js'
import { BaseEntityService } from '#services/base/BaseEntityService.js'
import { sendSuccess, sendError, sendMessage } from '#services/responseHelper.js'
import { parsePagination, paginatedQuery } from '#services/queryBuilder.js'
import logger from '#core/logger.js'

class EmailLogService extends BaseEntityService {
  constructor() {
    super(EmailLog, {
      entityName: 'emailLog',
      allowedFields: [],
      searchFields: ['to'],
      defaultSort: { createdAt: -1 },
      populate: [
        { path: 'partnerId', select: 'companyName' },
        { path: 'userId', select: 'name email' }
      ]
    })

    // Bind custom methods
    this.getStats = this.getStats.bind(this)
    this.retry = this.retry.bind(this)
  }

  /**
   * Partner-scoped: partners see only their own logs
   */
  getTenantFilter(req) {
    if (req.user?.accountType === 'partner') {
      return { partnerId: req.user.accountId }
    }
    return {}
  }

  /**
   * Custom filter: status, type, to, partnerId, date range
   */
  buildFilter(req) {
    const { status, type, to, partnerId, startDate, endDate } = req.query
    const filter = this.getTenantFilter(req)

    // Platform admin can filter by partnerId
    if (partnerId && !filter.partnerId) filter.partnerId = partnerId
    if (status) filter.status = status
    if (type) filter.type = type
    if (to) filter.to = { $regex: to, $options: 'i' }

    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    return filter
  }

  /**
   * Override list to preserve existing response format { data: { logs, pagination } }
   */
  async list(req, res) {
    const filter = this.buildFilter(req)
    const { page, limit } = parsePagination(req.query, { defaultLimit: 50 })

    const result = await paginatedQuery(this.Model, filter, {
      page,
      limit,
      sort: this.config.defaultSort,
      populate: this.config.populate
    })

    res.json({
      success: true,
      data: {
        logs: result.data,
        pagination: result.pagination
      }
    })
  }

  /**
   * Override getById: access control for partner users
   */
  async getById(req, res) {
    const log = await EmailLog.findById(req.params.id)
      .populate('partnerId', 'companyName')
      .populate('userId', 'name email')

    if (!log) {
      return res.status(404).json({ success: false, message: 'Email log not found' })
    }

    if (req.user.accountType === 'partner') {
      if (log.partnerId?.toString() !== req.user.accountId.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }
    }

    sendSuccess(res, log)
  }

  /**
   * Email statistics: by status, by type, recent failures
   */
  async getStats(req, res) {
    const { partnerId, startDate, endDate } = req.query

    const filter = this.getTenantFilter(req)
    if (partnerId && !filter.partnerId) filter.partnerId = partnerId

    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    const [statusStats, typeStats, recentFailures] = await Promise.all([
      EmailLog.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      EmailLog.aggregate([{ $match: filter }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
      EmailLog.find({ ...filter, status: 'failed' })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ])

    const total = statusStats.reduce((sum, s) => sum + s.count, 0)
    const sent = statusStats.find(s => s._id === 'sent')?.count || 0
    const failed = statusStats.find(s => s._id === 'failed')?.count || 0

    sendSuccess(res, {
      total,
      sent,
      failed,
      successRate: total > 0 ? ((sent / total) * 100).toFixed(1) : 0,
      byStatus: statusStats.reduce((acc, s) => {
        acc[s._id] = s.count
        return acc
      }, {}),
      byType: typeStats.reduce((acc, s) => {
        acc[s._id] = s.count
        return acc
      }, {}),
      recentFailures
    })
  }

  /**
   * Retry failed email
   */
  async retry(req, res) {
    const log = await EmailLog.findById(req.params.id)

    if (!log) {
      return res.status(404).json({ success: false, message: 'Email log not found' })
    }

    if (log.status !== 'failed') {
      return res.status(400).json({ success: false, message: 'Only failed emails can be retried' })
    }

    // Booking-related types can be retried by regenerating from the booking
    const BOOKING_EMAIL_TYPES = new Set([
      'booking-confirmation',
      'booking-cancelled',
      'booking-modified'
    ])

    if (!BOOKING_EMAIL_TYPES.has(log.type)) {
      return sendError(res, 'Retry is only supported for booking emails', 400)
    }

    const bookingId = log.metadata?.bookingId || log.relatedId
    if (!bookingId) {
      return sendError(res, 'No booking reference found in email log', 400)
    }

    try {
      const { default: Booking } = await import('#modules/booking/booking.model.js')
      const { renderEmailTemplate } = await import('#helpers/emailTemplates.js')
      const { sendEmail } = await import('#helpers/mail.js')
      const { formatDateLocale, formatCurrency } = await import('@booking-engine/utils')

      const booking = await Booking.findById(bookingId)
        .populate('hotel', 'name address contact policies')
        .populate('partner', 'companyName email address branding')
        .lean()

      if (!booking) {
        return sendError(res, 'Referenced booking no longer exists', 404)
      }

      const language = log.metadata?.language || 'tr'
      const locale = language === 'tr' ? 'tr-TR' : 'en-US'
      const hotelName =
        typeof booking.hotel?.name === 'object'
          ? booking.hotel.name[language] || booking.hotel.name.tr || booking.hotel.name.en
          : booking.hotel?.name || booking.hotelName || ''

      const templateData = {
        BOOKING_NUMBER: booking.bookingNumber,
        STATUS: language === 'tr' ? 'Onaylandı' : 'Confirmed',
        HOTEL_NAME: hotelName,
        HOTEL_ADDRESS: booking.hotel?.address?.full || '',
        CHECKIN_DATE: formatDateLocale(booking.checkIn, locale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        CHECKOUT_DATE: formatDateLocale(booking.checkOut, locale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        NIGHTS: booking.nights || '',
        ROOM_TYPE:
          booking.rooms?.[0]?.roomTypeName?.[language] || booking.rooms?.[0]?.roomTypeCode || '',
        BOARD_TYPE:
          booking.rooms?.[0]?.mealPlanName?.[language] || booking.rooms?.[0]?.mealPlanCode || '',
        TOTAL_PRICE: formatCurrency(
          booking.pricing?.grandTotal || 0,
          booking.pricing?.currency || 'TRY',
          locale
        ),
        GUEST_NAME: booking.leadGuest
          ? `${booking.leadGuest.firstName || ''} ${booking.leadGuest.lastName || ''}`.trim()
          : '',
        GUEST_EMAIL: booking.contact?.email || '',
        GUEST_PHONE: booking.contact?.phone || '',
        BOOKING_URL: `https://app.maxirez.com/bookings/${booking._id}`,
        TITLE: language === 'tr' ? 'Rezervasyon Onayı' : 'Booking Confirmation',
        PREVIEW_TEXT:
          language === 'tr'
            ? `${booking.bookingNumber} numaralı rezervasyonunuz`
            : `Your booking ${booking.bookingNumber}`,
        COMPANY_NAME: booking.partner?.companyName || 'Booking Engine',
        COMPANY_ADDRESS: booking.partner?.address?.city || '',
        SUPPORT_EMAIL: booking.partner?.email || 'destek@maxirez.com',
        SITE_URL: 'https://app.maxirez.com',
        LOGO_URL: 'https://app.maxirez.com/logo.png'
      }

      const templateMap = {
        'booking-confirmation': 'booking-confirmation',
        'booking-cancelled': 'booking-confirmation',
        'booking-modified': 'booking-confirmation'
      }

      const html = await renderEmailTemplate(templateMap[log.type], templateData, language)

      await sendEmail({
        to: log.to,
        subject: log.subject,
        html,
        partnerId: log.partnerId,
        type: log.type,
        metadata: { ...log.metadata, retriedFrom: log._id, retriedAt: new Date() }
      })

      // Mark original log as retried
      await EmailLog.findByIdAndUpdate(log._id, {
        $set: { 'metadata.retriedAt': new Date(), 'metadata.retried': true }
      })

      sendMessage(res, 'Email resent successfully')
    } catch (error) {
      logger.error('[EmailLog] Retry failed:', { emailLogId: log._id, error: error.message })
      return sendError(res, `Retry failed: ${error.message}`, 500)
    }
  }
}

const emailLogService = new EmailLogService()

export default emailLogService
