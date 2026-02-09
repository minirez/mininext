import mongoose from 'mongoose'
import { validateForeignKeys } from '#helpers'

/**
 * Room Model - Physical room inventory for hotel
 * Represents individual rooms like 101, 102, 201, etc.
 */

// Room status enum
export const ROOM_STATUS = {
  VACANT_CLEAN: 'vacant_clean', // Bos ve temiz - satisa hazir
  VACANT_DIRTY: 'vacant_dirty', // Bos ama kirli - temizlik bekliyor
  OCCUPIED: 'occupied', // Misafir var
  CHECKOUT: 'checkout', // Cikis yapildi, temizlik bekliyor
  MAINTENANCE: 'maintenance', // Bakimda
  OUT_OF_ORDER: 'out_of_order', // Kullanim disi
  INSPECTED: 'inspected' // Denetlendi, onaylandi
}

// Housekeeping status enum
export const HOUSEKEEPING_STATUS = {
  CLEAN: 'clean',
  DIRTY: 'dirty',
  CLEANING: 'cleaning', // Temizlik yapiliyor
  INSPECTED: 'inspected' // Denetlendi
}

// Housekeeping priority
export const HOUSEKEEPING_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
}

const roomSchema = new mongoose.Schema(
  {
    // Hotel reference
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel gerekli'],
      index: true
    },

    // Room identification
    roomNumber: {
      type: String,
      required: [true, 'Oda numarasi gerekli'],
      trim: true
    },

    floor: {
      type: Number,
      required: [true, 'Kat numarasi gerekli'],
      min: -5, // Bodrum katlar icin
      max: 100
    },

    // Room type reference
    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: [true, 'Oda tipi gerekli']
    },

    // Room status
    status: {
      type: String,
      enum: Object.values(ROOM_STATUS),
      default: ROOM_STATUS.VACANT_CLEAN
    },

    // Housekeeping status
    housekeepingStatus: {
      type: String,
      enum: Object.values(HOUSEKEEPING_STATUS),
      default: HOUSEKEEPING_STATUS.CLEAN
    },

    // Housekeeping priority
    housekeepingPriority: {
      type: String,
      enum: Object.values(HOUSEKEEPING_PRIORITY),
      default: HOUSEKEEPING_PRIORITY.NORMAL
    },

    // Current occupancy (if occupied)
    currentBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },

    currentGuests: [
      {
        firstName: String,
        lastName: String,
        isMainGuest: { type: Boolean, default: false }
      }
    ],

    checkInDate: {
      type: Date,
      default: null
    },

    expectedCheckoutDate: {
      type: Date,
      default: null
    },

    // Housekeeping assignment
    assignedHousekeeper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    lastCleanedAt: {
      type: Date,
      default: null
    },

    lastCleanedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    lastInspectedAt: {
      type: Date,
      default: null
    },

    lastInspectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // Room-specific features (additional to room type)
    features: [
      {
        type: String,
        trim: true
      }
    ],

    // Connecting rooms
    connectingRooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
      }
    ],

    // Room notes
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    // Maintenance notes
    maintenanceNotes: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    // Is room active?
    isActive: {
      type: Boolean,
      default: true
    },

    // Sorting order
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Compound indexes
roomSchema.index({ hotel: 1, roomNumber: 1 }, { unique: true })
roomSchema.index({ hotel: 1, floor: 1 })
roomSchema.index({ hotel: 1, status: 1 })
roomSchema.index({ hotel: 1, housekeepingStatus: 1 })
roomSchema.index({ hotel: 1, roomType: 1 })
roomSchema.index({ assignedHousekeeper: 1 })

// Additional indexes for performance
roomSchema.index({ roomType: 1 })
roomSchema.index({ currentBooking: 1 })
roomSchema.index({ lastCleanedBy: 1 })
roomSchema.index({ lastInspectedBy: 1 })

// Query optimization indexes
roomSchema.index({ hotel: 1, status: 1, housekeepingStatus: 1 }) // Dashboard: rooms needing cleaning
roomSchema.index({ hotel: 1, housekeepingPriority: 1, floor: 1 }) // Housekeeping task prioritization
roomSchema.index({ assignedHousekeeper: 1, hotel: 1, housekeepingStatus: 1 }) // User workload queries
roomSchema.index({ hotel: 1, lastCleanedAt: -1 }) // Cleaning history reports
roomSchema.index({ hotel: 1, isActive: 1, status: 1 }) // Active room filtering

// Additional indexes for operations
roomSchema.index({ hotel: 1, expectedCheckoutDate: 1 }) // Imminent checkout lookup
roomSchema.index({ hotel: 1, status: 1, floor: 1 }) // Floor-level status reports
roomSchema.index({ hotel: 1, housekeepingStatus: 1, housekeepingPriority: -1 }) // Task prioritization

