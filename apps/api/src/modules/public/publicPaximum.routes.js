/**
 * Public Paximum Routes (Storefront API Key Authentication)
 *
 * These endpoints are designed for storefront frontends (e.g. site3) that need
 * to call Paximum/bedbank endpoints server-to-server without a user JWT session.
 *
 * Authentication: x-storefront-key header (static secret)
 * Rate limiting: applied to prevent abuse
 *
 * Read-only endpoints: autocomplete, search, hotel details, offers, offer-details
 * Booking flow: transaction, services, reservation-info, commit
 */

import express from 'express'
import { requireStorefrontKey } from '#middleware/storefrontAuth.js'
import { publicSearchLimiter, globalLimiter } from '#middleware/rateLimiter.js'
import * as paximumController from '../paximum/paximum.controller.js'

const router = express.Router()

// All routes require storefront API key + global rate limit
router.use(globalLimiter)
router.use(requireStorefrontKey)

// ==================== READ-ONLY ENDPOINTS ====================

// Check if Paximum is enabled
router.get('/status', paximumController.getStatus)

// Location autocomplete
router.post('/autocomplete', publicSearchLimiter, paximumController.searchLocations)

// Hotel search
router.post('/search', publicSearchLimiter, paximumController.searchHotels)

// Hotel details
router.post('/hotel/:hotelId', paximumController.getHotelDetails)

// Get room offers for a hotel
router.post('/offers', publicSearchLimiter, paximumController.getOffers)

// Get offer details
router.post('/offer-details', paximumController.getOfferDetails)

// ==================== BOOKING FLOW ====================

// Begin booking transaction
router.post('/transaction', paximumController.beginTransaction)

// Add services to transaction
router.post('/transaction/:transactionId/services', paximumController.addServices)

// Set reservation info (travelers, customer)
router.post('/transaction/:transactionId/reservation-info', paximumController.setReservationInfo)

// Commit transaction (finalize booking)
router.post('/transaction/:transactionId/commit', paximumController.commitTransaction)

export default router
