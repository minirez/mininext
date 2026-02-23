/**
 * Payment Link Routes
 * Public customer-facing payment page for payment links
 */

import { Router } from 'express'
import axios from 'axios'
import https from 'https'
import PaymentService from '../services/PaymentService.js'

const router = Router()

// API Base URL (main Maxirez API)
const API_BASE_URL = process.env.MAIN_API_URL || 'http://localhost:4000/api'

// HTTPS agent for self-signed certificates in development
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production'
})

/**
 * GET /pay-link/:token
 * Show payment page to customer
 */
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params

    // Fetch payment link from main API
    const response = await axios.get(`${API_BASE_URL}/pay/${token}`, { httpsAgent })
    const paymentLink = response.data.data

    // Check status
    if (['cancelled', 'expired', 'paid'].includes(paymentLink.status)) {
      return res.send(renderStatusPage(paymentLink))
    }

    // Render payment form
    res.send(renderPaymentForm(paymentLink, token))
  } catch (error) {
    console.error('Payment link fetch error:', error.message)
    res.status(404).send(renderErrorPage('Ödeme linki bulunamadı veya geçersiz.'))
  }
})

/**
 * POST /pay-link/:token/bin
 * BIN query for payment link
 */
router.post('/:token/bin', async (req, res) => {
  try {
    const { token } = req.params
    const { bin } = req.body

    if (!bin || bin.length < 6) {
      return res.status(400).json({
        status: false,
        error: 'Geçersiz BIN numarası'
      })
    }

    // Fetch payment link to get amount and currency
    const linkResponse = await axios.get(`${API_BASE_URL}/pay/${token}`, { httpsAgent })
    const paymentLink = linkResponse.data.data

    if (['cancelled', 'expired', 'paid'].includes(paymentLink.status)) {
      return res.status(400).json({
        status: false,
        error: 'Bu ödeme linki artık kullanılamaz'
      })
    }

    // Query BIN using PaymentService (platform-level, no partnerId needed for now)
    const result = await PaymentService.queryBin(
      null, // partnerId - will use platform POS
      bin,
      paymentLink.amount,
      paymentLink.currency.toLowerCase()
    )

    if (!result.success) {
      return res.status(400).json(result)
    }

    // Filter installments based on payment link max count
    let installments = result.installments || []
    if (paymentLink.installment?.enabled && paymentLink.installment?.maxCount) {
      installments = installments.filter(i => i.count <= paymentLink.installment.maxCount)
    } else if (!paymentLink.installment?.enabled) {
      installments = installments.filter(i => i.count === 1)
    }

    // Apply interest rates if set (rates is a Map: { 2: 1.5, 3: 2, ... })
    const rates = paymentLink.installment?.rates || {}
    const hasRates = Object.keys(rates).length > 0

    if (hasRates) {
      installments = installments.map(inst => {
        if (inst.count === 1) {
          // No interest for single payment
          return {
            ...inst,
            totalAmount: paymentLink.amount,
            monthlyAmount: paymentLink.amount,
            interestAmount: 0,
            interestRate: 0
          }
        }
        // Get rate for this installment count
        const rate = rates[inst.count] || rates[String(inst.count)] || 0
        if (rate <= 0) {
          return {
            ...inst,
            totalAmount: paymentLink.amount,
            monthlyAmount: Math.round((paymentLink.amount / inst.count) * 100) / 100,
            interestAmount: 0,
            interestRate: 0
          }
        }
        // Calculate interest: amount * rate/100 * installmentCount
        const totalInterest = paymentLink.amount * (rate / 100) * inst.count
        const totalAmount = paymentLink.amount + totalInterest
        return {
          ...inst,
          totalAmount: Math.round(totalAmount * 100) / 100,
          monthlyAmount: Math.round((totalAmount / inst.count) * 100) / 100,
          interestAmount: Math.round(totalInterest * 100) / 100,
          interestRate: rate
        }
      })
    } else {
      // No interest rates configured - just calculate monthly amounts
      installments = installments.map(inst => ({
        ...inst,
        totalAmount: paymentLink.amount,
        monthlyAmount: Math.round((paymentLink.amount / inst.count) * 100) / 100,
        interestAmount: 0,
        interestRate: 0
      }))
    }

    res.json({
      success: true,
      card: result.card,
      installments,
      pos: result.pos
    })
  } catch (error) {
    console.error('BIN query error:', error.message)
    res.status(500).json({
      status: false,
      error: 'BIN sorgusu başarısız oldu'
    })
  }
})

/**
 * POST /pay-link/:token/process
 * Process payment for payment link
 */
