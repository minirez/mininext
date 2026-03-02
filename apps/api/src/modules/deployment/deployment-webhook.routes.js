import express from 'express'
import crypto from 'crypto'
import PlatformSettings from '#modules/platform-settings/platformSettings.model.js'
import { processWebhook } from './deployment.service.js'
import logger from '#core/logger.js'

const router = express.Router()

/**
 * Verify GitHub webhook signature (HMAC-SHA256)
 */
function verifySignature(secret, payload, signature) {
  if (!secret || !signature) return false

  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

/**
 * POST /api/deployments/webhook/github
 * Receives GitHub workflow_run events
 * Uses raw body for signature verification
 */
router.post('/webhook/github', express.raw({ type: 'application/json' }), async (req, res) => {
  // Always return 200 to prevent GitHub retries
  try {
    const signature = req.headers['x-hub-signature-256']
    const event = req.headers['x-github-event']

    // Only process workflow_run events
    if (event !== 'workflow_run') {
      return res.json({ success: true, message: `Ignored event: ${event}` })
    }

    // Get webhook secret from settings
    const settings = await PlatformSettings.getSettings()
    const creds = settings.getGitHubCredentials()

    if (!creds.webhookSecret) {
      logger.warn('[Deployment Webhook] No webhook secret configured')
      return res.status(200).json({ success: false, message: 'Webhook secret not configured' })
    }

    // Verify signature
    const rawBody = req.body
    if (!verifySignature(creds.webhookSecret, rawBody, signature)) {
      logger.error('[Deployment Webhook] Invalid signature')
      return res.status(200).json({ success: false, message: 'Invalid signature' })
    }

    // Parse payload
    const payload = JSON.parse(rawBody.toString())

    // Process asynchronously (don't block response)
    processWebhook(payload).catch(err => {
      logger.error('[Deployment Webhook] Processing error:', err.message)
    })

    res.json({ success: true, message: 'Webhook received' })
  } catch (err) {
    logger.error('[Deployment Webhook] Error:', err.message)
    res.status(200).json({ success: false, message: 'Internal error' })
  }
})

export default router
