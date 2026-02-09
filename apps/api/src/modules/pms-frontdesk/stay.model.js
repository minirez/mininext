import mongoose from 'mongoose'
import { validateForeignKeys } from '#helpers'
import { ROOM_STATUS } from '#modules/pms-housekeeping/room.model.js'

/**
 * Stay Model - Active guest stays in rooms
 * Tracks check-in to check-out lifecycle
 */

// Stay status enum
export const STAY_STATUS = {
  PENDING: 'pending', // Bekleyen rezervasyon (henuz check-in yapilmadi)
  CHECKED_IN: 'checked_in', // Aktif konaklama
  CHECKED_OUT: 'checked_out', // Cikis yapildi
  NO_SHOW: 'no_show', // Gelmedi
  CANCELLED: 'cancelled' // Iptal edildi
}

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending', // Odeme bekliyor
  PARTIAL: 'partial', // Kismi odeme
  PAID: 'paid', // Odendi
  REFUNDED: 'refunded' // Iade edildi
}

// Guest type
export const GUEST_TYPE = {
  ADULT: 'adult',
  CHILD: 'child',
  INFANT: 'infant'
}

const guestSchema = new mongoose.Schema(
  {
    // Reference to Guest collection for history tracking
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest',
      index: true
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
    type: {
      type: String,
      enum: Object.values(GUEST_TYPE),
      default: GUEST_TYPE.ADULT
    },
    age: {
      type: Number,
      min: 0,
      max: 120
    },
    nationality: {
      type: String,
      trim: true
    },
    idType: {
      type: String,
      enum: ['tc_kimlik', 'passport', 'driving_license', 'other'],
      default: 'tc_kimlik'
    },
    idNumber: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    // KBS (Kimlik Bildirim Sistemi) fields
    dateOfBirth: { type: Date },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    birthPlace: { type: String, trim: true },
    isMainGuest: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
)

const staySchema = new mongoose.Schema(
  {
    // Hotel reference
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel gerekli'],
      index: true
    },

    // Stay identification
    stayNumber: {
      type: String,
      unique: true,
      sparse: true // Allow null/undefined for pre-save hook to generate
    },

    // Room assignment (optional for pending reservations, required at check-in)
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null
    },

    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: true
    },

    // Booking reference (optional - null for walk-ins)
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },

    bookingNumber: {
      type: String,
      default: null
    },

    // Stay dates
    checkInDate: {
      type: Date,
      required: [true, 'Giris tarihi gerekli']
    },

    checkOutDate: {
      type: Date,
      required: [true, 'Cikis tarihi gerekli']
    },

    actualCheckIn: {
      type: Date,
      default: null
    },

    actualCheckOut: {
      type: Date,
      default: null
    },

    nights: {
      type: Number,
      required: true,
      min: 1
    },

    // Guests
    guests: [guestSchema],

    adultsCount: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },

    childrenCount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Meal plan
    mealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealPlan'
    },

    mealPlanCode: {
      type: String,
      trim: true
    },

    // Status
    status: {
      type: String,
      enum: Object.values(STAY_STATUS),
      default: STAY_STATUS.PENDING
    },

    // Checkout with outstanding balance (reason tracking)
    checkoutWithBalanceReason: {
      type: String,
      enum: ['company_invoice', 'agency_payment', 'credit_arrangement', 'dispute', 'other', null],
      default: null
    },

    checkoutWithBalanceNote: {
      type: String,
      trim: true,
      default: null
    },

    // Pricing
    roomRate: {
      type: Number,
      required: true,
      min: 0
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    balance: {
      type: Number,
      default: 0
    },

    currency: {
      type: String,
      default: 'TRY'
    },

    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING
    },

    // Extras and charges
    extras: [
      {
        date: { type: Date, default: Date.now },
        description: { type: String, default: '' },
        amount: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        category: {
          type: String,
          enum: [
            'minibar',
            'room_service',
            'laundry',
            'spa',
            'restaurant',
            'phone',
            'damage',
            'other'
          ],
          default: 'other'
        },
        // Multi-currency support
        currency: { type: String, default: 'TRY', uppercase: true },
        exchangeRate: { type: Number }, // Rate at time of charge
        amountInBaseCurrency: { type: Number }, // Amount in TRY for reporting
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],

    // Payments
    payments: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        method: {
          type: String,
          enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'online', 'other'],
          required: true
        },
        // Multi-currency support
        currency: { type: String, default: 'TRY', uppercase: true },
        exchangeRate: { type: Number }, // Rate at time of payment
        amountInBaseCurrency: { type: Number }, // Amount in TRY for reporting
        reference: { type: String },
        notes: { type: String },
        receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        // Link to original transaction for void/cancel sync
        transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
      }
    ],

    // Special requests and notes
    specialRequests: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    internalNotes: [
      {
        content: { type: String, required: true, trim: true },
        date: { type: Date, default: Date.now },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],

    // Check-in details
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    checkedOutBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Source
    source: {
      type: String,
      enum: ['booking', 'walk_in', 'phone', 'email', 'ota', 'corporate', 'other'],
      default: 'walk_in'
    },

    // Is walk-in?
    isWalkIn: {
      type: Boolean,
      default: false
    },

    // Room change history
    roomHistory: [
      {
        room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
        fromDate: Date,
        toDate: Date,
        reason: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now }
      }
    ],

    // VIP status
    isVip: {
      type: Boolean,
      default: false
    },

    vipLevel: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  {
    timestamps: true
  }
)

