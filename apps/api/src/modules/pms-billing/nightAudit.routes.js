/**
 * Night Audit Routes
 * API endpoints for end-of-day audit process
 */

import express from 'express'
import {
  startAudit,
  getCurrentAudit,
  getPreAuditChecks,
  completePreAuditCheck,
  getNoShows,
  processNoShows,
  getRoomCharges,
  postRoomCharges,
  getCashierData,
  closeCashierShifts,
  getAuditSummary,
  completeAudit,
  getAuditHistory,
  getAuditById,
  cancelAudit,
  downloadReport
} from './nightAudit.service.js'

const router = express.Router({ mergeParams: true })

// Start/Get audit
router.post('/start', startAudit)
router.get('/current', getCurrentAudit)
router.get('/status', getCurrentAudit) // Alias for /current

// Step 1: Pre-audit check
router.get('/pre-check', getPreAuditChecks)
router.post('/pre-check/complete', completePreAuditCheck)

// Step 2: No-show processing
router.get('/no-shows', getNoShows)
router.post('/no-shows/process', processNoShows)

// Step 3: Room charge posting
router.get('/room-charges', getRoomCharges)
router.post('/room-charges/post', postRoomCharges)

// Step 4: Cashier reconciliation
router.get('/cashier', getCashierData)
router.post('/cashier/close', closeCashierShifts)

// Step 5: Reports & close
router.get('/summary', getAuditSummary)
router.post('/complete', completeAudit)

// History & details
router.get('/history', getAuditHistory)
router.get('/:auditId', getAuditById)
router.post('/:auditId/cancel', cancelAudit)

// Reports
router.get('/:auditId/reports/:reportType', downloadReport)

export default router
