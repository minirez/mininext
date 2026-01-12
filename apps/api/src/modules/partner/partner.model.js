import mongoose from 'mongoose'
import auditPlugin from '#plugins/auditPlugin.js'
import { encrypt, decrypt, isEncrypted } from '#helpers/encryption.js'

const partnerSchema = new mongoose.Schema(
  {
    // Durum
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'pending'],
        message: 'INVALID_STATUS'
      },
      default: 'pending'
    },

    // Partner Kodu (PMS girişi için)
    code: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'CODE_MIN_LENGTH'],
      maxlength: [20, 'CODE_MAX_LENGTH'],
      match: [/^[A-Z0-9_-]+$/, 'INVALID_CODE_FORMAT']
    },

    // Şirket Bilgileri
    companyName: {
      type: String,
      required: [true, 'REQUIRED_COMPANY_NAME'],
      trim: true,
      minlength: [2, 'COMPANY_NAME_MIN_LENGTH'],
      maxlength: [200, 'COMPANY_NAME_MAX_LENGTH']
    },

    // Ticari İsim (resmi şirket unvanı)
    tradeName: {
      type: String,
      trim: true,
      maxlength: [300, 'TRADE_NAME_MAX_LENGTH']
    },

    email: {
      type: String,
      required: [true, 'REQUIRED_EMAIL'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'INVALID_EMAIL']
    },

    phone: {
      type: String,
      trim: true
    },

    // Vergi Bilgileri
    taxOffice: {
      type: String,
      trim: true
    },

    taxNumber: {
      type: String,
      trim: true
    },

    // Adres
    address: {
      street: String,
      city: String,
      country: String,
      postalCode: String
    },

    // Belgeler
    documents: [
      {
        type: {
          type: String,
          enum: ['license', 'certificate', 'other'],
          required: true
        },
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // Branding
    branding: {
      logo: String,
      favicon: String,

      // B2C Site Domain (Müşterilerin rezervasyon yaptığı site)
      siteDomain: {
        type: String,
        lowercase: true,
        trim: true
      },

      // B2B Extranet Domain (Acentelerin giriş yaptığı platform)
      extranetDomain: {
        type: String,
        lowercase: true,
        trim: true
      },

      // PMS Domain (Otel personelinin giriş yaptığı platform)
      pmsDomain: {
        type: String,
        lowercase: true,
        trim: true
      }
    },

    // Para Birimi
    currency: {
      type: String,
      default: 'TRY',
      uppercase: true,
      enum: {
        values: ['TRY', 'USD', 'EUR', 'GBP'],
        message: 'INVALID_CURRENCY'
      }
    },

    // Markup/Komisyon (Yüzde)
    markup: {
      hotel: {
        type: Number,
        default: 0,
        min: [0, 'MARKUP_MIN_ZERO'],
        max: [100, 'MARKUP_MAX_HUNDRED']
      },
      tour: {
        type: Number,
        default: 0,
        min: [0, 'MARKUP_MIN_ZERO'],
        max: [100, 'MARKUP_MAX_HUNDRED']
      },
      transfer: {
        type: Number,
        default: 0,
        min: [0, 'MARKUP_MIN_ZERO'],
        max: [100, 'MARKUP_MAX_HUNDRED']
      }
    },

    // İstatistikler
    stats: {
      totalAgencies: { type: Number, default: 0 },
      totalBookings: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 }
    },

    // Bildirim Ayarları
    notifications: {
      // Email Ayarları
      email: {
        // Partner kendi AWS SES hesabını kullanacak mı?
        useOwnSES: {
          type: Boolean,
          default: false
        },
        // Partner'ın AWS SES bilgileri
        aws: {
          region: {
            type: String,
            default: 'eu-west-1'
          },
          accessKeyId: {
            type: String
          },
          secretAccessKey: {
            type: String
          },
          fromEmail: {
            type: String,
            lowercase: true,
            trim: true
          },
          fromName: {
            type: String,
            trim: true
          }
        },
        // Domain doğrulama durumu
        domainVerification: {
          domain: {
            type: String,
            lowercase: true,
            trim: true
          },
          status: {
            type: String,
            enum: ['none', 'pending', 'verified', 'failed'],
            default: 'none'
          },
          dkimTokens: [
            {
              type: String
            }
          ],
          verificationToken: {
            type: String
          },
          lastCheckedAt: {
            type: Date
          },
          verifiedAt: {
            type: Date
          }
        }
      },
      // SMS Ayarları
      sms: {
        enabled: {
          type: Boolean,
          default: true
        },
        // Hangi provider kullanılacak
        provider: {
          type: String,
          enum: ['platform', 'netgsm', 'iletimerkezi', 'twilio', 'vonage'],
          default: 'platform' // Platform ayarlarını kullan
        },
        // Provider-specific config (encrypted where needed)
        config: {
          // NetGSM
          usercode: { type: String },
          password: { type: String },
          msgheader: { type: String },
          // İleti Merkezi
          apiKey: { type: String },
          apiHash: { type: String },
          sender: { type: String },
          // Twilio
          accountSid: { type: String },
          authToken: { type: String },
          // Vonage
          apiSecret: { type: String },
          // Common
          fromNumber: { type: String }
        }
      },
      // Push Notification Ayarları
      push: {
        enabled: {
          type: Boolean,
          default: true
        }
      }
    },

    // PMS Entegrasyonu
    pmsIntegration: {
      // PMS hizmeti aktif mi?
      enabled: {
        type: Boolean,
        default: false
      },
      // API yapılandırması
      apiSettings: {
        // PMS sistemine erişim için API key (şifreli)
        apiKey: {
          type: String
        },
        // HMAC imza için shared secret (şifreli)
        sharedSecret: {
          type: String
        },
        // PMS API URL
        apiUrl: {
          type: String,
          default: 'https://pms.example.com/api'
        }
      },
      // Provisioning durumu
      provisioningStatus: {
        type: String,
        enum: ['none', 'pending', 'completed', 'failed'],
        default: 'none'
      },
      // PMS'e aktarılan oteller
      provisionedHotels: [
        {
          hotelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hotel'
          },
          pmsHotelId: String, // PMS sistemindeki ID
          provisionedAt: Date,
          status: {
            type: String,
            enum: ['pending', 'active', 'failed'],
            default: 'pending'
          },
          lastError: String
        }
      ],
      // Son sync tarihi
      lastSyncAt: Date,
      // Son hata
      lastError: {
        message: String,
        timestamp: Date,
        jobId: String
      }
    },

    // Güvenlik Ayarları
    securitySettings: {
      // 2FA zorunlu mu?
      require2FA: {
        type: Boolean,
        default: false
      },
      // Şifre politikası
      passwordPolicy: {
        minLength: {
          type: Number,
          default: 12,
          min: 8,
          max: 128
        },
        requireUppercase: {
          type: Boolean,
          default: true
        },
        requireLowercase: {
          type: Boolean,
          default: true
        },
        requireNumbers: {
          type: Boolean,
          default: true
        },
        requireSpecialChars: {
          type: Boolean,
          default: true
        },
        // Şifre geçerlilik süresi (gün, 0 = sınırsız)
        expiryDays: {
          type: Number,
          default: 0
        }
      },
      // Oturum ayarları
      sessionSettings: {
        // Maksimum eşzamanlı oturum sayısı (0 = sınırsız)
        maxConcurrentSessions: {
          type: Number,
          default: 0
        },
        // Oturum zaman aşımı (dakika, 0 = sınırsız)
        sessionTimeout: {
          type: Number,
          default: 0
        },
        // Hareketsizlik sonrası çıkış (dakika, 0 = devre dışı)
        inactivityTimeout: {
          type: Number,
          default: 0
        }
      }
    }
  },
  {
    timestamps: true
  }
)

