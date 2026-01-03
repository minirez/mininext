/**
 * Paximum OTA Integration Routes
 *
 * Handles hotel search, booking, and reservation management via Paximum API
 */

import express from 'express'
import { protect, requirePartnerOrAdmin } from '../../middleware/auth.js'
import * as paximumController from './paximum.controller.js'

const router = express.Router()

// All routes require authentication
router.use(protect)
router.use(requirePartnerOrAdmin)

// Check if Paximum is enabled
router.get('/status', paximumController.getStatus)

// Location autocomplete
router.post('/autocomplete', paximumController.searchLocations)

// Hotel search
router.post('/search', paximumController.searchHotels)

// Hotel details
router.post('/hotel/:hotelId', paximumController.getHotelDetails)

// Get room offers for a hotel
router.post('/offers', paximumController.getOffers)

// Get offer details
router.post('/offer-details', paximumController.getOfferDetails)

// Begin booking transaction
router.post('/transaction', paximumController.beginTransaction)

// Add services to transaction
router.post('/transaction/:transactionId/services', paximumController.addServices)

// Set reservation info (travelers, customer)
router.post('/transaction/:transactionId/reservation-info', paximumController.setReservationInfo)

// Commit transaction (finalize booking)
router.post('/transaction/:transactionId/commit', paximumController.commitTransaction)

// Get reservation details
router.get('/reservation/:reservationNumber', paximumController.getReservationDetail)

// Get reservation list
router.post('/reservations', paximumController.getReservationList)

// Get cancellation penalty
router.get('/reservation/:reservationNumber/penalty', paximumController.getCancellationPenalty)

// Cancel reservation
router.post('/reservation/:reservationNumber/cancel', paximumController.cancelReservation)

export default router
