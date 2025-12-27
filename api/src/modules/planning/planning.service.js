import RoomType from './roomType.model.js'
import MealPlan from './mealPlan.model.js'
import Market from './market.model.js'
import Season from './season.model.js'
import Rate from './rate.model.js'
// RateOverride removed - now using daily Rate model directly
import Campaign from './campaign.model.js'
import Hotel from '../hotel/hotel.model.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import logger from '../../core/logger.js'
import { getRoomTypeFileUrl, deleteRoomTypeFile } from '../../helpers/roomTypeUpload.js'
import { parsePricingCommand } from '../../services/geminiService.js'

// Get partner ID from request
const getPartnerId = (req) => {
	if (req.user.accountType === 'partner') {
		return req.user.accountId
	}
	if (req.partnerId) {
		return req.partnerId
	}
	return null
}

// Verify hotel belongs to partner
const verifyHotelOwnership = async (hotelId, partnerId) => {
	const hotel = await Hotel.findById(hotelId)
	if (!hotel) {
		throw new NotFoundError('HOTEL_NOT_FOUND')
	}
	if (hotel.partner.toString() !== partnerId.toString()) {
		throw new ForbiddenError('FORBIDDEN')
	}
	return hotel
}

// ==================== ROOM TYPES ====================

export const getRoomTypes = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const { status } = req.query
	const filter = { partner: partnerId, hotel: hotelId }
	if (status) filter.status = status

	const roomTypes = await RoomType.find(filter).sort('displayOrder')

	res.json({ success: true, data: roomTypes })
})

export const getRoomType = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.findOne({ _id: id, hotel: hotelId, partner: partnerId })
	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	res.json({ success: true, data: roomType })
})

export const createRoomType = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.create({
		...req.body,
		partner: partnerId,
		hotel: hotelId
	})

	logger.info(`RoomType created: ${roomType.code} for hotel ${hotelId}`)

	res.status(201).json({
		success: true,
		message: req.t('ROOM_TYPE_CREATED'),
		data: roomType
	})
})

export const updateRoomType = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		req.body,
		{ new: true, runValidators: true }
	)

	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('ROOM_TYPE_UPDATED'),
		data: roomType
	})
})

export const deleteRoomType = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Check if room type has rates
	const rateCount = await Rate.countDocuments({ roomType: id })
	if (rateCount > 0) {
		throw new BadRequestError('ROOM_TYPE_HAS_RATES')
	}

	const roomType = await RoomType.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('ROOM_TYPE_DELETED')
	})
})

export const updateRoomTypeStatus = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params
	const { status } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!['draft', 'active', 'inactive'].includes(status)) throw new BadRequestError('INVALID_STATUS')

	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		{ status },
		{ new: true }
	)

	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('STATUS_UPDATED'),
		data: roomType
	})
})

export const reorderRoomTypes = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { ids } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(ids)) throw new BadRequestError('INVALID_IDS')

	await verifyHotelOwnership(hotelId, partnerId)

	// Update order for each room type
	await Promise.all(ids.map((id, index) =>
		RoomType.updateOne(
			{ _id: id, hotel: hotelId, partner: partnerId },
			{ displayOrder: index }
		)
	))

	res.json({
		success: true,
		message: req.t('ORDER_UPDATED')
	})
})

// ==================== ROOM TYPE IMAGES ====================

export const uploadRoomTypeImage = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, roomTypeId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!req.file) throw new BadRequestError('FILE_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.findOne({
		_id: roomTypeId,
		hotel: hotelId,
		partner: partnerId
	})

	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	const fileUrl = getRoomTypeFileUrl(partnerId, hotelId, roomTypeId, req.file.filename)

	// Add image to room type
	const newImage = {
		url: fileUrl,
		caption: req.body.caption ? JSON.parse(req.body.caption) : {},
		order: roomType.images.length,
		isMain: roomType.images.length === 0 // First image is main by default
	}

	roomType.images.push(newImage)
	await roomType.save()

	logger.info(`Image uploaded for room type ${roomTypeId}`)

	res.json({
		success: true,
		message: req.t('IMAGE_UPLOADED'),
		data: roomType.images[roomType.images.length - 1]
	})
})

export const deleteRoomTypeImage = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, roomTypeId, imageId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.findOne({
		_id: roomTypeId,
		hotel: hotelId,
		partner: partnerId
	})

	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	const imageIndex = roomType.images.findIndex(img => img._id.toString() === imageId)
	if (imageIndex === -1) throw new NotFoundError('IMAGE_NOT_FOUND')

	const image = roomType.images[imageIndex]

	// Delete file from disk
	try {
		const filename = image.url.split('/').pop()
		deleteRoomTypeFile(partnerId, hotelId, roomTypeId, filename)
	} catch (err) {
		logger.warn(`Failed to delete room type image file: ${err.message}`)
	}

	// Remove from array
	const wasMain = image.isMain
	roomType.images.splice(imageIndex, 1)

	// If deleted image was main, set first image as main
	if (wasMain && roomType.images.length > 0) {
		roomType.images[0].isMain = true
	}

	await roomType.save()

	logger.info(`Image deleted from room type ${roomTypeId}`)

	res.json({
		success: true,
		message: req.t('IMAGE_DELETED')
	})
})

export const reorderRoomTypeImages = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, roomTypeId } = req.params
	const { imageIds } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(imageIds)) throw new BadRequestError('INVALID_IMAGE_IDS')

	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.findOne({
		_id: roomTypeId,
		hotel: hotelId,
		partner: partnerId
	})

	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	// Reorder images based on imageIds array
	const newOrder = []
	for (let i = 0; i < imageIds.length; i++) {
		const img = roomType.images.find(img => img._id.toString() === imageIds[i])
		if (img) {
			img.order = i
			newOrder.push(img)
		}
	}

	roomType.images = newOrder
	await roomType.save()

	res.json({
		success: true,
		message: req.t('ORDER_UPDATED'),
		data: roomType.images
	})
})

