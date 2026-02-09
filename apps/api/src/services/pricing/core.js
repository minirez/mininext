/**
 * Core Pricing Module
 * Base price calculations and occupancy-based pricing
 */

import Rate from '../../modules/planning/rate.model.js'
import RoomType from '../../modules/planning/roomType.model.js'
import MealPlan from '../../modules/planning/mealPlan.model.js'
import Market from '../../modules/planning/market.model.js'
import Season from '../../modules/planning/season.model.js'
import Hotel from '../../modules/hotel/hotel.model.js'
import {
  calculatePrice,
  calculateCombinationMultiplier,
  getEffectiveMultiplier,
  generateCombinationKey
} from '../../utils/multiplierUtils.js'
import { BadRequestError, NotFoundError } from '../../core/errors.js'
import cache, { CACHE_PREFIXES, CACHE_TTL, generateCacheKey } from '../cacheService.js'
import {
  getEffectivePricingType,
  getEffectiveMultiplierTemplate,
  getEffectiveChildAgeGroups,
  getEffectiveMinAdults
} from './multipliers.js'
import { checkRestrictions } from './restrictions.js'

/**
 * Calculate price for a specific occupancy combination
 * @param {Object} rate - Rate document
 * @param {Object} options - { adults, children: [{ age, ageGroup }], nights }
 * @param {Object} context - { roomType, market, season, hotel }
 * @returns {Object} { totalPrice, breakdown, pricingType, ... }
 */
