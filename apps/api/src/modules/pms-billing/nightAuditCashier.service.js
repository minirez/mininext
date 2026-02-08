/**
 * Night Audit Cashier Service
 * Cashier reconciliation operations
 */

import { asyncHandler } from '#helpers'
import { NotFoundError } from '#core/errors.js'
import NightAudit from './nightAudit.model.js'
import CashRegister from './cashRegister.model.js'
import { emitAuditEvent } from './nightAuditCore.service.js'

/**
 * Get open shifts for reconciliation
 * GET /api/hotels/:hotelId/night-audit/cashier
 */
export const getCashierData = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const openShifts = await CashRegister.find({
    hotel: hotelId,
    status: { $in: ['open', 'suspended'] }
  })
    .populate('cashier', 'firstName lastName')
    .lean()

  const shifts = openShifts.map(shift => ({
    shift: shift._id,
    shiftNumber: shift.shiftNumber,
    cashierName:
      shift.cashierName ||
      `${shift.cashier?.firstName || ''} ${shift.cashier?.lastName || ''}`.trim(),
    openedAt: shift.openedAt,
    status: shift.status,
    expectedCash: shift.currentBalance?.cash || 0,
    cardTotal: shift.currentBalance?.card || 0,
    bankTotal: shift.currentBalance?.other || 0,
    transactionCount: shift.transactionCounts?.total || 0,
    openingBalance: shift.openingBalance?.cash || 0
  }))

  const summary = {
    totalShifts: shifts.length,
    totalExpectedCash: shifts.reduce((sum, s) => sum + s.expectedCash, 0),
    totalCard: shifts.reduce((sum, s) => sum + s.cardTotal, 0),
    totalBank: shifts.reduce((sum, s) => sum + s.bankTotal, 0)
  }

  res.json({
    success: true,
    data: {
      summary,
      shifts
    }
  })
})

/**
 * Close cashier shifts
 * POST /api/hotels/:hotelId/night-audit/cashier/close
 */
export const closeCashierShifts = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { shifts } = req.body // Array of { shiftId, actualCash, discrepancyNote }

  const audit = await NightAudit.getCurrentAudit(hotelId)
  if (!audit) {
    throw new NotFoundError('Aktif audit bulunamadi')
  }

  const records = []
  let totalCash = 0
  let totalCard = 0
  let totalBank = 0
  let totalDiscrepancy = 0

  // FIX: Batch query instead of N+1 - fetch all shifts in single query
  const shiftIds = shifts.map(s => s.shiftId).filter(Boolean)
  const cashRegisters = await CashRegister.find({ _id: { $in: shiftIds } }).lean()

  // Create maps for O(1) lookup
  const shiftMap = new Map(cashRegisters.map(s => [s._id.toString(), s]))
  const inputMap = new Map(shifts.map(s => [s.shiftId?.toString(), s]))

  // Prepare bulk operations for closing shifts
  const bulkOps = []
  const closedAt = new Date()
  const closedBy = req.user._id

  for (const shift of cashRegisters) {
    const item = inputMap.get(shift._id.toString())
    if (!item) continue

    const expectedCash = shift.currentBalance?.cash || 0
    const actualCash = item.actualCash || 0
    const discrepancy = actualCash - expectedCash

    // Prepare bulk update for closing the shift
    bulkOps.push({
      updateOne: {
        filter: { _id: shift._id },
        update: {
          $set: {
            status: 'closed',
            closedAt,
            closedBy,
            closingBalance: {
              cash: actualCash,
              card: shift.currentBalance?.card || 0,
              other: shift.currentBalance?.other || 0
            },
            actualCash,
            expectedCash,
            discrepancy
          }
        }
      }
    })

    records.push({
      shift: shift._id,
      shiftNumber: shift.shiftNumber,
      cashierName: shift.cashierName,
      openedAt: shift.openedAt,
      expectedCash,
      actualCash,
      discrepancy,
      cardTotal: shift.currentBalance?.card || 0,
      bankTotal: shift.currentBalance?.other || 0,
      transactionCount: shift.transactionCounts?.total || 0,
      status: 'closed',
      closedAt,
      closedBy,
      discrepancyNote: item.discrepancyNote
    })

    totalCash += actualCash
    totalCard += shift.currentBalance?.card || 0
    totalBank += shift.currentBalance?.other || 0
    totalDiscrepancy += Math.abs(discrepancy)
  }

  // Execute all shift closures in a single bulk operation
  if (bulkOps.length > 0) {
    await CashRegister.bulkWrite(bulkOps)
  }

  // Update audit
  audit.cashierReconciliation = {
    completed: true,
    completedAt: new Date(),
    completedBy: req.user._id,
    totalShifts: records.length,
    closedCount: records.length,
    totalCash,
    totalCard,
    totalBank,
    totalDiscrepancy,
    shifts: records
  }
  audit.currentStep = 5

  await audit.save()

  // Emit WebSocket event for real-time updates
  emitAuditEvent(hotelId, 'step-complete', {
    auditId: audit._id,
    step: 4,
    stepName: 'cashierReconciliation',
    currentStep: 5,
    audit
  })

  res.json({
    success: true,
    data: audit
  })
})
