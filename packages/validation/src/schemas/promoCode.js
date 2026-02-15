/**
 * PromoCode Schema - Single Source of Truth
 *
 * Validation schema for promotional code data.
 * PromoCode is a Campaign with type 'promo_code'.
 * Used by both backend (Mongoose) and frontend (Vue).
 */

import { validateDate } from '../validators/common.js'
import { CURRENCY_CODES } from '../validators/common.js'

// ==========================================
// PROMO CODE ENUMS
// ==========================================

export const PROMO_CODE_DISCOUNT_TYPES = ['percentage', 'fixed', 'free_nights']

export const PROMO_CODE_STATUSES = ['draft', 'active', 'inactive', 'expired']

export const PROMO_CODE_APPLICATION_TYPES = ['stay', 'checkin']

export const PROMO_CODE_CALCULATION_TYPES = ['cumulative', 'sequential']

// Promo code pattern: uppercase alphanumeric, hyphens allowed, 3-30 chars
export const PROMO_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{1,28}[A-Z0-9]$/

// ==========================================
// PROMO CODE SCHEMA (Full - for Mongoose)
// ==========================================

export const promoCodeSchema = {
  partner: {
    type: 'objectId',
    required: [true, 'REQUIRED_PARTNER'],
    ref: 'Partner'
  },
  hotel: {
    type: 'objectId',
    required: [true, 'REQUIRED_HOTEL'],
    ref: 'Hotel'
  },
  name: {
    type: 'object', // Multilingual
    properties: {}
  },
  code: {
    type: 'string',
    required: [true, 'REQUIRED_CODE'],
    minLength: [3, 'MIN_LENGTH_3'],
    maxLength: [30, 'MAX_LENGTH_30'],
    uppercase: true,
    trim: true,
    validate: {
      validator: v => PROMO_CODE_PATTERN.test(v),
      message: 'INVALID_PROMO_CODE_FORMAT'
    }
  },
  description: {
    type: 'object', // Multilingual
    properties: {}
  },
  status: {
    type: 'string',
    enum: {
      values: PROMO_CODE_STATUSES,
      message: 'INVALID_STATUS'
    },
    default: 'draft'
  },
  // Booking window (when the promo code can be used)
  bookingWindow: {
    type: 'object',
    properties: {
      startDate: {
        type: 'date',
        required: [true, 'REQUIRED_BOOKING_START_DATE']
      },
      endDate: {
        type: 'date',
        required: [true, 'REQUIRED_BOOKING_END_DATE']
      }
    }
  },
  // Stay window (when the stay must occur)
  stayWindow: {
    type: 'object',
    properties: {
      startDate: {
        type: 'date',
        required: [true, 'REQUIRED_STAY_START_DATE']
      },
      endDate: {
        type: 'date',
        required: [true, 'REQUIRED_STAY_END_DATE']
      }
    }
  },
  // Discount configuration
  discount: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        required: [true, 'REQUIRED_DISCOUNT_TYPE'],
        enum: {
          values: PROMO_CODE_DISCOUNT_TYPES,
          message: 'INVALID_DISCOUNT_TYPE'
        }
      },
      value: {
        type: 'number',
        min: [0, 'MIN_DISCOUNT_VALUE_0'],
        // For percentage: max 100, for fixed: no max (currency-based)
        validate: {
          validator: (v, data) => {
            if (data?.discount?.type === 'percentage') return v >= 0 && v <= 100
            if (data?.discount?.type === 'fixed') return v > 0
            return true // free_nights doesn't need value
          },
          message: 'INVALID_DISCOUNT_VALUE'
        }
      },
      freeNights: {
        type: 'object',
        properties: {
          stayNights: {
            type: 'number',
            min: [2, 'MIN_STAY_NIGHTS_2']
          },
          freeNights: {
            type: 'number',
            min: [1, 'MIN_FREE_NIGHTS_1']
          }
        }
      }
    }
  },
  // Conditions
  conditions: {
    type: 'object',
    properties: {
      minNights: {
        type: 'number',
        min: [1, 'MIN_NIGHTS_1'],
        default: 1
      },
      maxNights: {
        type: 'number',
        min: [1, 'MIN_NIGHTS_1']
      },
      applicableRoomTypes: {
        type: 'array',
        items: {
          type: 'objectId',
          ref: 'RoomType'
        }
      },
      applicableMarkets: {
        type: 'array',
        items: {
          type: 'objectId',
          ref: 'Market'
        }
      },
      applicableMealPlans: {
        type: 'array',
        items: {
          type: 'objectId',
          ref: 'MealPlan'
        }
      }
    }
  },
  combinable: {
    type: 'boolean',
    default: false
  },
  visibility: {
    type: 'object',
    properties: {
      b2c: { type: 'boolean', default: true },
      b2b: { type: 'boolean', default: true }
    }
  },
  applicationType: {
    type: 'string',
    enum: {
      values: PROMO_CODE_APPLICATION_TYPES,
      message: 'INVALID_APPLICATION_TYPE'
    },
    default: 'stay'
  },
  calculationType: {
    type: 'string',
    enum: {
      values: PROMO_CODE_CALCULATION_TYPES,
      message: 'INVALID_CALCULATION_TYPE'
    },
    default: 'cumulative'
  },
  priority: {
    type: 'number',
    default: 0
  }
}