export function calculateOccupancyPrice(rate, options = {}, context = {}) {
  let { adults = 2, children = [], nights = 1 } = options
  const { roomType, market, season, hotel } = context

  // Get effective pricing type
  const pricingType = getEffectivePricingType(roomType, market, season, rate)

  // Get effective child age groups
  const childAgeGroups = getEffectiveChildAgeGroups(hotel, market, season)

  // Find max child age from age groups
  const maxChildAge =
    childAgeGroups.length > 0 ? Math.max(...childAgeGroups.map(ag => ag.maxAge || 0)) : 12 // Default max child age if no groups defined (industry standard: 0-12 child, 13+ adult)

  // Separate children: those above max age should be counted as adults
  const validChildren = []
  let childrenAsAdults = 0

  children.forEach(child => {
    if (child.age !== undefined && child.age > maxChildAge) {
      // This child is above max child age, count as adult
      childrenAsAdults++
    } else {
      validChildren.push(child)
    }
  })

  // Adjust counts
  adults = adults + childrenAsAdults
  children = validChildren

  // Capacity validation
  const maxAdults = roomType?.occupancy?.maxAdults ?? 30
  const maxChildren = roomType?.occupancy?.maxChildren ?? 0
  const totalMaxGuests = roomType?.occupancy?.totalMaxGuests ?? 50

  // Check adult capacity
  if (adults > maxAdults) {
    throw new BadRequestError(
      `Room capacity exceeded: ${adults} adults requested but room accepts maximum ${maxAdults} adults`
    )
  }

  // Check children capacity
  if (children.length > maxChildren) {
    throw new BadRequestError(
      `Room capacity exceeded: ${children.length} children requested but room accepts maximum ${maxChildren} children`
    )
  }

  // Check total capacity
  const totalGuests = adults + children.length
  if (totalGuests > totalMaxGuests) {
    throw new BadRequestError(
      `Room capacity exceeded: ${totalGuests} total guests requested but room accepts maximum ${totalMaxGuests} guests`
    )
  }

  const result = {
    pricingType,
    adults,
    children,
    childrenAsAdults, // Children counted as adults due to age
    maxChildAge, // Max child age threshold used
    nights,
    basePrice: 0,
    adultPrice: 0,
    childPrice: 0,
    totalPerNight: 0,
    totalPrice: 0,
    breakdown: [],
    currency: rate.currency || market?.currency || 'EUR'
  }

  // Determine infant age threshold from childAgeGroups (used in all pricing types)
  const infantGroup = childAgeGroups.find(g => g.code === 'infant')
  const maxInfantAge = infantGroup?.maxAge ?? 2

  if (pricingType === 'unit') {
    // Unit-based pricing
    result.basePrice = rate.pricePerNight || 0

    // Calculate adult pricing
    const baseOccupancy = roomType?.occupancy?.baseOccupancy || 2

    if (adults < baseOccupancy) {
      // Single supplement (reduction)
      result.adultPrice = result.basePrice - (rate.singleSupplement || 0)
      result.breakdown.push({
        type: 'base',
        description: `Base price (${baseOccupancy} adults)`,
        amount: result.basePrice
      })
      result.breakdown.push({
        type: 'single_supplement',
        description: 'Single supplement reduction',
        amount: -(rate.singleSupplement || 0)
      })
    } else if (adults > baseOccupancy) {
      // Extra adults
      const extraAdults = adults - baseOccupancy
      const extraAdultTotal = extraAdults * (rate.extraAdult || 0)
      result.adultPrice = result.basePrice + extraAdultTotal
      result.breakdown.push({
        type: 'base',
        description: `Base price (${baseOccupancy} adults)`,
        amount: result.basePrice
      })
      if (extraAdultTotal > 0) {
        result.breakdown.push({
          type: 'extra_adult',
          description: `${extraAdults} extra adult(s) x ${rate.extraAdult}`,
          amount: extraAdultTotal
        })
      }
    } else {
      result.adultPrice = result.basePrice
      result.breakdown.push({
        type: 'base',
        description: `Base price (${adults} adults)`,
        amount: result.basePrice
      })
    }

    // Calculate child pricing
    children.forEach((child, index) => {
      const childOrder = index + 1
      const childAge = typeof child === 'object' ? child.age : child
      let childPrice = 0

      // Check if this child is an infant - use extraInfant price
      if (childAge !== undefined && childAge <= maxInfantAge) {
        childPrice = rate.extraInfant || 0
      }
      // Try childOrderPricing first (position-based) for non-infant children
      else if (rate.childOrderPricing && rate.childOrderPricing[index] !== undefined) {
        childPrice = rate.childOrderPricing[index]
      }
      // Then try childPricing (age-based tiers)
      else if (rate.childPricing && rate.childPricing.length > 0 && childAge !== undefined) {
        const tier = rate.childPricing.find(t => childAge >= t.minAge && childAge <= t.maxAge)
        if (tier) {
          childPrice = tier.price
        }
      }
      // Fallback to extraChild
      else {
        childPrice = rate.extraChild || 0
      }

      result.childPrice += childPrice
      if (childPrice > 0) {
        result.breakdown.push({
          type: childAge !== undefined && childAge <= maxInfantAge ? 'infant' : 'child',
          description: `${childAge !== undefined && childAge <= maxInfantAge ? 'Infant' : 'Child'} ${childOrder} (age ${childAge ?? 'N/A'})`,
          amount: childPrice
        })
      }
    })

    result.totalPerNight = result.adultPrice + result.childPrice
    result.totalPrice = result.totalPerNight * nights
  } else {
    // OBP (per_person) pricing
    const multiplierTemplate = getEffectiveMultiplierTemplate(roomType, market, season, rate)

    // If using direct occupancy pricing (no multipliers)
    if (!multiplierTemplate.useMultipliers) {
      // Use occupancyPricing directly
      const occupancyPrice = rate.occupancyPricing?.[adults] || 0
      result.basePrice = occupancyPrice
      result.adultPrice = occupancyPrice

      result.breakdown.push({
        type: 'occupancy',
        description: `${adults} adult(s) occupancy price`,
        amount: occupancyPrice
      })

      // Child pricing for OBP without multipliers
      children.forEach((child, index) => {
        const childOrder = index + 1
        const childAge = typeof child === 'object' ? child.age : child
        let childPrice = 0

        // Check if this child is an infant - use extraInfant price
        if (childAge !== undefined && childAge <= maxInfantAge) {
          childPrice = rate.extraInfant || 0
        }
        // Try childOrderPricing (position-based) for non-infant children
        else if (rate.childOrderPricing && rate.childOrderPricing[index] !== undefined) {
          childPrice = rate.childOrderPricing[index]
        }
        // Then try childPricing (age-based tiers)
        else if (rate.childPricing && rate.childPricing.length > 0 && childAge !== undefined) {
          const tier = rate.childPricing.find(t => childAge >= t.minAge && childAge <= t.maxAge)
          if (tier) {
            childPrice = tier.price
          }
        }

        result.childPrice += childPrice
        if (childPrice > 0) {
          result.breakdown.push({
            type: childAge !== undefined && childAge <= maxInfantAge ? 'infant' : 'child',
            description: `${childAge !== undefined && childAge <= maxInfantAge ? 'Infant' : 'Child'} ${childOrder} (age ${childAge ?? 'N/A'})`,
            amount: childPrice
          })
        }
      })

      result.totalPerNight = result.adultPrice + result.childPrice
      result.totalPrice = result.totalPerNight * nights
    } else {
      // OBP with multipliers
      // Base price is occupancyPricing[2] (double occupancy)
      const baseOccupancy = roomType?.occupancy?.baseOccupancy || 2
      const basePrice = rate.occupancyPricing?.[baseOccupancy] || rate.pricePerNight || 0
      result.basePrice = basePrice

      // Determine child age groups for children
      const childrenWithAgeGroups = children.map((child, index) => {
        let ageGroup = child.ageGroup

        // If ageGroup not provided, determine from age
        if (!ageGroup && child.age !== undefined && childAgeGroups.length > 0) {
          const group = childAgeGroups.find(ag => child.age >= ag.minAge && child.age <= ag.maxAge)
          ageGroup = group?.code || 'first'
        }

        return {
          order: index + 1,
          ageGroup: ageGroup || 'first',
          age: child.age
        }
      })

      // Generate combination key
      const combinationKey = generateCombinationKey(adults, childrenWithAgeGroups)

      // Look for combination in table
      let multiplier = 1
      let combinationFound = false

      if (multiplierTemplate.combinationTable?.length > 0) {
        const combination = multiplierTemplate.combinationTable.find(c => c.key === combinationKey)
        if (combination) {
          combinationFound = true

          // Check if combination is active
          if (!combination.isActive) {
            result.error = 'Combination not available for sale'
            result.isAvailable = false
            return result
          }

          multiplier = getEffectiveMultiplier(combination)
        }
      }

      // If not found in table, calculate from multipliers
      if (!combinationFound) {
        multiplier = calculateCombinationMultiplier(
          adults,
          childrenWithAgeGroups,
          multiplierTemplate.adultMultipliers,
          multiplierTemplate.childMultipliers
        )
      }

      // Apply rounding rule
      const roundingRule = multiplierTemplate.roundingRule || 'none'
      const calculatedPrice = calculatePrice(basePrice, multiplier, roundingRule)

      result.multiplier = multiplier
      result.combinationKey = combinationKey
      result.roundingRule = roundingRule
      result.adultPrice = calculatedPrice
      result.totalPerNight = calculatedPrice
      result.totalPrice = calculatedPrice * nights

      result.breakdown.push({
        type: 'obp_base',
        description: `Base price (${baseOccupancy} adults)`,
        amount: basePrice
      })
      result.breakdown.push({
        type: 'multiplier',
        description: `Multiplier for ${combinationKey}: x${multiplier}`,
        amount: calculatedPrice - basePrice
      })
    }
  }

  result.isAvailable = true
  return result
}