export const setRoomTypeMainImage = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, roomTypeId, imageId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.findOne({
		_id: roomTypeId,
		hotel: hotelId,
		partner: partnerId
	})

	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	const image = roomType.images.find(img => img._id.toString() === imageId)
	if (!image) throw new NotFoundError('IMAGE_NOT_FOUND')

	// Reset all isMain flags and set the selected one
	roomType.images.forEach(img => {
		img.isMain = img._id.toString() === imageId
	})

	await roomType.save()

	res.json({
		success: true,
		message: req.t('MAIN_IMAGE_SET'),
		data: roomType.images
	})
})

// ==================== MEAL PLANS ====================

export const getStandardMealPlans = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

	const mealPlans = await MealPlan.findStandardByPartner(partnerId)

	res.json({ success: true, data: mealPlans })
})

export const getMealPlans = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Only return hotel-specific meal plans (not standard partner-wide ones)
	const mealPlans = await MealPlan.find({
		partner: partnerId,
		hotel: hotelId,
		status: 'active'
	}).sort('displayOrder')

	res.json({ success: true, data: mealPlans })
})

export const createMealPlan = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const mealPlan = await MealPlan.create({
		...req.body,
		partner: partnerId,
		hotel: hotelId,
		isStandard: false
	})

	logger.info(`MealPlan created: ${mealPlan.code} for hotel ${hotelId}`)

	res.status(201).json({
		success: true,
		message: req.t('MEAL_PLAN_CREATED'),
		data: mealPlan
	})
})

export const updateMealPlan = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Don't allow updating standard plans
	const existing = await MealPlan.findById(id)
	if (existing?.isStandard) throw new BadRequestError('CANNOT_UPDATE_STANDARD_PLAN')

	const mealPlan = await MealPlan.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		req.body,
		{ new: true, runValidators: true }
	)

	if (!mealPlan) throw new NotFoundError('MEAL_PLAN_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('MEAL_PLAN_UPDATED'),
		data: mealPlan
	})
})

export const deleteMealPlan = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params
	const { deleteRates } = req.query // ?deleteRates=true to also delete rates

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Check if meal plan has rates
	const rateCount = await Rate.countDocuments({ mealPlan: id })

	if (rateCount > 0) {
		if (deleteRates === 'true') {
			// Delete all rates for this meal plan
			const deleteResult = await Rate.deleteMany({ mealPlan: id, hotel: hotelId, partner: partnerId })
			logger.info(`Deleted ${deleteResult.deletedCount} rates for meal plan ${id}`)
		} else {
			throw new BadRequestError('MEAL_PLAN_HAS_RATES')
		}
	}

	// Only delete hotel-specific plans (hotel must match)
	const mealPlan = await MealPlan.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
	if (!mealPlan) throw new NotFoundError('MEAL_PLAN_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('MEAL_PLAN_DELETED'),
		data: { deletedRates: rateCount }
	})
})

// Initialize standard meal plans for a partner (legacy - not used anymore)
export const initStandardMealPlans = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

	const standardPlans = MealPlan.getStandardPlans()
	const created = []

	for (const plan of standardPlans) {
		const existing = await MealPlan.findOne({
			partner: partnerId,
			hotel: null,
			code: plan.code,
			isStandard: true
		})

		if (!existing) {
			const newPlan = await MealPlan.create({
				...plan,
				partner: partnerId,
				hotel: null
			})
			created.push(newPlan)
		}
	}

	res.json({
		success: true,
		message: req.t('STANDARD_PLANS_INITIALIZED'),
		data: { created: created.length }
	})
})

// Add selected standard meal plans to a hotel (creates hotel-specific copies)
export const addStandardMealPlansToHotel = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { codes } = req.body // Array of standard plan codes to add: ['RO', 'BB', 'HB', etc.]

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(codes) || codes.length === 0) throw new BadRequestError('CODES_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	const standardPlans = MealPlan.getStandardPlans()
	const created = []
	const skipped = []

	for (const code of codes) {
		// Find the standard plan template
		const template = standardPlans.find(p => p.code === code.toUpperCase())
		if (!template) {
			skipped.push({ code, reason: 'NOT_FOUND' })
			continue
		}

		// Check if this hotel already has a meal plan with this code
		const existing = await MealPlan.findOne({
			partner: partnerId,
			hotel: hotelId,
			code: code.toUpperCase()
		})

		if (existing) {
			skipped.push({ code, reason: 'ALREADY_EXISTS' })
			continue
		}

		// Create hotel-specific copy of the standard plan
		const newPlan = await MealPlan.create({
			...template,
			partner: partnerId,
			hotel: hotelId,
			isStandard: false // This is a copy, not the original standard
		})
		created.push(newPlan)
	}

	logger.info(`Added ${created.length} standard meal plans to hotel ${hotelId}`)

	res.status(201).json({
		success: true,
		message: req.t('MEAL_PLANS_ADDED'),
		data: {
			created: created.length,
			skipped: skipped.length,
			plans: created
		}
	})
})

// ==================== MARKETS ====================

export const getMarkets = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const markets = await Market.findByHotel(hotelId)

	res.json({ success: true, data: markets })
})

export const getMarket = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const market = await Market.findOne({ _id: id, hotel: hotelId, partner: partnerId })
	if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

	res.json({ success: true, data: market })
})

export const createMarket = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const market = await Market.create({
		...req.body,
		partner: partnerId,
		hotel: hotelId
	})

	logger.info(`Market created: ${market.code} for hotel ${hotelId}`)

	res.status(201).json({
		success: true,
		message: req.t('MARKET_CREATED'),
		data: market
	})
})

export const updateMarket = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const market = await Market.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		req.body,
		{ new: true, runValidators: true }
	)

	if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('MARKET_UPDATED'),
		data: market
	})
})

export const deleteMarket = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Check if market has rates
	const rateCount = await Rate.countDocuments({ market: id })
	if (rateCount > 0) throw new BadRequestError('MARKET_HAS_RATES')

	const market = await Market.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
	if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('MARKET_DELETED')
	})
})

export const setDefaultMarket = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const market = await Market.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		{ isDefault: true },
		{ new: true }
	)

	if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('DEFAULT_MARKET_SET'),
		data: market
	})
})

