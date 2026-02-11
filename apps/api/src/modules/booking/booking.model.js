/**
 * Booking Model
 * Handles hotel reservations with full audit trail
 */

import mongoose from 'mongoose'
import auditPlugin from '#plugins/auditPlugin.js'

const SUPPORTED_LANGUAGES = [
  'tr',
  'en',
  'ru',
  'el',
  'de',
  'es',
  'it',
  'fr',
  'ro',
  'bg',
  'pt',
  'da',
  'zh',
  'ar',
  'fa',
  'he',
  'sq',
  'uk',
  'pl',
  'az'
]

const multiLangString = () => {
  const schema = {}
  SUPPORTED_LANGUAGES.forEach(lang => {
    schema[lang] = { type: String, trim: true, default: '' }
  })
  return schema
}

// Guest schema
const guestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['adult', 'child', 'infant'],
      default: 'adult'
    },
    title: {
      type: String,
      enum: ['mr', 'mrs', 'ms', 'miss', 'dr'],
      default: 'mr'
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    age: { type: Number, min: 0, max: 120 },
    nationality: { type: String, trim: true, uppercase: true }, // ISO country code
    tcNumber: { type: String, trim: true }, // TC Kimlik No (for Turkish citizens)
    passportNumber: { type: String, trim: true },
    dateOfBirth: { type: Date },
    isLead: { type: Boolean, default: false } // Lead guest / booker
  },
  { _id: false }
)

// Amendment change detail schema
const amendmentChangeSchema = new mongoose.Schema(
  {
    field: { type: String, required: true }, // Field path that changed
    fieldLabel: { type: String }, // Human-readable label
    from: mongoose.Schema.Types.Mixed, // Previous value
    to: mongoose.Schema.Types.Mixed // New value
  },
  { _id: false }
)

// Amendment snapshot schema - stores full booking state before each change
const amendmentSnapshotSchema = new mongoose.Schema(
  {
    snapshotId: {
      type: String,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    takenAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    takenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    takenByName: { type: String }, // Store name for display
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 10
    },

    // Full booking state before the change
    bookingState: {
      checkIn: { type: Date },
      checkOut: { type: Date },
      nights: { type: Number },
      rooms: [{ type: mongoose.Schema.Types.Mixed }], // Full room data
      leadGuest: { type: mongoose.Schema.Types.Mixed },
      contact: { type: mongoose.Schema.Types.Mixed },
      pricing: { type: mongoose.Schema.Types.Mixed },
      invoiceDetails: { type: mongoose.Schema.Types.Mixed },
      totalAdults: { type: Number },
      totalChildren: { type: Number },
      totalInfants: { type: Number },
      totalRooms: { type: Number },
      specialRequests: { type: String }
    },

    // Amendment details
    amendment: {
      type: {
        type: String,
        enum: ['dates', 'rooms', 'guests', 'pricing', 'full'],
        required: true
      },
      changes: [amendmentChangeSchema],
      priceDifference: {
        currency: { type: String },
        originalTotal: { type: Number },
        newTotal: { type: Number },
        difference: { type: Number }, // Positive = increase, negative = decrease
        adjustedDifference: { type: Number }, // After manual adjustment
        adjustmentReason: { type: String }, // Why was it adjusted
        waived: { type: Boolean, default: false } // Was the difference waived
      }
    }
  },
  { _id: false }
)

// Room booking schema (for multi-room bookings)
const roomBookingSchema = new mongoose.Schema(
  {
    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: true
    },
    roomTypeCode: { type: String, required: true },
    roomTypeName: multiLangString(),
    mealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealPlan',
      required: true
    },
    mealPlanCode: { type: String, required: true },
    mealPlanName: multiLangString(),
    guests: [guestSchema],
    // Pricing snapshot
    pricing: {
      currency: { type: String, required: true },
      originalTotal: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      finalTotal: { type: Number, required: true },
      avgPerNight: { type: Number }
    },
    // Daily breakdown snapshot
    dailyBreakdown: [
      {
        date: { type: Date, required: true },
        price: { type: Number, required: true },
        originalPrice: { type: Number },
        discountAmount: { type: Number, default: 0 },
        appliedCampaigns: [
          {
            code: String,
            name: multiLangString(),
            discount: String,
            amount: Number
          }
        ]
      }
    ],
    // Applied campaigns
    campaigns: [
      {
        code: String,
        name: multiLangString(),
        discountType: String,
        discountValue: Number,
        discountAmount: Number,
        discountText: String
      }
    ],
    // Rate type (refundable or non-refundable)
    rateType: {
      type: String,
      enum: ['refundable', 'non_refundable'],
      default: 'refundable'
    },
    // Non-refundable discount applied (if rateType is non_refundable)
    nonRefundableDiscount: { type: Number, default: 0 },
    // Cancellation policy snapshot (based on rate type)
    cancellationPolicy: {
      isRefundable: { type: Boolean, default: true },
      freeCancellation: {
        enabled: { type: Boolean, default: false },
        daysBeforeCheckIn: { type: Number }
      },
      rules: [
        {
          daysBeforeCheckIn: { type: Number },
          refundPercent: { type: Number }
        }
      ]
    },
    // Special requests
    specialRequests: { type: String, trim: true }
  },
  { _id: true }
)

