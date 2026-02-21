/**
 * Partner Schema - Single Source of Truth
 *
 * Validation schema for partner data.
 * Used by both backend (Mongoose) and frontend (Vue).
 */

import { validateEmail } from '../validators/email.js'
import { validatePhone } from '../validators/phone.js'

// ==========================================
// PARTNER ENUMS
// ==========================================

export const PARTNER_TYPES = ['hotel_chain', 'tour_operator', 'dmc', 'independent']

export const PARTNER_STATUSES = ['pending', 'active', 'suspended', 'inactive']

export const COMMISSION_TYPES = ['percentage', 'fixed']

// ==========================================
// PARTNER SCHEMA
// ==========================================

export const partnerSchema = {
  name: {
    type: 'string',
    required: [true, 'REQUIRED_NAME'],
    minLength: [2, 'MIN_LENGTH_2'],
    maxLength: [200, 'MAX_LENGTH_200'],
    trim: true
  },
  code: {
    type: 'string',
    required: [true, 'REQUIRED_CODE'],
    uppercase: true,
    trim: true,
    unique: true
  },
  type: {
    type: 'string',
    enum: {
      values: PARTNER_TYPES,
      message: 'INVALID_PARTNER_TYPE'
    },
    default: 'independent'
  },
  status: {
    type: 'string',
    enum: {
      values: PARTNER_STATUSES,
      message: 'INVALID_STATUS'
    },
    default: 'pending'
  },
  logo: {
    type: 'string',
    trim: true
  },
  website: {
    type: 'string',
    trim: true
  }
}

// ==========================================
// PARTNER CONTACT SCHEMA
// ==========================================

export const partnerContactSchema = {
  contactPerson: {
    type: 'string',
    required: [true, 'REQUIRED_CONTACT_PERSON'],
    trim: true
  },
  email: {
    type: 'string',
    required: [true, 'REQUIRED_EMAIL'],
    validate: {
      validator: validateEmail,
      message: 'INVALID_EMAIL'
    },
    lowercase: true,
    trim: true
  },
  phone: {
    type: 'string',
    required: [true, 'REQUIRED_PHONE'],
    validate: {
      validator: validatePhone,
      message: 'INVALID_PHONE'
    }
  },
  alternatePhone: {
    type: 'string',
    validate: {
      validator: v => !v || validatePhone(v),
      message: 'INVALID_PHONE'
    }
  }
}

// ==========================================
// PARTNER ADDRESS SCHEMA
// ==========================================

export const partnerAddressSchema = {
  street: {
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
  }
}

// ==========================================
// PARTNER BILLING SCHEMA
// ==========================================

export const partnerBillingSchema = {
  companyName: {
    type: 'string',
    required: [true, 'REQUIRED_COMPANY_NAME'],
    trim: true
  },
  taxNumber: {
    type: 'string',
    required: [true, 'REQUIRED_TAX_NUMBER'],
    trim: true
  },
  taxOffice: {
    type: 'string',
    trim: true
  },
  bankName: {
    type: 'string',
    trim: true
  },
  iban: {
    type: 'string',
    uppercase: true,
    trim: true
  },
  swift: {
    type: 'string',
    uppercase: true,
    trim: true
  }
}

// ==========================================
// PARTNER SETTINGS SCHEMA
// ==========================================

export const partnerSettingsSchema = {
  defaultCurrency: {
    type: 'string',
    enum: {
      values: ['TRY', 'USD', 'EUR', 'GBP', 'RUB'],
      message: 'INVALID_CURRENCY'
    },
    default: 'TRY'
  },
  defaultLanguage: {
    type: 'string',
    default: 'tr'
  },
  commission: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: { values: COMMISSION_TYPES },
        default: 'percentage'
      },
      value: {
        type: 'number',
        min: [0, 'MIN_COMMISSION_0'],
        max: [100, 'MAX_COMMISSION_100'],
        default: 0
      }
    }
  },
  markup: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: { values: COMMISSION_TYPES },
        default: 'percentage'
      },
      value: {
        type: 'number',
        min: [0, 'MIN_MARKUP_0'],
        default: 0
      }
    }
  },
  paymentTerms: {
    type: 'number',
    min: [0, 'MIN_PAYMENT_TERMS_0'],
    max: [90, 'MAX_PAYMENT_TERMS_90'],
    default: 30
  },
  creditLimit: {
    type: 'number',
    min: [0, 'MIN_CREDIT_LIMIT_0'],
    default: 0
  }
}

// ==========================================
// PARTNER TYPES (from actual model)
// ==========================================

export const PARTNER_MODEL_TYPES = ['hotel', 'agency', 'web']
export const PARTNER_CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP']

// ==========================================
// CREATE VALIDATION SCHEMA (Frontend)
// ==========================================

export const partnerCreateValidation = {
  name: {
    required: true,
    validate: v => v && v.trim().length >= 2,
    message: 'REQUIRED_NAME'
  },
  email: {
    required: true,
    validate: validateEmail,
    message: 'INVALID_EMAIL'
  },
  phone: {
    required: false,
    validate: v => !v || validatePhone(v),
    message: 'INVALID_PHONE'
  },
  'companyInfo.companyName': {
    required: false,
    validate: v => !v || v.trim().length >= 2,
    message: 'INVALID_COMPANY_NAME'
  },
  'companyInfo.taxNumber': {
    required: false,
    validate: v => !v || v.trim().length >= 10,
    message: 'INVALID_TAX_NUMBER'
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
  }
}

// ==========================================
// UPDATE VALIDATION SCHEMA (Partial - Frontend)
// ==========================================

export const partnerUpdateValidation = {
  name: {
    required: false,
    validate: v => !v || v.trim().length >= 2,
    message: 'INVALID_NAME'
  },
  email: {
    required: false,
    validate: v => !v || validateEmail(v),
    message: 'INVALID_EMAIL'
  },
  phone: {
    required: false,
    validate: v => !v || validatePhone(v),
    message: 'INVALID_PHONE'
  },
  status: {
    required: false,
    validate: v => !v || PARTNER_STATUSES.includes(v),
    message: 'INVALID_STATUS'
  },
  'companyInfo.companyName': {
    required: false,
    validate: v => !v || v.trim().length >= 2,
    message: 'INVALID_COMPANY_NAME'
  },
  'companyInfo.taxNumber': {
    required: false,
    validate: v => !v || v.trim().length >= 10,
    message: 'INVALID_TAX_NUMBER'
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
  currency: {
    required: false,
    validate: v => !v || PARTNER_CURRENCIES.includes(v.toUpperCase()),
    message: 'INVALID_CURRENCY'
  }
}

export default {
  partner: partnerSchema,
  partnerContact: partnerContactSchema,
  partnerAddress: partnerAddressSchema,
  partnerBilling: partnerBillingSchema,
  partnerSettings: partnerSettingsSchema,
  partnerCreateValidation,
  partnerUpdateValidation,
  PARTNER_TYPES,
  PARTNER_STATUSES,
  PARTNER_MODEL_TYPES,
  PARTNER_CURRENCIES,
  COMMISSION_TYPES
}
