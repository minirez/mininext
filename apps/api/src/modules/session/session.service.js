import Session from './session.model.js'
import User from '../user/user.model.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'

/**
 * Session Service
 * Manages user sessions for security and tracking
 */
class SessionService {
  /**
   * Create a new session for a user
   */
  async createSession(userId, token, meta = {}) {
    return await Session.createFromToken(userId, token, meta)
  }

  /**
   * Find session by token
   */
  async findByToken(token) {
    return await Session.findByToken(token)
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId) {
    const sessions = await Session.getActiveSessions(userId)
    return sessions.map(s => ({
      _id: s._id,
      deviceType: s.deviceType,
      browser: s.browser,
      os: s.os,
      ipAddress: s.ipAddress,
      location: s.location,
      lastActivity: s.lastActivity,
      createdAt: s.createdAt,
      isCurrent: false // Will be set by caller
    }))
  }

  /**
   * Get current user's sessions (from request context)
   */
  async getMySessions(userId, currentToken) {
    const sessions = await this.getUserSessions(userId)
    const currentSession = await Session.findByToken(currentToken)

    return sessions.map(s => ({
      ...s,
      isCurrent: currentSession && s._id.toString() === currentSession._id.toString()
    }))
  }

  /**
   * Terminate a specific session
   */
  async terminateSession(sessionId, terminatedBy, reason = 'admin_action') {
    const session = await Session.findById(sessionId)
    if (!session) {
      throw new NotFoundError('SESSION_NOT_FOUND')
    }

    if (session.status !== 'active') {
      throw new BadRequestError('SESSION_ALREADY_TERMINATED')
    }

    return await session.terminate(terminatedBy, reason)
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateAllUserSessions(userId, terminatedBy, reason = 'admin_action') {
    return await Session.terminateAllForUser(userId, terminatedBy, reason)
  }

  /**
   * Terminate all sessions except current
   */
  async terminateOtherSessions(userId, currentToken, terminatedBy) {
    const currentSession = await Session.findByToken(currentToken)
    if (!currentSession) {
      throw new NotFoundError('CURRENT_SESSION_NOT_FOUND')
    }

    // Terminate all except current
    await Session.updateMany(
      {
        userId,
        status: 'active',
        _id: { $ne: currentSession._id }
      },
      {
        status: 'terminated',
        terminatedAt: new Date(),
        terminatedBy,
        terminationReason: 'admin_action'
      }
    )
  }

  /**
   * Update session activity
   */
  async touchSession(token) {
    const session = await Session.findByToken(token)
    if (session) {
      await session.touch()
    }
  }

  /**
   * Count active sessions for user
   */
  async countActiveSessions(userId) {
    return await Session.countActiveSessions(userId)
  }

  /**
   * Check if user has exceeded max concurrent sessions
   */
  async checkSessionLimit(userId, maxSessions) {
    if (!maxSessions || maxSessions <= 0) return true

    const count = await this.countActiveSessions(userId)
    return count < maxSessions
  }

  /**
   * Get all active sessions (admin only)
   */
  async getAllActiveSessions(accountType, accountId, options = {}) {
    const { page = 1, limit = 50 } = options

    // Get users for this account
    const users = await User.find({ accountType, accountId }).select('_id')
    const userIds = users.map(u => u._id)

    const query = {
      userId: { $in: userIds },
      status: 'active',
      expiresAt: { $gt: new Date() }
    }

    const [sessions, total] = await Promise.all([
      Session.find(query)
        .populate('userId', 'name email')
        .sort({ lastActivity: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Session.countDocuments(query)
    ])

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    // TTL index handles this automatically, but we can manually expire
    const result = await Session.updateMany(
      {
        status: 'active',
        expiresAt: { $lt: new Date() }
      },
      {
        status: 'expired'
      }
    )
    return result.modifiedCount
  }
}

export default new SessionService()
