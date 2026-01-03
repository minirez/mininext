/**
 * Booking Service
 * Partner/Admin booking operations with partner context
 * Authenticated endpoints for B2C booking within admin panel
 */

import mongoose from 'mongoose'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import Hotel from '../hotel/hotel.model.js'
import RoomType from '../planning/roomType.model.js'
import MealPlan from '../planning/mealPlan.model.js'
import Market from '../planning/market.model.js'
import Booking from './booking.model.js'
import Guest from '../pms-guest/guest.model.js'
import Stay, { STAY_STATUS, PAYMENT_STATUS } from '../pms-frontdesk/stay.model.js'
import pricingService from '../../services/pricingService.js'
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors.js'
import { emitReservationUpdate, getGuestDisplayName } from '../pms/pmsSocket.js'

// Helper: Get partner ID from request
const getPartnerId = (req) => {
	// Partner user
	if (req.user?.accountType === 'partner') {
		return req.user.accountId
	}
	// Agency user - get partner from agency
	if (req.user?.accountType === 'agency' && req.account?.partner) {
		return req.account.partner._id || req.account.partner
	}
	// Platform admin viewing as partner
	if (req.partnerId) {
		return req.partnerId
	}
	return null
}

// Helper: Get source info for booking
const getSourceInfo = (req) => {
	const source = {
		type: 'admin',
		ipAddress: req.ip,
		userAgent: req.headers['user-agent']
	}

	if (req.user?.accountType === 'agency') {
		source.type = 'b2b'
		source.agencyId = req.user.accountId
		source.agencyName = req.account?.companyName || req.account?.name
		source.agencyUserId = req.user._id
	} else if (req.user?.accountType === 'partner') {
		source.type = 'admin'
	} else if (req.user?.accountType === 'platform') {
		source.type = 'admin'
	}

	return source
}

// Helper: Sanitize guest data before saving
const sanitizeGuest = (guest) => {
	if (!guest) return null
	const sanitized = {
		type: guest.type || 'adult',
		title: guest.title || 'mr',
		firstName: guest.firstName?.trim() || 'Guest',
		lastName: guest.lastName?.trim() || 'Guest',
		nationality: guest.nationality || '',
		isLead: guest.isLead || false
	}
	// Preserve optional fields if they exist
	if (guest.tcNumber) sanitized.tcNumber = guest.tcNumber.trim()
	if (guest.passportNumber) sanitized.passportNumber = guest.passportNumber.trim()
	if (guest.dateOfBirth) sanitized.dateOfBirth = guest.dateOfBirth
	if (guest.age !== undefined) sanitized.age = guest.age
	return sanitized
}

// Helper: Sanitize room guests array
const sanitizeRoomGuests = (guests) => {
	if (!guests || !Array.isArray(guests)) return []
	return guests.map(g => sanitizeGuest(g)).filter(g => g !== null)
}

// Helper: Create or find PMS guest from booking data
const createGuestFromBooking = async (booking) => {
	try {
		const hotelId = booking.hotel?._id?.toString() || booking.hotel?.toString()
		const partnerId = booking.partner?._id?.toString() || booking.partner?.toString()

		if (!hotelId || !partnerId) {
			console.warn('[Guest] Missing hotel or partner ID for guest creation')
			return null
		}

		const guestData = {
			partner: partnerId,
			firstName: booking.leadGuest?.firstName,
			lastName: booking.leadGuest?.lastName,
			title: booking.leadGuest?.title,
			nationality: booking.leadGuest?.nationality,
			dateOfBirth: booking.leadGuest?.dateOfBirth,
			email: booking.contact?.email,
			phone: booking.contact?.phone
		}

		// If passport number exists, add as ID
		if (booking.leadGuest?.passportNumber) {
			guestData.idType = 'passport'
			guestData.idNumber = booking.leadGuest.passportNumber
		}

		const guest = await Guest.findOrCreate(hotelId, guestData)
		return guest
	} catch (error) {
		return null
	}
}

// Helper: Create pending Stay from confirmed booking (PMS Integration)
const createPendingStayFromBooking = async (booking) => {
	try {
		const hotelId = booking.hotel?._id?.toString() || booking.hotel?.toString()
		const partnerId = booking.partner?._id?.toString() || booking.partner?.toString()

		if (!hotelId || !partnerId) {
			console.warn('[Stay] Missing hotel or partner ID for stay creation')
			return null
		}

		// Check if Stay already exists for this booking
		const existingStay = await Stay.findOne({ booking: booking._id })
		if (existingStay) {
			return existingStay
		}

		// Get room info from first room in booking
		const roomInfo = booking.rooms?.[0]
		if (!roomInfo) {
			console.warn('[Stay] No room info in booking')
			return null
		}

		// Build guests array from booking
		const guests = []

		// Add lead guest as main guest
		if (booking.leadGuest?.firstName && booking.leadGuest?.lastName) {
			guests.push({
				firstName: booking.leadGuest.firstName,
				lastName: booking.leadGuest.lastName,
				type: 'adult',
				nationality: booking.leadGuest.nationality || '',
				idType: booking.leadGuest.passportNumber ? 'passport' : 'tc_kimlik',
				idNumber: booking.leadGuest.passportNumber || '',
				phone: booking.contact?.phone || '',
				email: booking.contact?.email || '',
				dateOfBirth: booking.leadGuest.dateOfBirth,
				isMainGuest: true
			})
		}

		// Add other guests from room
		if (roomInfo.guests && Array.isArray(roomInfo.guests)) {
			roomInfo.guests.forEach((g, idx) => {
				// Skip if same as lead guest
				if (g.firstName === booking.leadGuest?.firstName && g.lastName === booking.leadGuest?.lastName) {
					return
				}
				guests.push({
					firstName: g.firstName || `Misafir ${idx + 2}`,
					lastName: g.lastName || '',
					type: g.type || 'adult',
					nationality: g.nationality || '',
					isMainGuest: false
				})
			})
		}

		// Calculate nights
		const checkIn = new Date(booking.checkIn)
		const checkOut = new Date(booking.checkOut)
		const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

		// Get pricing
		const roomRate = booking.pricing?.grandTotal ? (booking.pricing.grandTotal / nights) : 0
		const totalAmount = booking.pricing?.grandTotal || 0

		// Create pending Stay
		const stay = await Stay.create({
			partner: partnerId,
			hotel: hotelId,
			booking: booking._id,
			bookingNumber: booking.bookingNumber,
			roomType: roomInfo.roomType,
			room: null, // Room will be assigned at check-in
			checkInDate: checkIn,
			checkOutDate: checkOut,
			nights,
			guests,
			adultsCount: roomInfo.adults || 1,
			childrenCount: roomInfo.children || 0,
			mealPlan: roomInfo.mealPlan,
			mealPlanCode: roomInfo.mealPlanCode,
			status: STAY_STATUS.PENDING,
			roomRate,
			totalAmount,
			paidAmount: booking.payment?.paidAmount || 0,
			balance: totalAmount - (booking.payment?.paidAmount || 0),
			currency: booking.pricing?.currency || 'TRY',
			paymentStatus: booking.payment?.paidAmount >= totalAmount ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING,
			specialRequests: booking.specialRequests || '',
			source: 'booking',
			isWalkIn: false,
			isVip: booking.leadGuest?.isVip || false
		})

		return stay
	} catch (error) {
		return null
	}
}

// ==================== HOTEL LISTING ====================

/**
 * Get partner's hotels for booking
 * GET /api/bookings/hotels
 */
export const getPartnerHotels = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const hotels = await Hotel.find({
		partner: partnerId,
		status: 'active'
	})
		.select('_id code name slug stars type address.city location.countryCode images childAgeGroups')
		.sort('name')
		.lean()

	res.json({
		success: true,
		data: hotels.map(h => ({
			_id: h._id,
			code: h.code,
			name: h.name,
			slug: h.slug,
			stars: h.stars,
			type: h.type,
			city: h.address?.city,
			countryCode: h.location?.countryCode,
			image: h.images?.find(img => img.isMain)?.url || h.images?.[0]?.url,
			childAgeGroups: h.childAgeGroups
		}))
	})
})

/**
 * Get partner's hotels with regions and provinces
 * Returns all hotels with their tourism regions for autocomplete
 * GET /api/bookings/hotels-with-regions
 */
export const getPartnerHotelsWithRegions = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	// Get all hotels with populated tourism regions
	const hotels = await Hotel.find({
		partner: partnerId,
		status: 'active'
	})
		.select('_id code name slug stars type address.city location images policies.maxChildAge childAgeGroups')
		.populate('location.tourismRegions', 'name code province')
		.sort('name')
		.lean()

	// Extract unique regions and provinces from hotels
	const regionsMap = new Map()
	const provincesMap = new Map()

	hotels.forEach(hotel => {
		// Count hotels per region (tourismRegions is an array)
		if (hotel.location?.tourismRegions?.length > 0) {
			hotel.location.tourismRegions.forEach(region => {
				if (region && region._id) {
					if (regionsMap.has(region._id.toString())) {
						regionsMap.get(region._id.toString()).hotelCount++
					} else {
						regionsMap.set(region._id.toString(), {
							_id: region._id,
							name: region.name,
							code: region.code,
							provinceName: hotel.address?.city,
							hotelCount: 1
						})
					}
				}
			})
		}

		// Count hotels per province (city)
		if (hotel.address?.city) {
			const cityKey = hotel.address.city.toLowerCase()
			if (provincesMap.has(cityKey)) {
				provincesMap.get(cityKey).hotelCount++
			} else {
				provincesMap.set(cityKey, {
					_id: cityKey,
					name: { tr: hotel.address.city, en: hotel.address.city },
					hotelCount: 1
				})
			}
		}
	})

	res.json({
		success: true,
		data: {
			hotels: hotels.map(h => {
				// Get first tourism region for display
				const firstRegion = h.location?.tourismRegions?.[0]
				return {
					_id: h._id,
					code: h.code,
					name: h.name,
					slug: h.slug,
					stars: h.stars,
					type: h.type,
					city: h.address?.city,
					tourismRegion: firstRegion ? {
						_id: firstRegion._id,
						name: firstRegion.name
					} : null,
					images: h.images?.slice(0, 1) || [],
					maxChildAge: h.policies?.maxChildAge || 12,
					childAgeGroups: h.childAgeGroups
				}
			}),
			regions: Array.from(regionsMap.values()),
			provinces: Array.from(provincesMap.values())
		}
	})
})

/**
 * Search hotels and regions with autocomplete
 * POST /api/bookings/search-autocomplete
 */