// Get countries already assigned to markets (excluding given market)
export const getAssignedCountries = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { excludeMarketId } = req.query

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Find all markets for this hotel
	const query = { hotel: hotelId, partner: partnerId }
	if (excludeMarketId) {
		query._id = { $ne: excludeMarketId }
	}

	const markets = await Market.find(query).select('countries code name')

	// Collect all assigned countries with their market info
	const assignedCountries = {}
	markets.forEach(market => {
		market.countries.forEach(country => {
			assignedCountries[country] = {
				marketId: market._id,
				marketCode: market.code,
				marketName: market.name
			}
		})
	})

	res.json({ success: true, data: assignedCountries })
})

// ==================== SEASONS ====================

export const getSeasons = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { market: marketId } = req.query

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Market is now required for seasons
	if (!marketId) {
		throw new BadRequestError('MARKET_REQUIRED')
	}

	// Verify market belongs to this hotel
	const market = await Market.findOne({ _id: marketId, hotel: hotelId, partner: partnerId })
	if (!market) {
		throw new NotFoundError('MARKET_NOT_FOUND')
	}

	const seasons = await Season.findByMarket(hotelId, marketId)

	res.json({ success: true, data: seasons })
})

export const getSeason = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const season = await Season.findOne({ _id: id, hotel: hotelId, partner: partnerId })
	if (!season) throw new NotFoundError('SEASON_NOT_FOUND')

	res.json({ success: true, data: season })
})

export const createSeason = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { market: marketId } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Market is required for seasons
	if (!marketId) {
		throw new BadRequestError('MARKET_REQUIRED')
	}

	// Verify market belongs to this hotel
	const market = await Market.findOne({ _id: marketId, hotel: hotelId, partner: partnerId })
	if (!market) {
		throw new NotFoundError('MARKET_NOT_FOUND')
	}

	const season = await Season.create({
		...req.body,
		partner: partnerId,
		hotel: hotelId,
		market: marketId
	})

	logger.info(`Season created: ${season.code} for hotel ${hotelId}, market ${market.code}`)

	res.status(201).json({
		success: true,
		message: req.t('SEASON_CREATED'),
		data: season
	})
})

export const updateSeason = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const season = await Season.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		req.body,
		{ new: true, runValidators: true }
	)

	if (!season) throw new NotFoundError('SEASON_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('SEASON_UPDATED'),
		data: season
	})
})

export const deleteSeason = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Check if season has rates
	const rateCount = await Rate.countDocuments({ season: id })
	if (rateCount > 0) throw new BadRequestError('SEASON_HAS_RATES')

	const season = await Season.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
	if (!season) throw new NotFoundError('SEASON_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('SEASON_DELETED')
	})
})

// ==================== RATES ====================

export const getRates = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const { roomType, mealPlan, market, startDate, endDate, status } = req.query
	const filters = { roomType, mealPlan, market, startDate, endDate, status }

	const rates = await Rate.findByHotel(hotelId, filters)
		.populate('roomType', 'name code')
		.populate('mealPlan', 'name code')
		.populate('market', 'name code currency')
		.populate('season', 'name code color')

	res.json({ success: true, data: rates })
})

export const getRatesCalendar = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const { startDate, endDate, roomType, mealPlan, market } = req.query

	if (!startDate || !endDate) {
		throw new BadRequestError('DATE_RANGE_REQUIRED')
	}

	// Fetch daily rates directly (no more separate overrides table)
	const rates = await Rate.findInRange(hotelId, startDate, endDate, {
		roomType, mealPlan, market
	})

	res.json({
		success: true,
		data: {
			rates,
			overrides: [] // Empty for backward compatibility - no longer used
		}
	})
})

/**
 * Get price list with periods
 * Groups consecutive days with same values into periods for display
 */
export const getRatesPriceList = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const { roomType, market, mealPlan } = req.query

	// Room type and market are required
	if (!roomType) throw new BadRequestError('ROOM_TYPE_REQUIRED')
	if (!market) throw new BadRequestError('MARKET_REQUIRED')

	// Use getPeriodsView to get dynamically grouped periods
	const periods = await Rate.getPeriodsView(hotelId, {
		roomType,
		market,
		mealPlan
	})

	// Group by meal plan for the response format
	const mealPlanGroups = {}
	periods.forEach(period => {
		if (!period.mealPlan) return
		const mpId = period.mealPlan._id.toString()
		if (!mealPlanGroups[mpId]) {
			mealPlanGroups[mpId] = {
				mealPlan: period.mealPlan,
				periods: []
			}
		}
		mealPlanGroups[mpId].periods.push({
			_id: period._id,
			startDate: period.startDate,
			endDate: period.endDate,
			pricePerNight: period.pricePerNight,
			currency: period.currency,
			minStay: period.minStay,
			maxStay: period.maxStay,
			releaseDays: period.releaseDays,
			allotment: period.allotment,
			stopSale: period.stopSale,
			singleStop: period.singleStop,
			closedToArrival: period.closedToArrival,
			closedToDeparture: period.closedToDeparture,
			extraAdult: period.extraAdult,
			extraChild: period.extraChild,
			extraInfant: period.extraInfant,
			singleSupplement: period.singleSupplement,
			childOrderPricing: period.childOrderPricing
		})
	})

	res.json({ success: true, data: Object.values(mealPlanGroups) })
})

export const getRate = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const rate = await Rate.findOne({ _id: id, hotel: hotelId, partner: partnerId })
		.populate('roomType', 'name code')
		.populate('mealPlan', 'name code')
		.populate('market', 'name code currency')
		.populate('season', 'name code color')

	if (!rate) throw new NotFoundError('RATE_NOT_FOUND')

	res.json({ success: true, data: rate })
})

export const createRate = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const { startDate, endDate, ...rateData } = req.body

	// Daily rate model: if startDate/endDate provided, create rate for each day
	if (startDate && endDate) {
		const baseData = {
			...rateData,
			partner: partnerId,
			hotel: hotelId
		}

		const result = await Rate.createForDateRange(baseData, startDate, endDate)

		logger.info(`${result.upsertedCount || 0} daily rates created for hotel ${hotelId}`)

		res.status(201).json({
			success: true,
			message: req.t('RATE_CREATED'),
			data: { created: result.upsertedCount || 0, modified: result.modifiedCount || 0 }
		})
	} else if (req.body.date) {
		// Single date rate
		const rate = await Rate.create({
			...req.body,
			partner: partnerId,
			hotel: hotelId
		})

		logger.info(`Rate created for hotel ${hotelId}`)

		res.status(201).json({
			success: true,
			message: req.t('RATE_CREATED'),
			data: rate
		})
	} else {
		throw new BadRequestError('REQUIRED_DATE_OR_RANGE')
	}
})

