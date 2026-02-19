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

    // Partner Tipi
    partnerType: {
      type: String,
      enum: {
        values: ['hotel', 'agency'],
        message: 'INVALID_PARTNER_TYPE'
      },
      default: 'agency'
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
      // Admin panel theme preference (stored per partner)
      // NOTE: Used by apps/admin theme engine; safe to keep under branding for minimal churn
      adminTheme: {
        type: String,
        default: 'midnight-blue',
        trim: true
      },

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

    // Ödeme Ayarları
    paymentSettings: {
      usePlatformBankAccounts: {
        type: Boolean,
        default: true
      },
      useOwnPos: {
        type: Boolean,
        default: false
      },
      bankAccounts: [
        {
          bankCode: String,
          bankName: String,
          accountName: String,
          iban: { type: String, required: true },
          swift: String,
          currency: {
            type: String,
            default: 'TRY'
          },
          isActive: {
            type: Boolean,
            default: true
          }
        }
      ],
      bankTransferDescription: {
        type: Map,
        of: String,
        default: {}
      },
      bankTransferEnabled: {
        type: Boolean,
        default: false
      }
    },

    // PMS Entegrasyonu
    pmsIntegration: {
      enabled: {
        type: Boolean,
        default: false
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
    },

    // Subscription domain (v2 – package / service based, EUR-only)
    subscription: {
      // Overall subscription status
      status: {
        type: String,
        enum: ['trial', 'active', 'expired', 'grace_period', 'cancelled', 'suspended'],
        default: 'trial'
      },

      // Trial tracking
      trial: {
        startDate: { type: Date },
        endDate: { type: Date }, // startDate + 15 days
        used: { type: Boolean, default: false }
      },

      // Admin-set feature limits
      customLimits: {
        pmsMaxHotels: { type: Number, default: null },
        webDesignMaxSites: { type: Number, default: null }
      },

      // Purchase records – unified for package subscriptions AND standalone services
      purchases: [
        {
          // Purchase intent type
          type: {
            type: String,
            enum: ['package_subscription', 'service_purchase'],
            required: true
          },

          // Reference to the catalog entity
          package: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPackage' },
          service: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionService' },

          // Snapshot of name at purchase time (multi-lang)
          label: {
            tr: String,
            en: String
          },

          // Period
          period: {
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true }
          },

          // EUR-only pricing
          price: {
            amount: { type: Number, required: true },
            currency: { type: String, default: 'EUR', enum: ['EUR'] }
          },

          billingPeriod: {
            type: String,
            enum: ['monthly', 'yearly', 'one_time'],
            default: 'yearly'
          },

          // Payment info (empty while pending)
          payment: {
            date: Date,
            method: {
              type: String,
              enum: ['bank_transfer', 'credit_card', 'payment_link', 'cash', 'other'],
              default: 'bank_transfer'
            },
            reference: String,
            transactionId: String,
            notes: String
          },

          // Invoice
          invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubscriptionInvoice'
          },

          // Purchase status
          status: {
            type: String,
            enum: ['pending', 'active', 'expired', 'cancelled', 'refunded'],
            default: 'pending'
          },

          // Meta
          createdAt: { type: Date, default: Date.now },
          createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          cancelledAt: Date,
          cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          cancellationReason: String
        }
      ],

      // Admin notes
      notes: String
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

// ───────────────────── Trial helpers ─────────────────────

/**
 * Initialise 15-day trial for a newly approved partner.
 * Idempotent – does nothing if trial dates are already set.
 * One-time only – refuses if trial was already used.
 */
partnerSchema.methods.startTrial = function () {
  if (this.subscription?.trial?.used) return this
  if (this.subscription?.trial?.startDate) return this
  if (!this.subscription) this.subscription = { purchases: [] }
  const now = new Date()
  const end = new Date(now)
  end.setDate(end.getDate() + 15)
  this.subscription.trial = { startDate: now, endDate: end, used: true }
  this.subscription.status = 'trial'
  return this
}

partnerSchema.methods.hasUsedTrial = function () {
  return !!this.subscription?.trial?.used
}

partnerSchema.methods.isInTrial = function () {
  const t = this.subscription?.trial
  if (!t?.endDate) return false
  return new Date() <= new Date(t.endDate)
}

// ───────────────────── Purchase helpers ─────────────────────

/** Current active package subscription purchase (within period) */
partnerSchema.methods.getCurrentPackagePurchase = function () {
  if (!this.subscription?.purchases?.length) return null
  const now = new Date()
  return (
    this.subscription.purchases.find(
      p =>
        p.type === 'package_subscription' &&
        p.status === 'active' &&
        new Date(p.period.startDate) <= now &&
        new Date(p.period.endDate) >= now
    ) || null
  )
}

/** All active service purchases (within period) */
partnerSchema.methods.getActiveServicePurchases = function () {
  if (!this.subscription?.purchases?.length) return []
  const now = new Date()
  return this.subscription.purchases.filter(
    p =>
      p.type === 'service_purchase' &&
      p.status === 'active' &&
      new Date(p.period.startDate) <= now &&
      new Date(p.period.endDate) >= now
  )
}

/** Most-recent non-cancelled purchase (package or service) for grace-period fallback */
partnerSchema.methods.getCurrentPurchase = function () {
  const pkg = this.getCurrentPackagePurchase()
  if (pkg) return pkg

  if (!this.subscription?.purchases?.length) return null
  const sorted = [...this.subscription.purchases]
    .filter(p => !['cancelled', 'refunded'].includes(p.status))
    .sort((a, b) => new Date(b.period.endDate) - new Date(a.period.endDate))
  return sorted[0] || null
}

// ───────────────────── PMS / WebDesign helpers ─────────────────────

partnerSchema.methods.getPmsLimit = function () {
  return this.subscription?.customLimits?.pmsMaxHotels ?? 0
}

partnerSchema.methods.canProvisionMoreHotels = function () {
  const limit = this.getPmsLimit()
  return limit === -1 || limit > 0
}

partnerSchema.methods.isPmsEnabled = function () {
  const limit = this.getPmsLimit()
  return limit > 0 || limit === -1
}

partnerSchema.methods.getWebDesignLimit = function () {
  return this.subscription?.customLimits?.webDesignMaxSites ?? 0
}

partnerSchema.methods.isWebDesignEnabled = function () {
  const limit = this.getWebDesignLimit()
  return limit > 0 || limit === -1
}

// ───────────────────── Status calculation ─────────────────────

partnerSchema.methods.calculateSubscriptionStatus = function () {
  const sub = this.subscription
  if (sub?.status === 'cancelled') return 'cancelled'
  if (sub?.status === 'suspended') return 'suspended'

  // Trial check
  if (this.isInTrial()) return 'trial'

  const purchase = this.getCurrentPurchase()
  if (!purchase) return 'expired'

  const now = new Date()
  const endDate = new Date(purchase.period.endDate)

  if (now <= endDate) return 'active'

  // Yearly paid users get 3 extra overdue days (365 + 3)
  const isYearly = purchase.billingPeriod === 'yearly'
  const overdueDays = isYearly && purchase.status === 'active' ? 3 : 0
  const overdueEnd = new Date(endDate)
  overdueEnd.setDate(overdueEnd.getDate() + overdueDays)
  if (now <= overdueEnd) return 'active'

  // Grace period (15 days after end + overdue)
  const gracePeriodEnd = new Date(overdueEnd)
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 15)
  if (now <= gracePeriodEnd) return 'grace_period'

  return 'expired'
}

