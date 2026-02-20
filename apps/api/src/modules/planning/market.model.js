import mongoose from 'mongoose'
import {
  adminLangString,
  b2cLangString,
  ADMIN_LANGUAGES,
  B2C_LANGUAGES
} from '#constants/languages.js'

/**
 * Market Model
 * Market/Region definitions for pricing and visibility control
 * Allows grouping countries with specific currency
 */

// Supported currencies
const SUPPORTED_CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP', 'RUB', 'SAR', 'AED', 'CHF', 'JPY', 'CNY']

const marketSchema = new mongoose.Schema(
  {
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

    // Market identification (admin-only: TR, EN)
    name: adminLangString(true),

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

    // Default pricing type for this market
    // 'unit' = room-based pricing (default)
    // 'per_person' = occupancy-based pricing (OBP)
    defaultPricingType: {
      type: String,
      enum: ['unit', 'per_person'],
      default: 'unit'
    },

    // Countries in this market (ISO 3166-1 alpha-2 codes)
    countries: [
      {
        type: String,
        uppercase: true,
        minlength: 2,
        maxlength: 2
      }
    ],

    // Sales channels
    salesChannels: {
      b2c: { type: Boolean, default: true },
      b2b: { type: Boolean, default: true }
    },

    // Agency commission (B2B) - percentage (DEPRECATED: use agencyMarginShare instead)
    agencyCommission: {
      type: Number,
      min: 0,
      max: 100,
      default: 10
    },

    // Agency margin share - percentage of total margin to give to agency (0-100)
    // Example: If commission is 10% and agencyMarginShare is 50%, agency gets 5% (half of margin)
    // This ensures partner always has positive margin
    agencyMarginShare: {
      type: Number,
      min: 0,
      max: 100,
      default: 50 // Default: agency gets half of the margin
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
        type: {
          type: String,
          enum: ['days_after_booking', 'days_before_checkin', 'at_checkin'],
          default: 'days_before_checkin'
        },
        days: { type: Number, min: 1, max: 60, default: 7 }
      }
    },

    // Child age settings (overrides hotel settings if set)
    childAgeSettings: {
      inheritFromHotel: { type: Boolean, default: true },
      // Override child age groups for this market (same structure as hotel.childAgeGroups)
      childAgeGroups: [
        {
          code: {
            type: String,
            enum: ['infant', 'first', 'second']
          },
          minAge: { type: Number, min: 0, max: 17 },
          maxAge: { type: Number, min: 0, max: 17 }
        }
      ]
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
        type: {
          type: String,
          enum: ['percentage', 'fixed_per_night', 'fixed_per_person', 'fixed_per_person_night'],
          default: 'fixed_per_night'
        },
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
      rules: [
        {
          daysBeforeCheckIn: { type: Number, default: 0 },
          refundPercent: { type: Number, min: 0, max: 100, default: 0 }
        }
      ],
      // Cancellation guarantee package
      guaranteePackage: {
        enabled: { type: Boolean, default: true },
        rate: { type: Number, default: 1, min: 0, max: 100 }
      }
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
    activeRoomTypes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoomType'
      }
    ],

    // Active meal plans for this market (empty = all meal plans available)
    activeMealPlans: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MealPlan'
      }
    ],

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
    childrenAllowed: { type: Boolean, default: true },

    // Working mode - how the hotel works with the partner (net price or commission)
    workingMode: {
      type: String,
      enum: ['net', 'commission'],
      default: 'net'
    },

    // Commission rate - hotel's commission to partner (only used when workingMode is 'commission')
    commissionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 10
    },

    // ===== PRICING OVERRIDES (per room type for this market) =====
    // Array of room-specific pricing overrides for this market
    // Hierarchy: RoomType -> Market.pricingOverrides -> Season.pricingOverrides -> Rate
    pricingOverrides: [
      {
        // Which room type this override applies to
        roomType: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'RoomType',
          required: true
        },

        // Pricing type override (unit or per_person)
        usePricingTypeOverride: { type: Boolean, default: false },
        pricingType: {
          type: String,
          enum: ['unit', 'per_person'],
          default: 'unit'
        },

        // Minimum adults override
        useMinAdultsOverride: { type: Boolean, default: false },
        minAdults: { type: Number, min: 1, max: 30, default: null },

        // Multiplier override
        useMultiplierOverride: { type: Boolean, default: false },

        // Override multipliers for this market (same structure as RoomType.multiplierTemplate)
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

          // Combination table override
          combinationTable: [
            {
              key: { type: String },
              adults: { type: Number, min: 1 },
              children: [
                {
                  order: { type: Number },
                  ageGroup: { type: String }
                }
              ],
              calculatedMultiplier: { type: Number },
              overrideMultiplier: { type: Number, default: null },
              isActive: { type: Boolean, default: true }
            }
          ],

          // Rounding rule override
          roundingRule: {
            type: String,
            enum: ['none', 'nearest', 'up', 'down', 'nearest5', 'nearest10'],
            default: undefined
          }
        }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, flattenMaps: true },
    toObject: { virtuals: true, flattenMaps: true }
  }
)

// Indexes
marketSchema.index({ partner: 1, hotel: 1 })
marketSchema.index({ partner: 1, hotel: 1, code: 1 }, { unique: true })
marketSchema.index({ partner: 1, hotel: 1, isDefault: 1 })
marketSchema.index({ partner: 1, hotel: 1, countries: 1 })
marketSchema.index({ displayOrder: 1 })

// Validation and ensure only one default market per hotel
marketSchema.pre('save', async function (next) {
  // Rule 1: Non-default markets MUST have at least one country
  // Only the default market can have empty countries (meaning "all countries")
  if (!this.isDefault && (!this.countries || this.countries.length === 0)) {
    const error = new Error('MARKET_REQUIRES_COUNTRIES')
    error.name = 'ValidationError'
    return next(error)
  }

  // Rule 2: If setting isDefault to true, unset other default markets
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { hotel: this.hotel, _id: { $ne: this._id } },
      { isDefault: false }
    )
  }

  next()
})

// Statics
marketSchema.statics.findByHotel = function (hotelId) {
  return this.find({ hotel: hotelId }).sort('displayOrder')
}

marketSchema.statics.findActiveByHotel = function (hotelId) {
  return this.find({ hotel: hotelId, status: 'active' }).sort('displayOrder')
}

marketSchema.statics.findDefaultByHotel = function (hotelId) {
  return this.findOne({ hotel: hotelId, isDefault: true })
}

marketSchema.statics.findByCountry = function (hotelId, countryCode) {
  return this.findOne({
    hotel: hotelId,
    status: 'active',
    countries: countryCode.toUpperCase()
  })
}

// Export supported currencies
export const MARKET_CURRENCIES = SUPPORTED_CURRENCIES

export default mongoose.model('Market', marketSchema)
