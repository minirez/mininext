/**
 * Night Audit Service
 * Business logic for end-of-day audit process
 *
 * This is a barrel file that re-exports all night audit service modules
 */

// Core operations (start, get current, cancel)
export {
  emitAuditEvent,
  startAudit,
  getCurrentAudit,
  cancelAudit
} from './nightAuditCore.service.js'

// Pre-audit checks
export { getPreAuditChecks, completePreAuditCheck } from './nightAuditPreCheck.service.js'

// No-show processing
export { getNoShows, processNoShows } from './nightAuditNoShow.service.js'

// Room charge posting
export { getRoomCharges, postRoomCharges } from './nightAuditCharges.service.js'

// Cashier reconciliation
export { getCashierData, closeCashierShifts } from './nightAuditCashier.service.js'

// Summary and completion
export { getAuditSummary, completeAudit } from './nightAuditComplete.service.js'

// History and reports
export { getAuditHistory, getAuditById, downloadReport } from './nightAuditHistory.service.js'