export const searchHotelsAndRegions = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const { query, mode = 'hotel' } = req.body

	if (!query || query.length < 2) {
		return res.json({
			success: true,
			data: { hotels: [], regions: [], provinces: [] }
		})
	}

	const searchRegex = new RegExp(query, 'i')

	if (mode === 'hotel') {
		// Search hotels
		const hotels = await Hotel.find({
			partner: partnerId,
			status: 'active',
			$or: [
				{ name: searchRegex },
				{ code: searchRegex },
				{ 'address.city': searchRegex }
			]
		})
			.select('_id code name slug stars type address.city location images policies.maxChildAge childAgeGroups')
			.populate('location.tourismRegions', 'name code')
			.limit(20)
			.lean()

		res.json({
			success: true,
			data: {
				hotels: hotels.map(h => {
					const firstRegion = h.location?.tourismRegions?.[0]
					return {
						_id: h._id,
						code: h.code,
						name: h.name,
						slug: h.slug,
						stars: h.stars,
						type: h.type,
						city: h.address?.city,
						tourismRegion: firstRegion || null,
						images: h.images?.slice(0, 1) || [],
						maxChildAge: h.policies?.maxChildAge || 12,
						childAgeGroups: h.childAgeGroups
					}
				}),
				regions: [],
				provinces: []
			}
		})
	} else {
		// Search regions - get hotels first to find their regions
		const hotels = await Hotel.find({
			partner: partnerId,
			status: 'active'
		})
			.select('_id address.city location')
			.populate('location.tourismRegions', 'name code province')
			.lean()

		// Aggregate regions and provinces matching the query
		const regionsMap = new Map()
		const provincesMap = new Map()

		hotels.forEach(hotel => {
			// Check tourism regions (array)
			if (hotel.location?.tourismRegions?.length > 0) {
				hotel.location.tourismRegions.forEach(region => {
					if (region && region._id) {
						const regionName = region.name?.tr || region.name?.en || ''
						if (searchRegex.test(regionName) || searchRegex.test(region.code)) {
							const key = region._id.toString()
							if (regionsMap.has(key)) {
								regionsMap.get(key).hotelCount++
							} else {
								regionsMap.set(key, {
									_id: region._id,
									name: region.name,
									code: region.code,
									provinceName: hotel.address?.city,
									hotelCount: 1
								})
							}
						}
					}
				})
			}

			// Check province/city
			if (hotel.address?.city) {
				if (searchRegex.test(hotel.address.city)) {
					const key = hotel.address.city.toLowerCase()
					if (provincesMap.has(key)) {
						provincesMap.get(key).hotelCount++
					} else {
						provincesMap.set(key, {
							_id: key,
							name: { tr: hotel.address.city, en: hotel.address.city },
							hotelCount: 1
						})
					}
				}
			}
		})

		res.json({
			success: true,
			data: {
				hotels: [],
				regions: Array.from(regionsMap.values()).slice(0, 10),
				provinces: Array.from(provincesMap.values()).slice(0, 10)
			}
		})
	}
})

// ==================== MULTI-HOTEL SEARCH ====================

/**
 * Search hotels with cheapest prices (for region/multi-hotel search)
 * POST /api/bookings/search-hotels
 */
export const searchHotelsWithPrices = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)

	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const {
		tourismRegionIds = [],
		hotelIds = [],
		checkIn,
		checkOut,
		adults = 2,
		children = [],
		countryCode,
		channel = 'B2B'
	} = req.body

	// Validate dates
	if (!checkIn || !checkOut) {
		throw new BadRequestError('DATES_REQUIRED')
	}

	const checkInDate = new Date(checkIn)
	const checkOutDate = new Date(checkOut)
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	if (checkInDate < today) {
		throw new BadRequestError('CHECK_IN_MUST_BE_FUTURE')
	}

	if (checkOutDate <= checkInDate) {
		throw new BadRequestError('INVALID_DATE_RANGE')
	}

	const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
	if (nights > 30) {
		throw new BadRequestError('MAX_30_NIGHTS')
	}

	// Build hotel query
	const hotelQuery = {
		partner: partnerId,
		status: 'active'
	}

	// Filter by tourism regions or specific hotels
	if (tourismRegionIds.length > 0) {
		hotelQuery['location.tourismRegions'] = { $in: tourismRegionIds }
	}

	if (hotelIds.length > 0) {
		hotelQuery._id = { $in: hotelIds }
	}

	// Get hotels
	const hotels = await Hotel.find(hotelQuery)
		.select('_id code name slug stars type address images childAgeGroups pricingSettings paymentMethods location')
		.lean()

	if (hotels.length === 0) {
		return res.json({
			success: true,
			data: {
				hotels: [],
				search: { checkIn, checkOut, nights, adults, children, countryCode, channel }
			}
		})
	}

	// Process each hotel and get cheapest price
	const hotelResults = []
	const debugInfo = [] // Debug bilgisi

	for (const hotel of hotels) {
		const hotelDebug = { hotelId: hotel._id, name: hotel.name, issues: [] }

		try {
			// Find market for this hotel
			let market = null
			if (countryCode) {
				market = await Market.findOne({
					hotel: hotel._id,
					countries: countryCode.toUpperCase(),
					status: 'active'
				}).lean()
			}

			if (!market) {
				market = await Market.findOne({
					hotel: hotel._id,
					isDefault: true,
					status: 'active'
				}).lean()
			}

			if (!market) {
				market = await Market.findOne({
					hotel: hotel._id,
					status: 'active'
				}).lean()
			}

			if (!market) {
				hotelDebug.issues.push('NO_MARKET_FOUND')
				debugInfo.push(hotelDebug)
				continue // Skip hotel if no market
			}

			hotelDebug.marketId = market._id
			hotelDebug.marketName = market.name

			// Get active room types
			const roomTypes = await RoomType.find({
				hotel: hotel._id,
				status: 'active'
			}).select('_id code occupancy').lean()

			hotelDebug.roomTypeCount = roomTypes.length

			if (roomTypes.length === 0) {
				hotelDebug.issues.push('NO_ROOM_TYPES')
				debugInfo.push(hotelDebug)
				continue
			}

			// Get active meal plans
			const mealPlans = await MealPlan.find({
				hotel: hotel._id,
				status: 'active'
			}).select('_id code').lean()

			hotelDebug.mealPlanCount = mealPlans.length

			if (mealPlans.length === 0) {
				hotelDebug.issues.push('NO_MEAL_PLANS')
				debugInfo.push(hotelDebug)
				continue
			}

			let cheapestPrice = null
			let availableRoomCount = 0
			let currency = market.currency
			const priceErrors = []

			// Find cheapest available option
			for (const roomType of roomTypes) {
				// Check capacity
				const maxAdults = roomType.occupancy?.maxAdults || 2
				const maxTotal = roomType.occupancy?.totalMaxGuests || 4
				const totalPax = adults + children.length

				if (adults > maxAdults || totalPax > maxTotal) {
					continue
				}

				for (const mealPlan of mealPlans) {
					try {
						const priceResult = await pricingService.calculatePriceWithCampaigns({
							hotelId: hotel._id.toString(),
							roomTypeId: roomType._id.toString(),
							mealPlanId: mealPlan._id.toString(),
							marketId: market._id.toString(),
							checkInDate: checkIn,
							checkOutDate: checkOut,
							adults,
							children: children.map(age => ({ age })),
							includeCampaigns: true
						})

						if (priceResult.availability?.isAvailable) {
							availableRoomCount++
							const price = priceResult.pricing.finalTotal

							if (cheapestPrice === null || price < cheapestPrice) {
								cheapestPrice = price
							}
						} else {
							priceErrors.push({
								roomType: roomType.code,
								mealPlan: mealPlan.code,
								reason: priceResult.availability?.reason || 'NOT_AVAILABLE'
							})
						}
					} catch (err) {
						priceErrors.push({
							roomType: roomType.code,
							mealPlan: mealPlan.code,
							error: err.message
						})
					}
				}
			}

			hotelDebug.availableRoomCount = availableRoomCount
			hotelDebug.cheapestPrice = cheapestPrice
			hotelDebug.priceErrors = priceErrors.slice(0, 5) // İlk 5 hata

			if (cheapestPrice !== null) {
				hotelResults.push({
					_id: hotel._id,
					code: hotel.code,
					name: hotel.name,
					slug: hotel.slug,
					stars: hotel.stars,
					type: hotel.type,
					city: hotel.address?.city,
					image: hotel.images?.find(img => img.isMain)?.url || hotel.images?.[0]?.url,
					cheapestPrice,
					currency,
					availableRoomCount,
					paymentMethods: hotel.paymentMethods || [],
					childAgeGroups: hotel.childAgeGroups
				})
			} else {
				hotelDebug.issues.push('NO_AVAILABLE_PRICE')
				debugInfo.push(hotelDebug)
			}
		} catch (err) {
			hotelDebug.issues.push(`ERROR: ${err.message}`)
			debugInfo.push(hotelDebug)
		}
	}

	// Sort by cheapest price
	hotelResults.sort((a, b) => a.cheapestPrice - b.cheapestPrice)

	res.json({
		success: true,
		data: {
			hotels: hotelResults,
			debug: debugInfo, // Debug bilgisini response'a ekle
			search: {
				checkIn,
				checkOut,
				nights,
				adults,
				children,
				countryCode,
				channel
			}
		}
	})
})

// ==================== AVAILABILITY SEARCH ====================

/**
 * Search availability and prices
 * POST /api/bookings/search
 */
export const searchAvailability = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const {
		hotelId,
		checkIn,
		checkOut,
		adults = 2,
		children = [],
		countryCode,
		currency
	} = req.body

	// Validate required fields
	if (!hotelId || !checkIn || !checkOut) {
		throw new BadRequestError('HOTEL_AND_DATES_REQUIRED')
	}

	const checkInDate = new Date(checkIn)
	const checkOutDate = new Date(checkOut)
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	if (checkInDate < today) {
		throw new BadRequestError('CHECK_IN_MUST_BE_FUTURE')
	}

	if (checkOutDate <= checkInDate) {
		throw new BadRequestError('INVALID_DATE_RANGE')
	}

	const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
	if (nights > 30) {
		throw new BadRequestError('MAX_30_NIGHTS')
	}

	// Get hotel (must belong to partner)
	const hotel = await Hotel.findOne({
		_id: hotelId,
		partner: partnerId,
		status: 'active'
	})
		.select('_id code name childAgeGroups pricingSettings')
		.lean()

	if (!hotel) {
		throw new NotFoundError('HOTEL_NOT_FOUND')
	}

	// Find appropriate market
	let market = null
	if (countryCode) {
		market = await Market.findOne({
			hotel: hotel._id,
			countries: countryCode.toUpperCase(),
			status: 'active'
		}).lean()
	}

	if (!market) {
		market = await Market.findOne({
			hotel: hotel._id,
			isDefault: true,
			status: 'active'
		}).lean()
	}

	if (!market && currency) {
		market = await Market.findOne({
			hotel: hotel._id,
			currency: currency.toUpperCase(),
			status: 'active'
		}).lean()
	}

	if (!market) {
		market = await Market.findOne({
			hotel: hotel._id,
			status: 'active'
		}).lean()
	}

	if (!market) {
		throw new NotFoundError('NO_MARKET_AVAILABLE')
	}

	// Get active room types and meal plans
	const [roomTypes, mealPlans] = await Promise.all([
		RoomType.find({ hotel: hotel._id, status: 'active' }).sort('displayOrder').lean(),
		MealPlan.find({ hotel: hotel._id, status: 'active' }).sort('displayOrder').lean()
	])

	const results = []

	// Process each room type
	for (const roomType of roomTypes) {
		const roomResult = {
			roomType: {
				_id: roomType._id,
				code: roomType.code,
				name: roomType.name,
				description: roomType.description,
				images: roomType.images?.slice(0, 3),
				occupancy: roomType.occupancy
			},
			options: [],
			unavailableOptions: [] // Options with pricing but no allotment
		}

		// Check capacity
		const maxAdults = roomType.occupancy?.maxAdults || 2
		const maxChildren = roomType.occupancy?.maxChildren || 2
		const maxTotal = roomType.occupancy?.totalMaxGuests || 4
		const totalPax = adults + children.length

		if (adults > maxAdults || totalPax > maxTotal) {
			roomResult.capacityExceeded = true
			roomResult.capacityMessage = `Max ${maxAdults} adults, ${maxTotal} total guests`
			results.push(roomResult)
			continue
		}

		// Process each meal plan
		for (const mealPlan of mealPlans) {
			try {
				const priceResult = await pricingService.calculatePriceWithCampaigns({
					hotelId: hotel._id.toString(),
					roomTypeId: roomType._id.toString(),
					mealPlanId: mealPlan._id.toString(),
					marketId: market._id.toString(),
					checkInDate: checkIn,
					checkOutDate: checkOut,
					adults,
					children: children.map(age => ({ age })),
					includeCampaigns: true
				})

				// Build option data
				const optionData = {
					mealPlan: {
						_id: mealPlan._id,
						code: mealPlan.code,
						name: mealPlan.name
					},
					pricing: {
						currency: market.currency,
						originalTotal: priceResult.pricing.originalTotal,
						totalDiscount: priceResult.pricing.totalDiscount,
						finalTotal: priceResult.pricing.finalTotal,
						avgPerNight: priceResult.pricing.avgPerNight,
						// 3-tier pricing for partner/agency profit calculation
						hotelCost: priceResult.pricing.hotelCost,
						b2cPrice: priceResult.pricing.b2cPrice,
						b2bPrice: priceResult.pricing.b2bPrice,
						perNight: priceResult.pricing.perNight
					},
					campaigns: priceResult.campaigns?.applied?.map(c => ({
						code: c.code,
						name: typeof c.name === 'object' ? (c.name.tr || c.name.en || Object.values(c.name)[0]) : c.name,
						discountType: c.discountType,
						discountValue: c.discountValue,
						discountAmount: c.discountAmount,
						discountText: c.discountText
					})) || [],
					dailyBreakdown: priceResult.dailyBreakdown,
					nights,
					// Include non-refundable pricing if market supports it
					nonRefundable: priceResult.nonRefundable
				}

				if (priceResult.availability?.isAvailable) {
					roomResult.options.push(optionData)
				} else {
					// Add to unavailable options with pricing info (for display with "Not Available" badge)
					roomResult.unavailableOptions.push({
						...optionData,
						available: false,
						issues: priceResult.availability?.issues || [],
						unavailableReason: priceResult.availability?.issues?.[0]?.type || 'no_allotment'
					})
				}
			} catch (error) {
				// Pricing error - silently continue
			}
		}

		if (roomResult.options.length > 0 || roomResult.unavailableOptions.length > 0 || roomResult.capacityExceeded) {
			results.push(roomResult)
		}
	}

	res.json({
		success: true,
		data: {
			hotel: {
				_id: hotel._id,
				code: hotel.code,
				name: hotel.name,
				childAgeGroups: hotel.childAgeGroups
			},
			search: {
				checkIn,
				checkOut,
				nights,
				adults,
				children,
				market: {
					_id: market._id,
					code: market.code,
					currency: market.currency
				}
			},
			results
		}
	})
})

