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
 * Resolve domain to partner
 * GET /public/resolve-domain?domain=partner.example.com
 * Returns partner info based on domain match (checks pms, extranet, site domains)
 */
export const resolveDomain = asyncHandler(async (req, res) => {
  const { domain } = req.query

  if (!domain) {
    throw new BadRequestError('Domain parameter is required')
  }

  const normalizedDomain = domain.toLowerCase().trim()

  const partner = await findPartnerByDomain(normalizedDomain)

  if (partner && partner.status === 'active') {
    // Get all active hotels for this partner
    const hotels = await Hotel.find({
      partner: partner._id,
      status: 'active'
    })
      .select('_id name slug logo stars')
      .limit(50)

    return res.json({
      success: true,
      data: {
        partnerId: partner._id,
        partnerName: partner.companyName,
        code: partner.code,
        logo: partner.branding?.logo,
        hotels: hotels.map(h => ({
          id: h._id,
          name: h.name,
          slug: h.slug,
          logo: h.logo,
          stars: h.stars
        }))
      }
    })
  }

  // No match found
  throw new NotFoundError('No partner found for this domain')
})
