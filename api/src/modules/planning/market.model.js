import mongoose from 'mongoose'
import { HOTEL_LANGUAGES } from '../hotel/hotel.model.js'

/**
 * Market Model
 * Market/Region definitions for pricing and visibility control
 * Allows grouping countries with specific currency
 */

// Multilingual text schema helper
const multiLangString = (required = false) => {
	const schema = {}
	HOTEL_LANGUAGES.forEach(lang => {
		schema[lang] = { type: String, trim: true, default: '' }
	})
	return schema
}

// Supported currencies
const SUPPORTED_CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP', 'RUB', 'SAR', 'AED', 'CHF', 'JPY', 'CNY']

const marketSchema = new mongoose.Schema({
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

	// Market identification
	name: multiLangString(true),

	code: {
		type: String,
		uppercase: true,
		trim: true,
		required: [true, 'REQUIRED_CODE']
	},

	// Currency for this market
	currency: {
		type: String,
		enum: SUPPORTED_CURRENCIES,
		default: 'EUR'
	},

	// Countries in this market (ISO 3166-1 alpha-2 codes)
	countries: [{
		type: String,
		uppercase: true,
		minlength: 2,
		maxlength: 2
	}],

	// Sales channels
	salesChannels: {
		b2c: { type: Boolean, default: true },
		b2b: { type: Boolean, default: true }
	},

	// Agency commission (B2B) - percentage
	agencyCommission: {
		type: Number,
		min: 0,
		max: 100,
		default: 10
	},

	// Markup settings for each channel
	markup: {
		b2c: { type: Number, min: 0, max: 100, default: 0 },
		b2b: { type: Number, min: 0, max: 100, default: 0 }
	},

	// Payment terms
	paymentTerms: {
		prepaymentRequired: { type: Boolean, default: false },
		prepaymentPercentage: { type: Number, min: 0, max: 100, default: 30 },
		remainingPayment: {
			type: { type: String, enum: ['days_after_booking', 'days_before_checkin', 'at_checkin'], default: 'days_before_checkin' },
			days: { type: Number, min: 1, max: 60, default: 7 }
		}
	},

	// Age range settings (overrides hotel settings if set)
	childAgeRange: {
		min: { type: Number, min: 0, max: 17, default: null },
		max: { type: Number, min: 1, max: 17, default: null }
	},
	infantAgeRange: {
		min: { type: Number, min: 0, max: 6, default: null },
		max: { type: Number, min: 0, max: 6, default: null }
	},

	// Rate type - refundable or non-refundable
	ratePolicy: {
		type: String,
		enum: ['refundable', 'non_refundable', 'both'],
		default: 'refundable'
	},

	// Non-refundable discount percentage (if both or non_refundable)
	nonRefundableDiscount: {
		type: Number,
		min: 0,
		max: 50,
		default: 10
	},

	// Taxes and fees
	taxes: {
		// VAT / KDV
		vat: {
			enabled: { type: Boolean, default: false },
			rate: { type: Number, min: 0, max: 100, default: 10 },
			included: { type: Boolean, default: true } // true = included in price, false = added on top
		},
		// City/Tourism tax
		cityTax: {
			enabled: { type: Boolean, default: false },
			type: { type: String, enum: ['percentage', 'fixed_per_night', 'fixed_per_person', 'fixed_per_person_night'], default: 'fixed_per_night' },
			amount: { type: Number, min: 0, default: 0 },
			currency: { type: String, default: null } // null = use market currency
		},
		// Service charge
		serviceCharge: {
			enabled: { type: Boolean, default: false },
			rate: { type: Number, min: 0, max: 100, default: 10 },
			included: { type: Boolean, default: true }
		}
	},

	// Cancellation policy (overrides hotel policy if set)
	cancellationPolicy: {
		useHotelPolicy: { type: Boolean, default: true },
		// Free cancellation setting
		freeCancellation: {
			enabled: { type: Boolean, default: false },
			daysBeforeCheckIn: { type: Number, min: 1, default: 7 }
		},
		// Cancellation rules (same structure as hotel policies)
		rules: [{
			daysBeforeCheckIn: { type: Number, default: 0 },
			refundPercent: { type: Number, min: 0, max: 100, default: 0 }
		}]
	},

	// Is this the default/fallback market for the hotel (for countries not in any market)
	isDefault: { type: Boolean, default: false },

	// Status
	status: {
		type: String,
		enum: ['active', 'inactive'],
		default: 'active'
	},

	// Display order
	displayOrder: { type: Number, default: 0 },

	// Active room types for this market (empty = all room types available)
	activeRoomTypes: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'RoomType'
	}],

	// Active meal plans for this market (empty = all meal plans available)
	activeMealPlans: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'MealPlan'
	}],

	// Payment methods settings
	paymentMethods: {
		// Credit card payment
		creditCard: {
			enabled: { type: Boolean, default: true }
		},
		// Bank transfer payment
		bankTransfer: {
			enabled: { type: Boolean, default: true },
			releaseDays: { type: Number, min: 0, max: 60, default: 3 }, // Days before check-in to disable
			discountRate: { type: Number, min: 0, max: 50, default: 0 } // Discount percentage for bank transfer
		}
	},

	// Children allowed in this market
	childrenAllowed: { type: Boolean, default: true }

}, {
	timestamps: true,
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
})

// Indexes
marketSchema.index({ partner: 1, hotel: 1 })
marketSchema.index({ partner: 1, hotel: 1, code: 1 }, { unique: true })
marketSchema.index({ partner: 1, hotel: 1, isDefault: 1 })
marketSchema.index({ partner: 1, hotel: 1, countries: 1 })
marketSchema.index({ displayOrder: 1 })

// Ensure only one default market per hotel
marketSchema.pre('save', async function(next) {
	if (this.isDefault && this.isModified('isDefault')) {
		await this.constructor.updateMany(
			{ hotel: this.hotel, _id: { $ne: this._id } },
			{ isDefault: false }
		)
	}
	next()
})

// Statics
marketSchema.statics.findByHotel = function(hotelId) {
	return this.find({ hotel: hotelId }).sort('displayOrder')
}

marketSchema.statics.findActiveByHotel = function(hotelId) {
	return this.find({ hotel: hotelId, status: 'active' }).sort('displayOrder')
}

marketSchema.statics.findDefaultByHotel = function(hotelId) {
	return this.findOne({ hotel: hotelId, isDefault: true })
}

marketSchema.statics.findByCountry = function(hotelId, countryCode) {
	return this.findOne({
		hotel: hotelId,
		status: 'active',
		countries: countryCode.toUpperCase()
	})
}

// Export supported currencies
export const MARKET_CURRENCIES = SUPPORTED_CURRENCIES

export default mongoose.model('Market', marketSchema)
