import mongoose from 'mongoose'
import auditPlugin from '#plugins/auditPlugin.js'
import { B2C_LANGUAGES, b2cLangString } from '#constants/languages.js'

/**
 * Hotel Model
 * Multi-tenant hotel management for booking engine
 * Supports 20 languages for multilingual content
 */

// Alias for backward compatibility
const SUPPORTED_LANGUAGES = B2C_LANGUAGES

// Multilingual text schema helper - supports all 20 languages
const multiLangString = (required = false) => b2cLangString(required)

// Export room amenities for use in other modules (single source of truth)
export const ROOM_AMENITIES = [
  // Klima & Isıtma
  'airConditioning',
  'heating',
  'fan',
  'centralHeating',
  // Eğlence
  'tv',
  'satelliteTV',
  'cableTV',
  'smartTV',
  'radio',
  // Bağlantı
  'wifi',
  'telephone',
  'usbPorts',
  'laptop',
  // Minibar & Mutfak
  'minibar',
  'refrigerator',
  'kettle',
  'coffeeMachine',
  'kitchen',
  'kitchenette',
  'microwave',
  'toaster',
  'dishwasher',
  'oven',
  'stove',
  'diningArea',
  'diningTable',
  // Banyo
  'privateBathroom',
  'sharedBathroom',
  'bathtub',
  'shower',
  'rainShower',
  'jacuzzi',
  'hairdryer',
  'toiletries',
  'bathrobes',
  'slippers',
  'bidet',
  // Manzara
  'seaView',
  'poolView',
  'gardenView',
  'cityView',
  'mountainView',
  'landmarkView',
  // Dış Mekan
  'balcony',
  'terrace',
  'privatePool',
  'privateGarden',
  'patio',
  // Konfor
  'safe',
  'desk',
  'sofa',
  'wardrobe',
  'ironingEquipment',
  'soundproofing',
  'carpeted',
  'parquet',
  'livingRoom',
  'separateLivingRoom',
  // Servis
  'roomService',
  'dailyHousekeeping',
  'laundryService',
  'turndownService',
  // Erişilebilirlik
  'wheelchairAccessible',
  'connectedRooms',
  // Özel
  'smokingAllowed',
  'nonSmoking',
  'petFriendly',
  'hypoallergenic'
]

// Cancellation rule schema for algorithmic cancellation policy
const cancellationRuleSchema = new mongoose.Schema(
  {
    daysBeforeCheckIn: { type: Number, required: true }, // X days before check-in
    refundPercent: { type: Number, min: 0, max: 100, required: true }, // % refund
    description: multiLangString()
  },
  { _id: false }
)