// Indexes
partnerSchema.index({ status: 1 })
partnerSchema.index({ email: 1 }, { unique: true })
partnerSchema.index({ 'branding.siteDomain': 1 }, { unique: true, sparse: true })
partnerSchema.index({ 'branding.extranetDomain': 1 }, { unique: true, sparse: true })
partnerSchema.index({ 'branding.pmsDomain': 1 }, { unique: true, sparse: true })

// Virtual - Partner'ın acenteleri
partnerSchema.virtual('agencies', {
  ref: 'Agency',
  localField: '_id',
  foreignField: 'partner'
})

// Methods
partnerSchema.methods.isActive = function () {
  return this.status === 'active'
}

partnerSchema.methods.activate = async function () {
  this.status = 'active'
  return await this.save()
}

partnerSchema.methods.deactivate = async function () {
  this.status = 'inactive'
  return await this.save()
}

// Get decrypted SMS credentials
partnerSchema.methods.getSMSCredentials = function () {
  const sms = this.notifications?.sms
  if (!sms || sms.provider === 'platform' || !sms.enabled) {
    return null
  }

  try {
    const config = sms.config || {}
    const decryptedConfig = {}

    // Decrypt sensitive fields based on provider
    switch (sms.provider) {
      case 'netgsm':
        decryptedConfig.usercode = config.usercode ? decrypt(config.usercode) : null
        decryptedConfig.password = config.password ? decrypt(config.password) : null
        decryptedConfig.msgheader = config.msgheader || null
        break
      case 'iletimerkezi':
        decryptedConfig.apiKey = config.apiKey ? decrypt(config.apiKey) : null
        decryptedConfig.apiHash = config.apiHash ? decrypt(config.apiHash) : null
        decryptedConfig.sender = config.sender || null
        break
      case 'twilio':
        decryptedConfig.accountSid = config.accountSid ? decrypt(config.accountSid) : null
        decryptedConfig.authToken = config.authToken ? decrypt(config.authToken) : null
        decryptedConfig.fromNumber = config.fromNumber || null
        break
      case 'vonage':
        decryptedConfig.apiKey = config.apiKey ? decrypt(config.apiKey) : null
        decryptedConfig.apiSecret = config.apiSecret ? decrypt(config.apiSecret) : null
        decryptedConfig.fromNumber = config.fromNumber || null
        break
    }

    return {
      provider: sms.provider,
      ...decryptedConfig
    }
  } catch (error) {
    return null
  }
}