partnerSchema.methods.isSubscriptionActive = function () {
  const status = this.calculateSubscriptionStatus()
  return ['trial', 'active', 'grace_period'].includes(status)
}

partnerSchema.methods.canUsePms = async function () {
  const status = this.calculateSubscriptionStatus()
  if (['expired', 'suspended', 'cancelled'].includes(status)) return false
  return await this.isPmsEnabled()
}

partnerSchema.methods.canUseWebDesign = async function () {
  const status = this.calculateSubscriptionStatus()
  if (['expired', 'suspended', 'cancelled'].includes(status)) return false
  return await this.isWebDesignEnabled()
}

// ───────────────────── Remaining days ─────────────────────

partnerSchema.methods.getRemainingDays = function () {
  // Trial remaining
  if (this.isInTrial()) {
    const diff = new Date(this.subscription.trial.endDate) - new Date()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }
  const purchase = this.getCurrentPurchase()
  if (!purchase?.period?.endDate) return null
  const diff = new Date(purchase.period.endDate) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

partnerSchema.methods.getGracePeriodRemainingDays = function () {
  const status = this.calculateSubscriptionStatus()
  if (status !== 'grace_period') return null
  const purchase = this.getCurrentPurchase()
  if (!purchase?.period?.endDate) return null
  const endDate = new Date(purchase.period.endDate)
  const isYearly = purchase.billingPeriod === 'yearly'
  const overdueDays = isYearly && purchase.status === 'active' ? 3 : 0
  const overdueEnd = new Date(endDate)
  overdueEnd.setDate(overdueEnd.getDate() + overdueDays)
  const gracePeriodEnd = new Date(overdueEnd)
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 15)
  const diff = gracePeriodEnd - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/**
 * Returns info for subscription warning modals on the frontend.
 * Covers: trial mode, yearly renewal (last 15 days), grace period.
 */
partnerSchema.methods.getSubscriptionAlert = function () {
  const status = this.calculateSubscriptionStatus()

  // Trial mode: always show
  if (status === 'trial') {
    const remaining = this.getRemainingDays()
    return {
      type: 'trial',
      show: true,
      remainingDays: remaining,
      trialEndDate: this.subscription?.trial?.endDate
    }
  }

  // Grace period: always show
  if (status === 'grace_period') {
    return {
      type: 'grace_period',
      show: true,
      remainingDays: this.getGracePeriodRemainingDays()
    }
  }

  // Active yearly subscription within last 15 days: renewal warning
  if (status === 'active') {
    const purchase = this.getCurrentPurchase()
    if (purchase?.billingPeriod === 'yearly' && purchase?.period?.endDate) {
      const remaining = this.getRemainingDays()
      if (remaining !== null && remaining <= 15) {
        return {
          type: 'renewal_warning',
          show: true,
          remainingDays: remaining,
          endDate: purchase.period.endDate
        }
      }
    }
  }

  // Expired
  if (status === 'expired') {
    return { type: 'expired', show: true, remainingDays: 0 }
  }

  return { type: null, show: false }
}

partnerSchema.methods.getStatusLabel = function (status) {
  const labels = {
    trial: 'Deneme',
    active: 'Aktif',
    expired: 'Süresi Doldu',
    grace_period: 'Ek Süre',
    cancelled: 'İptal Edildi',
    suspended: 'Askıya Alındı'
  }
  return labels[status] || status
}

// ───────────────────── Full status summary ─────────────────────

partnerSchema.methods.getSubscriptionStatus = function () {
  const status = this.calculateSubscriptionStatus()
  const remainingDays = this.getRemainingDays()
  const gracePeriodRemainingDays = this.getGracePeriodRemainingDays()

  const currentPurchase = this.getCurrentPurchase()
  const pmsLimit = this.getPmsLimit()
  const webDesignLimit = this.getWebDesignLimit()

  let gracePeriodEndDate = null
  if (currentPurchase?.period?.endDate) {
    gracePeriodEndDate = new Date(currentPurchase.period.endDate)
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 15)
  }

  const sortedPurchases = [...(this.subscription?.purchases || [])].sort(
    (a, b) => new Date(b.period.startDate) - new Date(a.period.startDate)
  )

  const alert = this.getSubscriptionAlert()

  return {
    status,
    statusLabel: this.getStatusLabel(status),

    // Trial info
    trial: this.subscription?.trial || null,
    trialUsed: !!this.subscription?.trial?.used,

    // Alert for modals
    alert,

    // Current active purchase
    currentPurchase: currentPurchase
      ? {
          _id: currentPurchase._id,
          type: currentPurchase.type,
          package: currentPurchase.package,
          service: currentPurchase.service,
          label: currentPurchase.label,
          startDate: currentPurchase.period.startDate,
          endDate: currentPurchase.period.endDate,
          price: currentPurchase.price,
          billingPeriod: currentPurchase.billingPeriod,
          status: currentPurchase.status
        }
      : null,

    // All purchases
    purchases: sortedPurchases.map(p => ({
      _id: p._id,
      type: p.type,
      package: p.package,
      service: p.service,
      label: p.label,
      period: p.period,
      price: p.price,
      billingPeriod: p.billingPeriod,
      payment: p.payment,
      invoice: p.invoice,
      status: p.status,
      createdAt: p.createdAt
    })),

    // Custom limits (admin-set)
    customLimits: this.subscription?.customLimits,

    // PMS status (driven by customLimits)
    pmsStatus: {
      enabled: this.isPmsEnabled(),
      maxHotels: pmsLimit,
      maxHotelsDisplay: pmsLimit === -1 ? 'unlimited' : pmsLimit
    },

    // Web Design status (driven by customLimits)
    webDesignStatus: {
      enabled: this.isWebDesignEnabled(),
      maxSites: webDesignLimit,
      maxSitesDisplay: webDesignLimit === -1 ? 'unlimited' : webDesignLimit
    },

    // Dates
    startDate: currentPurchase?.period?.startDate,
    endDate: currentPurchase?.period?.endDate,
    gracePeriodEndDate,
    remainingDays,
    gracePeriodRemainingDays,

    notes: this.subscription?.notes
  }
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

  // Lowercase PMS domain
  if (this.branding?.pmsDomain) {
    this.branding.pmsDomain = this.branding.pmsDomain.toLowerCase()
  }

  next()
})

// NOTE: Welcome email is now sent when user completes activation (sets password)
// See user.service.js - activateAccount function
// This hook was removed because it was sending welcome email at wrong time
// (when admin approves, not when user activates their account)

// Audit plugin for tracking changes
partnerSchema.plugin(auditPlugin, {
  module: 'partner',
  nameField: 'companyName'
})

export default mongoose.model('Partner', partnerSchema)
