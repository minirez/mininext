import mongoose from 'mongoose'

/**
 * SubscriptionPackage Model
 *
 * A bundle of SubscriptionServices sold as a single subscription.
 * Price is auto-summed from services but can be overridden.
 * Currency is always EUR. Billing period defaults to yearly.
 */

const PARTNER_TYPES = ['hotel', 'agency', 'all']

const subscriptionPackageSchema = new mongoose.Schema(
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

    targetPartnerType: {
      type: String,
      enum: { values: PARTNER_TYPES, message: 'INVALID_PARTNER_TYPE' },
      default: 'all'
    },

    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionService'
      }
    ],

    calculatedPrice: {
      type: Number,
      default: 0
    },

    overridePrice: {
      type: Number,
      default: null
    },

    billingPeriod: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'yearly'
    },

    trialDays: {
      type: Number,
      default: 15
    },

    icon: {
      type: String,
      trim: true,
      default: 'inventory_2'
    },

    color: {
      type: String,
      trim: true,
      default: '#6366f1'
    },

    badge: {
      type: String,
      trim: true,
      default: ''
    },

    isPublic: {
      type: Boolean,
      default: true
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

subscriptionPackageSchema.virtual('price').get(function () {
  return this.overridePrice != null ? this.overridePrice : this.calculatedPrice
})

subscriptionPackageSchema.index({ slug: 1 }, { unique: true })
subscriptionPackageSchema.index({ isActive: 1, sortOrder: 1 })
subscriptionPackageSchema.index({ targetPartnerType: 1 })

subscriptionPackageSchema.statics.findPublicCatalog = function (partnerType) {
  const filter = { isActive: true, isPublic: { $ne: false } }
  if (partnerType && partnerType !== 'all') {
    filter.$or = [
      { targetPartnerType: partnerType },
      { targetPartnerType: 'all' },
      { targetPartnerType: { $exists: false } },
      { targetPartnerType: null }
    ]
  }
  return this.find(filter)
    .populate('services', 'name slug price icon category description')
    .sort({ sortOrder: 1 })
}

export { PARTNER_TYPES }
export default mongoose.model('SubscriptionPackage', subscriptionPackageSchema)