const hotelSchema = new mongoose.Schema(
  {
    // ===== OTEL TİPİ =====
    // base: Platform otel havuzu (SuperAdmin yönetir, partner: null)
    // partner: Partner'ın kendi oteli (tam kontrol)
    // linked: HotelBase'e bağlı partner oteli (bazı alanlar readonly)
    hotelType: {
      type: String,
      enum: {
        values: ['base', 'partner', 'linked'],
        message: 'INVALID_HOTEL_TYPE'
      },
      default: 'partner',
      index: true
    },

    // Partner (Multi-tenant) - base için null, partner/linked için zorunlu
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      index: true
      // Not required - base hotels have no partner
    },

    // HotelBase referansı - sadece linked tipi için
    hotelBase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      default: null,
      index: true
    },

    // Status
    status: {
      type: String,
      enum: {
        values: ['draft', 'active', 'inactive'],
        message: 'INVALID_STATUS'
      },
      default: 'draft'
    },

    // Basic Info
    name: {
      type: String,
      required: [true, 'REQUIRED_NAME'],
      trim: true
    },
    description: multiLangString(),

    // Slug (URL friendly identifier)
    slug: {
      type: String,
      trim: true,
      lowercase: true
    },

    // Logo/Image
    logo: { type: String, trim: true },

    // Star rating (1-5)
    stars: {
      type: Number,
      min: [1, 'HOTEL_STARS_MIN'],
      max: [5, 'HOTEL_STARS_MAX'],
      default: 3
    },

    // Hotel type
    type: {
      type: String,
      enum: {
        values: [
          'hotel',
          'apart',
          'boutique',
          'resort',
          'hostel',
          'villa',
          'guesthouse',
          'motel',
          'pension',
          'camping'
        ],
        message: 'INVALID_HOTEL_TYPE'
      },
      default: 'hotel'
    },

    // Facility Category
    category: {
      type: String,
      enum: {
        values: ['economy', 'standard', 'superior', 'deluxe', 'luxury', 'ultra-luxury'],
        message: 'INVALID_CATEGORY'
      },
      default: 'standard'
    },

    // Visibility
    visibility: {
      b2c: { type: Boolean, default: true }, // Visible on B2C website
      b2b: { type: Boolean, default: true } // Visible on B2B extranet
    },

    // Address
    address: {
      street: { type: String, trim: true },
      district: { type: String, trim: true },
      city: { type: String, trim: true, required: [true, 'REQUIRED_CITY'] },
      country: { type: String, trim: true, required: [true, 'REQUIRED_COUNTRY'] },
      postalCode: { type: String, trim: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      },
      // Google Maps formatted address
      formattedAddress: { type: String, trim: true },
      placeId: { type: String, trim: true } // Google Place ID
    },

    // Tags - Hotel labels/badges
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
      }
    ],

    // Hierarchical Location (Country > City > District > TourismRegions)
    location: {
      countryCode: { type: String, uppercase: true, trim: true }, // ISO 3166-1 alpha-2
      city: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
      district: { type: mongoose.Schema.Types.ObjectId, ref: 'District' }, // İlçe - will be added later
      // Multiple tourism regions (like tags)
      tourismRegions: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TourismRegion'
        }
      ]
    },

    // Contact Information (Enhanced)
    contact: {
      // Primary contacts
      phone: { type: String, trim: true }, // Main facility phone
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'INVALID_EMAIL']
      },
      website: { type: String, trim: true },
      // Additional contacts
      callCenter: { type: String, trim: true }, // Call center phone
      fax: { type: String, trim: true },
      // Manager/Contact person
      authorizedPerson: { type: String, trim: true },
      authorizedEmail: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'INVALID_EMAIL']
      },
      authorizedPhone: { type: String, trim: true },
      // Social media
      socialMedia: {
        facebook: { type: String, trim: true },
        instagram: { type: String, trim: true },
        twitter: { type: String, trim: true },
        youtube: { type: String, trim: true }
      }
    },

    // Images
    images: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        url: { type: String, required: true },
        caption: multiLangString(),
        order: { type: Number, default: 0 },
        isMain: { type: Boolean, default: false }
      }
    ],

    // Amenities (Hotel-level)
    amenities: [
      {
        type: String,
        enum: [
          // General
          'wifi',
          'parking',
          'freeParking',
          'valetParking',
          'airConditioning',
          'heating',
          // Facilities
          'pool',
          'indoorPool',
          'outdoorPool',
          'spa',
          'gym',
          'sauna',
          'hammam',
          // Dining
          'restaurant',
          'bar',
          'roomService',
          'breakfast',
          'minibar',
          // Services
          'reception24h',
          'concierge',
          'laundry',
          'dryCleaning',
          'airportShuttle',
          'carRental',
          'tourDesk',
          'currencyExchange',
          'atm',
          'luggageStorage',
          // Business
          'businessCenter',
          'meetingRooms',
          'conferenceHall',
          // Family
          'kidsClub',
          'playground',
          'babysitting',
          // Beach & Nature
          'beachAccess',
          'privateBeach',
          'garden',
          'terrace',
          // Accessibility
          'wheelchairAccessible',
          'elevator',
          // Policies
          'petFriendly',
          'smokingArea',
          'nonSmoking',
          // Entertainment
          'casino',
          'nightclub',
          'cinema',
          'gameRoom',
          // Sports
          'tennis',
          'golf',
          'diving',
          'waterSports',
          'surfing',
          'skiing'
        ]
      }
    ],

    // Policies
    policies: {
      // linked oteller için: true ise base otel politikalarını kullan
      useBaseDefaults: { type: Boolean, default: true },

      // Time settings
      checkIn: { type: String, default: '14:00' },
      checkOut: { type: String, default: '12:00' },

      // Age limits
      maxBabyAge: { type: Number, default: 2, min: 0, max: 5 },
      maxChildAge: { type: Number, default: 12, min: 0, max: 18 },

      // Policy texts (multilingual)
      childPolicy: multiLangString(),
      petPolicy: multiLangString(),
      additionalInfo: multiLangString(),

      // Algorithmic Cancellation Policy
      cancellationRules: [cancellationRuleSchema],

      // Free cancellation option
      freeCancellation: {
        enabled: { type: Boolean, default: false },
        daysBeforeCheckIn: { type: Number, default: 1 }
      }
    },

    // Room Configuration
    roomConfig: {
      totalRooms: { type: Number, default: 0, min: 0 },
      floors: { type: Number, default: 1, min: 1 },
      hasElevator: { type: Boolean, default: false }
    },

    // Çocuk Yaş Grupları (Fiyatlandırma için)
    // Varsayılan: infant (0-2), first (3-12) - İsteğe bağlı second eklenebilir
    childAgeGroups: [
      {
        code: {
          type: String,
          enum: ['infant', 'first', 'second'],
          required: true
        },
        name: multiLangString(),
        minAge: { type: Number, min: 0, max: 17, required: true },
        maxAge: { type: Number, min: 0, max: 17, required: true },
        order: { type: Number, default: 0 }
      }
    ],

    // Pricing Settings (B2B Pricing Model)
    pricingSettings: {
      // Fiyatlandırma modeli: net (otel net fiyat verir) veya rack (afişe fiyat verir)
      model: {
        type: String,
        enum: ['net', 'rack'],
        default: 'net'
      },
      // Net model için default markup %
      defaultMarkup: {
        type: Number,
        min: 0,
        max: 100,
        default: 20
      },
      // Rack model için partner komisyon %
      defaultCommission: {
        type: Number,
        min: 0,
        max: 100,
        default: 15
      },
      // Para birimi
      currency: {
        type: String,
        enum: ['TRY', 'USD', 'EUR', 'GBP'],
        default: 'EUR'
      },
      // KDV dahil mi?
      taxIncluded: {
        type: Boolean,
        default: true
      },
      // KDV oranı
      taxRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 10
      }
    },

    // SEO (all multilingual)
    seo: {
      title: multiLangString(),
      description: multiLangString(),
      keywords: multiLangString()
    },

    // Profile - Rich content sections with WYSIWYG support
    profile: {
      // Genel Bilgiler / Overview
      overview: {
        content: multiLangString(), // WYSIWYG HTML content
        establishedYear: { type: Number, min: 1800, max: 2100 },
        renovationYear: { type: Number, min: 1900, max: 2100 },
        chainBrand: { type: String, trim: true },
        officialRating: { type: String, trim: true }
      },

      // Otel Olanakları / Facilities
      facilities: {
        content: multiLangString(),
        features: [
          {
            type: String,
            enum: [
              'wifi',
              'freeWifi',
              'parking',
              'freeParking',
              'valetParking',
              'reception24h',
              'concierge',
              'luggageStorage',
              'elevator',
              'airConditioning',
              'heating',
              'laundry',
              'dryCleaning',
              'currencyExchange',
              'atm',
              'safe',
              'giftShop',
              'hairdresser',
              'carRental',
              'airportShuttle',
              'disabledAccess',
              'wheelchairAccessible',
              'smokingArea',
              'nonSmoking',
              'garden',
              'terrace'
            ]
          }
        ]
      },

      // Yeme İçme / Dining
      dining: {
        content: multiLangString(),
        features: [
          {
            type: String,
            enum: [
              'mainRestaurant',
              'alacarteRestaurant',
              'buffetRestaurant',
              'snackBar',
              'poolBar',
              'beachBar',
              'lobbyBar',
              'nightclub',
              'patisserie',
              'iceCream',
              'roomService',
              'roomService24h',
              'minibar',
              'dietMenu',
              'veganOptions',
              'halalFood',
              'kosherFood'
            ]
          }
        ],
        restaurants: [
          {
            name: { type: String, trim: true },
            cuisine: { type: String, trim: true },
            dressCode: { type: String, trim: true },
            reservationRequired: { type: Boolean, default: false }
          }
        ]
      },

      // Spor & Eğlence / Sports & Entertainment
      sportsEntertainment: {
        content: multiLangString(),
        features: [
          {
            type: String,
            enum: [
              'fitness',
              'aerobics',
              'yoga',
              'tennis',
              'tableTennis',
              'basketball',
              'volleyball',
              'beachVolleyball',
              'football',
              'golf',
              'miniGolf',
              'bowling',
              'billiards',
              'darts',
              'waterSports',
              'diving',
              'snorkeling',
              'jetski',
              'parasailing',
              'canoeing',
              'surfing',
              'sailing',
              'fishing',
              'animation',
              'liveMusic',
              'disco',
              'cinema',
              'gameRoom',
              'casino'
            ]
          }
        ]
      },

      // Spa & Wellness
      spaWellness: {
        content: multiLangString(),
        features: [
          {
            type: String,
            enum: [
              'spa',
              'hammam',
              'sauna',
              'steamRoom',
              'jacuzzi',
              'massage',
              'thaiMassage',
              'aromatherapy',
              'beautyCenter',
              'hairdresser',
              'manicure',
              'pedicure',
              'skinCare',
              'relaxationRoom',
              'heatedPool',
              'vitality'
            ]
          }
        ],
        spaDetails: {
          area: { type: Number, min: 0 }, // m²
          treatments: [{ type: String, trim: true }]
        }
      },

      // Çocuk & Bebek / Family & Kids
      familyKids: {
        content: multiLangString(),
        features: [
          {
            type: String,
            enum: [
              'kidsClub',
              'miniClub',
              'teenClub',
              'playground',
              'babyPool',
              'kidsPool',
              'waterSlides',
              'aquapark',
              'babysitting',
              'babyEquipment',
              'highChair',
              'babyCot',
              'kidsMenu',
              'kidsAnimation',
              'miniDisco'
            ]
          }
        ],
        kidsClubAges: {
          min: { type: Number, min: 0, max: 18, default: 4 },
          max: { type: Number, min: 0, max: 18, default: 12 }
        }
      },

      // Plaj & Havuz / Beach & Pool
      beachPool: {
        content: multiLangString(),
        features: [
          {
            type: String,
            enum: [
              'privateBeach',
              'publicBeach',
              'sandyBeach',
              'pebbleBeach',
              'beachPlatform',
              'pier',
              'sunbeds',
              'beachTowels',
              'outdoorPool',
              'indoorPool',
              'heatedPool',
              'infinityPool',
              'kidsPool',
              'wavePool',
              'waterSlides',
              'aquapark',
              'lazyRiver'
            ]
          }
        ],
        beachDetails: {
          distance: { type: Number, min: 0 }, // meters
          type: { type: String, enum: ['', 'sand', 'pebble', 'platform', 'mixed'] },
          length: { type: Number, min: 0 } // meters
        },
        pools: [
          {
            type: { type: String, enum: ['indoor', 'outdoor', 'kids', 'wave', 'infinity'] },
            heated: { type: Boolean, default: false },
            dimensions: { type: String, trim: true }
          }
        ]
      },

      // Balayı / Honeymoon
      honeymoon: {
        content: multiLangString(),
        features: [
          {
            type: String,
            enum: [
              'romanticRoomDecoration',
              'honeymoonSuite',
              'champagne',
              'fruitBasket',
              'romanticDinner',
              'privateDining',
              'couplesSpa',
              'sunsetCruise',
              'specialTurndown'
            ]
          }
        ],
        available: { type: Boolean, default: false }
      },

      // Önemli Bilgiler / Important Info
      importantInfo: {
        content: multiLangString()
      },

      // Konum & Çevre / Location & Surroundings
      location: {
        content: multiLangString(),
        distances: [
          {
            place: { type: String, trim: true },
            distance: { type: Number, min: 0 },
            unit: { type: String, enum: ['m', 'km', 'min'], default: 'km' }
          }
        ]
      }
    },

    // ===== ROOM TEMPLATES (Only for base hotels) =====
    // Room templates are used by base hotels to define room information
    // Partners can import these templates when creating RoomTypes
    roomTemplates: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        code: {
          type: String,
          required: true,
          uppercase: true,
          trim: true,
          maxlength: 10
        },
        name: multiLangString(),
        description: multiLangString(),
        images: [
          {
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            url: { type: String, required: true },
            caption: multiLangString(),
            order: { type: Number, default: 0 },
            isMain: { type: Boolean, default: false }
          }
        ],
        amenities: [
          {
            type: String,
            enum: ROOM_AMENITIES
          }
        ],
        size: { type: Number, min: 0 }, // m²
        bedConfiguration: [
          {
            type: {
              type: String,
              enum: ['single', 'double', 'queen', 'king', 'twin', 'sofa', 'bunk', 'extra']
            },
            count: { type: Number, min: 1, max: 10, default: 1 }
          }
        ],
        occupancy: {
          maxAdults: { type: Number, min: 1, max: 10, default: 2 },
          maxChildren: { type: Number, min: 0, max: 6, default: 2 },
          maxInfants: { type: Number, min: 0, max: 2, default: 1 },
          totalMaxGuests: { type: Number, min: 1, max: 12, default: 4 }
        },
        order: { type: Number, default: 0 }
      }
    ],

    // Display settings
    featured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },

    // Stats (will be updated as bookings come in)
    stats: {
      totalBookings: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 }
    },

    // Audit fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes
