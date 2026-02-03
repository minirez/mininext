import mongoose from 'mongoose'
import auditPlugin from '#plugins/auditPlugin.js'

const { Schema } = mongoose

const capacitySchema = new Schema(
  {
    total: { type: Number, required: [true, 'REQUIRED_CAPACITY_TOTAL'], min: 0 },
    available: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
)

const departurePricingSchema = new Schema(
  {
    adult: {
      single: { type: Number, default: 0, min: 0 },
      double: { type: Number, default: 0, min: 0 },
      triple: { type: Number, default: 0, min: 0 }
    },
    child: {
      withBed: { type: Number, default: 0, min: 0 },
      withoutBed: { type: Number, default: 0, min: 0 }
    },
    infant: {
      price: { type: Number, default: 0, min: 0 }
    },
    singleSupplement: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
)

const departureTimeSchema = new Schema(
  {
    start: { type: String, trim: true },
    end: { type: String, trim: true }
  },
  { _id: false }
)

const tourDepartureSchema = new Schema(
  {
    partner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      required: [true, 'REQUIRED_PARTNER'],
      index: true
    },
    tour: {
      type: Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'REQUIRED_TOUR'],
      index: true
    },

    status: {
      type: String,
      enum: {
        values: ['scheduled', 'confirmed', 'cancelled', 'completed', 'sold_out'],
        message: 'INVALID_STATUS'
      },
      default: 'scheduled',
      index: true
    },

    departureDate: { type: Date, required: [true, 'REQUIRED_DEPARTURE_DATE'], index: true },
    returnDate: { type: Date, required: [true, 'REQUIRED_RETURN_DATE'] },
    time: { type: departureTimeSchema },

    capacity: { type: capacitySchema, required: true },

    currency: {
      type: String,
      default: 'TRY',
      uppercase: true,
      enum: {
        values: ['TRY', 'USD', 'EUR', 'GBP'],
        message: 'INVALID_CURRENCY'
      }
    },
    pricing: { type: departurePricingSchema, default: () => ({}) },

    labels: [{ type: String, trim: true }],
    guaranteedDeparture: { type: Boolean, default: false }
  },
  { timestamps: true }
)

tourDepartureSchema.index({ partner: 1, tour: 1, departureDate: 1 })
tourDepartureSchema.index({ partner: 1, status: 1, departureDate: 1 })

tourDepartureSchema.pre('validate', function (next) {
  if (!this.capacity) this.capacity = { total: 0, available: 0, reserved: 0, sold: 0 }

  const total = Number(this.capacity.total || 0)
  const reserved = Number(this.capacity.reserved || 0)
  const sold = Number(this.capacity.sold || 0)
  const available = total - reserved - sold

  this.capacity.available = Math.max(0, available)
  next()
})

tourDepartureSchema.plugin(auditPlugin, {
  module: 'tourDeparture',
  nameField: 'departureDate'
})

export default mongoose.model('TourDeparture', tourDepartureSchema)
