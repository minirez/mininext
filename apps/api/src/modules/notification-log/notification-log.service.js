/**
 * Notification Log Service
 * Bildirim loglarını listele, istatistik al
 */

import NotificationLog from './notificationLog.model.js'
import { asyncHandler } from '#helpers'
import { NotFoundError } from '#core/errors.js'

/**
 * Get notification logs with pagination and filters
 */
export const getNotificationLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    type,
    status,
    channel,
    startDate,
    endDate,
    recipient,
    search
  } = req.query

  const query = {}

  // Partner context (if not platform admin)
  if (req.partnerContext?.partnerId) {
    query.partner = req.partnerContext.partnerId
  }

  // Filters
  if (type) query.type = type
  if (status) query.status = status
  if (recipient) query.recipient = recipient

  // Channel filter
  if (channel) {
    query[`channels.${channel}.attempted`] = true
  }

  // Date range
  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = new Date(startDate)
    if (endDate) query.createdAt.$lte = new Date(endDate)
  }

  // Search by email or phone
  if (search) {
    query.$or = [
      { recipientEmail: { $regex: search, $options: 'i' } },
      { recipientPhone: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } }
    ]
  }

  const skip = (parseInt(page) - 1) * parseInt(limit)
  const limitNum = parseInt(limit)

  const [logs, total] = await Promise.all([
    NotificationLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('recipient', 'name email')
      .populate('partner', 'companyName code')
      .lean(),
    NotificationLog.countDocuments(query)
  ])

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  })
})

/**
 * Get single notification log detail
 */
export const getNotificationLog = asyncHandler(async (req, res) => {
  const log = await NotificationLog.findById(req.params.id)
    .populate('recipient', 'name email phone')
    .populate('partner', 'companyName code')
    .populate('requestMeta.triggeredBy', 'name email')

  if (!log) {
    throw new NotFoundError('NOTIFICATION_LOG_NOT_FOUND')
  }

  // Check partner access
  if (req.partnerContext?.partnerId &&
      log.partner?.toString() !== req.partnerContext.partnerId.toString()) {
    throw new NotFoundError('NOTIFICATION_LOG_NOT_FOUND')
  }

  res.json({
    success: true,
    data: log
  })
})

/**
 * Get notification statistics
 */
export const getNotificationStats = asyncHandler(async (req, res) => {
  const { period = 'week' } = req.query
  const partnerId = req.partnerContext?.partnerId || null

  const stats = await NotificationLog.getStats(partnerId, period)

  res.json({
    success: true,
    data: stats
  })
})

/**
 * Get notification log by type breakdown
 */
export const getTypeBreakdown = asyncHandler(async (req, res) => {
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

  res.json({
    success: true,
    data: breakdown
  })
})

/**
 * Get channel performance stats
 */
export const getChannelStats = asyncHandler(async (req, res) => {
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
        // Email stats
        emailAttempted: { $sum: { $cond: ['$channels.email.attempted', 1, 0] } },
        emailSuccess: { $sum: { $cond: ['$channels.email.success', 1, 0] } },
        // SMS stats
        smsAttempted: { $sum: { $cond: ['$channels.sms.attempted', 1, 0] } },
        smsSuccess: { $sum: { $cond: ['$channels.sms.success', 1, 0] } },
        // Push stats
        pushAttempted: { $sum: { $cond: ['$channels.push.attempted', 1, 0] } },
        pushSent: { $sum: '$channels.push.sent' },
        pushFailed: { $sum: '$channels.push.failed' }
      }
    }
  ])

  const stats = channelStats[0] || {
    emailAttempted: 0,
    emailSuccess: 0,
    smsAttempted: 0,
    smsSuccess: 0,
    pushAttempted: 0,
    pushSent: 0,
    pushFailed: 0
  }

  // Calculate success rates
  const result = {
    email: {
      attempted: stats.emailAttempted,
      success: stats.emailSuccess,
      failed: stats.emailAttempted - stats.emailSuccess,
      successRate: stats.emailAttempted > 0
        ? Math.round((stats.emailSuccess / stats.emailAttempted) * 100)
        : 0
    },
    sms: {
      attempted: stats.smsAttempted,
      success: stats.smsSuccess,
      failed: stats.smsAttempted - stats.smsSuccess,
      successRate: stats.smsAttempted > 0
        ? Math.round((stats.smsSuccess / stats.smsAttempted) * 100)
        : 0
    },
    push: {
      attempted: stats.pushAttempted,
      sent: stats.pushSent,
      failed: stats.pushFailed,
      successRate: stats.pushAttempted > 0
        ? Math.round((stats.pushSent / (stats.pushSent + stats.pushFailed)) * 100)
        : 0
    }
  }

  res.json({
    success: true,
    data: result
  })
})