/**
 * Get detailed price quote
 * POST /api/bookings/price-quote
 */
export const getPriceQuote = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const {
		hotelId,
		roomTypeId,
		mealPlanId,
		marketId,
		checkIn,
		checkOut,
		adults = 2,
		children = []
	} = req.body

	// Validate
	if (!hotelId || !roomTypeId || !mealPlanId || !checkIn || !checkOut) {
		throw new BadRequestError('MISSING_REQUIRED_FIELDS')
	}

	// Get hotel
	const hotel = await Hotel.findOne({
		_id: hotelId,
		partner: partnerId,
		status: 'active'
	})
	if (!hotel) {
		throw new NotFoundError('HOTEL_NOT_FOUND')
	}

	// Get room type
	const roomType = await RoomType.findOne({
		_id: roomTypeId,
		hotel: hotel._id,
		status: 'active'
	})
	if (!roomType) {
		throw new NotFoundError('ROOM_TYPE_NOT_FOUND')
	}

	// Get meal plan
	const mealPlan = await MealPlan.findOne({
		_id: mealPlanId,
		hotel: hotel._id,
		status: 'active'
	})
	if (!mealPlan) {
		throw new NotFoundError('MEAL_PLAN_NOT_FOUND')
	}

	// Get market
	let market
	if (marketId) {
		market = await Market.findOne({
			_id: marketId,
			hotel: hotel._id,
			status: 'active'
		}).lean()
	}
	if (!market) {
		market = await Market.findOne({
			hotel: hotel._id,
			isDefault: true,
			status: 'active'
		}).lean()
	}
	if (!market) {
		throw new NotFoundError('NO_MARKET_AVAILABLE')
	}

	// Calculate price
	const priceResult = await pricingService.calculatePriceWithCampaigns({
		hotelId: hotel._id.toString(),
		roomTypeId: roomType._id.toString(),
		mealPlanId: mealPlan._id.toString(),
		marketId: market._id.toString(),
		checkInDate: checkIn,
		checkOutDate: checkOut,
		adults,
		children: children.map(age => ({ age })),
		includeCampaigns: true
	})

	res.json({
		success: true,
		data: {
			hotel: {
				_id: hotel._id,
				code: hotel.code,
				name: hotel.name
			},
			roomType: {
				_id: roomType._id,
				code: roomType.code,
				name: roomType.name
			},
			mealPlan: {
				_id: mealPlan._id,
				code: mealPlan.code,
				name: mealPlan.name
			},
			market: {
				_id: market._id,
				code: market.code,
				currency: market.currency
			},
			booking: {
				checkIn,
				checkOut,
				nights: priceResult.nights,
				adults,
				children
			},
			pricing: priceResult.pricing,
			dailyBreakdown: priceResult.dailyBreakdown,
			campaigns: priceResult.campaigns,
			availability: priceResult.availability
		}
	})
})

// ==================== BOOKING CRUD ====================

/**
 * List bookings for partner
 * GET /api/bookings
 */
export const listBookings = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const {
		status,
		hotelId,
		checkInFrom,
		checkInTo,
		search,
		page = 1,
		limit = 20,
		sort = '-createdAt'
	} = req.query

	// Build query
	const query = { partner: partnerId }

	if (status) {
		query.status = status
	}
	if (hotelId) {
		query.hotel = hotelId
	}
	if (checkInFrom || checkInTo) {
		query.checkIn = {}
		if (checkInFrom) query.checkIn.$gte = new Date(checkInFrom)
		if (checkInTo) query.checkIn.$lte = new Date(checkInTo)
	}
	if (search) {
		query.$or = [
			{ bookingNumber: { $regex: search, $options: 'i' } },
			{ 'contact.email': { $regex: search, $options: 'i' } },
			{ 'leadGuest.firstName': { $regex: search, $options: 'i' } },
			{ 'leadGuest.lastName': { $regex: search, $options: 'i' } },
			{ hotelName: { $regex: search, $options: 'i' } }
		]
	}

	// Agency user: only see their own bookings
	if (req.user?.accountType === 'agency') {
		query['source.agencyId'] = req.user.accountId
	}

	// Pagination
	const pageNum = Math.max(1, parseInt(page))
	const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
	const skip = (pageNum - 1) * limitNum

	// Sort
	let sortOption = { createdAt: -1 }
	if (sort === 'checkIn') sortOption = { checkIn: 1 }
	if (sort === '-checkIn') sortOption = { checkIn: -1 }
	if (sort === 'createdAt') sortOption = { createdAt: 1 }
	if (sort === 'grandTotal') sortOption = { 'pricing.grandTotal': -1 }

	const [bookings, total] = await Promise.all([
		Booking.find(query)
			.select('bookingNumber status hotel hotelName hotelCode checkIn checkOut nights totalRooms totalAdults totalChildren leadGuest contact pricing payment source expiresAt lastActivityAt createdAt rooms.roomTypeName rooms.roomTypeCode rooms.mealPlanName rooms.mealPlanCode rooms.pricing rooms.rateType rooms.nonRefundableDiscount market marketCode marketName season seasonCode seasonName modifications')
			.populate('hotel', 'name slug code')
			.populate('market', '_id name code currency')
			.populate('season', '_id name code color')
			.sort(sortOption)
			.skip(skip)
			.limit(limitNum)
			.lean(),
		Booking.countDocuments(query)
	])

	// Map bookings for response
	const mappedBookings = bookings.map(b => ({
		_id: b._id,
		bookingNumber: b.bookingNumber,
		status: b.status,
		hotelName: b.hotel?.name?.tr || b.hotel?.name?.en || b.hotelName,
		hotelCode: b.hotel?.code || b.hotelCode,
		hotel: {
			_id: b.hotel?._id,
			name: b.hotel?.name || b.hotelName,
			slug: b.hotel?.slug
		},
		checkIn: b.checkIn,
		checkOut: b.checkOut,
		nights: b.nights,
		totalRooms: b.totalRooms,
		totalAdults: b.totalAdults,
		totalChildren: b.totalChildren,
		leadGuest: b.leadGuest ? {
			firstName: b.leadGuest.firstName,
			lastName: b.leadGuest.lastName,
			nationality: b.leadGuest.nationality // ISO country code for flag
		} : null,
		contact: {
			email: b.contact?.email,
			phone: b.contact?.phone
		},
		pricing: {
			currency: b.pricing?.currency,
			grandTotal: b.pricing?.grandTotal
		},
		payment: {
			status: b.payment?.status,
			paidAmount: b.payment?.paidAmount || 0
		},
		source: {
			type: b.source?.type,
			agencyName: b.source?.agencyName
		},
		// Market info
		market: b.market ? {
			_id: b.market._id,
			code: b.market.code || b.marketCode,
			name: b.market.name || b.marketName,
			currency: b.market.currency
		} : (b.marketCode ? { code: b.marketCode, name: b.marketName } : null),
		// Season info
		season: b.season ? {
			_id: b.season._id,
			code: b.season.code || b.seasonCode,
			name: b.season.name || b.seasonName,
			color: b.season.color
		} : (b.seasonCode ? { code: b.seasonCode, name: b.seasonName } : null),
		expiresAt: b.expiresAt,
		lastActivityAt: b.lastActivityAt,
		createdAt: b.createdAt,
		// Include rooms with rate type for display
		rooms: (b.rooms || []).map(r => ({
			roomTypeName: r.roomTypeName,
			roomTypeCode: r.roomTypeCode,
			mealPlanName: r.mealPlanName,
			mealPlanCode: r.mealPlanCode,
			pricing: r.pricing ? {
				currency: r.pricing.currency,
				finalTotal: r.pricing.finalTotal
			} : null,
			rateType: r.rateType,
			nonRefundableDiscount: r.nonRefundableDiscount
		})),
		// Amendment indicator - just return array length for list view
		modifications: b.modifications || []
	}))

	res.json({
		success: true,
		data: mappedBookings,
		pagination: {
			page: pageNum,
			limit: limitNum,
			total,
			totalPages: Math.ceil(total / limitNum)
		}
	})
})

/**
 * Get booking detail
 * GET /api/bookings/:id
 */
export const getBookingDetail = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const { id } = req.params

	const booking = await Booking.findOne({
		_id: id,
		partner: partnerId
	})
		.populate('hotel', 'name slug code address images contact')
		.populate('market', 'name code currency')
		.populate('rooms.roomType', 'name code images')
		.populate('rooms.mealPlan', 'name code')

	if (!booking) {
		throw new NotFoundError('BOOKING_NOT_FOUND')
	}

	// Agency user: only see their own bookings
	if (req.user?.accountType === 'agency') {
		if (booking.source?.agencyId?.toString() !== req.user.accountId.toString()) {
			throw new NotFoundError('BOOKING_NOT_FOUND')
		}
	}

	res.json({
		success: true,
		data: booking
	})
})

/**
 * Create booking
 * POST /api/bookings
 */
