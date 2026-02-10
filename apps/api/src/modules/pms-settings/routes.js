import express from 'express'
import { protect, requirePmsAccess, setPmsHotelContext } from '#middleware/auth.js'
import { partnerContext } from '#middleware/partnerContext.js'
import * as settingsService from './settings.service.js'
import * as agencyService from '#modules/agency/agency.service.js'

const router = express.Router()

const hotelMiddleware = [protect, requirePmsAccess, setPmsHotelContext]
const pmsAuth = [protect, requirePmsAccess, partnerContext]

// Utility endpoints (static data)
router.get('/timezones', protect, settingsService.getTimezones)
router.get('/currencies', protect, settingsService.getCurrencies)

// Get all settings for hotel
router.get('/hotels/:hotelId/settings', hotelMiddleware, settingsService.getSettings)

// Update all settings
router.put('/hotels/:hotelId/settings', hotelMiddleware, settingsService.updateAllSettings)

// Reset settings
router.post('/hotels/:hotelId/settings/reset', hotelMiddleware, settingsService.resetSettings)

// Section-specific updates
router.put(
  '/hotels/:hotelId/settings/general',
  hotelMiddleware,
  settingsService.updateGeneralSettings
)
router.put(
  '/hotels/:hotelId/settings/front-desk',
  hotelMiddleware,
  settingsService.updateFrontDeskSettings
)
router.put('/hotels/:hotelId/settings/taxes', hotelMiddleware, settingsService.updateTaxSettings)
router.put(
  '/hotels/:hotelId/settings/invoicing',
  hotelMiddleware,
  settingsService.updateInvoicingSettings
)
router.put(
  '/hotels/:hotelId/settings/housekeeping',
  hotelMiddleware,
  settingsService.updateHousekeepingSettings
)
router.put(
  '/hotels/:hotelId/settings/cashier',
  hotelMiddleware,
  settingsService.updateCashierSettings
)
router.put(
  '/hotels/:hotelId/settings/notifications',
  hotelMiddleware,
  settingsService.updateNotificationSettings
)
router.put(
  '/hotels/:hotelId/settings/reservations',
  hotelMiddleware,
  settingsService.updateReservationSettings
)
router.put('/hotels/:hotelId/settings/guests', hotelMiddleware, settingsService.updateGuestSettings)
router.put(
  '/hotels/:hotelId/settings/exchange',
  hotelMiddleware,
  settingsService.updateExchangeSettings
)
router.put('/hotels/:hotelId/settings/kbs', hotelMiddleware, settingsService.updateKbsSettings)

// Utility: Generate invoice/receipt numbers
router.post(
  '/hotels/:hotelId/settings/invoice-number',
  hotelMiddleware,
  settingsService.getNextInvoiceNumber
)
router.post(
  '/hotels/:hotelId/settings/receipt-number',
  hotelMiddleware,
  settingsService.getNextReceiptNumber
)

// ===========================================
// AGENCY ROUTES (delegated to agency module)
// Partner-level, no hotel context needed
// ===========================================

router.get('/agencies', pmsAuth, agencyService.getAgencies)
router.get('/agencies/:id', pmsAuth, agencyService.getAgency)
router.post('/agencies', pmsAuth, agencyService.createAgency)
router.put('/agencies/:id', pmsAuth, agencyService.updateAgency)
router.delete('/agencies/:id', pmsAuth, agencyService.deleteAgency)

export default router