// ==========================================
// CREATE VALIDATION SCHEMA (Frontend)
// ==========================================

export const promoCodeCreateValidation = {
  code: {
    required: true,
    validate: v => v && PROMO_CODE_PATTERN.test(v.toUpperCase()),
    message: 'INVALID_PROMO_CODE_FORMAT'
  },
  hotel: {
    required: true,
    validate: v => !!v,
    message: 'REQUIRED_HOTEL'
  },
  'discount.type': {
    required: true,
    validate: v => PROMO_CODE_DISCOUNT_TYPES.includes(v),
    message: 'REQUIRED_DISCOUNT_TYPE'
  },
  'discount.value': {
    required: false,
    validate: (v, data) => {
      const discountType = data?.discount?.type
      if (discountType === 'percentage') return v > 0 && v <= 100
      if (discountType === 'fixed') return v > 0
      return true // free_nights doesn't require value
    },
    message: 'INVALID_DISCOUNT_VALUE'
  },
  'bookingWindow.startDate': {
    required: true,
    validate: validateDate,
    message: 'REQUIRED_BOOKING_START_DATE'
  },
  'bookingWindow.endDate': {
    required: true,
    validate: (v, data) => {
      if (!validateDate(v)) return false
      if (data?.bookingWindow?.startDate) {
        return new Date(v) >= new Date(data.bookingWindow.startDate)
      }
      return true
    },
    message: 'INVALID_BOOKING_END_DATE'
  },
  'stayWindow.startDate': {
    required: true,
    validate: validateDate,
    message: 'REQUIRED_STAY_START_DATE'
  },
  'stayWindow.endDate': {
    required: true,
    validate: (v, data) => {
      if (!validateDate(v)) return false
      if (data?.stayWindow?.startDate) {
        return new Date(v) >= new Date(data.stayWindow.startDate)
      }
      return true
    },
    message: 'INVALID_STAY_END_DATE'
  }
}

// ==========================================
// UPDATE VALIDATION SCHEMA (Partial - Frontend)
// ==========================================

export const promoCodeUpdateValidation = {
  code: {
    required: false,
    validate: v => !v || PROMO_CODE_PATTERN.test(v.toUpperCase()),
    message: 'INVALID_PROMO_CODE_FORMAT'
  },
  'discount.type': {
    required: false,
    validate: v => !v || PROMO_CODE_DISCOUNT_TYPES.includes(v),
    message: 'INVALID_DISCOUNT_TYPE'
  },
  'discount.value': {
    required: false,
    validate: (v, data) => {
      if (v === undefined || v === null) return true
      const discountType = data?.discount?.type
      if (discountType === 'percentage') return v > 0 && v <= 100
      if (discountType === 'fixed') return v > 0
      return true
    },
    message: 'INVALID_DISCOUNT_VALUE'
  },
  'bookingWindow.endDate': {
    required: false,
    validate: (v, data) => {
      if (!v) return true
      if (!validateDate(v)) return false
      if (data?.bookingWindow?.startDate) {
        return new Date(v) >= new Date(data.bookingWindow.startDate)
      }
      return true
    },
    message: 'INVALID_BOOKING_END_DATE'
  },
  'stayWindow.endDate': {
    required: false,
    validate: (v, data) => {
      if (!v) return true
      if (!validateDate(v)) return false
      if (data?.stayWindow?.startDate) {
        return new Date(v) >= new Date(data.stayWindow.startDate)
      }
      return true
    },
    message: 'INVALID_STAY_END_DATE'
  },
  status: {
    required: false,
    validate: v => !v || PROMO_CODE_STATUSES.includes(v),
    message: 'INVALID_STATUS'
  }
}

// ==========================================
// PROMO CODE APPLY SCHEMA (Public Widget)
// ==========================================

export const promoCodeApplyValidation = {
  code: {
    required: true,
    validate: v => v && v.trim().length >= 3,
    message: 'REQUIRED_PROMO_CODE'
  },
  hotelId: {
    required: true,
    validate: v => !!v,
    message: 'REQUIRED_HOTEL'
  },
  checkIn: {
    required: true,
    validate: validateDate,
    message: 'REQUIRED_CHECK_IN'
  },
  checkOut: {
    required: true,
    validate: validateDate,
    message: 'REQUIRED_CHECK_OUT'
  }
}

export default {
  promoCode: promoCodeSchema,
  promoCodeCreateValidation,
  promoCodeUpdateValidation,
  promoCodeApplyValidation,
  PROMO_CODE_DISCOUNT_TYPES,
  PROMO_CODE_STATUSES,
  PROMO_CODE_APPLICATION_TYPES,
  PROMO_CODE_CALCULATION_TYPES,
  PROMO_CODE_PATTERN
}
