/**
 * Data transformation helpers for legacy → new system migration
 */

/**
 * Convert legacy i18n array to new object format
 * [{lang:'tr', value:'Oda'}, {lang:'en', value:'Room'}] → {tr:'Oda', en:'Room'}
 */
export function convertLangArray(langArray) {
  const result = {}

  if (!langArray) return result

  // Already object format
  if (typeof langArray === 'object' && !Array.isArray(langArray)) {
    return langArray
  }

  // String value
  if (typeof langArray === 'string') {
    return { tr: langArray, en: langArray }
  }

  // Array format
  if (Array.isArray(langArray)) {
    for (const item of langArray) {
      if (item && item.lang && item.value) {
        result[item.lang] = item.value
      }
    }
  }

  return result
}

/**
 * Map old propertyType (number) → new type (string)
 */
const PROPERTY_TYPE_MAP = {
  1: 'hotel',
  2: 'apart',
  3: 'boutique',
  4: 'hotel', // tatil köyü → hotel
  5: 'resort',
  6: 'hostel',
  7: 'villa',
  8: 'guesthouse',
  9: 'motel',
  10: 'pension',
  11: 'camping'
}

export function mapPropertyType(oldType) {
  return PROPERTY_TYPE_MAP[oldType] || 'hotel'
}

/**
 * Map old amenity IDs → new amenity strings
 */
const AMENITY_MAP = {
  1: 'wifi',
  2: 'pool',
  3: 'parking',
  4: 'spa',
  5: 'gym',
  6: 'restaurant',
  7: 'bar',
  8: 'roomService',
  9: 'airConditioning',
  10: 'elevator',
  11: 'reception24h',
  12: 'laundry',
  13: 'sauna',
  14: 'hammam',
  15: 'beachAccess',
  16: 'privateBeach',
  17: 'indoorPool',
  18: 'outdoorPool',
  19: 'kidsClub',
  20: 'playground',
  21: 'freeParking',
  22: 'airportShuttle',
  23: 'conferenceHall',
  24: 'meetingRooms',
  25: 'businessCenter',
  26: 'garden',
  27: 'terrace',
  28: 'petFriendly',
  29: 'wheelchairAccessible',
  30: 'concierge',
  31: 'minibar',
  32: 'breakfast',
  33: 'tennis',
  34: 'golf',
  35: 'waterSports',
  36: 'diving',
  37: 'casino',
  38: 'nightclub',
  39: 'babysitting',
  40: 'dryCleaning'
}

export function mapAmenities(oldAmenityIds) {
  if (!Array.isArray(oldAmenityIds)) return []
  return oldAmenityIds.map(id => AMENITY_MAP[id]).filter(Boolean)
}

/**
 * Map old currency code → new format
 */
export function mapCurrency(oldCurrency) {
  if (!oldCurrency) return 'EUR'
  const upper = oldCurrency.toUpperCase()
  const VALID = ['TRY', 'USD', 'EUR', 'GBP']
  return VALID.includes(upper) ? upper : 'EUR'
}

/**
 * Map meal plan code → standard code
 */
const MEAL_CODE_MAP = {
  ro: 'RO',
  bb: 'BB',
  hb: 'HB',
  fb: 'FB',
  ai: 'AI',
  uai: 'UAI',
  sc: 'RO', // self catering → room only
  hbp: 'HB', // half board plus → half board
  fbp: 'FB', // full board plus → full board
  aip: 'AI' // all inclusive plus → all inclusive
}

export function mapMealPlanCode(oldCode) {
  if (!oldCode) return 'RO'
  const lower = oldCode.toLowerCase().trim()
  return MEAL_CODE_MAP[lower] || oldCode.toUpperCase().substring(0, 5)
}

/**
 * Get included meals based on meal plan code
 */
export function getIncludedMeals(code) {
  const meals = {
    RO: {},
    BB: { breakfast: true },
    HB: { breakfast: true, dinner: true },
    FB: { breakfast: true, lunch: true, dinner: true },
    AI: { breakfast: true, lunch: true, dinner: true, snacks: true, drinks: true },
    UAI: {
      breakfast: true,
      lunch: true,
      dinner: true,
      snacks: true,
      drinks: true,
      alcoholicDrinks: true,
      minibar: true,
      roomService: true
    }
  }
  return meals[code] || {}
}

/**
 * Build old photo URL
 * @param {number} hotelId - Legacy hotel ID
 * @param {*} photoId - Photo ID
 * @param {'general'|'rooms'} type - Photo type
 */
