/**
 * @module @booking-engine/utils/pricing
 * @description Pricing calculation utilities for booking engine.
 * Provides price rounding, discount calculation, and rate analysis functions.
 */

/**
 * Rounding rules for price calculations
 * @typedef {'none'|'round'|'ceil'|'floor'|'nearest5'|'nearest10'} RoundingRule
 */

/**
 * Round price according to specified rounding rule
 * @param {number} price - Price to round
 * @param {RoundingRule} [rule='none'] - Rounding rule to apply
 * @returns {number} Rounded price, or 0 if invalid input
 * @example
 * roundPrice(123.45, 'round') // 123
 * roundPrice(123.45, 'ceil') // 124
 * roundPrice(123.45, 'floor') // 123
 * roundPrice(123.45, 'nearest5') // 125
 * roundPrice(123.45, 'nearest10') // 120
 * roundPrice(123.45, 'none') // 123.45
 */
export const roundPrice = (price, rule = 'none') => {
  if (price == null || isNaN(price)) return 0

  switch (rule) {
    case 'round':
      return Math.round(price)
    case 'ceil':
      return Math.ceil(price)
    case 'floor':
      return Math.floor(price)
    case 'nearest5':
      return Math.round(price / 5) * 5
    case 'nearest10':
      return Math.round(price / 10) * 10
    default:
      return price
  }
}

/**
 * Calculate price by applying multiplier and optional rounding
 * @param {number} basePrice - Base price before multiplier
 * @param {number} multiplier - Multiplier to apply (e.g., 1.5 for 150%)
 * @param {RoundingRule} [roundingRule='none'] - Rounding rule to apply after calculation
 * @returns {number} Calculated price
 * @example
 * calculatePrice(100, 1.5) // 150
 * calculatePrice(100, 1.234, 'round') // 123
 * calculatePrice(100, 0.8) // 80
 */
export const calculatePrice = (basePrice, multiplier, roundingRule = 'none') => {
  const price = basePrice * multiplier
  return roundPrice(price, roundingRule)
}

/**
 * Calculate discount amount from original price
 * @param {number} originalPrice - Original price before discount
 * @param {number} discountPercent - Discount percentage (0-100)
 * @returns {number} Discount amount, or 0 if invalid inputs
 * @example
 * calculateDiscount(100, 10) // 10
 * calculateDiscount(200, 25) // 50
 * calculateDiscount(100, 0) // 0
 */
export const calculateDiscount = (originalPrice, discountPercent) => {
  if (!originalPrice || !discountPercent) return 0
  return originalPrice * (discountPercent / 100)
}

/**
 * Apply discount to price and return final price
 * @param {number} originalPrice - Original price before discount
 * @param {number} discountPercent - Discount percentage (0-100)
 * @returns {number} Final price after discount, or 0 if invalid original price
 * @example
 * applyDiscount(100, 10) // 90
 * applyDiscount(200, 25) // 150
 * applyDiscount(100, 0) // 100
 */
export const applyDiscount = (originalPrice, discountPercent) => {
  if (!originalPrice) return 0
  if (!discountPercent) return originalPrice
  return originalPrice - calculateDiscount(originalPrice, discountPercent)
}

/**
 * Calculate total from array of daily prices
 * @param {number[]} dailyPrices - Array of daily prices
 * @returns {number} Sum of all prices, or 0 if invalid input
 * @example
 * calculateTotal([100, 150, 200]) // 450
 * calculateTotal([100, null, 200]) // 300
 * calculateTotal([]) // 0
 */
export const calculateTotal = dailyPrices => {
  if (!Array.isArray(dailyPrices)) return 0
  return dailyPrices.reduce((sum, price) => sum + (price || 0), 0)
}

/**
 * Calculate Average Daily Rate (ADR)
 * @param {number} totalPrice - Total price for the stay
 * @param {number} nights - Number of nights
 * @returns {number} Average daily rate, or 0 if invalid inputs
 * @example
 * calculateADR(300, 3) // 100
 * calculateADR(450, 3) // 150
 */
