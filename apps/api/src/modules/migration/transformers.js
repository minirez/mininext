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
