/**
 * Guest Model
 * Centralized guest database for hotel operations
 */

import mongoose from 'mongoose'

// ID types for different countries/documents
export const ID_TYPES = {
  TC_KIMLIK: 'tc_kimlik',
  PASSPORT: 'passport',
  DRIVING_LICENSE: 'driving_license',
  NATIONAL_ID: 'national_id',
  OTHER: 'other'
}

// Guest VIP levels
export const VIP_LEVELS = {
  NONE: 'none',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum'
}

// KBS (Kimlik Bildirim Sistemi) status
export const KBS_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  NOT_REQUIRED: 'not_required'
}

// Contact preference schema
const contactPreferenceSchema = new mongoose.Schema(
  {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    phone: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false }
  },
  { _id: false }
)

// Address schema
const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true, uppercase: true }
  },
  { _id: false }
)

// Guest preferences schema
const preferencesSchema = new mongoose.Schema(
  {
    roomType: { type: String, trim: true },
    floorPreference: { type: String, enum: ['low', 'mid', 'high', 'any'], default: 'any' },
    bedType: { type: String, enum: ['single', 'double', 'twin', 'king', 'any'], default: 'any' },
    smokingRoom: { type: Boolean, default: false },
    quietRoom: { type: Boolean, default: false },
    accessibleRoom: { type: Boolean, default: false },
    pillow: { type: String, trim: true },
    roomTemperature: { type: String, trim: true },
    newspaper: { type: String, trim: true },
    minibarItems: [{ type: String, trim: true }],
    dietaryRestrictions: [{ type: String, trim: true }],
    allergies: [{ type: String, trim: true }],
    specialRequests: { type: String, trim: true }
  },
  { _id: false }
)

// Stay history entry (denormalized for quick access)
const stayHistorySchema = new mongoose.Schema(
  {
    stayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stay'
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    checkInDate: { type: Date },
    checkOutDate: { type: Date },
    roomNumber: { type: String },
    roomType: { type: String },
    totalAmount: { type: Number },
    status: { type: String }
  },
  { _id: false }
)

const guestSchema = new mongoose.Schema(
  {
    // Hotel reference (guests are hotel-specific)
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true
    },

    // Basic Info
    title: {
      type: String,
      enum: ['mr', 'mrs', 'ms', 'miss', 'dr', 'prof'],
      default: 'mr'
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say'
    },
    dateOfBirth: { type: Date },
    nationality: {
      type: String,
      trim: true,
      uppercase: true // ISO country code
    },

    // Identification
    idType: {
      type: String,
      enum: Object.values(ID_TYPES),
      default: ID_TYPES.TC_KIMLIK
    },
    idNumber: {
      type: String,
      trim: true,
      index: true
    },
    idExpiry: { type: Date },
    idIssuingCountry: { type: String, trim: true, uppercase: true },

    // KBS (Kimlik Bildirim Sistemi) - Turkish police notification fields
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    birthPlace: { type: String, trim: true },
    kbsStatus: {
      type: String,
      enum: Object.values(KBS_STATUS),
      default: KBS_STATUS.PENDING
    },
    kbsSentAt: { type: Date },
    kbsReference: { type: String, trim: true }, // Reference number from KBS system

    // Contact Info
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      index: true
    },
    alternatePhone: { type: String, trim: true },
    whatsapp: { type: String, trim: true },

    // Address
    address: addressSchema,

    // Company Info (for business travelers)
    company: {
      name: { type: String, trim: true },
      position: { type: String, trim: true },
      taxNumber: { type: String, trim: true }
    },

    // VIP & Loyalty
    vipLevel: {
      type: String,
      enum: Object.values(VIP_LEVELS),
      default: VIP_LEVELS.NONE
    },
    loyaltyNumber: { type: String, trim: true },
    loyaltyPoints: { type: Number, default: 0 },

    // Preferences
    preferences: preferencesSchema,
    contactPreferences: contactPreferenceSchema,

    // Stay Statistics (auto-updated)
    statistics: {
      totalStays: { type: Number, default: 0 },
      totalNights: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      lastStayDate: { type: Date },
      firstStayDate: { type: Date },
      averageStayLength: { type: Number, default: 0 },
      noShowCount: { type: Number, default: 0 },
      cancellationCount: { type: Number, default: 0 }
    },

    // Recent Stay History (last 10 stays for quick reference)
    recentStays: [stayHistorySchema],

    // Notes & Tags
    notes: [
      {
        content: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        isImportant: { type: Boolean, default: false }
      }
    ],
    tags: [{ type: String, trim: true }],

    // Blacklist
    isBlacklisted: { type: Boolean, default: false },
    blacklistReason: { type: String, trim: true },
    blacklistedAt: { type: Date },
    blacklistedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Status
    isActive: { type: Boolean, default: true },

    // Profile photo
    photoUrl: { type: String, trim: true }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes
