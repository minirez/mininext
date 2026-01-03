import mongoose from 'mongoose'
import { encrypt, decrypt, isEncrypted } from '../../helpers/encryption.js'

const platformSettingsSchema = new mongoose.Schema({
  // Singleton pattern - single document with fixed _id
  _id: {
    type: String,
    default: 'platform'
  },

  // AWS SES Configuration (Platform Default)
  aws: {
    ses: {
      enabled: {
        type: Boolean,
        default: false
      },
      region: {
        type: String,
        default: 'eu-west-1',
        enum: ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1']
      },
      accessKeyId: {
        type: String,
        set: function(val) {
          if (!val) return val
          return isEncrypted(val) ? val : encrypt(val)
        }
      },
      secretAccessKey: {
        type: String,
        set: function(val) {
          if (!val) return val
          return isEncrypted(val) ? val : encrypt(val)
        }
      },
      fromEmail: {
        type: String,
        lowercase: true,
        trim: true
      },
      fromName: {
        type: String,
        default: 'Booking Platform',
        trim: true
      }
    }
  },

  // NetGSM SMS Configuration
  netgsm: {
    enabled: {
      type: Boolean,
      default: false
    },
    usercode: {
      type: String,
      set: function(val) {
        if (!val) return val
        return isEncrypted(val) ? val : encrypt(val)
      }
    },
    password: {
      type: String,
      set: function(val) {
        if (!val) return val
        return isEncrypted(val) ? val : encrypt(val)
      }
    },
    msgheader: {
      type: String,
      trim: true,
      maxlength: 11 // NetGSM sender ID limit
    },
    apiUrl: {
      type: String,
      default: 'https://api.netgsm.com.tr/sms/send/get'
    }
  },

  // Web Push (VAPID) Configuration
  webPush: {
    enabled: {
      type: Boolean,
      default: false
    },
    publicKey: {
      type: String
    },
    privateKey: {
      type: String,
      set: function(val) {
        if (!val) return val
        return isEncrypted(val) ? val : encrypt(val)
      }
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true
    }
  },

  // Gemini AI Configuration (for translations)
  gemini: {
    enabled: {
      type: Boolean,
      default: false
    },
    apiKey: {
      type: String,
      set: function(val) {
        if (!val) return val
        return isEncrypted(val) ? val : encrypt(val)
      }
    }
  },

  // Firecrawl Web Scraping Configuration
  firecrawl: {
    enabled: {
      type: Boolean,
      default: false
    },
    apiKey: {
      type: String,
      set: function(val) {
        if (!val) return val
        return isEncrypted(val) ? val : encrypt(val)
      }
    }
  },

  // Paximum OTA Integration
  paximum: {
    enabled: {
      type: Boolean,
      default: false
    },
    endpoint: {
      type: String,
      default: 'https://service.paximum.com/v2',
      trim: true
    },
    agency: {
      type: String,
      set: function(val) {
        if (!val) return val
        return isEncrypted(val) ? val : encrypt(val)
      }
    },
    user: {
      type: String,
      set: function(val) {
        if (!val) return val
        return isEncrypted(val) ? val : encrypt(val)
      }
    },
    password: {
      type: String,
      set: function(val) {
        if (!val) return val
        return isEncrypted(val) ? val : encrypt(val)
      }
    },
    // Token cache - updated automatically by service
    token: {
      type: String
    },
    tokenExpiresOn: {
      type: Date
    },
    // Default markup percentage for Paximum hotels
    defaultMarkup: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    }
  }

}, {
  timestamps: true,
  collection: 'platform_settings'
})

// Static method to get settings (creates if not exists)
platformSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findById('platform')

  if (!settings) {
    settings = await this.create({ _id: 'platform' })
  }

  return settings
}

// Instance method to get decrypted AWS credentials
platformSettingsSchema.methods.getAWSCredentials = function() {
  if (!this.aws?.ses?.enabled) {
    return null
  }

  return {
    region: this.aws.ses.region,
    accessKeyId: this.aws.ses.accessKeyId ? decrypt(this.aws.ses.accessKeyId) : null,
    secretAccessKey: this.aws.ses.secretAccessKey ? decrypt(this.aws.ses.secretAccessKey) : null,
    fromEmail: this.aws.ses.fromEmail,
    fromName: this.aws.ses.fromName
  }
}

