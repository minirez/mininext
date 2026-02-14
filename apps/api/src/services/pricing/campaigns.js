/**
 * Campaigns Module
 * Campaign application logic and validation
 */

import Rate from '../../modules/planning/rate.model.js'
import RoomType from '../../modules/planning/roomType.model.js'
import MealPlan from '../../modules/planning/mealPlan.model.js'
import Market from '../../modules/planning/market.model.js'
import Season from '../../modules/planning/season.model.js'
import Hotel from '../../modules/hotel/hotel.model.js'
import { BadRequestError, NotFoundError } from '../../core/errors.js'
import cache, { CACHE_PREFIXES, CACHE_TTL, generateCacheKey } from '../cacheService.js'
import { calculateOccupancyPrice } from './core.js'
import { checkRestrictions } from './restrictions.js'
import { getEffectiveSalesSettings, calculateTierPricing } from './tiers.js'
import { getEffectiveChildAgeGroups, getEffectiveMinAdults } from './multipliers.js'

/**
 * Get applicable campaigns for a booking
 * @param {string} hotelId - Hotel ID
 * @param {Object} params - { checkInDate, checkOutDate, roomTypeId, marketId, mealPlanId, nights, bookingDate }
 * @returns {Array} Applicable campaigns sorted by priority
 */
export async function getApplicableCampaigns(hotelId, params) {
  const Campaign = (await import('../../modules/planning/campaign.model.js')).default

  const {
    checkInDate,
    checkOutDate,
    roomTypeId,
    marketId,
    mealPlanId,
    nights,
    bookingDate = new Date()
  } = params

  // Use the model's findApplicable method
  const campaigns = await Campaign.findApplicable(hotelId, {
    bookingDate,
    checkInDate: new Date(checkInDate),
    checkOutDate: new Date(checkOutDate),
    roomTypeId,
    marketId,
    mealPlanId,
    nights
  })

  return campaigns
}

/**
 * Check if a specific date is eligible for a campaign
 * @param {Object} campaign - Campaign document
 * @param {Date} date - Date to check
 * @param {Date} checkInDate - Check-in date
 * @returns {boolean}
 */
function isDateEligibleForCampaign(campaign, date, checkInDate) {
  const dateObj = new Date(date)
  const stayStart = new Date(campaign.stayWindow.startDate)
  const stayEnd = new Date(campaign.stayWindow.endDate)

  // Normalize dates for comparison
  stayStart.setHours(0, 0, 0, 0)
  stayEnd.setHours(23, 59, 59, 999)
  dateObj.setHours(0, 0, 0, 0)

  // Check application type
  if (campaign.applicationType === 'checkin') {
    // If check-in is within stay window, all nights are eligible
    const checkIn = new Date(checkInDate)
    checkIn.setHours(0, 0, 0, 0)
    return checkIn >= stayStart && checkIn <= stayEnd
  }

  // Default: 'stay' - only dates within stay window are eligible
  return dateObj >= stayStart && dateObj <= stayEnd
}

/**
 * Get day of week name for a date
 * @param {Date} date
 * @returns {string} lowercase day name
 */
function getDayOfWeek(date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date(date).getDay()]
}

/**
 * Check if a date matches campaign's applicable days
 * @param {Object} campaign
 * @param {Date} date
 * @returns {boolean}
 */
function isDayApplicable(campaign, date) {
  if (!campaign.conditions?.applicableDays) return true
  const dayName = getDayOfWeek(date)
  return campaign.conditions.applicableDays[dayName] !== false
}

/**
 * Apply a single campaign to daily breakdown
 * @param {Object} campaign - Campaign document
 * @param {Array} dailyBreakdown - Array of { date, originalPrice, price, ... }
 * @param {Object} options - { checkInDate, calculationType }
 * @returns {Object} { dailyBreakdown, totalDiscount, discountText }
 */