export const createBooking = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const {
		hotelId,
		marketId,
		checkIn,
		checkOut,
		rooms,
		contact,
		billing,
		specialRequests
	} = req.body

	// Validate hotel
	const hotel = await Hotel.findOne({
		_id: hotelId,
		partner: partnerId,
		status: 'active'
	})
		.select('_id partner name slug code pricingSettings')
		.lean()

	if (!hotel) {
		throw new NotFoundError('HOTEL_NOT_FOUND')
	}

	// Validate dates
	const checkInDate = new Date(checkIn)
	const checkOutDate = new Date(checkOut)
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	if (checkInDate < today) {
		throw new BadRequestError('CHECK_IN_MUST_BE_FUTURE')
	}

	if (checkOutDate <= checkInDate) {
		throw new BadRequestError('INVALID_DATE_RANGE')
	}

	const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
	if (nights > 30) {
		throw new BadRequestError('MAX_30_NIGHTS')
	}

	// Validate contact
	if (!contact?.email || !contact?.phone) {
		throw new BadRequestError('CONTACT_INFO_REQUIRED')
	}

	// Validate rooms
	if (!rooms || rooms.length === 0) {
		throw new BadRequestError('ROOMS_REQUIRED')
	}

	// Get market
	let market
	if (marketId) {
		market = await Market.findOne({
			_id: marketId,
			hotel: hotel._id,
			status: 'active'
		}).lean()
	}
	if (!market) {
		market = await Market.findOne({
			hotel: hotel._id,
			isDefault: true,
			status: 'active'
		}).lean()
	}
	if (!market) {
		throw new NotFoundError('NO_MARKET_AVAILABLE')
	}

	// Process rooms and calculate prices
	const processedRooms = []
	let totalAdults = 0
	let totalChildren = 0
	let totalInfants = 0
	let subtotal = 0
	let totalDiscount = 0

	for (const room of rooms) {
		// Get room type
		const roomType = await RoomType.findOne({
			_id: room.roomTypeId,
			hotel: hotel._id,
			status: 'active'
		}).lean()

		if (!roomType) {
			throw new NotFoundError(`ROOM_TYPE_NOT_FOUND: ${room.roomTypeId}`)
		}

		// Get meal plan
		const mealPlan = await MealPlan.findOne({
			_id: room.mealPlanId,
			hotel: hotel._id,
			status: 'active'
		}).lean()

		if (!mealPlan) {
			throw new NotFoundError(`MEAL_PLAN_NOT_FOUND: ${room.mealPlanId}`)
		}

		const adults = room.adults || 2
		const children = room.children || []

		// Calculate price
		const priceResult = await pricingService.calculatePriceWithCampaigns({
			hotelId: hotel._id.toString(),
			roomTypeId: roomType._id.toString(),
			mealPlanId: mealPlan._id.toString(),
			marketId: market._id.toString(),
			checkInDate: checkIn,
			checkOutDate: checkOut,
			adults,
			children: children.map(age => ({ age })),
			includeCampaigns: true
		})

		if (!priceResult.availability?.isAvailable) {
			const issues = priceResult.availability?.issues || []
			throw new BadRequestError(`ROOM_NOT_AVAILABLE: ${roomType.name?.tr || roomType.code}. ${issues[0]?.message || ''}`)
		}

		// Build room booking
		const roomBooking = {
			roomType: roomType._id,
			roomTypeCode: roomType.code,
			roomTypeName: roomType.name,
			mealPlan: mealPlan._id,
			mealPlanCode: mealPlan.code,
			mealPlanName: mealPlan.name,
			guests: sanitizeRoomGuests(room.guests),
			pricing: {
				currency: market.currency,
				originalTotal: priceResult.pricing.originalTotal,
				discount: priceResult.pricing.totalDiscount,
				finalTotal: priceResult.pricing.finalTotal,
				avgPerNight: priceResult.pricing.avgPerNight
			},
			dailyBreakdown: priceResult.dailyBreakdown,
			campaigns: priceResult.campaigns.applied,
			specialRequests: room.specialRequests
		}

		processedRooms.push(roomBooking)

		// Update totals
		totalAdults += adults
		totalChildren += children.filter(age => age >= 2).length
		totalInfants += children.filter(age => age < 2).length
		subtotal += priceResult.pricing.originalTotal
		totalDiscount += priceResult.pricing.totalDiscount
	}

	// Calculate final pricing
	const grandTotal = subtotal - totalDiscount
	const taxRate = hotel.pricingSettings?.taxRate || 0
	const tax = hotel.pricingSettings?.taxIncluded ? 0 : (grandTotal * taxRate / 100)

	// Get primary season from first room's first day
	let primarySeason = null
	if (processedRooms[0]?.dailyBreakdown?.[0]?.season) {
		primarySeason = processedRooms[0].dailyBreakdown[0].season
	}

	// Generate booking number
	const bookingNumber = await Booking.generateBookingNumber(partnerId)

	// Get lead guest
	let leadGuest = null
	for (const room of rooms) {
		if (room.guests) {
			leadGuest = room.guests.find(g => g.isLead)
			if (leadGuest) break
		}
	}
	if (!leadGuest && rooms[0]?.guests?.[0]) {
		leadGuest = { ...rooms[0].guests[0], isLead: true }
	}
	if (!leadGuest) {
		leadGuest = {
			firstName: contact.firstName || 'Guest',
			lastName: contact.lastName || '',
			type: 'adult',
			isLead: true
		}
	}

	// Create booking
	const booking = new Booking({
		bookingNumber,
		partner: partnerId,
		hotel: hotel._id,
		hotelCode: hotel.slug || hotel.code,
		hotelName: hotel.name,
		market: market._id,
		marketCode: market.code,
		marketName: market.name,
		season: primarySeason?._id,
		seasonCode: primarySeason?.code,
		seasonName: primarySeason?.name,
		checkIn: checkInDate,
		checkOut: checkOutDate,
		nights,
		rooms: processedRooms,
		totalRooms: processedRooms.length,
		totalAdults,
		totalChildren,
		totalInfants,
		leadGuest: sanitizeGuest(leadGuest),
		contact: {
			email: contact.email,
			phone: contact.phone,
			countryCode: contact.countryCode
		},
		billing,
		pricing: {
			currency: market.currency,
			subtotal,
			totalDiscount,
			tax,
			taxRate,
			grandTotal: grandTotal + tax
		},
		payment: {
			status: 'pending',
			dueAmount: grandTotal + tax
		},
		status: 'pending',
		source: getSourceInfo(req),
		specialRequests
	})

	await booking.save()

	// Reserve allotment for all rooms/dates
	for (const room of processedRooms) {
		const dates = room.dailyBreakdown.map(d => d.date)
		try {
			await pricingService.reserveAllotment({
				hotelId: hotel._id.toString(),
				roomTypeId: room.roomType.toString(),
				mealPlanId: room.mealPlan.toString(),
				marketId: market._id.toString(),
				dates,
				rooms: 1
			})
		} catch (error) {
			console.error('Allotment reservation error:', error.message)
		}
	}

	// Populate for response
	await booking.populate('hotel', 'name slug')

	// Emit socket event for PMS real-time updates
	emitReservationUpdate(booking.hotel._id?.toString() || hotel._id.toString(), 'created', {
		reservationId: booking._id,
		bookingNumber: booking.bookingNumber,
		guestName: getGuestDisplayName(booking.leadGuest),
		checkIn: booking.checkIn,
		checkOut: booking.checkOut,
		roomType: booking.rooms[0]?.roomType,
		status: booking.status,
		source: booking.source?.type || 'admin'
	})

	res.status(201).json({
		success: true,
		data: {
			_id: booking._id,
			bookingNumber: booking.bookingNumber,
			status: booking.status,
			hotel: {
				_id: booking.hotel._id,
				name: booking.hotel.name,
				slug: booking.hotel.slug
			},
			checkIn: booking.formattedCheckIn,
			checkOut: booking.formattedCheckOut,
			nights: booking.nights,
			rooms: booking.totalRooms,
			guests: {
				adults: booking.totalAdults,
				children: booking.totalChildren
			},
			pricing: booking.pricing,
			contact: {
				email: booking.contact.email
			}
		}
	})
})

/**
 * Update booking status
 * PATCH /api/bookings/:id/status
 */
export const updateBookingStatus = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const { id } = req.params
	const { status } = req.body

	if (!['confirmed', 'cancelled', 'completed', 'no_show'].includes(status)) {
		throw new BadRequestError('INVALID_STATUS')
	}

	const booking = await Booking.findOne({
		_id: id,
		partner: partnerId
	})

	if (!booking) {
		throw new NotFoundError('BOOKING_NOT_FOUND')
	}

	const previousStatus = booking.status

	// Add modification record
	booking.modifications.push({
		modifiedAt: new Date(),
		modifiedBy: req.user?._id,
		type: 'status',
		description: `Status changed from ${previousStatus} to ${status}`,
		previousValue: previousStatus,
		newValue: status
	})

	booking.status = status
	await booking.save()

	// Emit socket event for PMS real-time updates
	const hotelId = booking.hotel?._id?.toString() || booking.hotel?.toString()
	if (hotelId) {
		emitReservationUpdate(hotelId, status === 'confirmed' ? 'confirmed' : 'updated', {
			reservationId: booking._id,
			bookingNumber: booking.bookingNumber,
			guestName: getGuestDisplayName(booking.leadGuest),
			checkIn: booking.checkIn,
			checkOut: booking.checkOut,
			roomType: booking.rooms[0]?.roomType,
			status: booking.status,
			previousStatus
		})
	}

	// Create PMS guest record when booking is confirmed
	if (status === 'confirmed') {
		await createGuestFromBooking(booking)
	}

	res.json({
		success: true,
		data: {
			_id: booking._id,
			bookingNumber: booking.bookingNumber,
			status: booking.status,
			previousStatus
		}
	})
})

/**
 * Cancel booking
 * POST /api/bookings/:id/cancel
 */
export const cancelBooking = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const { id } = req.params
	const { reason } = req.body

	const booking = await Booking.findOne({
		_id: id,
		partner: partnerId
	}).populate('hotel', 'policies')

	if (!booking) {
		throw new NotFoundError('BOOKING_NOT_FOUND')
	}

	// Check if cancellation is allowed
	const canCancelResult = booking.canCancel()
	if (!canCancelResult.allowed) {
		throw new BadRequestError(canCancelResult.reason || 'CANCELLATION_NOT_ALLOWED')
	}

	// Calculate refund based on cancellation policy
	const checkIn = new Date(booking.checkIn)
	const now = new Date()
	const daysBeforeCheckIn = Math.floor((checkIn - now) / (1000 * 60 * 60 * 24))

	let refundPercent = 0
	if (booking.hotel?.policies?.freeCancellation?.enabled &&
	    daysBeforeCheckIn >= (booking.hotel.policies.freeCancellation.daysBeforeCheckIn || 1)) {
		refundPercent = 100
	} else if (booking.hotel?.policies?.cancellationRules?.length > 0) {
		// Find applicable rule
		const sortedRules = [...booking.hotel.policies.cancellationRules].sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)
		for (const rule of sortedRules) {
			if (daysBeforeCheckIn >= rule.daysBeforeCheckIn) {
				refundPercent = rule.refundPercent
				break
			}
		}
	}

	const refundAmount = (booking.payment.paidAmount || 0) * (refundPercent / 100)

	// Update booking
	booking.status = 'cancelled'
	booking.cancellation = {
		cancelledAt: new Date(),
		cancelledBy: req.user?._id,
		reason,
		refundAmount,
		refundStatus: refundAmount > 0 ? 'pending' : undefined,
		policy: {
			daysBeforeCheckIn,
			refundPercent
		}
	}

	// Add modification record
	booking.modifications.push({
		modifiedAt: new Date(),
		modifiedBy: req.user?._id,
		type: 'status',
		description: `Booking cancelled. Reason: ${reason || 'Not specified'}`,
		previousValue: booking.status,
		newValue: 'cancelled'
	})

	await booking.save()

	// Release allotment
	for (const room of booking.rooms) {
		const dates = room.dailyBreakdown.map(d => d.date)
		try {
			await pricingService.releaseAllotment({
				hotelId: booking.hotel._id?.toString() || booking.hotel.toString(),
				roomTypeId: room.roomType.toString(),
				mealPlanId: room.mealPlan.toString(),
				marketId: booking.market.toString(),
				dates,
				rooms: 1
			})
		} catch (error) {
			console.error('Allotment release error:', error.message)
		}
	}

	// Emit socket event for PMS real-time updates
	const hotelId = booking.hotel?._id?.toString() || booking.hotel?.toString()
	if (hotelId) {
		emitReservationUpdate(hotelId, 'cancelled', {
			reservationId: booking._id,
			bookingNumber: booking.bookingNumber,
			guestName: getGuestDisplayName(booking.leadGuest),
			checkIn: booking.checkIn,
			checkOut: booking.checkOut,
			roomType: booking.rooms[0]?.roomType,
			status: 'cancelled',
			reason: reason || 'Not specified'
		})
	}

	res.json({
		success: true,
		data: {
			_id: booking._id,
			bookingNumber: booking.bookingNumber,
			status: booking.status,
			cancellation: {
				cancelledAt: booking.cancellation.cancelledAt,
				reason: booking.cancellation.reason,
				refundPercent,
				refundAmount,
				refundStatus: booking.cancellation.refundStatus
			}
		}
	})
})