// Virtual for display name
roomSchema.virtual('displayName').get(function () {
  return `Oda ${this.roomNumber}`
})

// Virtual for current guest name (main guest or first guest)
roomSchema.virtual('guestName').get(function () {
  if (!this.currentGuests || this.currentGuests.length === 0) {
    return null
  }
  const mainGuest = this.currentGuests.find(g => g.isMainGuest) || this.currentGuests[0]
  if (!mainGuest) return null
  return `${mainGuest.firstName || ''} ${mainGuest.lastName || ''}`.trim() || null
})

// Check if room is available for check-in
roomSchema.methods.isAvailableForCheckIn = function () {
  return this.status === ROOM_STATUS.VACANT_CLEAN || this.status === ROOM_STATUS.INSPECTED
}

// Check if room needs cleaning
roomSchema.methods.needsCleaning = function () {
  return (
    this.housekeepingStatus === HOUSEKEEPING_STATUS.DIRTY ||
    this.status === ROOM_STATUS.VACANT_DIRTY ||
    this.status === ROOM_STATUS.CHECKOUT
  )
}

// Mark as occupied
roomSchema.methods.checkIn = async function (bookingId, guests, checkoutDate) {
  this.status = ROOM_STATUS.OCCUPIED
  this.currentBooking = bookingId
  this.currentGuests = guests
  this.checkInDate = new Date()
  this.expectedCheckoutDate = checkoutDate
  return this.save()
}

// Mark as checkout
roomSchema.methods.checkOut = async function () {
  this.status = ROOM_STATUS.CHECKOUT
  this.housekeepingStatus = HOUSEKEEPING_STATUS.DIRTY
  this.housekeepingPriority = HOUSEKEEPING_PRIORITY.HIGH
  this.currentBooking = null
  this.currentGuests = []
  this.checkInDate = null
  this.expectedCheckoutDate = null
  return this.save()
}

// Mark as cleaned
roomSchema.methods.markCleaned = async function (userId) {
  this.housekeepingStatus = HOUSEKEEPING_STATUS.CLEAN
  this.lastCleanedAt = new Date()
  this.lastCleanedBy = userId

  // If was checkout or vacant_dirty, make it vacant_clean
  if (this.status === ROOM_STATUS.CHECKOUT || this.status === ROOM_STATUS.VACANT_DIRTY) {
    this.status = ROOM_STATUS.VACANT_CLEAN
  }

  return this.save()
}

// Mark as inspected
roomSchema.methods.markInspected = async function (userId) {
  this.housekeepingStatus = HOUSEKEEPING_STATUS.INSPECTED
  this.lastInspectedAt = new Date()
  this.lastInspectedBy = userId

  if (this.status === ROOM_STATUS.VACANT_CLEAN) {
    this.status = ROOM_STATUS.INSPECTED
  }

  return this.save()
}

// Static: Get rooms by floor
roomSchema.statics.getByFloor = function (hotelId, floor) {
  return this.find({ hotel: hotelId, floor, isActive: true })
    .populate('roomType', 'name code')
    .sort('roomNumber')
}

// Static: Get rooms needing cleaning
roomSchema.statics.getNeedingCleaning = function (hotelId) {
  return this.find({
    hotel: hotelId,
    isActive: true,
    $or: [
      { housekeepingStatus: HOUSEKEEPING_STATUS.DIRTY },
      { status: ROOM_STATUS.CHECKOUT },
      { status: ROOM_STATUS.VACANT_DIRTY }
    ]
  })
    .populate('roomType', 'name code')
    .populate('assignedHousekeeper', 'firstName lastName')
    .sort({ housekeepingPriority: -1, floor: 1, roomNumber: 1 })
}

// Static: Get room statistics
roomSchema.statics.getStatistics = async function (hotelId) {
  const stats = await this.aggregate([
    { $match: { hotel: new mongoose.Types.ObjectId(hotelId), isActive: true } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        occupied: {
          $sum: { $cond: [{ $eq: ['$status', ROOM_STATUS.OCCUPIED] }, 1, 0] }
        },
        vacantClean: {
          $sum: { $cond: [{ $eq: ['$status', ROOM_STATUS.VACANT_CLEAN] }, 1, 0] }
        },
        vacantDirty: {
          $sum: { $cond: [{ $eq: ['$status', ROOM_STATUS.VACANT_DIRTY] }, 1, 0] }
        },
        checkout: {
          $sum: { $cond: [{ $eq: ['$status', ROOM_STATUS.CHECKOUT] }, 1, 0] }
        },
        maintenance: {
          $sum: { $cond: [{ $eq: ['$status', ROOM_STATUS.MAINTENANCE] }, 1, 0] }
        },
        outOfOrder: {
          $sum: { $cond: [{ $eq: ['$status', ROOM_STATUS.OUT_OF_ORDER] }, 1, 0] }
        },
        inspected: {
          $sum: { $cond: [{ $eq: ['$status', ROOM_STATUS.INSPECTED] }, 1, 0] }
        },
        needsCleaning: {
          $sum: {
            $cond: [{ $in: ['$housekeepingStatus', [HOUSEKEEPING_STATUS.DIRTY]] }, 1, 0]
          }
        }
      }
    }
  ])

  return (
    stats[0] || {
      total: 0,
      occupied: 0,
      vacantClean: 0,
      vacantDirty: 0,
      checkout: 0,
      maintenance: 0,
      outOfOrder: 0,
      inspected: 0,
      needsCleaning: 0
    }
  )
}