// Compound indexes
staySchema.index({ hotel: 1, stayNumber: 1 })
staySchema.index({ hotel: 1, status: 1 })
staySchema.index({ hotel: 1, checkInDate: 1 })
staySchema.index({ hotel: 1, checkOutDate: 1 })
staySchema.index({ room: 1, status: 1 })
staySchema.index({ booking: 1 })

// Additional indexes for performance
staySchema.index({ room: 1 })
staySchema.index({ roomType: 1 })
staySchema.index({ checkedInBy: 1 })
staySchema.index({ checkedOutBy: 1 })
staySchema.index({ 'payments.transaction': 1 }) // For transaction sync
staySchema.index({ hotel: 1, actualCheckIn: 1 })
staySchema.index({ hotel: 1, actualCheckOut: 1 })

// Query optimization indexes
staySchema.index({ hotel: 1, mealPlan: 1 }) // FK lookup and meal plan filtering
staySchema.index({ hotel: 1, status: 1, actualCheckIn: 1 }) // Complex status + date queries
staySchema.index({ room: 1, checkInDate: 1, checkOutDate: 1 }) // Room conflict detection
staySchema.index({ hotel: 1, booking: 1, status: 1 }) // Booking sync operations
staySchema.index({ hotel: 1, paymentStatus: 1 }) // Unpaid stays filtering
staySchema.index({ hotel: 1, createdAt: -1 }) // Recent stays listing

// Additional indexes for dashboard and reporting
staySchema.index({ hotel: 1, status: 1, paymentStatus: 1 }) // Dashboard: checked-in unpaid stays
staySchema.index({ hotel: 1, isWalkIn: 1, checkInDate: -1 }) // Walk-in statistics
staySchema.index({ hotel: 1, source: 1 }) // Source segmentation
staySchema.index({ hotel: 1, actualCheckOut: 1, paymentStatus: 1 }) // Post-checkout collection
staySchema.index({ hotel: 1, vipLevel: 1 }) // VIP guest filtering

// Virtual for main guest
staySchema.virtual('mainGuest').get(function () {
  return this.guests.find(g => g.isMainGuest) || this.guests[0]
})

// Virtual for guest display name
staySchema.virtual('guestName').get(function () {
  const main = this.mainGuest
  return main ? `${main.firstName} ${main.lastName}` : ''
})

// Virtual for extras total
staySchema.virtual('extrasTotal').get(function () {
  return this.extras.reduce((sum, e) => sum + e.amount * e.quantity, 0)
})

// Virtual for payments total
staySchema.virtual('paymentsTotal').get(function () {
  // Use amountInBaseCurrency for cross-currency payments
  // Using ?? (nullish coalescing) to properly handle 0 values
  return this.payments.reduce((sum, p) => sum + (p.amountInBaseCurrency ?? p.amount), 0)
})

