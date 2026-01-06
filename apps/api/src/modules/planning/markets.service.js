/**
 * Markets Service
 * Handles market CRUD operations
 * Split from planning.service.js for better maintainability
 */

import Market from './market.model.js'
import Rate from './rate.model.js'
import { NotFoundError, BadRequestError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import logger from '../../core/logger.js'
import { getPartnerId, verifyHotelOwnership } from '../../services/helpers.js'

// ==================== MARKETS ====================

export const getMarkets = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const markets = await Market.findByHotel(hotelId)

  res.json({ success: true, data: markets })
})

export const getMarket = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const market = await Market.findOne({ _id: id, hotel: hotelId, partner: partnerId })
  if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

  res.json({ success: true, data: market })
})

export const createMarket = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const market = await Market.create({
    ...req.body,
    partner: partnerId,
    hotel: hotelId
  })

  logger.info(`Market created: ${market.code} for hotel ${hotelId}`)

  res.status(201).json({
    success: true,
    message: req.t('MARKET_CREATED'),
    data: market
  })
})

export const updateMarket = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const market = await Market.findOneAndUpdate(
    { _id: id, hotel: hotelId, partner: partnerId },
    req.body,
    { new: true, runValidators: true }
  )

  if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('MARKET_UPDATED'),
    data: market
  })
})

export const deleteMarket = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const rateCount = await Rate.countDocuments({ market: id })
  if (rateCount > 0) throw new BadRequestError('MARKET_HAS_RATES')

  const market = await Market.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
  if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('MARKET_DELETED')
  })
})

export const setDefaultMarket = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const market = await Market.findOneAndUpdate(
    { _id: id, hotel: hotelId, partner: partnerId },
    { isDefault: true },
    { new: true }
  )

  if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('DEFAULT_MARKET_SET'),
    data: market
  })
})

export const getAssignedCountries = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { excludeMarketId } = req.query

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const query = { hotel: hotelId, partner: partnerId }
  if (excludeMarketId) {
    query._id = { $ne: excludeMarketId }
  }

  const markets = await Market.find(query).select('countries code name')

  const assignedCountries = {}
  markets.forEach(market => {
    market.countries.forEach(country => {
      assignedCountries[country] = {
        marketId: market._id,
        marketCode: market.code,
        marketName: market.name
      }
    })
  })

  res.json({ success: true, data: assignedCountries })
})