/**
 * Add note to booking
 * POST /api/bookings/:id/notes
 */
export const addBookingNote = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const { id } = req.params
	const { content, isInternal = true } = req.body

	if (!content) {
		throw new BadRequestError('NOTE_CONTENT_REQUIRED')
	}

	const booking = await Booking.findOne({
		_id: id,
		partner: partnerId
	})

	if (!booking) {
		throw new NotFoundError('BOOKING_NOT_FOUND')
	}

	booking.notes.push({
		createdAt: new Date(),
		createdBy: req.user?._id,
		content,
		isInternal
	})

	await booking.save()

	res.json({
		success: true,
		data: {
			_id: booking._id,
			notes: booking.notes
		}
	})
})

// ==================== STATISTICS ====================

/**
 * Get booking statistics
 * GET /api/bookings/stats
 */
export const getBookingStats = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const { hotelId, period = '30d' } = req.query

	// Calculate date range
	const now = new Date()
	let startDate = new Date()
	if (period === '7d') startDate.setDate(now.getDate() - 7)
	else if (period === '30d') startDate.setDate(now.getDate() - 30)
	else if (period === '90d') startDate.setDate(now.getDate() - 90)
	else if (period === '365d') startDate.setDate(now.getDate() - 365)

	// Build query for period stats
	const periodQuery = {
		partner: partnerId,
		createdAt: { $gte: startDate }
	}
	if (hotelId) {
		periodQuery.hotel = hotelId
	}

	// Build query for all-time status counts
	const allTimeQuery = {
		partner: partnerId
	}
	if (hotelId) {
		allTimeQuery.hotel = hotelId
	}

	// Aggregate stats for period
	const [periodStats, statusCounts] = await Promise.all([
		// Period-based stats (revenue, etc.)
		Booking.aggregate([
			{ $match: periodQuery },
			{
				$group: {
					_id: null,
					totalRevenue: {
						$sum: {
							$cond: [
								{ $in: ['$status', ['confirmed', 'completed']] },
								'$pricing.grandTotal',
								0
							]
						}
					},
					totalRooms: { $sum: '$totalRooms' },
					totalGuests: { $sum: { $add: ['$totalAdults', '$totalChildren'] } }
				}
			}
		]),
		// All-time status counts
		Booking.aggregate([
			{ $match: allTimeQuery },
			{
				$group: {
					_id: '$status',
					count: { $sum: 1 }
				}
			}
		])
	])

	// Convert status counts to object
	const statusMap = {}
	let total = 0
	statusCounts.forEach(s => {
		statusMap[s._id] = s.count
		total += s.count
	})

	const result = {
		// All-time counts
		total,
		draft: statusMap.draft || 0,
		pending: statusMap.pending || 0,
		confirmed: statusMap.confirmed || 0,
		completed: statusMap.completed || 0,
		cancelled: statusMap.cancelled || 0,
		// Period-based stats
		revenue: periodStats[0]?.totalRevenue || 0,
		totalRooms: periodStats[0]?.totalRooms || 0,
		totalGuests: periodStats[0]?.totalGuests || 0
	}

	res.json({
		success: true,
		data: {
			period,
			...result
		}
	})
})

// ==================== DRAFT BOOKING MANAGEMENT ====================

/**
 * Create a new draft booking
 * POST /api/bookings/drafts
 * Called when user proceeds from Phase 1 to Phase 2
 */
export const createDraft = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const {
		searchCriteria,
		hotel: hotelId,
		market: marketId,
		marketCode: requestMarketCode,
		rooms,
		checkIn,
		checkOut
	} = req.body

	// Validate hotel exists and belongs to partner
	const hotel = await Hotel.findOne({
		_id: hotelId,
		partner: partnerId,
		status: 'active'
	}).lean()

	if (!hotel) {
		throw new NotFoundError('HOTEL_NOT_FOUND')
	}

	// Get market - prefer the one passed from frontend (used during pricing)
	let market = null
	if (marketId) {
		market = await Market.findOne({
			_id: marketId,
			hotel: hotelId,
			status: 'active'
		}).lean()
	}

	// Fallback: try to find by country code
	if (!market && searchCriteria?.countryCode) {
		market = await Market.findOne({
			hotel: hotelId,
			countries: searchCriteria.countryCode.toUpperCase(),
			status: 'active'
		}).lean()
	}

	// Validate market is found
	if (!market) {
		throw new BadRequestError('MARKET_NOT_FOUND')
	}

	// Calculate totals
	const totalRooms = rooms?.length || 0
	const totalAdults = searchCriteria?.adults || 2
	const totalChildren = searchCriteria?.children?.length || 0

	// Calculate pricing totals from rooms
	let subtotal = 0
	let totalDiscount = 0
	let currency = 'TRY'
	if (rooms && rooms.length > 0) {
		rooms.forEach(room => {
			if (room.pricing) {
				subtotal += room.pricing.originalTotal || room.pricing.finalTotal || 0
				totalDiscount += room.pricing.totalDiscount || 0
				currency = room.pricing.currency || currency
				// Add custom discount
				if (room.customDiscount?.amount) {
					totalDiscount += room.customDiscount.amount
				}
			}
		})
	}

	// Generate draft booking number
	const bookingNumber = await Booking.generateBookingNumber(partnerId, 'draft')

	// Create draft
	const draft = new Booking({
		bookingNumber,
		partner: partnerId,
		status: 'draft',
		currentPhase: 2,
		hotel: hotelId,
		hotelCode: hotel.code,
		hotelName: hotel.name?.tr || hotel.name?.en || hotel.name,
		market: market?._id,
		marketCode: market?.code,
		checkIn: checkIn || searchCriteria?.dateRange?.start,
		checkOut: checkOut || searchCriteria?.dateRange?.end,
		searchCriteria,
		rooms: rooms?.map(room => ({
			roomType: room.roomType,
			roomTypeCode: room.roomTypeCode,
			roomTypeName: room.roomTypeName,
			mealPlan: room.mealPlan,
			mealPlanCode: room.mealPlanCode,
			mealPlanName: room.mealPlanName,
			pricing: room.pricing,
			dailyBreakdown: room.dailyBreakdown,
			campaigns: room.campaigns,
			guests: [],
			// Rate type information
			rateType: room.rateType || 'refundable',
			nonRefundableDiscount: room.nonRefundableDiscount || 0,
			customDiscount: room.customDiscount || null,
			// Cancellation policy based on rate type
			cancellationPolicy: {
				isRefundable: room.rateType !== 'non_refundable'
			}
		})),
		totalRooms,
		totalAdults,
		totalChildren,
		pricing: {
			currency,
			subtotal,
			totalDiscount,
			grandTotal: subtotal - totalDiscount
		},
		source: getSourceInfo(req)
	})

	await draft.save()

	res.status(201).json({
		success: true,
		data: {
			bookingNumber: draft.bookingNumber,
			_id: draft._id,
			status: draft.status,
			currentPhase: draft.currentPhase,
			expiresAt: draft.expiresAt,
			hotel: {
				_id: hotel._id,
				name: hotel.name,
				code: hotel.code
			},
			checkIn: draft.checkIn,
			checkOut: draft.checkOut,
			rooms: draft.rooms,
			pricing: draft.pricing
		}
	})
})

/**
 * Get user's draft bookings
 * GET /api/bookings/drafts
 */
export const getMyDrafts = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const query = {
		partner: partnerId,
		status: 'draft'
	}

	// If agency user, only show their drafts
	if (req.user?.accountType === 'agency') {
		query['source.agencyUserId'] = req.user._id
	}

	const drafts = await Booking.find(query)
		.populate('hotel', 'name code images')
		.sort({ lastActivityAt: -1 })
		.lean()

	res.json({
		success: true,
		data: drafts.map(d => ({
			bookingNumber: d.bookingNumber,
			_id: d._id,
			hotel: d.hotel,
			checkIn: d.checkIn,
			checkOut: d.checkOut,
			nights: d.nights,
			totalRooms: d.totalRooms,
			totalAdults: d.totalAdults,
			totalChildren: d.totalChildren,
			pricing: d.pricing,
			currentPhase: d.currentPhase,
			expiresAt: d.expiresAt,
			lastActivityAt: d.lastActivityAt,
			createdAt: d.createdAt
		}))
	})
})

/**
 * Get a single draft by booking number
 * GET /api/bookings/drafts/:bookingNumber
 */
export const getDraft = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const { bookingNumber } = req.params

	const draft = await Booking.findOne({
		bookingNumber: bookingNumber.toUpperCase(),
		partner: partnerId,
		status: 'draft'
	})
		.populate('hotel', 'name code images address stars commission')
		.populate('rooms.roomType', 'name code images')
		.populate('rooms.mealPlan', 'name code')

	if (!draft) {
		throw new NotFoundError('DRAFT_NOT_FOUND')
	}

	// Check if agency user owns this draft
	if (req.user?.accountType === 'agency') {
		if (draft.source?.agencyUserId?.toString() !== req.user._id.toString()) {
			throw new ForbiddenError('NOT_YOUR_DRAFT')
		}
	}

	res.json({
		success: true,
		data: draft
	})
})

/**
 * Update a draft booking
 * PUT /api/bookings/drafts/:bookingNumber
 * Used for auto-save in Phase 2
 */
export const updateDraft = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const { bookingNumber } = req.params
	const {
		guests,
		leadGuest,
		invoiceDetails,
		contact,
		payment,
		specialRequests,
		rooms
	} = req.body

	const draft = await Booking.findOne({
		bookingNumber: bookingNumber.toUpperCase(),
		partner: partnerId,
		status: 'draft'
	})

	if (!draft) {
		throw new NotFoundError('DRAFT_NOT_FOUND')
	}

	// Check ownership for agency users
	if (req.user?.accountType === 'agency') {
		if (draft.source?.agencyUserId?.toString() !== req.user._id.toString()) {
			throw new ForbiddenError('NOT_YOUR_DRAFT')
		}
	}

	// Update fields
	if (leadGuest) draft.leadGuest = leadGuest
	if (contact) draft.contact = contact
	if (invoiceDetails) draft.invoiceDetails = invoiceDetails
	if (payment) {
		draft.payment = {
			...draft.payment,
			method: payment.method
		}
	}
	if (specialRequests !== undefined) draft.specialRequests = specialRequests

	// Update room guests if provided
	if (rooms && rooms.length > 0) {
		rooms.forEach((roomData, index) => {
			if (draft.rooms[index] && roomData.guests) {
				// Sanitize guest data before saving
				const sanitized = sanitizeRoomGuests(roomData.guests)
				draft.rooms[index].guests = sanitized
			}
			if (draft.rooms[index] && roomData.specialRequests !== undefined) {
				draft.rooms[index].specialRequests = roomData.specialRequests
			}
		})
	}

	draft.lastActivityAt = new Date()
	await draft.save()

	res.json({
		success: true,
		data: {
			bookingNumber: draft.bookingNumber,
			lastActivityAt: draft.lastActivityAt,
			message: 'Draft updated successfully'
		}
	})
})

