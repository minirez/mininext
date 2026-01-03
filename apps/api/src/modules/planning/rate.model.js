import mongoose from 'mongoose'
import auditPlugin from '../../plugins/auditPlugin.js'

/**
 * Rate Model (Daily Rate)
 *
 * Design: One record per day per room/mealPlan/market combination
 * - Simple upsert operations
 * - No period splitting needed
 * - Periods are calculated dynamically by grouping consecutive identical days
 */

// Child pricing tier schema
const childPricingSchema = new mongoose.Schema({
	minAge: { type: Number, required: true, min: 0, max: 17 },
	maxAge: { type: Number, required: true, min: 0, max: 17 },
	price: { type: Number, required: true, min: 0 }
}, { _id: false })

const rateSchema = new mongoose.Schema({
	// Multi-tenant
	partner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Partner',
		required: [true, 'REQUIRED_PARTNER'],
		index: true
	},

	hotel: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Hotel',
		required: [true, 'REQUIRED_HOTEL'],
		index: true
	},

	// Rate dimensions
	roomType: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'RoomType',
		required: [true, 'REQUIRED_ROOM_TYPE'],
		index: true
	},

	mealPlan: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'MealPlan',
		required: [true, 'REQUIRED_MEAL_PLAN'],
		index: true
	},

	market: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Market',
		required: [true, 'REQUIRED_MARKET'],
		index: true
	},

	// SINGLE DATE (not a range!)
	date: {
		type: Date,
		required: [true, 'REQUIRED_DATE'],
		index: true
	},

	// Optional season reference
	season: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Season',
		default: null
	},

	// Pricing Type: 'unit' (room-based) or 'per_person' (occupancy-based/OBP)
	pricingType: {
		type: String,
		enum: ['unit', 'per_person'],
		default: 'unit'
	},

	// Unit-based pricing (default)
	pricePerNight: {
		type: Number,
		min: 0,
		default: 0
	},

	// Single person supplement (deduction from base price) - only for unit pricing
	singleSupplement: { type: Number, default: 0 },

	// Extra person pricing - only for unit pricing
	extraAdult: { type: Number, default: 0, min: 0 },
	extraChild: { type: Number, default: 0, min: 0 }, // Fallback single child price
	extraInfant: { type: Number, default: 0, min: 0 },

	// Occupancy-based pricing (OBP) - price per number of adults
	// Used when pricingType === 'per_person'
	occupancyPricing: {
		1: { type: Number, min: 0 },  // 1 adult price
		2: { type: Number, min: 0 },  // 2 adults price
		3: { type: Number, min: 0 },  // 3 adults price
		4: { type: Number, min: 0 },  // 4 adults price
		5: { type: Number, min: 0 },  // 5 adults price
		6: { type: Number, min: 0 },  // 6 adults price
		7: { type: Number, min: 0 },  // 7 adults price
		8: { type: Number, min: 0 },  // 8 adults price
		9: { type: Number, min: 0 },  // 9 adults price
		10: { type: Number, min: 0 } // 10 adults price
	},

	// Per-child-order pricing: [1st child price, 2nd child price, ...]
	// Example: [0, 50, 75] means 1st child free, 2nd child €50, 3rd child €75
	childOrderPricing: [{
		type: Number,
		min: 0
	}],

	// Age-based child pricing tiers (alternative to order-based)
	childPricing: [childPricingSchema],

	// ===== MULTIPLIER OVERRIDE (for OBP with multipliers) =====
	// If true, use multiplierOverride instead of room's multiplierTemplate
	useMultiplierOverride: { type: Boolean, default: false },

	// Override multipliers for this period (same structure as RoomType.multiplierTemplate)
	multiplierOverride: {
		// Adult multipliers override { 1: 0.8, 2: 1.0, 3: 1.3, ... }
		adultMultipliers: {
			type: Map,
			of: Number,
			default: undefined
		},

		// Child multipliers override - per order, per age group
		childMultipliers: {
			type: Map,
			of: {
				type: Map,
				of: Number
			},
			default: undefined
		},

		// Combination table override (optional - usually auto-calculated)
		combinationTable: [{
			key: { type: String },
			adults: { type: Number, min: 1 },
			children: [{
				order: { type: Number },
				ageGroup: { type: String }
			}],
			calculatedMultiplier: { type: Number },
			overrideMultiplier: { type: Number, default: null },
			isActive: { type: Boolean, default: true }
		}],

		// Rounding rule override
		roundingRule: {
			type: String,
			enum: ['none', 'nearest', 'up', 'down', 'nearest5', 'nearest10'],
			default: undefined
		}
	},

	// Currency (stored for historical reference)
	currency: {
		type: String,
		enum: ['TRY', 'USD', 'EUR', 'GBP', 'RUB', 'SAR', 'AED', 'CHF', 'JPY', 'CNY'],
		required: true
	},

	// Inventory
	allotment: { type: Number, default: 0, min: 0 }, // Available rooms
	sold: { type: Number, default: 0, min: 0 }, // Sold rooms (for tracking)

	// Stay restrictions
	minStay: { type: Number, default: 1, min: 1, max: 30 },
	maxStay: { type: Number, default: 30, min: 1, max: 365 },

	// Sales control
	stopSale: { type: Boolean, default: false },
	stopSaleReason: { type: String, trim: true },

	// Single stop - if true, single occupancy (1 adult) bookings are not allowed
	singleStop: { type: Boolean, default: false },

	// Release days (advance booking requirement)
	releaseDays: { type: Number, default: 0, min: 0 },

	// Arrival/Departure restrictions
	closedToArrival: { type: Boolean, default: false },
	closedToDeparture: { type: Boolean, default: false },

	// Source tracking (how was this rate created/updated)
	source: {
		type: String,
		enum: ['manual', 'ai', 'bulk', 'import', 'contract'],
		default: 'manual'
	},

	// AI command that last modified this (for audit trail)
	aiCommand: { type: String, default: null },

	// Status
	status: {
		type: String,
		enum: ['active', 'inactive'],
		default: 'active'
	}

}, {
	timestamps: true,
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
})

