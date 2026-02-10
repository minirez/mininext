import mongoose from 'mongoose'
import { encrypt, decrypt, isEncrypted } from '#helpers/encryption.js'
import auditPlugin from '#plugins/auditPlugin.js'

const rateMappingSchema = new mongoose.Schema(
  {
    localMealPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'MealPlan' },
    reselivaRateId: { type: Number, required: true },
    reselivaRateName: { type: String },
    boardType: { type: String } // RO, BB, HB, FB, AI
  },
  { _id: false }
)

const roomMappingSchema = new mongoose.Schema(
  {
    localRoomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType' },
    reselivaRoomId: { type: Number, required: true },
    reselivaRoomName: { type: String },
    pricingMode: { type: Number, default: 1 }, // pricing attribute from product list
    pricingChild: { type: Number, default: 0 }, // pricing_child attribute
    rateMappings: [rateMappingSchema]
  },
  { _id: false }
)

const channelConnectionSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
      index: true
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true
    },
    provider: {
      type: String,
      enum: ['reseliva'],
      default: 'reseliva'
    },
    credentials: {
      userId: { type: String },
      password: { type: String },
      propertyId: { type: String },
      serviceUrl: { type: String }
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'error'],
      default: 'inactive'
    },
    integrationType: {
      type: String,
      enum: ['one_way', 'two_way'],
      default: 'one_way'
    },
    roomMappings: [roomMappingSchema],
    cachedProducts: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    connectedOTAs: [
      {
        name: { type: String },
        status: { type: String, enum: ['connected', 'not_connected'], default: 'connected' }
      }
    ],
    lastSync: {
      reservations: { type: Date },
      inventory: { type: Date },
      products: { type: Date }
    },
    settings: {
      autoSyncInventory: { type: Boolean, default: false },
      syncIntervalMinutes: { type: Number, default: 10 },
      autoConfirmReservations: { type: Boolean, default: true },
      includeBreakdown: { type: Boolean, default: true }
    },
    lastError: {
      message: { type: String },
      occurredAt: { type: Date },
      context: { type: String }
    }
  },
  {
    timestamps: true
  }
)

// Compound unique index
channelConnectionSchema.index({ partner: 1, hotel: 1, provider: 1 }, { unique: true })

// Pre-save: encrypt credentials
channelConnectionSchema.pre('save', function (next) {
  if (this.isModified('credentials')) {
    const creds = this.credentials
    if (creds.userId && !isEncrypted(creds.userId)) {
      creds.userId = encrypt(creds.userId)
    }
    if (creds.password && !isEncrypted(creds.password)) {
      creds.password = encrypt(creds.password)
    }
    if (creds.propertyId && !isEncrypted(creds.propertyId)) {
      creds.propertyId = encrypt(creds.propertyId)
    }
    // serviceUrl is not sensitive, no encryption
  }
  next()
})

// Instance method: get decrypted credentials
channelConnectionSchema.methods.getDecryptedCredentials = function () {
  const creds = this.credentials
  return {
    userId: creds.userId ? decrypt(creds.userId) : null,
    password: creds.password ? decrypt(creds.password) : null,
    propertyId: creds.propertyId ? decrypt(creds.propertyId) : null,
    serviceUrl: creds.serviceUrl || null
  }
}

// Instance method: get masked credentials (for API responses)
channelConnectionSchema.methods.getMaskedCredentials = function () {
  const creds = this.getDecryptedCredentials()
  return {
    userId: creds.userId || null,
    password: creds.password ? '********' : null,
    propertyId: creds.propertyId || null,
    serviceUrl: creds.serviceUrl || null
  }
}

// toJSON: mask credentials by default
channelConnectionSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.credentials) {
      ret.credentials = doc.getMaskedCredentials()
    }
    return ret
  }
})

// Apply audit plugin
channelConnectionSchema.plugin(auditPlugin, { modelName: 'ChannelConnection' })

const ChannelConnection = mongoose.model('ChannelConnection', channelConnectionSchema)

export default ChannelConnection