/**
 * Delete a draft booking
 * DELETE /api/bookings/drafts/:bookingNumber
 */
export const deleteDraft = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const { bookingNumber } = req.params

	const draft = await Booking.findOne({
		bookingNumber: bookingNumber.toUpperCase(),
		partner: partnerId,
		status: 'draft'
	})

	if (!draft) {
		throw new NotFoundError('DRAFT_NOT_FOUND')
	}

	// Check ownership for agency users
	if (req.user?.accountType === 'agency') {
		if (draft.source?.agencyUserId?.toString() !== req.user._id.toString()) {
			throw new ForbiddenError('NOT_YOUR_DRAFT')
		}
	}

	await draft.deleteOne()

	res.json({
		success: true,
		message: 'Draft deleted successfully'
	})
})

/**
 * Complete a draft and convert to confirmed booking
 * POST /api/bookings/drafts/:bookingNumber/complete
 * Final step - validates everything and reserves allotment
 */
export const completeDraft = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const { bookingNumber } = req.params

	const draft = await Booking.findOne({
		bookingNumber: bookingNumber.toUpperCase(),
		partner: partnerId,
		status: 'draft'
	})

	if (!draft) {
		throw new NotFoundError('DRAFT_NOT_FOUND')
	}

	// Validate required fields
	const errors = []

	// Hotel & Dates
	if (!draft.hotel) errors.push('HOTEL_REQUIRED')
	if (!draft.checkIn) errors.push('CHECK_IN_REQUIRED')
	if (!draft.checkOut) errors.push('CHECK_OUT_REQUIRED')
	if (!draft.rooms || draft.rooms.length === 0) errors.push('ROOMS_REQUIRED')

	// Lead guest
	if (!draft.leadGuest?.firstName) errors.push('LEAD_GUEST_FIRST_NAME_REQUIRED')
	if (!draft.leadGuest?.lastName) errors.push('LEAD_GUEST_LAST_NAME_REQUIRED')

	// Contact
	if (!draft.contact?.email) errors.push('CONTACT_EMAIL_REQUIRED')
	if (!draft.contact?.phone) errors.push('CONTACT_PHONE_REQUIRED')

	// Invoice details
	if (!draft.invoiceDetails?.type) errors.push('INVOICE_TYPE_REQUIRED')
	if (draft.invoiceDetails?.type === 'individual') {
		if (!draft.invoiceDetails.individual?.firstName) errors.push('INVOICE_FIRST_NAME_REQUIRED')
		if (!draft.invoiceDetails.individual?.lastName) errors.push('INVOICE_LAST_NAME_REQUIRED')
		// TC number required for TR citizens
		if (draft.leadGuest?.nationality === 'TR' && !draft.invoiceDetails.individual?.tcNumber) {
			errors.push('TC_NUMBER_REQUIRED_FOR_TR_CITIZENS')
		}
	} else if (draft.invoiceDetails?.type === 'corporate') {
		if (!draft.invoiceDetails.corporate?.companyName) errors.push('COMPANY_NAME_REQUIRED')
		if (!draft.invoiceDetails.corporate?.taxNumber) errors.push('TAX_NUMBER_REQUIRED')
		if (!draft.invoiceDetails.corporate?.taxOffice) errors.push('TAX_OFFICE_REQUIRED')
	}

	// Payment method
	if (!draft.payment?.method) errors.push('PAYMENT_METHOD_REQUIRED')

	if (errors.length > 0) {
		throw new BadRequestError('VALIDATION_FAILED', { errors })
	}

	// Check allotment availability for all rooms/dates
	const checkIn = new Date(draft.checkIn)
	const checkOut = new Date(draft.checkOut)
	const unavailableDates = []

	// Get market for pricing check (find once, use for all rooms)
	const countryCode = draft.searchCriteria?.countryCode || 'TR'
	let market = await Market.findOne({
		hotel: draft.hotel,
		countries: countryCode,
		isActive: true
	})

	// If no specific market, try default market
	if (!market) {
		market = await Market.findOne({
			hotel: draft.hotel,
			isDefault: true,
			isActive: true
		})
	}

	// Skip availability check if no market found (will be handled at booking creation)
	if (market) {
		for (const room of draft.rooms) {
			try {
				// Check availability
				const priceResult = await pricingService.calculatePrice({
					hotelId: draft.hotel.toString(),
					roomTypeId: room.roomType.toString(),
					mealPlanId: room.mealPlan.toString(),
					marketId: market._id.toString(),
					checkInDate: checkIn,
					checkOutDate: checkOut,
					adults: draft.totalAdults,
					children: draft.searchCriteria?.children?.map(age => ({ age })) || [],
					includeCampaigns: true
				})

				if (!priceResult.availability?.isAvailable) {
					const issues = priceResult.availability?.issues || []
					issues.forEach(issue => {
						if (issue.date && !unavailableDates.includes(issue.date)) {
							unavailableDates.push(issue.date)
						}
					})
				}
			} catch (error) {
				console.error('Availability check error:', error)
				// Don't throw, just log - availability was already checked at search time
			}
		}
	}

	if (unavailableDates.length > 0) {
		throw new BadRequestError('ALLOTMENT_NOT_AVAILABLE', {
			unavailableDates,
			message: 'Seçilen tarihlerde yeterli kontenjan kalmadı'
		})
	}

	// Reserve allotment for all rooms (using same market found above)
	if (market) {
		for (const room of draft.rooms) {
			try {
				const dates = room.dailyBreakdown?.map(d => d.date) || []
				if (dates.length > 0) {
					await pricingService.reserveAllotment({
						hotelId: draft.hotel.toString(),
						roomTypeId: room.roomType.toString(),
						mealPlanId: room.mealPlan.toString(),
						marketId: market._id.toString(),
						dates,
						quantity: 1
					})
				}
			} catch (error) {
				console.error('Allotment reserve error:', error)
				// Continue anyway - we'll handle overbooking manually
			}
		}
	}

	// Generate new booking number (BKG instead of DRF)
	const newBookingNumber = await Booking.generateBookingNumber(partnerId, 'booking')

	// Update draft to confirmed booking
	draft.bookingNumber = newBookingNumber
	draft.status = 'confirmed'
	draft.confirmedAt = new Date()
	draft.expiresAt = undefined // Clear expiration

	// Calculate nights if not set
	if (!draft.nights && draft.checkIn && draft.checkOut) {
		draft.nights = Math.ceil((new Date(draft.checkOut) - new Date(draft.checkIn)) / (1000 * 60 * 60 * 24))
	}

	await draft.save()

	// TODO: Send confirmation email

	// Emit socket event for PMS real-time updates
	const hotelId = draft.hotel?._id?.toString() || draft.hotel?.toString()
	if (hotelId) {
		emitReservationUpdate(hotelId, 'confirmed', {
			reservationId: draft._id,
			bookingNumber: draft.bookingNumber,
			guestName: getGuestDisplayName(draft.leadGuest),
			checkIn: draft.checkIn,
			checkOut: draft.checkOut,
			roomType: draft.rooms[0]?.roomType,
			status: 'confirmed',
			source: draft.source?.type || 'b2c'
		})
	}

	// Create or find PMS guest record
	await createGuestFromBooking(draft)

	// Create pending Stay for PMS (full integration)
	const pendingStay = await createPendingStayFromBooking(draft)

	res.json({
		success: true,
		data: {
			bookingNumber: draft.bookingNumber,
			stayNumber: pendingStay?.stayNumber,
			_id: draft._id,
			status: draft.status,
			confirmedAt: draft.confirmedAt,
			hotel: draft.hotelName,
			checkIn: draft.checkIn,
			checkOut: draft.checkOut,
			pricing: draft.pricing
		}
	})
})

// ==================== AMENDMENT (BOOKING MODIFICATION) ====================

// Helper: Create full booking snapshot
const createBookingSnapshot = (booking) => {
	return {
		checkIn: booking.checkIn,
		checkOut: booking.checkOut,
		nights: booking.nights,
		rooms: booking.rooms.map(r => ({
			roomType: r.roomType,
			roomTypeCode: r.roomTypeCode,
			roomTypeName: r.roomTypeName,
			mealPlan: r.mealPlan,
			mealPlanCode: r.mealPlanCode,
			mealPlanName: r.mealPlanName,
			guests: r.guests,
			pricing: r.pricing,
			dailyBreakdown: r.dailyBreakdown,
			campaigns: r.campaigns,
			rateType: r.rateType,
			nonRefundableDiscount: r.nonRefundableDiscount,
			specialRequests: r.specialRequests
		})),
		leadGuest: booking.leadGuest,
		contact: booking.contact,
		pricing: booking.pricing,
		invoiceDetails: booking.invoiceDetails,
		totalAdults: booking.totalAdults,
		totalChildren: booking.totalChildren,
		totalInfants: booking.totalInfants,
		totalRooms: booking.totalRooms,
		specialRequests: booking.specialRequests
	}
}

// Helper: Compare two values and generate change record
const compareValues = (field, fieldLabel, oldVal, newVal) => {
	// Deep comparison for objects
	const oldStr = JSON.stringify(oldVal)
	const newStr = JSON.stringify(newVal)
	if (oldStr !== newStr) {
		return { field, fieldLabel, from: oldVal, to: newVal }
	}
	return null
}

// Helper: Detect amendment type based on changes
const detectAmendmentType = (changes) => {
	const hasDateChange = changes.some(c => ['checkIn', 'checkOut', 'nights'].includes(c.field))
	const hasRoomChange = changes.some(c => c.field.startsWith('rooms'))
	const hasGuestChange = changes.some(c => c.field.startsWith('leadGuest') || c.field === 'contact')
	const hasPricingChange = changes.some(c => c.field.startsWith('pricing'))

	if (hasDateChange && hasRoomChange) return 'full'
	if (hasDateChange) return 'dates'
	if (hasRoomChange) return 'rooms'
	if (hasGuestChange) return 'guests'
	if (hasPricingChange) return 'pricing'
	return 'full'
}

/**
 * Get booking data for amendment
 * GET /api/bookings/:id/amendment
 * Returns booking with hotel's available room types and meal plans
 */
export const getBookingForAmendment = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const { id } = req.params

	// Get booking with populated data
	const booking = await Booking.findOne({
		_id: id,
		partner: partnerId
	})
		.populate('hotel', '_id name code address images childAgeGroups pricingSettings')
		.populate('market', '_id name code currency')
		.populate('rooms.roomType', '_id name code images occupancy')
		.populate('rooms.mealPlan', '_id name code')
		.lean()

	if (!booking) {
		throw new NotFoundError('BOOKING_NOT_FOUND')
	}

	// Check if booking can be amended (only pending, confirmed, checked_in)
	const amendableStatuses = ['pending', 'confirmed', 'checked_in']
	if (!amendableStatuses.includes(booking.status)) {
		throw new BadRequestError('BOOKING_CANNOT_BE_AMENDED', {
			status: booking.status,
			allowedStatuses: amendableStatuses
		})
	}

	// If booking doesn't have a market, assign a default one for display
	if (!booking.market) {
		const defaultMarket = await Market.findOne({
			hotel: booking.hotel._id,
			isDefault: true,
			status: 'active'
		}).select('_id code name currency').lean()

		if (defaultMarket) {
			booking.market = defaultMarket
		} else {
			// Get any active market
			const anyMarket = await Market.findOne({
				hotel: booking.hotel._id,
				status: 'active'
			}).select('_id code name currency').lean()

			if (anyMarket) {
				booking.market = anyMarket
			}
		}
	}

	// Get hotel's active room types
	const roomTypes = await RoomType.find({
		hotel: booking.hotel._id,
		status: 'active'
	})
		.select('_id code name images occupancy displayOrder')
		.sort('displayOrder')
		.lean()

	// Get hotel's active meal plans
	const mealPlans = await MealPlan.find({
		hotel: booking.hotel._id,
		status: 'active'
	})
		.select('_id code name displayOrder')
		.sort('displayOrder')
		.lean()

	// Get available markets for this hotel
	const markets = await Market.find({
		hotel: booking.hotel._id,
		status: 'active'
	})
		.select('_id code name currency countries isDefault')
		.lean()

	res.json({
		success: true,
		data: {
			booking,
			availableRoomTypes: roomTypes,
			availableMealPlans: mealPlans,
			availableMarkets: markets,
			canAmend: true
		}
	})
})

