/**
 * Night Audit Model
 * Tracks end-of-day audit process for hotel
 */

import mongoose from 'mongoose'

const { Schema } = mongoose

// Issue schema for pre-audit checks
const issueSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['arrivals', 'departures', 'balances', 'housekeeping', 'shifts', 'rates'],
      required: true
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error'],
      default: 'info'
    },
    message: { type: String, required: true },
    details: Schema.Types.Mixed,
    resolved: { type: Boolean, default: false },
    resolvedAt: Date,
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: false }
)

// No-show processing record
const noShowRecordSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    bookingNumber: { type: String, required: true },
    guestName: { type: String },
    roomCount: { type: Number, default: 1 },
    nights: { type: Number },
    totalAmount: { type: Number },
    action: {
      type: String,
      enum: ['no_show', 'cancelled', 'extended', 'skipped'],
      required: true
    },
    chargeAmount: { type: Number, default: 0 },
    chargeType: {
      type: String,
      enum: ['none', 'first_night', 'full_amount', 'custom'],
      default: 'none'
    },
    processedAt: { type: Date, default: Date.now },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: false }
)

// Room charge record
const roomChargeRecordSchema = new Schema(
  {
    stay: { type: Schema.Types.ObjectId, ref: 'Stay', required: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room' },
    roomNumber: { type: String },
    guestName: { type: String },
    roomRate: { type: Number, default: 0 },
    extras: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    transaction: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    status: {
      type: String,
      enum: ['pending', 'posted', 'skipped', 'error'],
      default: 'pending'
    },
    error: { type: String }
  },
  { _id: false }
)

// Cashier reconciliation record
const shiftRecordSchema = new Schema(
  {
    shift: { type: Schema.Types.ObjectId, ref: 'CashRegister', required: true },
    shiftNumber: { type: String },
    cashierName: { type: String },
    openedAt: { type: Date },
    expectedCash: { type: Number, default: 0 },
    actualCash: { type: Number },
    discrepancy: { type: Number, default: 0 },
    cardTotal: { type: Number, default: 0 },
    bankTotal: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['open', 'closed', 'reconciled'],
      default: 'open'
    },
    closedAt: { type: Date },
    closedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    discrepancyNote: { type: String }
  },
  { _id: false }
)

// Generated report record
const reportRecordSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['daily_summary', 'revenue', 'occupancy', 'cashier', 'guest_ledger', 'transactions'],
      required: true
    },
    filename: { type: String },
    url: { type: String },
    generatedAt: { type: Date, default: Date.now },
    fileSize: { type: Number }
  },
  { _id: false }
)

// Main Night Audit schema
const nightAuditSchema = new Schema(
  {
    // Hotel reference
    hotel: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true
    },

    // Audit identification
    auditNumber: {
      type: String,
      required: true,
      unique: true
    },
    auditDate: {
      type: Date,
      required: true,
      index: true
    },

    // Status tracking
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'cancelled'],
      default: 'in_progress',
      index: true
    },
    currentStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },

    // Step 1: Pre-Audit Check
    preAuditCheck: {
      completed: { type: Boolean, default: false },
      completedAt: Date,
      completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      issues: [issueSchema],
      summary: {
        totalArrivals: { type: Number, default: 0 },
        checkedInArrivals: { type: Number, default: 0 },
        pendingArrivals: { type: Number, default: 0 },
        totalDepartures: { type: Number, default: 0 },
        checkedOutDepartures: { type: Number, default: 0 },
        pendingDepartures: { type: Number, default: 0 },
        outstandingBalances: { type: Number, default: 0 },
        outstandingAmount: { type: Number, default: 0 },
        dirtyRooms: { type: Number, default: 0 },
        openShifts: { type: Number, default: 0 }
      }
    },

    // Step 2: No-Show Processing
    noShowProcessing: {
      completed: { type: Boolean, default: false },
      completedAt: Date,
      completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      totalNoShows: { type: Number, default: 0 },
      processedCount: { type: Number, default: 0 },
      totalCharges: { type: Number, default: 0 },
      records: [noShowRecordSchema]
    },

    // Step 3: Room Charge Posting
    roomChargePosting: {
      completed: { type: Boolean, default: false },
      completedAt: Date,
      completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      totalRooms: { type: Number, default: 0 },
      postedCount: { type: Number, default: 0 },
      totalRoomCharges: { type: Number, default: 0 },
      totalExtras: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
      records: [roomChargeRecordSchema]
    },

    // Step 4: Cashier Reconciliation
    cashierReconciliation: {
      completed: { type: Boolean, default: false },
      completedAt: Date,
      completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      totalShifts: { type: Number, default: 0 },
      closedCount: { type: Number, default: 0 },
      totalCash: { type: Number, default: 0 },
      totalCard: { type: Number, default: 0 },
      totalBank: { type: Number, default: 0 },
      totalDiscrepancy: { type: Number, default: 0 },
      shifts: [shiftRecordSchema]
    },

    // Step 5: Reports & Close
    reportsAndClose: {
      completed: { type: Boolean, default: false },
      completedAt: Date,
      completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reports: [reportRecordSchema],
      emailSent: { type: Boolean, default: false },
      emailRecipients: [{ type: String }],
      dayClosed: { type: Boolean, default: false },
      dayClosedAt: Date
    },

    // Daily Summary
    summary: {
      // Occupancy
      totalRooms: { type: Number, default: 0 },
      occupiedRooms: { type: Number, default: 0 },
      availableRooms: { type: Number, default: 0 },
      occupancyRate: { type: Number, default: 0 },

      // Guest Movement
      arrivals: { type: Number, default: 0 },
      departures: { type: Number, default: 0 },
      inHouseGuests: { type: Number, default: 0 },
      noShows: { type: Number, default: 0 },
      cancellations: { type: Number, default: 0 },
      walkIns: { type: Number, default: 0 },

      // Revenue
      roomRevenue: { type: Number, default: 0 },
      extraRevenue: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      averageDailyRate: { type: Number, default: 0 },
      revPar: { type: Number, default: 0 },

      // Payments
      cashPayments: { type: Number, default: 0 },
      cardPayments: { type: Number, default: 0 },
      bankPayments: { type: Number, default: 0 },
      otherPayments: { type: Number, default: 0 },
      totalPayments: { type: Number, default: 0 }
    },

    // Audit trail
    startedAt: { type: Date, default: Date.now },
    startedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    completedAt: Date,
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: Date,
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelReason: { type: String },

    // Notes
    notes: { type: String, maxlength: 2000 }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes
