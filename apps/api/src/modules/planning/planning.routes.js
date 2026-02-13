import express from 'express'
import * as planningService from './planning.service.js'
import { protect, requireAdmin, requirePlatformAdmin } from '#middleware/auth.js'
import { partnerContext } from '#middleware/partnerContext.js'
import { roomTypeUpload } from '#helpers/roomTypeUpload.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(protect)
router.use(requireAdmin)
router.use(partnerContext)

// ==================== MEAL PLANS (Standard - Partner-wide) ====================
router.get('/meal-plans/standard', planningService.getStandardMealPlans)
router.post('/meal-plans/init-standard', planningService.initStandardMealPlans)

// ==================== ROOM TYPES ====================
router.get('/hotels/:hotelId/room-types', planningService.getRoomTypes)
router.get('/hotels/:hotelId/room-types/:id', planningService.getRoomType)
router.post('/hotels/:hotelId/room-types', planningService.createRoomType)
router.put('/hotels/:hotelId/room-types/:id', planningService.updateRoomType)
router.delete('/hotels/:hotelId/room-types/:id', planningService.deleteRoomType)
router.patch('/hotels/:hotelId/room-types/:id/status', planningService.updateRoomTypeStatus)
router.patch('/hotels/:hotelId/room-types/reorder', planningService.reorderRoomTypes)
router.post('/hotels/:hotelId/room-types/import-from-base', planningService.importRoomTypesFromBase)
router.post('/hotels/:hotelId/room-types/:id/set-base', planningService.setBaseRoom)
router.patch(
  '/hotels/:hotelId/room-types/:id/adjustment',
  planningService.updateRoomTypePriceAdjustment
)

// Room Type Image Management
router.post(
  '/hotels/:hotelId/room-types/:roomTypeId/images',
  roomTypeUpload.single('image'),
  planningService.uploadRoomTypeImage
)
router.delete(
  '/hotels/:hotelId/room-types/:roomTypeId/images/:imageId',
  planningService.deleteRoomTypeImage
)
router.patch(
  '/hotels/:hotelId/room-types/:roomTypeId/images/reorder',
  planningService.reorderRoomTypeImages
)
router.patch(
  '/hotels/:hotelId/room-types/:roomTypeId/images/:imageId/main',
  planningService.setRoomTypeMainImage
)

// ==================== MEAL PLANS (Hotel-specific) ====================
router.get('/hotels/:hotelId/meal-plans', planningService.getMealPlans)
router.post('/hotels/:hotelId/meal-plans', planningService.createMealPlan)
router.post('/hotels/:hotelId/meal-plans/add-standard', planningService.addStandardMealPlansToHotel)
router.put('/hotels/:hotelId/meal-plans/:id', planningService.updateMealPlan)
router.delete('/hotels/:hotelId/meal-plans/:id', planningService.deleteMealPlan)
router.post('/hotels/:hotelId/meal-plans/:id/set-base', planningService.setBaseMealPlan)
router.patch(
  '/hotels/:hotelId/meal-plans/:id/adjustment',
  planningService.updateMealPlanPriceAdjustment
)

// ==================== MARKETS ====================
router.get('/hotels/:hotelId/markets', planningService.getMarkets)
router.get('/hotels/:hotelId/markets/assigned-countries', planningService.getAssignedCountries)
router.get('/hotels/:hotelId/markets/:id', planningService.getMarket)
router.post('/hotels/:hotelId/markets', planningService.createMarket)
router.put('/hotels/:hotelId/markets/:id', planningService.updateMarket)
router.delete('/hotels/:hotelId/markets/:id', planningService.deleteMarket)
router.patch('/hotels/:hotelId/markets/:id/default', planningService.setDefaultMarket)

// ==================== SEASONS ====================
router.get('/hotels/:hotelId/seasons', planningService.getSeasons)
router.get('/hotels/:hotelId/seasons/:id', planningService.getSeason)
router.post('/hotels/:hotelId/seasons', planningService.createSeason)
router.put('/hotels/:hotelId/seasons/:id', planningService.updateSeason)
router.delete('/hotels/:hotelId/seasons/:id', planningService.deleteSeason)

