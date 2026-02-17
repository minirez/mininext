import mongoose from 'mongoose'

/**
 * SubscriptionPackage Model
 *
 * A bundle of SubscriptionServices sold as a single subscription.
 * Price is auto-summed from services but can be overridden.
 * Currency is always EUR.  Billing period defaults to yearly, monthly-ready.
 */
const subscriptionPackageSchema = new mongoose.Schema(
  {
    // Multi-language name  { tr: 'Profesyonel Paket', en: 'Professional Package' }
    name: {
      tr: { type: String, required: true, trim: true },
      en: { type: String, required: true, trim: true }
    },

    // Multi-language description
    description: {
      tr: { type: String, trim: true, default: '' },
      en: { type: String, trim: true, default: '' }
    },

    // Unique slug (e.g. 'professional')
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'INVALID_SLUG']
    },

    // Included services (references to SubscriptionService)
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionService'
      }
    ],

    // Auto-calculated price from summing service prices (read-only, recalculated on save)
    calculatedPrice: {
      type: Number,
      default: 0
    },

    // Optional manual override price – when set the package uses this instead of calculatedPrice
    overridePrice: {
      type: Number,
      default: null
    },

    // The effective price exposed to clients (virtual)
    // → overridePrice ?? calculatedPrice

    // Billing period
    billingPeriod: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'yearly'
    },

    // Trial days granted on first subscription (0 = no trial)
    trialDays: {
      type: Number,
      default: 15
    },

    // Ordering for display
    sortOrder: {
      type: Number,
      default: 0
    },

    // Soft-disable
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

// Virtual: effective price
subscriptionPackageSchema.virtual('price').get(function () {
  return this.overridePrice != null ? this.overridePrice : this.calculatedPrice
})

// Indexes
subscriptionPackageSchema.index({ slug: 1 }, { unique: true })
subscriptionPackageSchema.index({ isActive: 1, sortOrder: 1 })

export default mongoose.model('SubscriptionPackage', subscriptionPackageSchema)