export const updateRate = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const rate = await Rate.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		req.body,
		{ new: true, runValidators: true }
	)

	if (!rate) throw new NotFoundError('RATE_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('RATE_UPDATED'),
		data: rate
	})
})

export const deleteRate = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const rate = await Rate.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
	if (!rate) throw new NotFoundError('RATE_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('RATE_DELETED')
	})
})

// Bulk create rates
export const bulkCreateRates = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { rates } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(rates) || rates.length === 0) throw new BadRequestError('RATES_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	const ratesToCreate = rates.map(rate => ({
		...rate,
		partner: partnerId,
		hotel: hotelId
	}))

	const created = await Rate.insertMany(ratesToCreate, { ordered: false })

	logger.info(`Bulk created ${created.length} rates for hotel ${hotelId}`)

	res.status(201).json({
		success: true,
		message: req.t('RATES_CREATED'),
		data: { count: created.length }
	})
})

// Bulk update rates
export const bulkUpdateRates = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { updates, filters } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const result = await Rate.bulkUpdateRates(hotelId, updates, filters)

	logger.info(`Bulk updated rates for hotel ${hotelId}`)

	res.json({
		success: true,
		message: req.t('RATES_UPDATED'),
		data: { modified: result.modifiedCount }
	})
})

// Quick update single rate (multiple fields at once)
export const quickUpdateSingleRate = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params
	const updateData = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Only allow specific fields for quick update
	const allowedFields = ['pricePerNight', 'allotment', 'minStay', 'maxStay', 'stopSale', 'closedToArrival', 'closedToDeparture', 'extraAdult', 'extraChild', 'extraInfant', 'childOrderPricing', 'releaseDays']
	const sanitizedUpdate = {}

	for (const field of allowedFields) {
		if (updateData[field] !== undefined) {
			sanitizedUpdate[field] = updateData[field]
		}
	}

	if (Object.keys(sanitizedUpdate).length === 0) {
		throw new BadRequestError('NO_VALID_FIELDS')
	}

	const rate = await Rate.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		{ $set: sanitizedUpdate },
		{ new: true, runValidators: true }
	)

	if (!rate) throw new NotFoundError('RATE_NOT_FOUND')

	logger.info(`Quick updated rate ${id} for hotel ${hotelId}`)

	res.json({
		success: true,
		message: req.t('RATE_UPDATED'),
		data: rate
	})
})

// Quick update (single field)
export const quickUpdateRates = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { rateIds, field, value } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(rateIds) || !field) throw new BadRequestError('INVALID_PARAMS')

	await verifyHotelOwnership(hotelId, partnerId)

	const allowedFields = ['pricePerNight', 'allotment', 'minStay', 'maxStay', 'stopSale', 'closedToArrival', 'closedToDeparture', 'extraAdult', 'extraChild', 'extraInfant', 'childOrderPricing', 'releaseDays']
	if (!allowedFields.includes(field)) throw new BadRequestError('INVALID_FIELD')

	const result = await Rate.updateMany(
		{ _id: { $in: rateIds }, hotel: hotelId, partner: partnerId },
		{ $set: { [field]: value } }
	)

	res.json({
		success: true,
		message: req.t('RATES_UPDATED'),
		data: { modified: result.modifiedCount }
	})
})

// Toggle stop sale
export const toggleStopSale = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { rateIds, stopSale, reason } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(rateIds)) throw new BadRequestError('INVALID_RATE_IDS')

	await verifyHotelOwnership(hotelId, partnerId)

	const result = await Rate.toggleStopSale(hotelId, rateIds, stopSale, reason)

	res.json({
		success: true,
		message: stopSale ? req.t('STOP_SALE_ENABLED') : req.t('STOP_SALE_DISABLED'),
		data: { modified: result.modifiedCount }
	})
})

// Update allotment
export const updateAllotment = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { rateIds, allotment } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(rateIds) || allotment === undefined) throw new BadRequestError('INVALID_PARAMS')

	await verifyHotelOwnership(hotelId, partnerId)

	const result = await Rate.updateAllotment(hotelId, rateIds, allotment)

	res.json({
		success: true,
		message: req.t('ALLOTMENT_UPDATED'),
		data: { modified: result.modifiedCount }
	})
})

// Bulk update by specific dates (daily rate model - simple upsert)
export const bulkUpdateByDates = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { cells, updateFields, marketId } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(cells) || cells.length === 0) throw new BadRequestError('CELLS_REQUIRED')
	if (!updateFields || Object.keys(updateFields).length === 0) throw new BadRequestError('UPDATE_FIELDS_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	// Get market currency for new rate creation
	let currency = 'EUR' // Default
	if (marketId) {
		const market = await Market.findById(marketId)
		if (market) {
			currency = market.currency || 'EUR'
		}
	}

	// Allowed fields for update
	const allowedFields = ['pricePerNight', 'allotment', 'minStay', 'maxStay', 'stopSale', 'singleStop', 'closedToArrival', 'closedToDeparture', 'extraAdult', 'extraChild', 'extraInfant', 'childOrderPricing', 'releaseDays', 'singleSupplement']
	const sanitizedUpdate = {}
	for (const field of allowedFields) {
		if (updateFields[field] !== undefined) {
			sanitizedUpdate[field] = updateFields[field]
		}
	}

	// Build bulk upsert operations for daily rates
	const ratesToUpsert = []
	for (const cell of cells) {
		// Parse date string and create UTC date at midnight
		const [year, month, day] = cell.date.split('-').map(Number)
		const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))

		ratesToUpsert.push({
			partner: partnerId,
			hotel: hotelId,
			roomType: cell.roomTypeId,
			mealPlan: cell.mealPlanId,
			market: marketId,
			date: targetDate,
			currency: currency,
			pricePerNight: sanitizedUpdate.pricePerNight ?? 0,
			allotment: sanitizedUpdate.allotment ?? 10,
			minStay: sanitizedUpdate.minStay ?? 1,
			maxStay: sanitizedUpdate.maxStay ?? 30,
			status: 'active',
			source: 'bulk',
			...sanitizedUpdate
		})
	}

	// Execute bulk upsert
	const bulkResult = await Rate.bulkUpsert(ratesToUpsert)

	logger.info(`Bulk update: ${bulkResult.upsertedCount} created, ${bulkResult.modifiedCount} updated`)

	res.json({
		success: true,
		message: req.t('RATES_UPDATED'),
		data: {
			created: bulkResult.upsertedCount || 0,
			updated: bulkResult.modifiedCount || 0,
			total: ratesToUpsert.length
		}
	})
})