// ==================== RATES ====================
router.get('/hotels/:hotelId/rates', planningService.getRates)
router.get('/hotels/:hotelId/rates/calendar', planningService.getRatesCalendar)
router.get('/hotels/:hotelId/rates/price-list', planningService.getRatesPriceList)
router.get('/hotels/:hotelId/rates/forecast', planningService.getForecast)
router.get('/hotels/:hotelId/rates/:id', planningService.getRate)
router.post('/hotels/:hotelId/rates', planningService.createRate)
router.put('/hotels/:hotelId/rates/:id', planningService.updateRate)
router.patch('/hotels/:hotelId/rates/:id/quick', planningService.quickUpdateSingleRate)
router.delete('/hotels/:hotelId/rates/:id', planningService.deleteRate)
router.post('/hotels/:hotelId/rates/bulk', planningService.bulkCreateRates)
router.put('/hotels/:hotelId/rates/bulk', planningService.bulkUpdateRates)
router.patch('/hotels/:hotelId/rates/quick-update', planningService.quickUpdateRates)
router.patch('/hotels/:hotelId/rates/stop-sale', planningService.toggleStopSale)
router.patch('/hotels/:hotelId/rates/allotment', planningService.updateAllotment)
router.patch('/hotels/:hotelId/rates/by-dates', planningService.bulkUpdateByDates)

// ==================== CAMPAIGNS ====================
router.get('/hotels/:hotelId/campaigns', planningService.getCampaigns)
router.get('/hotels/:hotelId/campaigns/:id', planningService.getCampaign)
router.post('/hotels/:hotelId/campaigns', planningService.createCampaign)
router.put('/hotels/:hotelId/campaigns/:id', planningService.updateCampaign)
router.delete('/hotels/:hotelId/campaigns/:id', planningService.deleteCampaign)
router.patch('/hotels/:hotelId/campaigns/:id/status', planningService.updateCampaignStatus)

// ==================== AI PRICING ASSISTANT ====================
router.post('/hotels/:hotelId/ai/parse-command', planningService.parseAIPricingCommand)
router.post('/hotels/:hotelId/ai/execute-command', planningService.executeAIPricingCommand)

// ==================== CONTRACT IMPORT ====================
router.post('/hotels/:hotelId/contract/parse', planningService.parseContract)
router.post('/hotels/:hotelId/contract/import', planningService.importContractPricing)

// ==================== PRICING CALCULATIONS ====================
router.post('/hotels/:hotelId/rates/:rateId/calculate-price', planningService.calculateRatePrice)
router.post('/hotels/:hotelId/pricing/calculate', planningService.calculatePriceByQuery)
router.post('/hotels/:hotelId/pricing/bulk-calculate', planningService.bulkCalculatePrices)
router.post('/hotels/:hotelId/pricing/check-availability', planningService.checkPricingAvailability)
router.get('/hotels/:hotelId/pricing/effective-rate', planningService.getEffectiveRateEndpoint)
router.get(
  '/hotels/:hotelId/pricing/effective-multipliers',
  planningService.getEffectiveMultipliers
)
router.get('/hotels/:hotelId/pricing/combination-table', planningService.getCombinationTable)
router.get('/hotels/:hotelId/pricing/child-age-groups', planningService.getEffectiveChildAgeGroups)
router.post(
  '/hotels/:hotelId/pricing/calculate-with-campaigns',
  planningService.calculatePriceWithCampaigns
)
router.get('/hotels/:hotelId/pricing/applicable-campaigns', planningService.getApplicableCampaigns)

// ==================== PLATFORM ADMIN ONLY ====================
router.delete(
  '/hotels/:hotelId/markets/:marketId/pricing-data',
  requirePlatformAdmin,
  planningService.deleteMarketPricingData
)

// ==================== CACHE MANAGEMENT (Platform Admin) ====================
router.get('/cache/stats', requirePlatformAdmin, planningService.getCacheStats)
router.post('/cache/clear', requirePlatformAdmin, planningService.clearCache)
router.post(
  '/cache/invalidate/:entityType/:entityId',
  requirePlatformAdmin,
  planningService.invalidateCache
)

export default router