// Pre-save: Validate foreign key references
staySchema.pre('save', async function (next) {
  // Only validate on new documents or when FK fields are modified
  const fkFields = ['hotel', 'room', 'roomType', 'booking', 'mealPlan']
  const needsValidation = this.isNew || fkFields.some(f => this.isModified(f))

  if (needsValidation) {
    try {
      await validateForeignKeys([
        { model: 'Hotel', id: this.hotel, field: 'Otel', required: true },
        {
          model: 'RoomType',
          id: this.roomType,
          field: 'Oda tipi',
          required: true,
          query: { hotel: this.hotel }
        },
        // Room is optional for pending stays, but if provided must belong to same hotel
        { model: 'Room', id: this.room, field: 'Oda', query: { hotel: this.hotel } },
        // Booking is optional (null for walk-ins), but if provided must belong to same hotel
        { model: 'Booking', id: this.booking, field: 'Rezervasyon', query: { hotel: this.hotel } },
        // MealPlan is optional
        { model: 'MealPlan', id: this.mealPlan, field: 'Yemek planı', query: { hotel: this.hotel } }
      ])
    } catch (error) {
      return next(error)
    }
  }
  next()
})

// Pre-save: Calculate balance
staySchema.pre('save', function (next) {
  const extrasTotal = this.extras.reduce((sum, e) => sum + e.amount * e.quantity, 0)
  // Use amountInBaseCurrency (TRY equivalent) for cross-currency payments
  // Using ?? (nullish coalescing) to properly handle 0 values
  const paymentsTotal = this.payments.reduce(
    (sum, p) => sum + (p.amountInBaseCurrency ?? p.amount),
    0
  )

  // roomRate is nightly rate, multiply by nights for total room cost
  // Using ?? for roomRate to properly handle 0 (free room)
  const roomTotal = (this.roomRate ?? 0) * (this.nights ?? 1)
  this.totalAmount = roomTotal + extrasTotal
  this.paidAmount = paymentsTotal
  this.balance = this.totalAmount - this.paidAmount

  // Update payment status
  if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = PAYMENT_STATUS.PAID
  } else if (this.paidAmount > 0) {
    this.paymentStatus = PAYMENT_STATUS.PARTIAL
  } else {
    this.paymentStatus = PAYMENT_STATUS.PENDING
  }

  next()
})

// Pre-save: Generate stay number
staySchema.pre('save', async function (next) {
  if (this.isNew && !this.stayNumber) {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')

    // Get today's count
    const startOfDay = new Date(date.setHours(0, 0, 0, 0))
    const endOfDay = new Date(date.setHours(23, 59, 59, 999))

    const count = await this.constructor.countDocuments({
      hotel: this.hotel,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })

    const sequence = (count + 1).toString().padStart(4, '0')
    this.stayNumber = `STY${year}${month}${day}${sequence}`
  }
  next()
})

// Method: Add extra charge
staySchema.methods.addExtra = async function (extra, userId) {
  this.extras.push({
    ...extra,
    addedBy: userId
  })
  return this.save()
}

// Method: Add payment
staySchema.methods.addPayment = async function (payment, userId) {
  this.payments.push({
    ...payment,
    receivedBy: userId
  })
  return this.save()
}

// Method: Change room
staySchema.methods.changeRoom = async function (newRoomId, reason, userId) {
  const Room = mongoose.model('Room')

  // CRITICAL: Use conditional update to prevent race conditions
  // Only update new room if it's still available
  const newRoom = await Room.findOneAndUpdate(
    {
      _id: newRoomId,
      status: { $in: ['vacant_clean', 'inspected'] }
    },
    {
      $set: {
        status: 'occupied',
        currentBooking: this.booking,
        currentGuests: this.guests.map(g => ({
          firstName: g.firstName,
          lastName: g.lastName,
          isMainGuest: g.isMainGuest
        })),
        checkInDate: new Date(),
        expectedCheckoutDate: this.checkOutDate
      }
    },
    { new: true }
  )

  // If new room wasn't updated, it's no longer available
  if (!newRoom) {
    const error = new Error('Yeni oda artık müsait değil')
    error.name = 'RoomNotAvailableError'
    throw error
  }

  // Add to history
  this.roomHistory.push({
    room: this.room,
    fromDate: this.actualCheckIn || this.checkInDate,
    toDate: new Date(),
    reason,
    changedBy: userId
  })

  // Update old room (safe - we're releasing it)
  await Room.findByIdAndUpdate(this.room, {
    status: 'checkout',
    housekeepingStatus: 'dirty',
    currentBooking: null,
    currentGuests: []
  })

  this.room = newRoomId
  this.roomType = newRoom.roomType

  return this.save()
}

