/**
 * Notification Log Service
 * Bildirim loglarını listele, istatistik al
 */

import NotificationLog from './notificationLog.model.js'
import { BaseEntityService } from '#services/base/BaseEntityService.js'
import { sendSuccess } from '#services/responseHelper.js'
import { parsePagination, paginatedQuery } from '#services/queryBuilder.js'
import { NotFoundError } from '#core/errors.js'

class NotificationLogService extends BaseEntityService {
  constructor() {
    super(NotificationLog, {
      entityName: 'notificationLog',
      allowedFields: [],
      searchFields: ['recipientEmail', 'recipientPhone', 'subject'],
      defaultSort: { createdAt: -1 },
      populate: [
        { path: 'recipient', select: 'name email' },
        { path: 'partner', select: 'companyName code' }
      ]
    })

    // Bind custom methods
    this.getStats = this.getStats.bind(this)
    this.getTypeBreakdown = this.getTypeBreakdown.bind(this)
    this.getChannelStats = this.getChannelStats.bind(this)
  }

  /**
   * Partner-scoped filtering
   */
  getTenantFilter(req) {
    if (req.partnerContext?.partnerId) {
      return { partner: req.partnerContext.partnerId }
    }
    return {}
  }

  /**
   * Custom filter: type, status, channel, date range, search
   */
  buildFilter(req) {
    const { type, status, channel, startDate, endDate, recipient, search } = req.query
    const filter = this.getTenantFilter(req)

    if (type) filter.type = type
    if (status) filter.status = status
    if (recipient) filter.recipient = recipient

    if (channel) {
      filter[`channels.${channel}.attempted`] = true
    }

    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    if (search) {
      filter.$or = [
        { recipientEmail: { $regex: search, $options: 'i' } },
        { recipientPhone: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ]
    }

    return filter
  }

  /**
   * Override list to preserve existing response format
   */
  async list(req, res) {
    const filter = this.buildFilter(req)
    const { page, limit } = parsePagination(req.query)

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
   * Override getById with partner access control
   */
  async getById(req, res) {
    const log = await NotificationLog.findById(req.params.id)
      .populate('recipient', 'name email phone')
      .populate('partner', 'companyName code')
      .populate('requestMeta.triggeredBy', 'name email')

    if (!log) {
      throw new NotFoundError('NOTIFICATION_LOG_NOT_FOUND')
    }

    if (req.partnerContext?.partnerId &&
        log.partner?.toString() !== req.partnerContext.partnerId.toString()) {
      throw new NotFoundError('NOTIFICATION_LOG_NOT_FOUND')
    }

    sendSuccess(res, log)
  }

  /**
   * Notification statistics
   */
  async getStats(req, res) {
    const { period = 'week' } = req.query
    const partnerId = req.partnerContext?.partnerId || null

    const stats = await NotificationLog.getStats(partnerId, period)

    sendSuccess(res, stats)
  }

  /**
   * Type breakdown for charts
   */
  async getTypeBreakdown(req, res) {
    const { days = 7 } = req.query
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const match = { createdAt: { $gte: startDate } }
    if (req.partnerContext?.partnerId) {
      match.partner = req.partnerContext.partnerId
    }

    const breakdown = await NotificationLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            type: '$type',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          total: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.date': 1 } }
    ])

    sendSuccess(res, breakdown)
  }

  /**
   * Channel performance stats
   */
  async getChannelStats(req, res) {
    const { days = 30 } = req.query
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const match = { createdAt: { $gte: startDate } }
    if (req.partnerContext?.partnerId) {
      match.partner = req.partnerContext.partnerId
    }

    const channelStats = await NotificationLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          emailAttempted: { $sum: { $cond: ['$channels.email.attempted', 1, 0] } },
          emailSuccess: { $sum: { $cond: ['$channels.email.success', 1, 0] } },
          smsAttempted: { $sum: { $cond: ['$channels.sms.attempted', 1, 0] } },
          smsSuccess: { $sum: { $cond: ['$channels.sms.success', 1, 0] } },
          pushAttempted: { $sum: { $cond: ['$channels.push.attempted', 1, 0] } },
          pushSent: { $sum: '$channels.push.sent' },
          pushFailed: { $sum: '$channels.push.failed' }
        }
      }
    ])

    const stats = channelStats[0] || {
      emailAttempted: 0, emailSuccess: 0,
      smsAttempted: 0, smsSuccess: 0,
      pushAttempted: 0, pushSent: 0, pushFailed: 0
    }

    sendSuccess(res, {
      email: {
        attempted: stats.emailAttempted,
        success: stats.emailSuccess,
        failed: stats.emailAttempted - stats.emailSuccess,
        successRate: stats.emailAttempted > 0
          ? Math.round((stats.emailSuccess / stats.emailAttempted) * 100) : 0
      },
      sms: {
        attempted: stats.smsAttempted,
        success: stats.smsSuccess,
        failed: stats.smsAttempted - stats.smsSuccess,
        successRate: stats.smsAttempted > 0
          ? Math.round((stats.smsSuccess / stats.smsAttempted) * 100) : 0
      },
      push: {
        attempted: stats.pushAttempted,
        sent: stats.pushSent,
        failed: stats.pushFailed,
        successRate: stats.pushAttempted > 0
          ? Math.round((stats.pushSent / (stats.pushSent + stats.pushFailed)) * 100) : 0
      }
    })
  }
}

const notificationLogService = new NotificationLogService()

export default notificationLogService