/**
 * Get effective rate with all context loaded
 * @param {string} hotelId - Hotel ID
 * @param {string} roomTypeId - Room Type ID
 * @param {string} mealPlanId - Meal Plan ID
 * @param {string} marketId - Market ID
 * @param {Date|string} date - Date
 * @returns {Object} { rate, roomType, mealPlan, market, season, hotel, effectivePricingType, effectiveMultipliers }
 */
export async function getEffectiveRate(hotelId, roomTypeId, mealPlanId, marketId, date) {
  // Fetch all required documents in parallel
  const [rate, roomType, mealPlan, market, hotel] = await Promise.all([
    Rate.findByDate(hotelId, roomTypeId, mealPlanId, marketId, date),
    RoomType.findById(roomTypeId).lean(),
    MealPlan.findById(mealPlanId).lean(),
    Market.findById(marketId).lean(),
    Hotel.findById(hotelId).select('childAgeGroups').lean()
  ])

  if (!rate) {
    throw new NotFoundError('RATE_NOT_FOUND')
  }

  // Get season for the date
  const season = await Season.findByDate(hotelId, marketId, date)

  // Calculate effective values
  const effectivePricingType = getEffectivePricingType(roomType, market, season, rate)
  const effectiveMultipliers = getEffectiveMultiplierTemplate(roomType, market, season, rate)
  const effectiveChildAgeGroups = getEffectiveChildAgeGroups(hotel, market, season)
  const effectiveRoundingRule = effectiveMultipliers.roundingRule
  const effectiveMinAdults = getEffectiveMinAdults(roomType, market, season)

  return {
    rate: rate.toObject(),
    roomType,
    mealPlan,
    market,
    season: season ? season.toObject() : null,
    hotel,
    effectivePricingType,
    effectiveMultipliers,
    effectiveChildAgeGroups,
    effectiveRoundingRule,
    effectiveMinAdults
  }
}

