/**
 * Hotel Schema - Single Source of Truth
 *
 * Validation schema for hotel data.
 * Used by both backend (Mongoose) and frontend (Vue).
 */

import { validateEmail } from '../validators/email.js'
import { validatePhone } from '../validators/phone.js'

// ==========================================
// HOTEL ENUMS
// ==========================================

export const HOTEL_TYPES = [
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
]

export const HOTEL_CATEGORIES = [
  'economy',
  'standard',
  'superior',
  'deluxe',
  'luxury',
  'ultra-luxury'
]

export const HOTEL_STATUSES = ['draft', 'active', 'inactive']

export const HOTEL_OWNERSHIP_TYPES = ['base', 'partner', 'linked']

// ==========================================
// HOTEL SCHEMA
// ==========================================

export const hotelSchema = {
  hotelType: {
    type: 'string',
    enum: {
      values: HOTEL_OWNERSHIP_TYPES,
      message: 'INVALID_HOTEL_TYPE'
    },
    default: 'partner'
  },
  partner: {
    type: 'objectId',
    ref: 'Partner'
  },
  hotelBase: {
    type: 'objectId',
    ref: 'Hotel'
  },
  status: {
    type: 'string',
    enum: {
      values: HOTEL_STATUSES,
      message: 'INVALID_STATUS'
    },
    default: 'draft'
  },
  name: {
    type: 'string',
    required: [true, 'REQUIRED_NAME'],
    minLength: [2, 'MIN_LENGTH_2'],
    maxLength: [200, 'MAX_LENGTH_200'],
    trim: true
  },
  description: {
    type: 'object', // Multilingual
    properties: {} // Dynamic language keys
  },
  slug: {
    type: 'string',
    lowercase: true,
    trim: true
  },
  logo: {
    type: 'string',
    trim: true
  },
  stars: {
    type: 'number',
    min: [1, 'HOTEL_STARS_MIN'],
    max: [5, 'HOTEL_STARS_MAX'],
    default: 3
  },
  type: {
    type: 'string',
    enum: {
      values: HOTEL_TYPES,
      message: 'INVALID_HOTEL_TYPE'
    },
    default: 'hotel'
  },
  category: {
    type: 'string',
    enum: {
      values: HOTEL_CATEGORIES,
      message: 'INVALID_CATEGORY'
    },
    default: 'standard'
  },
  visibility: {
    type: 'object',
    properties: {
      b2c: { type: 'boolean', default: true },
      b2b: { type: 'boolean', default: true }
    }
  }
}

// ==========================================
// HOTEL ADDRESS SCHEMA
// ==========================================

export const hotelAddressSchema = {
  street: {
    type: 'string',
    trim: true
  },
  district: {
    type: 'string',
    trim: true
  },
  city: {
    type: 'string',
    required: [true, 'REQUIRED_CITY'],
    trim: true
  },
  country: {
    type: 'string',
    required: [true, 'REQUIRED_COUNTRY'],
    trim: true
  },
  postalCode: {
    type: 'string',
    trim: true
  },
  coordinates: {
    type: 'object',
    properties: {
      lat: { type: 'number' },
      lng: { type: 'number' }
    }
  },
  formattedAddress: {
    type: 'string',
    trim: true
  },
  placeId: {
    type: 'string',
    trim: true
  }
}

// ==========================================
// HOTEL CONTACT SCHEMA
// ==========================================

export const hotelContactSchema = {
  phone: {
    type: 'string',
    validate: {
      validator: v => !v || validatePhone(v),
      message: 'INVALID_PHONE'
    }
  },
  fax: {
    type: 'string'
  },
  email: {
    type: 'string',
    validate: {
      validator: v => !v || validateEmail(v),
      message: 'INVALID_EMAIL'
    },
    lowercase: true,
    trim: true
  },
  website: {
    type: 'string',
    trim: true
  },
  reservationEmail: {
    type: 'string',
    validate: {
      validator: v => !v || validateEmail(v),
      message: 'INVALID_EMAIL'
    },
    lowercase: true,
    trim: true
  },
  reservationPhone: {
    type: 'string',
    validate: {
      validator: v => !v || validatePhone(v),
      message: 'INVALID_PHONE'
    }
  }
}

// ==========================================
// HOTEL POLICIES SCHEMA
// ==========================================

