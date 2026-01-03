import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import auditPlugin from '../../plugins/auditPlugin.js'

const userSchema = new mongoose.Schema({
  // Hangi account'a ait
  accountType: {
    type: String,
    enum: {
      values: ['platform', 'partner', 'agency'],
      message: 'INVALID_ACCOUNT_TYPE'
    },
    required: [true, 'REQUIRED_ACCOUNT_TYPE']
  },

  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'REQUIRED_ACCOUNT_ID'],
    refPath: 'accountType'
  },

  // Kimlik Bilgileri
  name: {
    type: String,
    required: [true, 'REQUIRED_NAME'],
    trim: true,
    minlength: [2, 'NAME_MIN_LENGTH'],
    maxlength: [100, 'NAME_MAX_LENGTH']
  },

  email: {
    type: String,
    required: [true, 'REQUIRED_EMAIL'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'INVALID_EMAIL']
  },

  phone: String,

  // Authentication
  password: {
    type: String,
    required: [true, 'REQUIRED_PASSWORD'],
    minlength: [6, 'PASSWORD_MIN_LENGTH'],
    select: false
  },

  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },

  twoFactorSecret: {
    type: String,
    select: false
  },

  // Force password change on first login
  forcePasswordChange: {
    type: Boolean,
    default: false
  },

  // Yetki
  role: {
    type: String,
    enum: {
      values: ['admin', 'user'],
      message: 'INVALID_ROLE'
    },
    default: 'user'
  },

  // Durum
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: 'INVALID_STATUS'
    },
    default: 'active'
  },

  // Session
  isOnline: {
    type: Boolean,
    default: false
  },

  lastLogin: Date,

  // Dil Tercihi
  language: {
    type: String,
    default: 'tr',
    enum: {
      values: ['tr', 'en', 'de', 'ru', 'ar'],
      message: 'INVALID_LANGUAGE'
    }
  },

  // Bildirim Tercihleri
  notificationPreferences: {
    email: {
      bookingConfirmation: { type: Boolean, default: true },
      bookingCancellation: { type: Boolean, default: true },
      bookingReminder: { type: Boolean, default: true },
      paymentReminder: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
      systemUpdates: { type: Boolean, default: true }
    },
    sms: {
      bookingConfirmation: { type: Boolean, default: true },
      bookingCancellation: { type: Boolean, default: true },
      bookingReminder: { type: Boolean, default: false },
      paymentReminder: { type: Boolean, default: false }
    },
    push: {
      bookingConfirmation: { type: Boolean, default: true },
      bookingCancellation: { type: Boolean, default: true },
      bookingReminder: { type: Boolean, default: true },
      paymentReminder: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: true }
    }
  }

}, {
  timestamps: true
})

// Compound Index (accountId + email unique)
// Aynı email farklı partner/agency'de olabilir
userSchema.index({ accountId: 1, email: 1 }, { unique: true })
userSchema.index({ accountType: 1, accountId: 1 })
userSchema.index({ email: 1 })

// Pre-save: Hash password
userSchema.pre('save', async function(next) {
  // Lowercase email
  if (this.email) {
    this.email = this.email.toLowerCase()
  }

  // Hash password only if modified
  if (!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.isAdmin = function() {
  return this.role === 'admin'
}

userSchema.methods.isActive = function() {
  return this.status === 'active'
}

userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date()
  this.isOnline = true
  return await this.save()
}

userSchema.methods.setOffline = async function() {
  this.isOnline = false
  return await this.save()
}

// Statics
userSchema.statics.findByEmail = function(accountId, email) {
  return this.findOne({
    accountId,
    email: email.toLowerCase()
  }).select('+password')
}

userSchema.statics.findByAccountType = function(accountType) {
  return this.find({ accountType })
}

userSchema.statics.findActive = function() {
  return this.find({ status: 'active' })
}

userSchema.statics.findOnline = function() {
  return this.find({ isOnline: true })
}

// Audit plugin for tracking changes
userSchema.plugin(auditPlugin, {
  module: 'user',
  nameField: 'email'
})

export default mongoose.model('User', userSchema)