hotelSchema.index({ partner: 1, status: 1 })
hotelSchema.index({ partner: 1, 'address.city': 1 })
hotelSchema.index({ partner: 1, slug: 1 }, { unique: true, sparse: true })
// HotelBase indexes
hotelSchema.index({ hotelType: 1, status: 1 })
hotelSchema.index({ hotelType: 1, partner: 1 })
hotelSchema.index({ hotelBase: 1, partner: 1 })
hotelSchema.index({ tags: 1 })
hotelSchema.index({ 'location.countryCode': 1 })
hotelSchema.index({ 'location.city': 1 })
hotelSchema.index({ 'location.district': 1 })
hotelSchema.index({ 'location.tourismRegions': 1 })
// Not using 2dsphere index - current lat/lng format is not GeoJSON
// hotelSchema.index({ 'address.coordinates': '2dsphere' })
hotelSchema.index({ stars: 1 })
hotelSchema.index({ featured: 1 })
hotelSchema.index({ category: 1 })
hotelSchema.index({ 'visibility.b2c': 1 })
hotelSchema.index({ 'visibility.b2b': 1 })

// Virtual - Room types
hotelSchema.virtual('roomTypes', {
  ref: 'RoomType',
  localField: '_id',
  foreignField: 'hotel'
})

// Methods
hotelSchema.methods.isActive = function () {
  return this.status === 'active'
}