// Generate PMS API credentials
partnerSchema.methods.generatePmsCredentials = async function () {
  const crypto = await import('crypto')

  const apiKey = crypto.randomBytes(32).toString('hex')
  const sharedSecret = crypto.randomBytes(32).toString('hex')

  // Initialize pmsIntegration if not exists
  if (!this.pmsIntegration) {
    this.pmsIntegration = {}
  }
  if (!this.pmsIntegration.apiSettings) {
    this.pmsIntegration.apiSettings = {}
  }

  // Encrypt and store credentials
  this.pmsIntegration.apiSettings.apiKey = encrypt(apiKey)
  this.pmsIntegration.apiSettings.sharedSecret = encrypt(sharedSecret)

  await this.save()

  // Return unencrypted for one-time display
  return { apiKey, sharedSecret }
}

// Get decrypted PMS credentials
partnerSchema.methods.getPmsCredentials = function () {
  if (!this.pmsIntegration?.apiSettings?.apiKey) {
    return null
  }

  try {
    return {
      apiKey: decrypt(this.pmsIntegration.apiSettings.apiKey),
      sharedSecret: decrypt(this.pmsIntegration.apiSettings.sharedSecret),
      apiUrl: this.pmsIntegration.apiSettings.apiUrl
    }
  } catch (error) {
    return null
  }
}

// Check if hotel is provisioned to PMS
partnerSchema.methods.isHotelProvisioned = function (hotelId) {
  const hotel = this.pmsIntegration?.provisionedHotels?.find(
    h => h.hotelId?.toString() === hotelId?.toString()
  )
  return hotel?.status === 'active'
}

// Update hotel provisioning status
partnerSchema.methods.updateHotelProvisioningStatus = async function (hotelId, status, pmsHotelId = null, error = null) {
  if (!this.pmsIntegration) {
    this.pmsIntegration = { provisionedHotels: [] }
  }
  if (!this.pmsIntegration.provisionedHotels) {
    this.pmsIntegration.provisionedHotels = []
  }

  const hotelIndex = this.pmsIntegration.provisionedHotels.findIndex(
    h => h.hotelId?.toString() === hotelId?.toString()
  )

  const updateData = {
    hotelId,
    status,
    provisionedAt: status === 'active' ? new Date() : undefined,
    pmsHotelId: pmsHotelId || undefined,
    lastError: error || undefined
  }

  if (hotelIndex >= 0) {
    this.pmsIntegration.provisionedHotels[hotelIndex] = {
      ...this.pmsIntegration.provisionedHotels[hotelIndex],
      ...updateData
    }
  } else {
    this.pmsIntegration.provisionedHotels.push(updateData)
  }

  // Update overall status
  const allActive = this.pmsIntegration.provisionedHotels.every(h => h.status === 'active')
  const anyFailed = this.pmsIntegration.provisionedHotels.some(h => h.status === 'failed')

  if (allActive && this.pmsIntegration.provisionedHotels.length > 0) {
    this.pmsIntegration.provisioningStatus = 'completed'
  } else if (anyFailed) {
    this.pmsIntegration.provisioningStatus = 'failed'
  }

  await this.save()
}

// Get decrypted email credentials
partnerSchema.methods.getEmailCredentials = function () {
  if (!this.notifications?.email?.useOwnSES) {
    return null
  }

  const email = this.notifications.email
  if (!email.aws?.accessKeyId || !email.aws?.secretAccessKey) {
    return null
  }

  try {
    return {
      region: email.aws.region || 'eu-west-1',
      accessKeyId: decrypt(email.aws.accessKeyId),
      secretAccessKey: decrypt(email.aws.secretAccessKey),
      fromEmail: email.aws.fromEmail,
      fromName: email.aws.fromName || this.companyName
    }
  } catch (error) {
    return null
  }
}

// Statics
partnerSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() })
}

partnerSchema.statics.findBySiteDomain = function (domain) {
  return this.findOne({ 'branding.siteDomain': domain.toLowerCase() })
}