export const calculateADR = (totalPrice, nights) => {
  if (!totalPrice || !nights) return 0
  return totalPrice / nights
}

/**
 * Calculate percentage change between two prices
 * @param {number} oldPrice - Original/old price
 * @param {number} newPrice - New price
 * @returns {number} Percentage change (positive for increase, negative for decrease), or 0 if invalid
 * @example
 * calculatePriceChange(100, 120) // 20 (20% increase)
 * calculatePriceChange(100, 80) // -20 (20% decrease)
 * calculatePriceChange(100, 100) // 0 (no change)
 */
export const calculatePriceChange = (oldPrice, newPrice) => {
  if (!oldPrice) return 0
  return ((newPrice - oldPrice) / oldPrice) * 100
}

/**
 * Formatted price breakdown object
 * @typedef {Object} FormattedPriceBreakdown
 * @property {string} subtotal - Formatted subtotal
 * @property {string} tax - Formatted tax amount
 * @property {string} total - Formatted total
 * @property {string|null} discount - Formatted discount amount or null
 */

/**
 * Format price breakdown for display
 * @param {Object} pricing - Pricing object
 * @param {number} [pricing.subtotal] - Subtotal amount
 * @param {number} [pricing.tax] - Tax amount
 * @param {number} [pricing.total] - Total amount
 * @param {number} [pricing.grandTotal] - Grand total (alternative to total)
 * @param {number} [pricing.discount] - Discount amount
 * @param {string} [currency='EUR'] - Currency code
 * @returns {FormattedPriceBreakdown} Formatted price breakdown
 * @example
 * formatPriceBreakdown({ subtotal: 250, tax: 50, total: 300 }, 'EUR')
 * // { subtotal: '€250', tax: '€50', total: '€300', discount: null }
 */
export const formatPriceBreakdown = (pricing, currency = 'EUR') => {
  const format = num =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }).format(num || 0)

  return {
    subtotal: format(pricing?.subtotal),
    tax: format(pricing?.tax),
    total: format(pricing?.total || pricing?.grandTotal),
    discount: pricing?.discount ? format(pricing.discount) : null
  }
}

/**
 * Check if price has changed significantly beyond threshold
 * @param {number} oldPrice - Original price
 * @param {number} newPrice - New price
 * @param {number} [threshold=1] - Change threshold percentage
 * @returns {boolean} True if absolute price change exceeds threshold
 * @example
 * hasPriceChanged(100, 105, 1) // true (5% change > 1% threshold)
 * hasPriceChanged(100, 100.5, 1) // false (0.5% change < 1% threshold)
 */
export const hasPriceChanged = (oldPrice, newPrice, threshold = 1) => {
  if (!oldPrice || !newPrice) return false
  const change = Math.abs(calculatePriceChange(oldPrice, newPrice))
  return change > threshold
}

/**
 * @typedef {Object} PricingUtils
 * @property {typeof roundPrice} roundPrice - Round price by rule
 * @property {typeof calculatePrice} calculatePrice - Calculate price with multiplier
 * @property {typeof calculateDiscount} calculateDiscount - Calculate discount amount
 * @property {typeof applyDiscount} applyDiscount - Apply discount to price
 * @property {typeof calculateTotal} calculateTotal - Sum array of prices
 * @property {typeof calculateADR} calculateADR - Calculate average daily rate
 * @property {typeof calculatePriceChange} calculatePriceChange - Calculate percentage change
 * @property {typeof formatPriceBreakdown} formatPriceBreakdown - Format breakdown for display
 * @property {typeof hasPriceChanged} hasPriceChanged - Check if price changed significantly
 */

/** @type {PricingUtils} */
export default {
  roundPrice,
  calculatePrice,
  calculateDiscount,
  applyDiscount,
  calculateTotal,
  calculateADR,
  calculatePriceChange,
  formatPriceBreakdown,
  hasPriceChanged
}