hotelSchema.methods.activate = async function () {
  this.status = 'active'
  return await this.save()
}

hotelSchema.methods.deactivate = async function () {
  this.status = 'inactive'
  return await this.save()
}

hotelSchema.methods.getMainImage = function () {
  const mainImage = this.images.find(img => img.isMain)
  return mainImage || this.images[0] || null
}

// Resolve full hotel data for linked hotels (merge base data with partner settings)
hotelSchema.methods.resolveData = async function () {
  // For base or partner hotels, return as-is
  if (this.hotelType !== 'linked' || !this.hotelBase) {
    return this.toObject()
  }

  // For linked hotels, merge base data with partner settings
  const Hotel = mongoose.model('Hotel')
  const baseHotel = await Hotel.findById(this.hotelBase)
    .populate('location.city', 'name countryCode')
    .populate('location.district', 'name')
    .populate('location.tourismRegions', 'name')
    .populate('tags', 'name slug')

  if (!baseHotel) {
    // Base hotel not found, return as-is
    return this.toObject()
  }

  const resolved = this.toObject()

  // Override with base hotel data (readonly fields)
  resolved.name = baseHotel.name
  resolved.description = baseHotel.description
  resolved.logo = baseHotel.logo
  resolved.stars = baseHotel.stars
  resolved.type = baseHotel.type
  resolved.category = baseHotel.category
  resolved.address = baseHotel.address
  resolved.location = baseHotel.location
  resolved.contact = baseHotel.contact
  resolved.images = baseHotel.images
  resolved.amenities = baseHotel.amenities
  resolved.roomConfig = baseHotel.roomConfig
  resolved.profile = baseHotel.profile
  resolved.tags = baseHotel.tags
  resolved.roomTemplates = baseHotel.roomTemplates

  // Policies: use base defaults or partner overrides
  // BUT child age settings are ALWAYS partner-controlled
  if (this.policies.useBaseDefaults) {
    resolved.policies = {
      ...baseHotel.policies,
      useBaseDefaults: true, // Keep this flag
      // Child ages are always from partner's own settings
      maxBabyAge: this.policies.maxBabyAge,
      maxChildAge: this.policies.maxChildAge
    }
  }

  // Add metadata
  resolved._baseHotel = baseHotel.toObject()
  resolved._isLinked = true

  return resolved
}

