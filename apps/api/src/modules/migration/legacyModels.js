import mongoose from 'mongoose'
import { getLegacyConnection } from './legacyDb.js'

const { Schema } = mongoose

// Cache models to avoid re-registration
const modelCache = {}

/**
 * Get or create a model on the legacy connection
 */
function getModel(name, schema, collectionName) {
  const conn = getLegacyConnection()
  if (!conn) throw new Error('Legacy DB not connected')

  const cacheKey = `${name}_${conn.id}`
  if (modelCache[cacheKey]) return modelCache[cacheKey]

  // Check if model already registered on this connection
  try {
    modelCache[cacheKey] = conn.model(name)
  } catch {
    modelCache[cacheKey] = conn.model(name, schema, collectionName)
  }

  return modelCache[cacheKey]
}

// ========================
// Account Schema (read-only)
// ========================
const accountSchema = new Schema(
  {
    id: Number,
    type: String, // 'corporate', 'individual'
    corporateType: String, // 'hotelier', 'agency'
    companyName: String,
    founder: String,
    status: Schema.Types.Mixed,
    inventories: Schema.Types.Mixed,
    email: String,
    companyPhone: String
  },
  { strict: false, collection: 'accounts' }
)

// ========================
// Hotel Schema (read-only)
// ========================
const hotelSchema = new Schema(
  {
    id: Number,
    account: Number,
    name: String,
    status: Schema.Types.Mixed,
    details: {
      factSheet: Schema.Types.Mixed, // [{lang, value}]
      rating: Number,
      propertyType: Number,
      checkinTime: String,
      checkoutTime: String
    },
    location: {
      city: Schema.Types.Mixed,
      country: Schema.Types.Mixed,
      district: Schema.Types.Mixed,
      address: Schema.Types.Mixed,
      lat: Schema.Types.Mixed,
      lng: Schema.Types.Mixed
    },
    contact: {
      phone: String,
      email: String,
      website: String
    },
    amenities: {
      standard: [Number]
    },
    policies: Schema.Types.Mixed,
    photos: [
      {
        id: Schema.Types.Mixed,
        order: Number,
        status: Schema.Types.Mixed
      }
    ],
    currency: String,
    age: {
      infant: Number,
      child: Number
    },
    languages: Schema.Types.Mixed,
    salesChannel: Schema.Types.Mixed,
    code: String
  },
  { strict: false, collection: 'hotels' }
)

// ========================
// Room Schema (read-only)
// ========================
const roomSchema = new Schema(
  {
    id: Number,
    hotel: Number,
    name: Schema.Types.Mixed, // [{lang, value}] or string
    code: String,
    status: Schema.Types.Mixed,
    maxOccupant: Number,
    maxAdult: Number,
    roomCount: Number,
    size: Number,
    onlyAdult: Schema.Types.Mixed,
    photos: [
      {
        id: Schema.Types.Mixed,
        order: Number,
        status: Schema.Types.Mixed
      }
    ],
    pricing: {
      isBase: Schema.Types.Mixed
    },
    description: Schema.Types.Mixed, // [{lang, value}]
    occupancyAdjustments: Schema.Types.Mixed,
    calculation: Schema.Types.Mixed,
    amenities: Schema.Types.Mixed,
    viewTypes: Schema.Types.Mixed
  },
  { strict: false, collection: 'rooms' }
)

// ========================
// PricePlan Schema (read-only)
// ========================
const pricePlanSchema = new Schema(
  {
    id: Number,
    hotel: Number,
    name: Schema.Types.Mixed, // [{lang, value}] or string
    code: String,
    status: Schema.Types.Mixed,
    pricing: {
      isBase: Schema.Types.Mixed
    },
    rateType: String
  },
  { strict: false, collection: 'priceplans' }
)

// ========================
// Market Schema (read-only)
// ========================
const marketSchema = new Schema(
  {
    id: Number,
    hotel: Number,
    name: String,
    status: Schema.Types.Mixed,
    currency: String,
    countries: Schema.Types.Mixed,
    channel: Schema.Types.Mixed,
    commission: Schema.Types.Mixed,
    deposit: Schema.Types.Mixed,
    advanceDiscount: Schema.Types.Mixed,
    bankTransfer: Schema.Types.Mixed,
    payOnArrival: Schema.Types.Mixed
  },
  { strict: false, collection: 'markets' }
)

// ========================
// Location Models (read-only)
// ========================
const citySchema = new Schema(
  {
    id: Number,
    name: Schema.Types.Mixed,
    country: Schema.Types.Mixed
  },
  { strict: false, collection: 'cities' }
)

const countrySchema = new Schema(
  {
    id: Number,
    name: Schema.Types.Mixed,
    code: String
  },
  { strict: false, collection: 'countries' }
)

// ========================
// Exported getters
// ========================
export function LegacyAccount() {
  return getModel('LegacyAccount', accountSchema, 'accounts')
}

export function LegacyHotel() {
  return getModel('LegacyHotel', hotelSchema, 'hotels')
}

export function LegacyRoom() {
  return getModel('LegacyRoom', roomSchema, 'rooms')
}

export function LegacyPricePlan() {
  return getModel('LegacyPricePlan', pricePlanSchema, 'priceplans')
}

export function LegacyMarket() {
  return getModel('LegacyMarket', marketSchema, 'markets')
}

export function LegacyCity() {
  return getModel('LegacyCity', citySchema, 'cities')
}

export function LegacyCountry() {
  return getModel('LegacyCountry', countrySchema, 'countries')
}

/**
 * Clear model cache (call on disconnect)
 */
export function clearModelCache() {
  Object.keys(modelCache).forEach(key => delete modelCache[key])
}
