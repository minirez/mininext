import express from 'express'
import * as authService from './auth.service.js'
import { protect, requirePlatformAdmin } from '#middleware/auth.js'
import { strictLimiter, loginLimiter, tokenRefreshLimiter } from '#middleware/rateLimiter.js'
import { avatarUpload } from '#helpers/avatarUpload.js'

// Auth routes - handles authentication, profile, and avatar management

const router = express.Router()

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: User login
 *     description: Authenticate user and receive JWT tokens. Rate limited to 5 attempts per 15 minutes.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
// TODO: Rate limiters temporarily disabled for testing - RESTORE AFTER TESTING
router.post('/login', /* loginLimiter, strictLimiter, */ authService.login)

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Partner registration
 *     description: Register a new partner account. Account will be pending approval.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyName, name, email, phone, password]
 *             properties:
 *               companyName:
 *                 type: string
 *                 example: "Acme Travel Agency"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@acmetravel.com"
 *               phone:
 *                 type: string
 *                 example: "+905551234567"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Registration successful (pending approval)
 *       400:
 *         description: Email already exists or validation error
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/register', strictLimiter, authService.register)

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Get a new access token using refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh-token', tokenRefreshLimiter, authService.refreshToken)

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset
 *     description: Send password reset email. Always returns success to prevent email enumeration.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               accountType:
 *                 type: string
 *                 enum: [partner, agency, platform]
 *     responses:
 *       200:
 *         description: Reset email sent (if account exists)
 */
router.post('/forgot-password', strictLimiter, authService.forgotPassword)

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     description: Set new password using reset token from email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token from email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 12
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', strictLimiter, authService.resetPassword)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: User logout
 *     description: Invalidate current session
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout', protect, authService.logout)

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     description: Returns authenticated user's profile and permissions
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     account:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', protect, authService.me)

/**
 * @swagger
 * /api/auth/notification-preferences:
 *   put:
 *     tags: [Auth]
 *     summary: Update notification preferences
 *     description: Update email, SMS, and push notification settings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationPreferences:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: object
 *                     properties:
 *                       bookingConfirmation:
 *                         type: boolean
 *                       bookingCancellation:
 *                         type: boolean
 *                   sms:
 *                     type: object
 *                   push:
 *                     type: object
 *     responses:
 *       200:
 *         description: Preferences updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/notification-preferences', protect, authService.updateNotificationPreferences)

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     tags: [Auth]
 *     summary: Change password
 *     description: Change password for authenticated user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
 *       400:
 *         description: New password too short
 */
router.put('/change-password', protect, strictLimiter, authService.changePassword)

/**
 * @swagger
 * /api/auth/admin/unblock-account:
 *   post:
 *     tags: [Auth]
 *     summary: Unblock a locked/blocked account
 *     description: Remove login lockout for a user account. Platform admin only.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the account to unblock
 *     responses:
 *       200:
 *         description: Account unblocked successfully
 *       400:
 *         description: Email is required
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Platform admin access required
 */
router.post('/admin/unblock-account', protect, requirePlatformAdmin, authService.unblockLoginBlock)

/**
 * @swagger
 * /api/auth/my/admin-theme:
 *   put:
 *     tags: [Auth]
 *     summary: Update user's admin theme preference
 *     description: Update the authenticated user's personal admin panel theme preference. This overrides the partner's branding theme.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [theme]
 *             properties:
 *               theme:
 *                 type: string
 *                 description: Theme ID (e.g., midnight-blue, ocean, nord, graphite)
 *     responses:
 *       200:
 *         description: Theme preference updated successfully
 *       400:
 *         description: Invalid theme ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/my/admin-theme', protect, authService.updateMyAdminTheme)

/**
 * @swagger
 * /api/auth/avatar:
 *   post:
 *     tags: [Auth]
 *     summary: Upload user avatar
 *     description: Upload a profile picture for the authenticated user
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/avatar', protect, avatarUpload.single('avatar'), authService.uploadAvatar)

/**
 * @swagger
 * /api/auth/avatar:
 *   delete:
 *     tags: [Auth]
 *     summary: Delete user avatar
 *     description: Remove profile picture for the authenticated user
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/avatar', protect, authService.deleteAvatar)

export default router
