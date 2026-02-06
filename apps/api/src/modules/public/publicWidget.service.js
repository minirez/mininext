/**
 * Public Widget Service
 * Widget-specific endpoints for B2C booking widget
 */

import { asyncHandler } from '#helpers'
import { NotFoundError } from '#core/errors.js'
import Hotel from '#modules/hotel/hotel.model.js'

// Country to currency mapping
const COUNTRY_CURRENCY_MAP = {
  // Europe
  TR: { currency: 'TRY', locale: 'tr-TR' },
  DE: { currency: 'EUR', locale: 'de-DE' },
  AT: { currency: 'EUR', locale: 'de-AT' },
  CH: { currency: 'CHF', locale: 'de-CH' },
  GB: { currency: 'GBP', locale: 'en-GB' },
  FR: { currency: 'EUR', locale: 'fr-FR' },
  IT: { currency: 'EUR', locale: 'it-IT' },
  ES: { currency: 'EUR', locale: 'es-ES' },
  NL: { currency: 'EUR', locale: 'nl-NL' },
  BE: { currency: 'EUR', locale: 'nl-BE' },
  PT: { currency: 'EUR', locale: 'pt-PT' },
  GR: { currency: 'EUR', locale: 'el-GR' },
  PL: { currency: 'PLN', locale: 'pl-PL' },
  CZ: { currency: 'CZK', locale: 'cs-CZ' },
  HU: { currency: 'HUF', locale: 'hu-HU' },
  RO: { currency: 'RON', locale: 'ro-RO' },
  BG: { currency: 'BGN', locale: 'bg-BG' },
  UA: { currency: 'UAH', locale: 'uk-UA' },
  RU: { currency: 'RUB', locale: 'ru-RU' },
  SE: { currency: 'SEK', locale: 'sv-SE' },
  NO: { currency: 'NOK', locale: 'nb-NO' },
  DK: { currency: 'DKK', locale: 'da-DK' },
  FI: { currency: 'EUR', locale: 'fi-FI' },

  // Middle East
  AE: { currency: 'AED', locale: 'ar-AE' },
  SA: { currency: 'SAR', locale: 'ar-SA' },
  IL: { currency: 'ILS', locale: 'he-IL' },
  IR: { currency: 'IRR', locale: 'fa-IR' },

  // Asia
  CN: { currency: 'CNY', locale: 'zh-CN' },
  JP: { currency: 'JPY', locale: 'ja-JP' },
  KR: { currency: 'KRW', locale: 'ko-KR' },
  IN: { currency: 'INR', locale: 'hi-IN' },

  // Americas
  US: { currency: 'USD', locale: 'en-US' },
  CA: { currency: 'CAD', locale: 'en-CA' },
  MX: { currency: 'MXN', locale: 'es-MX' },
  BR: { currency: 'BRL', locale: 'pt-BR' },

  // Oceania
  AU: { currency: 'AUD', locale: 'en-AU' },
  NZ: { currency: 'NZD', locale: 'en-NZ' },

  // Africa
  ZA: { currency: 'ZAR', locale: 'en-ZA' },
  EG: { currency: 'EGP', locale: 'ar-EG' },

  // Caucasus
  AZ: { currency: 'AZN', locale: 'az-AZ' },
  GE: { currency: 'GEL', locale: 'ka-GE' },
  AM: { currency: 'AMD', locale: 'hy-AM' },

  // Balkans
  AL: { currency: 'ALL', locale: 'sq-AL' },
  RS: { currency: 'RSD', locale: 'sr-RS' },
  HR: { currency: 'EUR', locale: 'hr-HR' },
  SI: { currency: 'EUR', locale: 'sl-SI' },
  BA: { currency: 'BAM', locale: 'bs-BA' },
  ME: { currency: 'EUR', locale: 'sr-ME' },
  MK: { currency: 'MKD', locale: 'mk-MK' },
  XK: { currency: 'EUR', locale: 'sq-XK' }
}

// Default for unknown countries
const DEFAULT_MARKET = { currency: 'EUR', locale: 'en-US' }

/**
 * Detect market from IP address
 * Returns country code, currency and locale
 */