const bookingSchema = new mongoose.Schema(
  {
    // Booking reference
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true
    },

    // Partner (Multi-tenant)
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
      index: true
    },

    // Hotel reference (required for final booking, optional for draft)
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      index: true
    },
    hotelCode: { type: String },
    hotelName: { type: String },

    // Market reference (optional for PMS reservations, used for pricing calculations)
    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Market'
    },
    marketCode: { type: String },
    marketName: { type: mongoose.Schema.Types.Mixed }, // Cache market name for display (can be string or multi-lang object)

    // Sales channel - determines pricing tier used
    salesChannel: {
      type: String,
      enum: ['b2c', 'b2b'],
      default: 'b2c'
    },

    // Season reference (primary season - typically first night's season)
    season: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Season'
    },
    seasonCode: { type: String },
    seasonName: multiLangString(), // Cache season name for display

    // Booking dates (required for final booking, optional for draft)
    checkIn: {
      type: Date,
      index: true
    },
    checkOut: {
      type: Date
    },
    nights: {
      type: Number,
      min: 1
    },

    // Rooms
    rooms: [roomBookingSchema],
    totalRooms: {
      type: Number,
      min: 1,
      default: 1
    },

    // Total guests
    totalAdults: { type: Number, min: 1 },
    totalChildren: { type: Number, default: 0 },
    totalInfants: { type: Number, default: 0 },

    // Lead guest / Booker
    leadGuest: guestSchema,

    // Contact information (required for final booking, optional for draft)
    contact: {
      email: {
        type: String,
        trim: true,
        lowercase: true
      },
      phone: {
        type: String,
        trim: true
      },
      alternativePhone: { type: String, trim: true },
      countryCode: { type: String, uppercase: true } // ISO country code
    },

    // Billing information (optional)
    billing: {
      companyName: { type: String, trim: true },
      taxNumber: { type: String, trim: true },
      taxOffice: { type: String, trim: true },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      country: { type: String, trim: true },
      postalCode: { type: String, trim: true }
    },

    // Pricing summary (required for final booking, optional for draft)
    pricing: {
      currency: { type: String },
      subtotal: { type: Number },
      totalDiscount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      taxRate: { type: Number, default: 0 },
      grandTotal: { type: Number },
      // For B2B
      netPrice: { type: Number },
      commission: { type: Number },
      commissionRate: { type: Number },
      // Custom discount applied by agent
      customDiscount: {
        type: { type: String, enum: ['percent', 'amount'] },
        value: { type: Number },
        amount: { type: Number }
      }
    },

    // Payment
    payment: {
      status: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
        default: 'pending'
      },
      method: {
        type: String,
        enum: ['credit_card', 'bank_transfer', 'cash', 'agency_credit', 'online', 'pay_at_checkin'],
        default: 'credit_card'
      },
      // Payment records reference
      payments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Payment'
        }
      ],
      // Payment Link reference (for credit card payments via payment link)
      paymentLinkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentLink'
      },
      paymentLinkToken: { type: String },
      // Legacy transactions (keeping for backward compatibility)
      transactions: [
        {
          type: {
            type: String,
            enum: ['payment', 'refund', 'chargeback']
          },
          amount: Number,
          currency: String,
          date: { type: Date, default: Date.now },
          reference: String,
          gateway: String, // stripe, iyzico, etc.
          gatewayTransactionId: String,
          status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded']
          },
          metadata: mongoose.Schema.Types.Mixed
        }
      ],
      paidAmount: { type: Number, default: 0 },
      dueAmount: { type: Number }
    },

    // Booking status
    status: {
      type: String,
      enum: [
        'draft',
        'pending',
        'confirmed',
        'checked_in',
        'cancelled',
        'completed',
        'no_show',
        'expired'
      ],
      default: 'pending',
      index: true
    },

    // Current phase (for draft bookings)
    currentPhase: {
      type: Number,
      enum: [1, 2],
      default: 2
    },

    // Search criteria snapshot (for draft bookings - to restore search state)
    searchCriteria: {
      hotelIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }],
      tourismRegionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TourismRegion' }],
      dateRange: {
        start: { type: Date },
        end: { type: Date }
      },
      adults: { type: Number },
      children: [{ type: Number }],
      channel: { type: String, enum: ['B2B', 'B2C'] },
      countryCode: { type: String }
    },

    // Invoice details (required for final booking)
    invoiceDetails: {
      type: {
        type: String,
        enum: ['individual', 'corporate']
      },
      // Individual invoice
      individual: {
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        tcNumber: { type: String, trim: true }, // Optional for TR citizens
        address: {
          street: { type: String, trim: true },
          district: { type: String, trim: true },
          city: { type: String, trim: true },
          postalCode: { type: String, trim: true },
          country: { type: String, trim: true, default: 'TR' }
        }
      },
      // Corporate invoice
      corporate: {
        companyName: { type: String, trim: true },
        taxNumber: { type: String, trim: true },
        taxOffice: { type: String, trim: true },
        address: {
          street: { type: String, trim: true },
          district: { type: String, trim: true },
          city: { type: String, trim: true },
          postalCode: { type: String, trim: true },
          country: { type: String, trim: true, default: 'TR' }
        }
      }
    },

    // Expiration for drafts (7 days from creation)
    expiresAt: {
      type: Date,
      index: true
    },

    // Last activity timestamp
    lastActivityAt: {
      type: Date,
      default: Date.now
    },

    // Booking source
    source: {
      type: {
        type: String,
        enum: ['b2c', 'b2b', 'admin', 'api', 'channel', 'paximum', 'pms', 'migration'],
        default: 'b2c'
      },
      channel: { type: String }, // Booking source channel name
      agencyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agency'
      },
      agencyName: { type: String },
      agencyUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AgencyUser'
      },
      sessionId: { type: String }, // For B2C tracking
      ipAddress: { type: String },
      userAgent: { type: String },
      // Paximum OTA booking data
      paximumData: {
        reservationNumber: { type: String }, // Paximum reservation number
        transactionId: { type: String }, // Paximum transaction ID
        offerId: { type: String }, // Selected offer ID
        hotelId: { type: String }, // Paximum hotel ID
        hotelName: { type: String }, // Paximum hotel name
        roomName: { type: String }, // Room type name from Paximum
        boardName: { type: String }, // Board/meal plan from Paximum
        originalPrice: { type: Number }, // Original price from Paximum
        currency: { type: String }, // Original currency
        markupRate: { type: Number }, // Applied markup percentage
        markupAmount: { type: Number }, // Markup amount applied
        checkIn: { type: Date },
        checkOut: { type: Date },
        nights: { type: Number },
        adults: { type: Number },
        children: [{ type: Number }], // Child ages array
        isRefundable: { type: Boolean },
        cancellationPolicies: [
          {
            // Cancellation policy from Paximum
            dueDate: { type: Date },
            price: { type: Number },
            currency: { type: String }
          }
        ],
        rawResponse: mongoose.Schema.Types.Mixed // Full Paximum response for debugging
      }
    },

    // Cancellation
    cancellation: {
      cancelledAt: { type: Date },
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: { type: String, trim: true },
      refundAmount: { type: Number, default: 0 },
      refundStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'declined']
      },
      policy: {
        daysBeforeCheckIn: Number,
        refundPercent: Number
      }
    },

    // Modification history
    modifications: [
      {
        modifiedAt: { type: Date, default: Date.now },
        modifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        type: {
          type: String,
          enum: ['dates', 'rooms', 'guests', 'payment', 'status', 'pricing', 'full', 'other']
        },
        description: { type: String },
        previousValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed
      }
    ],

    // Amendment snapshots (full booking state before each change)
    amendmentSnapshots: [amendmentSnapshotSchema],

    // Notes
    notes: [
      {
        createdAt: { type: Date, default: Date.now },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        content: { type: String, trim: true },
        isInternal: { type: Boolean, default: true }
      }
    ],

    // Special requests (general)
    specialRequests: { type: String, trim: true },

    // Guest preferred language (for emails)
    guestLanguage: {
      type: String,
      enum: SUPPORTED_LANGUAGES,
      default: 'tr'
    },

    // Timestamps
    confirmedAt: { type: Date },
    completedAt: { type: Date },

    // External references
    externalReferences: {
      supplierConfirmation: { type: String },
      channelBookingId: { type: String },
      pmsReservationId: { type: String }
    },

    // Metadata
    metadata: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes
