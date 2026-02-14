import mongoose from 'mongoose'
import auditPlugin from '#plugins/auditPlugin.js'

/**
 * MembershipService Model
 * Atomik hizmet birimi - Partner üyelik sisteminin yapı taşı
 * Örn: "Sanal POS", "PMS Erişimi", "Widget Booking Engine"
 */

const SERVICE_CATEGORIES = [
  'payment',
  'booking',
  'pms',
  'web',
  'design',
  'support',
  'integration',
  'other'
]
const BILLING_TYPES = ['one_time', 'recurring']
const BILLING_INTERVALS = ['monthly', 'yearly']
const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP']
const SERVICE_STATUSES = ['active', 'inactive', 'archived']

const membershipServiceSchema = new mongoose.Schema(
  {
    name: {
      tr: { type: String, required: [true, 'NAME_TR_REQUIRED'], trim: true },
      en: { type: String, required: [true, 'NAME_EN_REQUIRED'], trim: true }
    },

    description: {
      tr: { type: String, trim: true, default: '' },
      en: { type: String, trim: true, default: '' }
    },

    code: {
      type: String,
      required: [true, 'CODE_REQUIRED'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'CODE_INVALID_FORMAT']
    },

    category: {
      type: String,
      required: [true, 'CATEGORY_REQUIRED'],
      enum: {
        values: SERVICE_CATEGORIES,
        message: 'INVALID_CATEGORY'
      }
    },

    pricing: {
      billingType: {
        type: String,
        required: [true, 'BILLING_TYPE_REQUIRED'],
        enum: {
          values: BILLING_TYPES,
          message: 'INVALID_BILLING_TYPE'
        }
      },
      interval: {
        type: String,
        enum: {
          values: BILLING_INTERVALS,
          message: 'INVALID_BILLING_INTERVAL'
        }
      },
      prices: [
        {
          currency: {
            type: String,
            required: true,
            enum: CURRENCIES,
            uppercase: true
          },
          amount: {
            type: Number,
            required: true,
            min: [0, 'PRICE_MIN_ZERO']
          }
        }
      ]
    },

    // Hizmet özellikleri (esnek key-value)
    features: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map()
    },

    icon: {
      type: String,
      trim: true,
      default: 'cube'
    },

    sortOrder: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: {
        values: SERVICE_STATUSES,
        message: 'INVALID_STATUS'
      },
      default: 'active'
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes
membershipServiceSchema.index({ code: 1 }, { unique: true })
membershipServiceSchema.index({ status: 1 })
membershipServiceSchema.index({ category: 1 })
membershipServiceSchema.index({ sortOrder: 1 })
membershipServiceSchema.index({ 'name.tr': 'text', 'name.en': 'text' })

// Statics
membershipServiceSchema.statics.findByCode = function (code) {
  return this.findOne({ code: code.toLowerCase(), status: 'active' })
}

membershipServiceSchema.statics.findActive = function () {
  return this.find({ status: 'active' }).sort({ sortOrder: 1, 'name.tr': 1 })
}

// Instance methods
membershipServiceSchema.methods.getPrice = function (currency = 'TRY') {
  const priceEntry = this.pricing?.prices?.find(p => p.currency === currency)
  return priceEntry?.amount || 0
}

// Audit plugin
membershipServiceSchema.plugin(auditPlugin, {
  module: 'membership-service',
  nameField: 'name.tr'
})

export { SERVICE_CATEGORIES, BILLING_TYPES, BILLING_INTERVALS, CURRENCIES, SERVICE_STATUSES }
export default mongoose.model('MembershipService', membershipServiceSchema)
