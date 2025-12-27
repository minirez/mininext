import apiClient from './api'

const BASE_URL = '/planning'

// ==================== ROOM TYPES ====================

const getRoomTypes = async (hotelId, params = {}) => {
	try {
		const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/room-types`, { params })
		return response.data
	} catch (error) {
		console.error('Planning Service: Get room types failed', error.response?.data || error.message)
		throw error
	}
}

const getRoomType = async (hotelId, id) => {
	try {
		const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/room-types/${id}`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Get room type failed', error.response?.data || error.message)
		throw error
	}
}

const createRoomType = async (hotelId, data) => {
	try {
		const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/room-types`, data)
		return response.data
	} catch (error) {
		console.error('Planning Service: Create room type failed', error.response?.data || error.message)
		throw error
	}
}

const updateRoomType = async (hotelId, id, data) => {
	try {
		const response = await apiClient.put(`${BASE_URL}/hotels/${hotelId}/room-types/${id}`, data)
		return response.data
	} catch (error) {
		console.error('Planning Service: Update room type failed', error.response?.data || error.message)
		throw error
	}
}

const deleteRoomType = async (hotelId, id) => {
	try {
		const response = await apiClient.delete(`${BASE_URL}/hotels/${hotelId}/room-types/${id}`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Delete room type failed', error.response?.data || error.message)
		throw error
	}
}

const updateRoomTypeStatus = async (hotelId, id, status) => {
	try {
		const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/room-types/${id}/status`, { status })
		return response.data
	} catch (error) {
		console.error('Planning Service: Update room type status failed', error.response?.data || error.message)
		throw error
	}
}

const reorderRoomTypes = async (hotelId, ids) => {
	try {
		const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/room-types/reorder`, { ids })
		return response.data
	} catch (error) {
		console.error('Planning Service: Reorder room types failed', error.response?.data || error.message)
		throw error
	}
}

// ==================== ROOM TYPE IMAGES ====================

const uploadRoomTypeImage = async (hotelId, roomTypeId, file, caption = null) => {
	try {
		const formData = new FormData()
		formData.append('image', file)
		if (caption) {
			formData.append('caption', JSON.stringify(caption))
		}
		const response = await apiClient.post(
			`${BASE_URL}/hotels/${hotelId}/room-types/${roomTypeId}/images`,
			formData,
			{ headers: { 'Content-Type': 'multipart/form-data' } }
		)
		return response.data
	} catch (error) {
		console.error('Planning Service: Upload room type image failed', error.response?.data || error.message)
		throw error
	}
}

const deleteRoomTypeImage = async (hotelId, roomTypeId, imageId) => {
	try {
		const response = await apiClient.delete(`${BASE_URL}/hotels/${hotelId}/room-types/${roomTypeId}/images/${imageId}`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Delete room type image failed', error.response?.data || error.message)
		throw error
	}
}

const reorderRoomTypeImages = async (hotelId, roomTypeId, imageIds) => {
	try {
		const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/room-types/${roomTypeId}/images/reorder`, { imageIds })
		return response.data
	} catch (error) {
		console.error('Planning Service: Reorder room type images failed', error.response?.data || error.message)
		throw error
	}
}

const setRoomTypeMainImage = async (hotelId, roomTypeId, imageId) => {
	try {
		const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/room-types/${roomTypeId}/images/${imageId}/main`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Set room type main image failed', error.response?.data || error.message)
		throw error
	}
}

// ==================== MEAL PLANS ====================

const getStandardMealPlans = async () => {
	try {
		const response = await apiClient.get(`${BASE_URL}/meal-plans/standard`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Get standard meal plans failed', error.response?.data || error.message)
		throw error
	}
}

const initStandardMealPlans = async () => {
	try {
		const response = await apiClient.post(`${BASE_URL}/meal-plans/init-standard`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Init standard meal plans failed', error.response?.data || error.message)
		throw error
	}
}

const getMealPlans = async (hotelId) => {
	try {
		const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/meal-plans`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Get meal plans failed', error.response?.data || error.message)
		throw error
	}
}

