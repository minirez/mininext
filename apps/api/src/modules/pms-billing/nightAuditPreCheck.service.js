/**
 * Night Audit Pre-Check Service
 * Pre-audit validation and checks
 */

import { asyncHandler } from '#helpers'
import { NotFoundError } from '#core/errors.js'
import NightAudit from './nightAudit.model.js'
import Stay, { STAY_STATUS } from '#modules/pms-frontdesk/stay.model.js'
import Room from '#modules/pms-housekeeping/room.model.js'
import CashRegister from './cashRegister.model.js'
import Booking from '#modules/booking/booking.model.js'
import { emitAuditEvent } from './nightAuditCore.service.js'

/**
 * Run pre-audit checks
 * GET /api/hotels/:hotelId/night-audit/pre-check
 */
export const getPreAuditChecks = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const issues = []
  const summary = {
    totalArrivals: 0,
    checkedInArrivals: 0,
    pendingArrivals: 0,
    totalDepartures: 0,
    checkedOutDepartures: 0,
    pendingDepartures: 0,
    outstandingBalances: 0,
    outstandingAmount: 0,
    dirtyRooms: 0,
    openShifts: 0
  }

  // 1. Check arrivals (today's check-ins)
  const todayBookings = await Booking.find({
    hotel: hotelId,
    checkIn: { $gte: today, $lt: tomorrow },
    status: { $in: ['confirmed', 'checked_in'] }
  }).lean()

  summary.totalArrivals = todayBookings.length
  summary.checkedInArrivals = todayBookings.filter(b => b.status === 'checked_in').length
  summary.pendingArrivals = todayBookings.filter(b => b.status === 'confirmed').length

  if (summary.pendingArrivals > 0) {
    issues.push({
      type: 'arrivals',
      severity: 'warning',
      message: `${summary.pendingArrivals} misafir henuz check-in yapmadi`,
      details: {
        pending: summary.pendingArrivals,
        total: summary.totalArrivals
      }
    })
  }

  // 2. Check departures (today's check-outs)
  const todayDepartures = await Stay.find({
    hotel: hotelId,
    checkOutDate: { $gte: today, $lt: tomorrow },
    status: { $in: [STAY_STATUS.CHECKED_IN, STAY_STATUS.CHECKED_OUT] }
  }).lean()

  summary.totalDepartures = todayDepartures.length
  summary.checkedOutDepartures = todayDepartures.filter(
    s => s.status === STAY_STATUS.CHECKED_OUT
  ).length
  summary.pendingDepartures = todayDepartures.filter(
    s => s.status === STAY_STATUS.CHECKED_IN
  ).length

  if (summary.pendingDepartures > 0) {
    issues.push({
      type: 'departures',
      severity: 'warning',
      message: `${summary.pendingDepartures} misafir henuz check-out yapmadi`,
      details: {
        pending: summary.pendingDepartures,
        total: summary.totalDepartures
      }
    })
  }

  // 3. Check outstanding balances
  const staysWithBalance = await Stay.find({
    hotel: hotelId,
    status: STAY_STATUS.CHECKED_IN,
    balance: { $gt: 0 }
  })
    .populate('room', 'roomNumber')
    .lean()

  summary.outstandingBalances = staysWithBalance.length
  summary.outstandingAmount = staysWithBalance.reduce((sum, s) => sum + (s.balance || 0), 0)

  if (summary.outstandingBalances > 0) {
    issues.push({
      type: 'balances',
      severity: 'warning',
      message: `${summary.outstandingBalances} odada odenmemis bakiye var`,
      details: {
        count: summary.outstandingBalances,
        amount: summary.outstandingAmount,
        rooms: staysWithBalance.map(s => ({
          roomNumber: s.room?.roomNumber,
          balance: s.balance,
          guestName: s.guests?.[0]?.firstName + ' ' + s.guests?.[0]?.lastName
        }))
      }
    })
  }

  // 4. Check housekeeping status
  const dirtyRooms = await Room.find({
    hotel: hotelId,
    housekeepingStatus: { $in: ['dirty', 'cleaning'] }
  })
    .select('roomNumber floor housekeepingStatus')
    .lean()

  summary.dirtyRooms = dirtyRooms.length

  if (summary.dirtyRooms > 0) {
    issues.push({
      type: 'housekeeping',
      severity: 'info',
      message: `${summary.dirtyRooms} oda henuz temizlenmemis`,
      details: {
        count: summary.dirtyRooms,
        rooms: dirtyRooms.map(r => r.roomNumber)
      }
    })
  }

  // 5. Check open shifts
  const openShifts = await CashRegister.find({
    hotel: hotelId,
    status: 'open'
  })
    .populate('cashier', 'firstName lastName')
    .lean()

  summary.openShifts = openShifts.length

  if (summary.openShifts > 0) {
    issues.push({
      type: 'shifts',
      severity: 'warning',
      message: `${summary.openShifts} kasa henuz kapatilmamis`,
      details: {
        count: summary.openShifts,
        shifts: openShifts.map(s => ({
          shiftNumber: s.shiftNumber,
          cashierName:
            s.cashierName || `${s.cashier?.firstName || ''} ${s.cashier?.lastName || ''}`.trim(),
          openedAt: s.openedAt
        }))
      }
    })
  }

  // Determine overall status
  const hasErrors = issues.some(i => i.severity === 'error')
  const hasWarnings = issues.some(i => i.severity === 'warning')

  res.json({
    success: true,
    data: {
      status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'success',
      canProceed: !hasErrors,
      issues,
      summary
    }
  })
})

/**
 * Complete pre-audit check step
 * POST /api/hotels/:hotelId/night-audit/pre-check/complete
 */
export const completePreAuditCheck = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { issues, summary } = req.body

  const audit = await NightAudit.getCurrentAudit(hotelId)
  if (!audit) {
    throw new NotFoundError('Aktif audit bulunamadi')
  }

  audit.preAuditCheck = {
    completed: true,
    completedAt: new Date(),
    completedBy: req.user._id,
    issues: issues || [],
    summary: summary || {}
  }
  audit.currentStep = 2

  await audit.save()

  // Emit WebSocket event for real-time updates
  emitAuditEvent(hotelId, 'step-complete', {
    auditId: audit._id,
    step: 1,
    stepName: 'preAuditCheck',
    currentStep: 2,
    audit
  })

  res.json({
    success: true,
    data: audit
  })
})
