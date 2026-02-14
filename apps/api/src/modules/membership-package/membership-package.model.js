import mongoose from 'mongoose'
import auditPlugin from '#plugins/auditPlugin.js'

/**
 * MembershipPackage Model
 * Hizmet gruplarını bir araya getiren paketler
 * Örn: "Acente Silver" = Sanal POS + Widget + PMS (5 otel)
 */

const PARTNER_TYPES = ['hotel', 'agency', 'all']
const PRICE_MODES = ['auto', 'override']
const BILLING_INTERVALS = ['monthly', 'yearly']
const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP']
const PACKAGE_STATUSES = ['active', 'inactive', 'archived']

const membershipPackageSchema = new mongoose.Schema(
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

    targetPartnerType: {
      type: String,
      enum: {
        values: PARTNER_TYPES,
        message: 'INVALID_PARTNER_TYPE'
      },
      default: 'all'
    },

    // Dahil edilen hizmetler
    services: [
      {
        service: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MembershipService',
          required: true
        },
        featureOverrides: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
          default: new Map()
        },
        included: {
          type: Boolean,
          default: true
        }
      }
    ],

    pricing: {
      interval: {
        type: String,
        required: [true, 'INTERVAL_REQUIRED'],
        enum: {
          values: BILLING_INTERVALS,
          message: 'INVALID_INTERVAL'
        },
        default: 'yearly'
      },
      priceMode: {
        type: String,
        enum: {
          values: PRICE_MODES,
          message: 'INVALID_PRICE_MODE'
        },
        default: 'override'
      },
      // Override modunda kullanılır
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

    trial: {
      enabled: { type: Boolean, default: false },
      days: { type: Number, default: 0, min: 0 }
    },

    badge: {
      type: String,
      trim: true,
      default: ''
    },

    icon: {
      type: String,
      trim: true,
      default: 'package'
    },

    color: {
      type: String,
      trim: true,
      default: '#6366f1'
    },

    sortOrder: {
      type: Number,
      default: 0
    },

    isPublic: {
      type: Boolean,
      default: true
    },

    status: {
      type: String,
      enum: {
        values: PACKAGE_STATUSES,
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
membershipPackageSchema.index({ code: 1 }, { unique: true })
membershipPackageSchema.index({ status: 1 })
membershipPackageSchema.index({ targetPartnerType: 1 })
membershipPackageSchema.index({ isPublic: 1, status: 1 })
membershipPackageSchema.index({ sortOrder: 1 })

// Statics
membershipPackageSchema.statics.findByCode = function (code) {
  return this.findOne({ code: code.toLowerCase(), status: 'active' })
}

membershipPackageSchema.statics.findActive = function () {
  return this.find({ status: 'active' }).sort({ sortOrder: 1, 'name.tr': 1 })
}

membershipPackageSchema.statics.findPublicCatalog = function (partnerType) {
  const filter = { status: 'active', isPublic: true }
  if (partnerType && partnerType !== 'all') {
    filter.targetPartnerType = { $in: [partnerType, 'all'] }
  }
  return this.find(filter).populate('services.service').sort({ sortOrder: 1 })
}

// Instance methods
membershipPackageSchema.methods.getPrice = function (currency = 'TRY') {
  if (this.pricing?.priceMode === 'override') {
    const priceEntry = this.pricing.prices?.find(p => p.currency === currency)
    return priceEntry?.amount || 0
  }

  // Auto mode: sum up service prices
  if (!this.populated('services.service')) {
    return 0 // Must be populated for auto calc
  }

  let total = 0
  for (const svc of this.services) {
    if (svc.included && svc.service) {
      total += svc.service.getPrice(currency)
    }
  }
  return total
}

membershipPackageSchema.methods.getServiceCodes = function () {
  if (!this.populated('services.service')) return []
  return this.services.filter(s => s.included && s.service).map(s => s.service.code)
}

// Audit plugin
membershipPackageSchema.plugin(auditPlugin, {
  module: 'membership-package',
  nameField: 'name.tr'
})

export { PARTNER_TYPES, PRICE_MODES, BILLING_INTERVALS, CURRENCIES, PACKAGE_STATUSES }
export default mongoose.model('MembershipPackage', membershipPackageSchema)
