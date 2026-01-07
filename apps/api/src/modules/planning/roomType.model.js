import mongoose from 'mongoose'
import { B2C_LANGUAGES, b2cLangString } from '#constants/languages.js'

/**
 * RoomType Model
 * Room type definitions for hotels with Booking.com style occupancy
 */

// Multilingual text schema helper - supports all 20 languages
const multiLangString = (required = false) => b2cLangString(required)

// Bed configuration schema
const bedConfigSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['single', 'double', 'queen', 'king', 'twin', 'sofa', 'bunk', 'extra'],
      required: true
    },
    count: { type: Number, default: 1, min: 1, max: 10 }
  },
  { _id: false }
)

// Image schema
const imageSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    url: { type: String, required: true },
    caption: multiLangString(),
    order: { type: Number, default: 0 },
    isMain: { type: Boolean, default: false }
  },
  { _id: true }
)

const roomTypeSchema = new mongoose.Schema(
  {
    // Multi-tenant
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: [true, 'REQUIRED_PARTNER'],
      index: true
    },

    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'REQUIRED_HOTEL'],
      index: true
    },

    // Basic Info
    name: multiLangString(true),

    code: {
      type: String,
      uppercase: true,
      trim: true,
      required: [true, 'REQUIRED_CODE'],
      maxlength: [10, 'CODE_MAX_LENGTH']
    },

    description: multiLangString(),

    // Images
    images: [imageSchema],

    // Booking.com style occupancy
    occupancy: {
      maxAdults: { type: Number, min: 1, max: 30, default: 2 },
      minAdults: { type: Number, min: 1, max: 30, default: 1 }, // Minimum adults for this room
      maxChildren: { type: Number, min: 0, max: 20, default: 2 },
      maxInfants: { type: Number, min: 0, max: 10, default: 1 },
      totalMaxGuests: { type: Number, min: 1, max: 50, default: 4 }, // Large villas/mansions
      baseOccupancy: { type: Number, min: 1, max: 30, default: 2 } // Standard pricing occupancy
    },

    // Room physical properties
    size: { type: Number, min: 0 }, // Square meters
    bedConfiguration: [bedConfigSchema],

    // Room amenities
    amenities: [
      {
        type: String,
        enum: [
          // Climate
          'airConditioning',
          'heating',
          'fan',
          // Entertainment
          'tv',
          'satelliteTV',
          'cableTV',
          'radio',
          // Connectivity
          'wifi',
          'telephone',
          'usbPorts',
          // Mini Bar & Kitchen
          'minibar',
          'refrigerator',
          'kettle',
          'coffeeMachine',
          'kitchenette',
          // Bathroom
          'privateBathroom',
          'sharedBathroom',
          'bathtub',
          'shower',
          'hairdryer',
          'toiletries',
          'bathrobes',
          'slippers',
          // View
          'seaView',
          'poolView',
          'gardenView',
          'cityView',
          'mountainView',
          'landmarkView',
          // Outdoor
          'balcony',
          'terrace',
          'privatePool',
          'jacuzzi',
          // Comfort
          'safe',
          'desk',
          'sofa',
          'wardrobe',
          'ironingEquipment',
          // Services
          'roomService',
          'dailyHousekeeping',
          'laundryService',
          // Accessibility
          'wheelchairAccessible',
          'connectedRooms',
          // Special
          'smokingAllowed',
          'nonSmoking',
          'petFriendly'
        ]
      }
    ],

    // Status
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'deleted'],
      default: 'draft'
    },

    // Display order
    displayOrder: { type: Number, default: 0 },

    // Base room pricing
    isBaseRoom: {
      type: Boolean,
      default: false
    },

    // Price adjustment relative to base room (%)
    priceAdjustment: {
      type: Number,
      default: 0,
      min: -100,
      max: 500
    },

    // Pricing type for this room
    // 'unit' = room-based pricing (pricePerNight + extraAdult)
    // 'per_person' = occupancy-based pricing (OBP - different price per adult count)
    pricingType: {
      type: String,
      enum: ['unit', 'per_person'],
      default: 'unit'
    },

    // ===== OBP ÇARPAN SİSTEMİ =====
    // Çarpan özelliği aktif mi? (sadece per_person için geçerli)
    useMultipliers: {
      type: Boolean,
      default: false
    },

    // Çarpan şablonu
    multiplierTemplate: {
      // Yetişkin çarpanları { 1: 0.8, 2: 1.0, 3: 1.3, ... }
      adultMultipliers: {
        type: Map,
        of: Number,
        default: new Map()
      },

      // Çocuk çarpanları - sıra bazında (1. çocuk, 2. çocuk, 3. çocuk)
      // Her sıra için yaş grubu bazında çarpan
      // { 1: { infant: 0, first: 0, second: 0 }, 2: { infant: 0, first: 0.3, second: 0 }, ... }
      childMultipliers: {
        type: Map,
        of: {
          type: Map,
          of: Number
        },
        default: new Map()
      },

      // Kombinasyon tablosu (otomatik oluşturulur + override edilebilir)
      combinationTable: [
        {
          // Benzersiz anahtar: "1" (tek kişi), "2" (çift kişi), "1+1_infant", "2+2_first_second"
          key: { type: String, required: true },
          // Yetişkin sayısı
          adults: { type: Number, required: true, min: 1 },
          // Çocuklar (sıralı)
          children: [
            {
              order: { type: Number, required: true }, // 1, 2, 3...
              ageGroup: { type: String, required: true } // infant, first, second
            }
          ],
          // Sistem tarafından hesaplanan çarpan
          calculatedMultiplier: { type: Number, required: true },
          // Kullanıcı override'ı (null = hesaplananı kullan)
          overrideMultiplier: { type: Number, default: null },
          // Bu kombinasyon satışta mı? (false = -1 gibi, satışa kapalı)
          isActive: { type: Boolean, default: true }
        }
      ],

      // Yuvarlama kuralı
      roundingRule: {
        type: String,
        enum: ['none', 'nearest', 'up', 'down', 'nearest5', 'nearest10'],
        default: 'none'
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, flattenMaps: true },
    toObject: { virtuals: true, flattenMaps: true }
  }
)