partnerSchema.statics.findByExtranetDomain = function (domain) {
  return this.findOne({ 'branding.extranetDomain': domain.toLowerCase() })
}

partnerSchema.statics.findByPmsDomain = function (domain) {
  return this.findOne({ 'branding.pmsDomain': domain.toLowerCase() })
}

partnerSchema.statics.findActive = function () {
  return this.find({ status: 'active' })
}

// Pre-save middleware
partnerSchema.pre('save', function (next) {
  // Track previous status for post-save hook
  if (this.isModified('status')) {
    this._previousStatus = this.constructor.findOne({ _id: this._id }).then(doc => doc?.status)
  }

  // Lowercase email and domains
  if (this.email) {
    this.email = this.email.toLowerCase()
  }
  if (this.branding?.siteDomain) {
    this.branding.siteDomain = this.branding.siteDomain.toLowerCase()
  }
  if (this.branding?.extranetDomain) {
    this.branding.extranetDomain = this.branding.extranetDomain.toLowerCase()
  }

  // Encrypt AWS credentials if changed
  if (this.isModified('notifications.email.aws.accessKeyId')) {
    const accessKeyId = this.notifications?.email?.aws?.accessKeyId
    if (accessKeyId && !isEncrypted(accessKeyId)) {
      this.notifications.email.aws.accessKeyId = encrypt(accessKeyId)
    }
  }
  if (this.isModified('notifications.email.aws.secretAccessKey')) {
    const secretAccessKey = this.notifications?.email?.aws?.secretAccessKey
    if (secretAccessKey && !isEncrypted(secretAccessKey)) {
      this.notifications.email.aws.secretAccessKey = encrypt(secretAccessKey)
    }
  }

  // Encrypt SMS credentials if changed
  const smsConfig = this.notifications?.sms?.config
  if (smsConfig) {
    // Encrypt sensitive SMS fields
    const sensitiveFields = [
      'password',
      'apiKey',
      'apiHash',
      'authToken',
      'apiSecret',
      'accountSid',
      'usercode'
    ]
    for (const field of sensitiveFields) {
      if (this.isModified(`notifications.sms.config.${field}`)) {
        const value = smsConfig[field]
        if (value && !isEncrypted(value)) {
          this.notifications.sms.config[field] = encrypt(value)
        }
      }
    }
  }

  // Encrypt PMS credentials if changed
  if (this.isModified('pmsIntegration.apiSettings.apiKey')) {
    const apiKey = this.pmsIntegration?.apiSettings?.apiKey
    if (apiKey && !isEncrypted(apiKey)) {
      this.pmsIntegration.apiSettings.apiKey = encrypt(apiKey)
    }
  }
  if (this.isModified('pmsIntegration.apiSettings.sharedSecret')) {
    const sharedSecret = this.pmsIntegration?.apiSettings?.sharedSecret
    if (sharedSecret && !isEncrypted(sharedSecret)) {
      this.pmsIntegration.apiSettings.sharedSecret = encrypt(sharedSecret)
    }
  }

  // Lowercase PMS domain
  if (this.branding?.pmsDomain) {
    this.branding.pmsDomain = this.branding.pmsDomain.toLowerCase()
  }

  next()
})

// Post-save middleware - Send email when partner is activated
partnerSchema.post('save', async function (doc) {
  // Check if status changed to active (from any other status, typically pending)
  if (doc.status === 'active' && doc._previousStatus) {
    const previousStatus = await doc._previousStatus
    if (previousStatus && previousStatus !== 'active') {
      try {
        // Get partner admin user
        const User = mongoose.model('User')
        const adminUser = await User.findOne({
          accountType: 'partner',
          accountId: doc._id,
          role: 'admin'
        })

        if (adminUser) {
          // Import mail helper
          const { sendWelcomeEmail } = await import('../../helpers/mail.js')
          const logger = await import('../../core/logger.js')

          // Send activation email
          await sendWelcomeEmail({
            to: adminUser.email,
            name: adminUser.name,
            email: adminUser.email,
            password: '(Please use your registration password)', // Don't send password again
            accountType: 'Partner',
            loginUrl: doc.branding?.siteDomain
              ? `https://${doc.branding.siteDomain}/login`
              : 'https://admin.booking-engine.com/login'
          })

          logger.default.info(`Partner approval email sent to: ${adminUser.email}`)
        }
      } catch (error) {
        // Import logger
        const logger = await import('../../core/logger.js')
        logger.default.error(`Failed to send partner approval email: ${error.message}`)
      }
    }
  }
})

// Audit plugin for tracking changes
partnerSchema.plugin(auditPlugin, {
  module: 'partner',
  nameField: 'companyName'
})

export default mongoose.model('Partner', partnerSchema)
