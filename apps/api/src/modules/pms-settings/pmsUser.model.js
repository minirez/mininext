import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const assignedHotelSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  role: {
    type: String,
    enum: ['pms_admin', 'front_desk_manager', 'receptionist', 'night_auditor', 'housekeeping_supervisor', 'housekeeper', 'revenue_manager', 'guest_relations'],
    default: 'receptionist'
  },
  permissions: [{
    type: String
  }]
}, { _id: false })

const loginHistorySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  ip: String,
  userAgent: String,
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel'
  }
}, { _id: false })

const pmsUserSchema = new mongoose.Schema({
  // Hangi partner'a ait
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: [true, 'REQUIRED_PARTNER']
  },

  // Kimlik bilgileri
  username: {
    type: String,
    required: [true, 'REQUIRED_USERNAME'],
    trim: true,
    minlength: [3, 'USERNAME_MIN_LENGTH'],
    maxlength: [50, 'USERNAME_MAX_LENGTH']
  },

  password: {
    type: String,
    required: [true, 'REQUIRED_PASSWORD'],
    minlength: [6, 'PASSWORD_MIN_LENGTH'],
    select: false
  },

  firstName: {
    type: String,
    required: [true, 'REQUIRED_FIRST_NAME'],
    trim: true
  },

  lastName: {
    type: String,
    required: [true, 'REQUIRED_LAST_NAME'],
    trim: true
  },

  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'INVALID_EMAIL']
  },

  phone: String,

  // Atanan oteller (birden fazla olabilir)
  assignedHotels: [assignedHotelSchema],

  // Departman ve pozisyon
  department: {
    type: String,
    enum: ['front_office', 'housekeeping', 'management', 'accounting', 'reservation', 'guest_relations'],
    default: 'front_office'
  },

  position: String,

  // Durum
  isActive: {
    type: Boolean,
    default: true
  },

  // Son giris
  lastLogin: Date,
  lastHotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel'
  },

  // Giris gecmisi
  loginHistory: [loginHistorySchema],

  // Dil tercihi
  language: {
    type: String,
    default: 'tr',
    enum: ['tr', 'en', 'de', 'ru', 'ar']
  }

}, {
  timestamps: true
})

// Indexes
pmsUserSchema.index({ partner: 1, username: 1 }, { unique: true })
pmsUserSchema.index({ partner: 1, email: 1 }, { sparse: true })
pmsUserSchema.index({ 'assignedHotels.hotel': 1 })

// Pre-save: Hash password
pmsUserSchema.pre('save', async function(next) {
  // Hash password only if modified
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Virtual: Full name
pmsUserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`
})

// Methods
pmsUserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Helper to get hotel ID whether populated or not
const getHotelId = (hotel) => {
  if (!hotel) return null
  // If populated, hotel is an object with _id
  // If not populated, hotel is just the ObjectId
  return hotel._id || hotel
}

pmsUserSchema.methods.hasAccessToHotel = function(hotelId) {
  return this.assignedHotels.some(h => getHotelId(h.hotel)?.toString() === hotelId.toString())
}

pmsUserSchema.methods.getRoleForHotel = function(hotelId) {
  const assignment = this.assignedHotels.find(h => getHotelId(h.hotel)?.toString() === hotelId.toString())
  return assignment ? assignment.role : null
}

pmsUserSchema.methods.getPermissionsForHotel = function(hotelId) {
  const assignment = this.assignedHotels.find(h => getHotelId(h.hotel)?.toString() === hotelId.toString())
  return assignment ? assignment.permissions : []
}

pmsUserSchema.methods.hasPermission = function(hotelId, permission) {
  const assignment = this.assignedHotels.find(h => getHotelId(h.hotel)?.toString() === hotelId.toString())
  if (!assignment) return false

  // Admin has all permissions
  if (assignment.role === 'pms_admin') return true

  return assignment.permissions.includes(permission)
}

pmsUserSchema.methods.updateLastLogin = async function(hotelId, ip, userAgent) {
  this.lastLogin = new Date()
  this.lastHotel = hotelId

  // Add to login history (keep last 50)
  this.loginHistory.unshift({
    timestamp: new Date(),
    ip,
    userAgent,
    hotel: hotelId
  })

  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(0, 50)
  }

  return await this.save()
}

// Statics
pmsUserSchema.statics.findByUsername = function(partnerId, username) {
  return this.findOne({
    partner: partnerId,
    username: username.toLowerCase()
  }).select('+password')
}

pmsUserSchema.statics.findByHotel = function(hotelId) {
  return this.find({
    'assignedHotels.hotel': hotelId,
    isActive: true
  })
}

pmsUserSchema.statics.findByPartner = function(partnerId) {
  return this.find({
    partner: partnerId
  })
}

// Default permissions by role
pmsUserSchema.statics.getDefaultPermissions = function(role) {
  const permissionsByRole = {
    pms_admin: ['*'], // All permissions
    front_desk_manager: [
      'dashboard.view',
      'reservations.view', 'reservations.create', 'reservations.edit', 'reservations.cancel',
      'frontdesk.checkin', 'frontdesk.checkout', 'frontdesk.walkin', 'frontdesk.roomMove',
      'housekeeping.view', 'housekeeping.assign',
      'guests.view', 'guests.edit',
      'billing.view', 'billing.addCharge', 'billing.payment', 'billing.invoice', 'billing.discount',
      'reports.operational', 'reports.financial'
    ],
    receptionist: [
      'dashboard.view',
      'reservations.view', 'reservations.create', 'reservations.edit',
      'frontdesk.checkin', 'frontdesk.checkout', 'frontdesk.walkin',
      'guests.view', 'guests.edit',
      'billing.view', 'billing.addCharge', 'billing.payment'
    ],
    night_auditor: [
      'dashboard.view',
      'reservations.view',
      'frontdesk.checkin', 'frontdesk.checkout',
      'billing.view', 'billing.addCharge', 'billing.payment', 'billing.invoice',
      'reports.operational', 'reports.financial', 'reports.export'
    ],
    housekeeping_supervisor: [
      'dashboard.view',
      'housekeeping.view', 'housekeeping.assign', 'housekeeping.updateStatus', 'housekeeping.maintenance',
      'reports.operational'
    ],
    housekeeper: [
      'dashboard.view',
      'housekeeping.view', 'housekeeping.updateStatus'
    ],
    revenue_manager: [
      'dashboard.view',
      'reservations.view',
      'reports.operational', 'reports.financial', 'reports.export'
    ],
    guest_relations: [
      'dashboard.view',
      'reservations.view',
      'guests.view', 'guests.edit',
      'billing.view'
    ]
  }

  return permissionsByRole[role] || []
}

// Ensure virtuals are included in JSON
pmsUserSchema.set('toJSON', { virtuals: true })
pmsUserSchema.set('toObject', { virtuals: true })

export default mongoose.model('PmsUser', pmsUserSchema)
