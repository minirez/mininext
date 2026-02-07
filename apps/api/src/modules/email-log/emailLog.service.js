import EmailLog from './emailLog.model.js'
import { BaseEntityService } from '#services/base/BaseEntityService.js'
import { sendSuccess } from '#services/responseHelper.js'
import { parsePagination, paginatedQuery } from '#services/queryBuilder.js'

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
      EmailLog.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      EmailLog.aggregate([
        { $match: filter },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
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
      byStatus: statusStats.reduce((acc, s) => { acc[s._id] = s.count; return acc }, {}),
      byType: typeStats.reduce((acc, s) => { acc[s._id] = s.count; return acc }, {}),
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

    // TODO: Implement retry logic based on email type
    res.json({ success: false, message: 'Retry functionality not implemented yet' })
  }
}

const emailLogService = new EmailLogService()

export default emailLogService
