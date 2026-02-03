import mongoose from 'mongoose'
import auditPlugin from '#plugins/auditPlugin.js'
import { MoneySchema, UploadedPhotoSchema } from './tour.model.js'

const { Schema } = mongoose

const createMultiLangSchema = ({ requiredTr = false } = {}) =>
  new Schema(
    {
      tr: { type: String, required: requiredTr ? [true, 'REQUIRED_TR'] : false, trim: true },
      en: { type: String, trim: true, default: '' }
    },
    { _id: false, minimize: false }
  )

const tourExtraSchema = new Schema(
  {
    partner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      required: [true, 'REQUIRED_PARTNER'],
      index: true
    },
    code: { type: String, required: [true, 'REQUIRED_CODE'], trim: true, uppercase: true },
    isActive: { type: Boolean, default: true, index: true },

    name: { type: createMultiLangSchema({ requiredTr: true }), required: true },
    description: { type: createMultiLangSchema(), default: () => ({}) },

    price: { type: MoneySchema, required: true },
    priceType: {
      type: String,
      enum: {
        values: ['per_person', 'per_group', 'per_unit'],
        message: 'INVALID_PRICE_TYPE'
      },
      default: 'per_person'
    },
    category: {
      type: String,
      enum: {
        values: [
          'activity',
          'meal',
          'transfer',
          'upgrade',
          'visa',
          'insurance',
          'equipment',
          'other'
        ],
        message: 'INVALID_CATEGORY'
      },
      default: 'other',
      index: true
    },

    image: { type: UploadedPhotoSchema }
  },
  { timestamps: true }
)

tourExtraSchema.index({ partner: 1, code: 1 }, { unique: true })

tourExtraSchema.pre('validate', function (next) {
  if (this.code) this.code = String(this.code).trim().toUpperCase()
  next()
})

tourExtraSchema.plugin(auditPlugin, {
  module: 'tourExtra',
  nameField: 'code'
})

export default mongoose.model('TourExtra', tourExtraSchema)
