/**
 * Night Audit Core Service
 * Start, get current, and cancel audit operations
 */

import { asyncHandler } from '#helpers'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import NightAudit from './nightAudit.model.js'

import { emitToRoom } from '#core/socket.js'

/**
 * Emit night audit progress event via WebSocket
 * @param {string} hotelId - Hotel ID (used as room)
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
export const emitAuditEvent = (hotelId, event, data) => {
  emitToRoom(`night-audit:${hotelId}`, `night-audit:${event}`, {
    hotelId,
    timestamp: Date.now(),
    ...data
  })
}

/**
 * Start a new night audit
 * POST /api/hotels/:hotelId/night-audit/start
 */
export const startAudit = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { auditDate } = req.body

  // Check for existing in-progress audit
  const existingAudit = await NightAudit.getCurrentAudit(hotelId)
  if (existingAudit) {
    return res.json({
      success: true,
      data: existingAudit,
      message: 'Devam eden audit bulundu'
    })
  }

  // Determine audit date (default: today)
  const date = auditDate ? new Date(auditDate) : new Date()
  date.setHours(0, 0, 0, 0)

  // Check if audit already completed for this date
  const completedAudit = await NightAudit.getAuditForDate(hotelId, date)
  if (completedAudit && completedAudit.status === 'completed') {
    throw new BadRequestError('Bu tarih icin audit zaten tamamlanmis')
  }

  // Generate audit number
  const auditNumber = await NightAudit.generateAuditNumber(hotelId, date)

  // Create new audit
  const audit = await NightAudit.create({
    hotel: hotelId,
    auditNumber,
    auditDate: date,
    startedBy: req.user._id
  })

  // Emit WebSocket event for audit start
  emitAuditEvent(hotelId, 'started', {
    auditId: audit._id,
    auditNumber,
    auditDate: date,
    currentStep: 1
  })

  res.status(201).json({
    success: true,
    data: audit
  })
})

/**
 * Get current audit in progress
 * GET /api/hotels/:hotelId/night-audit/current
 */
export const getCurrentAudit = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const audit = await NightAudit.getCurrentAudit(hotelId)

  if (!audit) {
    return res.json({
      success: true,
      data: null,
      message: 'Devam eden audit yok'
    })
  }

  res.json({
    success: true,
    data: audit
  })
})

/**
 * Cancel audit
 * POST /api/hotels/:hotelId/night-audit/:auditId/cancel
 */
export const cancelAudit = asyncHandler(async (req, res) => {
  const { hotelId, auditId } = req.params
  const { reason } = req.body

  const audit = await NightAudit.findOne({
    _id: auditId,
    hotel: hotelId,
    status: 'in_progress'
  })

  if (!audit) {
    throw new NotFoundError('Aktif audit bulunamadi')
  }

  await audit.cancel(req.user._id, reason)

  res.json({
    success: true,
    data: audit,
    message: 'Audit iptal edildi'
  })
})
