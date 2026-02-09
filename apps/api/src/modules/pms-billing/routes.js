import express from 'express'
import * as cashierService from './cashier.service.js'
import nightAuditRoutes from './nightAudit.routes.js'
import { protect, requirePmsAccess, setPmsHotelContext } from '#middleware/auth.js'

const router = express.Router()

const hotelMiddleware = [protect, requirePmsAccess, setPmsHotelContext]

// ===========================================
// CASHIER / POS ROUTES
// ===========================================

// --- Shift Management ---

// Get cashier statistics dashboard
router.get('/hotels/:hotelId/cashier/stats', hotelMiddleware, cashierService.getCashierStats)

// Get transaction types and categories (for dropdowns)
router.get('/hotels/:hotelId/cashier/types', hotelMiddleware, cashierService.getTransactionTypes)

// Get daily summary
router.get(
  '/hotels/:hotelId/cashier/daily-summary',
  hotelMiddleware,
  cashierService.getDailySummary
)

// Get daily summary by currency (multi-currency)
router.get(
  '/hotels/:hotelId/cashier/daily-summary-by-currency',
  hotelMiddleware,
  cashierService.getDailySummaryByCurrency
)

// Get available currencies and exchange rates
router.get('/hotels/:hotelId/cashier/currencies', hotelMiddleware, cashierService.getCurrencies)

// Get active shift
router.get('/hotels/:hotelId/cashier/shifts/active', hotelMiddleware, cashierService.getActiveShift)

// Get all shifts
router.get('/hotels/:hotelId/cashier/shifts', hotelMiddleware, cashierService.getShifts)

// Get single shift
router.get('/hotels/:hotelId/cashier/shifts/:shiftId', hotelMiddleware, cashierService.getShift)

// Open new shift
router.post('/hotels/:hotelId/cashier/shifts', hotelMiddleware, cashierService.openShift)
router.post('/hotels/:hotelId/cashier/shifts/open', hotelMiddleware, cashierService.openShift) // Alias

// Close shift
router.post(
  '/hotels/:hotelId/cashier/shifts/:shiftId/close',
  hotelMiddleware,
  cashierService.closeShift
)

// Add cash movement to shift
router.post(
  '/hotels/:hotelId/cashier/shifts/:shiftId/movements',
  hotelMiddleware,
  cashierService.addCashMovement
)

// --- Transaction Management ---

// Get all transactions
router.get('/hotels/:hotelId/cashier/transactions', hotelMiddleware, cashierService.getTransactions)

// Create transaction
router.post(
  '/hotels/:hotelId/cashier/transactions',
  hotelMiddleware,
  cashierService.createTransaction
)

// Void transaction
router.post(
  '/hotels/:hotelId/cashier/transactions/:transactionId/void',
  hotelMiddleware,
  cashierService.voidTransaction
)

// Refund transaction
router.post(
  '/hotels/:hotelId/cashier/transactions/:transactionId/refund',
  hotelMiddleware,
  cashierService.refundTransaction
)

// ===========================================
// NIGHT AUDIT ROUTES
// ===========================================

router.use('/hotels/:hotelId/night-audit', hotelMiddleware, nightAuditRoutes)

export default router