export function applyCampaignToBreakdown(campaign, dailyBreakdown, options = {}) {
  const { checkInDate, calculationType = 'cumulative' } = options
  let totalDiscount = 0
  let eligibleNights = 0
  const discountDetails = []

  // Clone breakdown to avoid mutation
  const updatedBreakdown = dailyBreakdown.map(day => ({ ...day }))

  // Find eligible days
  const eligibleDays = updatedBreakdown.filter(day => {
    const isEligible = isDateEligibleForCampaign(campaign, day.date, checkInDate)
    const isDayOk = isDayApplicable(campaign, day.date)
    return isEligible && isDayOk && day.price > 0
  })

  eligibleNights = eligibleDays.length

  if (eligibleNights === 0) {
    return {
      dailyBreakdown: updatedBreakdown,
      totalDiscount: 0,
      discountText: '',
      eligibleNights: 0,
      applied: false
    }
  }

  // Apply discount based on type
  if (campaign.discount.type === 'percentage') {
    const discountPercent = campaign.discount.value / 100

    eligibleDays.forEach(eligibleDay => {
      const day = updatedBreakdown.find(d => d.date === eligibleDay.date)
      const basePrice =
        calculationType === 'cumulative' ? day.originalPrice || day.price : day.price
      const dayDiscount = basePrice * discountPercent

      day.price = Math.max(0, day.price - dayDiscount)
      day.discountAmount = (day.discountAmount || 0) + dayDiscount
      day.campaignApplied = true
      day.appliedCampaigns = day.appliedCampaigns || []
      day.appliedCampaigns.push({
        code: campaign.code,
        name: campaign.name,
        discount: `-${campaign.discount.value}%`,
        amount: dayDiscount
      })

      totalDiscount += dayDiscount
    })

    discountDetails.push(`-${campaign.discount.value}%`)
  } else if (campaign.discount.type === 'fixed') {
    const discountPerNight = campaign.discount.value

    eligibleDays.forEach(eligibleDay => {
      const day = updatedBreakdown.find(d => d.date === eligibleDay.date)
      const dayDiscount = Math.min(discountPerNight, day.price)

      day.price = Math.max(0, day.price - dayDiscount)
      day.discountAmount = (day.discountAmount || 0) + dayDiscount
      day.campaignApplied = true
      day.appliedCampaigns = day.appliedCampaigns || []
      day.appliedCampaigns.push({
        code: campaign.code,
        name: campaign.name,
        discount: `-${campaign.discount.value}`,
        amount: dayDiscount
      })

      totalDiscount += dayDiscount
    })

    discountDetails.push(`-${campaign.discount.value}/night`)
  } else if (campaign.discount.type === 'free_nights') {
    const { stayNights, freeNights } = campaign.discount.freeNights || {}

    if (stayNights && freeNights && eligibleNights >= stayNights) {
      // Sort eligible days by price (cheapest first for free nights)
      const sortedEligible = [...eligibleDays].sort((a, b) => a.price - b.price)
      const freeNightDays = sortedEligible.slice(0, freeNights)

      freeNightDays.forEach(eligibleDay => {
        const day = updatedBreakdown.find(d => d.date === eligibleDay.date)
        const dayDiscount = day.price

        day.price = 0
        day.discountAmount = (day.discountAmount || 0) + dayDiscount
        day.isFreeNight = true
        day.campaignApplied = true
        day.appliedCampaigns = day.appliedCampaigns || []
        day.appliedCampaigns.push({
          code: campaign.code,
          name: campaign.name,
          discount: 'FREE',
          amount: dayDiscount
        })

        totalDiscount += dayDiscount
      })

      discountDetails.push(`${stayNights}=${freeNights} Free`)
    }
  }

  // Build discount text
  let discountText = discountDetails.join(', ')
  if (eligibleNights < dailyBreakdown.length && discountText) {
    discountText += ` (${eligibleNights}/${dailyBreakdown.length} nights)`
  }

  return {
    dailyBreakdown: updatedBreakdown,
    totalDiscount,
    discountText,
    eligibleNights,
    applied: totalDiscount > 0
  }
}

/**
 * Apply multiple campaigns to a price calculation
 * Handles combinable vs non-combinable campaigns
 * @param {Array} campaigns - Array of campaign documents
 * @param {Array} dailyBreakdown - Array of { date, price, originalPrice }
 * @param {Object} options - { checkInDate }
 * @returns {Object} { dailyBreakdown, appliedCampaigns, totalDiscount, originalTotal, finalTotal }
 */
