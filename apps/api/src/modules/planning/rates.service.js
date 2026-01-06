/**
 * Rates Service
 * Handles rate CRUD and bulk operations
 * Split from planning.service.js for better maintainability
 */

import Rate from './rate.model.js'
import Market from './market.model.js'
import AuditLog from '../audit/audit.model.js'
import { NotFoundError, BadRequestError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import logger from '../../core/logger.js'
import { getPartnerId, verifyHotelOwnership, getAuditActor } from '../../services/helpers.js'

// ==================== RATES ====================

export const getRates = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const {
    roomType,
    mealPlan,
    market,
    startDate,
    endDate,
    status,
    page = 1,
    limit = 500
  } = req.query
  const filters = { roomType, mealPlan, market, startDate, endDate, status }

  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(1000, Math.max(1, parseInt(limit) || 500))
  const skip = (pageNum - 1) * limitNum

  const [rates, total] = await Promise.all([
    Rate.findByHotel(hotelId, filters)
      .populate('roomType', 'name code')
      .populate('mealPlan', 'name code')
      .populate('market', 'name code currency')
      .populate('season', 'name code color')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Rate.countDocuments({ hotel: hotelId, ...filters })
  ])

  res.json({
    success: true,
    data: rates,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  })
})

export const getRatesCalendar = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const { startDate, endDate, roomType, mealPlan, market } = req.query

  if (!startDate || !endDate) {
    throw new BadRequestError('DATE_RANGE_REQUIRED')
  }

  const rates = await Rate.findInRange(hotelId, startDate, endDate, {
    roomType,
    mealPlan,
    market
  })

  res.json({
    success: true,
    data: {
      rates,
      overrides: []
    }
  })
})

export const getRatesPriceList = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const { roomType, market, mealPlan } = req.query

  if (!roomType) throw new BadRequestError('ROOM_TYPE_REQUIRED')
  if (!market) throw new BadRequestError('MARKET_REQUIRED')

  const periods = await Rate.getPeriodsView(hotelId, {
    roomType,
    market,
    mealPlan
  })

  const mealPlanGroups = {}
  periods.forEach(period => {
    if (!period.mealPlan) return
    const mpId = period.mealPlan._id.toString()
    if (!mealPlanGroups[mpId]) {
      mealPlanGroups[mpId] = {
        mealPlan: period.mealPlan,
        periods: []
      }
    }
    mealPlanGroups[mpId].periods.push({
      _id: period._id,
      startDate: period.startDate,
      endDate: period.endDate,
      pricePerNight: period.pricePerNight,
      currency: period.currency,
      minStay: period.minStay,
      maxStay: period.maxStay,
      releaseDays: period.releaseDays,
      allotment: period.allotment,
      stopSale: period.stopSale,
      singleStop: period.singleStop,
      closedToArrival: period.closedToArrival,
      closedToDeparture: period.closedToDeparture,
      extraAdult: period.extraAdult,
      extraChild: period.extraChild,
      extraInfant: period.extraInfant,
      singleSupplement: period.singleSupplement,
      childOrderPricing: period.childOrderPricing
    })
  })

  res.json({ success: true, data: Object.values(mealPlanGroups) })
})

export const getRate = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const rate = await Rate.findOne({ _id: id, hotel: hotelId, partner: partnerId })
    .populate('roomType', 'name code')
    .populate('mealPlan', 'name code')
    .populate('market', 'name code currency')
    .populate('season', 'name code color')

  if (!rate) throw new NotFoundError('RATE_NOT_FOUND')

  res.json({ success: true, data: rate })
})

export const createRate = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const { startDate, endDate, ...rateData } = req.body

  if (startDate && endDate) {
    const baseData = {
      ...rateData,
      partner: partnerId,
      hotel: hotelId
    }

    const result = await Rate.createForDateRange(baseData, startDate, endDate)

    logger.info(`${result.upsertedCount || 0} daily rates created for hotel ${hotelId}`)

    await AuditLog.log({
      actor: getAuditActor(req),
      module: 'planning',
      subModule: 'rate',
      action: 'create',
      target: {
        collection: 'rates',
        documentName: `${startDate} - ${endDate}`
      },
      changes: {
        after: {
          dateRange: { startDate, endDate },
          roomType: rateData.roomType,
          mealPlan: rateData.mealPlan,
          market: rateData.market,
          pricePerNight: rateData.pricePerNight
        }
      },
      metadata: {
        batchId: `rate-create-${Date.now()}`,
        notes: `Bulk rate creation: ${result.upsertedCount || 0} created, ${result.modifiedCount || 0} modified`
      },
      request: { method: req.method, path: req.originalUrl },
      status: 'success'
    })

    res.status(201).json({
      success: true,
      message: req.t('RATE_CREATED'),
      data: { created: result.upsertedCount || 0, modified: result.modifiedCount || 0 }
    })
  } else if (req.body.date) {
    const rate = await Rate.create({
      ...req.body,
      partner: partnerId,
      hotel: hotelId
    })

    logger.info(`Rate created for hotel ${hotelId}`)

    res.status(201).json({
      success: true,
      message: req.t('RATE_CREATED'),
      data: rate
    })
  } else {
    throw new BadRequestError('REQUIRED_DATE_OR_RANGE')
  }
})

