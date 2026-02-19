import mongoose from 'mongoose'

/**
 * SubscriptionService Model
 *
 * A standalone purchasable service (e.g. PMS Access, Web Design, Channel Manager).
 * Services are referenced by SubscriptionPackages and can also be bought individually.
 * Currency is always EUR.
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

const subscriptionServiceSchema = new mongoose.Schema(
  {
    name: {
      tr: { type: String, required: true, trim: true },
      en: { type: String, required: true, trim: true }
    },

    description: {
      tr: { type: String, trim: true, default: '' },
      en: { type: String, trim: true, default: '' }
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'INVALID_SLUG']
    },

    category: {
      type: String,
      enum: { values: SERVICE_CATEGORIES, message: 'INVALID_CATEGORY' },
      default: 'other'
    },

    icon: {
      type: String,
      trim: true,
      default: 'extension'
    },

    price: {
      type: Number,
      required: true,
      min: [0, 'PRICE_MIN_ZERO']
    },

    billingPeriod: {
      type: String,
      enum: ['monthly', 'yearly', 'one_time'],
      default: 'yearly'
    },

    entitlements: {
      pms: {
        enabled: { type: Boolean, default: false },
        maxHotels: { type: Number, default: 0 }
      },
      webDesign: {
        enabled: { type: Boolean, default: false },
        maxSites: { type: Number, default: 0 },
        ssl: { type: Boolean, default: false },
        customDomain: { type: Boolean, default: false }
      },
      channelManager: {
        enabled: { type: Boolean, default: false }
      }
    },

    targetPartnerType: {
      type: String,
      enum: ['hotel', 'agency', 'all'],
      default: 'all'
    },

    sortOrder: {
      type: Number,
      default: 0
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

subscriptionServiceSchema.index({ slug: 1 }, { unique: true })
subscriptionServiceSchema.index({ isActive: 1, sortOrder: 1 })
subscriptionServiceSchema.index({ category: 1 })

export { SERVICE_CATEGORIES }
export default mongoose.model('SubscriptionService', subscriptionServiceSchema)