export function buildOldPhotoUrl(hotelId, photoId, type = 'general') {
  return `https://images.minirez.com/hotels/hotel${hotelId}/${type}/${photoId}.jpg`
}

/**
 * Convert old room occupancy adjustments → new multiplier data
 * Old format varies; returns a simplified structure
 */
export function convertOccupancyAdjustments(room) {
  const result = {
    pricingType: 'unit',
    useMultipliers: false
  }

  // If room has calculation.type = 'perPerson', it's OBP
  if (room?.calculation?.type === 'perPerson' || room?.calculation?.type === 'per_person') {
    result.pricingType = 'per_person'

    // Check for occupancy adjustments
    if (room.occupancyAdjustments && typeof room.occupancyAdjustments === 'object') {
      result.useMultipliers = true
      result.adultMultipliers = {}
      result.childMultipliers = {}

      // Adult adjustments: {1: -20, 2: 0, 3: 30} (percentage adjustments → multipliers)
      const adults = room.occupancyAdjustments.adults || room.occupancyAdjustments
      if (adults && typeof adults === 'object') {
        for (const [count, adjustment] of Object.entries(adults)) {
          if (!isNaN(count) && !isNaN(adjustment)) {
            // Convert percentage adjustment to multiplier: -20% → 0.8, 0% → 1.0, 30% → 1.3
            result.adultMultipliers[count] = 1 + Number(adjustment) / 100
          }
        }
      }
    }
  }

  return result
}

/**
 * Parse legacy date format (YYYYMMDD number) to Date object
 * @param {number} num - Date as number (e.g. 20200815)
 * @returns {Date|null}
 */
export function parseLegacyDate(num) {
  if (!num) return null
  const str = String(num)
  if (str.length !== 8) return null
  const year = parseInt(str.substring(0, 4))
  const month = parseInt(str.substring(4, 6)) - 1 // 0-indexed
  const day = parseInt(str.substring(6, 8))
  const date = new Date(year, month, day)
  if (isNaN(date.getTime())) return null
  return date
}

/**
 * Parse legacy status array to new status string
 * @param {Array} statusArr - Legacy status array [{type, user, date}]
 * @returns {string} - 'confirmed'|'completed'|'cancelled'
 */
export function parseLegacyStatus(statusArr) {
  if (!Array.isArray(statusArr) || !statusArr.length) return 'confirmed'
  // Legacy status array: first element is the LATEST status (e.g. [{type:'completed',...}, {type:'initialize',...}])
  const latest = statusArr[0]
  const type = (latest?.type || '').toLowerCase()
  if (type === 'cancelled' || type === 'cancel') return 'cancelled'
  if (type === 'completed' || type === 'complete') return 'completed'
  if (type === 'confirmed' || type === 'confirm') return 'confirmed'
  // 'initialize', 'pending' etc → confirmed
  return 'confirmed'
}

/**
 * Parse full name string into firstName/lastName
 * @param {string} str - Full name (e.g. "John Doe")
 * @returns {{ firstName: string, lastName: string }}
 */
export function parseGuestName(str) {
  if (!str || typeof str !== 'string') return { firstName: 'Guest', lastName: '-' }
  const parts = str.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '-' }
  const lastName = parts.pop()
  return { firstName: parts.join(' '), lastName }
}

/**
 * Map legacy guest type string to new guest type/title
 * @param {string} str - e.g. "adult-male", "adult-female", "child"
 * @returns {{ type: string, title: string }}
 */
export function mapLegacyGuestType(str) {
  if (!str) return { type: 'adult', title: 'mr' }
  const lower = str.toLowerCase()
  if (lower.includes('child')) return { type: 'child', title: 'mr' }
  if (lower.includes('infant') || lower.includes('baby')) return { type: 'infant', title: 'mr' }
  if (lower.includes('female') || lower.includes('woman')) return { type: 'adult', title: 'mrs' }
  return { type: 'adult', title: 'mr' }
}

/**
 * Map legacy payment method to new system enum
 * Legacy: creditcard, directly, banktransfer, hoteleft, payOnArrival, loyalty
 * New:    credit_card, bank_transfer, cash, agency_credit, online, pay_at_checkin
 */
const PAYMENT_METHOD_MAP = {
  creditcard: 'credit_card',
  'credit-card': 'credit_card',
  credit_card: 'credit_card',
  directly: 'cash',
  cash: 'cash',
  banktransfer: 'bank_transfer',
  'bank-transfer': 'bank_transfer',
  bank_transfer: 'bank_transfer',
  hoteleft: 'bank_transfer',
  payonarrival: 'pay_at_checkin',
  pay_on_arrival: 'pay_at_checkin',
  loyalty: 'agency_credit',
  online: 'online'
}