export function applyCampaigns(campaigns, dailyBreakdown, options = {}) {
  if (!campaigns || campaigns.length === 0) {
    const totalPrice = dailyBreakdown.reduce((sum, d) => sum + (d.price || 0), 0)
    return {
      dailyBreakdown,
      appliedCampaigns: [],
      totalDiscount: 0,
      originalTotal: totalPrice,
      finalTotal: totalPrice
    }
  }

  const { checkInDate } = options
  const originalTotal = dailyBreakdown.reduce((sum, d) => sum + (d.price || 0), 0)

  // Store original prices
  let currentBreakdown = dailyBreakdown.map(day => ({
    ...day,
    originalPrice: day.price
  }))

  // Separate combinable and non-combinable campaigns
  const nonCombinableCampaigns = campaigns.filter(c => !c.combinable)
  const combinableCampaigns = campaigns.filter(c => c.combinable)

  let campaignsToApply = []
  const appliedCampaigns = []
  let totalDiscount = 0

  // If there are non-combinable campaigns, use the highest priority one
  if (nonCombinableCampaigns.length > 0) {
    // Sort by priority (highest first)
    nonCombinableCampaigns.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    campaignsToApply = [nonCombinableCampaigns[0]]
  } else if (combinableCampaigns.length > 0) {
    // Sort by calculationOrder for sequential application
    combinableCampaigns.sort((a, b) => (a.calculationOrder || 0) - (b.calculationOrder || 0))
    campaignsToApply = combinableCampaigns
  }

  // Apply each campaign
  for (const campaign of campaignsToApply) {
    const result = applyCampaignToBreakdown(campaign, currentBreakdown, {
      checkInDate,
      calculationType: campaign.calculationType || 'cumulative'
    })

    if (result.applied) {
      currentBreakdown = result.dailyBreakdown
      totalDiscount += result.totalDiscount
      appliedCampaigns.push({
        _id: campaign._id,
        code: campaign.code,
        name: campaign.name,
        type: campaign.type,
        discountType: campaign.discount.type,
        discountValue: campaign.discount.value,
        freeNights: campaign.discount.freeNights,
        discountAmount: result.totalDiscount,
        discountText: result.discountText,
        eligibleNights: result.eligibleNights
      })
    }
  }

  const finalTotal = currentBreakdown.reduce((sum, d) => sum + (d.price || 0), 0)

  return {
    dailyBreakdown: currentBreakdown,
    appliedCampaigns,
    totalDiscount,
    originalTotal,
    finalTotal
  }
}

/**
 * Calculate complete booking price with campaigns
 * @param {Object} query - Booking query parameters
 * @returns {Object} Complete price breakdown with campaigns
 */
