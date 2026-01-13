import EmailLog from './emailLog.model.js'
import { asyncHandler } from '#helpers'

/**
 * Get email logs with filters and pagination
 */
export const getEmailLogs = asyncHandler(async (req, res) => {
  const {
    status,
    type,
    to,
    partnerId,
    startDate,
    endDate,
    page = 1,
    limit = 50
  } = req.query

  // Build filter
  const filter = {}

  // Platform users can see all, partners only their own
  if (req.user.accountType === 'partner') {
    filter.partnerId = req.user.accountId
  } else if (partnerId) {
    filter.partnerId = partnerId
  }

  if (status) filter.status = status
  if (type) filter.type = type
  if (to) filter.to = { $regex: to, $options: 'i' }

  // Date range
  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate)
    if (endDate) filter.createdAt.$lte = new Date(endDate)
  }

  // Pagination
  const skip = (page - 1) * limit
  const total = await EmailLog.countDocuments(filter)

  const logs = await EmailLog.find(filter)
    .populate('partnerId', 'companyName')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean()

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

/**
 * Get email log stats
 */
export const getEmailStats = asyncHandler(async (req, res) => {
  const { partnerId, startDate, endDate } = req.query

  const filter = {}

  // Platform users can see all, partners only their own
  if (req.user.accountType === 'partner') {
    filter.partnerId = req.user.accountId
  } else if (partnerId) {
    filter.partnerId = partnerId
  }

  // Date range
  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate)
    if (endDate) filter.createdAt.$lte = new Date(endDate)
  }

  // Get stats by status
  const statusStats = await EmailLog.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ])

  // Get stats by type
  const typeStats = await EmailLog.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ])

  // Get recent failures
  const recentFailures = await EmailLog.find({ ...filter, status: 'failed' })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()

  // Calculate totals
  const total = statusStats.reduce((sum, s) => sum + s.count, 0)
  const sent = statusStats.find(s => s._id === 'sent')?.count || 0
  const failed = statusStats.find(s => s._id === 'failed')?.count || 0

  res.json({
    success: true,
    data: {
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
    }
  })
})

/**
 * Get single email log
 */
export const getEmailLog = asyncHandler(async (req, res) => {
  const log = await EmailLog.findById(req.params.id)
    .populate('partnerId', 'companyName')
    .populate('userId', 'name email')

  if (!log) {
    return res.status(404).json({
      success: false,
      message: 'Email log not found'
    })
  }

  // Check access
  if (req.user.accountType === 'partner') {
    if (log.partnerId?.toString() !== req.user.accountId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
  }

  res.json({
    success: true,
    data: log
  })
})

/**
 * Retry failed email (platform only)
 */
export const retryEmail = asyncHandler(async (req, res) => {
  const log = await EmailLog.findById(req.params.id)

  if (!log) {
    return res.status(404).json({
      success: false,
      message: 'Email log not found'
    })
  }

  if (log.status !== 'failed') {
    return res.status(400).json({
      success: false,
      message: 'Only failed emails can be retried'
    })
  }

  // TODO: Implement retry logic based on email type
  // This would require storing the original email content

  res.json({
    success: false,
    message: 'Retry functionality not implemented yet'
  })
})
