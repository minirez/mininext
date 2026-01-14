import mongoose from 'mongoose'
import Issue from './issue.model.js'
import User from '#modules/user/user.model.js'
import Notification from '#modules/notification/notification.model.js'
import { asyncHandler } from '#helpers'
import { NotFoundError, ForbiddenError, ValidationError } from '#core/errors.js'
import { getIssueFileUrl, deleteIssueFile, deleteIssueFolder } from '#helpers/issueUpload.js'
import { sendIssueNudgeEmail } from '#helpers/mail.js'
import logger from '#core/logger.js'
import { emitToUser } from '#core/socket.js'
import config from '#config'

// Helper to send in-app notification
const sendIssueNotification = async (userId, type, title, message, issueId) => {
  try {
    const notification = await Notification.create({
      recipient: userId,
      recipientModel: 'User',
      type: 'system:announcement', // Generic type for now
      title,
      message,
      icon: 'bug_report',
      color: 'purple',
      actionUrl: `/issues/${issueId}`,
      reference: {
        model: 'Issue',
        id: issueId
      }
    })

    // Send via socket
    emitToUser(userId, 'notification:new', { notification })
  } catch (error) {
    logger.error('Failed to send issue notification:', error.message)
  }
}

// Issue List
export const getIssues = asyncHandler(async (req, res) => {
  const {
    status,
    priority,
    category,
    assignee,
    reporter,
    label,
    search,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = req.query

  const query = {}

  // Filters
  if (status) query.status = status
  if (priority) query.priority = priority
  if (category) query.category = category
  if (assignee) query.assignee = assignee
  if (reporter) query.reporter = reporter
  if (label) query.labels = label

  // Date range
  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = new Date(startDate)
    if (endDate) query.createdAt.$lte = new Date(endDate)
  }

  // Search
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { issueNumber: { $regex: search, $options: 'i' } }
    ]
  }

  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

  const [issues, total] = await Promise.all([
    Issue.find(query)
      .populate('reporter', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .select('-activity')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Issue.countDocuments(query)
  ])

  // Add counts for each issue
  const issuesWithCounts = issues.map(issue => ({
    ...issue,
    commentCount: issue.comments?.length || 0,
    attachmentCount: issue.attachments?.length || 0
  }))

  res.json({
    success: true,
    data: {
      issues: issuesWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

// Get Single Issue
export const getIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id)
    .populate('reporter', 'name email avatar')
    .populate('assignee', 'name email avatar')
    .populate('watchers', 'name email avatar')
    .populate('comments.author', 'name email avatar')
    .populate('activity.user', 'name email avatar')
    .populate('relatedIssues', 'issueNumber title status priority')

  if (!issue) {
    throw new NotFoundError('ISSUE_NOT_FOUND')
  }

  res.json({ success: true, data: issue })
})

// Create Issue
export const createIssue = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    priority,
    category,
    labels,
    assignee,
    dueDate,
    metadata
  } = req.body

  const issueNumber = await Issue.getNextIssueNumber()

  const issue = await Issue.create({
    issueNumber,
    title,
    description,
    priority: priority || 'medium',
    category: category || 'other',
    labels: labels || [],
    reporter: req.user._id,
    assignee,
    dueDate,
    metadata,
    watchers: [req.user._id], // Reporter is automatic watcher
    activity: [{
      action: 'created',
      user: req.user._id
    }]
  })

  // Notify assignee
  if (assignee && assignee !== req.user._id.toString()) {
    await sendIssueNotification(
      assignee,
      'issue_assigned',
      'Yeni Issue Atandı',
      `${issue.issueNumber}: ${title}`,
      issue._id
    )
  }

  await issue.populate('reporter', 'name email avatar')
  await issue.populate('assignee', 'name email avatar')

  res.status(201).json({
    success: true,
    data: issue
  })
})

// Update Issue
export const updateIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id)

  if (!issue) {
    throw new NotFoundError('ISSUE_NOT_FOUND')
  }

  const {
    title,
    description,
    priority,
    category,
    labels,
    dueDate
  } = req.body

  const changes = []

  // Track changes
  if (title && title !== issue.title) {
    changes.push({ field: 'title', from: issue.title, to: title })
    issue.title = title
  }
  if (description && description !== issue.description) {
    changes.push({ field: 'description' })
    issue.description = description
  }
  if (priority && priority !== issue.priority) {
    issue.addActivity('priority_changed', req.user._id, {
      from: issue.priority,
      to: priority
    })
    issue.priority = priority
  }
  if (category && category !== issue.category) {
    changes.push({ field: 'category', from: issue.category, to: category })
    issue.category = category
  }
  if (labels) {
    issue.labels = labels
  }
  if (dueDate !== undefined) {
    if (dueDate && !issue.dueDate) {
      issue.addActivity('due_date_set', req.user._id, { to: dueDate })
    } else if (!dueDate && issue.dueDate) {
      issue.addActivity('due_date_removed', req.user._id, { from: issue.dueDate })
    }
    issue.dueDate = dueDate || null
  }

  if (changes.length > 0) {
    issue.addActivity('updated', req.user._id, { changes })
  }

  await issue.save()
  await issue.populate('reporter', 'name email avatar')
  await issue.populate('assignee', 'name email avatar')

  res.json({ success: true, data: issue })
})