const createMealPlan = async (hotelId, data) => {
	try {
		const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/meal-plans`, data)
		return response.data
	} catch (error) {
		console.error('Planning Service: Create meal plan failed', error.response?.data || error.message)
		throw error
	}
}

const updateMealPlan = async (hotelId, id, data) => {
	try {
		const response = await apiClient.put(`${BASE_URL}/hotels/${hotelId}/meal-plans/${id}`, data)
		return response.data
	} catch (error) {
		console.error('Planning Service: Update meal plan failed', error.response?.data || error.message)
		throw error
	}
}

const deleteMealPlan = async (hotelId, id, deleteRates = true) => {
	try {
		const params = deleteRates ? { deleteRates: 'true' } : {}
		const response = await apiClient.delete(`${BASE_URL}/hotels/${hotelId}/meal-plans/${id}`, { params })
		return response.data
	} catch (error) {
		console.error('Planning Service: Delete meal plan failed', error.response?.data || error.message)
		throw error
	}
}

const addStandardMealPlansToHotel = async (hotelId, codes) => {
	try {
		const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/meal-plans/add-standard`, { codes })
		return response.data
	} catch (error) {
		console.error('Planning Service: Add standard meal plans failed', error.response?.data || error.message)
		throw error
	}
}

const getAvailableStandardMealPlans = () => {
	// Returns the standard meal plan templates (static data)
	return [
		{
			code: 'RO',
			name: { tr: 'Sadece Oda', en: 'Room Only', de: 'Nur Zimmer', ru: 'Только номер' },
			description: { tr: 'Konaklama ücretine yemek dahil değildir', en: 'Accommodation only, no meals included' },
			includedMeals: {},
			displayOrder: 1
		},
		{
			code: 'BB',
			name: { tr: 'Oda Kahvaltı', en: 'Bed & Breakfast', de: 'Übernachtung mit Frühstück', ru: 'Завтрак включен' },
			description: { tr: 'Konaklama ve kahvaltı dahil', en: 'Accommodation with breakfast included' },
			includedMeals: { breakfast: true },
			displayOrder: 2
		},
		{
			code: 'HB',
			name: { tr: 'Yarım Pansiyon', en: 'Half Board', de: 'Halbpension', ru: 'Полупансион' },
			description: { tr: 'Kahvaltı ve akşam yemeği dahil', en: 'Breakfast and dinner included' },
			includedMeals: { breakfast: true, dinner: true },
			displayOrder: 3
		},
		{
			code: 'FB',
			name: { tr: 'Tam Pansiyon', en: 'Full Board', de: 'Vollpension', ru: 'Полный пансион' },
			description: { tr: 'Kahvaltı, öğle ve akşam yemeği dahil', en: 'Breakfast, lunch and dinner included' },
			includedMeals: { breakfast: true, lunch: true, dinner: true },
			displayOrder: 4
		},
		{
			code: 'AI',
			name: { tr: 'Her Şey Dahil', en: 'All Inclusive', de: 'All Inclusive', ru: 'Все включено' },
			description: { tr: 'Tüm yemekler ve yerli içecekler dahil', en: 'All meals and local drinks included' },
			includedMeals: { breakfast: true, lunch: true, dinner: true, snacks: true, drinks: true },
			displayOrder: 5
		},
		{
			code: 'UAI',
			name: { tr: 'Ultra Her Şey Dahil', en: 'Ultra All Inclusive', de: 'Ultra All Inclusive', ru: 'Ультра все включено' },
			description: { tr: 'Tüm yemekler, içecekler, alkollü içecekler ve oda servisi dahil', en: 'All meals, drinks, alcoholic beverages and room service included' },
			includedMeals: { breakfast: true, lunch: true, dinner: true, snacks: true, drinks: true, alcoholicDrinks: true, minibar: true, roomService: true },
			displayOrder: 6
		}
	]
}

// ==================== MARKETS ====================

const getMarkets = async (hotelId) => {
	try {
		const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/markets`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Get markets failed', error.response?.data || error.message)
		throw error
	}
}

const getMarket = async (hotelId, id) => {
	try {
		const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/markets/${id}`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Get market failed', error.response?.data || error.message)
		throw error
	}
}

const createMarket = async (hotelId, data) => {
	try {
		const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/markets`, data)
		return response.data
	} catch (error) {
		console.error('Planning Service: Create market failed', error.response?.data || error.message)
		throw error
	}
}

const updateMarket = async (hotelId, id, data) => {
	try {
		const response = await apiClient.put(`${BASE_URL}/hotels/${hotelId}/markets/${id}`, data)
		return response.data
	} catch (error) {
		console.error('Planning Service: Update market failed', error.response?.data || error.message)
		throw error
	}
}

const deleteMarket = async (hotelId, id) => {
	try {
		const response = await apiClient.delete(`${BASE_URL}/hotels/${hotelId}/markets/${id}`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Delete market failed', error.response?.data || error.message)
		throw error
	}
}

const setDefaultMarket = async (hotelId, id) => {
	try {
		const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/markets/${id}/default`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Set default market failed', error.response?.data || error.message)
		throw error
	}
}