// UNIQUE constraint: one rate per day per combination
rateSchema.index(
	{ hotel: 1, roomType: 1, mealPlan: 1, market: 1, date: 1 },
	{ unique: true }
)

// Efficient query indexes
rateSchema.index({ partner: 1, hotel: 1, date: 1 })
rateSchema.index({ hotel: 1, date: 1, status: 1 })
rateSchema.index({ hotel: 1, roomType: 1, date: 1 })
rateSchema.index({ hotel: 1, market: 1, date: 1 })
rateSchema.index({ hotel: 1, stopSale: 1, date: 1 })

// Virtual: available rooms
rateSchema.virtual('available').get(function() {
	return Math.max(0, this.allotment - this.sold)
})

// Virtual: is bookable
rateSchema.virtual('isBookable').get(function() {
	return this.status === 'active' &&
		!this.stopSale &&
		this.available > 0
})

// ==================== STATIC METHODS ====================

/**
 * Find rates by hotel with optional filters
 */
rateSchema.statics.findByHotel = function(hotelId, filters = {}) {
	const query = { hotel: hotelId }

	if (filters.roomType) query.roomType = filters.roomType
	if (filters.mealPlan) query.mealPlan = filters.mealPlan
	if (filters.market) query.market = filters.market
	if (filters.startDate && filters.endDate) {
		query.date = {
			$gte: new Date(filters.startDate),
			$lte: new Date(filters.endDate)
		}
	}
	if (filters.status) query.status = filters.status

	return this.find(query).sort('date')
}

/**
 * Find rate for a specific date
 */