// Change Status
export const changeStatus = asyncHandler(async (req, res) => {
  const { status, comment } = req.body
  const issue = await Issue.findById(req.params.id)

  if (!issue) {
    throw new NotFoundError('ISSUE_NOT_FOUND')
  }

  const validTransitions = {
    open: ['in_progress', 'resolved', 'closed'],
    in_progress: ['open', 'resolved', 'closed'],
    resolved: ['closed', 'reopened'],
    closed: ['reopened'],
    reopened: ['in_progress', 'resolved', 'closed']
  }

  if (!validTransitions[issue.status]?.includes(status)) {
    throw new ValidationError('INVALID_STATUS_TRANSITION')
  }

  const oldStatus = issue.status
  issue.status = status

  // Update dates
  if (status === 'resolved') {
    issue.resolvedAt = new Date()
  } else if (status === 'closed') {
    issue.closedAt = new Date()
  } else if (status === 'reopened') {
    issue.resolvedAt = null
    issue.closedAt = null
  }

  // Add activity
  issue.addActivity('status_changed', req.user._id, {
    from: oldStatus,
    to: status,
    comment
  })

  await issue.save()

  // Notify watchers
  const notifyUsers = issue.watchers.filter(w => w.toString() !== req.user._id.toString())
  for (const userId of notifyUsers) {
    await sendIssueNotification(
      userId,
      'issue_status_changed',
      `Issue Durumu Değişti: ${issue.issueNumber}`,
      `${oldStatus} → ${status}`,
      issue._id
    )
  }

  await issue.populate('reporter', 'name email avatar')
  await issue.populate('assignee', 'name email avatar')

  res.json({ success: true, data: issue })
})

// Assign Issue
export const assignIssue = asyncHandler(async (req, res) => {
  const { assignee } = req.body
  const issue = await Issue.findById(req.params.id)

  if (!issue) {
    throw new NotFoundError('ISSUE_NOT_FOUND')
  }

  const oldAssignee = issue.assignee

  if (assignee) {
    // Check user
    const user = await User.findById(assignee)
    if (!user || user.accountType !== 'platform') {
      throw new ValidationError('INVALID_ASSIGNEE')
    }

    issue.assignee = assignee
    issue.addActivity('assigned', req.user._id, { to: assignee })

    // Add new assignee to watchers
    if (!issue.watchers.some(w => w.toString() === assignee)) {
      issue.watchers.push(assignee)
    }

    // Notify
    if (assignee !== req.user._id.toString()) {
      await sendIssueNotification(
        assignee,
        'issue_assigned',
        'Issue Atandı',
        `${issue.issueNumber}: ${issue.title}`,
        issue._id
      )
    }
  } else {
    issue.assignee = null
    issue.addActivity('unassigned', req.user._id, { from: oldAssignee })
  }

  await issue.save()
  await issue.populate('assignee', 'name email avatar')

  res.json({ success: true, data: issue })
})

// Add Comment
export const addComment = asyncHandler(async (req, res) => {
  const { content, mentions } = req.body
  const issue = await Issue.findById(req.params.id)

  if (!issue) {
    throw new NotFoundError('ISSUE_NOT_FOUND')
  }

  const comment = {
    content,
    author: req.user._id,
    mentions: mentions || [],
    attachments: []
  }

  issue.comments.push(comment)
  issue.addActivity('comment_added', req.user._id)

  await issue.save()

  // Notify mentioned users
  if (mentions?.length > 0) {
    for (const userId of mentions) {
      if (userId !== req.user._id.toString()) {
        await sendIssueNotification(
          userId,
          'issue_mentioned',
          'Issue\'da Bahsedildiniz',
          `${issue.issueNumber}: ${issue.title}`,
          issue._id
        )
      }
    }
  }

  // Notify watchers
  const notifyUsers = issue.watchers.filter(
    w => w.toString() !== req.user._id.toString() && !mentions?.includes(w.toString())
  )
  for (const userId of notifyUsers) {
    await sendIssueNotification(
      userId,
      'issue_comment',
      `Yeni Yorum: ${issue.issueNumber}`,
      content.substring(0, 100),
      issue._id
    )
  }

  await issue.populate('comments.author', 'name email avatar')

  const newComment = issue.comments[issue.comments.length - 1]

  res.status(201).json({ success: true, data: newComment })
})

