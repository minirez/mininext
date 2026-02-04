/**
 * Legacy Storefront Routes
 *
 * Public-facing legacy endpoints for backward compatibility with site3.
 * These endpoints maintain the old API structure while using the new data models.
 *
 * NO AUTHENTICATION REQUIRED - resolves partner from referer/domain parameter
 */

import express from 'express'
import * as legacyService from './legacyStorefront.service.js'
import { globalLimiter } from '#middleware/rateLimiter.js'

const router = express.Router()

// Apply global rate limiter
router.use(globalLimiter)

// ==================== STOREFRONT DATA ====================

/**
 * GET /storefronts
 * Legacy endpoint for storefront configuration
 * Query params:
 * - referer: Domain for partner resolution (e.g., "minirezervasyon.com")
 */
router.get('/', legacyService.getLegacyStorefront)

/**
 * GET /storefronts/pages
 * Legacy endpoint for CMS pages
 * Query params:
 * - referer: Domain for partner resolution
 * - url: Specific page URL (optional)
 */
router.get('/pages', legacyService.getLegacyPages)

// ==================== SEARCH ====================

/**
 * POST /storefronts/search
 * Legacy location/hotel/tour search autocomplete
 * Body:
 * - referer: Domain for partner resolution
 * - search: Search term
 * - type: "hotel" | "tour" | "location" | "transfer" (optional, for filtering)
 * - route: "from" | "to" (for transfer type)
 */
router.post('/search', legacyService.legacySearch)

/**
 * GET /storefronts/locations/search
 * Legacy location autocomplete
 * Query params:
 * - query: Search term
 * - referer: Domain for partner resolution
 */
router.get('/locations/search', legacyService.legacyLocationSearch)

// ==================== HOTELS ====================

/**
 * GET /storefronts/mainpagehotels
 * Featured hotels for homepage
 * Query params:
 * - referer: Domain for partner resolution
 * - sessionId: Optional session ID
 */
router.get('/mainpagehotels', legacyService.getMainPageHotels)

/**
 * GET /storefronts/location/:searchterm
 * Hotel search by location
 * Params:
 * - searchterm: Location search term (URL encoded)
 * Query params:
 * - checkin, checkout: Date range
 * - adult, child: Guest counts
 * - referer: Domain for partner resolution
 */
router.get('/location/:searchterm', legacyService.getHotelsByLocation)

/**
 * GET /storefronts/hotel/:hotelId
 * Hotel details
 * Params:
 * - hotelId: Hotel ID (MongoDB ObjectId or slug)
 * Query params:
 * - checkin, checkout: Date range for pricing
 * - adult, child, ages: Guest counts
 * - referer: Domain for partner resolution
 */
router.get('/hotel/:hotelId', legacyService.getHotelDetails)

/**
 * GET /storefronts/hotel/:hotelId/photos
 * Hotel photos
 */
router.get('/hotel/:hotelId/photos', legacyService.getHotelPhotos)

// ==================== TOURS ====================

/**
 * GET /storefronts/mainpagetours
 * Featured tours for homepage
 * Query params:
 * - referer: Domain for partner resolution
 * - sessionId: Optional session ID
 */
router.get('/mainpagetours', legacyService.getMainPageTours)

/**
 * GET /storefronts/tour/:tourId
 * Tour details
 * Params:
 * - tourId: Tour ID
 * Query params:
 * - referer: Domain for partner resolution
 */
router.get('/tour/:tourId', legacyService.getTourDetails)

/**
 * GET /storefronts/tourlocation/:searchterm
 * Tour search by location
 * Params:
 * - searchterm: Location search term
 * Query params:
 * - month: YYYYMM format
 * - adult, child: Guest counts
 * - referer: Domain for partner resolution
 */
router.get('/tourlocation/:searchterm', legacyService.getToursByLocation)

export default router