export const detectMarket = asyncHandler(async (req, res) => {
  // Get IP address
  const ip = req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection.remoteAddress ||
    '127.0.0.1'

  // For local/private IPs, default to Turkey
  const isLocalIP = ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.')

  let countryCode = 'TR' // Default to Turkey

  if (!isLocalIP) {
    // Try to detect country from IP
    // In production, you would use a GeoIP service like:
    // - MaxMind GeoLite2
    // - IP-API
    // - ipstack
    // For now, we'll use a header-based approach if available

    // Check for Cloudflare country header
    const cfCountry = req.headers['cf-ipcountry']
    if (cfCountry && cfCountry !== 'XX') {
      countryCode = cfCountry
    }

    // Check for nginx GeoIP header
    const geoCountry = req.headers['x-geoip-country']
    if (geoCountry) {
      countryCode = geoCountry
    }

    // Check Accept-Language header as fallback
    const acceptLang = req.headers['accept-language']
    if (!cfCountry && !geoCountry && acceptLang) {
      const langCountry = acceptLang.split(',')[0]?.split('-')[1]?.toUpperCase()
      if (langCountry && COUNTRY_CURRENCY_MAP[langCountry]) {
        countryCode = langCountry
      }
    }
  }

  // Get market info
  const marketInfo = COUNTRY_CURRENCY_MAP[countryCode] || DEFAULT_MARKET

  res.json({
    success: true,
    data: {
      countryCode,
      currency: marketInfo.currency,
      locale: marketInfo.locale,
      detectedFrom: isLocalIP ? 'default' : 'ip'
    }
  })
})

/**
 * Get hotel widget configuration
 * Returns hotel info and widget settings
 */
export const getWidgetConfig = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params

  // hotelCode can be either slug or _id
  const query = {
    status: 'active',
    'visibility.b2c': true
  }

  // Check if hotelCode is a valid ObjectId
  if (hotelCode.match(/^[0-9a-fA-F]{24}$/)) {
    query._id = hotelCode
  } else {
    query.slug = hotelCode
  }

  const hotel = await Hotel.findOne(query)
    .select('name slug logo contact address policies widgetConfig childAgeGroups images stars type')
    .populate('partner', 'companyName branding')

  if (!hotel) {
    throw new NotFoundError('Hotel not found or not available for B2C')
  }

  // Check if widget is enabled
  if (hotel.widgetConfig && hotel.widgetConfig.enabled === false) {
    throw new NotFoundError('Widget is disabled for this hotel')
  }

  // Get main image
  const mainImage = hotel.images?.find(img => img.isMain) || hotel.images?.[0]

  // Build widget config with defaults
  const widgetConfig = {
    enabled: hotel.widgetConfig?.enabled ?? true,
    mode: hotel.widgetConfig?.mode || 'floating',
    theme: hotel.widgetConfig?.theme || 'light',
    primaryColor: hotel.widgetConfig?.primaryColor || '#7c3aed',
    triggerPosition: hotel.widgetConfig?.triggerPosition || 'bottom-right',
    triggerText: hotel.widgetConfig?.triggerText || null,
    whatsapp: {
      enabled: hotel.widgetConfig?.whatsapp?.enabled ?? false,
      number: hotel.widgetConfig?.whatsapp?.number || hotel.contact?.phone,
      message: hotel.widgetConfig?.whatsapp?.message || null
    },
    paymentMethods: {
      creditCard: hotel.widgetConfig?.paymentMethods?.creditCard ?? true,
      payAtHotel: hotel.widgetConfig?.paymentMethods?.payAtHotel ?? true,
      bankTransfer: hotel.widgetConfig?.paymentMethods?.bankTransfer ?? false
    },
    guestOptions: {
      requireNationality: hotel.widgetConfig?.guestOptions?.requireNationality ?? true,
      requireBirthDate: hotel.widgetConfig?.guestOptions?.requireBirthDate ?? false,
      requirePhone: hotel.widgetConfig?.guestOptions?.requirePhone ?? true
    },
    showPoweredBy: hotel.widgetConfig?.showPoweredBy ?? true,
    showRoomCapacity: hotel.widgetConfig?.showRoomCapacity ?? true,
    showCampaigns: hotel.widgetConfig?.showCampaigns ?? true,
    showOriginalPrice: hotel.widgetConfig?.showOriginalPrice ?? true,
    minAdvanceBookingDays: hotel.widgetConfig?.minAdvanceBookingDays ?? 0,
    maxAdvanceBookingDays: hotel.widgetConfig?.maxAdvanceBookingDays ?? 365,
    maxNights: 30,
    maxRooms: 5
  }

  res.json({
    success: true,
    data: {
      hotel: {
        id: hotel._id,
        name: hotel.name,
        slug: hotel.slug,
        logo: hotel.logo,
        image: mainImage?.url || null,
        stars: hotel.stars,
        type: hotel.type,
        address: {
          city: hotel.address?.city,
          country: hotel.address?.country,
          formattedAddress: hotel.address?.formattedAddress
        },
        contact: {
          phone: hotel.contact?.phone,
          email: hotel.contact?.email,
          website: hotel.contact?.website
        },
        checkInTime: hotel.policies?.checkIn || '14:00',
        checkOutTime: hotel.policies?.checkOut || '12:00',
        childAgeGroups: hotel.childAgeGroups || [],
        partnerBranding: hotel.partner?.branding || null
      },
      config: widgetConfig
    }
  })
})
