/**
 * Payment Installment Schema - Single Source of Truth
 *
 * Validation schema for credit card installment data.
 * Used by both backend (Mongoose) and frontend (Vue).
 */

import { CURRENCY_CODES } from '../validators/common.js'

// ==========================================
// INSTALLMENT ENUMS
// ==========================================

// Standard installment counts in Turkey (tekil, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12 taksit)
export const INSTALLMENT_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]

export const INSTALLMENT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled']

export const CARD_BRANDS = ['visa', 'mastercard', 'amex', 'troy']

export const CARD_FAMILIES = [
  'bonus',
  'world',
  'maximum',
  'cardfinans',
  'bankkart',
  'paraf',
  'axess',
  'advantage',
  'combo',
  'miles',
  'other'
]

// ==========================================
// INSTALLMENT SCHEMA (Full - for Mongoose)
// ==========================================

export const installmentSchema = {
  installmentCount: {
    type: 'number',
    required: [true, 'REQUIRED_INSTALLMENT_COUNT'],
    enum: {
      values: INSTALLMENT_COUNTS,
      message: 'INVALID_INSTALLMENT_COUNT'
    },
    default: 1
  },
  amount: {
    type: 'number',
    required: [true, 'REQUIRED_AMOUNT'],
    min: [0.01, 'MIN_AMOUNT']
  },
  currency: {
    type: 'string',
    required: [true, 'REQUIRED_CURRENCY'],
    enum: {
      values: CURRENCY_CODES,
      message: 'INVALID_CURRENCY'
    },
    default: 'TRY',
    uppercase: true
  },
  // Per-installment amount (total / count)
  installmentAmount: {
    type: 'number',
    min: [0.01, 'MIN_AMOUNT']
  },
  // Extra cost added by bank for installment (if any)
  interestRate: {
    type: 'number',
    min: [0, 'MIN_INTEREST_RATE_0'],
    max: [100, 'MAX_INTEREST_RATE_100'],
    default: 0
  },
  // Total amount including interest
  totalWithInterest: {
    type: 'number',
    min: [0.01, 'MIN_AMOUNT']
  },
  // Card info
  cardBrand: {
    type: 'string',
    enum: {
      values: CARD_BRANDS,
      message: 'INVALID_CARD_BRAND'
    }
  },
  cardFamily: {
    type: 'string',
    enum: {
      values: CARD_FAMILIES,
      message: 'INVALID_CARD_FAMILY'
    }
  },
  lastFour: {
    type: 'string',
    minLength: [4, 'LAST_FOUR_LENGTH'],
    maxLength: [4, 'LAST_FOUR_LENGTH']
  },
  bankName: {
    type: 'string',
    trim: true
  },
  // Gateway reference
  gatewayTransactionId: {
    type: 'string',
    trim: true
  },
  gatewayPosId: {
    type: 'string',
    trim: true
  },
  // Status
  status: {
    type: 'string',
    enum: {
      values: INSTALLMENT_STATUSES,
      message: 'INVALID_STATUS'
    },
    default: 'pending'
  },
  processedAt: {
    type: 'date'
  }
}

// ==========================================
// INSTALLMENT OPTION SCHEMA
// (Returned by gateway: available installment options)
// ==========================================

export const installmentOptionSchema = {
  count: {
    type: 'number',
    required: [true, 'REQUIRED_INSTALLMENT_COUNT'],
    enum: {
      values: INSTALLMENT_COUNTS,
      message: 'INVALID_INSTALLMENT_COUNT'
    }
  },
  installmentAmount: {
    type: 'number',
    required: [true, 'REQUIRED_INSTALLMENT_AMOUNT'],
    min: [0.01, 'MIN_AMOUNT']
  },
  totalAmount: {
    type: 'number',
    required: [true, 'REQUIRED_TOTAL_AMOUNT'],
    min: [0.01, 'MIN_AMOUNT']
  },
  interestRate: {
    type: 'number',
    min: [0, 'MIN_INTEREST_RATE_0'],
    default: 0
  },
  // Whether bank charges extra for this installment option
  hasInterest: {
    type: 'boolean',
    default: false
  }
}

// ==========================================
// CREATE VALIDATION SCHEMA (Frontend)
// ==========================================

export const installmentCreateValidation = {
  installmentCount: {
    required: true,
    validate: v => INSTALLMENT_COUNTS.includes(Number(v)),
    message: 'INVALID_INSTALLMENT_COUNT'
  },
  amount: {
    required: true,
    validate: v => v && Number(v) > 0,
    message: 'REQUIRED_AMOUNT'
  },
  currency: {
    required: true,
    validate: v => v && CURRENCY_CODES.includes(v.toUpperCase()),
    message: 'INVALID_CURRENCY'
  }
}

// ==========================================
// UPDATE VALIDATION SCHEMA (Partial - Frontend)
// ==========================================

export const installmentUpdateValidation = {
  installmentCount: {
    required: false,
    validate: v => !v || INSTALLMENT_COUNTS.includes(Number(v)),
    message: 'INVALID_INSTALLMENT_COUNT'
  },
  amount: {
    required: false,
    validate: v => v === undefined || v === null || Number(v) > 0,
    message: 'INVALID_AMOUNT'
  },
  currency: {
    required: false,
    validate: v => !v || CURRENCY_CODES.includes(v.toUpperCase()),
    message: 'INVALID_CURRENCY'
  },
  status: {
    required: false,
    validate: v => !v || INSTALLMENT_STATUSES.includes(v),
    message: 'INVALID_STATUS'
  }
}

// ==========================================
// INSTALLMENT SELECTION SCHEMA (Widget/Public)
// ==========================================

export const installmentSelectValidation = {
  installmentCount: {
    required: true,
    validate: v => INSTALLMENT_COUNTS.includes(Number(v)),
    message: 'INVALID_INSTALLMENT_COUNT'
  },
  amount: {
    required: true,
    validate: v => v && Number(v) >= 0.01,
    message: 'REQUIRED_AMOUNT'
  },
  currency: {
    required: true,
    validate: v => v && CURRENCY_CODES.includes(v.toUpperCase()),
    message: 'INVALID_CURRENCY'
  }
}

export default {
  installment: installmentSchema,
  installmentOption: installmentOptionSchema,
  installmentCreateValidation,
  installmentUpdateValidation,
  installmentSelectValidation,
  INSTALLMENT_COUNTS,
  INSTALLMENT_STATUSES,
  CARD_BRANDS,
  CARD_FAMILIES
}