// Calculate cancellation refund based on rules
hotelSchema.methods.calculateRefund = function (daysBeforeCheckIn) {
  const rules = this.policies.cancellationRules || []

  // Sort rules by days (descending) to find the applicable rule
  const sortedRules = [...rules].sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)

  for (const rule of sortedRules) {
    if (daysBeforeCheckIn >= rule.daysBeforeCheckIn) {
      return rule.refundPercent
    }
  }

  // No refund if no rule matches
  return 0
}

// Statics
hotelSchema.statics.findByPartner = function (partnerId) {
  return this.find({ partner: partnerId })
}

hotelSchema.statics.findActiveByPartner = function (partnerId) {
  return this.find({ partner: partnerId, status: 'active' })
}

hotelSchema.statics.findBySlug = function (partnerId, slug) {
  return this.findOne({ partner: partnerId, slug: slug })
}

hotelSchema.statics.findByCity = function (partnerId, city) {
  return this.find({
    partner: partnerId,
    status: 'active',
    'address.city': { $regex: city, $options: 'i' }
  })
}

hotelSchema.statics.findB2C = function (partnerId) {
  return this.find({
    partner: partnerId,
    status: 'active',
    'visibility.b2c': true
  })
}

hotelSchema.statics.findB2B = function (partnerId) {
  return this.find({
    partner: partnerId,
    status: 'active',
    'visibility.b2b': true
  })
}