nightAuditSchema.index({ hotel: 1, auditDate: -1 })
nightAuditSchema.index({ hotel: 1, status: 1 })
nightAuditSchema.index({ hotel: 1, status: 1, currentStep: 1 }) // Progress tracking
nightAuditSchema.index({ status: 1, completedAt: -1 }) // Audit history queries

// Virtual: Progress percentage
nightAuditSchema.virtual('progress').get(function () {
  let completed = 0
  if (this.preAuditCheck?.completed) completed++
  if (this.noShowProcessing?.completed) completed++
  if (this.roomChargePosting?.completed) completed++
  if (this.cashierReconciliation?.completed) completed++
  if (this.reportsAndClose?.completed) completed++
  return Math.round((completed / 5) * 100)
})

// Virtual: Steps status
nightAuditSchema.virtual('stepsStatus').get(function () {
  return {
    preAuditCheck: this.preAuditCheck?.completed
      ? 'completed'
      : this.currentStep === 1
        ? 'current'
        : 'pending',
    noShowProcessing: this.noShowProcessing?.completed
      ? 'completed'
      : this.currentStep === 2
        ? 'current'
        : 'pending',
    roomChargePosting: this.roomChargePosting?.completed
      ? 'completed'
      : this.currentStep === 3
        ? 'current'
        : 'pending',
    cashierReconciliation: this.cashierReconciliation?.completed
      ? 'completed'
      : this.currentStep === 4
        ? 'current'
        : 'pending',
    reportsAndClose: this.reportsAndClose?.completed
      ? 'completed'
      : this.currentStep === 5
        ? 'current'
        : 'pending'
  }
})

// Static: Generate audit number
nightAuditSchema.statics.generateAuditNumber = async function (hotelId, date) {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `NA-${dateStr}`

  const lastAudit = await this.findOne({
    auditNumber: { $regex: `^${prefix}` }
  }).sort({ auditNumber: -1 })

  let sequence = 1
  if (lastAudit) {
    const lastSequence = parseInt(lastAudit.auditNumber.split('-').pop(), 10)
    sequence = lastSequence + 1
  }

  return `${prefix}-${String(sequence).padStart(3, '0')}`
}

// Static: Get current audit
nightAuditSchema.statics.getCurrentAudit = function (hotelId) {
  return this.findOne({
    hotel: hotelId,
    status: 'in_progress'
  }).sort({ createdAt: -1 })
}

// Static: Get audit for date
nightAuditSchema.statics.getAuditForDate = function (hotelId, date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return this.findOne({
    hotel: hotelId,
    auditDate: { $gte: startOfDay, $lte: endOfDay }
  })
}

// Static: Get audit history
nightAuditSchema.statics.getHistory = function (hotelId, options = {}) {
  const { page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  return this.find({
    hotel: hotelId,
    status: 'completed'
  })
    .sort({ auditDate: -1 })
    .skip(skip)
    .limit(limit)
    .select(
      'auditNumber auditDate status summary.occupancyRate summary.totalRevenue completedAt completedBy'
    )
    .populate('completedBy', 'firstName lastName')
    .lean()
}

// Method: Complete a step
nightAuditSchema.methods.completeStep = function (stepNumber, userId, data = {}) {
  const stepNames = [
    'preAuditCheck',
    'noShowProcessing',
    'roomChargePosting',
    'cashierReconciliation',
    'reportsAndClose'
  ]
  const stepName = stepNames[stepNumber - 1]

  if (!stepName) {
    throw new Error('Invalid step number')
  }

  this[stepName].completed = true
  this[stepName].completedAt = new Date()
  this[stepName].completedBy = userId

  // Merge additional data
  Object.assign(this[stepName], data)

  // Move to next step
  if (stepNumber < 5) {
    this.currentStep = stepNumber + 1
  }

  return this.save()
}

// Method: Complete audit
nightAuditSchema.methods.complete = function (userId) {
  this.status = 'completed'
  this.completedAt = new Date()
  this.completedBy = userId
  this.reportsAndClose.dayClosed = true
  this.reportsAndClose.dayClosedAt = new Date()

  return this.save()
}

// Method: Cancel audit
nightAuditSchema.methods.cancel = function (userId, reason) {
  this.status = 'cancelled'
  this.cancelledAt = new Date()
  this.cancelledBy = userId
  this.cancelReason = reason

  return this.save()
}

export default mongoose.model('NightAudit', nightAuditSchema)