// Indexes
roomTypeSchema.index({ partner: 1, hotel: 1 })
roomTypeSchema.index({ partner: 1, hotel: 1, code: 1 }, { unique: true })
roomTypeSchema.index({ partner: 1, hotel: 1, status: 1 })
roomTypeSchema.index({ displayOrder: 1 })

// Multiplier validation constants
const MULTIPLIER_MIN = 0
const MULTIPLIER_MAX = 5 // Max 5x multiplier (e.g., 500% of base price)
const ADULT_COUNT_MAX = 30 // Max adults per room (for large villas/mansions)
const CHILD_ORDER_MAX = 20 // Max children per room

/**
 * Validate multiplier value
 */
function validateMultiplier(value, context = '') {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`Invalid multiplier value for ${context}: must be a number`)
  }
  if (value < MULTIPLIER_MIN) {
    throw new Error(`Multiplier for ${context} cannot be negative`)
  }
  if (value > MULTIPLIER_MAX) {
    throw new Error(`Multiplier for ${context} exceeds maximum (${MULTIPLIER_MAX})`)
  }
  return true
}

// Validate total max guests and multipliers
roomTypeSchema.pre('save', async function (next) {
  try {
    // Ensure minAdults <= maxAdults
    if (this.occupancy.minAdults > this.occupancy.maxAdults) {
      this.occupancy.minAdults = this.occupancy.maxAdults
    }

    // Ensure totalMaxGuests >= baseOccupancy
    if (this.occupancy.totalMaxGuests < this.occupancy.baseOccupancy) {
      this.occupancy.totalMaxGuests = this.occupancy.baseOccupancy
    }

    // Ensure totalMaxGuests >= maxAdults
    if (this.occupancy.totalMaxGuests < this.occupancy.maxAdults) {
      this.occupancy.totalMaxGuests = this.occupancy.maxAdults
    }

    // Ensure only one main image
    const mainImages = this.images.filter(img => img.isMain)
    if (mainImages.length > 1) {
      let foundFirst = false
      this.images.forEach(img => {
        if (img.isMain) {
          if (foundFirst) {
            img.isMain = false
          } else {
            foundFirst = true
          }
        }
      })
    } else if (mainImages.length === 0 && this.images.length > 0) {
      this.images[0].isMain = true
    }

    // Validate multiplier template
    if (this.useMultipliers && this.multiplierTemplate) {
      // Validate adult multipliers
      if (this.multiplierTemplate.adultMultipliers) {
        const adultMults = this.multiplierTemplate.adultMultipliers
        const map = adultMults instanceof Map ? adultMults : new Map(Object.entries(adultMults))

        for (const [key, value] of map) {
          const adultCount = parseInt(key)
          if (adultCount < 1 || adultCount > ADULT_COUNT_MAX) {
            return next(new Error(`Invalid adult count in multiplier: ${key}`))
          }
          validateMultiplier(value, `${adultCount} adults`)
        }
      }

      // Validate child multipliers
      if (this.multiplierTemplate.childMultipliers) {
        const childMults = this.multiplierTemplate.childMultipliers
        const map = childMults instanceof Map ? childMults : new Map(Object.entries(childMults))

        for (const [orderKey, ageGroupMap] of map) {
          const order = parseInt(orderKey)
          if (order < 1 || order > CHILD_ORDER_MAX) {
            return next(new Error(`Invalid child order in multiplier: ${orderKey}`))
          }

          const ageMap =
            ageGroupMap instanceof Map ? ageGroupMap : new Map(Object.entries(ageGroupMap))
          for (const [ageGroup, value] of ageMap) {
            validateMultiplier(value, `child ${order} (${ageGroup})`)
          }
        }
      }

      // Validate combination table if present
      if (this.multiplierTemplate.combinationTable) {
        for (const combo of this.multiplierTemplate.combinationTable) {
          if (combo.calculatedMultiplier !== undefined && combo.calculatedMultiplier !== null) {
            validateMultiplier(combo.calculatedMultiplier, `combination ${combo.key} (calculated)`)
          }
          if (combo.overrideMultiplier !== undefined && combo.overrideMultiplier !== null) {
            validateMultiplier(combo.overrideMultiplier, `combination ${combo.key} (override)`)
          }
        }
      }
    }

    // Base room logic: if this room is set as base, clear isBaseRoom from others
    if (this.isBaseRoom && this.isModified('isBaseRoom')) {
      await this.constructor.updateMany(
        { hotel: this.hotel, _id: { $ne: this._id } },
        { isBaseRoom: false }
      )
      // Base room always has 0 adjustment
      this.priceAdjustment = 0
    }

    next()
  } catch (error) {
    next(error)
  }
})

// Statics
roomTypeSchema.statics.findByHotel = function (hotelId) {
  return this.find({ hotel: hotelId }).sort('displayOrder')
}

roomTypeSchema.statics.findActiveByHotel = function (hotelId) {
  return this.find({ hotel: hotelId, status: 'active' }).sort('displayOrder')
}

export default mongoose.model('RoomType', roomTypeSchema)
