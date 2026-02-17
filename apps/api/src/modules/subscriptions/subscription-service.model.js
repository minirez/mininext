import mongoose from 'mongoose'

/**
 * SubscriptionService Model
 *
 * A standalone purchasable service (e.g. PMS Access, Web Design, Channel Manager).
 * Services are referenced by SubscriptionPackages and can also be bought individually.
 * Currency is always EUR.
 */
const subscriptionServiceSchema = new mongoose.Schema(
  {
    // Multi-language name  { tr: 'PMS Erişimi', en: 'PMS Access' }
    name: {
      tr: { type: String, required: true, trim: true },
      en: { type: String, required: true, trim: true }
    },

    // Multi-language description
    description: {
      tr: { type: String, trim: true, default: '' },
      en: { type: String, trim: true, default: '' }
    },

    // Unique slug for programmatic reference (e.g. 'pms-access')
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'INVALID_SLUG']
    },

    // EUR-only price (yearly by default)
    price: {
      type: Number,
      required: true,
      min: [0, 'PRICE_MIN_ZERO']
    },

    // Billing period for standalone purchase
    billingPeriod: {
      type: String,
      enum: ['monthly', 'yearly', 'one_time'],
      default: 'yearly'
    },

    // Ordering for display
    sortOrder: {
      type: Number,
      default: 0
    },

    // Soft-disable without removing
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

// Indexes
subscriptionServiceSchema.index({ slug: 1 }, { unique: true })
subscriptionServiceSchema.index({ isActive: 1, sortOrder: 1 })

export default mongoose.model('SubscriptionService', subscriptionServiceSchema)