router.post('/:token/process', async (req, res) => {
  try {
    const { token } = req.params
    const { card, installment, posId } = req.body

    // Validate card
    if (!card?.holder || !card?.number || !card?.expiry || !card?.cvv) {
      return res.status(400).json({
        status: false,
        error: 'Kart bilgileri eksik'
      })
    }

    // Fetch payment link
    const linkResponse = await axios.get(`${API_BASE_URL}/pay/${token}`, { httpsAgent })
    const paymentLink = linkResponse.data.data

    if (['cancelled', 'expired', 'paid'].includes(paymentLink.status)) {
      return res.status(400).json({
        status: false,
        error: 'Bu ödeme linki artık kullanılamaz'
      })
    }

    // Validate installment
    const selectedInstallment = parseInt(installment) || 1
    if (paymentLink.installment?.enabled) {
      if (selectedInstallment > (paymentLink.installment.maxCount || 1)) {
        return res.status(400).json({
          status: false,
          error: 'Geçersiz taksit sayısı'
        })
      }
    } else if (selectedInstallment > 1) {
      return res.status(400).json({
        status: false,
        error: 'Bu ödeme için taksit kullanılamaz'
      })
    }

    // Process payment
    const customerIp = req.ip
    const paymentResult = await PaymentService.createPayment({
      posId,
      amount: paymentLink.amount,
      currency: paymentLink.currency.toLowerCase(),
      installment: selectedInstallment,
      card: {
        holder: card.holder,
        number: card.number.replace(/\s/g, ''),
        expiry: card.expiry,
        cvv: card.cvv
      },
      customer: {
        name: paymentLink.customer.name,
        email: paymentLink.customer.email,
        phone: paymentLink.customer.phone,
        ip: customerIp
      },
      externalId: `PL-${token}`
    })

    // If 3D redirect needed (check both formUrl and redirectUrl)
    const redirectUrl = paymentResult.formUrl || paymentResult.redirectUrl
    if (redirectUrl) {
      return res.json({
        status: true,
        requires3D: true,
        transactionId: paymentResult.transactionId,
        redirectUrl: redirectUrl
      })
    }

    // Direct payment success - update payment link status in main API
    if (paymentResult.success) {
      try {
        // Get full transaction details
        const txDetails = await PaymentService.getTransactionDetails(paymentResult.transactionId)

        // Notify main API about successful payment
        await axios.post(`${API_BASE_URL}/pay/${token}/complete`, txDetails, { httpsAgent })
      } catch (notifyError) {
        console.error('Failed to notify main API:', notifyError.message)
      }
    }

    res.json(paymentResult)
  } catch (error) {
    console.error('Payment process error:', error.message)
    res.status(500).json({
      status: false,
      error: error.message || 'Ödeme işlemi başarısız oldu'
    })
  }
})

/**
 * POST /pay-link/:token/callback
 * 3D Secure callback for payment link
 */
router.post('/:token/callback', async (req, res) => {
  const { token } = req.params

  console.log('[PaymentLink Callback] Token:', token)
  console.log('[PaymentLink Callback] Body keys:', Object.keys(req.body))

  try {
    // Get transactionId from callback data or session
    const transactionId = req.body.transactionId || req.body.orderId

    console.log('[PaymentLink Callback] TransactionId:', transactionId)

    if (!transactionId) {
      return res.send(renderResultPage(false, 'İşlem bilgisi bulunamadı'))
    }

    // Process 3D callback
    const result = await PaymentService.processCallback(transactionId, req.body)

    console.log('[PaymentLink Callback] ProcessCallback result:', {
      success: result.success,
      message: result.message
    })

    // If successful, calculate commission and notify main API
    if (result.success) {
      try {
        // Import Transaction model to get partner info
        const { Transaction } = await import('../models/index.js')
        const transaction = await Transaction.findById(transactionId).populate('pos')

        // Get payment link info from main API to get partnerId
        let partnerId = transaction?.partnerId
        if (!partnerId) {
          try {
            const linkResponse = await axios.get(`${API_BASE_URL}/pay/${token}`, { httpsAgent })
            const paymentLink = linkResponse.data.data
            partnerId = paymentLink?.partner?._id || paymentLink?.partner
            console.log('[PaymentLink Callback] Got partnerId from payment link:', partnerId)
          } catch (linkError) {
            console.log(
              '[PaymentLink Callback] Could not get partner from payment link:',
              linkError.message
            )
          }
        }

        // Calculate commission for successful payment
        if (transaction && transaction.pos) {
          await PaymentService.calculateTransactionCommission(
            transaction,
            transaction.pos,
            partnerId
          )
          console.log('[PaymentLink Callback] Commission calculated')
        }

        // Get full transaction details (now includes commission)
        const txDetails = await PaymentService.getTransactionDetails(transactionId)

        console.log('[PaymentLink Callback] Transaction details:', txDetails ? 'OK' : 'NULL')
        console.log(
          '[PaymentLink Callback] Calling main API:',
          `${API_BASE_URL}/pay/${token}/complete`
        )

        const apiResponse = await axios.post(`${API_BASE_URL}/pay/${token}/complete`, txDetails, {
          httpsAgent
        })
        console.log('[PaymentLink Callback] Main API response:', apiResponse.data)
      } catch (notifyError) {
        console.error('[PaymentLink Callback] Failed to notify main API:', notifyError.message)
        if (notifyError.response) {
          console.error('[PaymentLink Callback] API Error Response:', notifyError.response.data)
        }
      }
    } else {
      console.log('[PaymentLink Callback] Payment not successful, skipping main API notification')
    }

    res.send(renderResultPage(result.success, result.message, token))
  } catch (error) {
    console.error('[PaymentLink Callback] Error:', error.message)
    res.send(renderResultPage(false, error.message || 'İşlem sırasında bir hata oluştu', token))
  }
})