guestSchema.index({ hotel: 1, lastName: 1, firstName: 1 })
guestSchema.index({ hotel: 1, email: 1 })
guestSchema.index({ hotel: 1, phone: 1 })
guestSchema.index({ hotel: 1, idNumber: 1 })
guestSchema.index({ hotel: 1, 'statistics.lastStayDate': -1 })
guestSchema.index({ hotel: 1, vipLevel: 1 })

// Query optimization indexes
guestSchema.index({ hotel: 1, isBlacklisted: 1 }) // Blacklist filtering
guestSchema.index({ hotel: 1, vipLevel: 1, 'statistics.totalSpent': -1 }) // VIP guest reporting
guestSchema.index({ hotel: 1, isActive: 1, 'statistics.lastStayDate': -1 }) // Active guests filtering
guestSchema.index({ hotel: 1, 'statistics.totalStays': -1 }) // Frequent guest reporting
guestSchema.index({ hotel: 1, nationality: 1 }) // Nationality-based reports
guestSchema.index({ hotel: 1, createdAt: -1 }) // Recent guests listing

// Additional indexes for KBS and loyalty
guestSchema.index({ hotel: 1, kbsStatus: 1 }) // KBS processing queue
guestSchema.index({ hotel: 1, 'statistics.totalSpent': -1 }) // High-value guest reports
guestSchema.index({ hotel: 1, 'statistics.noShowCount': -1 }) // No-show risk assessment

// Additional compound indexes for common queries
guestSchema.index({ hotel: 1, isActive: 1, createdAt: -1 }) // Recent active guests

// Full text search index
guestSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
  phone: 'text',
  idNumber: 'text'
})

// Virtual for full name
guestSchema.virtual('fullName').get(function () {
  const title = this.title ? this.title.charAt(0).toUpperCase() + this.title.slice(1) + '. ' : ''
  return `${title}${this.firstName} ${this.lastName}`
})

// Virtual for age
guestSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null
  const today = new Date()
  const birth = new Date(this.dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
})

// Method: Add stay to history
guestSchema.methods.addStayToHistory = function (stayData) {
  // Add to recent stays (keep last 10)
  this.recentStays.unshift({
    stayId: stayData._id,
    bookingId: stayData.booking,
    checkInDate: stayData.checkInDate,
    checkOutDate: stayData.checkOutDate,
    roomNumber: stayData.room?.roomNumber,
    roomType: stayData.roomType?.code,
    totalAmount: stayData.totalAmount,
    status: stayData.status
  })

  if (this.recentStays.length > 10) {
    this.recentStays = this.recentStays.slice(0, 10)
  }

  // Update statistics
  this.statistics.totalStays++
  this.statistics.totalNights += stayData.nights || 0
  this.statistics.totalSpent += stayData.totalAmount || 0
  this.statistics.lastStayDate = stayData.checkInDate

  if (!this.statistics.firstStayDate) {
    this.statistics.firstStayDate = stayData.checkInDate
  }

  this.statistics.averageStayLength = this.statistics.totalNights / this.statistics.totalStays

  return this.save()
}

// Method: Update VIP level based on statistics
guestSchema.methods.updateVipLevel = function () {
  const { totalStays, totalSpent } = this.statistics

  if (totalStays >= 20 || totalSpent >= 50000) {
    this.vipLevel = VIP_LEVELS.PLATINUM
  } else if (totalStays >= 10 || totalSpent >= 25000) {
    this.vipLevel = VIP_LEVELS.GOLD
  } else if (totalStays >= 5 || totalSpent >= 10000) {
    this.vipLevel = VIP_LEVELS.SILVER
  }

  return this.save()
}

// Method: Blacklist guest
guestSchema.methods.blacklist = function (reason, userId) {
  this.isBlacklisted = true
  this.blacklistReason = reason
  this.blacklistedAt = new Date()
  this.blacklistedBy = userId
  return this.save()
}

// Method: Remove from blacklist
guestSchema.methods.removeFromBlacklist = function () {
  this.isBlacklisted = false
  this.blacklistReason = undefined
  this.blacklistedAt = undefined
  this.blacklistedBy = undefined
  return this.save()
}