/**
 * Preview amendment changes
 * POST /api/bookings/:id/amendment/preview
 * Calculates new prices, checks availability, returns comparison
 */
export const previewAmendment = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const { id } = req.params
	const {
		checkIn: newCheckIn,
		checkOut: newCheckOut,
		rooms: newRooms,
		leadGuest: newLeadGuest,
		contact: newContact,
		invoiceDetails: newInvoiceDetails,
		specialRequests: newSpecialRequests
	} = req.body

	// Get current booking
	const booking = await Booking.findOne({
		_id: id,
		partner: partnerId
	})
		.populate('hotel', '_id name code pricingSettings childAgeGroups')
		.populate('market', '_id name code currency')
		.populate('rooms.roomType', '_id name code')
		.populate('rooms.mealPlan', '_id name code')

	if (!booking) {
		throw new NotFoundError('BOOKING_NOT_FOUND')
	}

	// Validate that hotel is properly populated
	if (!booking.hotel?._id) {
		throw new BadRequestError('BOOKING_HOTEL_NOT_FOUND', { message: 'Rezervasyonun oteli bulunamadı' })
	}

	// If booking doesn't have a market, try to get the default market for the hotel
	let effectiveMarket = booking.market
	if (!effectiveMarket?._id) {
		effectiveMarket = await Market.findOne({
			hotel: booking.hotel._id,
			isDefault: true,
			status: 'active'
		}).lean()

		// If no default market, get any active market for this hotel
		if (!effectiveMarket) {
			effectiveMarket = await Market.findOne({
				hotel: booking.hotel._id,
				status: 'active'
			}).lean()
		}

		if (!effectiveMarket) {
			throw new BadRequestError('NO_MARKET_AVAILABLE', {
				message: 'Bu otel için aktif bir pazar bulunamadı. Lütfen önce bir pazar tanımlayın.'
			})
		}
	}

	// Check if booking can be amended
	const amendableStatuses = ['pending', 'confirmed', 'checked_in']
	if (!amendableStatuses.includes(booking.status)) {
		throw new BadRequestError('BOOKING_CANNOT_BE_AMENDED')
	}

	// Track changes
	const changes = []
	const availabilityIssues = []
	let newPricing = null
	let newRoomsProcessed = []

	// Determine effective dates
	const effectiveCheckIn = newCheckIn || booking.checkIn
	const effectiveCheckOut = newCheckOut || booking.checkOut
	const effectiveNights = Math.ceil((new Date(effectiveCheckOut) - new Date(effectiveCheckIn)) / (1000 * 60 * 60 * 24))

	// Date changes
	if (newCheckIn && new Date(newCheckIn).toISOString() !== new Date(booking.checkIn).toISOString()) {
		changes.push(compareValues('checkIn', 'Giriş Tarihi', booking.checkIn, new Date(newCheckIn)))
	}
	if (newCheckOut && new Date(newCheckOut).toISOString() !== new Date(booking.checkOut).toISOString()) {
		changes.push(compareValues('checkOut', 'Çıkış Tarihi', booking.checkOut, new Date(newCheckOut)))
	}

	// Lead guest changes
	if (newLeadGuest) {
		if (newLeadGuest.firstName !== booking.leadGuest?.firstName) {
			changes.push(compareValues('leadGuest.firstName', 'Adı', booking.leadGuest?.firstName, newLeadGuest.firstName))
		}
		if (newLeadGuest.lastName !== booking.leadGuest?.lastName) {
			changes.push(compareValues('leadGuest.lastName', 'Soyadı', booking.leadGuest?.lastName, newLeadGuest.lastName))
		}
		if (newLeadGuest.tcNumber !== booking.leadGuest?.tcNumber) {
			changes.push(compareValues('leadGuest.tcNumber', 'T.C. Kimlik No', booking.leadGuest?.tcNumber, newLeadGuest.tcNumber))
		}
		if (newLeadGuest.passportNumber !== booking.leadGuest?.passportNumber) {
			changes.push(compareValues('leadGuest.passportNumber', 'Pasaport No', booking.leadGuest?.passportNumber, newLeadGuest.passportNumber))
		}
		if (newLeadGuest.nationality !== booking.leadGuest?.nationality) {
			changes.push(compareValues('leadGuest.nationality', 'Uyruk', booking.leadGuest?.nationality, newLeadGuest.nationality))
		}
	}

	// Contact changes
	if (newContact) {
		if (newContact.email !== booking.contact?.email) {
			changes.push(compareValues('contact.email', 'E-posta', booking.contact?.email, newContact.email))
		}
		if (newContact.phone !== booking.contact?.phone) {
			changes.push(compareValues('contact.phone', 'Telefon', booking.contact?.phone, newContact.phone))
		}
	}

	// Filter out null changes
	const validChanges = changes.filter(c => c !== null)

	// If rooms or dates changed, recalculate pricing
	const roomsToProcess = newRooms || booking.rooms.map(r => ({
		roomTypeId: r.roomType._id?.toString() || r.roomType.toString(),
		mealPlanId: r.mealPlan._id?.toString() || r.mealPlan.toString(),
		adults: r.guests?.filter(g => g.type === 'adult').length || 2,
		children: r.guests?.filter(g => g.type === 'child').map(g => g.age) || [],
		guests: r.guests,
		rateType: r.rateType || 'refundable'
	}))

	let subtotal = 0
	let totalDiscount = 0
	const currency = effectiveMarket?.currency || booking.pricing?.currency || 'TRY'

	for (let i = 0; i < roomsToProcess.length; i++) {
		const roomData = roomsToProcess[i]
		const originalRoom = booking.rooms[i]

		// Validate roomTypeId and mealPlanId
		if (!roomData.roomTypeId || roomData.roomTypeId === 'undefined') {
			availabilityIssues.push({
				roomIndex: i,
				error: 'INVALID_ROOM_TYPE_ID',
				message: 'Geçersiz oda tipi ID'
			})
			continue
		}

		if (!roomData.mealPlanId || roomData.mealPlanId === 'undefined') {
			availabilityIssues.push({
				roomIndex: i,
				error: 'INVALID_MEAL_PLAN_ID',
				message: 'Geçersiz pansiyon tipi ID'
			})
			continue
		}

		try {
			const pricingParams = {
				hotelId: booking.hotel._id.toString(),
				roomTypeId: roomData.roomTypeId,
				mealPlanId: roomData.mealPlanId,
				marketId: effectiveMarket._id.toString(),
				checkInDate: effectiveCheckIn,
				checkOutDate: effectiveCheckOut,
				adults: roomData.adults,
				children: roomData.children?.map(age => ({ age })) || [],
				includeCampaigns: true
			}

			// Calculate new price
			const priceResult = await pricingService.calculatePriceWithCampaigns(pricingParams)

			// Check if pricing calculation was successful
			if (!priceResult.success || !priceResult.pricing) {
				availabilityIssues.push({
					roomIndex: i,
					roomType: roomData.roomTypeId,
					error: priceResult.error || 'PRICING_FAILED',
					message: priceResult.message || 'Fiyat hesaplanamadı'
				})
				continue // Skip this room and continue with others
			}

			// Check availability
			if (!priceResult.availability?.isAvailable) {
				availabilityIssues.push({
					roomIndex: i,
					roomType: roomData.roomTypeId,
					issues: priceResult.availability?.issues || [],
					message: 'Bu oda tipi için seçilen tarihlerde müsaitlik yok'
				})
			}

			// Get room type and meal plan names
			const roomType = await RoomType.findById(roomData.roomTypeId).select('code name').lean()
			const mealPlan = await MealPlan.findById(roomData.mealPlanId).select('code name').lean()

			// Track room changes
			if (originalRoom) {
				const origRoomTypeId = originalRoom.roomType._id?.toString() || originalRoom.roomType.toString()
				const origMealPlanId = originalRoom.mealPlan._id?.toString() || originalRoom.mealPlan.toString()

				if (roomData.roomTypeId !== origRoomTypeId) {
					validChanges.push({
						field: `rooms[${i}].roomType`,
						fieldLabel: `Oda ${i + 1} Tipi`,
						from: originalRoom.roomTypeName,
						to: roomType?.name
					})
				}
				if (roomData.mealPlanId !== origMealPlanId) {
					validChanges.push({
						field: `rooms[${i}].mealPlan`,
						fieldLabel: `Oda ${i + 1} Pansiyon`,
						from: originalRoom.mealPlanName,
						to: mealPlan?.name
					})
				}
			}

			// Apply non-refundable discount if applicable
			let finalPrice = priceResult.pricing.finalTotal
			if (roomData.rateType === 'non_refundable' && priceResult.nonRefundable?.enabled) {
				finalPrice = priceResult.nonRefundable.discountedTotal
			}

			newRoomsProcessed.push({
				roomType: roomData.roomTypeId,
				roomTypeCode: roomType?.code,
				roomTypeName: roomType?.name,
				mealPlan: roomData.mealPlanId,
				mealPlanCode: mealPlan?.code,
				mealPlanName: mealPlan?.name,
				guests: roomData.guests || originalRoom?.guests || [],
				pricing: {
					currency,
					originalTotal: priceResult.pricing.originalTotal,
					discount: priceResult.pricing.totalDiscount,
					finalTotal: finalPrice,
					avgPerNight: finalPrice / effectiveNights
				},
				dailyBreakdown: priceResult.dailyBreakdown,
				campaigns: priceResult.campaigns?.applied || [],
				rateType: roomData.rateType,
				nonRefundableDiscount: roomData.rateType === 'non_refundable' ? priceResult.nonRefundable?.discountPercent : 0,
				available: priceResult.availability?.isAvailable
			})

			subtotal += priceResult.pricing.originalTotal
			totalDiscount += priceResult.pricing.totalDiscount + (roomData.rateType === 'non_refundable' ? (priceResult.pricing.finalTotal - finalPrice) : 0)
		} catch (error) {
			console.error('Amendment pricing error for room', i, ':', error.message)
			console.error('Error stack:', error.stack)
			availabilityIssues.push({
				roomIndex: i,
				roomType: roomData.roomTypeId,
				error: error.message,
				errorCode: error.code,
				message: 'Fiyat hesaplanamadı: ' + error.message
			})
		}
	}

	// Calculate new total
	const grandTotal = subtotal - totalDiscount
	newPricing = {
		currency,
		subtotal,
		totalDiscount,
		grandTotal
	}

	// Calculate price difference
	const originalTotal = booking.pricing?.grandTotal || 0
	const difference = grandTotal - originalTotal

	res.json({
		success: true,
		data: {
			changes: validChanges,
			amendmentType: detectAmendmentType(validChanges),
			availability: {
				allAvailable: availabilityIssues.length === 0,
				issues: availabilityIssues
			},
			// Debug info
			_debug: {
				roomsToProcessCount: roomsToProcess.length,
				roomsProcessedCount: newRoomsProcessed.length,
				subtotal,
				totalDiscount,
				hasIssues: availabilityIssues.length > 0
			},
			original: {
				checkIn: booking.checkIn,
				checkOut: booking.checkOut,
				nights: booking.nights,
				rooms: booking.rooms,
				pricing: booking.pricing,
				leadGuest: booking.leadGuest,
				contact: booking.contact
			},
			preview: {
				checkIn: effectiveCheckIn,
				checkOut: effectiveCheckOut,
				nights: effectiveNights,
				rooms: newRoomsProcessed,
				pricing: newPricing,
				leadGuest: newLeadGuest || booking.leadGuest,
				contact: newContact || booking.contact
			},
			priceDifference: {
				currency,
				originalTotal,
				newTotal: grandTotal,
				difference,
				isIncrease: difference > 0,
				isDecrease: difference < 0
			}
		}
	})
})

