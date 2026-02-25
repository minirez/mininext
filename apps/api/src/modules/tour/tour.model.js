import mongoose from 'mongoose'
import auditPlugin from '#plugins/auditPlugin.js'
import { slugify } from '@booking-engine/utils/string'

const { Schema } = mongoose

// Canonical tour & activity types
const TOUR_TYPES = [
  'cruise',
  'cultural',
  'international',
  'activity',
  'workshop',
  'transfer',
  'nature',
  'city',
  'museum',
  'adventure',
  'religious',
  'yacht',
  'boat',
  'ferry',
  'other'
]

function normalizeTourType(type) {
  const raw = String(type || '').trim()

  // Backward compatibility for older records/defaults
  if (!raw || raw === 'tour') return 'other'

  const legacyMap = {
    package: 'other',
    day_trip: 'activity',
    multi_day: 'other',
    city_break: 'city'
  }

  const mapped = legacyMap[raw] || raw
  return TOUR_TYPES.includes(mapped) ? mapped : 'other'
}

const createMultiLangSchema = ({ requiredTr = false } = {}) =>
  new Schema(
    {
      tr: {
        type: String,
        required: requiredTr ? [true, 'REQUIRED_TR'] : false,
        trim: true
      },
      en: {
        type: String,
        trim: true,
        default: ''
      }
    },
    { _id: false, minimize: false }
  )

const moneySchema = new Schema(
  {
    value: { type: Number, required: [true, 'REQUIRED_PRICE_VALUE'], min: 0 },
    currency: {
      type: String,
      required: [true, 'REQUIRED_CURRENCY'],
      uppercase: true,
      enum: {
        values: ['TRY', 'USD', 'EUR', 'GBP'],
        message: 'INVALID_CURRENCY'
      }
    }
  },
  { _id: false }
)

const uploadedPhotoSchema = new Schema(
  {
    url: { type: String, required: [true, 'REQUIRED_URL'] },
    filename: { type: String, required: [true, 'REQUIRED_FILENAME'] },
    uploadedAt: { type: Date, default: Date.now },
    alt: { type: createMultiLangSchema() }
  },
  { _id: false }
)

const tourImageSchema = new Schema(
  {
    url: { type: String, required: [true, 'REQUIRED_URL'] },
    filename: { type: String, required: [true, 'REQUIRED_FILENAME'] },
    uploadedAt: { type: Date, default: Date.now },
    caption: { type: createMultiLangSchema() },
    order: { type: Number, default: 0 },
    isMain: { type: Boolean, default: false }
  },
  { _id: true }
)

const routeStopSchema = new Schema(
  {
    sequence: { type: Number, default: 0 },
    locationRef: {
      type: {
        type: String,
        required: [true, 'REQUIRED_LOCATION_TYPE'],
        enum: {
          values: ['city', 'district', 'region'],
          message: 'INVALID_LOCATION_TYPE'
        }
      },
      refId: {
        type: Schema.Types.ObjectId,
        required: [true, 'REQUIRED_LOCATION_REF']
      }
    },
    locationSnapshot: {
      name: { type: String, trim: true, default: '' },
      countryCode: { type: String, trim: true, uppercase: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      },
      zoom: { type: Number }
    },
    stay: {
      unit: {
        type: String,
        enum: {
          values: ['hours', 'days'],
          message: 'INVALID_STAY_UNIT'
        },
        default: 'days'
      },
      value: { type: Number, default: 1, min: 0 },
      timeWindow: {
        start: { type: String, trim: true },
        end: { type: String, trim: true }
      }
    },
    title: { type: createMultiLangSchema(), default: () => ({}) },
    description: { type: createMultiLangSchema(), default: () => ({}) },
    photo: { type: uploadedPhotoSchema },
    tags: [{ type: String, trim: true }]
  },
  { _id: true, minimize: false }
)

const accommodationPricingSchema = new Schema(
  {
    single: { type: Number, min: 0 },
    double: { type: Number, min: 0 },
    triple: { type: Number, min: 0 },
    childWithBed: { type: Number, min: 0 },
    childWithoutBed: { type: Number, min: 0 },
    infant: { type: Number, min: 0 }
  },
  { _id: false }
)