// Update Comment
export const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body
  const issue = await Issue.findById(req.params.id)

  if (!issue) {
    throw new NotFoundError('ISSUE_NOT_FOUND')
  }

  const comment = issue.comments.id(req.params.commentId)

  if (!comment) {
    throw new NotFoundError('COMMENT_NOT_FOUND')
  }

  // Only author can edit
  if (comment.author.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('NOT_COMMENT_AUTHOR')
  }

  comment.content = content
  comment.isEdited = true
  comment.editedAt = new Date()

  issue.addActivity('comment_edited', req.user._id)

  await issue.save()
  await issue.populate('comments.author', 'name email avatar')

  res.json({ success: true, data: comment })
})

// Delete Comment
export const deleteComment = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id)

  if (!issue) {
    throw new NotFoundError('ISSUE_NOT_FOUND')
  }

  const comment = issue.comments.id(req.params.commentId)

  if (!comment) {
    throw new NotFoundError('COMMENT_NOT_FOUND')
  }

  // Only author or admin can delete
  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ForbiddenError('NOT_AUTHORIZED')
  }

  comment.deleteOne()
  issue.addActivity('comment_deleted', req.user._id)

  await issue.save()

  res.json({ success: true, message: 'Comment deleted' })
})

// Upload Attachment
export const uploadAttachment = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id)

  if (!issue) {
    throw new NotFoundError('ISSUE_NOT_FOUND')
  }

  if (!req.file) {
    throw new ValidationError('NO_FILE_UPLOADED')
  }

  const fileUrl = getIssueFileUrl(issue._id, req.file.filename)

  const attachment = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: fileUrl,
    uploadedBy: req.user._id,
    uploadedAt: new Date()
  }

  issue.attachments.push(attachment)
  issue.addActivity('attachment_added', req.user._id, {
    filename: req.file.originalname
  })

  await issue.save()

  res.status(201).json({ success: true, data: attachment })
})

// Delete Attachment
export const deleteAttachment = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id)

  if (!issue) {
    throw new NotFoundError('ISSUE_NOT_FOUND')
  }

  const attachment = issue.attachments.id(req.params.attachmentId)

  if (!attachment) {
    throw new NotFoundError('ATTACHMENT_NOT_FOUND')
  }

  // Delete from disk
  try {
    deleteIssueFile(issue._id, attachment.filename)
  } catch (err) {
    logger.warn(`Failed to delete attachment file: ${err.message}`)
  }

  issue.addActivity('attachment_removed', req.user._id, {
    filename: attachment.originalName
  })

  attachment.deleteOne()
  await issue.save()

  res.json({ success: true, message: 'Attachment deleted' })
})

// Toggle Watcher
export const toggleWatcher = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id)

  if (!issue) {
    throw new NotFoundError('ISSUE_NOT_FOUND')
  }

  const userId = req.body.userId || req.user._id

  const watcherIndex = issue.watchers.findIndex(w => w.toString() === userId.toString())

  if (watcherIndex > -1) {
    issue.watchers.splice(watcherIndex, 1)
    issue.addActivity('watcher_removed', req.user._id, { userId })
  } else {
    issue.watchers.push(userId)
    issue.addActivity('watcher_added', req.user._id, { userId })
  }

  await issue.save()

  res.json({
    success: true,
    data: { isWatching: watcherIndex === -1 }
  })
})

// Get Statistics
export const getStats = asyncHandler(async (req, res) => {
  const [
    statusStats,
    priorityStats,
    categoryStats,
    recentActivity,
    topReporters,
    avgResolutionTime
  ] = await Promise.all([
    // Status distribution
    Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    // Priority distribution
    Issue.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]),

    // Category distribution
    Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]),

    // Last 7 days activity
    Issue.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Top reporters
    Issue.aggregate([
      { $group: { _id: '$reporter', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          count: 1,
          'user.name': 1,
          'user.email': 1,
          'user.avatar': 1
        }
      }
    ]),

    // Average resolution time
    Issue.aggregate([
      { $match: { resolvedAt: { $exists: true, $ne: null } } },
      {
        $project: {
          resolutionTime: { $subtract: ['$resolvedAt', '$createdAt'] }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$resolutionTime' }
        }
      }
    ])
  ])

  const totalIssues = await Issue.countDocuments()
  const openIssues = await Issue.countDocuments({ status: { $in: ['open', 'in_progress', 'reopened'] } })
  const myAssigned = await Issue.countDocuments({ assignee: req.user._id, status: { $nin: ['closed', 'resolved'] } })
  const criticalOpen = await Issue.countDocuments({ priority: 'critical', status: { $in: ['open', 'in_progress', 'reopened'] } })

  res.json({
    success: true,
    data: {
      total: totalIssues,
      open: openIssues,
      myAssigned,
      criticalOpen,
      byStatus: statusStats,
      byPriority: priorityStats,
      byCategory: categoryStats,
      recentActivity,
      topReporters,
      avgResolutionTime: avgResolutionTime[0]?.avgTime || 0
    }
  })
})

