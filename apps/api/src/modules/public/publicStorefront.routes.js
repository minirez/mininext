/**
 * Public Storefront Routes
 * Public-facing storefront endpoints for B2C website rendering
 * No authentication required - resolves partner from domain
 */

import express from 'express'
import * as publicStorefrontService from './publicStorefront.service.js'

const router = express.Router()

/**
 * GET /public/storefront
 * Get storefront data for B2C website rendering
 */
router.get('/', publicStorefrontService.getPublicStorefront)

/**
 * GET /public/storefront/draftLive
 * Get draft storefront data for preview
 * Alias for GET /public/storefront?draftLive=true
 */
router.get('/draftLive', publicStorefrontService.getPublicStorefront)

/**
 * GET /public/storefront/pages
 * Get storefront pages
 */
router.get('/pages', publicStorefrontService.getPublicStorefrontPages)

/**
 * GET /public/storefront/sections/:sectionType
 * Get a specific section's data
 */
router.get('/sections/:sectionType', publicStorefrontService.getPublicStorefrontSection)

export default router