// ==================== CAMPAIGNS ====================

export const getCampaigns = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const { status, type } = req.query
	const filter = { partner: partnerId, hotel: hotelId }
	if (status) filter.status = status
	if (type) filter.type = type

	const campaigns = await Campaign.find(filter)
		.populate('conditions.applicableRoomTypes', 'name code')
		.populate('conditions.applicableMarkets', 'name code')
		.populate('conditions.applicableMealPlans', 'name code')
		.sort('displayOrder')

	res.json({ success: true, data: campaigns })
})

export const getCampaign = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const campaign = await Campaign.findOne({ _id: id, hotel: hotelId, partner: partnerId })
		.populate('conditions.applicableRoomTypes', 'name code')
		.populate('conditions.applicableMarkets', 'name code')
		.populate('conditions.applicableMealPlans', 'name code')

	if (!campaign) throw new NotFoundError('CAMPAIGN_NOT_FOUND')

	res.json({ success: true, data: campaign })
})

export const createCampaign = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const campaign = await Campaign.create({
		...req.body,
		partner: partnerId,
		hotel: hotelId
	})

	logger.info(`Campaign created: ${campaign.code} for hotel ${hotelId}`)

	res.status(201).json({
		success: true,
		message: req.t('CAMPAIGN_CREATED'),
		data: campaign
	})
})

export const updateCampaign = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const campaign = await Campaign.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		req.body,
		{ new: true, runValidators: true }
	)

	if (!campaign) throw new NotFoundError('CAMPAIGN_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('CAMPAIGN_UPDATED'),
		data: campaign
	})
})

export const deleteCampaign = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const campaign = await Campaign.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
	if (!campaign) throw new NotFoundError('CAMPAIGN_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('CAMPAIGN_DELETED')
	})
})

export const updateCampaignStatus = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params
	const { status } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!['draft', 'active', 'inactive', 'expired'].includes(status)) throw new BadRequestError('INVALID_STATUS')

	await verifyHotelOwnership(hotelId, partnerId)

	const campaign = await Campaign.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		{ status },
		{ new: true }
	)

	if (!campaign) throw new NotFoundError('CAMPAIGN_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('STATUS_UPDATED'),
		data: campaign
	})
})

// ==================== AI PRICING ASSISTANT ====================

/**
 * Parse natural language pricing command with AI
 */
export const parseAIPricingCommand = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { command, currentMonth, selectionContext } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!command) throw new BadRequestError('COMMAND_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	// Get context data for AI
	logger.info(`AI Query params - hotelId: ${hotelId}, partnerId: ${partnerId}`)
	logger.info(`AI currentMonth received: ${JSON.stringify(currentMonth)}`)
	if (selectionContext) {
		logger.info(`AI selectionContext received: ${JSON.stringify(selectionContext)}`)
	}

	const [roomTypes, mealPlans, markets, seasons] = await Promise.all([
		RoomType.find({ hotel: hotelId, partner: partnerId }).select('code name status').lean(),
		MealPlan.find({ $or: [{ hotel: hotelId }, { hotel: null, isStandard: true }], partner: partnerId, status: 'active' }).select('code name').lean(),
		Market.find({ hotel: hotelId, partner: partnerId, status: 'active' }).select('code name currency').lean(),
		Season.find({ hotel: hotelId, partner: partnerId, status: 'active' }).select('code name dateRanges').lean()
	])

	logger.info(`AI Query results - roomTypes: ${roomTypes.length}, mealPlans: ${mealPlans.length}, markets: ${markets.length}, seasons: ${seasons.length}`)
	if (seasons.length > 0) {
		logger.info(`AI Seasons data: ${JSON.stringify(seasons)}`)
	}

	const context = {
		roomTypes: roomTypes.map(rt => ({
			code: rt.code,
			name: rt.name?.tr || rt.name?.en || rt.code,
			status: rt.status
		})),
		mealPlans: mealPlans.map(mp => ({ code: mp.code, name: mp.name?.tr || mp.name?.en || mp.code })),
		markets: markets.map(m => ({ code: m.code, currency: m.currency })),
		seasons: seasons.map(s => ({
			code: s.code,
			name: s.name?.tr || s.name?.en || s.code,
			dateRanges: s.dateRanges
		})),
		currentMonth: currentMonth || null,
		selectionContext: selectionContext || null
	}

	const result = await parsePricingCommand(command, context)

	// If successful, estimate affected rates count
	if (result.success && result.dateRange) {
		const filter = {
			hotel: hotelId,
			partner: partnerId,
			date: {
				$gte: new Date(result.dateRange.startDate),
				$lte: new Date(result.dateRange.endDate)
			}
		}

		// Apply room type filter
		if (result.filters?.roomTypes !== 'all' && Array.isArray(result.filters?.roomTypes)) {
			const rtIds = await RoomType.find({
				hotel: hotelId,
				code: { $in: result.filters.roomTypes }
			}).select('_id')
			filter.roomType = { $in: rtIds.map(r => r._id) }
		}

		// Apply meal plan filter
		if (result.filters?.mealPlans !== 'all' && Array.isArray(result.filters?.mealPlans)) {
			const mpIds = await MealPlan.find({
				$or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
				code: { $in: result.filters.mealPlans }
			}).select('_id')
			filter.mealPlan = { $in: mpIds.map(m => m._id) }
		}

		// Apply market filter
		if (result.filters?.markets !== 'all' && Array.isArray(result.filters?.markets)) {
			const mIds = await Market.find({
				hotel: hotelId,
				code: { $in: result.filters.markets }
			}).select('_id')
			filter.market = { $in: mIds.map(m => m._id) }
		}

		result.affectedCount = await Rate.countDocuments(filter)
	}

	res.json({ success: true, data: result })
})

