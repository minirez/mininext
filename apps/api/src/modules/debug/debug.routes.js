/**
 * Debug Routes - Claude Code Access
 * Protected by API key for development/debugging purposes
 */

import express from 'express'
import Issue from '#modules/issue/issue.model.js'
import User from '#modules/user/user.model.js'

const router = express.Router()

// Debug API key middleware
const debugAuth = (req, res, next) => {
  const apiKey = req.headers['x-debug-key']
  const validKey = process.env.DEBUG_API_KEY

  if (!validKey) {
    return res.status(503).json({
      success: false,
      error: 'Debug endpoint not configured'
    })
  }

  if (apiKey !== validKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid debug key'
    })
  }

  next()
}

router.use(debugAuth)

/**
 * GET /debug/issues
 * Get all issues with full details for Claude Code
 */
router.get('/issues', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query

    const query = {}
    if (status) {
      query.status = status
    }

    const issues = await Issue.find(query)
      .populate('reporter', 'firstName lastName email')
      .populate('assignee', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean()

    // Format issues for easy reading
    const formatted = issues.map(issue => ({
      id: issue._id,
      issueNumber: issue.issueNumber,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      category: issue.category,
      reporter: issue.reporter
        ? `${issue.reporter.firstName} ${issue.reporter.lastName}`
        : 'Unknown',
      assignee: issue.assignee
        ? `${issue.assignee.firstName} ${issue.assignee.lastName}`
        : 'Unassigned',
      attachments: issue.attachments?.map(att => ({
        filename: att.filename,
        url: att.url?.startsWith('http') ? att.url : `https://app.maxirez.com${att.url}`,
        type: att.mimetype
      })),
      comments: issue.comments?.length || 0,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      isDeleted: issue.isDeleted || false
    }))

    res.json({
      success: true,
      count: formatted.length,
      issues: formatted
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /debug/issues/:id
 * Get single issue with all details including comments
 */
router.get('/issues/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reporter', 'firstName lastName email')
      .populate('assignee', 'firstName lastName email')
      .populate('comments.author', 'firstName lastName')
      .lean()

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      })
    }

    const formatted = {
      id: issue._id,
      issueNumber: issue.issueNumber,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      category: issue.category,
      reporter: issue.reporter
        ? `${issue.reporter.firstName} ${issue.reporter.lastName}`
        : 'Unknown',
      assignee: issue.assignee
        ? `${issue.assignee.firstName} ${issue.assignee.lastName}`
        : 'Unassigned',
      attachments: issue.attachments?.map(att => ({
        filename: att.filename,
        url: att.url?.startsWith('http') ? att.url : `https://app.maxirez.com${att.url}`,
        type: att.mimetype
      })),
      comments: issue.comments?.map(c => ({
        author: c.author ? `${c.author.firstName} ${c.author.lastName}` : 'Unknown',
        content: c.content,
        createdAt: c.createdAt
      })),
      activity: issue.activity?.slice(-10), // Last 10 activities
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt
    }

    res.json({
      success: true,
      issue: formatted
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /debug/stats
 * Get system stats
 */
router.get('/stats', async (req, res) => {
  try {
    const [issueStats, userCount] = await Promise.all([
      Issue.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      User.countDocuments({ isActive: true })
    ])

    res.json({
      success: true,
      stats: {
        issues: issueStats.reduce((acc, s) => {
          acc[s._id] = s.count
          return acc
        }, {}),
        totalUsers: userCount
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