rateSchema.statics.findByDate = function(hotelId, roomTypeId, mealPlanId, marketId, date) {
	return this.findOne({
		hotel: hotelId,
		roomType: roomTypeId,
		mealPlan: mealPlanId,
		market: marketId,
		date: new Date(date),
		status: 'active'
	})
}

/**
 * Find rates in a date range
 */
rateSchema.statics.findInRange = async function(hotelId, startDate, endDate, filters = {}) {
	const query = {
		hotel: hotelId,
		date: {
			$gte: new Date(startDate),
			$lte: new Date(endDate)
		},
		status: 'active'
	}

	if (filters.roomType) query.roomType = filters.roomType
	if (filters.mealPlan) query.mealPlan = filters.mealPlan
	if (filters.market) query.market = filters.market

	return this.find(query)
		.populate('roomType', '_id name code')
		.populate('mealPlan', '_id name code')
		.populate('market', '_id name code currency')
		.populate('season', '_id name code color')
		.sort('date')
}

/**
 * Bulk upsert daily rates
 * Creates or updates rates for specified dates
 */
rateSchema.statics.bulkUpsert = async function(rates) {
	const operations = rates.map(rate => ({
		updateOne: {
			filter: {
				hotel: rate.hotel,
				roomType: rate.roomType,
				mealPlan: rate.mealPlan,
				market: rate.market,
				date: rate.date
			},
			update: { $set: rate },
			upsert: true
		}
	}))

	return this.bulkWrite(operations)
}

/**
 * Bulk update rates in date range
 * Updates specific fields for matching rates
 */
rateSchema.statics.bulkUpdateInRange = async function(hotelId, startDate, endDate, updates, filters = {}) {
	const query = {
		hotel: hotelId,
		date: {
			$gte: new Date(startDate),
			$lte: new Date(endDate)
		}
	}

	if (filters.roomType) query.roomType = filters.roomType
	if (filters.mealPlan) query.mealPlan = filters.mealPlan
	if (filters.market) query.market = filters.market

	return this.updateMany(query, { $set: updates })
}

/**
 * Get periods view - groups consecutive days with same values
 * Returns array of periods for display
 */
rateSchema.statics.getPeriodsView = async function(hotelId, filters = {}) {
	const query = { hotel: hotelId, status: 'active' }

	if (filters.roomType) query.roomType = filters.roomType
	if (filters.mealPlan) query.mealPlan = filters.mealPlan
	if (filters.market) query.market = filters.market
	if (filters.startDate && filters.endDate) {
		query.date = {
			$gte: new Date(filters.startDate),
			$lte: new Date(filters.endDate)
		}
	}

	const rates = await this.find(query)
		.populate('roomType', 'name code')
		.populate('mealPlan', 'name code')
		.populate('market', 'name code currency')
		.sort({ roomType: 1, mealPlan: 1, date: 1 })
		.lean()

	if (rates.length === 0) return []

	// Group consecutive days with same values into periods
	const periods = []
	let currentPeriod = null

	// Helper to get base price - works for unit, OBP with occupancyPricing, and OBP with multipliers
	const getBasePrice = (rate) => {
		// For unit pricing, always use pricePerNight
		if (rate.pricingType === 'unit') {
			return rate.pricePerNight || 0
		}

		// For OBP (per_person):
		// 1. If using multiplier system, pricePerNight is the base price
		if (rate.useMultiplierOverride || rate.multiplierOverride) {
			return rate.pricePerNight || 0
		}

		// 2. If occupancyPricing exists and has values, use occupancyPricing[2] as base
		if (rate.occupancyPricing) {
			const occ2 = rate.occupancyPricing[2] || rate.occupancyPricing['2']
			const occ1 = rate.occupancyPricing[1] || rate.occupancyPricing['1']
			if (occ2 > 0) return occ2
			if (occ1 > 0) return occ1
		}

		// 3. Fallback to pricePerNight (may be used as base in multiplier system)
		return rate.pricePerNight || 0
	}

	const isSameValues = (a, b) => {
		// Must be same room/meal/market
		if (a.roomType._id.toString() !== b.roomType._id.toString()) return false
		if (a.mealPlan._id.toString() !== b.mealPlan._id.toString()) return false
		if (a.market._id.toString() !== b.market._id.toString()) return false

		// Compare base price only (works for both unit and OBP)
		const priceA = getBasePrice(a)
		const priceB = getBasePrice(b)
		if (priceA !== priceB) return false

		return true
	}

	const isConsecutiveDay = (prevDate, currDate) => {
		const prev = new Date(prevDate)
		const curr = new Date(currDate)
		const diffDays = (curr - prev) / (1000 * 60 * 60 * 24)
		return diffDays === 1
	}

	// Create period object with normalized pricePerNight for display
	const createPeriodObj = (rate) => ({
		...rate,
		startDate: rate.date,
		endDate: rate.date,
		_id: rate._id,
		// Ensure pricePerNight is set for both unit and OBP pricing
		pricePerNight: getBasePrice(rate)
	})

	for (const rate of rates) {
		if (!currentPeriod) {
			// Start new period
			currentPeriod = createPeriodObj(rate)
		} else if (isSameValues(currentPeriod, rate) && isConsecutiveDay(currentPeriod.endDate, rate.date)) {
			// Extend current period
			currentPeriod.endDate = rate.date
		} else {
			// Save current period and start new one
			periods.push(currentPeriod)
			currentPeriod = createPeriodObj(rate)
		}
	}

	// Don't forget the last period
	if (currentPeriod) {
		periods.push(currentPeriod)
	}

	return periods
}