bookingSchema.index({ partner: 1, bookingNumber: 1 })
bookingSchema.index({ partner: 1, status: 1 })
bookingSchema.index({ partner: 1, checkIn: 1 })
bookingSchema.index({ hotel: 1, checkIn: 1 })
bookingSchema.index({ hotel: 1, status: 1 })
bookingSchema.index({ 'contact.email': 1 })
bookingSchema.index({ 'source.agencyId': 1 })
bookingSchema.index({ createdAt: -1 })
// New indexes for draft management
bookingSchema.index({ status: 1, expiresAt: 1 }) // For expire job
bookingSchema.index({ partner: 1, status: 1, createdAt: -1 }) // For listing drafts
bookingSchema.index({ 'source.agencyUserId': 1, status: 1 }) // User's drafts

/**
 * Generate unique booking number
 * @param {string} type - 'draft' or 'booking'
 * @returns {string} - DRF-2024-000001 or BKG-2024-000001
 */
bookingSchema.statics.generateBookingNumber = async function (partnerId, type = 'booking') {
  const prefix = type === 'draft' ? 'DRF' : 'BKG'
  const year = new Date().getFullYear()

  // Find the last booking number for this type and year
  const lastBooking = await this.findOne({
    bookingNumber: new RegExp(`^${prefix}-${year}-`)
  }).sort({ bookingNumber: -1 })

  let sequence = 1
  if (lastBooking) {
    const parts = lastBooking.bookingNumber.split('-')
    if (parts.length === 3) {
      const lastSequence = parseInt(parts[2])
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1
      }
    }
  }

  return `${prefix}-${year}-${String(sequence).padStart(6, '0')}`
}