export async function calculatePriceWithCampaigns(query, useCache = true) {
  const {
    hotelId,
    roomTypeId,
    mealPlanId,
    marketId,
    checkInDate,
    checkOutDate,
    adults = 2,
    children = [],
    includeCampaigns = true,
    campaignCode = null
  } = query

  // Check cache first
  if (useCache) {
    const cacheKey = generateCacheKey(CACHE_PREFIXES.PRICE_CALCULATION, {
      type: 'withCampaigns',
      hotelId,
      roomTypeId,
      mealPlanId,
      marketId,
      checkInDate,
      checkOutDate,
      adults,
      children: JSON.stringify(children),
      includeCampaigns,
      campaignCode
    })

    const cached = cache.get(cacheKey)
    if (cached) {
      return { ...cached, fromCache: true }
    }
  }

  // Calculate number of nights
  const checkIn = new Date(checkInDate)
  const checkOut = new Date(checkOutDate)
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

  if (nights <= 0) {
    throw new BadRequestError('INVALID_DATE_RANGE')
  }

  // Get all rates for the date range
  const rates = await Rate.findInRange(hotelId, checkInDate, checkOutDate, {
    roomType: roomTypeId,
    mealPlan: mealPlanId,
    market: marketId
  })

  if (!rates || rates.length === 0) {
    throw new NotFoundError('NO_RATES_FOUND')
  }

  // Get context for first rate
  const [roomType, mealPlan, market, hotel] = await Promise.all([
    RoomType.findById(roomTypeId).lean(),
    MealPlan.findById(mealPlanId).lean(),
    Market.findById(marketId).lean(),
    Hotel.findById(hotelId).lean()
  ])

  if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')
  if (!mealPlan) throw new NotFoundError('MEAL_PLAN_NOT_FOUND')
  if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

  // Get season for minAdults calculation
  const season = await Season.findByDate(hotelId, marketId, checkInDate)

  // Get effective child age groups and max child age
  const childAgeGroups = getEffectiveChildAgeGroups(hotel, market, season)
  const maxChildAge =
    childAgeGroups.length > 0 ? Math.max(...childAgeGroups.map(ag => ag.maxAge || 0)) : 12 // Default max child age if no groups defined (industry standard: 0-12 child, 13+ adult)

  // Separate children: those above max age should be counted as adults
  let effectiveAdults = adults
  let effectiveChildren = children
  let childrenAsAdults = 0

  if (children && children.length > 0) {
    const validChildren = []
    children.forEach(child => {
      const childAge = typeof child === 'object' ? child.age : child
      if (childAge !== undefined && childAge > maxChildAge) {
        childrenAsAdults++
      } else {
        validChildren.push(child)
      }
    })
    effectiveAdults = adults + childrenAsAdults
    effectiveChildren = validChildren
  }

  // Get effective minAdults considering override hierarchy
  const effectiveMinAdults = getEffectiveMinAdults(roomType, market, season)

  // Check minAdults restriction upfront (using effective adults count)
  if (effectiveAdults < effectiveMinAdults) {
    return {
      success: false,
      error: 'BELOW_MIN_ADULTS',
      message: `Minimum ${effectiveMinAdults} adult(s) required for this room type`,
      minAdults: effectiveMinAdults,
      requestedAdults: adults
    }
  }

  // Check infant capacity
  const infantGroup = childAgeGroups.find(g => g.code === 'infant')
  const maxInfantAge = infantGroup?.maxAge ?? 2

  let infantCount = 0
  let childCount = 0
  for (const child of effectiveChildren) {
    const childAge = typeof child === 'object' ? child.age : child
    if (childAge !== undefined && childAge <= maxInfantAge) {
      infantCount++
    } else if (childAge !== undefined) {
      childCount++
    }
  }

  const maxInfants = roomType.occupancy?.maxInfants ?? 1
  if (infantCount > maxInfants) {
    return {
      success: false,
      capacityExceeded: true,
      error: 'INFANT_CAPACITY_EXCEEDED',
      message: `Maximum ${maxInfants} infant(s) allowed for this room type`,
      maxInfants,
      requestedInfants: infantCount
    }
  }

  // Build daily breakdown
  const dailyBreakdown = []
  let totalBasePrice = 0
  let hasIssues = false
  const issues = []

  // Generate dates array
  const dates = []
  const currentDate = new Date(checkInDate)
  while (currentDate < checkOut) {
    dates.push(currentDate.toISOString().split('T')[0])
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Pre-fetch all seasons for the date range to avoid N+1 queries
  const seasonsMap = new Map()
  for (const dateStr of dates) {
    const daySeason = await Season.findByDate(hotelId, marketId, dateStr)
    seasonsMap.set(dateStr, daySeason)
  }

  for (let i = 0; i < dates.length; i++) {
    const dateStr = dates[i]
    const rate = rates.find(r => {
      const rateDateStr = r.date?.toISOString?.()?.split('T')[0] || r.date?.substring?.(0, 10)
      return rateDateStr === dateStr
    })

    const isCheckIn = i === 0
    const isCheckOut = i === dates.length - 1

    if (!rate) {
      dailyBreakdown.push({
        date: dateStr,
        price: 0,
        hasRate: false,
        hasIssue: true,
        issue: 'NO_RATE'
      })
      hasIssues = true
      issues.push({ date: dateStr, type: 'no_rate', message: 'No rate defined' })
      continue
    }

    // Get season for this specific day
    const daySeason = seasonsMap.get(dateStr)

    // Check restrictions (including minAdults)
    const restrictionCheck = checkRestrictions(rate, {
      checkInDate,
      checkOutDate,
      adults: effectiveAdults,
      bookingDate: new Date(),
      isCheckIn,
      isCheckOut,
      minAdults: effectiveMinAdults
    })

    // Calculate daily price
    const priceResult = calculateOccupancyPrice(
      rate,
      { adults: effectiveAdults, children: effectiveChildren, nights: 1 },
      {
        roomType,
        market,
        hotel
      }
    )

    // Get sales settings for this day (considering day's season)
    const daySalesSettings = getEffectiveSalesSettings(market, daySeason)

    // Calculate 3-tier pricing for this day
    const dayTierPricing = calculateTierPricing(priceResult.totalPrice, daySalesSettings)

    const dayData = {
      date: dateStr,
      price: priceResult.totalPrice,
      basePrice: priceResult.basePrice,
      adultPrice: priceResult.adultPrice,
      childPrice: priceResult.childPrice,
      // 3-tier pricing for this day
      hotelCost: dayTierPricing.hotelCost,
      b2cPrice: dayTierPricing.b2cPrice,
      b2bPrice: dayTierPricing.b2bPrice,
      // Sales settings applied for this day
      salesSettings: {
        workingMode: daySalesSettings.workingMode,
        commissionRate: daySalesSettings.commissionRate,
        agencyCommission: daySalesSettings.agencyCommission,
        markup: daySalesSettings.markup
      },
      season: daySeason ? { _id: daySeason._id, code: daySeason.code, name: daySeason.name } : null,
      hasRate: true,
      hasIssue: !restrictionCheck.isBookable,
      restrictions: restrictionCheck.restrictions,
      pricingType: priceResult.pricingType
    }

    if (!restrictionCheck.isBookable) {
      hasIssues = true
      restrictionCheck.messages.forEach(msg => {
        issues.push({ date: dateStr, type: 'restriction', message: msg })
      })
    }

    dailyBreakdown.push(dayData)
    totalBasePrice += priceResult.totalPrice
  }

  // Apply campaigns if requested
  let campaignResult = {
    dailyBreakdown,
    appliedCampaigns: [],
    totalDiscount: 0,
    originalTotal: totalBasePrice,
    finalTotal: totalBasePrice
  }

  if (includeCampaigns) {
    // Get applicable campaigns
    const campaigns = await getApplicableCampaigns(hotelId, {
      checkInDate,
      checkOutDate,
      roomTypeId,
      marketId,
      mealPlanId,
      nights
    })

    // If a promo code campaign is specified, include it if not already in the list
    if (campaignCode) {
      const Campaign = (await import('../../modules/planning/campaign.model.js')).default
      const promoCampaign = await Campaign.findOne({
        hotel: hotelId,
        code: campaignCode.toUpperCase(),
        status: 'active'
      })
      if (promoCampaign && !campaigns.some(c => c.code === promoCampaign.code)) {
        campaigns.push(promoCampaign)
      }
    }

    if (campaigns.length > 0) {
      campaignResult = applyCampaigns(campaigns, dailyBreakdown, { checkInDate })
    }
  }

  // Aggregate 3-tier pricing from daily breakdown (after campaigns applied)
  // Each day may have different sales settings based on its season
  let totalHotelCost = 0
  let totalB2CPrice = 0
  let totalB2BPrice = 0

  // Re-calculate tier pricing for each day after campaigns are applied
  const finalDailyBreakdown = campaignResult.dailyBreakdown.map(day => {
    if (!day.hasRate) return day

    // Get the day's sales settings (already stored in day.salesSettings)
    const daySalesSettings = day.salesSettings || getEffectiveSalesSettings(market, null)

    // Calculate tier pricing based on the discounted price (after campaigns)
    const dayTierPricing = calculateTierPricing(day.price, daySalesSettings)

    totalHotelCost += dayTierPricing.hotelCost
    totalB2CPrice += dayTierPricing.b2cPrice
    totalB2BPrice += dayTierPricing.b2bPrice

    return {
      ...day,
      // Update tier pricing after campaign discount
      hotelCost: dayTierPricing.hotelCost,
      b2cPrice: dayTierPricing.b2cPrice,
      b2bPrice: dayTierPricing.b2bPrice
    }
  })

  // Round totals
  totalHotelCost = Math.round(totalHotelCost * 100) / 100
  totalB2CPrice = Math.round(totalB2CPrice * 100) / 100
  totalB2BPrice = Math.round(totalB2BPrice * 100) / 100

  // Determine if booking spans multiple seasons with different working modes
  const workingModes = [
    ...new Set(finalDailyBreakdown.filter(d => d.hasRate).map(d => d.salesSettings?.workingMode))
  ]
  const hasMultipleWorkingModes = workingModes.length > 1

  const result = {
    success: true,
    hotelId,
    roomType: { _id: roomType?._id, code: roomType?.code, name: roomType?.name },
    mealPlan: { _id: mealPlan?._id, code: mealPlan?.code, name: mealPlan?.name },
    market: { _id: market?._id, code: market?.code, currency: market?.currency },
    checkInDate,
    checkOutDate,
    nights,
    adults,
    children,
    // Effective counts after child age validation
    occupancy: {
      requestedAdults: adults,
      requestedChildren: children.length,
      effectiveAdults,
      effectiveChildren: effectiveChildren.length,
      childrenAsAdults, // Children counted as adults due to exceeding max child age
      maxChildAge // Max child age threshold used
    },
    currency: market?.currency,
    dailyBreakdown: finalDailyBreakdown,
    pricing: {
      originalTotal: campaignResult.originalTotal,
      totalDiscount: campaignResult.totalDiscount,
      finalTotal: campaignResult.finalTotal,
      avgPerNight: campaignResult.finalTotal / nights,
      // 3-tier pricing (total for all nights - aggregated from daily)
      hotelCost: totalHotelCost,
      b2cPrice: totalB2CPrice,
      b2bPrice: totalB2BPrice,
      // 3-tier pricing per night (average)
      perNight: {
        hotelCost: Math.round((totalHotelCost / nights) * 100) / 100,
        b2cPrice: Math.round((totalB2CPrice / nights) * 100) / 100,
        b2bPrice: Math.round((totalB2BPrice / nights) * 100) / 100
      }
    },
    // Summary of sales settings (mixed if multiple seasons)
    salesSettings: {
      hasMultipleWorkingModes,
      workingModes,
      // If single working mode, show details; otherwise indicate mixed
      ...(hasMultipleWorkingModes
        ? {
            note: 'Multiple seasons with different working modes. See dailyBreakdown for per-day details.'
          }
        : {
            workingMode: workingModes[0] || 'net',
            commissionRate: finalDailyBreakdown[0]?.salesSettings?.commissionRate,
            markup: finalDailyBreakdown[0]?.salesSettings?.markup,
            agencyCommission: finalDailyBreakdown[0]?.salesSettings?.agencyCommission
          })
    },
    campaigns: {
      applied: campaignResult.appliedCampaigns,
      totalDiscount: campaignResult.totalDiscount
    },
    availability: {
      isAvailable: !hasIssues,
      issues
    }
  }

  // Add non-refundable pricing if market/season supports it
  // Check season override first, then fall back to market settings
  let nonRefundableEnabled = false
  let nonRefundableDiscount = 10

  if (season && !season.nonRefundableOverride?.inheritFromMarket) {
    // Use season override
    nonRefundableEnabled = season.nonRefundableOverride?.enabled || false
    nonRefundableDiscount = season.nonRefundableOverride?.discount || 10
  } else {
    // Use market settings
    nonRefundableEnabled = market.ratePolicy === 'non_refundable' || market.ratePolicy === 'both'
    nonRefundableDiscount = market.nonRefundableDiscount || 10
  }

  if (nonRefundableEnabled) {
    const discountMultiplier = 1 - nonRefundableDiscount / 100

    result.nonRefundable = {
      enabled: true,
      discountPercent: nonRefundableDiscount,
      pricing: {
        finalTotal: Math.round(campaignResult.finalTotal * discountMultiplier * 100) / 100,
        avgPerNight:
          Math.round((campaignResult.finalTotal / nights) * discountMultiplier * 100) / 100,
        hotelCost: Math.round(totalHotelCost * discountMultiplier * 100) / 100,
        b2cPrice: Math.round(totalB2CPrice * discountMultiplier * 100) / 100,
        b2bPrice: Math.round(totalB2BPrice * discountMultiplier * 100) / 100,
        perNight: {
          hotelCost: Math.round((totalHotelCost / nights) * discountMultiplier * 100) / 100,
          b2cPrice: Math.round((totalB2CPrice / nights) * discountMultiplier * 100) / 100,
          b2bPrice: Math.round((totalB2BPrice / nights) * discountMultiplier * 100) / 100
        }
      },
      savings: {
        total: Math.round(campaignResult.finalTotal * (nonRefundableDiscount / 100) * 100) / 100,
        b2cTotal: Math.round(totalB2CPrice * (nonRefundableDiscount / 100) * 100) / 100,
        b2bTotal: Math.round(totalB2BPrice * (nonRefundableDiscount / 100) * 100) / 100
      }
    }
  } else {
    result.nonRefundable = { enabled: false }
  }

  // Cache the result
  if (useCache) {
    const cacheKey = generateCacheKey(CACHE_PREFIXES.PRICE_CALCULATION, {
      type: 'withCampaigns',
      hotelId,
      roomTypeId,
      mealPlanId,
      marketId,
      checkInDate,
      checkOutDate,
      adults,
      children: JSON.stringify(children),
      includeCampaigns,
      campaignCode
    })
    cache.set(cacheKey, result, CACHE_TTL.PRICE_CALCULATION)
  }

  return result
}
