import mongoose from 'mongoose'
import auditPlugin from '#plugins/auditPlugin.js'

const { Schema } = mongoose

const passengerSchema = new Schema(
  {
    type: {
      type: String,
      enum: {
        values: ['adult', 'child', 'infant'],
        message: 'INVALID_PASSENGER_TYPE'
      },
      default: 'adult'
    },
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    gender: { type: String, trim: true, default: '' },
    birthDate: { type: Date },
    nationality: { type: String, trim: true, default: '' },
    passportNo: { type: String, trim: true, default: '' },
    passportExpiry: { type: Date },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    visa: {
      status: {
        type: String,
        enum: {
          values: [
            'not_required',
            'pending_documents',
            'documents_received',
            'submitted',
            'appointment_scheduled',
            'approved',
            'rejected'
          ],
          message: 'INVALID_VISA_STATUS'
        },
        default: 'not_required'
      },
      notes: { type: String, trim: true, default: '' },
      updatedAt: { type: Date }
    }
  },
  { _id: false }
)

const bookingExtraSchema = new Schema(
  {
    extra: { type: Schema.Types.ObjectId, ref: 'TourExtra' },
    code: { type: String, trim: true, uppercase: true },
    name: { type: Schema.Types.Mixed }, // keep flexible (MultiLang or string snapshot)
    quantity: { type: Number, default: 1, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
    priceType: { type: String, trim: true, default: '' }
  },
  { _id: false }
)

const pricingSchema = new Schema(
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
    adults: { type: Number, default: 0, min: 0 },
    children: { type: Number, default: 0, min: 0 },
    infants: { type: Number, default: 0, min: 0 },
    extras: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
)

const paymentSchema = new Schema(
  {
    method: { type: String, trim: true, default: '' },
    status: { type: String, trim: true, default: 'pending' },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, default: 0, min: 0 },
    transactions: [
      {
        amount: { type: Number, default: 0, min: 0 },
        currency: { type: String, trim: true, default: 'TRY' },
        method: { type: String, trim: true, default: '' },
        reference: { type: String, trim: true, default: '' },
        paidAt: { type: Date, default: Date.now },
        note: { type: String, trim: true, default: '' }
      }
    ]
  },
  { _id: false, minimize: false }
)

const noteSchema = new Schema(
  {
    message: { type: String, trim: true, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
)

const tourBookingSchema = new Schema(
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
    departure: {
      type: Schema.Types.ObjectId,
      ref: 'TourDeparture',
      required: [true, 'REQUIRED_DEPARTURE'],
      index: true
    },

    bookingNo: { type: String, trim: true, index: true, unique: true, sparse: true },

    passengers: { type: [passengerSchema], default: [] },
    seatCount: { type: Number, default: 0, min: 0 },

    contact: {
      fullName: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' }
    },

    extras: { type: [bookingExtraSchema], default: [] },
    pricing: { type: pricingSchema, default: () => ({}) },
    payment: { type: paymentSchema, default: () => ({}) },

    specialRequests: { type: String, trim: true, default: '' },
    salesChannel: { type: String, trim: true, default: 'admin' },

    status: {
      type: String,
      enum: {
        values: ['draft', 'pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
        message: 'INVALID_STATUS'
      },
      default: 'pending',
      index: true
    },

    cancelledAt: { type: Date },
    cancellationReason: { type: String, trim: true, default: '' },
    notes: { type: [noteSchema], default: [] }
  },
  { timestamps: true }
)

tourBookingSchema.index({ partner: 1, status: 1, createdAt: -1 })
tourBookingSchema.index({ partner: 1, departure: 1, status: 1 })

tourBookingSchema.pre('validate', function (next) {
  const passengers = Array.isArray(this.passengers) ? this.passengers : []
  this.seatCount = passengers.filter(p => p?.type !== 'infant').length
  next()
})

tourBookingSchema.plugin(auditPlugin, {
  module: 'tourBooking',
  nameField: 'bookingNo'
})

export default mongoose.model('TourBooking', tourBookingSchema)