/**
 * Calculate price for a booking query
 * @param {Object} query - { hotelId, roomTypeId, mealPlanId, marketId, date, adults, children, nights }
 * @returns {Object} Calculated price with breakdown
 */
export async function calculateBookingPrice(query, useCache = true) {
  const {
    hotelId,
    roomTypeId,
    mealPlanId,
    marketId,
    date,
    adults = 2,
    children = [],
    nights = 1
  } = query

  // Check cache first
  if (useCache) {
    const cacheKey = generateCacheKey(CACHE_PREFIXES.PRICE_CALCULATION, {
      hotelId,
      roomTypeId,
      mealPlanId,
      marketId,
      date: date instanceof Date ? date.toISOString().split('T')[0] : date,
      adults,
      children: JSON.stringify(children),
      nights
    })

    const cached = cache.get(cacheKey)
    if (cached) {
      return { ...cached, fromCache: true }
    }
  }

  // Get effective rate with context
  const effectiveData = await getEffectiveRate(hotelId, roomTypeId, mealPlanId, marketId, date)

  // Check restrictions (including minAdults from effective hierarchy)
  const restrictionCheck = checkRestrictions(effectiveData.rate, {
    adults,
    bookingDate: new Date(),
    minAdults: effectiveData.effectiveMinAdults
  })

  if (!restrictionCheck.isBookable) {
    return {
      success: false,
      error: 'Rate not bookable',
      restrictions: restrictionCheck.restrictions,
      messages: restrictionCheck.messages
    }
  }

  // Calculate price
  const priceResult = calculateOccupancyPrice(
    effectiveData.rate,
    { adults, children, nights },
    {
      roomType: effectiveData.roomType,
      market: effectiveData.market,
      season: effectiveData.season,
      hotel: effectiveData.hotel
    }
  )

  const result = {
    success: true,
    ...priceResult,
    effectiveData: {
      pricingType: effectiveData.effectivePricingType,
      multipliers: effectiveData.effectiveMultipliers,
      childAgeGroups: effectiveData.effectiveChildAgeGroups,
      roundingRule: effectiveData.effectiveRoundingRule,
      season: effectiveData.season
        ? {
            _id: effectiveData.season._id,
            name: effectiveData.season.name,
            code: effectiveData.season.code
          }
        : null
    }
  }

  // Cache the result
  if (useCache) {
    const cacheKey = generateCacheKey(CACHE_PREFIXES.PRICE_CALCULATION, {
      hotelId,
      roomTypeId,
      mealPlanId,
      marketId,
      date: date instanceof Date ? date.toISOString().split('T')[0] : date,
      adults,
      children: JSON.stringify(children),
      nights
    })
    cache.set(cacheKey, result, CACHE_TTL.PRICE_CALCULATION)
  }

  return result
}

/**
 * Bulk calculate prices for multiple queries
 * @param {Array} queries - Array of query objects
 * @returns {Array} Array of calculated prices
 */
export async function bulkCalculatePrices(queries) {
  const results = await Promise.all(
    queries.map(query =>
      calculateBookingPrice(query).catch(error => ({
        success: false,
        error: error.message,
        query
      }))
    )
  )
  return results
}

/**
 * Check availability for a date range
 * @param {Object} params - { hotelId, roomTypeId, mealPlanId, marketId, startDate, endDate, adults }
 * @returns {Object} { isAvailable, unavailableDates, restrictions }
 */
export async function checkAvailability(params) {
  const { hotelId, roomTypeId, mealPlanId, marketId, startDate, endDate, adults = 2 } = params

  const rates = await Rate.findInRange(hotelId, startDate, endDate, {
    roomType: roomTypeId,
    mealPlan: mealPlanId,
    market: marketId
  })

  const unavailableDates = []
  const restrictionsByDate = {}

  for (const rate of rates) {
    const check = checkRestrictions(rate, { adults, bookingDate: new Date() })
    if (!check.isBookable) {
      const dateStr = rate.date.toISOString().split('T')[0]
      unavailableDates.push(dateStr)
      restrictionsByDate[dateStr] = check
    }
  }

  return {
    isAvailable: unavailableDates.length === 0,
    unavailableDates,
    restrictionsByDate,
    totalDaysChecked: rates.length
  }
}