/**
 * GET /pay-link/:token/result
 * Show payment result page
 */
router.get('/:token/result', async (req, res) => {
  const { token } = req.params
  const { success } = req.query

  const isSuccess = success === 'true'
  const message = isSuccess ? 'Ödemeniz başarıyla tamamlandı.' : 'Ödeme işlemi başarısız oldu.'

  res.send(renderResultPage(isSuccess, message, token))
})

// ============================================================================
// HTML TEMPLATES
// ============================================================================

function renderPaymentForm(paymentLink, token) {
  const {
    customer,
    description,
    amount,
    currency,
    installment,
    partner,
    subscription,
    purpose,
    tryEquivalent,
    tax
  } = paymentLink
  const formattedAmount = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(
    amount
  )
  const currencySymbol = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }[currency] || currency

  const isSubscription = purpose === 'subscription_package' || purpose === 'subscription_service'

  let taxBreakdownHtml = ''
  if (tax && tax.rate > 0) {
    const fmtSubtotal = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(
      tax.subtotal
    )
    const fmtTax = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(tax.amount)
    taxBreakdownHtml = `
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-top:8px;padding-top:8px;border-top:1px dashed #e2e8f0;">
        <span>Ara Toplam</span>
        <span>${currencySymbol}${fmtSubtotal}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-top:4px;">
        <span>KDV (%${tax.rate})</span>
        <span>${currencySymbol}${fmtTax}</span>
      </div>`
  }

  let tryHtml = ''
  if (tryEquivalent && currency !== 'TRY') {
    const formattedTry = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(
      tryEquivalent.amount
    )
    tryHtml = `<div style="font-size:12px;color:#94a3b8;margin-top:4px;">≈ ₺${formattedTry}</div>`
  }

  let subscriptionHtml = ''
  if (isSubscription && subscription) {
    const lang = 'tr'
    const subName = subscription.name?.[lang] || subscription.name?.en || ''
    const subDesc = subscription.description?.[lang] || subscription.description?.en || ''
    const billingLabel =
      { monthly: 'Aylık', yearly: 'Yıllık', one_time: 'Tek Seferlik' }[
        subscription.billingPeriod
      ] || ''

    let servicesHtml = ''
    if (subscription.services && subscription.services.length > 0) {
      const tryRate = tryEquivalent ? tryEquivalent.rate : null
      servicesHtml = `
        <div class="sub-services">
          <div class="sub-services-title">Dahil Hizmetler</div>
          ${subscription.services
            .map(s => {
              const sName = s.name?.[lang] || s.name?.en || ''
              const sPrice = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(
                s.price || 0
              )
              const sTryPrice =
                tryRate && currency !== 'TRY'
                  ? `<span style="font-size:10px;color:#94a3b8;margin-left:4px;">≈ ₺${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format((s.price || 0) * tryRate)}</span>`
                  : ''
              return `<div class="sub-service-item">
              <span class="sub-service-name">${sName}</span>
              <span class="sub-service-price">${currencySymbol}${sPrice}${sTryPrice}</span>
            </div>`
            })
            .join('')}
        </div>`
    }

    const trialHtml = subscription.trialDays
      ? `
      <div class="sub-trial">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${subscription.trialDays} gün deneme süresi
      </div>`
      : ''

    subscriptionHtml = `
      <div class="sub-details">
        <div class="sub-header-row">
          <div class="sub-name">${subName}</div>
          ${billingLabel ? `<span class="sub-billing">${billingLabel}</span>` : ''}
        </div>
        ${subDesc ? `<div class="sub-desc">${subDesc}</div>` : ''}
        ${servicesHtml}
        ${trialHtml}
      </div>`
  }

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ödeme - ${partner?.companyName || 'Ödeme'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(160deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 480px;
      margin: 0 auto;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
      padding: 28px 24px;
      text-align: center;
    }
    .logo { max-height: 48px; margin-bottom: 12px; filter: brightness(0) invert(1); }
    .company-name { font-size: 18px; font-weight: 600; color: #fff; }
    .sub-details {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .sub-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .sub-name {
      font-size: 16px;
      font-weight: 700;
      color: #0c4a6e;
    }
    .sub-billing {
      font-size: 11px;
      font-weight: 600;
      color: #0369a1;
      background: #e0f2fe;
      border: 1px solid #7dd3fc;
      padding: 2px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sub-desc {
      font-size: 13px;
      color: #475569;
      margin-bottom: 12px;
      line-height: 1.4;
    }
    .sub-services {
      border-top: 1px solid #bae6fd;
      padding-top: 10px;
    }
    .sub-services-title {
      font-size: 11px;
      font-weight: 600;
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .sub-service-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
    }
    .sub-service-item + .sub-service-item {
      border-top: 1px dashed #bae6fd;
    }
    .sub-service-name {
      color: #334155;
      font-weight: 500;
    }
    .sub-service-price {
      color: #0c4a6e;
      font-weight: 600;
      font-size: 12px;
    }
    .sub-trial {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #bae6fd;
      font-size: 12px;
      font-weight: 500;
      color: #0369a1;
    }
    .content { padding: 24px; }
    .amount-display {
      text-align: center;
      padding: 24px 20px;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .amount-label { font-size: 14px; color: #1e40af; margin-bottom: 4px; font-weight: 500; }
    .amount-value { font-size: 36px; font-weight: 700; color: #1e3a5f; }
    .description {
      font-size: 14px;
      color: #1e40af;
      text-align: center;
      margin-bottom: 24px;
      padding: 12px 16px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      font-weight: 500;
    }
    .customer-info {
      font-size: 13px;
      color: #888;
      text-align: center;
      margin-bottom: 20px;
    }
    .form-group { margin-bottom: 16px; }
    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #555;
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #e9ecef;
      border-radius: 10px;
      font-size: 16px;
      transition: all 0.2s;
    }
    .form-input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }
    .form-row { display: flex; gap: 12px; }
    .form-row .form-group { flex: 1; }
    .card-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: linear-gradient(135deg, #e8f4f8 0%, #f0f7fa 100%);
      border-radius: 12px;
      margin-bottom: 16px;
      font-size: 14px;
      border: 1px solid #d0e8f0;
    }
    .card-logo { width: 48px; height: 32px; object-fit: contain; }
    .card-logo svg { width: 48px; height: 32px; }
    .card-details { flex: 1; }
    .card-brand { font-weight: 600; display: block; color: #333; }
    .card-bank { color: #666; font-size: 13px; }
    .card-family {
      display: inline-block;
      background: #2563eb;
      color: white;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      margin-left: 8px;
      text-transform: uppercase;
      font-weight: 600;
    }
    /* Compact Custom Dropdown */
    .custom-dropdown {
      position: relative;
      width: 100%;
    }
    .dropdown-selected {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .dropdown-selected:hover {
      border-color: #2563eb;
    }
    .custom-dropdown.open .dropdown-selected {
      border-color: #2563eb;
      border-radius: 10px 10px 0 0;
    }
    .dropdown-selected-text {
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
    }
    .dropdown-selected-amount {
      font-size: 14px;
      font-weight: 700;
      color: #2563eb;
      margin-right: 8px;
    }
    .dropdown-arrow {
      width: 16px;
      height: 16px;
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }
    .dropdown-arrow svg {
      width: 16px;
      height: 16px;
      stroke: #9ca3af;
      stroke-width: 2.5;
      fill: none;
    }
    .custom-dropdown.open .dropdown-arrow {
      transform: rotate(180deg);
    }
    .dropdown-options {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 2px solid #2563eb;
      border-top: 1px solid #e5e7eb;
      border-radius: 0 0 10px 10px;
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      transition: all 0.2s ease;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .custom-dropdown.open .dropdown-options {
      max-height: 200px;
      overflow-y: auto;
      opacity: 1;
    }
    .dropdown-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      cursor: pointer;
      transition: background 0.1s ease;
      border-bottom: 1px solid #f3f4f6;
      font-size: 13px;
    }
    .dropdown-option:last-child {
      border-bottom: none;
    }
    .dropdown-option:hover {
      background: #eff6ff;
    }
    .dropdown-option.selected {
      background: #dbeafe;
    }
    .dropdown-option-label {
      color: #374151;
      font-weight: 500;
    }
    .dropdown-option-price {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .dropdown-option-total {
      font-weight: 600;
      color: #1f2937;
    }
    .dropdown-option-extra {
      font-size: 11px;
      color: #d97706;
      font-weight: 500;
    }
    .dropdown-option-check {
      width: 16px;
      height: 16px;
      margin-left: 8px;
      opacity: 0;
    }
    .dropdown-option-check svg {
      width: 16px;
      height: 16px;
      stroke: #2563eb;
      stroke-width: 3;
      fill: none;
    }
    .dropdown-option.selected .dropdown-option-check {
      opacity: 1;
    }
    .installment-summary {
      margin-top: 8px;
      padding: 10px 14px;
      background: #eff6ff;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .installment-summary-label {
      color: #6b7280;
    }
    .installment-summary-value {
      font-weight: 600;
      color: #2563eb;
    }
        .btn-pay {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 20px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-pay:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(37, 99, 235, 0.4); }
    .btn-pay:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .secure-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 20px;
      font-size: 13px;
      color: #28a745;
    }
    .loading { display: none; text-align: center; padding: 40px; }
    .loading.show { display: block; }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #e9ecef;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-msg {
      background: #fee;
      color: #c00;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 16px;
      display: none;
    }
    .error-msg.show { display: block; }
    .iframe-container {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 1000;
    }
    .iframe-container.show { display: flex; align-items: center; justify-content: center; }
    .iframe-container iframe {
      width: 90%;
      max-width: 500px;
      height: 600px;
      border: none;
      border-radius: 12px;
      background: white;
    }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        ${partner?.branding?.logo ? `<img src="${partner.branding.logo}" alt="${partner.companyName}" class="logo">` : ''}
        <div class="company-name">${partner?.companyName || 'Ödeme'}</div>
      </div>

      <div class="content">
        <div class="amount-display">
          <div class="amount-label">Ödenecek Tutar</div>
          <div class="amount-value">${currencySymbol}${formattedAmount}</div>
          ${tryHtml}
          <div style="font-size:13px;color:#64748b;margin-top:6px;">${description}</div>
          ${taxBreakdownHtml}
        </div>

        ${subscriptionHtml}

        <div class="customer-info" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;background:#f8fafc;border-radius:8px;margin-bottom:20px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>${customer.name}</span>
          ${customer.email ? `<span style="color:#cbd5e1;">•</span><span>${customer.email}</span>` : ''}
        </div>

        <div class="error-msg" id="errorMsg"></div>

        <form id="paymentForm">
          <div class="form-group">
            <label class="form-label">Kart Üzerindeki İsim</label>
            <input type="text" class="form-input" id="cardHolder" placeholder="AD SOYAD" autocomplete="cc-name" required>
          </div>

          <div class="form-group">
            <label class="form-label">Kart Numarası</label>
            <input type="text" class="form-input" id="cardNumber" placeholder="0000 0000 0000 0000" maxlength="19" autocomplete="cc-number" required>
          </div>

          <div id="cardInfo" class="card-info hidden">
            <div class="card-logo" id="cardLogo"></div>
            <div class="card-details">
              <span class="card-brand" id="cardBrand"></span>
              <span class="card-family" id="cardFamily" style="display:none;"></span>
              <span class="card-bank" id="cardBank"></span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Son Kullanma</label>
              <input type="text" class="form-input" id="cardExpiry" placeholder="AA/YY" maxlength="5" autocomplete="cc-exp" required>
            </div>
            <div class="form-group">
              <label class="form-label">CVV</label>
              <input type="text" class="form-input" id="cardCvv" placeholder="123" maxlength="4" autocomplete="cc-csc" required>
            </div>
          </div>

          <div class="form-group" id="installmentGroup" style="${installment?.enabled ? '' : 'display: none;'}">
            <label class="form-label">Taksit Seçimi</label>
            <div class="custom-dropdown" id="installmentDropdown">
              <div class="dropdown-selected" onclick="toggleDropdown()">
                <span class="dropdown-selected-text" id="selectedText">Tek Çekim</span>
                <span class="dropdown-selected-amount" id="selectedAmount">${currencySymbol}${formattedAmount}</span>
                <span class="dropdown-arrow">
                  <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </span>
              </div>
              <div class="dropdown-options" id="dropdownOptions"></div>
            </div>
            <input type="hidden" id="installmentSelect" value="1">
            <div class="installment-summary" id="installmentSummary">
              <span class="installment-summary-label">Toplam: <span class="installment-summary-value" id="totalAmount">${currencySymbol}${formattedAmount}</span></span>
            </div>
          </div>

          <input type="hidden" id="posId" value="">
          <input type="hidden" id="token" value="${token}">

          <button type="submit" class="btn-pay" id="payBtn">
            ${currencySymbol}${formattedAmount} Öde
          </button>
        </form>

        <div class="secure-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
          </svg>
          3D Secure ile Güvenli Ödeme
        </div>
      </div>

      <div class="loading" id="loading">
        <div class="spinner"></div>
        <p>İşleminiz gerçekleştiriliyor...</p>
      </div>
    </div>
  </div>

  <div class="iframe-container" id="iframeContainer">
    <iframe id="secureFrame" src=""></iframe>
  </div>

  <script>
    const token = '${token}';
    const installmentEnabled = ${installment?.enabled === true};
    const maxInstallment = ${installment?.maxCount || 1};
    const baseAmount = ${amount};
    const currencySymbol = '${currencySymbol}';
    const currencyCode = '${currency}';

    const form = document.getElementById('paymentForm');
    const cardNumber = document.getElementById('cardNumber');
    const cardExpiry = document.getElementById('cardExpiry');
    const cardInfo = document.getElementById('cardInfo');
    const cardLogo = document.getElementById('cardLogo');
    const cardBrand = document.getElementById('cardBrand');
    const cardBank = document.getElementById('cardBank');
    const installmentSelect = document.getElementById('installmentSelect');
    const installmentGroup = document.getElementById('installmentGroup');
    const posIdInput = document.getElementById('posId');
    const errorMsg = document.getElementById('errorMsg');
    const loading = document.getElementById('loading');
    const payBtn = document.getElementById('payBtn');
    const iframeContainer = document.getElementById('iframeContainer');
    const secureFrame = document.getElementById('secureFrame');

    let binTimeout;

    // Card brand logos (inline SVG for reliability)
    const cardLogos = {
      visa: '<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" rx="4" fill="#1A1F71"/><path d="M19.5 21H17L18.9 11H21.4L19.5 21ZM15.2 11L12.8 18.1L12.5 16.7L11.6 12C11.6 12 11.5 11 10.2 11H6.1L6 11.2C6 11.2 7.4 11.5 9 12.5L11.2 21H13.8L17.9 11H15.2ZM35.5 21H37.8L35.8 11H33.8C32.7 11 32.4 11.9 32.4 11.9L28.8 21H31.4L31.9 19.5H35.1L35.5 21ZM32.6 17.5L34 13.6L34.8 17.5H32.6ZM29.3 13.7L29.7 11.3C29.7 11.3 28.4 10.8 27 10.8C25.5 10.8 22 11.5 22 14.4C22 17.1 25.8 17.1 25.8 18.6C25.8 20.1 22.4 19.7 21.2 18.8L20.8 21.3C20.8 21.3 22.1 21.9 24.1 21.9C26.1 21.9 28.8 20.7 28.8 18C28.8 15.2 25 14.9 25 13.7C25 12.5 27.6 12.7 29.3 13.7Z" fill="white"/></svg>',
      mastercard: '<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" rx="4" fill="#000"/><circle cx="19" cy="16" r="10" fill="#EB001B"/><circle cx="29" cy="16" r="10" fill="#F79E1B"/><path d="M24 8.5C26.5 10.3 28 13 28 16C28 19 26.5 21.7 24 23.5C21.5 21.7 20 19 20 16C20 13 21.5 10.3 24 8.5Z" fill="#FF5F00"/></svg>',
      amex: '<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" rx="4" fill="#006FCF"/><path d="M9 16L11.5 10H14L17.5 19H14.8L14.2 17.5H11.3L10.7 19H8L9 16ZM12.8 12.5L11.8 15.5H13.7L12.8 12.5ZM18 10H21L22.5 15.5L24 10H27V19H24.5V13L22.5 19H20.5L18.5 13V19H18V10ZM28 10H35V12H30.5V13.5H35V15.5H30.5V17H35V19H28V10ZM36 10H39L41 13L43 10H46L42.5 14.5L46 19H43L41 16L39 19H36L39.5 14.5L36 10Z" fill="white"/></svg>',
      troy: '<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" rx="4" fill="#1E3A5F"/><path d="M14 12H10V20H12V17H14C16.2 17 18 15.2 18 14.5C18 13.8 16.2 12 14 12ZM14 15H12V14H14C14.5 14 15 14.3 15 14.5C15 14.7 14.5 15 14 15Z" fill="white"/><path d="M24 12L22 20H19L21 12H24Z" fill="white"/><path d="M26 12V20H28V17L30 20H33L30 16L33 12H30L28 15V12H26Z" fill="white"/><path d="M36 12L38 16L40 12H43L39 20H37L33 12H36Z" fill="#00A8E8"/></svg>',
      electron: '<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" rx="4" fill="#1A1F71"/><path d="M19.5 21H17L18.9 11H21.4L19.5 21Z" fill="white"/><path d="M29 11C27.5 11 26 11.5 25 12.5L22 21H24.5L25 19.5H28.5L28.8 21H31L29 11ZM25.8 17.5L27 13.5L27.8 17.5H25.8Z" fill="white"/><circle cx="36" cy="16" r="5" fill="#F7B600"/><circle cx="38" cy="16" r="5" fill="#ED0006"/></svg>',
      maestro: '<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" rx="4" fill="#000"/><circle cx="19" cy="16" r="10" fill="#0099DF"/><circle cx="29" cy="16" r="10" fill="#ED0006"/><path d="M24 8.5C26.5 10.3 28 13 28 16C28 19 26.5 21.7 24 23.5C21.5 21.7 20 19 20 16C20 13 21.5 10.3 24 8.5Z" fill="#6C6BBD"/></svg>',
      default: '<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" rx="4" fill="#E0E0E0"/><rect x="6" y="10" width="36" height="4" rx="2" fill="#BDBDBD"/><rect x="6" y="18" width="20" height="4" rx="2" fill="#BDBDBD"/></svg>'
    };

    // Get logo by brand name
    function getCardLogo(brand) {
      if (!brand) return cardLogos.default;
      const b = brand.toLowerCase();
      if (b.includes('visa')) return cardLogos.visa;
      if (b.includes('master')) return cardLogos.mastercard;
      if (b.includes('amex') || b.includes('american')) return cardLogos.amex;
      if (b.includes('troy')) return cardLogos.troy;
      if (b.includes('electron')) return cardLogos.electron;
      if (b.includes('maestro')) return cardLogos.maestro;
      return cardLogos.default;
    }

    // Format card number
    cardNumber.addEventListener('input', (e) => {
      let value = e.target.value.replace(/[^0-9]/g, '');
      value = value.replace(/(.{4})/g, '$1 ').trim();
      e.target.value = value.slice(0, 19);

      // BIN query
      const bin = value.replace(/\\s/g, '');
      if (bin.length >= 6) {
        clearTimeout(binTimeout);
        binTimeout = setTimeout(() => queryBin(bin.slice(0, 8)), 300);
      } else {
        cardInfo.classList.add('hidden');
        if (!installmentEnabled) installmentGroup.style.display = 'none';
      }
    });

    // Format expiry
    cardExpiry.addEventListener('input', (e) => {
      let value = e.target.value.replace(/[^0-9]/g, '');
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2);
      }
      e.target.value = value.slice(0, 5);
    });

    // BIN Query
    async function queryBin(bin) {
      try {
        const response = await fetch('/pay-link/' + token + '/bin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bin })
        });

        const data = await response.json();
        console.log('BIN query result:', data);

        if ((data.success || data.status) && data.card) {
          // Show card logo
          cardLogo.innerHTML = getCardLogo(data.card.brand);
          cardBrand.textContent = data.card.brand || '';
          cardBank.textContent = data.card.bank || '';

          // Show card family (World, Axess, Bonus, etc.)
          const cardFamilyEl = document.getElementById('cardFamily');
          if (data.card.family && data.card.family.toLowerCase() !== 'unknown') {
            cardFamilyEl.textContent = data.card.family.toUpperCase();
            cardFamilyEl.style.display = 'inline-block';
          } else {
            cardFamilyEl.style.display = 'none';
          }

          cardInfo.classList.remove('hidden');

          // Update custom dropdown options
          if (data.installments && data.installments.length > 0) {
            const dropdownOptions = document.getElementById('dropdownOptions');
            const checkIcon = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';

            dropdownOptions.innerHTML = data.installments.map((i, idx) => {
              const totalAmount = (i.totalAmount || baseAmount).toFixed(2);
              const monthlyAmount = (i.monthlyAmount || baseAmount).toFixed(2);
              const hasInterest = i.totalAmount && i.totalAmount > baseAmount;
              const extraAmount = hasInterest ? (i.totalAmount - baseAmount).toFixed(2) : null;
              const isFirst = idx === 0;

              let label, priceText;
              if (i.count === 1) {
                label = 'Tek Çekim';
                priceText = currencySymbol + totalAmount;
              } else {
                label = i.count + ' Taksit';
                priceText = currencySymbol + monthlyAmount + '/ay';
              }

              const extraHtml = extraAmount ? '<span class="dropdown-option-extra">(+' + currencySymbol + extraAmount + ')</span>' : '';

              return '<div class="dropdown-option' + (isFirst ? ' selected' : '') + '" data-value="' + i.count + '" data-total="' + totalAmount + '" data-label="' + label + '" onclick="selectOption(this)">' +
                '<span class="dropdown-option-label">' + label + '</span>' +
                '<span class="dropdown-option-price">' +
                  '<span class="dropdown-option-total">' + priceText + '</span>' +
                  extraHtml +
                  '<span class="dropdown-option-check">' + checkIcon + '</span>' +
                '</span>' +
              '</div>';
            }).join('');

            // Select first option by default
            const firstOption = dropdownOptions.querySelector('.dropdown-option');
            if (firstOption) {
              selectOption(firstOption, false);
            }

            // Show installment selector if enabled and has more than single option
            if (installmentEnabled && data.installments.length > 1) {
              installmentGroup.style.display = 'block';
            }
          }

          // Save POS ID
          if (data.pos?.id) {
            posIdInput.value = data.pos.id;
          }
        }
      } catch (err) {
        console.error('BIN query error:', err);
      }
    }

    // Show error
    function showError(msg) {
      errorMsg.textContent = msg;
      errorMsg.classList.add('show');
      setTimeout(() => errorMsg.classList.remove('show'), 5000);
    }

    // Form submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const cardData = {
        holder: document.getElementById('cardHolder').value.toUpperCase(),
        number: cardNumber.value.replace(/\\s/g, ''),
        expiry: cardExpiry.value,
        cvv: document.getElementById('cardCvv').value
      };

      if (cardData.number.length < 15) {
        return showError('Geçersiz kart numarası');
      }

      form.classList.add('hidden');
      loading.classList.add('show');
      payBtn.disabled = true;

      try {
        const response = await fetch('/pay-link/' + token + '/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            card: cardData,
            installment: installmentSelect.value,
            posId: posIdInput.value
          })
        });

        const result = await response.json();

        if (result.requires3D && result.redirectUrl) {
          // Show 3D iframe
          secureFrame.src = result.redirectUrl;
          loading.classList.remove('show');
          iframeContainer.classList.add('show');
        } else if (result.success) {
          // Direct success
          window.location.href = '/pay-link/' + token + '/result?success=true';
        } else {
          throw new Error(result.error || 'Ödeme başarısız oldu');
        }
      } catch (err) {
        loading.classList.remove('show');
        form.classList.remove('hidden');
        payBtn.disabled = false;
        showError(err.message);
      }
    });

    // Toggle dropdown open/close
    function toggleDropdown() {
      const dropdown = document.getElementById('installmentDropdown');
      dropdown.classList.toggle('open');
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      const dropdown = document.getElementById('installmentDropdown');
      if (dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });

    // Select an option from dropdown
    function selectOption(optionEl, closeDropdown = true) {
      const dropdown = document.getElementById('installmentDropdown');
      const options = dropdown.querySelectorAll('.dropdown-option');

      // Remove selected from all
      options.forEach(o => o.classList.remove('selected'));

      // Add selected to clicked
      optionEl.classList.add('selected');

      // Update hidden input
      const value = optionEl.getAttribute('data-value');
      const total = optionEl.getAttribute('data-total');
      const label = optionEl.getAttribute('data-label');
      installmentSelect.value = value;

      // Update selected display
      document.getElementById('selectedText').textContent = label;
      document.getElementById('selectedAmount').textContent = currencySymbol + total;

      // Update summary
      document.getElementById('totalAmount').textContent = currencySymbol + total;

      // Close dropdown
      if (closeDropdown) {
        dropdown.classList.remove('open');
      }
    }

    // Listen for 3D callback result
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'payment_result') {
        iframeContainer.classList.remove('show');
        if (e.data.data?.success) {
          window.location.href = '/pay-link/' + token + '/result?success=true';
        } else {
          loading.classList.remove('show');
          form.classList.remove('hidden');
          payBtn.disabled = false;
          showError(e.data.data?.message || 'Ödeme başarısız oldu');
        }
      }
    });
  </script>
