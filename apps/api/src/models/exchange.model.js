/**
 * Exchange Rate Model
 * Fetches and stores exchange rates from TCMB (Turkish Central Bank)
 */

import mongoose from 'mongoose'
import axios from 'axios'
import xml2js from 'xml2js'
import logger from '../core/logger.js'

const parser = new xml2js.Parser({
  explicitRoot: false,
  explicitArray: false,
  mergeAttrs: true,
  attrValueProcessors: [(value) => value.toLowerCase()]
})

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  'TRY', 'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CNY',
  'AUD', 'CAD', 'DKK', 'SEK', 'NOK', 'SAR', 'KWD',
  'AED', 'BGN', 'RON', 'RUB', 'IRR', 'PKR', 'QAR',
  'KRW', 'AZN', 'XDR'
]

// Rate schema for each currency
const rateSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    uppercase: true
  },
  value: {
    type: Number,
    required: true,
    default: 1
  },
  // Forex buying rate
  forexBuying: {
    type: Number
  },
  // Forex selling rate
  forexSelling: {
    type: Number
  },
  // Banknote buying rate
  banknoteBuying: {
    type: Number
  },
  // Banknote selling rate
  banknoteSelling: {
    type: Number
  }
}, { _id: false })

// Main exchange schema
const exchangeSchema = new mongoose.Schema({
  // TCMB bulletin number
  bulletin: {
    type: String
  },
  // Date from TCMB
  date: {
    type: Date
  },
  // Base currency (always TRY for TCMB)
  baseCurrency: {
    type: String,
    default: 'TRY',
    uppercase: true
  },
  // All rates
  rates: [rateSchema],
  // Source of rates
  source: {
    type: String,
    enum: ['tcmb', 'manual', 'fallback'],
    default: 'tcmb'
  },
  // Is this the active/current rate set?
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'exchange_rates'
})

// Index for faster queries
exchangeSchema.index({ createdAt: -1 })
exchangeSchema.index({ isActive: 1, createdAt: -1 })

/**
 * Fetch rates from TCMB
 */
exchangeSchema.statics.fetchFromTCMB = async function() {
  try {
    const response = await axios.get('https://www.tcmb.gov.tr/kurlar/today.xml', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookingEngine/1.0)'
      }
    })

    const result = await parser.parseStringPromise(response.data)

    if (!result || !result.Currency) {
      throw new Error('Invalid TCMB response format')
    }

    // Parse rates from XML
    const currencies = Array.isArray(result.Currency) ? result.Currency : [result.Currency]

    const rates = currencies.map(item => ({
      code: item.CurrencyCode || item.kod,
      value: parseFloat(item.ForexBuying) || parseFloat(item.ForexSelling) || 1,
      forexBuying: parseFloat(item.ForexBuying) || null,
      forexSelling: parseFloat(item.ForexSelling) || null,
      banknoteBuying: parseFloat(item.BanknoteBuying) || null,
      banknoteSelling: parseFloat(item.BanknoteSelling) || null
    })).filter(r => r.value && !isNaN(r.value))

    // Add TRY as base
    rates.unshift({
      code: 'TRY',
      value: 1,
      forexBuying: 1,
      forexSelling: 1,
      banknoteBuying: 1,
      banknoteSelling: 1
    })

    return {
      bulletin: result.Bulten_No || result['$']?.Bulten_No,
      date: result.Tarih ? new Date(result.Tarih.split('.').reverse().join('-')) : new Date(),
      rates,
      source: 'tcmb'
    }
  } catch (error) {
    console.error('TCMB fetch error:', error.message)
    throw error
  }
}

/**
 * Retrieve and update rates from TCMB
 */
exchangeSchema.statics.retrieve = async function() {
  try {
    const tcmbData = await this.fetchFromTCMB()

    // Check if we already have this bulletin
    const existing = await this.findOne({ bulletin: tcmbData.bulletin }).lean()

    if (existing) {
      return existing
    }

    // Deactivate old rates
    await this.updateMany({ isActive: true }, { isActive: false })

    // Create new rate entry
    const newRates = await this.create({
      bulletin: tcmbData.bulletin,
      date: tcmbData.date,
      rates: tcmbData.rates,
      source: 'tcmb',
      isActive: true
    })

    return newRates
  } catch (error) {
    logger.error('Exchange rate retrieval error', { error: error.message })

    // Return latest available rates on error
    const fallback = await this.findOne({ isActive: true }).sort('-createdAt').lean()
    if (fallback) {
      return fallback
    }

    throw error
  }
}

/**
 * Get current active rates
 */
exchangeSchema.statics.getRates = async function() {
  const current = await this.findOne({ isActive: true }).sort('-createdAt').lean()

  if (!current) {
    // Try to fetch if no rates exist
    try {
      return await this.retrieve()
    } catch (e) {
      return null
    }
  }

  return current
}

/**
 * Get rate for a specific currency
 */
exchangeSchema.statics.getRate = async function(currencyCode) {
  const current = await this.getRates()
  if (!current || !current.rates) return null

  const rate = current.rates.find(r => r.code.toUpperCase() === currencyCode.toUpperCase())
  return rate ? rate.value : null
}

/**
 * Convert amount between currencies
 */
exchangeSchema.statics.convert = async function(amount, fromCurrency, toCurrency) {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return amount
  }

  const rates = await this.getRates()
  if (!rates || !rates.rates) {
    throw new Error('No exchange rates available')
  }

  const fromRate = rates.rates.find(r => r.code.toUpperCase() === fromCurrency.toUpperCase())
  const toRate = rates.rates.find(r => r.code.toUpperCase() === toCurrency.toUpperCase())

  if (!fromRate || !toRate) {
    throw new Error(`Rate not found for ${fromCurrency} or ${toCurrency}`)
  }

  // Convert: amount in FROM -> TRY -> TO
  // fromRate.value = how many TRY for 1 FROM
  // toRate.value = how many TRY for 1 TO
  const amountInTRY = amount * fromRate.value
  const result = amountInTRY / toRate.value

  return result
}

/**
 * Get rates as simple object { USD: 35.5, EUR: 38.2, ... }
 */
exchangeSchema.statics.getRatesObject = async function() {
  const current = await this.getRates()
  if (!current || !current.rates) return {}

  return current.rates.reduce((acc, rate) => {
    acc[rate.code.toUpperCase()] = rate.value
    return acc
  }, {})
}

/**
 * Manually set a rate (for manual overrides)
 */
exchangeSchema.statics.setManualRate = async function(currencyCode, value) {
  const current = await this.findOne({ isActive: true }).sort('-createdAt')

  if (!current) {
    // Create new with manual rate
    return await this.create({
      rates: [
        { code: 'TRY', value: 1 },
        { code: currencyCode.toUpperCase(), value: parseFloat(value) }
      ],
      source: 'manual',
      isActive: true
    })
  }

  // Update existing rate
  const rateIndex = current.rates.findIndex(r => r.code.toUpperCase() === currencyCode.toUpperCase())

  if (rateIndex > -1) {
    current.rates[rateIndex].value = parseFloat(value)
  } else {
    current.rates.push({
      code: currencyCode.toUpperCase(),
      value: parseFloat(value)
    })
  }

  current.source = 'manual'
  await current.save()

  return current
}

const Exchange = mongoose.model('Exchange', exchangeSchema)

export default Exchange