const getAssignedCountries = async (hotelId, excludeMarketId = null) => {
	try {
		const params = excludeMarketId ? { excludeMarketId } : {}
		const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/markets/assigned-countries`, { params })
		return response.data
	} catch (error) {
		console.error('Planning Service: Get assigned countries failed', error.response?.data || error.message)
		throw error
	}
}

// ==================== SEASONS ====================

const getSeasons = async (hotelId, marketId) => {
	try {
		const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/seasons`, {
			params: { market: marketId }
		})
		return response.data
	} catch (error) {
		console.error('Planning Service: Get seasons failed', error.response?.data || error.message)
		throw error
	}
}

const getSeason = async (hotelId, id) => {
	try {
		const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/seasons/${id}`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Get season failed', error.response?.data || error.message)
		throw error
	}
}

const createSeason = async (hotelId, data) => {
	try {
		const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/seasons`, data)
		return response.data
	} catch (error) {
		console.error('Planning Service: Create season failed', error.response?.data || error.message)
		throw error
	}
}

const updateSeason = async (hotelId, id, data) => {
	try {
		const response = await apiClient.put(`${BASE_URL}/hotels/${hotelId}/seasons/${id}`, data)
		return response.data
	} catch (error) {
		console.error('Planning Service: Update season failed', error.response?.data || error.message)
		throw error
	}
}

const deleteSeason = async (hotelId, id) => {
	try {
		const response = await apiClient.delete(`${BASE_URL}/hotels/${hotelId}/seasons/${id}`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Delete season failed', error.response?.data || error.message)
		throw error
	}
}

// ==================== RATES ====================

const getRates = async (hotelId, params = {}) => {
	try {
		const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/rates`, { params })
		return response.data
	} catch (error) {
		console.error('Planning Service: Get rates failed', error.response?.data || error.message)
		throw error
	}
}

const getRatesCalendar = async (hotelId, params = {}) => {
	try {
		const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/rates/calendar`, { params })
		return response.data
	} catch (error) {
		console.error('Planning Service: Get rates calendar failed', error.response?.data || error.message)
		throw error
	}
}

const getRatesPriceList = async (hotelId, params = {}) => {
	try {
		const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/rates/price-list`, { params })
		return response.data
	} catch (error) {
		console.error('Planning Service: Get rates price list failed', error.response?.data || error.message)
		throw error
	}
}

const getRate = async (hotelId, id) => {
	try {
		const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/rates/${id}`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Get rate failed', error.response?.data || error.message)
		throw error
	}
}

const createRate = async (hotelId, data) => {
	try {
		const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/rates`, data)
		return response.data
	} catch (error) {
		console.error('Planning Service: Create rate failed', error.response?.data || error.message)
		throw error
	}
}

const updateRate = async (hotelId, id, data) => {
	try {
		const response = await apiClient.put(`${BASE_URL}/hotels/${hotelId}/rates/${id}`, data)
		return response.data
	} catch (error) {
		console.error('Planning Service: Update rate failed', error.response?.data || error.message)
		throw error
	}
}

const deleteRate = async (hotelId, id) => {
	try {
		const response = await apiClient.delete(`${BASE_URL}/hotels/${hotelId}/rates/${id}`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Delete rate failed', error.response?.data || error.message)
		throw error
	}
}

const bulkCreateRates = async (hotelId, rates) => {
	try {
		const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/rates/bulk`, { rates })
		return response.data
	} catch (error) {
		console.error('Planning Service: Bulk create rates failed', error.response?.data || error.message)
		throw error
	}
}

const bulkUpdateRates = async (hotelId, updates, filters) => {
	try {
		const response = await apiClient.put(`${BASE_URL}/hotels/${hotelId}/rates/bulk`, { updates, filters })
		return response.data
	} catch (error) {
		console.error('Planning Service: Bulk update rates failed', error.response?.data || error.message)
		throw error
	}
}

const quickUpdateRates = async (hotelId, rateIds, field, value) => {
	try {
		const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/rates/quick-update`, { rateIds, field, value })
		return response.data
	} catch (error) {
		console.error('Planning Service: Quick update rates failed', error.response?.data || error.message)
		throw error
	}
}

const quickUpdateRate = async (hotelId, rateId, data) => {
	try {
		const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/rates/${rateId}/quick`, data)
		return response.data
	} catch (error) {
		console.error('Planning Service: Quick update rate failed', error.response?.data || error.message)
		throw error
	}
}

const toggleStopSale = async (hotelId, rateIds, stopSale, reason = '') => {
	try {
		const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/rates/stop-sale`, { rateIds, stopSale, reason })
		return response.data
	} catch (error) {
		console.error('Planning Service: Toggle stop sale failed', error.response?.data || error.message)
		throw error
	}
}

const updateAllotment = async (hotelId, rateIds, allotment) => {
	try {
		const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/rates/allotment`, { rateIds, allotment })
		return response.data
	} catch (error) {
		console.error('Planning Service: Update allotment failed', error.response?.data || error.message)
		throw error
	}
}

