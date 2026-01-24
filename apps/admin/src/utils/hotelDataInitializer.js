/**
 * Hotel Data Initializer
 * Transforms AI extracted data into a standardized format
 */

/**
 * Create empty multilang object
 */
const emptyMultiLang = () => ({ tr: '', en: '' })

/**
 * Initialize extracted hotel data with defaults
 * Keeps all AI extracted data intact while ensuring required fields exist
 */
export function initializeExtractedData(data) {
  return {
    // Basic info
    name: data.name || '',
    description: {
      tr: data.description?.tr || '',
      en: data.description?.en || '',
      ...data.description
    },
    slug: data.slug || '',
    logo: data.logo || '',
    stars: data.stars || 3,
    type: data.type || 'hotel',
    category: data.category || 'standard',

    // Address with coordinates
    address: {
      street: data.address?.street || '',
      district: data.address?.district || '',
      city: data.address?.city || '',
      country: data.address?.country || '',
      postalCode: data.address?.postalCode || '',
      formattedAddress: data.address?.formattedAddress || '',
      coordinates: {
        lat: data.address?.coordinates?.lat || null,
        lng: data.address?.coordinates?.lng || null
      }
    },

    // Contact info
    contact: {
      phone: data.contact?.phone || '',
      email: data.contact?.email || '',
      website: data.contact?.website || '',
      callCenter: data.contact?.callCenter || '',
      fax: data.contact?.fax || '',
      authorizedPerson: data.contact?.authorizedPerson || '',
      authorizedEmail: data.contact?.authorizedEmail || '',
      authorizedPhone: data.contact?.authorizedPhone || '',
      socialMedia: data.contact?.socialMedia || {}
    },

    // Amenities
    amenities: data.amenities || [],

    // Room config
    roomConfig: {
      totalRooms: data.roomConfig?.totalRooms || 0,
      floors: data.roomConfig?.floors || 1,
      hasElevator: data.roomConfig?.hasElevator || false
    },

    // Policies
    policies: {
      checkIn: data.policies?.checkIn || '14:00',
      checkOut: data.policies?.checkOut || '12:00',
      maxBabyAge: data.policies?.maxBabyAge || 2,
      maxChildAge: data.policies?.maxChildAge || 12,
      childPolicy: data.policies?.childPolicy || emptyMultiLang(),
      petPolicy: data.policies?.petPolicy || emptyMultiLang(),
      additionalInfo: data.policies?.additionalInfo || emptyMultiLang(),
      cancellationRules: data.policies?.cancellationRules || [],
      freeCancellation: data.policies?.freeCancellation || { enabled: false, daysBeforeCheckIn: 1 }
    },

    // Full profile with all sections
    profile: initializeProfile(data.profile),

    // Images extracted from website
    images: (data.images || []).filter(img => img.url && img.url.startsWith('http')),

    // Room templates extracted from website
    roomTemplates: initializeRoomTemplates(data.roomTemplates),

    // Keep confidence scores for display
    confidence: data.confidence || {}
  }
}

/**
 * Initialize profile sections
 */
function initializeProfile(profile) {
  return {
    overview: {
      content: profile?.overview?.content || emptyMultiLang(),
      establishedYear: profile?.overview?.establishedYear || null,
      renovationYear: profile?.overview?.renovationYear || null,
      chainBrand: profile?.overview?.chainBrand || ''
    },
    facilities: {
      content: profile?.facilities?.content || emptyMultiLang(),
      features: profile?.facilities?.features || []
    },
    dining: {
      content: profile?.dining?.content || emptyMultiLang(),
      features: profile?.dining?.features || [],
      restaurants: profile?.dining?.restaurants || []
    },
    sportsEntertainment: {
      content: profile?.sportsEntertainment?.content || emptyMultiLang(),
      features: profile?.sportsEntertainment?.features || []
    },
    spaWellness: {
      content: profile?.spaWellness?.content || emptyMultiLang(),
      features: profile?.spaWellness?.features || [],
      spaDetails: profile?.spaWellness?.spaDetails || {}
    },
    familyKids: {
      content: profile?.familyKids?.content || emptyMultiLang(),
      features: profile?.familyKids?.features || [],
      kidsClubAges: profile?.familyKids?.kidsClubAges || { min: 4, max: 12 }
    },
    beachPool: {
      content: profile?.beachPool?.content || emptyMultiLang(),
      features: profile?.beachPool?.features || [],
      beachDetails: profile?.beachPool?.beachDetails || {},
      pools: profile?.beachPool?.pools || []
    },
    honeymoon: {
      content: profile?.honeymoon?.content || emptyMultiLang(),
      features: profile?.honeymoon?.features || [],
      available: profile?.honeymoon?.available || false
    },
    importantInfo: {
      content: profile?.importantInfo?.content || emptyMultiLang()
    },
    location: {
      content: profile?.location?.content || emptyMultiLang(),
      distances: profile?.location?.distances || []
    }
  }
}

/**
 * Initialize room templates
 */
function initializeRoomTemplates(roomTemplates) {
  if (!roomTemplates || !Array.isArray(roomTemplates)) {
    return []
  }

  return roomTemplates.map(room => ({
    code: room.code || '',
    name: room.name || emptyMultiLang(),
    description: room.description || emptyMultiLang(),
    images: (room.images || []).filter(img => img.url && img.url.startsWith('http')),
    amenities: room.amenities || [],
    size: room.size || null,
    bedConfiguration: room.bedConfiguration || [],
    occupancy: {
      maxAdults: room.occupancy?.maxAdults ?? 2,
      maxChildren: room.occupancy?.maxChildren ?? 0,
      maxInfants: room.occupancy?.maxInfants ?? 0,
      totalMaxGuests: room.occupancy?.totalMaxGuests ?? 4
    }
  }))
}

/**
 * Prepare hotel data for API submission
 */
export function prepareHotelDataForSave(extractedData, options = {}) {
  const { importImages = true, importLogo = true, importRoomTemplates = true } = options

  const hotelData = {
    ...extractedData,
    hotelType: 'base',
    status: 'draft'
  }

  // Remove confidence scores before saving
  delete hotelData.confidence

  // Handle images - if import is enabled, include image URLs for backend to download
  if (importImages && extractedData.images?.length) {
    hotelData.externalImages = extractedData.images
      .filter(img => !img.broken && img.url)
      .map(img => ({
        url: img.url,
        alt: img.alt || '',
        category: img.category || 'other'
      }))
  }
  delete hotelData.images

  // Handle logo
  if (importLogo && extractedData.logo) {
    hotelData.externalLogo = extractedData.logo
  }
  delete hotelData.logo

  // Handle room templates
  if (importRoomTemplates && extractedData.roomTemplates?.length) {
    hotelData.roomTemplates = extractedData.roomTemplates.map(room => ({
      code: room.code,
      name: room.name,
      description: room.description,
      amenities: room.amenities,
      size: room.size,
      bedConfiguration: room.bedConfiguration,
      occupancy: room.occupancy,
      // Include external images for backend to download
      externalImages: (room.images || [])
        .filter(img => img.url)
        .map(img => ({
          url: img.url,
          caption: img.caption || {}
        }))
    }))
  } else {
    delete hotelData.roomTemplates
  }

  return hotelData
}
