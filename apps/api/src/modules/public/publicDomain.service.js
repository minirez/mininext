/**
 * Public Domain Service
 * Domain resolution for partner custom domains (PMS, B2B, B2C)
 */

import { asyncHandler } from '#helpers'
import Hotel from '../hotel/hotel.model.js'
import Partner from '../partner/partner.model.js'
import { BadRequestError, NotFoundError } from '#core/errors.js'

/**
 * Find partner by any custom domain (pms, extranet, site)
 */
const findPartnerByDomain = async domain => {
  // Try all domain types
  const partner =
    (await Partner.findByPmsDomain(domain)) ||
    (await Partner.findByExtranetDomain(domain)) ||
    (await Partner.findBySiteDomain(domain))
  return partner
}

/**
 * Pick the main image URL from an images array.
 * For linked hotels with no own images, falls back to the base hotel's images.
 */
const resolveMainImage = (hotel, baseHotelsMap) => {
  let images = hotel.images
  if ((!images || images.length === 0) && hotel.hotelType === 'linked' && hotel.hotelBase) {
    const baseId = hotel.hotelBase.toString()
    images = baseHotelsMap?.get(baseId)?.images
  }
  if (!images || images.length === 0) return ''
  const main = images.find(img => img.isMain) || images[0]
  return main?.url || ''
}

/**
 * Map raw hotel documents to the public-safe shape returned by resolve-domain.
 * Resolves images for linked hotels from base hotel data when needed.
 */
const mapHotelsForPublic = async hotels => {
  const linkedBaseIds = hotels
    .filter(h => h.hotelType === 'linked' && h.hotelBase && (!h.images || h.images.length === 0))
    .map(h => h.hotelBase)

  let baseHotelsMap = new Map()
  if (linkedBaseIds.length > 0) {
    const baseHotels = await Hotel.find({ _id: { $in: linkedBaseIds } })
      .select('_id images')
      .lean()
    for (const b of baseHotels) {
      baseHotelsMap.set(b._id.toString(), b)
    }
  }

  return hotels.map(h => ({
    id: h._id,
    name: h.name,
    slug: h.slug,
    logo: h.logo,
    image: resolveMainImage(h, baseHotelsMap),
    stars: h.stars,
    city: h.address?.city || ''
  }))
}

/**
 * Resolve domain to partner
 * GET /public/resolve-domain?domain=partner.example.com
 * Returns partner info based on domain match
 * First checks hotel-level PMS domains, then partner-level domains
 */
export const resolveDomain = asyncHandler(async (req, res) => {
  const { domain } = req.query

  if (!domain) {
    throw new BadRequestError('Domain parameter is required')
  }

  const normalizedDomain = domain.toLowerCase().trim()

  // 1. Check hotel-level PMS domain first
  const hotel = await Hotel.findByPmsDomain(normalizedDomain)
  if (hotel) {
    const partner = await Partner.findById(hotel.partner)
    if (partner && partner.status === 'active') {
      const hotels = await Hotel.find({
        partner: partner._id,
        status: 'active'
      })
        .select('_id name slug logo stars images address.city hotelType hotelBase')
        .limit(50)
        .lean()

      return res.json({
        success: true,
        data: {
          partnerId: partner._id,
          partnerName: partner.companyName,
          code: partner.code,
          logo: partner.branding?.logo,
          pmsHotel: {
            id: hotel._id,
            name: hotel.name,
            slug: hotel.slug,
            logo: hotel.logo,
            stars: hotel.stars
          },
          hotels: await mapHotelsForPublic(hotels)
        }
      })
    }
  }

  // 2. Try partner-level domains (extranet, site, pms)
  const partner = await findPartnerByDomain(normalizedDomain)

  if (partner && partner.status === 'active') {
    const hotels = await Hotel.find({
      partner: partner._id,
      status: 'active'
    })
      .select('_id name slug logo stars images address.city hotelType hotelBase')
      .limit(50)
      .lean()

    return res.json({
      success: true,
      data: {
        partnerId: partner._id,
        partnerName: partner.companyName,
        code: partner.code,
        logo: partner.branding?.logo,
        hotels: await mapHotelsForPublic(hotels)
      }
    })
  }

  // No match found
  throw new NotFoundError('No partner found for this domain')
})