// Static: Find or create guest with improved duplicate handling
guestSchema.statics.findOrCreate = async function (hotelId, guestData) {
  let existingGuest = null

  // Priority 1: Try to find by ID number (strongest identifier)
  if (guestData.idNumber) {
    existingGuest = await this.findOne({
      hotel: hotelId,
      idNumber: guestData.idNumber
    })
  }

  // Priority 2: Try to find by email + name combination
  if (!existingGuest && guestData.email && guestData.firstName && guestData.lastName) {
    existingGuest = await this.findOne({
      hotel: hotelId,
      email: guestData.email.toLowerCase(),
      firstName: { $regex: new RegExp(`^${guestData.firstName}$`, 'i') },
      lastName: { $regex: new RegExp(`^${guestData.lastName}$`, 'i') }
    })
  }

  // Priority 3: Try to find by phone + name combination
  if (!existingGuest && guestData.phone && guestData.firstName && guestData.lastName) {
    existingGuest = await this.findOne({
      hotel: hotelId,
      phone: guestData.phone,
      firstName: { $regex: new RegExp(`^${guestData.firstName}$`, 'i') },
      lastName: { $regex: new RegExp(`^${guestData.lastName}$`, 'i') }
    })
  }

  // Priority 4: Try to find by exact name match (if we have unique identifiers like idNumber)
  if (!existingGuest && guestData.firstName && guestData.lastName) {
    if (guestData.email || guestData.phone || guestData.idNumber) {
      const nameMatch = await this.findOne({
        hotel: hotelId,
        firstName: { $regex: new RegExp(`^${guestData.firstName}$`, 'i') },
        lastName: { $regex: new RegExp(`^${guestData.lastName}$`, 'i') },
        $or: [
          { email: { $exists: false } },
          { email: null },
          { email: '' },
          { email: guestData.email?.toLowerCase() }
        ]
      })
      if (nameMatch && nameMatch.statistics?.lastStayDate) {
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        if (nameMatch.statistics.lastStayDate > oneYearAgo) {
          existingGuest = nameMatch
        }
      }
    }
  }

  // If found, update with new data (merge profile)
  if (existingGuest) {
    let hasChanges = false

    const fieldsToUpdate = ['phone', 'email', 'nationality', 'dateOfBirth', 'idNumber', 'idType']
    for (const field of fieldsToUpdate) {
      if (guestData[field] && guestData[field] !== existingGuest[field]) {
        existingGuest[field] = guestData[field]
        hasChanges = true
      }
    }

    if (guestData.address && Object.keys(guestData.address).length > 0) {
      existingGuest.address = {
        ...(existingGuest.address?.toObject?.() || {}),
        ...guestData.address
      }
      hasChanges = true
    }

    if (hasChanges) {
      await existingGuest.save()
    }

    return existingGuest
  }

  // Create new guest
  return this.create({
    hotel: hotelId,
    ...guestData
  })
}

// Static: Search guests
guestSchema.statics.search = async function (hotelId, query, options = {}) {
  const { page = 1, limit = 20, sort = '-statistics.lastStayDate' } = options

  const searchQuery = {
    hotel: hotelId,
    isActive: true
  }

  if (query) {
    searchQuery.$or = [
      { firstName: { $regex: query, $options: 'i' } },
      { lastName: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { phone: { $regex: query, $options: 'i' } },
      { idNumber: { $regex: query, $options: 'i' } }
    ]
  }

  const skip = (page - 1) * limit

  const [guests, total] = await Promise.all([
    this.find(searchQuery).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
    this.countDocuments(searchQuery)
  ])

  return {
    data: guests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

// Static: Get VIP guests
guestSchema.statics.getVipGuests = function (hotelId) {
  return this.find({
    hotel: hotelId,
    vipLevel: { $ne: VIP_LEVELS.NONE },
    isActive: true
  })
    .sort({ vipLevel: -1, 'statistics.totalSpent': -1 })
    .lean()
}

// Static: Get blacklisted guests
guestSchema.statics.getBlacklisted = function (hotelId) {
  return this.find({
    hotel: hotelId,
    isBlacklisted: true
  })
    .sort({ blacklistedAt: -1 })
    .lean()
}

// Static: Get recent guests (checked in recently)
guestSchema.statics.getRecentGuests = function (hotelId, days = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  return this.find({
    hotel: hotelId,
    'statistics.lastStayDate': { $gte: cutoffDate },
    isActive: true
  })
    .sort({ 'statistics.lastStayDate': -1 })
    .limit(50)
    .lean()
}

// Static: Get guest statistics
guestSchema.statics.getStatistics = async function (hotelId) {
  const [totalGuests, vipGuests, blacklistedGuests, recentGuests, topSpenders] = await Promise.all([
    this.countDocuments({ hotel: hotelId, isActive: true }),
    this.countDocuments({ hotel: hotelId, vipLevel: { $ne: VIP_LEVELS.NONE }, isActive: true }),
    this.countDocuments({ hotel: hotelId, isBlacklisted: true }),
    this.countDocuments({
      hotel: hotelId,
      'statistics.lastStayDate': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      isActive: true
    }),
    this.find({ hotel: hotelId, isActive: true })
      .sort({ 'statistics.totalSpent': -1 })
      .limit(5)
      .select('firstName lastName statistics.totalSpent statistics.totalStays vipLevel')
      .lean()
  ])

  return {
    totalGuests,
    vipGuests,
    blacklistedGuests,
    recentGuests,
    topSpenders
  }
}

export default mongoose.model('Guest', guestSchema)