// ===== HotelBase Static Methods =====

// Find all base hotels (platform hotel pool)
hotelSchema.statics.findBaseHotels = function (options = {}) {
  const query = { hotelType: 'base' }
  if (options.status) query.status = options.status
  return this.find(query).sort({ name: 1 })
}

// Find available base hotels for partner selection
hotelSchema.statics.findAvailableBases = function (options = {}) {
  const query = {
    hotelType: 'base',
    status: 'active'
  }
  if (options.city) query['location.city'] = options.city
  if (options.stars) query.stars = options.stars
  return this.find(query).sort({ stars: -1, name: 1 })
}

// Find linked hotels by base hotel ID
hotelSchema.statics.findLinkedHotels = function (baseHotelId) {
  return this.find({
    hotelType: 'linked',
    hotelBase: baseHotelId
  }).populate('partner', 'companyName')
}

// Find partner's linked hotel for a specific base
hotelSchema.statics.findPartnerLinkedHotel = function (partnerId, baseHotelId) {
  return this.findOne({
    partner: partnerId,
    hotelBase: baseHotelId,
    hotelType: 'linked'
  })
}

// Check if partner already has this base hotel linked
hotelSchema.statics.isBaseAlreadyLinked = async function (partnerId, baseHotelId) {
  const existing = await this.findOne({
    partner: partnerId,
    hotelBase: baseHotelId,
    hotelType: 'linked'
  })
  return !!existing
}

