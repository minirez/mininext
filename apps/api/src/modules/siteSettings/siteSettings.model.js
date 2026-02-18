import mongoose from 'mongoose'

// All supported languages
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

const siteSettingsSchema = new mongoose.Schema(
  {
    // Partner reference
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true
    },

    // Setup - Domain Configuration
    setup: {
      b2cDomain: {
        type: String,
        trim: true
      },
      b2bDomain: {
        type: String,
        trim: true
      },
      pmsDomain: {
        type: String,
        trim: true
      },
      b2cSslStatus: {
        type: String,
        enum: ['pending', 'active', 'failed', 'none'],
        default: 'none'
      },
      b2bSslStatus: {
        type: String,
        enum: ['pending', 'active', 'failed', 'none'],
        default: 'none'
      },
      pmsSslStatus: {
        type: String,
        enum: ['pending', 'active', 'failed', 'none'],
        default: 'none'
      },
      b2cSslExpiresAt: Date,
      b2bSslExpiresAt: Date,
      pmsSslExpiresAt: Date
    },

    // General Settings
    general: {
      logo: {
        type: String // URL or path to logo
      },
      favicon: {
        type: String // URL or path to favicon
      },
      activeLanguages: [
        {
          type: String,
          enum: SUPPORTED_LANGUAGES
        }
      ],
      defaultLanguage: {
        type: String,
        enum: SUPPORTED_LANGUAGES,
        default: 'tr'
      },
      maintenanceMode: {
        type: Boolean,
        default: false
      },
      maintenanceMessage: {
        type: String,
        default: ''
      },
      // Dynamic language fields - supports all languages
      siteTitle: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      siteDescription: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      tursab: {
        photo: { type: String },
        link: { type: String, default: '' },
        documentNumber: { type: String, default: '' }
      }
    },

    // Homepage Settings
    homepage: {
      slider: [
        {
          image: String,
          title: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
          },
          subtitle: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
          },
          link: String,
          order: { type: Number, default: 0 },
          isActive: { type: Boolean, default: true }
        }
      ],
      activeServices: {
        hotel: { type: Boolean, default: true },
        tour: { type: Boolean, default: true },
        flight: { type: Boolean, default: false },
        transfer: { type: Boolean, default: true }
      }
    },

    // Contact Settings
    contact: {
      callCenter: {
        phone: String,
        workingHours: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        }
      },
      whatsapp: {
        number: String,
        isActive: { type: Boolean, default: false }
      },
      email: {
        info: String,
        support: String,
        reservation: String
      },
      address: {
        street: String,
        city: String,
        country: String,
        postalCode: String,
        fullAddress: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        }
      },
      socialMedia: {
        facebook: String,
        instagram: String,
        linkedin: String,
        twitter: String,
        youtube: String
      }
    },

    // Tracking & Analytics
    tracking: {
      googleAnalytics: {
        measurementId: String, // G-XXXXXXXXXX
        enabled: { type: Boolean, default: false }
      },
      googleTagManager: {
        containerId: String, // GTM-XXXXXXX
        enabled: { type: Boolean, default: false }
      },
      facebookPixel: {
        pixelId: String,
        enabled: { type: Boolean, default: false }
      },
      microsoftClarity: {
        projectId: String,
        enabled: { type: Boolean, default: false }
      },
      customScripts: {
        head: String, // Scripts to inject in <head>
        body: String // Scripts to inject at end of <body>
      }
    }
  },
  {
    timestamps: true
  }
)

// Unique index for partner - one settings per partner
siteSettingsSchema.index({ partner: 1 }, { unique: true })

// Static method to get or create settings for a partner
siteSettingsSchema.statics.getOrCreateForPartner = async function (partnerId) {
  let settings = await this.findOne({ partner: partnerId })

  if (!settings) {
    settings = await this.create({
      partner: partnerId,
      general: {
        activeLanguages: ['tr', 'en'],
        defaultLanguage: 'tr'
      }
    })
  }

  return settings
}

// Export supported languages for use in other modules
export { SUPPORTED_LANGUAGES }
export default mongoose.model('SiteSettings', siteSettingsSchema)