export const hotelPoliciesSchema = {
  checkInTime: {
    type: 'string',
    default: '14:00'
  },
  checkOutTime: {
    type: 'string',
    default: '12:00'
  },
  minAge: {
    type: 'number',
    min: [0, 'MIN_AGE_0'],
    max: [21, 'MAX_AGE_21'],
    default: 18
  },
  childPolicy: {
    type: 'object',
    properties: {
      maxChildAge: { type: 'number', default: 12 },
      infantAge: { type: 'number', default: 2 },
      freeChildAge: { type: 'number', default: 6 }
    }
  },
  petPolicy: {
    type: 'string',
    enum: {
      values: ['not_allowed', 'allowed', 'allowed_with_fee'],
      message: 'INVALID_PET_POLICY'
    },
    default: 'not_allowed'
  },
  smokingPolicy: {
    type: 'string',
    enum: {
      values: ['non_smoking', 'smoking_areas', 'smoking_rooms'],
      message: 'INVALID_SMOKING_POLICY'
    },
    default: 'non_smoking'
  }
}

// ==========================================
// CANCELLATION RULE SCHEMA
// ==========================================

export const cancellationRuleSchema = {
  daysBeforeCheckIn: {
    type: 'number',
    required: [true, 'REQUIRED_DAYS'],
    min: [0, 'MIN_DAYS_0']
  },
  refundPercent: {
    type: 'number',
    required: [true, 'REQUIRED_REFUND_PERCENT'],
    min: [0, 'MIN_PERCENT_0'],
    max: [100, 'MAX_PERCENT_100']
  },
  description: {
    type: 'object' // Multilingual
  }
}

// ==========================================
// CREATE VALIDATION SCHEMA (Frontend)
// ==========================================

export const hotelCreateValidation = {
  name: {
    required: true,
    validate: v => v && v.trim().length >= 2,
    message: 'REQUIRED_NAME'
  },
  'address.city': {
    required: true,
    validate: v => v && v.trim().length >= 1,
    message: 'REQUIRED_CITY'
  },
  'address.country': {
    required: true,
    validate: v => v && v.trim().length >= 1,
    message: 'REQUIRED_COUNTRY'
  },
  stars: {
    required: false,
    validate: v => !v || (Number(v) >= 1 && Number(v) <= 5),
    message: 'INVALID_HOTEL_STARS'
  },
  type: {
    required: false,
    validate: v => !v || HOTEL_TYPES.includes(v),
    message: 'INVALID_HOTEL_TYPE'
  },
  category: {
    required: false,
    validate: v => !v || HOTEL_CATEGORIES.includes(v),
    message: 'INVALID_CATEGORY'
  },
  'contact.email': {
    required: false,
    validate: v => !v || validateEmail(v),
    message: 'INVALID_EMAIL'
  },
  'contact.phone': {
    required: false,
    validate: v => !v || validatePhone(v),
    message: 'INVALID_PHONE'
  },
  'contact.reservationEmail': {
    required: false,
    validate: v => !v || validateEmail(v),
    message: 'INVALID_EMAIL'
  },
  'contact.reservationPhone': {
    required: false,
    validate: v => !v || validatePhone(v),
    message: 'INVALID_PHONE'
  }
}

// ==========================================
// UPDATE VALIDATION SCHEMA (Partial - Frontend)
// ==========================================

export const hotelUpdateValidation = {
  name: {
    required: false,
    validate: v => !v || v.trim().length >= 2,
    message: 'INVALID_NAME'
  },
  stars: {
    required: false,
    validate: v => v === undefined || v === null || (Number(v) >= 1 && Number(v) <= 5),
    message: 'INVALID_HOTEL_STARS'
  },
  type: {
    required: false,
    validate: v => !v || HOTEL_TYPES.includes(v),
    message: 'INVALID_HOTEL_TYPE'
  },
  category: {
    required: false,
    validate: v => !v || HOTEL_CATEGORIES.includes(v),
    message: 'INVALID_CATEGORY'
  },
  status: {
    required: false,
    validate: v => !v || HOTEL_STATUSES.includes(v),
    message: 'INVALID_STATUS'
  },
  'contact.email': {
    required: false,
    validate: v => !v || validateEmail(v),
    message: 'INVALID_EMAIL'
  },
  'contact.phone': {
    required: false,
    validate: v => !v || validatePhone(v),
    message: 'INVALID_PHONE'
  },
  'contact.reservationEmail': {
    required: false,
    validate: v => !v || validateEmail(v),
    message: 'INVALID_EMAIL'
  },
  'contact.reservationPhone': {
    required: false,
    validate: v => !v || validatePhone(v),
    message: 'INVALID_PHONE'
  }
}

export default {
  hotel: hotelSchema,
  hotelAddress: hotelAddressSchema,
  hotelContact: hotelContactSchema,
  hotelPolicies: hotelPoliciesSchema,
  cancellationRule: cancellationRuleSchema,
  hotelCreateValidation,
  hotelUpdateValidation,
  HOTEL_TYPES,
  HOTEL_CATEGORIES,
  HOTEL_STATUSES,
  HOTEL_OWNERSHIP_TYPES
}