// Method: Extend stay
staySchema.methods.extendStay = async function (newCheckOutDate, additionalNightlyRate = null) {
  const Room = mongoose.model('Room')

  const oldNights = this.nights
  const newNights = Math.ceil(
    (new Date(newCheckOutDate) - new Date(this.checkInDate)) / (1000 * 60 * 60 * 24)
  )
  const addedNights = newNights - oldNights

  this.checkOutDate = newCheckOutDate
  this.nights = newNights

  // If a different rate is provided for additional nights, add as extra charge
  // Otherwise, the pre-save hook will recalculate totalAmount based on roomRate * nights
  if (
    additionalNightlyRate !== null &&
    additionalNightlyRate !== this.roomRate &&
    addedNights > 0
  ) {
    // Add the rate difference for additional nights as an extension charge
    const rateDifference = (additionalNightlyRate - this.roomRate) * addedNights
    if (rateDifference !== 0) {
      this.extras.push({
        date: new Date(),
        description: `Konaklama uzatma (${addedNights} gece)`,
        amount: rateDifference,
        quantity: 1,
        category: 'other'
      })
    }
  }

  // Update room expected checkout
  await Room.findByIdAndUpdate(this.room, {
    expectedCheckoutDate: newCheckOutDate
  })

  return this.save()
}

// Method: Check out
staySchema.methods.checkOut = async function (userId) {
  const Room = mongoose.model('Room')

  this.status = STAY_STATUS.CHECKED_OUT
  this.actualCheckOut = new Date()
  this.checkedOutBy = userId

  // Update room
  await Room.findByIdAndUpdate(this.room, {
    status: 'checkout',
    housekeepingStatus: 'dirty',
    housekeepingPriority: 'high',
    currentBooking: null,
    currentGuests: [],
    checkInDate: null,
    expectedCheckoutDate: null
  })

  return this.save()
}

