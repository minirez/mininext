import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import auditPlugin from '#plugins/auditPlugin.js'

const userSchema = new mongoose.Schema(
  {
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
      refPath: 'accountModelName'
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

    // Avatar
    avatar: {
      filename: String,
      url: String,
      uploadedAt: Date
    },

    // Authentication
    password: {
      type: String,
      minlength: [8, 'PASSWORD_MIN_LENGTH'],
      validate: {
        validator: function (password) {
          // Skip validation if no password (pending user)
          if (!password) return true
          // Skip validation for hashed passwords (already saved)
          if (password.startsWith('$2a$') || password.startsWith('$2b$')) {
            return true
          }
          // Require: uppercase, lowercase, number (special char optional)
          const hasUppercase = /[A-Z]/.test(password)
          const hasLowercase = /[a-z]/.test(password)
          const hasNumber = /[0-9]/.test(password)
          return hasUppercase && hasLowercase && hasNumber
        },
        message: 'PASSWORD_COMPLEXITY_REQUIRED'
      },
      select: false
    },

    // Account Activation (for new users)
    activationToken: {
      type: String,
      select: false
    },

    activationTokenExpires: {
      type: Date,
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

    // Password Reset
    passwordResetToken: {
      type: String,
      select: false
    },

    passwordResetExpires: {
      type: Date,
      select: false
    },

    // Track when password was last changed (for token invalidation)
    passwordChangedAt: {
      type: Date
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

    // Modül bazlı izinler
    permissions: [
      {
        module: {
          type: String,
          enum: [
            'dashboard',
            'planning',
            'booking',
            'reports',
            'settings',
            'users',
            'agencies',
            'hotels',
            'pms'
          ]
        },
        actions: {
          view: { type: Boolean, default: false },
          create: { type: Boolean, default: false },
          edit: { type: Boolean, default: false },
          delete: { type: Boolean, default: false }
        }
      }
    ],

    // Davet bilgileri
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    inviteAcceptedAt: Date,

    // Durum
    status: {
      type: String,
      enum: {
        values: ['pending', 'pending_activation', 'active', 'inactive'],
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
  },
  {
    timestamps: true
  }
)

// Compound Index (accountId + email unique)
// Aynı email farklı partner/agency'de olabilir
userSchema.index({ accountId: 1, email: 1 }, { unique: true })
userSchema.index({ accountType: 1, accountId: 1 })
userSchema.index({ email: 1 })

// Virtual: Model name for dynamic population (converts 'partner' -> 'Partner')
userSchema.virtual('accountModelName').get(function () {
  const modelMap = {
    platform: 'PlatformSettings',
    partner: 'Partner',
    agency: 'Agency'
  }
  return modelMap[this.accountType] || 'Partner'
})

// Pre-save: Hash password and track password change
userSchema.pre('save', async function (next) {
  // Lowercase email
  if (this.email) {
    this.email = this.email.toLowerCase()
  }

  // Hash password only if modified
  if (!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 10)

  // Track password change time (for invalidating existing tokens)
  // Only set if this is not a new document (password change, not initial set)
  if (!this.isNew) {
    this.passwordChangedAt = new Date()
  }

  next()
})

// Methods
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.isAdmin = function () {
  return this.role === 'admin'
}

// Check specific permission
userSchema.methods.hasPermission = function (module, action) {
  // Admins have all permissions
  if (this.role === 'admin') return true

  // Check specific permission
  const permission = this.permissions?.find(p => p.module === module)
  if (!permission) return false

  return permission.actions?.[action] === true
}

// Get all effective permissions (for UI)
userSchema.methods.getEffectivePermissions = function () {
  const modules = [
    'dashboard',
    'planning',
    'booking',
    'reports',
    'settings',
    'payment-link',
    'users',
    'agencies',
    'hotels',
    'pms'
  ]

  // Admin has all permissions
  if (this.role === 'admin') {
    return modules.map(module => ({
      module,
      actions: { view: true, create: true, edit: true, delete: true }
    }))
  }

  // Return user's permissions, filling in missing modules with defaults
  return modules.map(module => {
    const existing = this.permissions?.find(p => p.module === module)
    return {
      module,
      actions: existing?.actions || { view: false, create: false, edit: false, delete: false }
    }
  })
}

userSchema.methods.isActive = function () {
  return this.status === 'active'
}

// Check if password was changed after the token was issued
userSchema.methods.changedPasswordAfter = function (tokenIssuedAt) {
  if (this.passwordChangedAt) {
    // Convert to seconds for comparison with JWT iat
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
    return tokenIssuedAt < changedTimestamp
  }
  return false
}

userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date()
  this.isOnline = true
  return await this.save()
}

userSchema.methods.setOffline = async function () {
  this.isOnline = false
  return await this.save()
}

// Generate activation token (for new users to set password)
userSchema.methods.generateActivationToken = function () {
  // Generate random token
  const token = crypto.randomBytes(32).toString('hex')

  // Hash token and store
  this.activationToken = crypto.createHash('sha256').update(token).digest('hex')

  // Token expires in 7 days
  this.activationTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000

  // Return unhashed token (to be sent via email)
  return token
}

// Clear activation token
userSchema.methods.clearActivationToken = function () {
  this.activationToken = undefined
  this.activationTokenExpires = undefined
}

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex')

  // Hash token and store
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

  // Token expires in 1 hour
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000

  // Return unhashed token (to be sent via email)
  return resetToken
}

// Clear password reset token
userSchema.methods.clearPasswordResetToken = function () {
  this.passwordResetToken = undefined
  this.passwordResetExpires = undefined
}

// Statics
userSchema.statics.findByEmail = function (accountId, email) {
  return this.findOne({
    accountId,
    email: email.toLowerCase()
  }).select('+password')
}

userSchema.statics.findByAccountType = function (accountType) {
  return this.find({ accountType })
}

userSchema.statics.findActive = function () {
  return this.find({ status: 'active' })
}

userSchema.statics.findOnline = function () {
  return this.find({ isOnline: true })
}

// Audit plugin for tracking changes
userSchema.plugin(auditPlugin, {
  module: 'user',
  nameField: 'email'
})

export default mongoose.model('User', userSchema)
