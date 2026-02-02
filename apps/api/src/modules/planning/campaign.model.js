import mongoose from 'mongoose'
import { HOTEL_LANGUAGES } from '../hotel/hotel.model.js'

/**
 * Campaign Model
 * Promotional campaigns and special offers
 */

// Multilingual text schema helper
const multiLangString = (required = false) => {
  const schema = {}
  HOTEL_LANGUAGES.forEach(lang => {
    schema[lang] = { type: String, trim: true, default: '' }
  })
  return schema
}

// Free nights configuration
const freeNightsSchema = new mongoose.Schema(
  {
    stayNights: { type: Number, required: true, min: 2 }, // Stay X nights
    freeNights: { type: Number, required: true, min: 1 } // Get Y free
  },
  { _id: false }
)

const campaignSchema = new mongoose.Schema(
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

    // Campaign identification
    name: multiLangString(true),

    code: {
      type: String,
      uppercase: true,
      trim: true,
      required: [true, 'REQUIRED_CODE']
    },

    description: multiLangString(),

    // Campaign type
    type: {
      type: String,
      enum: [
        'early_bird', // Early booking discount
        'last_minute', // Last minute deals
        'long_stay', // Extended stay discount
        'promotional', // General promotion
        'seasonal', // Seasonal offer
        'honeymoon', // Honeymoon package
        'family', // Family package
        'weekend', // Weekend special
        'midweek', // Midweek special
        'loyalty' // Loyalty/repeat guest
      ],
      required: [true, 'REQUIRED_TYPE']
    },

    // Booking window (when can be booked)
    bookingWindow: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    },

    // Stay window (when can stay)
    stayWindow: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    },

    // Discount configuration
    discount: {
      type: {
        type: String,
        enum: ['percentage', 'fixed', 'free_nights'],
        required: true
      },
      value: { type: Number, min: 0 }, // Percentage (0-100) or fixed amount
      freeNights: freeNightsSchema
    },

    // Conditions
    conditions: {
      minNights: { type: Number, min: 1, default: 1 },
      maxNights: { type: Number, min: 1 },
      advanceBookingDays: { type: Number, min: 0 }, // For early_bird: book at least X days before
      maxAdvanceBookingDays: { type: Number, min: 0 }, // For last_minute: book at most X days before

      // Applicable to specific items (empty = all)
      applicableRoomTypes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'RoomType'
        }
      ],
      applicableMarkets: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Market'
        }
      ],
      applicableMealPlans: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MealPlan'
        }
      ],

      // Day of week restrictions
      applicableDays: {
        monday: { type: Boolean, default: true },
        tuesday: { type: Boolean, default: true },
        wednesday: { type: Boolean, default: true },
        thursday: { type: Boolean, default: true },
        friday: { type: Boolean, default: true },
        saturday: { type: Boolean, default: true },
        sunday: { type: Boolean, default: true }
      }
    },

    // Can this campaign be combined with others?
    combinable: { type: Boolean, default: false },

    // Visibility - B2C and B2B
    visibility: {
      b2c: { type: Boolean, default: true },
      b2b: { type: Boolean, default: true }
    },

    // Application type: how the campaign is applied to stay dates
    // 'stay' = Applied only to nights that fall within stayWindow (day by day)
    // 'checkin' = If check-in date is within stayWindow, applied to ALL nights
    applicationType: {
      type: String,
      enum: ['stay', 'checkin'],
      default: 'stay'
    },

    // Calculation type: how discount is calculated when combined with other campaigns
    // 'cumulative' = All discounts calculated on original price and summed
    // 'sequential' = Each discount calculated on the result of previous discount
    calculationType: {
      type: String,
      enum: ['cumulative', 'sequential'],
      default: 'cumulative'
    },

    // Calculation order: when multiple campaigns are combined, lower number = calculated first
    calculationOrder: { type: Number, default: 0 },

    // Priority (higher = applied first when multiple campaigns match)
    priority: { type: Number, default: 0 },

    // Status
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'expired'],
      default: 'draft'
    },

    // Display order
    displayOrder: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes
campaignSchema.index({ partner: 1, hotel: 1 })
campaignSchema.index({ partner: 1, hotel: 1, code: 1 }, { unique: true })
campaignSchema.index({ hotel: 1, status: 1 })
campaignSchema.index({ hotel: 1, 'bookingWindow.startDate': 1, 'bookingWindow.endDate': 1 })
campaignSchema.index({ hotel: 1, 'stayWindow.startDate': 1, 'stayWindow.endDate': 1 })
campaignSchema.index({ hotel: 1, type: 1 })
campaignSchema.index({ priority: -1 })
campaignSchema.index({ calculationOrder: 1 })
campaignSchema.index({ displayOrder: 1 })

// Validate dates and discount
campaignSchema.pre('save', function (next) {
  // Ensure booking window is valid
  if (this.bookingWindow.endDate < this.bookingWindow.startDate) {
    const temp = this.bookingWindow.startDate
    this.bookingWindow.startDate = this.bookingWindow.endDate
    this.bookingWindow.endDate = temp
  }

  // Ensure stay window is valid
  if (this.stayWindow.endDate < this.stayWindow.startDate) {
    const temp = this.stayWindow.startDate
    this.stayWindow.startDate = this.stayWindow.endDate
    this.stayWindow.endDate = temp
  }

  // Validate discount configuration
  if (this.discount.type === 'percentage' && (!this.discount.value || this.discount.value > 100)) {
    return next(new Error('INVALID_PERCENTAGE_DISCOUNT'))
  }

  if (this.discount.type === 'fixed' && !this.discount.value) {
    return next(new Error('INVALID_FIXED_DISCOUNT'))
  }

  if (this.discount.type === 'free_nights' && !this.discount.freeNights) {
    return next(new Error('INVALID_FREE_NIGHTS_DISCOUNT'))
  }

  next()
})