/**
 * Toggle stop sale for date range
 */
rateSchema.statics.toggleStopSale = async function(hotelId, startDate, endDate, stopSale, reason = '', filters = {}) {
	const query = {
		hotel: hotelId,
		date: {
			$gte: new Date(startDate),
			$lte: new Date(endDate)
		}
	}

	if (filters.roomType) query.roomType = filters.roomType
	if (filters.mealPlan) query.mealPlan = filters.mealPlan
	if (filters.market) query.market = filters.market

	return this.updateMany(
		query,
		{ $set: { stopSale, stopSaleReason: stopSale ? reason : '' } }
	)
}

/**
 * Update allotment for date range
 */
rateSchema.statics.updateAllotment = async function(hotelId, startDate, endDate, allotment, filters = {}) {
	const query = {
		hotel: hotelId,
		date: {
			$gte: new Date(startDate),
			$lte: new Date(endDate)
		}
	}

	if (filters.roomType) query.roomType = filters.roomType
	if (filters.mealPlan) query.mealPlan = filters.mealPlan
	if (filters.market) query.market = filters.market

	return this.updateMany(query, { $set: { allotment } })
}

/**
 * Generate date array between two dates
 */
rateSchema.statics.generateDateRange = function(startDate, endDate) {
	const dates = []
	const current = new Date(startDate)
	const end = new Date(endDate)

	while (current <= end) {
		dates.push(new Date(current))
		current.setDate(current.getDate() + 1)
	}

	return dates
}

/**
 * Create rates for date range (bulk create)
 */
rateSchema.statics.createForDateRange = async function(baseData, startDate, endDate) {
	const dates = this.generateDateRange(startDate, endDate)

	const rates = dates.map(date => ({
		...baseData,
		date
	}))

	return this.bulkUpsert(rates)
}

// ==================== VALIDATION ====================

// Multiplier validation constants
const MULTIPLIER_MIN = 0
const MULTIPLIER_MAX = 5 // Max 5x multiplier (e.g., 500% of base price)
const ADULT_COUNT_MAX = 10
const CHILD_ORDER_MAX = 6

/**
 * Validate multiplier value
 */