// Instance method to get decrypted NetGSM credentials
platformSettingsSchema.methods.getNetGSMCredentials = function() {
  if (!this.netgsm?.enabled) {
    return null
  }

  return {
    usercode: this.netgsm.usercode ? decrypt(this.netgsm.usercode) : null,
    password: this.netgsm.password ? decrypt(this.netgsm.password) : null,
    msgheader: this.netgsm.msgheader,
    apiUrl: this.netgsm.apiUrl
  }
}

// Instance method to get decrypted VAPID keys
platformSettingsSchema.methods.getVAPIDKeys = function() {
  if (!this.webPush?.enabled) {
    return null
  }

  return {
    publicKey: this.webPush.publicKey,
    privateKey: this.webPush.privateKey ? decrypt(this.webPush.privateKey) : null,
    contactEmail: this.webPush.contactEmail
  }
}

// Instance method to get decrypted Gemini API key
platformSettingsSchema.methods.getGeminiCredentials = function() {
  if (!this.gemini?.enabled) {
    return null
  }

  return {
    apiKey: this.gemini.apiKey ? decrypt(this.gemini.apiKey) : null
  }
}

// Instance method to get decrypted Firecrawl API key
platformSettingsSchema.methods.getFirecrawlCredentials = function() {
  if (!this.firecrawl?.enabled) {
    return null
  }

  return {
    apiKey: this.firecrawl.apiKey ? decrypt(this.firecrawl.apiKey) : null
  }
}

// Instance method to get decrypted Paximum credentials
platformSettingsSchema.methods.getPaximumCredentials = function() {
  if (!this.paximum?.enabled) {
    return null
  }

  return {
    endpoint: this.paximum.endpoint,
    agency: this.paximum.agency ? decrypt(this.paximum.agency) : null,
    user: this.paximum.user ? decrypt(this.paximum.user) : null,
    password: this.paximum.password ? decrypt(this.paximum.password) : null,
    token: this.paximum.token,
    tokenExpiresOn: this.paximum.tokenExpiresOn,
    defaultMarkup: this.paximum.defaultMarkup
  }
}

// Instance method to update Paximum token cache
platformSettingsSchema.methods.updatePaximumToken = async function(token, expiresOn) {
  this.paximum.token = token
  this.paximum.tokenExpiresOn = expiresOn
  await this.save()
}

// Transform output - mask sensitive fields
platformSettingsSchema.methods.toSafeJSON = function() {
  const obj = this.toObject()

  // Mask AWS credentials
  if (obj.aws?.ses?.accessKeyId) {
    obj.aws.ses.accessKeyId = '********'
  }
  if (obj.aws?.ses?.secretAccessKey) {
    obj.aws.ses.secretAccessKey = '********'
  }

  // Mask NetGSM credentials
  if (obj.netgsm?.usercode) {
    obj.netgsm.usercode = '********'
  }
  if (obj.netgsm?.password) {
    obj.netgsm.password = '********'
  }

  // Mask VAPID private key
  if (obj.webPush?.privateKey) {
    obj.webPush.privateKey = '********'
  }

  // Mask Gemini API key
  if (obj.gemini?.apiKey) {
    obj.gemini.apiKey = '********'
  }

  // Mask Firecrawl API key
  if (obj.firecrawl?.apiKey) {
    obj.firecrawl.apiKey = '********'
  }

  // Mask Paximum credentials
  if (obj.paximum?.agency) {
    obj.paximum.agency = '********'
  }
  if (obj.paximum?.user) {
    obj.paximum.user = '********'
  }
  if (obj.paximum?.password) {
    obj.paximum.password = '********'
  }
  // Don't expose token in API responses
  if (obj.paximum?.token) {
    delete obj.paximum.token
    delete obj.paximum.tokenExpiresOn
  }

  return obj
}

export default mongoose.model('PlatformSettings', platformSettingsSchema)
