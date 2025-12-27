import mongoose from 'mongoose'
import { HOTEL_LANGUAGES } from '../hotel/hotel.model.js'

/**
 * Season Model
 * Season definitions for rate periods
 * Supports multiple date ranges and priority-based overlap handling
 */

// Multilingual text schema helper
const multiLangString = (required = false) => {
	const schema = {}
	HOTEL_LANGUAGES.forEach(lang => {
		schema[lang] = { type: String, trim: true, default: '' }
	})
	return schema
}

// Date range schema
const dateRangeSchema = new mongoose.Schema({
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true }
}, { _id: false })

const seasonSchema = new mongoose.Schema({
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

	// Market reference (seasons are now market-specific)
	market: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Market',
		required: [true, 'REQUIRED_MARKET'],
		index: true
	},

	// Season identification
	name: multiLangString(true),

	code: {
		type: String,
		uppercase: true,
		trim: true,
		required: [true, 'REQUIRED_CODE']
	},

	// Calendar display color (hex)
	color: {
		type: String,
		default: '#6366f1',
		match: [/^#[0-9A-Fa-f]{6}$/, 'INVALID_COLOR_FORMAT']
	},

	// Date ranges (supports multiple ranges per season)
	dateRanges: [dateRangeSchema],

	// Priority for overlapping seasons (higher = takes precedence)
	priority: { type: Number, default: 0 },

	// Status
	status: {
		type: String,
		enum: ['active', 'inactive'],
		default: 'active'
	},

	// Display order
	displayOrder: { type: Number, default: 0 },

	// Active room types override (empty = inherit from market)
	activeRoomTypes: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'RoomType'
	}],

	// Active meal plans override (empty = inherit from market)
	activeMealPlans: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'MealPlan'
	}],

	// Child age settings override
	childAgeSettings: {
		inheritFromMarket: { type: Boolean, default: true },
		childAgeRange: {
			min: { type: Number, min: 0, max: 17, default: null },
			max: { type: Number, min: 1, max: 17, default: null }
		},
		infantAgeRange: {
			min: { type: Number, min: 0, max: 6, default: null },
			max: { type: Number, min: 0, max: 6, default: null }
		}
	},

	// Payment methods settings override
	paymentSettings: {
		inheritFromMarket: { type: Boolean, default: true },
		creditCard: {
			enabled: { type: Boolean, default: true }
		},
		bankTransfer: {
			enabled: { type: Boolean, default: true },
			releaseDays: { type: Number, min: 0, max: 60, default: 3 },
			discountRate: { type: Number, min: 0, max: 50, default: 0 }
		}
	},

	// Children allowed override
	childrenSettings: {
		inheritFromMarket: { type: Boolean, default: true },
		allowed: { type: Boolean, default: true }
	},

	// Pricing override (inherit from hotel or override)
	pricingOverride: {
		// true = use hotel's pricingSettings, false = use values below
		inheritFromHotel: { type: Boolean, default: true },
		// Override values (only used if inheritFromHotel = false)
		model: {
			type: String,
			enum: ['net', 'rack'],
			default: 'net'
		},
		markup: { type: Number, min: 0, max: 100, default: null },
		commission: { type: Number, min: 0, max: 100, default: null }
	}

}, {
	timestamps: true,
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
})

// Indexes
seasonSchema.index({ partner: 1, hotel: 1 })
seasonSchema.index({ partner: 1, hotel: 1, market: 1 })
seasonSchema.index({ partner: 1, hotel: 1, market: 1, code: 1 }, { unique: true })
seasonSchema.index({ partner: 1, hotel: 1, market: 1, 'dateRanges.startDate': 1, 'dateRanges.endDate': 1 })
seasonSchema.index({ priority: -1 })
seasonSchema.index({ displayOrder: 1 })

// Validate date ranges
seasonSchema.pre('save', function(next) {
	// Ensure endDate >= startDate for all ranges
	for (const range of this.dateRanges) {
		if (range.endDate < range.startDate) {
			const temp = range.startDate
			range.startDate = range.endDate
			range.endDate = temp
		}
	}

	// Sort date ranges by startDate
	this.dateRanges.sort((a, b) => a.startDate - b.startDate)

	next()
})

// Statics
seasonSchema.statics.findByHotel = function(hotelId) {
	return this.find({ hotel: hotelId }).sort('displayOrder')
}

seasonSchema.statics.findActiveByHotel = function(hotelId) {
	return this.find({ hotel: hotelId, status: 'active' }).sort('displayOrder')
}

// Find seasons by market (seasons are now market-specific)
seasonSchema.statics.findByMarket = function(hotelId, marketId) {
	return this.find({ hotel: hotelId, market: marketId }).sort('displayOrder')
}

seasonSchema.statics.findActiveByMarket = function(hotelId, marketId) {
	return this.find({ hotel: hotelId, market: marketId, status: 'active' }).sort('displayOrder')
}

// Find season for a specific date (now requires marketId)
seasonSchema.statics.findByDate = function(hotelId, marketId, date) {
	const queryDate = new Date(date)
	return this.findOne({
		hotel: hotelId,
		market: marketId,
		status: 'active',
		dateRanges: {
			$elemMatch: {
				startDate: { $lte: queryDate },
				endDate: { $gte: queryDate }
			}
		}
	}).sort({ priority: -1 }) // Higher priority wins
}

// Find all seasons that overlap with a date range (now requires marketId)
seasonSchema.statics.findByDateRange = function(hotelId, marketId, startDate, endDate) {
	return this.find({
		hotel: hotelId,
		market: marketId,
		status: 'active',
		dateRanges: {
			$elemMatch: {
				startDate: { $lte: new Date(endDate) },
				endDate: { $gte: new Date(startDate) }
			}
		}
	}).sort({ priority: -1 })
}

// Get predefined season templates
seasonSchema.statics.getSeasonTemplates = function() {
	return [
		{
			code: 'LOW',
			name: { tr: 'Düşük Sezon', en: 'Low Season', de: 'Nebensaison', ru: 'Низкий сезон' },
			color: '#10b981', // Green
			priority: 0
		},
		{
			code: 'MID',
			name: { tr: 'Orta Sezon', en: 'Mid Season', de: 'Zwischensaison', ru: 'Средний сезон' },
			color: '#f59e0b', // Amber
			priority: 1
		},
		{
			code: 'HIGH',
			name: { tr: 'Yüksek Sezon', en: 'High Season', de: 'Hochsaison', ru: 'Высокий сезон' },
			color: '#ef4444', // Red
			priority: 2
		},
		{
			code: 'PEAK',
			name: { tr: 'Pik Sezon', en: 'Peak Season', de: 'Spitzensaison', ru: 'Пиковый сезон' },
			color: '#8b5cf6', // Purple
			priority: 3
		}
	]
}

export default mongoose.model('Season', seasonSchema)
