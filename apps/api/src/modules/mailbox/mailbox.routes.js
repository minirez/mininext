import { Router } from 'express'
import express from 'express'
import { asyncHandler } from '#helpers'
import { protect, requirePlatformAdmin } from '#middleware/auth.js'
import * as mailboxService from './mailbox.service.js'

const router = Router()

/**
 * SNS text/plain body parser middleware
 * AWS SNS sends notifications with Content-Type: text/plain
 * but the body is actually JSON, so we need to parse it
 */
const snsBodyParser = express.text({ type: ['text/plain', 'application/json'] })

/**
 * POST / — SNS Webhook (public, no auth)
 * Handles SNS subscription confirmation and email notifications
 */
router.post(
  '/',
  snsBodyParser,
  asyncHandler(async (req, res) => {
    // Parse text body if needed (SNS sends JSON as text/plain)
    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        // If not JSON, pass as-is
      }
    }
    const result = await mailboxService.handleWebhook(body)
    res.json({ success: true, data: result })
  })
)

// All routes below require platform admin authentication
router.use(protect, requirePlatformAdmin)

/**
 * GET / — List emails
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, starred, search, page, limit } = req.query
    const result = await mailboxService.list({
      status,
      starred,
      search,
      page,
      limit
    })
    res.json({ success: true, data: result })
  })
)

/**
 * GET /stats — Inbox stats
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const stats = await mailboxService.getStats()
    res.json({ success: true, data: stats })
  })
)

/**
 * GET /thread/:threadId — Get conversation thread
 */
router.get(
  '/thread/:threadId',
  asyncHandler(async (req, res) => {
    const emails = await mailboxService.getThread(req.params.threadId)
    res.json({ success: true, data: emails })
  })
)

/**
 * GET /:id — Get single email (marks as read)
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const email = await mailboxService.getEmail(req.params.id)
    res.json({ success: true, data: email })
  })
)

/**
 * POST /:id/reply — Reply to email
 */
router.post(
  '/:id/reply',
  asyncHandler(async (req, res) => {
    const { body, cc } = req.body
    const email = await mailboxService.reply(req.params.id, { body, cc }, req.user._id)
    res.json({ success: true, data: email })
  })
)

/**
 * POST /compose — Compose new email
 */
router.post(
  '/compose',
  asyncHandler(async (req, res) => {
    const { to, cc, subject, body } = req.body
    const email = await mailboxService.compose({ to, cc, subject, body }, req.user._id)
    res.json({ success: true, data: email })
  })
)

/**
 * PATCH /:id/read — Mark as read
 */
router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const email = await mailboxService.markAsRead(req.params.id)
    res.json({ success: true, data: email })
  })
)

/**
 * PATCH /:id/unread — Mark as unread
 */
router.patch(
  '/:id/unread',
  asyncHandler(async (req, res) => {
    const email = await mailboxService.markAsUnread(req.params.id)
    res.json({ success: true, data: email })
  })
)

/**
 * PATCH /:id/star — Toggle star
 */
router.patch(
  '/:id/star',
  asyncHandler(async (req, res) => {
    const email = await mailboxService.toggleStar(req.params.id)
    res.json({ success: true, data: email })
  })
)

/**
 * PATCH /:id/archive — Archive email
 */
router.patch(
  '/:id/archive',
  asyncHandler(async (req, res) => {
    const email = await mailboxService.archive(req.params.id)
    res.json({ success: true, data: email })
  })
)

/**
 * GET /:id/attachments/:index — Get attachment (redirect to S3 signed URL)
 */
router.get(
  '/:id/attachments/:index',
  asyncHandler(async (req, res) => {
    const result = await mailboxService.getAttachment(req.params.id, Number(req.params.index))
    res.redirect(result.url)
  })
)

export default router
