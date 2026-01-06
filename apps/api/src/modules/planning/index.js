/**
 * Planning Module Index
 * Re-exports all planning-related services for backward compatibility
 */

// Room Types
export {
  getRoomTypes,
  getRoomType,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  updateRoomTypeStatus,
  reorderRoomTypes,
  setBaseRoom,
  updateRoomTypePriceAdjustment,
  importRoomTypesFromBase,
  uploadRoomTypeImage,
  deleteRoomTypeImage,
  reorderRoomTypeImages,
  setRoomTypeMainImage
} from './roomTypes.service.js'

// Meal Plans
export {
  getStandardMealPlans,
  getMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  setBaseMealPlan,
  updateMealPlanPriceAdjustment,
  initStandardMealPlans,
  addStandardMealPlansToHotel
} from './mealPlans.service.js'

// Markets
export {
  getMarkets,
  getMarket,
  createMarket,
  updateMarket,
  deleteMarket,
  setDefaultMarket,
  getAssignedCountries
} from './markets.service.js'

// Seasons
export {
  getSeasons,
  getSeason,
  createSeason,
  updateSeason,
  deleteSeason
} from './seasons.service.js'

// Rates
export {
  getRates,
  getRatesCalendar,
  getRatesPriceList,
  getRate,
  createRate,
  updateRate,
  deleteRate,
  bulkCreateRates,
  bulkUpdateRates,
  quickUpdateSingleRate,
  quickUpdateRates,
  toggleStopSale,
  updateAllotment,
  bulkUpdateByDates
} from './rates.service.js'

// Campaigns
export {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  updateCampaignStatus
} from './campaigns.service.js'

// AI Pricing, Contract Import, Pricing Calculation, Cache Management
// These are still in the main planning.service.js for now
export {
  parseAIPricingCommand,
  executeAIPricingCommand,
  parseContract,
  importContractPricing,
  deleteMarketPricingData,
  calculateRatePrice,
  calculatePriceByQuery,
  bulkCalculatePrices,
  checkPricingAvailability,
  getEffectiveRateEndpoint,
  getEffectiveMultipliers,
  getCombinationTable,
  getEffectiveChildAgeGroups,
  calculatePriceWithCampaigns,
  getApplicableCampaigns,
  getCacheStats,
  clearCache,
  invalidateCache
} from './planning.service.js'