export const updateRate = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const rate = await Rate.findOneAndUpdate(
    { _id: id, hotel: hotelId, partner: partnerId },
    req.body,
    { new: true, runValidators: true }
  )

  if (!rate) throw new NotFoundError('RATE_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('RATE_UPDATED'),
    data: rate
  })
})

export const deleteRate = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const rate = await Rate.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
  if (!rate) throw new NotFoundError('RATE_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('RATE_DELETED')
  })
})

export const bulkCreateRates = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { rates } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!Array.isArray(rates) || rates.length === 0) throw new BadRequestError('RATES_REQUIRED')
  if (rates.length > 1000) throw new BadRequestError('MAX_1000_RATES_PER_REQUEST')

  await verifyHotelOwnership(hotelId, partnerId)

  const ratesToCreate = rates.map(rate => ({
    ...rate,
    partner: partnerId,
    hotel: hotelId
  }))

  const created = await Rate.insertMany(ratesToCreate, { ordered: false })

  logger.info(`Bulk created ${created.length} rates for hotel ${hotelId}`)

  await AuditLog.log({
    actor: getAuditActor(req),
    module: 'planning',
    subModule: 'rate',
    action: 'create',
    target: {
      collection: 'rates',
      documentName: `Bulk create: ${created.length} rates`
    },
    changes: {
      after: {
        count: created.length,
        sample: rates.slice(0, 5)
      }
    },
    metadata: {
      batchId: `rate-bulk-create-${Date.now()}`,
      notes: `Bulk created ${created.length} rates`
    },
    request: { method: req.method, path: req.originalUrl },
    status: 'success'
  })

  res.status(201).json({
    success: true,
    message: req.t('RATES_CREATED'),
    data: { count: created.length }
  })
})

export const bulkUpdateRates = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { updates, filters } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const result = await Rate.bulkUpdateRates(hotelId, updates, filters)

  logger.info(`Bulk updated rates for hotel ${hotelId}`)

  res.json({
    success: true,
    message: req.t('RATES_UPDATED'),
    data: { modified: result.modifiedCount }
  })
})

export const quickUpdateSingleRate = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params
  const updateData = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const allowedFields = [
    'pricePerNight',
    'allotment',
    'minStay',
    'maxStay',
    'stopSale',
    'closedToArrival',
    'closedToDeparture',
    'extraAdult',
    'extraChild',
    'extraInfant',
    'childOrderPricing',
    'releaseDays'
  ]
  const sanitizedUpdate = {}

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      sanitizedUpdate[field] = updateData[field]
    }
  }

  if (Object.keys(sanitizedUpdate).length === 0) {
    throw new BadRequestError('NO_VALID_FIELDS')
  }

  const rate = await Rate.findOneAndUpdate(
    { _id: id, hotel: hotelId, partner: partnerId },
    { $set: sanitizedUpdate },
    { new: true, runValidators: true }
  )

  if (!rate) throw new NotFoundError('RATE_NOT_FOUND')

  logger.info(`Quick updated rate ${id} for hotel ${hotelId}`)

  res.json({
    success: true,
    message: req.t('RATE_UPDATED'),
    data: rate
  })
})