/**
 * Execute parsed AI pricing command
 */
export const executeAIPricingCommand = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { parsedCommand } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!parsedCommand || !parsedCommand.success) throw new BadRequestError('VALID_COMMAND_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	const { dateRange, rateIds, selectedCells } = parsedCommand

	// If rateIds are provided (from selected cells), use direct ID-based update
	const useDirectIds = Array.isArray(rateIds) && rateIds.length > 0

	logger.info(`AI Execute: useDirectIds=${useDirectIds}, rateIds=${rateIds?.length || 0}, selectedCells=${selectedCells?.length || 0}`)

	// Support both old format (single action) and new format (actions array)
	const actions = parsedCommand.actions || [{
		action: parsedCommand.action,
		filters: parsedCommand.filters,
		value: parsedCommand.value,
		valueType: parsedCommand.valueType,
		reason: parsedCommand.reason,
		childIndex: parsedCommand.childIndex
	}]

	// Helper to check if a date falls on specified days of week
	const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
	const matchesDayOfWeek = (date, daysOfWeek) => {
		if (!daysOfWeek || daysOfWeek === 'all') return true
		if (!Array.isArray(daysOfWeek)) return true
		// Normalize numeric values to strings
		const normalizedDays = daysOfWeek.map(d => typeof d === 'number' ? dayNames[d] : d)
		const dayName = dayNames[new Date(date).getDay()]
		return normalizedDays.includes(dayName)
	}

	// Helper to get all dates matching daysOfWeek filter
	const getMatchingDates = (startDate, endDate, daysOfWeek) => {
		const dates = []
		const start = new Date(startDate)
		const end = new Date(endDate)
		start.setUTCHours(0, 0, 0, 0)
		end.setUTCHours(0, 0, 0, 0)

		for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
			if (matchesDayOfWeek(d, daysOfWeek)) {
				dates.push(new Date(d))
			}
		}
		return dates
	}

	// Check if daysOfWeek filter is active
	const hasDayFilter = (daysOfWeek) => {
		return daysOfWeek && daysOfWeek !== 'all' && Array.isArray(daysOfWeek)
	}

	// Normalize daysOfWeek: convert numeric values to string names
	const numToDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
	const normalizeDaysOfWeek = (daysOfWeek) => {
		if (!Array.isArray(daysOfWeek)) return daysOfWeek
		return daysOfWeek.map(d => typeof d === 'number' ? numToDay[d] : d)
	}

	let totalAffected = 0

	// Execute each action
	for (const act of actions) {
		const { action, filters, value, valueType, reason, childIndex } = act

		// Build filter for rates (using single 'date' field, not startDate/endDate!)
		const rateFilter = {
			hotel: hotelId,
			partner: partnerId
		}

		// Apply room type filter
		if (filters?.roomTypes !== 'all' && Array.isArray(filters?.roomTypes)) {
			const rtIds = await RoomType.find({
				hotel: hotelId,
				code: { $in: filters.roomTypes }
			}).select('_id')
			rateFilter.roomType = { $in: rtIds.map(r => r._id) }
		}

		// Apply meal plan filter
		if (filters?.mealPlans !== 'all' && Array.isArray(filters?.mealPlans)) {
			const mpIds = await MealPlan.find({
				$or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
				code: { $in: filters.mealPlans }
			}).select('_id')
			rateFilter.mealPlan = { $in: mpIds.map(m => m._id) }
		}

		// Apply market filter
		if (filters?.markets !== 'all' && Array.isArray(filters?.markets)) {
			const mIds = await Market.find({
				hotel: hotelId,
				code: { $in: filters.markets }
			}).select('_id')
			rateFilter.market = { $in: mIds.map(m => m._id) }
		}

		let updateResult
		let updateData = {}

		// Helper function to build date filter for Rate queries
		const buildDateFilter = (startDate, endDate, daysOfWeek) => {
			if (hasDayFilter(daysOfWeek)) {
				const matchingDates = getMatchingDates(startDate, endDate, daysOfWeek)
				return { $in: matchingDates }
			}
			return {
				$gte: new Date(startDate),
				$lte: new Date(endDate)
			}
		}

		switch (action) {
			case 'stop_sale':
			case 'open_sale': {
				const isStopSale = action === 'stop_sale'

				// Use direct IDs if available
				if (useDirectIds) {
					updateResult = await Rate.updateMany(
						{ _id: { $in: rateIds }, hotel: hotelId, partner: partnerId },
						{
							$set: {
								stopSale: isStopSale,
								stopSaleReason: isStopSale ? (reason || '') : '',
								source: 'ai',
								aiCommand: action
							}
						}
					)
				} else {
					rateFilter.date = buildDateFilter(dateRange.startDate, dateRange.endDate, filters?.daysOfWeek)
					updateResult = await Rate.updateMany(rateFilter, {
						$set: {
							stopSale: isStopSale,
							stopSaleReason: isStopSale ? (reason || '') : '',
							source: 'ai',
							aiCommand: action
						}
					})
				}
				logger.info(`${action}: updated ${updateResult.modifiedCount} rates (directIds=${useDirectIds})`)
				break
			}

			case 'single_stop':
			case 'open_single': {
				const isSingleStop = action === 'single_stop'

				if (useDirectIds) {
					updateResult = await Rate.updateMany(
						{ _id: { $in: rateIds }, hotel: hotelId, partner: partnerId },
						{
							$set: {
								singleStop: isSingleStop,
								source: 'ai',
								aiCommand: action
							}
						}
					)
				} else {
					rateFilter.date = buildDateFilter(dateRange.startDate, dateRange.endDate, filters?.daysOfWeek)
					updateResult = await Rate.updateMany(rateFilter, {
						$set: {
							singleStop: isSingleStop,
							source: 'ai',
							aiCommand: action
						}
					})
				}
				logger.info(`${action}: updated ${updateResult.modifiedCount} rates (directIds=${useDirectIds})`)
				break
			}

			case 'update_allotment':
				updateData = { allotment: value }
				break

			case 'update_min_stay':
				updateData = { minStay: value }
				break

			case 'update_max_stay':
				updateData = { maxStay: value }
				break

			case 'close_to_arrival':
			case 'close_to_departure': {
				const fieldName = action === 'close_to_arrival' ? 'closedToArrival' : 'closedToDeparture'
				const fieldValue = value === true || value === 'true'

				if (useDirectIds) {
					updateResult = await Rate.updateMany(
						{ _id: { $in: rateIds }, hotel: hotelId, partner: partnerId },
						{
							$set: {
								[fieldName]: fieldValue,
								source: 'ai',
								aiCommand: action
							}
						}
					)
				} else {
					rateFilter.date = buildDateFilter(dateRange.startDate, dateRange.endDate, filters?.daysOfWeek)
					updateResult = await Rate.updateMany(rateFilter, {
						$set: {
							[fieldName]: fieldValue,
							source: 'ai',
							aiCommand: action
						}
					})
				}
				logger.info(`${action}: updated ${updateResult.modifiedCount} rates (directIds=${useDirectIds})`)
				break
			}

			case 'set_price': {
				// Create or update daily rates
				// Get all combinations of roomType × mealPlan × market
				const roomTypeFilter = filters?.roomTypes !== 'all' && Array.isArray(filters?.roomTypes)
					? { hotel: hotelId, code: { $in: filters.roomTypes } }
					: { hotel: hotelId }
				const roomTypesForPrice = await RoomType.find(roomTypeFilter).select('_id code').lean()

				const mealPlanFilter = filters?.mealPlans !== 'all' && Array.isArray(filters?.mealPlans)
					? { $or: [{ hotel: hotelId }, { hotel: null, isStandard: true }], code: { $in: filters.mealPlans } }
					: { $or: [{ hotel: hotelId }, { hotel: null, isStandard: true }], status: 'active' }
				const mealPlansForPrice = await MealPlan.find(mealPlanFilter).select('_id code').lean()

				const marketFilter = filters?.markets !== 'all' && Array.isArray(filters?.markets)
					? { hotel: hotelId, code: { $in: filters.markets } }
					: { hotel: hotelId, status: 'active' }
				const marketsForPrice = await Market.find(marketFilter).select('_id code currency').lean()

				// Get all dates to process
				const datesToProcess = getMatchingDates(dateRange.startDate, dateRange.endDate, filters?.daysOfWeek)
				logger.info(`set_price: ${datesToProcess.length} dates to process`)

				// Build bulk upsert records
				const ratesToUpsert = []
				for (const date of datesToProcess) {
					for (const rt of roomTypesForPrice) {
						for (const mp of mealPlansForPrice) {
							for (const market of marketsForPrice) {
								ratesToUpsert.push({
									partner: partnerId,
									hotel: hotelId,
									roomType: rt._id,
									mealPlan: mp._id,
									market: market._id,
									date: date,
									pricePerNight: value,
									currency: market.currency || 'EUR',
									allotment: 10,
									minStay: 1,
									maxStay: 30,
									status: 'active',
									source: 'ai',
									aiCommand: action
								})
							}
						}
					}
				}

				if (ratesToUpsert.length > 0) {
					const bulkResult = await Rate.bulkUpsert(ratesToUpsert)
					updateResult = { modifiedCount: bulkResult.modifiedCount + bulkResult.upsertedCount }
					logger.info(`set_price: upserted ${ratesToUpsert.length} rates`)
				} else {
					updateResult = { modifiedCount: 0 }
				}
				break
			}

			case 'update_price': {
				// Update existing rates with new price (absolute or percentage)
				rateFilter.date = buildDateFilter(dateRange.startDate, dateRange.endDate, filters?.daysOfWeek)

				if (valueType === 'percentage') {
					// Percentage update - need to calculate new price for each rate
					const rates = await Rate.find(rateFilter)
					let updated = 0
					for (const rate of rates) {
						const newPrice = Math.round(rate.pricePerNight * (1 + value / 100))
						await Rate.findByIdAndUpdate(rate._id, {
							pricePerNight: newPrice,
							source: 'ai',
							aiCommand: 'update_price'
						})
						updated++
					}
					updateResult = { modifiedCount: updated }
					logger.info(`update_price (percentage): updated ${updated} rates`)
				} else {
					// Absolute value - bulk update
					updateResult = await Rate.updateMany(rateFilter, {
						$set: {
							pricePerNight: value,
							source: 'ai',
							aiCommand: 'update_price'
						}
					})
					logger.info(`update_price (absolute): updated ${updateResult.modifiedCount} rates`)
				}
				break
			}

			case 'set_supplement': {
				// Set meal plan supplement - calculate actual price based on RO (base) price
				// Find the meal plan codes to apply supplement
				const supplementMealPlanCodes = filters?.mealPlans !== 'all' && Array.isArray(filters?.mealPlans)
					? filters.mealPlans
					: []

				if (supplementMealPlanCodes.length === 0) {
					logger.warn('set_supplement: No meal plan codes specified')
					break
				}

				// Get meal plan IDs
				const supplementMealPlans = await MealPlan.find({
					$or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
					code: { $in: supplementMealPlanCodes }
				}).select('_id code').lean()

				// Get RO (Room Only) meal plan as base
				const roMealPlan = await MealPlan.findOne({
					$or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
					code: 'RO'
				}).select('_id').lean()

				if (!roMealPlan) {
					logger.warn('set_supplement: RO meal plan not found')
					break
				}

				let supplementUpdated = 0

				// Get room type filter
				const rtFilter = filters?.roomTypes !== 'all' && Array.isArray(filters?.roomTypes)
					? { hotel: hotelId, code: { $in: filters.roomTypes } }
					: { hotel: hotelId }
				const roomTypesForSupplement = await RoomType.find(rtFilter).select('_id').lean()

				// Get market filter
				const mktFilter = filters?.markets !== 'all' && Array.isArray(filters?.markets)
					? { hotel: hotelId, code: { $in: filters.markets } }
					: { hotel: hotelId, status: 'active' }
				const marketsForSupplement = await Market.find(mktFilter).select('_id').lean()

				// For each room type and market, find RO rate and apply supplement to target meal plans
				for (const rt of roomTypesForSupplement) {
					for (const market of marketsForSupplement) {
						// Find the RO (base) rate
						const roRate = await Rate.findOne({
							hotel: hotelId,
							partner: partnerId,
							roomType: rt._id,
							mealPlan: roMealPlan._id,
							market: market._id,
							startDate: { $lte: new Date(dateRange.endDate) },
							endDate: { $gte: new Date(dateRange.startDate) }
						})

						if (!roRate) continue

						const basePrice = roRate.pricePerNight

						// Apply supplement to each target meal plan
						for (const mp of supplementMealPlans) {
							let newPrice
							if (valueType === 'percentage') {
								newPrice = Math.round(basePrice * (1 + value / 100))
							} else {
								newPrice = basePrice + value
							}

							// Find and update the rate for this meal plan
							const targetRate = await Rate.findOne({
								hotel: hotelId,
								partner: partnerId,
								roomType: rt._id,
								mealPlan: mp._id,
								market: market._id,
								startDate: { $lte: new Date(dateRange.endDate) },
								endDate: { $gte: new Date(dateRange.startDate) }
							})

							if (targetRate) {
								await Rate.findByIdAndUpdate(targetRate._id, { pricePerNight: newPrice })
								supplementUpdated++
							}
						}
					}
				}

				updateResult = { modifiedCount: supplementUpdated }
				logger.info(`set_supplement: updated ${supplementUpdated} rates with ${valueType === 'percentage' ? value + '%' : value + ' TL'} supplement`)
				break
			}

			case 'update_single_supplement':
				// Update single room supplement
				if (valueType === 'percentage') {
					const rates = await Rate.find(rateFilter)
					let updated = 0
					for (const rate of rates) {
						const currentSupplement = rate.singleSupplement || 0
						const newSupplement = Math.round(currentSupplement * (1 + value / 100))
						await Rate.findByIdAndUpdate(rate._id, { singleSupplement: newSupplement })
						updated++
					}
					updateResult = { modifiedCount: updated }
				} else {
					// Set absolute value
					updateData = { singleSupplement: value }
				}
				break

			case 'update_extra_adult':
				if (valueType === 'percentage') {
					const rates = await Rate.find(rateFilter)
					let updated = 0
					for (const rate of rates) {
						if (!matchesDayOfWeek(rate.date, filters?.daysOfWeek)) continue
						const current = rate.extraAdult || 0
						const newValue = Math.round(current * (1 + value / 100))
						await Rate.findByIdAndUpdate(rate._id, { extraAdult: newValue })
						updated++
					}
					updateResult = { modifiedCount: updated }
				} else {
					updateData = { extraAdult: value }
				}
				break

			case 'update_extra_child':
				if (valueType === 'percentage') {
					const rates = await Rate.find(rateFilter)
					let updated = 0
					for (const rate of rates) {
						if (!matchesDayOfWeek(rate.date, filters?.daysOfWeek)) continue
						const current = rate.extraChild || 0
						const newValue = Math.round(current * (1 + value / 100))
						await Rate.findByIdAndUpdate(rate._id, { extraChild: newValue })
						updated++
					}
					updateResult = { modifiedCount: updated }
				} else {
					updateData = { extraChild: value }
				}
				break

			case 'update_extra_infant':
				if (valueType === 'percentage') {
					const rates = await Rate.find(rateFilter)
					let updated = 0
					for (const rate of rates) {
						if (!matchesDayOfWeek(rate.date, filters?.daysOfWeek)) continue
						const current = rate.extraInfant || 0
						const newValue = Math.round(current * (1 + value / 100))
						await Rate.findByIdAndUpdate(rate._id, { extraInfant: newValue })
						updated++
					}
					updateResult = { modifiedCount: updated }
				} else {
					updateData = { extraInfant: value }
				}
				break

			case 'update_child_free': {
				// Make Nth child free by setting their price to 0
				const rates = await Rate.find(rateFilter)
				let updated = 0
				for (const rate of rates) {
					if (!matchesDayOfWeek(rate.date, filters?.daysOfWeek)) continue
					const childPricing = rate.childPricing || []
					const idx = (childIndex || 1) - 1
					if (childPricing[idx]) {
						childPricing[idx].price = 0
					}
					await Rate.findByIdAndUpdate(rate._id, { childPricing })
					updated++
				}
				updateResult = { modifiedCount: updated }
				break
			}

			default:
				logger.warn(`Unknown AI action: ${action}`)
				continue // Skip unknown actions instead of throwing
		}

		// If we have updateData, do bulk update
		if (Object.keys(updateData).length > 0) {
			// Use direct IDs if available
			if (useDirectIds) {
				updateResult = await Rate.updateMany(
					{ _id: { $in: rateIds }, hotel: hotelId, partner: partnerId },
					{ $set: { ...updateData, source: 'ai', aiCommand: action } }
				)
				logger.info(`updateData with directIds: updated ${updateResult.modifiedCount} rates`)
			} else {
				// Always add date filter if not already set
				if (!rateFilter.date) {
					rateFilter.date = buildDateFilter(dateRange.startDate, dateRange.endDate, filters?.daysOfWeek)
				}

				if (filters?.daysOfWeek && filters.daysOfWeek !== 'all' && Array.isArray(filters.daysOfWeek)) {
					// Need to filter by day of week - iterate through rates
					const rates = await Rate.find(rateFilter)
					let updated = 0
					for (const rate of rates) {
						if (matchesDayOfWeek(rate.date, filters.daysOfWeek)) {
							await Rate.findByIdAndUpdate(rate._id, { $set: updateData })
							updated++
						}
					}
					updateResult = { modifiedCount: updated }
				} else {
					updateResult = await Rate.updateMany(rateFilter, { $set: updateData })
				}
			}
		}

		const affected = updateResult?.modifiedCount || 0
		totalAffected += affected
		logger.info(`AI action executed for hotel ${hotelId}: ${action}, affected: ${affected}`)
	}

	res.json({
		success: true,
		message: req.t('AI_COMMAND_EXECUTED'),
		data: {
			actionsExecuted: actions.length,
			affected: totalAffected
		}
	})
})
