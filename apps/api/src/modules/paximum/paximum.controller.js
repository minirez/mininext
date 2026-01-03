/**
 * Paximum OTA Integration Controller
 */

import { paximumService } from '../../services/paximumService.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import { BadRequestError } from '../../core/errors.js'
import logger from '../../core/logger.js'

/**
 * Check Paximum integration status
 * GET /paximum/status
 */
export const getStatus = asyncHandler(async (req, res) => {
  const enabled = await paximumService.isEnabled()
  const defaultMarkup = await paximumService.getDefaultMarkup()

  res.json({
    success: true,
    data: {
      enabled,
      defaultMarkup
    }
  })
})

/**
 * Search locations (autocomplete)
 * POST /paximum/autocomplete
 */
export const searchLocations = asyncHandler(async (req, res) => {
  const { query, productType = 2 } = req.body

  if (!query || query.length < 2) {
    throw new BadRequestError('Arama terimi en az 2 karakter olmalıdır')
  }

  const locations = await paximumService.searchLocations(query, productType)

  res.json({
    success: true,
    data: locations
  })
})

/**
 * Search hotels with pricing
 * POST /paximum/search
 */
export const searchHotels = asyncHandler(async (req, res) => {
  const {
    arrivalLocations,
    checkIn,
    nights,
    roomCriteria,
    nationality,
    currency,
    culture,
    markupPercent
  } = req.body

  if (!arrivalLocations || !arrivalLocations.length) {
    throw new BadRequestError('Lokasyon seçimi gereklidir')
  }

  if (!checkIn) {
    throw new BadRequestError('Giriş tarihi gereklidir')
  }

  if (!nights || nights < 1) {
    throw new BadRequestError('Gece sayısı en az 1 olmalıdır')
  }

  if (!roomCriteria || !roomCriteria.length) {
    throw new BadRequestError('Oda kriterleri gereklidir')
  }

  const markup = markupPercent ?? await paximumService.getDefaultMarkup()

  const result = await paximumService.searchHotels({
    arrivalLocations,
    checkIn,
    nights,
    roomCriteria,
    nationality,
    currency,
    culture
  }, markup)

  const { hotels, searchId } = result

  logger.info('Paximum: Hotel search completed', {
    location: arrivalLocations[0],
    checkIn,
    nights,
    resultCount: hotels.length,
    searchId
  })

  res.json({
    success: true,
    data: {
      hotels,
      searchId,
      count: hotels.length
    }
  })
})

/**
 * Get hotel details
 * POST /paximum/hotel/:hotelId
 */
export const getHotelDetails = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { culture = 'tr-TR' } = req.body

  if (!hotelId) {
    throw new BadRequestError('Otel ID gereklidir')
  }

  const hotel = await paximumService.getHotelDetails(hotelId, culture)

  if (!hotel) {
    throw new BadRequestError('Otel bulunamadı')
  }

  res.json({
    success: true,
    data: hotel
  })
})

/**
 * Get offers for a hotel
 * POST /paximum/offers
 */
export const getOffers = asyncHandler(async (req, res) => {
  const {
    searchId,
    hotelId,
    checkIn,
    nights,
    roomCriteria,
    nationality,
    currency,
    culture,
    markupPercent
  } = req.body

  if (!searchId) {
    throw new BadRequestError('SearchId gereklidir')
  }

  if (!hotelId) {
    throw new BadRequestError('Otel ID gereklidir')
  }

  const markup = markupPercent ?? await paximumService.getDefaultMarkup()

  const offers = await paximumService.getOffers({
    searchId,
    hotelId,
    checkIn,
    nights,
    roomCriteria,
    nationality,
    currency,
    culture
  }, markup)

  res.json({
    success: true,
    data: {
      offers,
      count: offers.length
    }
  })
})

/**
 * Get offer details
 * POST /paximum/offer-details
 */
export const getOfferDetails = asyncHandler(async (req, res) => {
  const { offerId, currency, culture } = req.body

  if (!offerId) {
    throw new BadRequestError('Offer ID gereklidir')
  }

  const details = await paximumService.getOfferDetails(offerId, currency, culture)

  res.json({
    success: true,
    data: details
  })
})

/**
 * Begin booking transaction
 * POST /paximum/transaction
 */
export const beginTransaction = asyncHandler(async (req, res) => {
  const { offerIds, currency, culture } = req.body

  if (!offerIds || !offerIds.length) {
    throw new BadRequestError('En az bir offer ID gereklidir')
  }

  const result = await paximumService.beginTransaction(offerIds, currency, culture)

  logger.info('Paximum: Transaction started', {
    transactionId: result.transactionId,
    userId: req.user._id
  })

  res.json({
    success: true,
    data: result
  })
})

/**
 * Add services to transaction
 * POST /paximum/transaction/:transactionId/services
 */
export const addServices = asyncHandler(async (req, res) => {
  const { transactionId } = req.params
  const { offers, currency, culture } = req.body

  if (!offers || !offers.length) {
    throw new BadRequestError('Servis bilgileri gereklidir')
  }

  const result = await paximumService.addServices(transactionId, offers, currency, culture)

  res.json({
    success: true,
    data: result
  })
})

/**
 * Set reservation info
 * POST /paximum/transaction/:transactionId/reservation-info
 */
export const setReservationInfo = asyncHandler(async (req, res) => {
  const { transactionId } = req.params
  const { travellers, customerInfo, agencyReservationNumber } = req.body

  if (!travellers || !travellers.length) {
    throw new BadRequestError('Yolcu bilgileri gereklidir')
  }

  const result = await paximumService.setReservationInfo(
    transactionId,
    travellers,
    customerInfo,
    agencyReservationNumber
  )

  res.json({
    success: true,
    data: result
  })
})

/**
 * Commit transaction (finalize booking)
 * POST /paximum/transaction/:transactionId/commit
 */
export const commitTransaction = asyncHandler(async (req, res) => {
  const { transactionId } = req.params

  const result = await paximumService.commitTransaction(transactionId)

  logger.info('Paximum: Reservation committed', {
    transactionId,
    reservationNumber: result.reservation?.reservationNumber,
    userId: req.user._id
  })

  res.json({
    success: true,
    data: result
  })
})

/**
 * Get reservation details
 * GET /paximum/reservation/:reservationNumber
 */
export const getReservationDetail = asyncHandler(async (req, res) => {
  const { reservationNumber } = req.params

  const reservation = await paximumService.getReservationDetail(reservationNumber)

  res.json({
    success: true,
    data: reservation
  })
})

/**
 * Get reservation list
 * POST /paximum/reservations
 */
export const getReservationList = asyncHandler(async (req, res) => {
  const result = await paximumService.getReservationList(req.body)

  res.json({
    success: true,
    data: result
  })
})

/**
 * Get cancellation penalty
 * GET /paximum/reservation/:reservationNumber/penalty
 */
export const getCancellationPenalty = asyncHandler(async (req, res) => {
  const { reservationNumber } = req.params

  const penalties = await paximumService.getCancellationPenalty(reservationNumber)

  res.json({
    success: true,
    data: penalties
  })
})

/**
 * Cancel reservation
 * POST /paximum/reservation/:reservationNumber/cancel
 */
export const cancelReservation = asyncHandler(async (req, res) => {
  const { reservationNumber } = req.params
  const { reason } = req.body

  const result = await paximumService.cancelReservation(reservationNumber, reason)

  logger.info('Paximum: Reservation cancelled', {
    reservationNumber,
    userId: req.user._id
  })

  res.json({
    success: true,
    data: result
  })
})