// Static: Get active stays
staySchema.statics.getActiveStays = function (hotelId) {
  return this.find({
    hotel: hotelId,
    status: STAY_STATUS.CHECKED_IN
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')
    .sort({ checkOutDate: 1 })
}

// Static: Get today's check-ins
staySchema.statics.getTodayCheckIns = function (hotelId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return this.find({
    hotel: hotelId,
    checkInDate: { $gte: today, $lt: tomorrow },
    status: { $in: [STAY_STATUS.CHECKED_IN] }
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')
}

// Static: Get today's check-outs
staySchema.statics.getTodayCheckOuts = function (hotelId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return this.find({
    hotel: hotelId,
    checkOutDate: { $gte: today, $lt: tomorrow },
    status: STAY_STATUS.CHECKED_IN
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')
}

// Static: Get expected arrivals (from bookings - not yet checked in)
staySchema.statics.getExpectedArrivals = async function (hotelId) {
  const Booking = mongoose.model('Booking')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get bookings that haven't been checked in yet
  const checkedInBookings = await this.find({
    hotel: hotelId,
    booking: { $ne: null }
  }).distinct('booking')

  return Booking.find({
    hotel: hotelId,
    checkIn: { $gte: today, $lt: tomorrow },
    status: { $in: ['confirmed', 'pending'] },
    _id: { $nin: checkedInBookings }
  })
}

// Static: Get front desk statistics
staySchema.statics.getFrontDeskStats = async function (hotelId) {
  const Room = mongoose.model('Room')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [activeStays, todayCheckIns, todayCheckOuts, roomStats] = await Promise.all([
    this.countDocuments({ hotel: hotelId, status: STAY_STATUS.CHECKED_IN }),
    this.countDocuments({
      hotel: hotelId,
      actualCheckIn: { $gte: today, $lt: tomorrow }
    }),
    this.countDocuments({
      hotel: hotelId,
      checkOutDate: { $gte: today, $lt: tomorrow },
      status: STAY_STATUS.CHECKED_IN
    }),
    Room.getStatistics(hotelId)
  ])

  return {
    activeStays,
    todayCheckIns,
    pendingCheckOuts: todayCheckOuts,
    ...roomStats
  }
}

// ============================================
// AUTO-SYNC PAYMENTS TO BOOKING (Post-Save Hook)
// ============================================
// LEGACY FALLBACK: This hook provides eventual consistency for simple saves.
// For critical operations (check-out, payment recording), use paymentSyncService.js
// which provides transaction-aware sync with proper error handling.
//
// When payment is added to Stay, sync back to associated Booking
staySchema.post('save', async function (doc) {
  // Skip if no booking association or invalid ObjectId (e.g., "undefined" string)
  if (!doc.booking || !mongoose.Types.ObjectId.isValid(doc.booking)) return

  // Safety check: Skip if explicitly marked (legacy fallback, not normally triggered)
  // Note: Booking->Stay sync now uses updateOne() which bypasses this hook entirely
  if (doc._skipBookingSync) {
    return
  }

  try {
    const Booking = mongoose.model('Booking')
    const booking = await Booking.findById(doc.booking)

    if (!booking) return

    // Initialize payment object if not exists
    if (!booking.payment) {
      booking.payment = {
        status: 'pending',
        method: null,
        paidAmount: 0,
        dueAmount: 0,
        transactions: []
      }
    }
    if (!booking.payment.transactions) {
      booking.payment.transactions = []
    }

    // Track if any transactions were added
    let transactionsAdded = false

    // Sync each Stay payment to Booking if not exists
    for (const payment of doc.payments) {
      // Check if this payment already exists in Booking
      const alreadyExists = booking.payment.transactions.some(
        t =>
          t.reference === payment.reference ||
          (Math.abs(new Date(t.date) - new Date(payment.date)) < 60000 &&
            Math.abs(t.amount - payment.amount) < 0.01)
      )

      if (!alreadyExists) {
        booking.payment.transactions.push({
          type: 'payment',
          amount: payment.amount,
          currency: payment.currency || 'TRY',
          date: payment.date || new Date(),
          reference: payment.reference || `StaySync-${payment._id}`,
          status: 'completed'
        })
        transactionsAdded = true
      }
    }

    // Only update if transactions were actually added (prevents unnecessary updates)
    if (transactionsAdded) {
      // Recalculate Booking payment totals
      const totalPaid = booking.payment.transactions
        .filter(t => t.type === 'payment' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0)

      const grandTotal = booking.pricing?.grandTotal || booking.totalAmount || 0

      booking.payment.paidAmount = totalPaid
      booking.payment.dueAmount = Math.max(0, grandTotal - totalPaid)

      if (totalPaid >= grandTotal) {
        booking.payment.status = 'paid'
      } else if (totalPaid > 0) {
        booking.payment.status = 'partial'
      } else {
        booking.payment.status = 'pending'
      }

      // Save without triggering infinite loop (use updateOne to skip hooks)
      await Booking.updateOne({ _id: booking._id }, { $set: { payment: booking.payment } })
    }
  } catch (error) {
    // Log error but don't throw - don't break the stay save
  }
})

// ============================================
// ORPHAN CLEANUP (Pre-Delete Hooks)
// ============================================
// Clean up references when stay is deleted
staySchema.pre('deleteOne', { document: true, query: false }, async function () {
  try {
    const Transaction = mongoose.model('Transaction')
    const Room = mongoose.model('Room')
    const Guest = mongoose.model('Guest')

    // Preserve audit trail: Store deleted stay info in transactions before unlinking
    const mainGuest = this.guests?.find(g => g.isMainGuest) || this.guests?.[0]
    const deletedStayInfo = {
      stayNumber: this.stayNumber,
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate,
      guestName: mainGuest ? `${mainGuest.firstName} ${mainGuest.lastName}` : null,
      deletedAt: new Date()
    }

    await Transaction.updateMany(
      { stay: this._id },
      {
        $set: { deletedStayInfo },
        $unset: { stay: 1 }
      }
    )

    // Update room status if this stay was active
    if (this.room && this.status === STAY_STATUS.CHECKED_IN) {
      await Room.findByIdAndUpdate(this.room, {
        status: ROOM_STATUS.VACANT_DIRTY,
        housekeepingStatus: 'dirty',
        $unset: { currentGuests: 1, expectedCheckoutDate: 1, checkInDate: 1 }
      })
    }

    // Update guest statistics (decrease stay count)
    const guestIds = this.guests?.filter(g => g.guest)?.map(g => g.guest) || []

    if (guestIds.length > 0) {
      await Guest.updateMany(
        { _id: { $in: guestIds } },
        { $inc: { 'statistics.totalStays': -1, 'statistics.totalNights': -(this.nights || 0) } }
      )
    }
  } catch (error) {
    // Log cleanup error but don't throw - deletion should proceed
  }
})

const Stay = mongoose.model('Stay', staySchema)

export default Stay
