import AuditLog from './audit.model.js'
import { asyncHandler, escapeRegex } from '#helpers'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { parsePagination } from '#services/queryBuilder.js'

/**
 * Get all audit logs with filtering and pagination
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const {
    module,
    subModule,
    action,
    status,
    userId,
    partnerId,
    collection,
    documentId,
    startDate,
    endDate,
    search
  } = req.query
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 })

  // Build filter
  const filter = {}

  if (module) filter.module = module
  if (subModule) filter.subModule = subModule
  if (action) filter.action = action
  if (status) filter.status = status
  if (userId) filter['actor.userId'] = userId
  if (partnerId) filter['actor.partnerId'] = partnerId
  if (collection) filter['target.collection'] = collection
  if (documentId) filter['target.documentId'] = documentId

  // Date range filter
  if (startDate || endDate) {
    filter.timestamp = {}
    if (startDate) filter.timestamp.$gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filter.timestamp.$lte = end
    }
  }

  // Search in email, name, documentName
  if (search) {
    const escaped = escapeRegex(search)
    filter.$or = [
      { 'actor.email': { $regex: escaped, $options: 'i' } },
      { 'actor.name': { $regex: escaped, $options: 'i' } },
      { 'target.documentName': { $regex: escaped, $options: 'i' } }
    ]
  }

  // Pagination
  const total = await AuditLog.countDocuments(filter)

  const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean()

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

/**
 * Get single audit log by ID
 */
export const getAuditLog = asyncHandler(async (req, res) => {
  const log = await AuditLog.findById(req.params.id).lean()

  if (!log) {
    throw new NotFoundError('AUDIT_LOG_NOT_FOUND')
  }

  res.json({
    success: true,
    data: log
  })
})

/**
 * Get document history (all changes for a specific document)
 */
export const getDocumentHistory = asyncHandler(async (req, res) => {
  const { collection, documentId } = req.params
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 })

  if (!collection || !documentId) {
    throw new BadRequestError('MISSING_COLLECTION_OR_DOCUMENT_ID')
  }

  const filter = {
    'target.collection': collection,
    'target.documentId': documentId
  }

  const total = await AuditLog.countDocuments(filter)

  const history = await AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean()

  res.json({
    success: true,
    data: {
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

/**
 * Get user activity (all actions by a specific user)
 */
export const getUserActivity = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 })

  if (!userId) {
    throw new BadRequestError('MISSING_USER_ID')
  }

  const filter = { 'actor.userId': userId }

  const total = await AuditLog.countDocuments(filter)

  const activity = await AuditLog.find(filter)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  res.json({
    success: true,
    data: {
      activity,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

/**
 * Get partner activity (all actions by a specific partner's users)
 */
export const getPartnerActivity = asyncHandler(async (req, res) => {
  const { partnerId } = req.params
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 })

  if (!partnerId) {
    throw new BadRequestError('MISSING_PARTNER_ID')
  }

  const filter = { 'actor.partnerId': partnerId }

  const total = await AuditLog.countDocuments(filter)

  const activity = await AuditLog.find(filter)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  res.json({
    success: true,
    data: {
      activity,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

/**
 * Get audit statistics
 */
export const getAuditStats = asyncHandler(async (req, res) => {
  const { period = 'day' } = req.query

  const stats = await AuditLog.getStats(period)

  // Also get totals
  const now = new Date()
  let startDate

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  }

  const [totalLogs, successCount, failureCount, uniqueUsers] = await Promise.all([
    AuditLog.countDocuments({ timestamp: { $gte: startDate } }),
    AuditLog.countDocuments({ timestamp: { $gte: startDate }, status: 'success' }),
    AuditLog.countDocuments({ timestamp: { $gte: startDate }, status: 'failure' }),
    AuditLog.distinct('actor.userId', { timestamp: { $gte: startDate } })
  ])

  res.json({
    success: true,
    data: {
      period,
      startDate,
      endDate: now,
      summary: {
        totalLogs,
        successCount,
        failureCount,
        uniqueUsers: uniqueUsers.length
      },
      byModule: stats
    }
  })
})

/**
 * Export audit logs (CSV format)
 */
export const exportAuditLogs = asyncHandler(async (req, res) => {
  const { module, action, startDate, endDate, format = 'csv' } = req.query

  // Build filter
  const filter = {}
  if (module) filter.module = module
  if (action) filter.action = action

  if (startDate || endDate) {
    filter.timestamp = {}
    if (startDate) filter.timestamp.$gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filter.timestamp.$lte = end
    }
  }

  // Limit export to 10000 records
  const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(10000).lean()

  if (format === 'csv') {
    // Generate CSV
    const headers = [
      'Timestamp',
      'Module',
      'SubModule',
      'Action',
      'Status',
      'User Email',
      'User Name',
      'Role',
      'IP Address',
      'Target Collection',
      'Target ID',
      'Target Name',
      'Request Path',
      'HTTP Status',
      'Duration (ms)'
    ].join(',')

    const rows = logs.map(log =>
      [
        log.timestamp?.toISOString() || '',
        log.module || '',
        log.subModule || '',
        log.action || '',
        log.status || '',
        log.actor?.email || '',
        log.actor?.name || '',
        log.actor?.role || '',
        log.actor?.ip || '',
        log.target?.collection || '',
        log.target?.documentId || '',
        `"${(log.target?.documentName || '').replace(/"/g, '""')}"`,
        log.request?.path || '',
        log.request?.statusCode || '',
        log.request?.duration || ''
      ].join(',')
    )

    const csv = [headers, ...rows].join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
    )
    res.send('\ufeff' + csv) // BOM for Excel
  } else {
    // JSON format
    res.json({
      success: true,
      data: logs
    })
  }
})

/**
 * Get recent activity (dashboard widget)
 */
export const getRecentActivity = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query

  const recentLogs = await AuditLog.find({
    action: { $ne: 'view' } // Exclude view actions
  })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .lean()

  res.json({
    success: true,
    data: recentLogs
  })
})