const basePricingSchema = new Schema(
  {
    currency: {
      type: String,
      default: 'TRY',
      uppercase: true,
      enum: {
        values: ['TRY', 'USD', 'EUR', 'GBP'],
        message: 'INVALID_CURRENCY'
      }
    },
    startingPrice: { type: Number, default: 0, min: 0 },
    // Optional detailed pricing
    accommodationPricing: { type: accommodationPricingSchema }
  },
  { _id: false }
)

const tourSchema = new Schema(
  {
    partner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      required: [true, 'REQUIRED_PARTNER'],
      index: true
    },
    code: { type: String, required: [true, 'REQUIRED_CODE'], trim: true, uppercase: true },
    name: { type: createMultiLangSchema({ requiredTr: true }), required: true },

    status: {
      type: String,
      enum: {
        values: ['draft', 'active', 'inactive', 'archived'],
        message: 'INVALID_STATUS'
      },
      default: 'draft',
      index: true
    },
    visibility: {
      b2c: { type: Boolean, default: true },
      b2b: { type: Boolean, default: true }
    },

    slug: { type: String, trim: true },
    isFeatured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    type: {
      type: String,
      enum: {
        values: TOUR_TYPES,
        message: 'INVALID_TOUR_TYPE'
      },
      default: 'other',
      index: true
    },

    searchText: { type: String, trim: true, default: '' },
    primaryLocation: {
      type: {
        type: String,
        enum: {
          values: ['city', 'district', 'region'],
          message: 'INVALID_LOCATION_TYPE'
        }
      },
      refId: { type: Schema.Types.ObjectId },
      name: { type: String, trim: true }
    },

    basePricing: { type: basePricingSchema, default: () => ({}) },

    content: {
      shortDescription: { type: createMultiLangSchema(), default: () => ({}) },
      description: { type: createMultiLangSchema(), default: () => ({}) },
      importantInfo: { type: createMultiLangSchema(), default: () => ({}) },
      included: [{ type: createMultiLangSchema() }],
      excluded: [{ type: createMultiLangSchema() }]
    },

    routePlan: {
      mode: { type: String, default: 'sequence' },
      stops: { type: [routeStopSchema], default: [] }
    },

    gallery: { type: [tourImageSchema], default: [] },

    schedulePreset: {
      timezone: { type: String, trim: true, default: 'Europe/Istanbul' },
      scheduleType: { type: String, enum: ['recurring', 'onetime'], default: 'recurring' },
      pattern: { type: Schema.Types.Mixed }
    }
  },
  { timestamps: true }
)

tourSchema.index({ partner: 1, code: 1 }, { unique: true })
tourSchema.index({ partner: 1, slug: 1 }, { unique: true, sparse: true })
tourSchema.index({ partner: 1, status: 1, displayOrder: 1 })
tourSchema.index(
  {
    'name.tr': 'text',
    'name.en': 'text',
    tags: 'text',
    'routePlan.stops.locationSnapshot.name': 'text',
    'content.shortDescription.tr': 'text',
    'content.shortDescription.en': 'text'
  },
  {
    name: 'tour_text_search',
    weights: { 'name.tr': 10, 'name.en': 5, tags: 6, 'routePlan.stops.locationSnapshot.name': 4 }
  }
)

tourSchema.pre('validate', function (next) {
  if (this.code) this.code = String(this.code).trim().toUpperCase()

  // Normalize legacy values before enum validation
  this.type = normalizeTourType(this.type)

  // Keep slug auto-generated from TR name unless explicitly set
  const baseName = this.name?.tr || this.name?.en
  if ((!this.slug || this.isModified('name')) && baseName) {
    this.slug = slugify(baseName)
  }

  next()
})

tourSchema.plugin(auditPlugin, {
  module: 'tour',
  nameField: 'code'
})

export const MoneySchema = moneySchema
export const UploadedPhotoSchema = uploadedPhotoSchema

export default mongoose.model('Tour', tourSchema)