function validateMultiplier(value, context = '') {
	if (typeof value !== 'number' || isNaN(value)) {
		throw new Error(`Invalid multiplier value for ${context}: must be a number`)
	}
	if (value < MULTIPLIER_MIN) {
		throw new Error(`Multiplier for ${context} cannot be negative`)
	}
	if (value > MULTIPLIER_MAX) {
		throw new Error(`Multiplier for ${context} exceeds maximum (${MULTIPLIER_MAX})`)
	}
	return true
}

/**
 * Pre-save validation for multipliers and pricing
 */
rateSchema.pre('save', function(next) {
	try {
		// Validate occupancyPricing
		if (this.occupancyPricing) {
			for (let i = 1; i <= ADULT_COUNT_MAX; i++) {
				const price = this.occupancyPricing[i]
				if (price !== undefined && price !== null) {
					if (typeof price !== 'number' || price < 0) {
						return next(new Error(`Invalid occupancy price for ${i} adults`))
					}
				}
			}
		}

		// Validate multiplierOverride
		if (this.useMultiplierOverride && this.multiplierOverride) {
			// Validate adult multipliers
			if (this.multiplierOverride.adultMultipliers) {
				const adultMults = this.multiplierOverride.adultMultipliers
				const map = adultMults instanceof Map ? adultMults : new Map(Object.entries(adultMults))

				for (const [key, value] of map) {
					const adultCount = parseInt(key)
					if (adultCount < 1 || adultCount > ADULT_COUNT_MAX) {
						return next(new Error(`Invalid adult count in multiplier: ${key}`))
					}
					validateMultiplier(value, `${adultCount} adults`)
				}
			}

			// Validate child multipliers
			if (this.multiplierOverride.childMultipliers) {
				const childMults = this.multiplierOverride.childMultipliers
				const map = childMults instanceof Map ? childMults : new Map(Object.entries(childMults))

				for (const [orderKey, ageGroupMap] of map) {
					const order = parseInt(orderKey)
					if (order < 1 || order > CHILD_ORDER_MAX) {
						return next(new Error(`Invalid child order in multiplier: ${orderKey}`))
					}

					const ageMap = ageGroupMap instanceof Map ? ageGroupMap : new Map(Object.entries(ageGroupMap))
					for (const [ageGroup, value] of ageMap) {
						validateMultiplier(value, `child ${order} (${ageGroup})`)
					}
				}
			}

			// Validate combination table if present
			if (this.multiplierOverride.combinationTable) {
				for (const combo of this.multiplierOverride.combinationTable) {
					if (combo.calculatedMultiplier !== undefined && combo.calculatedMultiplier !== null) {
						validateMultiplier(combo.calculatedMultiplier, `combination ${combo.key} (calculated)`)
					}
					if (combo.overrideMultiplier !== undefined && combo.overrideMultiplier !== null) {
						validateMultiplier(combo.overrideMultiplier, `combination ${combo.key} (override)`)
					}
				}
			}
		}

		// Validate childOrderPricing
		if (this.childOrderPricing && this.childOrderPricing.length > CHILD_ORDER_MAX) {
			return next(new Error(`Too many child order pricing entries (max ${CHILD_ORDER_MAX})`))
		}

		// Validate childPricing age ranges
		if (this.childPricing && this.childPricing.length > 0) {
			for (const tier of this.childPricing) {
				if (tier.minAge > tier.maxAge) {
					return next(new Error(`Invalid child pricing tier: minAge (${tier.minAge}) > maxAge (${tier.maxAge})`))
				}
			}
		}

		// Validate minStay <= maxStay
		if (this.minStay > this.maxStay) {
			return next(new Error(`minStay (${this.minStay}) cannot exceed maxStay (${this.maxStay})`))
		}

		next()
	} catch (error) {
		next(error)
	}
})

// Apply audit plugin
rateSchema.plugin(auditPlugin, {
	module: 'planning',
	subModule: 'rate',
	nameField: 'date'
})

export default mongoose.model('Rate', rateSchema)