// Delete Issue
export const deleteIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id)

  if (!issue) {
    throw new NotFoundError('ISSUE_NOT_FOUND')
  }

  // Only admin can delete
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('ADMIN_ONLY')
  }

  // Delete all attachments from disk
  try {
    deleteIssueFolder(issue._id)
  } catch (err) {
    logger.warn(`Failed to delete issue folder: ${err.message}`)
  }

  await issue.deleteOne()

  res.json({ success: true, message: 'Issue deleted' })
})

// Get Platform Users (for assignee selection)
export const getPlatformUsers = asyncHandler(async (req, res) => {
  const users = await User.find({
    accountType: 'platform',
    status: 'active'
  }).select('name email avatar role').lean()

  res.json({ success: true, data: users })
})

// Nudge Issue - Send reminder to assignee/watchers
export const nudgeIssue = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { recipients, message, channels = ['notification'] } = req.body
  // recipients: 'assignee' | 'watchers' | 'all' | array of userIds
  // channels: ['notification', 'email']

  const issue = await Issue.findById(id)
    .populate('assignee', 'name email preferredLanguage')
    .populate('watchers', 'name email preferredLanguage')

  if (!issue) {
    throw new NotFoundError('ISSUE_NOT_FOUND')
  }

  // Determine target users
  let targetUsers = []

  if (recipients === 'assignee' && issue.assignee) {
    targetUsers = [issue.assignee]
  } else if (recipients === 'watchers') {
    targetUsers = issue.watchers || []
  } else if (recipients === 'all') {
    const allUsers = [issue.assignee, ...(issue.watchers || [])].filter(Boolean)
    // Remove duplicates
    const userMap = new Map()
    allUsers.forEach(u => userMap.set(u._id.toString(), u))
    targetUsers = Array.from(userMap.values())
  } else if (Array.isArray(recipients)) {
    targetUsers = await User.find({ _id: { $in: recipients } }).select('name email preferredLanguage')
  }

  // Check if there are any recipients before filtering
  const totalRecipientsBefore = targetUsers.length

  // Remove the sender from recipients (can't nudge yourself)
  targetUsers = targetUsers.filter(u => u._id.toString() !== req.user._id.toString())

  if (targetUsers.length === 0) {
    // If there were recipients but all were filtered out, it means user tried to nudge themselves
    if (totalRecipientsBefore > 0) {
      throw new ValidationError('CANNOT_NUDGE_SELF')
    }
    throw new ValidationError('NO_RECIPIENTS')
  }

  const issueUrl = `${config.adminUrl}/issues/${issue._id}`
  let notificationsSent = 0
  let emailsSent = 0

  // Send notifications
  for (const user of targetUsers) {
    // In-app notification
    if (channels.includes('notification')) {
      await sendIssueNotification(
        user._id,
        'issue_nudge',
        `[${issue.issueNumber}] Hatırlatma`,
        message || `${req.user.name} bu talep hakkında sizi bilgilendirdi.`,
        issue._id
      )
      notificationsSent++
    }

    // Email notification
    if (channels.includes('email') && user.email) {
      try {
        await sendIssueNudgeEmail({
          to: user.email,
          recipientName: user.name,
          senderName: req.user.name,
          issueNumber: issue.issueNumber,
          issueTitle: issue.title,
          issueUrl,
          message,
          language: user.preferredLanguage || 'tr'
        })
        emailsSent++
      } catch (err) {
        logger.error(`Failed to send nudge email to ${user.email}:`, err.message)
      }
    }
  }

  // Add activity log
  issue.addActivity('nudge_sent', req.user._id, {
    recipients: targetUsers.length,
    channels,
    message: message ? message.substring(0, 100) : null
  })
  await issue.save()

  res.json({
    success: true,
    data: {
      recipientsCount: targetUsers.length,
      notificationsSent,
      emailsSent
    }
  })
})