export const quickUpdateRates = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { rateIds, field, value } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!Array.isArray(rateIds) || !field) throw new BadRequestError('INVALID_PARAMS')
  if (rateIds.length > 1000) throw new BadRequestError('MAX_1000_RATES_PER_REQUEST')

  await verifyHotelOwnership(hotelId, partnerId)

  const allowedFields = [
    'pricePerNight',
    'allotment',
    'minStay',
    'maxStay',
    'stopSale',
    'closedToArrival',
    'closedToDeparture',
    'extraAdult',
    'extraChild',
    'extraInfant',
    'childOrderPricing',
    'releaseDays'
  ]
  if (!allowedFields.includes(field)) throw new BadRequestError('INVALID_FIELD')

  const result = await Rate.updateMany(
    { _id: { $in: rateIds }, hotel: hotelId, partner: partnerId },
    { $set: { [field]: value } }
  )

  res.json({
    success: true,
    message: req.t('RATES_UPDATED'),
    data: { modified: result.modifiedCount }
  })
})

export const toggleStopSale = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { rateIds, stopSale, reason } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!Array.isArray(rateIds)) throw new BadRequestError('INVALID_RATE_IDS')

  await verifyHotelOwnership(hotelId, partnerId)

  const result = await Rate.toggleStopSale(hotelId, rateIds, stopSale, reason)

  res.json({
    success: true,
    message: stopSale ? req.t('STOP_SALE_ENABLED') : req.t('STOP_SALE_DISABLED'),
    data: { modified: result.modifiedCount }
  })
})

export const updateAllotment = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { rateIds, allotment } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!Array.isArray(rateIds) || allotment === undefined)
    throw new BadRequestError('INVALID_PARAMS')

  await verifyHotelOwnership(hotelId, partnerId)

  const result = await Rate.updateAllotment(hotelId, rateIds, allotment)

  res.json({
    success: true,
    message: req.t('ALLOTMENT_UPDATED'),
    data: { modified: result.modifiedCount }
  })
})

export const bulkUpdateByDates = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { cells, updateFields, marketId } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!Array.isArray(cells) || cells.length === 0) throw new BadRequestError('CELLS_REQUIRED')
  if (!updateFields || Object.keys(updateFields).length === 0)
    throw new BadRequestError('UPDATE_FIELDS_REQUIRED')

  await verifyHotelOwnership(hotelId, partnerId)

  let currency = 'EUR'
  if (marketId) {
    const market = await Market.findById(marketId)
    if (market) {
      currency = market.currency || 'EUR'
    }
  }

  const allowedFields = [
    'pricePerNight',
    'allotment',
    'minStay',
    'maxStay',
    'stopSale',
    'singleStop',
    'closedToArrival',
    'closedToDeparture',
    'extraAdult',
    'extraChild',
    'extraInfant',
    'childOrderPricing',
    'releaseDays',
    'singleSupplement'
  ]
  const sanitizedUpdate = {}
  for (const field of allowedFields) {
    if (updateFields[field] !== undefined) {
      sanitizedUpdate[field] = updateFields[field]
    }
  }

  const ratesToUpsert = []
  for (const cell of cells) {
    const [year, month, day] = cell.date.split('-').map(Number)
    const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))

    ratesToUpsert.push({
      partner: partnerId,
      hotel: hotelId,
      roomType: cell.roomTypeId,
      mealPlan: cell.mealPlanId,
      market: marketId,
      date: targetDate,
      currency: currency,
      pricePerNight: sanitizedUpdate.pricePerNight ?? 0,
      allotment: sanitizedUpdate.allotment ?? 10,
      minStay: sanitizedUpdate.minStay ?? 1,
      maxStay: sanitizedUpdate.maxStay ?? 30,
      status: 'active',
      source: 'bulk',
      ...sanitizedUpdate
    })
  }

  const bulkResult = await Rate.bulkUpsert(ratesToUpsert)

  logger.info(
    `Bulk update: ${bulkResult.upsertedCount} created, ${bulkResult.modifiedCount} updated`
  )

  await AuditLog.log({
    actor: getAuditActor(req),
    module: 'planning',
    subModule: 'rate',
    action: 'update',
    target: {
      collection: 'rates',
      documentName: `${cells.length} cells updated`
    },
    changes: {
      after: {
        cells: cells.slice(0, 10),
        updateFields: sanitizedUpdate,
        marketId
      }
    },
    metadata: {
      batchId: `rate-bulk-${Date.now()}`,
      notes: `Bulk update: ${bulkResult.upsertedCount || 0} created, ${bulkResult.modifiedCount || 0} modified`
    },
    request: { method: req.method, path: req.originalUrl },
    status: 'success'
  })

  res.json({
    success: true,
    message: req.t('RATES_UPDATED'),
    data: {
      created: bulkResult.upsertedCount || 0,
      updated: bulkResult.modifiedCount || 0,
      total: ratesToUpsert.length
    }
  })
})
