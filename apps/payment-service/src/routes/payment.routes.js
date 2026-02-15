/**
 * Payment Routes
 * Auth handled at server level via apiKeyAuth + gatewayAuth
 * Note: /form and /callback routes are mounted separately as public routes
 */

import { Router } from 'express'
import https from 'https'
import PaymentService from '../services/PaymentService.js'
import { VirtualPos } from '../models/index.js'
import config from '../config/index.js'

// HTTPS agent for self-signed certificates in development
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production'
})

const router = Router()

/**
 * POST /bin
 * Query BIN and get installment options
 */
router.post('/bin', async (req, res) => {
  try {
    const { bin, amount, currency, partnerId, noFallback } = req.body

    if (!bin || !amount || !currency) {
      return res.status(400).json({
        status: false,
        error: 'bin, amount ve currency gerekli'
      })
    }

    // partnerId can be null for platform-level POS selection
    const result = await PaymentService.queryBin(
      partnerId || null,
      bin,
      parseFloat(amount),
      currency.toLowerCase(),
      { noFallback: noFallback || false }
    )

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ status: false, error: error.message })
  }
})

/**
 * POST /pay
 * Start payment
 */
router.post('/pay', async (req, res) => {
  try {
    const {
      posId,
      amount,
      currency,
      installment,
      card,
      customer,
      externalId,
      partnerId,
      noFallback
    } = req.body

    // Validate required fields
    if (!amount || !currency || !card) {
      return res.status(400).json({
        status: false,
        error: 'amount, currency ve card gerekli'
      })
    }

    if (!card.holder || !card.number || !card.expiry || !card.cvv) {
      return res.status(400).json({
        status: false,
        error: 'Kart bilgileri eksik (holder, number, expiry, cvv)'
      })
    }

    // Find POS if not specified
    let targetPosId = posId
    if (!targetPosId) {
      // Use BIN query to find suitable POS (partnerId can be null for platform-level)
      const binResult = await PaymentService.queryBin(
        partnerId || null,
        card.number.slice(0, 8),
        parseFloat(amount),
        currency.toLowerCase(),
        { noFallback: noFallback || false }
      )

      if (!binResult.success) {
        return res.status(400).json(binResult)
      }

      targetPosId = binResult.pos.id
    }

    // Ensure customer IP is set (trust proxy enabled - req.ip returns real client IP)
    const customerData = customer || {}
    if (!customerData.ip) {
      customerData.ip = req.ip
    }

    const result = await PaymentService.createPayment({
      posId: targetPosId,
      amount: parseFloat(amount),
      currency: currency.toLowerCase(),
      installment: parseInt(installment) || 1,
      card: {
        holder: card.holder,
        number: card.number.replace(/\s/g, ''),
        expiry: card.expiry,
        cvv: card.cvv
      },
      customer: customerData,
      externalId,
      partnerId: partnerId || null
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({ status: false, error: error.message })
  }
})

/**
 * GET /:id
 * Get payment status
 */
router.get('/:id', async (req, res) => {
  try {
    const status = await PaymentService.getTransactionStatus(req.params.id)

    if (!status) {
      return res.status(404).json({
        status: false,
        error: 'Transaction not found'
      })
    }

    res.json({ status: true, transaction: status })
  } catch (error) {
    res.status(500).json({ status: false, error: error.message })
  }
})

/**
 * POST /refund
 * Refund a completed payment
 */
router.post('/refund', async (req, res) => {
  try {
    const { transactionId } = req.body

    if (!transactionId) {
      return res.status(400).json({
        status: false,
        error: 'transactionId gerekli'
      })
    }

    const result = await PaymentService.refundPayment(transactionId)
    res.json({ status: true, ...result })
  } catch (error) {
    res.status(400).json({ status: false, error: error.message })
  }
})

/**
 * POST /cancel
 * Cancel a payment (same day only)
 */
router.post('/cancel', async (req, res) => {
  try {
    const { transactionId } = req.body

    if (!transactionId) {
      return res.status(400).json({
        status: false,
        error: 'transactionId gerekli'
      })
    }

    const result = await PaymentService.cancelPayment(transactionId)
    res.json({ status: true, ...result })
  } catch (error) {
    res.status(400).json({ status: false, error: error.message })
  }
})

/**
 * GET /status/:id
 * Query bank for transaction status
 */
router.get('/status/:id', async (req, res) => {
  try {
    const result = await PaymentService.queryBankStatus(req.params.id)
    res.json({ status: true, ...result })
  } catch (error) {
    res.status(400).json({ status: false, error: error.message })
  }
})

/**
 * POST /pre-auth
 * Create pre-authorization (block amount without capture)
 */
router.post('/pre-auth', async (req, res) => {
  try {
    const { posId, amount, currency, installment, card, customer, externalId } = req.body

    if (!posId || !amount || !currency || !card) {
      return res.status(400).json({
        status: false,
        error: 'posId, amount, currency ve card gerekli'
      })
    }

    if (!card.holder || !card.number || !card.expiry || !card.cvv) {
      return res.status(400).json({
        status: false,
        error: 'Kart bilgileri eksik (holder, number, expiry, cvv)'
      })
    }

    const result = await PaymentService.createPreAuth({
      posId,
      amount: parseFloat(amount),
      currency: currency.toLowerCase(),
      installment: parseInt(installment) || 1,
      card: {
        holder: card.holder,
        number: card.number.replace(/\s/g, ''),
        expiry: card.expiry,
        cvv: card.cvv
      },
      customer: customer || {},
      externalId
    })

    res.json({ status: true, ...result })
  } catch (error) {
    res.status(400).json({ status: false, error: error.message })
  }
})

/**
 * POST /post-auth
 * Capture pre-authorized amount
 */
router.post('/post-auth', async (req, res) => {
  try {
    const { transactionId } = req.body

    if (!transactionId) {
      return res.status(400).json({
        status: false,
        error: 'transactionId gerekli'
      })
    }

    const result = await PaymentService.createPostAuth(transactionId)
    res.json({ status: true, ...result })
  } catch (error) {
    res.status(400).json({ status: false, error: error.message })
  }
})

/**
 * GET /capabilities/:posId
 * Get POS capabilities
 */
router.get('/capabilities/:posId', async (req, res) => {
  try {
    const result = await PaymentService.getPosCapabilities(req.params.posId)
    res.json({ status: true, ...result })
  } catch (error) {
    res.status(400).json({ status: false, error: error.message })
  }
})

export default router

// ============================================================================
// PUBLIC ROUTES (no auth required - called by browser/bank)
// These are exported separately and mounted at root level
// ============================================================================

export const publicPaymentRoutes = Router()

/**
 * GET /payment/:id/form
 * Get 3D form HTML (for redirect)
 * No auth - called by browser
 */
publicPaymentRoutes.get('/:id/form', async (req, res) => {
  try {
    const html = await PaymentService.getPaymentForm(req.params.id)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (error) {
    res.status(400).send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `)
  }
})

/**
 * OPTIONS /payment/:id/callback
 * CORS preflight for callback
 */
publicPaymentRoutes.options('/:id/callback', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.status(200).end()
})

/**
 * POST /payment/:id/callback
 * 3D callback from bank
 * No auth - called by bank
 */
publicPaymentRoutes.post('/:id/callback', async (req, res) => {
  // Allow all origins for callback (bank redirects here)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  try {
    const result = await PaymentService.processCallback(req.params.id, req.body)

    // Notify main API for ALL transactions (not just payment links)
    try {
      const { Transaction } = await import('../models/index.js')
      const transaction = await Transaction.findById(req.params.id).populate('pos')

      // Calculate commission for successful payment
      if (result.success && transaction && transaction.pos) {
        let partnerId = transaction.partnerId

        // Calculate commission
        await PaymentService.calculateTransactionCommission(transaction, transaction.pos, partnerId)
      }

      const txDetails = await PaymentService.getTransactionDetails(req.params.id)
      const mainApiUrl = process.env.MAIN_API_URL || 'http://localhost:4000/api'
      const axios = (await import('axios')).default

      if (txDetails && transaction?.externalId) {
        // Payment Link transactions (PL-{token})
        if (transaction.externalId.startsWith('PL-')) {
          const token = transaction.externalId.replace('PL-', '')
          console.log('[Payment Callback] Payment link detected, notifying main API:', token)

          await axios.post(`${mainApiUrl}/pay/${token}/complete`, txDetails, { httpsAgent })
          console.log('[Payment Callback] Payment link webhook sent successfully')
        }
        // Subscription payments (externalId = subscription-{partnerId}-{purchaseId})
        else if (transaction.externalId.startsWith('subscription-')) {
          console.log('[Payment Callback] Subscription payment detected, notifying main API')
          console.log('[Payment Callback] externalId:', transaction.externalId)

          const webhookKey = process.env.PAYMENT_WEBHOOK_KEY || 'payment-webhook-secret'
          await axios.post(
            `${mainApiUrl}/my/subscription/payment-callback`,
            {
              transactionId: transaction._id,
              externalId: transaction.externalId,
              success: result.success,
              message: result.message || (result.success ? 'Payment successful' : 'Payment failed')
            },
            {
              headers: { 'X-Api-Key': webhookKey },
              httpsAgent
            }
          )
          console.log('[Payment Callback] Subscription payment webhook sent successfully')
        }
        // Regular booking payments (externalId = payment._id)
        else {
          console.log('[Payment Callback] Booking payment detected, notifying main API')
          console.log('[Payment Callback] externalId:', transaction.externalId)

          const webhookKey = process.env.PAYMENT_WEBHOOK_KEY || 'payment-webhook-secret'
          await axios.post(
            `${mainApiUrl}/bookings/payment-webhook`,
            {
              transactionId: transaction._id,
              externalId: transaction.externalId,
              success: result.success,
              authCode: txDetails.authCode,
              refNumber: txDetails.refNumber,
              provisionNumber: txDetails.provisionNumber,
              maskedCard: txDetails.maskedCard,
              lastFour: txDetails.lastFour,
              brand: txDetails.brand,
              cardType: txDetails.cardType,
              cardFamily: txDetails.cardFamily,
              cardBank: txDetails.cardBank,
              installment: txDetails.installment,
              amount: transaction.amount,
              error: result.success ? null : result.message || 'Payment failed'
            },
            {
              headers: { 'X-Api-Key': webhookKey },
              httpsAgent
            }
          )
          console.log('[Payment Callback] Booking payment webhook sent successfully')
        }
      }
    } catch (notifyError) {
      console.error('[Payment Callback] Failed to notify main API:', notifyError.message)
      // Don't throw - we still want to show result to user
    }

    // Return HTML result page
    const statusClass = result.success ? 'success' : 'error'
    const statusText = result.success ? 'Payment Successful' : 'Payment Failed'
    const message = result.message || ''

    // Get frontend URL from config
    const frontendUrl = config.frontendUrl

    res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${statusText}</title>
  <style>
    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
    .result { text-align: center; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; }
    .success { color: #27ae60; }
    .error { color: #e74c3c; }
    .icon { font-size: 60px; margin-bottom: 20px; }
    h1 { margin: 0 0 10px; }
    p { color: #666; margin: 0; }
  </style>
</head>
<body>
  <div class="result">
    <div class="icon ${statusClass}">${result.success ? '✓' : '✗'}</div>
    <h1 class="${statusClass}">${statusText}</h1>
    <p>${message}</p>
    <p id="status">Yönlendiriliyor...</p>
  </div>
  <script>
    var result = ${JSON.stringify(result)};
    var sent = false;

    function sendToParent() {
      if (sent) return;
      try {
        // Try multiple methods to reach parent
        if (window.top !== window) {
          window.top.postMessage({ type: 'payment_result', data: result }, '*');
          sent = true;
        } else if (window.parent !== window) {
          window.parent.postMessage({ type: 'payment_result', data: result }, '*');
          sent = true;
        } else if (window.opener) {
          window.opener.postMessage({ type: 'payment_result', data: result }, '*');
          sent = true;
        }
      } catch(e) {
        console.error('postMessage error:', e);
      }
    }

    // Try immediately
    sendToParent();

    // Retry a few times
    setTimeout(sendToParent, 100);
    setTimeout(sendToParent, 500);
    setTimeout(sendToParent, 1000);

    // Fallback: redirect to frontend with result after 3 seconds
    setTimeout(function() {
      if (!sent) {
        var redirectUrl = '${frontendUrl}/payment/result?success=' + result.success + '&message=' + encodeURIComponent(result.message || '');
        window.location.href = redirectUrl;
      }
    }, 3000);
  </script>
</body>
</html>
    `)
  } catch (error) {
    res.status(400).send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Processing Error</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `)
  }
})