export function mapLegacyPaymentMethod(method) {
  if (!method) return 'cash'
  return PAYMENT_METHOD_MAP[method.toLowerCase().trim()] || 'cash'
}

/**
 * Parse legacy payments array and calculate totals
 * @param {Array} payments - Legacy payments array
 * @param {string} currency - Booking currency
 * @returns {{ method, paidAmount, transactions }}
 */
export function parseLegacyPayments(payments, bookingCurrency) {
  if (!Array.isArray(payments) || !payments.length) {
    return { method: 'cash', paidAmount: 0, transactions: [] }
  }

  // Determine primary payment method (from first completed payment, or first payment)
  const firstCompleted = payments.find(p => {
    const s = (p.status || '').toLowerCase()
    return s === 'completed' || s === 'complete' || s === 'paid'
  })
  const primaryMethod = mapLegacyPaymentMethod((firstCompleted || payments[0])?.method)

  const cur = (bookingCurrency || 'EUR').toLowerCase()
  let paidAmount = 0
  const transactions = []

  for (const p of payments) {
    const paymentStatus = (p.status || '').toLowerCase()
    const isCompleted =
      paymentStatus === 'completed' || paymentStatus === 'complete' || paymentStatus === 'paid'

    // Resolve amount in booking currency:
    // - fromAmount = what customer was charged (source currency)
    // - toAmount = what hotel received (destination currency)
    // Pick the one matching the booking currency; fallback to fromAmount
    let amount = 0
    const fromAmt = p.fromAmount
    const toAmt = p.toAmount

    if (fromAmt && typeof fromAmt === 'object') {
      if ((fromAmt.currency || '').toLowerCase() === cur) {
        amount = Number(fromAmt.value) || 0
      } else if (
        toAmt &&
        typeof toAmt === 'object' &&
        (toAmt.currency || '').toLowerCase() === cur
      ) {
        amount = Number(toAmt.value) || 0
      } else {
        // No currency match - use fromAmount as best guess
        amount = Number(fromAmt.value) || 0
      }
    } else {
      // Simple numeric amount (edge case)
      amount = Number(p.toAmount || p.fromAmount || p.amount) || 0
    }

    if (isCompleted && amount > 0) {
      paidAmount += amount
    }

    transactions.push({
      type: 'payment',
      amount,
      currency: bookingCurrency || 'EUR',
      date: p.date ? new Date(p.date) : new Date(),
      reference: p.bank || '',
      gateway: p.method || 'legacy',
      gatewayTransactionId: p.transactionId || '',
      status: isCompleted ? 'completed' : 'pending',
      metadata: {
        legacyMethod: p.method,
        installment: p.installment,
        fromAmount: p.fromAmount,
        toAmount: p.toAmount
      }
    })
  }

  return { method: primaryMethod, paidAmount, transactions }
}

/**
 * Resolve legacy city/country IDs to names
 * @param {Object} legacyLocation - Legacy location data
 * @param {Function} LegacyCity - City model getter
 * @param {Function} LegacyCountry - Country model getter
 * @returns {Promise<{city: string, country: string, street: string, coordinates: object}>}
 */
export async function resolveLocation(legacyLocation, LegacyCity, LegacyCountry) {
  const result = {
    city: '',
    country: '',
    street: '',
    coordinates: {}
  }

  if (!legacyLocation) return result

  // Resolve city name
  if (legacyLocation.city) {
    try {
      const city = await LegacyCity().findOne({ id: legacyLocation.city }).lean()
      if (city) {
        const cityName = convertLangArray(city.name)
        result.city = cityName.tr || cityName.en || String(legacyLocation.city)
      }
    } catch {
      result.city = String(legacyLocation.city)
    }
  }

  // Resolve country name
  if (legacyLocation.country) {
    try {
      const country = await LegacyCountry().findOne({ id: legacyLocation.country }).lean()
      if (country) {
        const countryName = convertLangArray(country.name)
        result.country = countryName.tr || countryName.en || String(legacyLocation.country)
      }
    } catch {
      result.country = String(legacyLocation.country)
    }
  }

  // Address text
  if (legacyLocation.address) {
    result.street =
      typeof legacyLocation.address === 'string'
        ? legacyLocation.address
        : convertLangArray(legacyLocation.address).tr || ''
  }

  // Coordinates
  if (legacyLocation.lat && legacyLocation.lng) {
    result.coordinates = {
      lat: Number(legacyLocation.lat),
      lng: Number(legacyLocation.lng)
    }
  }

  return result
}
