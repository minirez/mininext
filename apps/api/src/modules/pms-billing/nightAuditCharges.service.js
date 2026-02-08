/**
 * Night Audit Charges Service
 * Room charge posting operations
 */

import { asyncHandler } from '#helpers'
import { NotFoundError } from '#core/errors.js'
import NightAudit from './nightAudit.model.js'
import Stay, { STAY_STATUS } from '#modules/pms-frontdesk/stay.model.js'
import { emitAuditEvent } from './nightAuditCore.service.js'

/**
 * Get room charges to post
 * GET /api/hotels/:hotelId/night-audit/room-charges
 */
export const getRoomCharges = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  // Get all checked-in stays
  const stays = await Stay.find({
    hotel: hotelId,
    status: STAY_STATUS.CHECKED_IN
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')
    .lean()

  const roomCharges = stays.map(stay => {
    const mainGuest = stay.guests?.find(g => g.isMainGuest) || stay.guests?.[0]
    const todayExtras = (stay.extras || [])
      .filter(e => {
        const extraDate = new Date(e.date)
        const today = new Date()
        return extraDate.toDateString() === today.toDateString()
      })
      .reduce((sum, e) => sum + e.amount * (e.quantity || 1), 0)

    return {
      stay: stay._id,
      room: stay.room?._id,
      roomNumber: stay.room?.roomNumber,
      roomType: stay.roomType?.name?.tr || stay.roomType?.code,
      guestName: `${mainGuest?.firstName || ''} ${mainGuest?.lastName || ''}`.trim(),
      checkIn: stay.checkInDate,
      checkOut: stay.checkOutDate,
      nights: stay.nights,
      roomRate: stay.roomRate || 0,
      extras: todayExtras,
      total: (stay.roomRate || 0) + todayExtras,
      balance: stay.balance || 0,
      needsReview: todayExtras > 0
    }
  })

  const summary = {
    totalRooms: roomCharges.length,
    totalRoomCharges: roomCharges.reduce((sum, r) => sum + r.roomRate, 0),
    totalExtras: roomCharges.reduce((sum, r) => sum + r.extras, 0),
    grandTotal: roomCharges.reduce((sum, r) => sum + r.total, 0),
    needsReview: roomCharges.filter(r => r.needsReview).length
  }

  res.json({
    success: true,
    data: {
      summary,
      roomCharges
    }
  })
})

/**
 * Post room charges
 * POST /api/hotels/:hotelId/night-audit/room-charges/post
 */
export const postRoomCharges = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { charges } = req.body // Array of stays to post charges

  const audit = await NightAudit.getCurrentAudit(hotelId)
  if (!audit) {
    throw new NotFoundError('Aktif audit bulunamadi')
  }

  const records = []
  let totalRoomCharges = 0
  let totalExtras = 0

  // FIX: Batch query instead of N+1 - fetch all stays in single query
  const stayIds = charges.map(c => c.stayId).filter(Boolean)
  const stays = await Stay.find({ _id: { $in: stayIds } })
    .populate('room', 'roomNumber')
    .lean()

  // Create a map for O(1) lookup
  const stayMap = new Map(stays.map(s => [s._id.toString(), s]))

  for (const item of charges) {
    const stay = stayMap.get(item.stayId?.toString())

    if (!stay) {
      records.push({
        stay: item.stayId,
        status: 'error',
        error: 'Stay bulunamadi'
      })
      continue
    }

    // Room charges are already tracked in the stay
    // This step is mainly for verification and reporting
    const mainGuest = stay.guests?.find(g => g.isMainGuest) || stay.guests?.[0]

    records.push({
      stay: stay._id,
      room: stay.room?._id,
      roomNumber: stay.room?.roomNumber,
      guestName: `${mainGuest?.firstName || ''} ${mainGuest?.lastName || ''}`.trim(),
      roomRate: stay.roomRate || 0,
      extras: item.extras || 0,
      total: (stay.roomRate || 0) + (item.extras || 0),
      status: 'posted'
    })

    totalRoomCharges += stay.roomRate || 0
    totalExtras += item.extras || 0
  }

  // Update audit
  audit.roomChargePosting = {
    completed: true,
    completedAt: new Date(),
    completedBy: req.user._id,
    totalRooms: records.length,
    postedCount: records.filter(r => r.status === 'posted').length,
    totalRoomCharges,
    totalExtras,
    grandTotal: totalRoomCharges + totalExtras,
    records
  }
  audit.currentStep = 4

  await audit.save()

  // Emit WebSocket event for real-time updates
  emitAuditEvent(hotelId, 'step-complete', {
    auditId: audit._id,
    step: 3,
    stepName: 'roomChargePosting',
    currentStep: 4,
    audit
  })

  res.json({
    success: true,
    data: audit
  })
})