// Virtual: is currently active (within booking window)
campaignSchema.virtual('isCurrentlyActive').get(function () {
  if (this.status !== 'active') return false
  const now = new Date()
  // Normalize to start of day for end date comparison
  // This ensures campaigns are active throughout the entire end date
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  return now >= this.bookingWindow.startDate && todayStart <= this.bookingWindow.endDate
})

// Statics
campaignSchema.statics.findByHotel = function (hotelId) {
  return this.find({ hotel: hotelId }).sort('displayOrder')
}

campaignSchema.statics.findActiveByHotel = function (hotelId) {
  const now = new Date()
  // Normalize to start of day for end date comparison
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  return this.find({
    hotel: hotelId,
    status: 'active',
    'bookingWindow.startDate': { $lte: now },
    'bookingWindow.endDate': { $gte: todayStart }
  }).sort({ priority: -1, displayOrder: 1 })
}

// Find applicable campaigns for a booking
campaignSchema.statics.findApplicable = async function (hotelId, params) {
  const {
    bookingDate = new Date(),
    checkInDate,
    checkOutDate,
    roomTypeId,
    marketId,
    mealPlanId,
    nights
  } = params

  // Normalize booking date to start of day for comparison
  // This ensures that a booking made any time during the end date is still valid
  const bookingDateStart = new Date(bookingDate)
  bookingDateStart.setHours(0, 0, 0, 0)

  const query = {
    hotel: hotelId,
    status: 'active',
    'bookingWindow.startDate': { $lte: bookingDate },
    'bookingWindow.endDate': { $gte: bookingDateStart },
    'stayWindow.startDate': { $lte: checkOutDate },
    'stayWindow.endDate': { $gte: checkInDate }
  }

  const campaigns = await this.find(query).sort({ priority: -1 })

  // Filter by conditions
  return campaigns.filter(campaign => {
    const c = campaign.conditions

    // Check nights
    if (nights && c.minNights && nights < c.minNights) return false
    if (nights && c.maxNights && nights > c.maxNights) return false

    // Calculate days before check-in
    const checkIn = new Date(checkInDate)
    const booking = new Date(bookingDate)
    checkIn.setHours(0, 0, 0, 0)
    booking.setHours(0, 0, 0, 0)
    const daysBeforeCheckIn = Math.floor((checkIn - booking) / (1000 * 60 * 60 * 24))

    // Early Bird: must book at least X days before check-in
    if (c.advanceBookingDays && daysBeforeCheckIn < c.advanceBookingDays) {
      return false
    }

    // Last Minute: must book at most X days before check-in
    if (c.maxAdvanceBookingDays !== undefined && c.maxAdvanceBookingDays !== null) {
      if (daysBeforeCheckIn > c.maxAdvanceBookingDays) {
        return false
      }
    }

    // Check room type
    if (roomTypeId && c.applicableRoomTypes.length > 0) {
      if (!c.applicableRoomTypes.some(rt => rt.toString() === roomTypeId.toString())) {
        return false
      }
    }

    // Check market
    if (marketId && c.applicableMarkets.length > 0) {
      if (!c.applicableMarkets.some(m => m.toString() === marketId.toString())) {
        return false
      }
    }

    // Check meal plan
    if (mealPlanId && c.applicableMealPlans.length > 0) {
      if (!c.applicableMealPlans.some(mp => mp.toString() === mealPlanId.toString())) {
        return false
      }
    }

    return true
  })
}

// Get campaign type templates
campaignSchema.statics.getCampaignTemplates = function () {
  return [
    {
      type: 'early_bird',
      name: {
        tr: 'Erken Rezervasyon',
        en: 'Early Bird',
        de: 'Frühbucher',
        ru: 'Раннее бронирование'
      },
      defaultDiscount: { type: 'percentage', value: 15 },
      defaultConditions: { advanceBookingDays: 60, minNights: 3 }
    },
    {
      type: 'last_minute',
      name: { tr: 'Son Dakika', en: 'Last Minute', de: 'Last Minute', ru: 'Горящее предложение' },
      defaultDiscount: { type: 'percentage', value: 20 },
      defaultConditions: { advanceBookingDays: 0, minNights: 1 }
    },
    {
      type: 'long_stay',
      name: {
        tr: 'Uzun Konaklama',
        en: 'Long Stay',
        de: 'Langzeitaufenthalt',
        ru: 'Длительное проживание'
      },
      defaultDiscount: { type: 'percentage', value: 10 },
      defaultConditions: { minNights: 7 }
    },
    {
      type: 'honeymoon',
      name: { tr: 'Balayı', en: 'Honeymoon', de: 'Flitterwochen', ru: 'Медовый месяц' },
      defaultDiscount: { type: 'percentage', value: 15 },
      defaultConditions: { minNights: 5 }
    },
    {
      type: 'family',
      name: { tr: 'Aile Paketi', en: 'Family Package', de: 'Familienpaket', ru: 'Семейный пакет' },
      defaultDiscount: { type: 'free_nights', freeNights: { stayNights: 7, freeNights: 1 } },
      defaultConditions: { minNights: 7 }
    }
  ]
}

export default mongoose.model('Campaign', campaignSchema)