const bulkUpdateByDates = async (hotelId, cells, updateFields, marketId) => {
	try {
		const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/rates/by-dates`, { cells, updateFields, marketId })
		return response.data
	} catch (error) {
		console.error('Planning Service: Bulk update by dates failed', error.response?.data || error.message)
		throw error
	}
}

// ==================== CAMPAIGNS ====================

const getCampaigns = async (hotelId, params = {}) => {
	try {
		const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/campaigns`, { params })
		return response.data
	} catch (error) {
		console.error('Planning Service: Get campaigns failed', error.response?.data || error.message)
		throw error
	}
}

const getCampaign = async (hotelId, id) => {
	try {
		const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/campaigns/${id}`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Get campaign failed', error.response?.data || error.message)
		throw error
	}
}

const createCampaign = async (hotelId, data) => {
	try {
		const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/campaigns`, data)
		return response.data
	} catch (error) {
		console.error('Planning Service: Create campaign failed', error.response?.data || error.message)
		throw error
	}
}

const updateCampaign = async (hotelId, id, data) => {
	try {
		const response = await apiClient.put(`${BASE_URL}/hotels/${hotelId}/campaigns/${id}`, data)
		return response.data
	} catch (error) {
		console.error('Planning Service: Update campaign failed', error.response?.data || error.message)
		throw error
	}
}

const deleteCampaign = async (hotelId, id) => {
	try {
		const response = await apiClient.delete(`${BASE_URL}/hotels/${hotelId}/campaigns/${id}`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Delete campaign failed', error.response?.data || error.message)
		throw error
	}
}

const updateCampaignStatus = async (hotelId, id, status) => {
	try {
		const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/campaigns/${id}/status`, { status })
		return response.data
	} catch (error) {
		console.error('Planning Service: Update campaign status failed', error.response?.data || error.message)
		throw error
	}
}

// ==================== AI PRICING ASSISTANT ====================

const parseAIPricingCommand = async (hotelId, command, currentMonth = null, selectionContext = null) => {
	try {
		const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/ai/parse-command`, {
			command,
			currentMonth,
			selectionContext
		})
		return response.data
	} catch (error) {
		console.error('Planning Service: Parse AI command failed', error.response?.data || error.message)
		throw error
	}
}

const executeAIPricingCommand = async (hotelId, parsedCommand) => {
	try {
		const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/ai/execute-command`, { parsedCommand })
		return response.data
	} catch (error) {
		console.error('Planning Service: Execute AI command failed', error.response?.data || error.message)
		throw error
	}
}

// ==================== HOTEL ====================

const getHotel = async (hotelId) => {
	try {
		const response = await apiClient.get(`/hotels/${hotelId}`)
		return response.data
	} catch (error) {
		console.error('Planning Service: Get hotel failed', error.response?.data || error.message)
		throw error
	}
}

export default {
	// Hotel
	getHotel,

	// Room Types
	getRoomTypes,
	getRoomType,
	createRoomType,
	updateRoomType,
	deleteRoomType,
	updateRoomTypeStatus,
	reorderRoomTypes,

	// Room Type Images
	uploadRoomTypeImage,
	deleteRoomTypeImage,
	reorderRoomTypeImages,
	setRoomTypeMainImage,

	// Meal Plans
	getStandardMealPlans,
	initStandardMealPlans,
	getMealPlans,
	createMealPlan,
	updateMealPlan,
	deleteMealPlan,
	addStandardMealPlansToHotel,
	getAvailableStandardMealPlans,

	// Markets
	getMarkets,
	getMarket,
	createMarket,
	updateMarket,
	deleteMarket,
	setDefaultMarket,
	getAssignedCountries,

	// Seasons
	getSeasons,
	getSeason,
	createSeason,
	updateSeason,
	deleteSeason,

	// Rates
	getRates,
	getRatesCalendar,
	getRatesPriceList,
	getRate,
	createRate,
	updateRate,
	deleteRate,
	bulkCreateRates,
	bulkUpdateRates,
	quickUpdateRates,
	quickUpdateRate,
	toggleStopSale,
	updateAllotment,
	bulkUpdateByDates,

	// Campaigns
	getCampaigns,
	getCampaign,
	createCampaign,
	updateCampaign,
	deleteCampaign,
	updateCampaignStatus,

	// AI Pricing Assistant
	parseAIPricingCommand,
	executeAIPricingCommand
}