// Static: Get floor summary
roomSchema.statics.getFloorSummary = async function (hotelId) {
  return this.aggregate([
    { $match: { hotel: new mongoose.Types.ObjectId(hotelId), isActive: true } },
    {
      $group: {
        _id: '$floor',
        total: { $sum: 1 },
        occupied: {
          $sum: { $cond: [{ $eq: ['$status', ROOM_STATUS.OCCUPIED] }, 1, 0] }
        },
        available: {
          $sum: {
            $cond: [{ $in: ['$status', [ROOM_STATUS.VACANT_CLEAN, ROOM_STATUS.INSPECTED]] }, 1, 0]
          }
        },
        dirty: {
          $sum: {
            $cond: [{ $in: ['$status', [ROOM_STATUS.VACANT_DIRTY, ROOM_STATUS.CHECKOUT]] }, 1, 0]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ])
}

// ============================================
// FOREIGN KEY VALIDATION (Pre-Save Hook)
// ============================================
roomSchema.pre('save', async function (next) {
  const fkFields = ['hotel', 'roomType', 'currentBooking']
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
        {
          model: 'Booking',
          id: this.currentBooking,
          field: 'Mevcut rezervasyon',
          query: { hotel: this.hotel }
        }
      ])
    } catch (error) {
      return next(error)
    }
  }
  next()
})

// ============================================
// STATUS SYNCHRONIZATION (Pre-Save Hook)
// ============================================
// Ensures status and housekeepingStatus remain consistent
roomSchema.pre('save', function (next) {
  // Only run if either status field was modified
  if (!this.isModified('status') && !this.isModified('housekeepingStatus')) {
    return next()
  }

  // Sync housekeepingStatus based on status changes
  if (this.isModified('status')) {
    switch (this.status) {
      case ROOM_STATUS.VACANT_DIRTY:
      case ROOM_STATUS.CHECKOUT:
        // Room needs cleaning
        if (this.housekeepingStatus !== HOUSEKEEPING_STATUS.CLEANING) {
          this.housekeepingStatus = HOUSEKEEPING_STATUS.DIRTY
        }
        break
      case ROOM_STATUS.VACANT_CLEAN:
        // Room is clean (but not inspected)
        if (this.housekeepingStatus === HOUSEKEEPING_STATUS.DIRTY) {
          this.housekeepingStatus = HOUSEKEEPING_STATUS.CLEAN
        }
        break
      case ROOM_STATUS.INSPECTED:
        // Room is inspected
        this.housekeepingStatus = HOUSEKEEPING_STATUS.INSPECTED
        break
      case ROOM_STATUS.OCCUPIED:
        // Occupied rooms are considered clean
        if (this.housekeepingStatus === HOUSEKEEPING_STATUS.DIRTY) {
          this.housekeepingStatus = HOUSEKEEPING_STATUS.CLEAN
        }
        break
    }
  }

  // Sync status based on housekeepingStatus changes (only for vacant rooms)
  if (this.isModified('housekeepingStatus') && !this.isModified('status')) {
    const isVacant = [
      ROOM_STATUS.VACANT_CLEAN,
      ROOM_STATUS.VACANT_DIRTY,
      ROOM_STATUS.CHECKOUT,
      ROOM_STATUS.INSPECTED
    ].includes(this.status)

    if (isVacant) {
      switch (this.housekeepingStatus) {
        case HOUSEKEEPING_STATUS.DIRTY:
          if (this.status === ROOM_STATUS.VACANT_CLEAN || this.status === ROOM_STATUS.INSPECTED) {
            this.status = ROOM_STATUS.VACANT_DIRTY
          }
          break
        case HOUSEKEEPING_STATUS.CLEAN:
          if (this.status === ROOM_STATUS.VACANT_DIRTY || this.status === ROOM_STATUS.CHECKOUT) {
            this.status = ROOM_STATUS.VACANT_CLEAN
          }
          break
        case HOUSEKEEPING_STATUS.INSPECTED:
          if (this.status === ROOM_STATUS.VACANT_CLEAN) {
            this.status = ROOM_STATUS.INSPECTED
          }
          break
      }
    }
  }

  next()
})

const Room = mongoose.model('Room', roomSchema)

export default Room
