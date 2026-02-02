/**
 * @booking-engine/constants
 * Centralized constants for the booking engine
 *
 * Usage:
 *   import { CURRENCY_CODES, BOOKING_STATUS } from '@booking-engine/constants'
 *   import { ADMIN_LANGUAGES } from '@booking-engine/constants/languages'
 */

// Languages
export {
  ADMIN_LANGUAGES,
  B2C_LANGUAGES,
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  LANGUAGE_FLAGS,
  createMultiLangObject,
  multiLangString,
  adminLangString,
  b2cLangString
} from './languages.js'

// Currencies
export {
  CURRENCY_CODES,
  DEFAULT_CURRENCY,
  CURRENCY_SYMBOLS,
  CURRENCY_LABELS,
  CURRENCY_OPTIONS,
  validateCurrency,
  getCurrencySymbol,
  formatCurrency
} from './currencies.js'

// Payment
export {
  PAYMENT_METHODS,
  PAYMENT_METHOD_VALUES,
  PAYMENT_METHOD_LABELS_TR,
  PAYMENT_METHOD_LABELS_EN,
  PAYMENT_STATUS,
  PAYMENT_STATUS_VALUES,
  getPaymentMethodLabel,
  getPaymentMethodOptions
} from './payment.js'

// Transaction
export {
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_VALUES,
  TRANSACTION_CATEGORIES,
  TRANSACTION_CATEGORY_VALUES,
  TRANSACTION_TYPE_LABELS_TR,
  TRANSACTION_TYPE_LABELS_EN,
  TRANSACTION_TYPE_TO_CATEGORY,
  getTransactionTypeLabel,
  getTransactionCategory
} from './transaction.js'

// Booking
export {
  BOOKING_STATUS,
  BOOKING_STATUS_VALUES,
  BOOKING_SOURCES,
  BOOKING_SOURCE_VALUES,
  BOOKING_TYPES,
  BOOKING_TYPE_VALUES,
  BOOKING_STATUS_LABELS_TR,
  BOOKING_STATUS_LABELS_EN,
  BOOKING_SOURCE_LABELS_TR,
  BOOKING_SOURCE_LABELS_EN,
  BOOKING_STATUS_COLORS,
  getBookingStatusLabel,
  getBookingSourceLabel,
  getBookingStatusColor
} from './booking.js'

// Status
export {
  ENTITY_STATUS,
  ENTITY_STATUS_VALUES,
  ROOM_STATUS,
  ROOM_STATUS_VALUES,
  HOUSEKEEPING_STATUS,
  HOUSEKEEPING_STATUS_VALUES,
  STAY_STATUS,
  STAY_STATUS_VALUES,
  ENTITY_STATUS_LABELS_TR,
  ENTITY_STATUS_LABELS_EN,
  ROOM_STATUS_LABELS_TR,
  ROOM_STATUS_LABELS_EN,
  HOUSEKEEPING_STATUS_LABELS_TR,
  HOUSEKEEPING_STATUS_LABELS_EN,
  STAY_STATUS_LABELS_TR,
  STAY_STATUS_LABELS_EN,
  STATUS_COLORS,
  ROOM_STATUS_COLORS,
  HOUSEKEEPING_STATUS_COLORS,
  getEntityStatusLabel,
  getRoomStatusLabel,
  getHousekeepingStatusLabel,
  getStayStatusLabel
} from './status.js'

// Storefront
export {
  SECTION_TYPES,
  SECTION_TYPE_VALUES,
  SECTION_CATEGORIES,
  SECTION_CATEGORY_VALUES,
  SECTION_CONFIG,
  UI_SECTION_ALIASES,
  CANONICAL_TO_UI_ALIAS,
  toCanonicalSectionType,
  toUiSectionType,
  isValidSectionType,
  getSectionConfig,
  getSectionCategory,
  getSectionMaxCount,
  isHeroSection,
  isFooterSection,
  validateSectionConfig,
  SECTION_LABEL_KEYS,
  getSectionLabelKey,
  PUBLIC_STOREFRONT_FIELDS,
  ADMIN_ONLY_FIELDS,
  STOREFRONT_DRAFT_ALLOWED_FIELDS
} from './storefront.js'
