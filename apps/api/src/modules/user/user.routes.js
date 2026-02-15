import express from 'express'
import * as userService from './user.service.js'
import { protect, requireAdmin } from '#middleware/auth.js'
import { partnerContext } from '#middleware/partnerContext.js'
import { requirePermission } from '#middleware/permission.js'
import { validateBody, validateQuery, commonSchemas } from '#middleware/validation.js'

const router = express.Router()

// ============================================
// Public Routes (No Auth)
// ============================================

// Verify activation token
router.get('/activate/verify/:token', userService.verifyActivationToken)

// Activate account (set password)
router.post(
  '/activate/:token',
  validateBody({
    password: { type: 'string', required: true, minLength: 8, maxLength: 128 }
  }),
  userService.activateAccount
)

// ============================================
// Protected Routes
// ============================================

// All routes below require authentication
router.use(protect)
router.use(partnerContext)

// ============================================
// User CRUD (Admin or Users permission)
// ============================================

// Get all users
router.get(
  '/',
  requirePermission('users', 'view'),
  validateQuery(commonSchemas.pagination),
  userService.getUsers
)

// Get user by ID
router.get('/:id', requirePermission('users', 'view'), userService.getUser)

// Create user
router.post(
  '/',
  requirePermission('users', 'create'),
  validateBody({
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    email: { type: 'email', required: true },
    role: { type: 'string', required: true }
  }),
  userService.createUser
)

// Update user
router.put('/:id', requirePermission('users', 'edit'), userService.updateUser)

// Delete user
router.delete('/:id', requirePermission('users', 'delete'), userService.deleteUser)

// ============================================
// User Status Actions
// ============================================

// Activate user
router.post('/:id/activate', requirePermission('users', 'edit'), userService.activateUser)

// Deactivate user
router.post('/:id/deactivate', requirePermission('users', 'edit'), userService.deactivateUser)

// Force password reset
router.post(
  '/:id/force-password-reset',
  requirePermission('users', 'edit'),
  userService.forcePasswordReset
)

// ============================================
// Activation Routes
// ============================================

// Resend activation email
router.post(
  '/:id/resend-activation',
  requirePermission('users', 'edit'),
  userService.resendActivation
)

// ============================================
// Session Routes
// ============================================

// Get user sessions
router.get('/:id/sessions', requirePermission('users', 'view'), userService.getUserSessions)

// Terminate single session
router.delete(
  '/:id/sessions/:sessionId',
  requirePermission('users', 'edit'),
  userService.terminateUserSession
)

// Terminate all sessions
router.post(
  '/:id/sessions/terminate-all',
  requirePermission('users', 'edit'),
  userService.terminateAllUserSessions
)

// ============================================
// Permission Routes
// ============================================

// Get user permissions
router.get('/:id/permissions', requirePermission('users', 'view'), userService.getUserPermissions)

// Update user permissions
router.put(
  '/:id/permissions',
  requirePermission('users', 'edit'),
  userService.updateUserPermissions
)

// ============================================
// 2FA Routes
// ============================================

// Self 2FA management
router.post('/2fa/enable', userService.enable2FA)
router.post('/2fa/verify', userService.verify2FA)
router.post('/2fa/disable', userService.disable2FA)

// Admin reset 2FA for other users
router.post('/:id/2fa/reset', requireAdmin, userService.resetUser2FA)

// ============================================
// Password Routes
// ============================================

// Password change (admin or self)
router.post(
  '/:id/change-password',
  validateBody({
    newPassword: { type: 'string', required: true, minLength: 8, maxLength: 128 }
  }),
  userService.changePassword
)

export default router
