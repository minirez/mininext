import mongoose from 'mongoose'

/**
 * RateOverride Model
 * Stores daily exceptions/overrides for rates
 *
 * Design Philosophy:
 * - Rate model stores period-based main prices (seasons)
 * - RateOverride stores daily exceptions (specific dates)
 * - When querying, first check RateOverride, then fall back to Rate
 * - Only override fields that have values (null = use base Rate value)
 */

const rateOverrideSchema = new mongoose.Schema({
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

	// Rate dimensions (same as Rate model)
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

	// Single date (NOT a range!)
	date: {
		type: Date,
		required: [true, 'REQUIRED_DATE'],
		index: true
	},

	// Reference to base Rate (optional, for tracking)
	baseRate: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Rate',
		default: null
	},

	// === OVERRIDABLE FIELDS ===
	// All fields are optional - null means "use base Rate value"

	// Price override
	pricePerNight: { type: Number, default: null, min: 0 },

	// Extra person pricing overrides
	singleSupplement: { type: Number, default: null },
	extraAdult: { type: Number, default: null, min: 0 },
	extraChild: { type: Number, default: null, min: 0 },
	extraInfant: { type: Number, default: null, min: 0 },

	// Inventory override
	allotment: { type: Number, default: null, min: 0 },

	// Stay restrictions override
	minStay: { type: Number, default: null, min: 1, max: 30 },
	maxStay: { type: Number, default: null, min: 1, max: 365 },

	// Sales control override
	stopSale: { type: Boolean, default: null },
	stopSaleReason: { type: String, default: null, trim: true },

	// Release days override
	releaseDays: { type: Number, default: null, min: 0 },

	// Arrival/Departure restrictions override
	closedToArrival: { type: Boolean, default: null },
	closedToDeparture: { type: Boolean, default: null },

	// Source tracking (how was this override created)
	source: {
		type: String,
		enum: ['manual', 'ai', 'bulk', 'import'],
		default: 'manual'
	},

	// AI command that created this (for audit trail)
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

// UNIQUE constraint: one override per day per combination
rateOverrideSchema.index(
	{ hotel: 1, roomType: 1, mealPlan: 1, market: 1, date: 1 },
	{ unique: true }
)

// Efficient query indexes
rateOverrideSchema.index({ partner: 1, hotel: 1, date: 1 })
rateOverrideSchema.index({ hotel: 1, date: 1, status: 1 })
rateOverrideSchema.index({ hotel: 1, roomType: 1, date: 1 })

// Static: Find override for a specific date
rateOverrideSchema.statics.findByDate = function(hotelId, roomTypeId, mealPlanId, marketId, date) {
	return this.findOne({
		hotel: hotelId,
		roomType: roomTypeId,
		mealPlan: mealPlanId,
		market: marketId,
		date: new Date(date),
		status: 'active'
	})
}

// Static: Find all overrides in a date range
rateOverrideSchema.statics.findInRange = function(hotelId, startDate, endDate, filters = {}) {
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
		.populate('roomType', 'name code')
		.populate('mealPlan', 'name code')
		.populate('market', 'name code currency')
		.sort('date')
}

// Static: Bulk upsert overrides (for AI commands)
rateOverrideSchema.statics.bulkUpsert = async function(overrides) {
	const operations = overrides.map(override => ({
		updateOne: {
			filter: {
				hotel: override.hotel,
				roomType: override.roomType,
				mealPlan: override.mealPlan,
				market: override.market,
				date: override.date
			},
			update: { $set: override },
			upsert: true
		}
	}))

	return this.bulkWrite(operations)
}

// Static: Clear overrides in a date range
rateOverrideSchema.statics.clearRange = function(hotelId, startDate, endDate, filters = {}) {
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

	return this.deleteMany(query)
}

// Instance method: Check if this override has any actual overrides
rateOverrideSchema.methods.hasOverrides = function() {
	return this.pricePerNight !== null ||
		this.singleSupplement !== null ||
		this.extraAdult !== null ||
		this.extraChild !== null ||
		this.extraInfant !== null ||
		this.allotment !== null ||
		this.minStay !== null ||
		this.maxStay !== null ||
		this.stopSale !== null ||
		this.releaseDays !== null ||
		this.closedToArrival !== null ||
		this.closedToDeparture !== null
}

// Instance method: Merge with base rate
rateOverrideSchema.methods.mergeWithBase = function(baseRate) {
	const merged = {
		...baseRate.toObject(),
		date: this.date,
		isOverride: true,
		overrideId: this._id
	}

	// Override only non-null fields
	if (this.pricePerNight !== null) merged.pricePerNight = this.pricePerNight
	if (this.singleSupplement !== null) merged.singleSupplement = this.singleSupplement
	if (this.extraAdult !== null) merged.extraAdult = this.extraAdult
	if (this.extraChild !== null) merged.extraChild = this.extraChild
	if (this.extraInfant !== null) merged.extraInfant = this.extraInfant
	if (this.allotment !== null) merged.allotment = this.allotment
	if (this.minStay !== null) merged.minStay = this.minStay
	if (this.maxStay !== null) merged.maxStay = this.maxStay
	if (this.stopSale !== null) merged.stopSale = this.stopSale
	if (this.stopSaleReason !== null) merged.stopSaleReason = this.stopSaleReason
	if (this.releaseDays !== null) merged.releaseDays = this.releaseDays
	if (this.closedToArrival !== null) merged.closedToArrival = this.closedToArrival
	if (this.closedToDeparture !== null) merged.closedToDeparture = this.closedToDeparture

	return merged
}

export default mongoose.model('RateOverride', rateOverrideSchema)