</body>
</html>
`
}

function renderStatusPage(paymentLink) {
  const statusMessages = {
    paid: {
      icon: '✓',
      title: 'Ödeme Tamamlandı',
      message: 'Bu ödeme işlemi daha önce tamamlanmıştır.',
      color: '#28a745'
    },
    expired: {
      icon: '⏰',
      title: 'Link Süresi Doldu',
      message: 'Bu ödeme linkinin süresi dolmuştur.',
      color: '#ffc107'
    },
    cancelled: {
      icon: '✗',
      title: 'Link İptal Edildi',
      message: 'Bu ödeme linki iptal edilmiştir.',
      color: '#dc3545'
    }
  }

  const status = statusMessages[paymentLink.status] || statusMessages.cancelled

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${status.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      text-align: center;
      padding: 48px 32px;
      max-width: 400px;
    }
    .icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: ${status.color};
      color: white;
      font-size: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    h1 { font-size: 24px; color: #333; margin-bottom: 12px; }
    p { font-size: 16px; color: #666; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${status.icon}</div>
    <h1>${status.title}</h1>
    <p>${status.message}</p>
  </div>
</body>
</html>
`
}

function renderResultPage(success, message, token) {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'Ödeme Başarılı' : 'Ödeme Başarısız'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${success ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : '#f5f5f5'};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      text-align: center;
      padding: 48px 32px;
      max-width: 400px;
    }
    .icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: ${success ? '#28a745' : '#dc3545'};
      color: white;
      font-size: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    h1 { font-size: 24px; color: #333; margin-bottom: 12px; }
    p { font-size: 16px; color: #666; margin-bottom: 24px; }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✓' : '✗'}</div>
    <h1>${success ? 'Ödeme Başarılı!' : 'Ödeme Başarısız'}</h1>
    <p>${message || (success ? 'Ödemeniz başarıyla tamamlandı.' : 'Ödeme işlemi gerçekleştirilemedi.')}</p>
  </div>
  <script>
    // Notify parent if in iframe
    try {
      window.parent.postMessage({ type: 'payment_result', data: { success: ${success}, message: '${message || ''}' } }, '*');
    } catch(e) {}
  </script>
</body>
</html>
`
}

function renderErrorPage(message) {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hata</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      text-align: center;
      padding: 48px 32px;
      max-width: 400px;
    }
    .icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #dc3545;
      color: white;
      font-size: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    h1 { font-size: 24px; color: #333; margin-bottom: 12px; }
    p { font-size: 16px; color: #666; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">!</div>
    <h1>Hata</h1>
    <p>${message}</p>
  </div>
</body>
</html>
`
}

export default router