/**
 * Apply amendment to booking
 * POST /api/bookings/:id/amendment/apply
 * Creates snapshot, updates booking, handles allotment
 */
export const applyAmendment = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const { id } = req.params
	const {
		checkIn: newCheckIn,
		checkOut: newCheckOut,
		rooms: newRooms,
		leadGuest: newLeadGuest,
		contact: newContact,
		invoiceDetails: newInvoiceDetails,
		specialRequests: newSpecialRequests,
		reason,
		priceDifferenceAdjustment
	} = req.body

	// Validate reason
	if (!reason || reason.trim().length < 10) {
		throw new BadRequestError('AMENDMENT_REASON_REQUIRED', {
			message: 'Değişiklik nedeni en az 10 karakter olmalıdır'
		})
	}

	// Get current booking
	const booking = await Booking.findOne({
		_id: id,
		partner: partnerId
	})
		.populate('hotel', 'name code pricingSettings')
		.populate('market', 'name code currency')

	if (!booking) {
		throw new NotFoundError('BOOKING_NOT_FOUND')
	}

	// Check if booking can be amended
	const amendableStatuses = ['pending', 'confirmed', 'checked_in']
	if (!amendableStatuses.includes(booking.status)) {
		throw new BadRequestError('BOOKING_CANNOT_BE_AMENDED')
	}

	// Create snapshot of current state BEFORE any changes
	const snapshot = {
		snapshotId: new mongoose.Types.ObjectId().toString(),
		takenAt: new Date(),
		takenBy: req.user?._id,
		takenByName: req.user?.name || req.user?.email || 'System',
		reason: reason.trim(),
		bookingState: createBookingSnapshot(booking),
		amendment: {
			type: 'full', // Will be updated after detecting changes
			changes: [],
			priceDifference: {
				currency: booking.pricing?.currency || 'TRY',
				originalTotal: booking.pricing?.grandTotal || 0,
				newTotal: 0,
				difference: 0,
				adjustedDifference: priceDifferenceAdjustment?.adjustedAmount,
				adjustmentReason: priceDifferenceAdjustment?.reason,
				waived: priceDifferenceAdjustment?.waived || false
			}
		}
	}

	// Track changes
	const changes = []

	// Release old allotment first
	for (const room of booking.rooms) {
		const dates = room.dailyBreakdown?.map(d => d.date) || []
		if (dates.length > 0) {
			try {
				await pricingService.releaseAllotment({
					hotelId: booking.hotel._id.toString(),
					roomTypeId: room.roomType._id?.toString() || room.roomType.toString(),
					mealPlanId: room.mealPlan._id?.toString() || room.mealPlan.toString(),
					marketId: booking.market._id.toString(),
					dates,
					rooms: 1
				})
			} catch (error) {
				console.error('Allotment release error:', error.message)
			}
		}
	}

	// Update dates if changed
	if (newCheckIn) {
		const oldCheckIn = booking.checkIn
		booking.checkIn = new Date(newCheckIn)
		if (oldCheckIn?.toISOString() !== booking.checkIn.toISOString()) {
			changes.push({ field: 'checkIn', fieldLabel: 'Giriş Tarihi', from: oldCheckIn, to: booking.checkIn })
		}
	}
	if (newCheckOut) {
		const oldCheckOut = booking.checkOut
		booking.checkOut = new Date(newCheckOut)
		if (oldCheckOut?.toISOString() !== booking.checkOut.toISOString()) {
			changes.push({ field: 'checkOut', fieldLabel: 'Çıkış Tarihi', from: oldCheckOut, to: booking.checkOut })
		}
	}

	// Recalculate nights
	booking.nights = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24))

	// Update lead guest if changed
	if (newLeadGuest) {
		const oldLeadGuest = { ...booking.leadGuest }
		Object.assign(booking.leadGuest, newLeadGuest)
		changes.push({ field: 'leadGuest', fieldLabel: 'Misafir Bilgileri', from: oldLeadGuest, to: booking.leadGuest })
	}

	// Update contact if changed
	if (newContact) {
		const oldContact = { ...booking.contact }
		booking.contact = { ...booking.contact, ...newContact }
		changes.push({ field: 'contact', fieldLabel: 'İletişim Bilgileri', from: oldContact, to: booking.contact })
	}

	// Update invoice details if changed
	if (newInvoiceDetails) {
		const oldInvoice = { ...booking.invoiceDetails }
		booking.invoiceDetails = newInvoiceDetails
		changes.push({ field: 'invoiceDetails', fieldLabel: 'Fatura Bilgileri', from: oldInvoice, to: booking.invoiceDetails })
	}

	// Update special requests if changed
	if (newSpecialRequests !== undefined) {
		const oldRequests = booking.specialRequests
		booking.specialRequests = newSpecialRequests
		if (oldRequests !== newSpecialRequests) {
			changes.push({ field: 'specialRequests', fieldLabel: 'Özel İstekler', from: oldRequests, to: newSpecialRequests })
		}
	}

	// Process rooms if changed
	if (newRooms && newRooms.length > 0) {
		const processedRooms = []
		let subtotal = 0
		let totalDiscount = 0
		const currency = booking.market?.currency || booking.pricing?.currency || 'TRY'

		for (const roomData of newRooms) {
			const priceResult = await pricingService.calculatePriceWithCampaigns({
				hotelId: booking.hotel._id.toString(),
				roomTypeId: roomData.roomTypeId,
				mealPlanId: roomData.mealPlanId,
				marketId: booking.market._id.toString(),
				checkInDate: booking.checkIn,
				checkOutDate: booking.checkOut,
				adults: roomData.adults || 2,
				children: roomData.children?.map(age => ({ age })) || [],
				includeCampaigns: true
			})

			if (!priceResult.availability?.isAvailable) {
				throw new BadRequestError('ROOM_NOT_AVAILABLE', {
					roomType: roomData.roomTypeId,
					message: 'Seçilen oda tipi için müsaitlik yok'
				})
			}

			const roomType = await RoomType.findById(roomData.roomTypeId).select('code name').lean()
			const mealPlan = await MealPlan.findById(roomData.mealPlanId).select('code name').lean()

			let finalPrice = priceResult.pricing.finalTotal
			if (roomData.rateType === 'non_refundable' && priceResult.nonRefundable?.enabled) {
				finalPrice = priceResult.nonRefundable.discountedTotal
			}

			processedRooms.push({
				roomType: roomData.roomTypeId,
				roomTypeCode: roomType?.code,
				roomTypeName: roomType?.name,
				mealPlan: roomData.mealPlanId,
				mealPlanCode: mealPlan?.code,
				mealPlanName: mealPlan?.name,
				guests: roomData.guests || [],
				pricing: {
					currency,
					originalTotal: priceResult.pricing.originalTotal,
					discount: priceResult.pricing.totalDiscount,
					finalTotal: finalPrice,
					avgPerNight: finalPrice / booking.nights
				},
				dailyBreakdown: priceResult.dailyBreakdown,
				campaigns: priceResult.campaigns?.applied || [],
				rateType: roomData.rateType || 'refundable',
				nonRefundableDiscount: roomData.rateType === 'non_refundable' ? priceResult.nonRefundable?.discountPercent : 0,
				specialRequests: roomData.specialRequests
			})

			subtotal += priceResult.pricing.originalTotal
			totalDiscount += priceResult.pricing.totalDiscount

			// Reserve new allotment
			const dates = priceResult.dailyBreakdown.map(d => d.date)
			try {
				await pricingService.reserveAllotment({
					hotelId: booking.hotel._id.toString(),
					roomTypeId: roomData.roomTypeId,
					mealPlanId: roomData.mealPlanId,
					marketId: booking.market._id.toString(),
					dates,
					rooms: 1
				})
			} catch (error) {
				console.error('Allotment reservation error:', error.message)
			}
		}

		changes.push({ field: 'rooms', fieldLabel: 'Odalar', from: booking.rooms.length, to: processedRooms.length })

		booking.rooms = processedRooms
		booking.totalRooms = processedRooms.length

		// Update pricing
		const grandTotal = subtotal - totalDiscount
		booking.pricing = {
			...booking.pricing,
			subtotal,
			totalDiscount,
			grandTotal
		}

		// Update snapshot with price difference
		snapshot.amendment.priceDifference.newTotal = grandTotal
		snapshot.amendment.priceDifference.difference = grandTotal - snapshot.amendment.priceDifference.originalTotal
	}

	// Update snapshot with changes
	snapshot.amendment.changes = changes
	snapshot.amendment.type = detectAmendmentType(changes)

	// Add snapshot to booking
	if (!booking.amendmentSnapshots) {
		booking.amendmentSnapshots = []
	}
	booking.amendmentSnapshots.push(snapshot)

	// Add modification record
	booking.modifications.push({
		modifiedAt: new Date(),
		modifiedBy: req.user?._id,
		type: snapshot.amendment.type,
		description: reason,
		previousValue: snapshot.bookingState.pricing?.grandTotal,
		newValue: booking.pricing?.grandTotal
	})

	// Save booking
	await booking.save()

	// Emit socket event
	const hotelId = booking.hotel?._id?.toString() || booking.hotel?.toString()
	if (hotelId) {
		emitReservationUpdate(hotelId, 'updated', {
			reservationId: booking._id,
			bookingNumber: booking.bookingNumber,
			guestName: getGuestDisplayName(booking.leadGuest),
			checkIn: booking.checkIn,
			checkOut: booking.checkOut,
			status: booking.status,
			amendmentType: snapshot.amendment.type
		})
	}

	res.json({
		success: true,
		data: {
			bookingNumber: booking.bookingNumber,
			_id: booking._id,
			status: booking.status,
			amendmentApplied: true,
			snapshotId: snapshot.snapshotId,
			changes: changes.length,
			priceDifference: snapshot.amendment.priceDifference
		}
	})
})

/**
 * Get amendment history
 * GET /api/bookings/:id/amendments
 * Returns all amendment snapshots for a booking
 */
export const getAmendmentHistory = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) {
		throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
	}

	const { id } = req.params

	const booking = await Booking.findOne({
		_id: id,
		partner: partnerId
	})
		.select('bookingNumber amendmentSnapshots modifications')
		.populate('amendmentSnapshots.takenBy', 'name email')
		.lean()

	if (!booking) {
		throw new NotFoundError('BOOKING_NOT_FOUND')
	}

	// Sort by date descending (newest first)
	const history = (booking.amendmentSnapshots || []).sort((a, b) =>
		new Date(b.takenAt) - new Date(a.takenAt)
	)

	res.json({
		success: true,
		data: {
			bookingNumber: booking.bookingNumber,
			totalAmendments: history.length,
			amendments: history.map(s => ({
				snapshotId: s.snapshotId,
				takenAt: s.takenAt,
				takenBy: s.takenByName || s.takenBy?.name || s.takenBy?.email || 'System',
				reason: s.reason,
				type: s.amendment?.type,
				changes: s.amendment?.changes || [],
				priceDifference: s.amendment?.priceDifference,
				// Include previous state for comparison
				previousState: {
					checkIn: s.bookingState?.checkIn,
					checkOut: s.bookingState?.checkOut,
					nights: s.bookingState?.nights,
					totalRooms: s.bookingState?.totalRooms,
					pricing: s.bookingState?.pricing
				}
			}))
		}
	})
})