/**
 * Convert draft booking number to confirmed booking number
 * @param {string} draftNumber - DRF-2024-000001
 * @returns {string} - BKG-2024-000001
 */
bookingSchema.statics.convertDraftToBookingNumber = async function (_draftNumber) {
  // Generate a new BKG number
  return await this.generateBookingNumber(null, 'booking')
}

// Calculate nights
bookingSchema.methods.calculateNights = function () {
  const checkIn = new Date(this.checkIn)
  const checkOut = new Date(this.checkOut)
  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
}

// Check if cancellation is allowed
bookingSchema.methods.canCancel = function () {
  if (['cancelled', 'completed', 'no_show'].includes(this.status)) {
    return { allowed: false, reason: 'Booking already finalized' }
  }
  return { allowed: true }
}

// Pre-save middleware
bookingSchema.pre('save', async function () {
  // Calculate nights
  if (this.checkIn && this.checkOut) {
    this.nights = this.calculateNights()
  }

  // Calculate payment due amount
  if (this.pricing && this.payment) {
    this.payment.dueAmount = this.pricing.grandTotal - (this.payment.paidAmount || 0)
  }

  // Set expiresAt for new drafts (7 days from now)
  if (this.isNew && this.status === 'draft' && !this.expiresAt) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    this.expiresAt = expiresAt
  }

  // Update lastActivityAt on any modification
  if (this.isModified() && !this.isNew) {
    this.lastActivityAt = new Date()
  }

  // Set confirmedAt when status changes to confirmed
  if (this.isModified('status') && this.status === 'confirmed' && !this.confirmedAt) {
    this.confirmedAt = new Date()
    // Clear expiresAt when confirmed
    this.expiresAt = undefined
  }

  // Set completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date()
  }
})

// Virtual for formatted dates
bookingSchema.virtual('formattedCheckIn').get(function () {
  return this.checkIn?.toISOString().split('T')[0]
})

bookingSchema.virtual('formattedCheckOut').get(function () {
  return this.checkOut?.toISOString().split('T')[0]
})

// Static: Find by booking number
bookingSchema.statics.findByBookingNumber = function (bookingNumber) {
  return this.findOne({ bookingNumber: bookingNumber.toUpperCase() })
}

// Static: Find by partner with filters
bookingSchema.statics.findByPartner = function (partnerId, filters = {}) {
  const query = { partner: partnerId }

  if (filters.status) query.status = filters.status
  if (filters.hotel) query.hotel = filters.hotel
  if (filters.checkIn) {
    query.checkIn = { $gte: new Date(filters.checkIn) }
  }
  if (filters.checkOut) {
    query.checkOut = { $lte: new Date(filters.checkOut) }
  }

  return this.find(query).sort({ createdAt: -1 })
}

// Static: Get upcoming bookings for a hotel
bookingSchema.statics.getUpcoming = function (hotelId, days = 7) {
  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + days)

  return this.find({
    hotel: hotelId,
    checkIn: { $gte: now, $lte: future },
    status: { $in: ['pending', 'confirmed'] }
  }).sort({ checkIn: 1 })
}

// Apply audit plugin for change tracking
bookingSchema.plugin(auditPlugin, {
  module: 'booking',
  subModule: 'reservation',
  nameField: 'bookingNumber'
})

export default mongoose.model('Booking', bookingSchema)