// Helper to generate slug from text
const generateSlug = text => {
  if (!text) return ''

  // Turkish character replacements
  const turkishMap = {
    ç: 'c',
    ğ: 'g',
    ı: 'i',
    ö: 'o',
    ş: 's',
    ü: 'u',
    Ç: 'c',
    Ğ: 'g',
    İ: 'i',
    Ö: 'o',
    Ş: 's',
    Ü: 'u'
  }

  let slug = text.toLowerCase()

  // Replace Turkish characters
  for (const [from, to] of Object.entries(turkishMap)) {
    slug = slug.replace(new RegExp(from, 'g'), to)
  }

  return slug
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Pre-save middleware (async for database queries)
hotelSchema.pre('save', async function () {
  // ===== HotelType Validation =====
  // base hotels should not have partner
  if (this.hotelType === 'base' && this.partner) {
    throw new Error('Base hotels cannot have a partner')
  }
  // partner and linked hotels must have partner
  if ((this.hotelType === 'partner' || this.hotelType === 'linked') && !this.partner) {
    throw new Error('Partner and linked hotels must have a partner')
  }
  // linked hotels must have hotelBase reference
  if (this.hotelType === 'linked' && !this.hotelBase) {
    throw new Error('Linked hotels must have a hotelBase reference')
  }
  // partner hotels should not have hotelBase
  if (this.hotelType === 'partner' && this.hotelBase) {
    throw new Error('Partner hotels cannot have a hotelBase reference')
  }

  // Clean up null coordinates to prevent any issues
  if (this.address && this.address.coordinates) {
    if (
      this.address.coordinates.lat === null ||
      this.address.coordinates.lat === undefined ||
      this.address.coordinates.lng === null ||
      this.address.coordinates.lng === undefined
    ) {
      // Remove invalid coordinates
      this.address.coordinates = undefined
    }
  }

  // Auto-generate slug from name if not set
  // name can be string (for all hotel types now) or object with .tr (legacy)
  if (!this.slug && this.name) {
    const nameText = typeof this.name === 'string' ? this.name : this.name.tr || this.name
    this.slug = generateSlug(nameText)
  }

  // Ensure slug uniqueness - add random suffix if duplicate exists
  if (this.slug && this.isNew) {
    const existingHotel = await mongoose.model('Hotel').findOne({
      partner: this.partner,
      slug: this.slug,
      _id: { $ne: this._id }
    })
    if (existingHotel) {
      // Append random 4-char suffix
      const suffix = Math.random().toString(36).substring(2, 6)
      this.slug = `${this.slug}-${suffix}`
    }
  }

  // Ensure only one main image
  const mainImages = this.images.filter(img => img.isMain)
  if (mainImages.length > 1) {
    // Keep only the first main image
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
    // Set first image as main if none selected
    this.images[0].isMain = true
  }

  // Sort cancellation rules by daysBeforeCheckIn descending
  if (this.policies.cancellationRules && this.policies.cancellationRules.length > 0) {
    this.policies.cancellationRules.sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)
  }

  // Set default childAgeGroups if not defined (2 age groups: infant 0-2, child 3-12)
  if (!this.childAgeGroups || this.childAgeGroups.length === 0) {
    this.childAgeGroups = [
      {
        code: 'infant',
        name: { tr: 'Bebek', en: 'Infant' },
        minAge: 0,
        maxAge: 2,
        order: 0
      },
      {
        code: 'first',
        name: { tr: '1. Tip Çocuk', en: 'Child Type 1' },
        minAge: 3,
        maxAge: 12,
        order: 1
      }
    ]
  }

  // Validate roomTemplates - only for base hotels
  if (this.hotelType === 'base' && this.roomTemplates && this.roomTemplates.length > 0) {
    // Check for duplicate codes
    const codes = this.roomTemplates.map(rt => rt.code.toUpperCase())
    const uniqueCodes = new Set(codes)
    if (codes.length !== uniqueCodes.size) {
      throw new Error('Room template codes must be unique within a hotel')
    }

    // Sort by order and ensure main image consistency
    this.roomTemplates.sort((a, b) => a.order - b.order)

    // Ensure each room template has one main image
    this.roomTemplates.forEach(rt => {
      if (rt.images && rt.images.length > 0) {
        const mainImages = rt.images.filter(img => img.isMain)
        if (mainImages.length > 1) {
          let foundFirst = false
          rt.images.forEach(img => {
            if (img.isMain) {
              if (foundFirst) img.isMain = false
              else foundFirst = true
            }
          })
        } else if (mainImages.length === 0) {
          rt.images[0].isMain = true
        }
        // Sort images by order
        rt.images.sort((a, b) => a.order - b.order)
      }
    })
  }
})

// Export supported languages for use in other modules
export const HOTEL_LANGUAGES = SUPPORTED_LANGUAGES

// Export bed types for use in other modules
export const BED_TYPES = ['single', 'double', 'queen', 'king', 'twin', 'sofa', 'bunk', 'extra']

// Audit plugin for tracking changes
hotelSchema.plugin(auditPlugin, {
  module: 'hotel',
  nameField: 'name'
})

export default mongoose.model('Hotel', hotelSchema)
