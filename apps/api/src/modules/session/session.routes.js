import express from 'express'
import sessionService from './session.service.js'
import { protect } from '#middleware/auth.js'
import { asyncHandler } from '#helpers'
import { ForbiddenError } from '#core/errors.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

/**
 * @route   GET /sessions/my-sessions
 * @desc    Get current user's active sessions
 * @access  Private
 */
router.get('/my-sessions', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const sessions = await sessionService.getMySessions(req.user._id, token)

  res.json({
    success: true,
    data: sessions
  })
}))

/**
 * @route   DELETE /sessions/my-sessions/:sessionId
 * @desc    Terminate one of current user's sessions
 * @access  Private
 */
router.delete('/my-sessions/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params

  await sessionService.terminateSession(sessionId, req.user._id, 'logout')

  res.json({
    success: true,
    message: 'SESSION_TERMINATED'
  })
}))

/**
 * @route   POST /sessions/my-sessions/terminate-others
 * @desc    Terminate all sessions except current
 * @access  Private
 */
router.post('/my-sessions/terminate-others', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')

  await sessionService.terminateOtherSessions(req.user._id, token, req.user._id)

  res.json({
    success: true,
    message: 'OTHER_SESSIONS_TERMINATED'
  })
}))

/**
 * @route   GET /sessions
 * @desc    Get all active sessions (admin only)
 * @access  Private (Admin)
 */
router.get('/', asyncHandler(async (req, res) => {
  // Only admins can view all sessions
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('UNAUTHORIZED')
  }

  const { page, limit } = req.query

  const result = await sessionService.getAllActiveSessions(
    req.user.accountType,
    req.user.accountId,
    {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50
    }
  )

  res.json({
    success: true,
    data: result
  })
}))

export default router
