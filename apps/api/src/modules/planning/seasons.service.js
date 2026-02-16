/**
 * Seasons Service
 * Handles season CRUD operations
 * Split from planning.service.js for better maintainability
 */

import Season from './season.model.js'
import Market from './market.model.js'
import Rate from './rate.model.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import logger from '#core/logger.js'
import { getPartnerId, verifyHotelOwnership } from '#services/helpers.js'

// ==================== SEASONS ====================

export const getSeasons = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { market: marketId } = req.query

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  if (!marketId) {
    throw new BadRequestError('MARKET_REQUIRED')
  }

  const market = await Market.findOne({ _id: marketId, hotel: hotelId })
  if (!market) {
    throw new NotFoundError('MARKET_NOT_FOUND')
  }

  const seasons = await Season.findByMarket(hotelId, marketId)

  res.json({ success: true, data: seasons })
})

export const getSeason = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const season = await Season.findOne({ _id: id, hotel: hotelId, partner: partnerId })
  if (!season) throw new NotFoundError('SEASON_NOT_FOUND')

  res.json({ success: true, data: season })
})

export const createSeason = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { market: marketId } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  if (!marketId) {
    throw new BadRequestError('MARKET_REQUIRED')
  }

  const market = await Market.findOne({ _id: marketId, hotel: hotelId })
  if (!market) {
    throw new NotFoundError('MARKET_NOT_FOUND')
  }

  const season = await Season.create({
    ...req.body,
    partner: partnerId,
    hotel: hotelId,
    market: marketId
  })

  logger.info(`Season created: ${season.code} for hotel ${hotelId}, market ${market.code}`)

  res.status(201).json({
    success: true,
    message: req.t('SEASON_CREATED'),
    data: season
  })
})

export const updateSeason = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const season = await Season.findOneAndUpdate(
    { _id: id, hotel: hotelId, partner: partnerId },
    req.body,
    { new: true, runValidators: true }
  )

  if (!season) throw new NotFoundError('SEASON_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('SEASON_UPDATED'),
    data: season
  })
})

export const deleteSeason = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const rateCount = await Rate.countDocuments({ season: id })
  if (rateCount > 0) throw new BadRequestError('SEASON_HAS_RATES')

  const season = await Season.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
  if (!season) throw new NotFoundError('SEASON_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('SEASON_DELETED')
  })
})
