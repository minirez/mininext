/**
 * Planning Service
 * Contains AI Pricing, Contract Import, Pricing Calculation, and Cache Management
 *
 * CRUD operations have been split into separate files:
 * - roomTypes.service.js - Room type operations
 * - mealPlans.service.js - Meal plan operations
 * - markets.service.js - Market operations
 * - seasons.service.js - Season operations
 * - rates.service.js - Rate operations
 * - campaigns.service.js - Campaign operations
 */

import RoomType from './roomType.model.js'
import MealPlan from './mealPlan.model.js'
import Market from './market.model.js'
import Season from './season.model.js'
import Rate from './rate.model.js'
import Campaign from './campaign.model.js'
import Hotel from '../hotel/hotel.model.js'
import AuditLog from '../audit/audit.model.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import logger from '../../core/logger.js'
import { parsePricingCommand, parseHotelContract } from '../../services/geminiService.js'
import { getPartnerId, verifyHotelOwnership, getAuditActor } from '../../services/helpers.js'
import pricingService from '../../services/pricingService.js'
import cache from '../../services/cacheService.js'

// ==================== AI PRICING ASSISTANT ====================

/**
 * Parse natural language pricing command with AI
 */
export const parseAIPricingCommand = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { command, currentMonth, selectionContext } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!command) throw new BadRequestError('COMMAND_REQUIRED')

  await verifyHotelOwnership(hotelId, partnerId)

  logger.info(`AI Query params - hotelId: ${hotelId}, partnerId: ${partnerId}`)
  logger.info(`AI currentMonth received: ${JSON.stringify(currentMonth)}`)
  if (selectionContext) {
    logger.info(`AI selectionContext received: ${JSON.stringify(selectionContext)}`)
  }

  const [roomTypes, mealPlans, markets, seasons] = await Promise.all([
    RoomType.find({ hotel: hotelId, partner: partnerId }).select('code name status').lean(),
    MealPlan.find({
      $or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
      partner: partnerId,
      status: 'active'
    })
      .select('code name')
      .lean(),
    Market.find({ hotel: hotelId, partner: partnerId, status: 'active' })
      .select('code name currency')
      .lean(),
    Season.find({ hotel: hotelId, partner: partnerId, status: 'active' })
      .select('code name dateRanges')
      .lean()
  ])

  logger.info(
    `AI Query results - roomTypes: ${roomTypes.length}, mealPlans: ${mealPlans.length}, markets: ${markets.length}, seasons: ${seasons.length}`
  )
  if (seasons.length > 0) {
    logger.info(`AI Seasons data: ${JSON.stringify(seasons)}`)
  }

  const context = {
    roomTypes: roomTypes.map(rt => ({
      code: rt.code,
      name: rt.name?.tr || rt.name?.en || rt.code,
      status: rt.status
    })),
    mealPlans: mealPlans.map(mp => ({
      code: mp.code,
      name: mp.name?.tr || mp.name?.en || mp.code
    })),
    markets: markets.map(m => ({ code: m.code, currency: m.currency })),
    seasons: seasons.map(s => ({
      code: s.code,
      name: s.name?.tr || s.name?.en || s.code,
      dateRanges: s.dateRanges
    })),
    currentMonth: currentMonth || null,
    selectionContext: selectionContext || null
  }

  const result = await parsePricingCommand(command, context)

  if (result.success && result.dateRange) {
    const filter = {
      hotel: hotelId,
      partner: partnerId,
      date: {
        $gte: new Date(result.dateRange.startDate),
        $lte: new Date(result.dateRange.endDate)
      }
    }

    if (result.filters?.roomTypes !== 'all' && Array.isArray(result.filters?.roomTypes)) {
      const rtIds = await RoomType.find({
        hotel: hotelId,
        code: { $in: result.filters.roomTypes }
      }).select('_id')
      filter.roomType = { $in: rtIds.map(r => r._id) }
    }

    if (result.filters?.mealPlans !== 'all' && Array.isArray(result.filters?.mealPlans)) {
      const mpIds = await MealPlan.find({
        $or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
        code: { $in: result.filters.mealPlans }
      }).select('_id')
      filter.mealPlan = { $in: mpIds.map(m => m._id) }
    }

    if (result.filters?.markets !== 'all' && Array.isArray(result.filters?.markets)) {
      const mIds = await Market.find({
        hotel: hotelId,
        code: { $in: result.filters.markets }
      }).select('_id')
      filter.market = { $in: mIds.map(m => m._id) }
    }

    result.affectedCount = await Rate.countDocuments(filter)
  }

  res.json({ success: true, data: result })
})

/**
 * Execute parsed AI pricing command
 */
export const executeAIPricingCommand = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { parsedCommand } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!parsedCommand || !parsedCommand.success) throw new BadRequestError('VALID_COMMAND_REQUIRED')

  await verifyHotelOwnership(hotelId, partnerId)

  const { dateRange, rateIds, selectedCells } = parsedCommand
  const useDirectIds = Array.isArray(rateIds) && rateIds.length > 0

  logger.info(
    `AI Execute: useDirectIds=${useDirectIds}, rateIds=${rateIds?.length || 0}, selectedCells=${selectedCells?.length || 0}`
  )

  const actions = parsedCommand.actions || [
    {
      action: parsedCommand.action,
      filters: parsedCommand.filters,
      value: parsedCommand.value,
      valueType: parsedCommand.valueType,
      reason: parsedCommand.reason,
      childIndex: parsedCommand.childIndex
    }
  ]

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const matchesDayOfWeek = (date, daysOfWeek) => {
    if (!daysOfWeek || daysOfWeek === 'all') return true
    if (!Array.isArray(daysOfWeek)) return true
    const normalizedDays = daysOfWeek.map(d => (typeof d === 'number' ? dayNames[d] : d))
    const dayName = dayNames[new Date(date).getDay()]
    return normalizedDays.includes(dayName)
  }

  const getMatchingDates = (startDate, endDate, daysOfWeek) => {
    const dates = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    start.setUTCHours(0, 0, 0, 0)
    end.setUTCHours(0, 0, 0, 0)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (matchesDayOfWeek(d, daysOfWeek)) {
        dates.push(new Date(d))
      }
    }
    return dates
  }

  const hasDayFilter = daysOfWeek => {
    return daysOfWeek && daysOfWeek !== 'all' && Array.isArray(daysOfWeek)
  }

  const buildDateFilter = (startDate, endDate, daysOfWeek) => {
    if (hasDayFilter(daysOfWeek)) {
      const matchingDates = getMatchingDates(startDate, endDate, daysOfWeek)
      return { $in: matchingDates }
    }
    return {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }

  let totalAffected = 0

  for (const act of actions) {
    const { action, filters, value, valueType, reason, childIndex } = act

    const rateFilter = {
      hotel: hotelId,
      partner: partnerId
    }

    if (filters?.roomTypes !== 'all' && Array.isArray(filters?.roomTypes)) {
      const rtIds = await RoomType.find({
        hotel: hotelId,
        code: { $in: filters.roomTypes }
      }).select('_id')
      rateFilter.roomType = { $in: rtIds.map(r => r._id) }
    }

    if (filters?.mealPlans !== 'all' && Array.isArray(filters?.mealPlans)) {
      const mpIds = await MealPlan.find({
        $or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
        code: { $in: filters.mealPlans }
      }).select('_id')
      rateFilter.mealPlan = { $in: mpIds.map(m => m._id) }
    }

    if (filters?.markets !== 'all' && Array.isArray(filters?.markets)) {
      const mIds = await Market.find({
        hotel: hotelId,
        code: { $in: filters.markets }
      }).select('_id')
      rateFilter.market = { $in: mIds.map(m => m._id) }
    }

    let updateResult
    let updateData = {}

    switch (action) {
      case 'stop_sale':
      case 'open_sale': {
        const isStopSale = action === 'stop_sale'

        if (useDirectIds) {
          updateResult = await Rate.updateMany(
            { _id: { $in: rateIds }, hotel: hotelId, partner: partnerId },
            {
              $set: {
                stopSale: isStopSale,
                stopSaleReason: isStopSale ? reason || '' : '',
                source: 'ai',
                aiCommand: action
              }
            }
          )
        } else {
          rateFilter.date = buildDateFilter(
            dateRange.startDate,
            dateRange.endDate,
            filters?.daysOfWeek
          )
          updateResult = await Rate.updateMany(rateFilter, {
            $set: {
              stopSale: isStopSale,
              stopSaleReason: isStopSale ? reason || '' : '',
              source: 'ai',
              aiCommand: action
            }
          })
        }
        logger.info(
          `${action}: updated ${updateResult.modifiedCount} rates (directIds=${useDirectIds})`
        )
        break
      }

      case 'single_stop':
      case 'open_single': {
        const isSingleStop = action === 'single_stop'

        if (useDirectIds) {
          updateResult = await Rate.updateMany(
            { _id: { $in: rateIds }, hotel: hotelId, partner: partnerId },
            {
              $set: {
                singleStop: isSingleStop,
                source: 'ai',
                aiCommand: action
              }
            }
          )
        } else {
          rateFilter.date = buildDateFilter(
            dateRange.startDate,
            dateRange.endDate,
            filters?.daysOfWeek
          )
          updateResult = await Rate.updateMany(rateFilter, {
            $set: {
              singleStop: isSingleStop,
              source: 'ai',
              aiCommand: action
            }
          })
        }
        logger.info(
          `${action}: updated ${updateResult.modifiedCount} rates (directIds=${useDirectIds})`
        )
        break
      }

      case 'update_allotment':
        updateData = { allotment: value }
        break

      case 'update_min_stay':
        updateData = { minStay: value }
        break

      case 'update_max_stay':
        updateData = { maxStay: value }
        break

      case 'close_to_arrival':
      case 'close_to_departure': {
        const fieldName = action === 'close_to_arrival' ? 'closedToArrival' : 'closedToDeparture'
        const fieldValue = value === true || value === 'true'

        if (useDirectIds) {
          updateResult = await Rate.updateMany(
            { _id: { $in: rateIds }, hotel: hotelId, partner: partnerId },
            {
              $set: {
                [fieldName]: fieldValue,
                source: 'ai',
                aiCommand: action
              }
            }
          )
        } else {
          rateFilter.date = buildDateFilter(
            dateRange.startDate,
            dateRange.endDate,
            filters?.daysOfWeek
          )
          updateResult = await Rate.updateMany(rateFilter, {
            $set: {
              [fieldName]: fieldValue,
              source: 'ai',
              aiCommand: action
            }
          })
        }
        logger.info(
          `${action}: updated ${updateResult.modifiedCount} rates (directIds=${useDirectIds})`
        )
        break
      }

      case 'set_price': {
        const roomTypeFilter =
          filters?.roomTypes !== 'all' && Array.isArray(filters?.roomTypes)
            ? { hotel: hotelId, code: { $in: filters.roomTypes } }
            : { hotel: hotelId }
        const roomTypesForPrice = await RoomType.find(roomTypeFilter).select('_id code').lean()

        const mealPlanFilter =
          filters?.mealPlans !== 'all' && Array.isArray(filters?.mealPlans)
            ? {
                $or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
                code: { $in: filters.mealPlans }
              }
            : { $or: [{ hotel: hotelId }, { hotel: null, isStandard: true }], status: 'active' }
        const mealPlansForPrice = await MealPlan.find(mealPlanFilter).select('_id code').lean()

        const marketFilter =
          filters?.markets !== 'all' && Array.isArray(filters?.markets)
            ? { hotel: hotelId, code: { $in: filters.markets } }
            : { hotel: hotelId, status: 'active' }
        const marketsForPrice = await Market.find(marketFilter).select('_id code currency').lean()

        const datesToProcess = getMatchingDates(
          dateRange.startDate,
          dateRange.endDate,
          filters?.daysOfWeek
        )
        logger.info(`set_price: ${datesToProcess.length} dates to process`)

        const ratesToUpsert = []
        for (const date of datesToProcess) {
          for (const rt of roomTypesForPrice) {
            for (const mp of mealPlansForPrice) {
              for (const market of marketsForPrice) {
                ratesToUpsert.push({
                  partner: partnerId,
                  hotel: hotelId,
                  roomType: rt._id,
                  mealPlan: mp._id,
                  market: market._id,
                  date: date,
                  pricePerNight: value,
                  currency: market.currency || 'EUR',
                  allotment: 10,
                  minStay: 1,
                  maxStay: 30,
                  status: 'active',
                  source: 'ai',
                  aiCommand: action
                })
              }
            }
          }
        }

        if (ratesToUpsert.length > 0) {
          const bulkResult = await Rate.bulkUpsert(ratesToUpsert)
          updateResult = { modifiedCount: bulkResult.modifiedCount + bulkResult.upsertedCount }
          logger.info(`set_price: upserted ${ratesToUpsert.length} rates`)
        } else {
          updateResult = { modifiedCount: 0 }
        }
        break
      }

      case 'update_price': {
        rateFilter.date = buildDateFilter(
          dateRange.startDate,
          dateRange.endDate,
          filters?.daysOfWeek
        )

        if (valueType === 'percentage') {
          const rates = await Rate.find(rateFilter)
          let updated = 0
          for (const rate of rates) {
            const newPrice = Math.round(rate.pricePerNight * (1 + value / 100))
            await Rate.findByIdAndUpdate(rate._id, {
              pricePerNight: newPrice,
              source: 'ai',
              aiCommand: 'update_price'
            })
            updated++
          }
          updateResult = { modifiedCount: updated }
          logger.info(`update_price (percentage): updated ${updated} rates`)
        } else {
          updateResult = await Rate.updateMany(rateFilter, {
            $set: {
              pricePerNight: value,
              source: 'ai',
              aiCommand: 'update_price'
            }
          })
          logger.info(`update_price (absolute): updated ${updateResult.modifiedCount} rates`)
        }
        break
      }

      case 'update_single_supplement':
        if (valueType === 'percentage') {
          const rates = await Rate.find(rateFilter)
          let updated = 0
          for (const rate of rates) {
            const currentSupplement = rate.singleSupplement || 0
            const newSupplement = Math.round(currentSupplement * (1 + value / 100))
            await Rate.findByIdAndUpdate(rate._id, { singleSupplement: newSupplement })
            updated++
          }
          updateResult = { modifiedCount: updated }
        } else {
          updateData = { singleSupplement: value }
        }
        break

      case 'update_extra_adult':
        if (valueType === 'percentage') {
          const rates = await Rate.find(rateFilter)
          let updated = 0
          for (const rate of rates) {
            if (!matchesDayOfWeek(rate.date, filters?.daysOfWeek)) continue
            const current = rate.extraAdult || 0
            const newValue = Math.round(current * (1 + value / 100))
            await Rate.findByIdAndUpdate(rate._id, { extraAdult: newValue })
            updated++
          }
          updateResult = { modifiedCount: updated }
        } else {
          updateData = { extraAdult: value }
        }
        break

      case 'update_extra_child':
        if (valueType === 'percentage') {
          const rates = await Rate.find(rateFilter)
          let updated = 0
          for (const rate of rates) {
            if (!matchesDayOfWeek(rate.date, filters?.daysOfWeek)) continue
            const current = rate.extraChild || 0
            const newValue = Math.round(current * (1 + value / 100))
            await Rate.findByIdAndUpdate(rate._id, { extraChild: newValue })
            updated++
          }
          updateResult = { modifiedCount: updated }
        } else {
          updateData = { extraChild: value }
        }
        break

      case 'update_extra_infant':
        if (valueType === 'percentage') {
          const rates = await Rate.find(rateFilter)
          let updated = 0
          for (const rate of rates) {
            if (!matchesDayOfWeek(rate.date, filters?.daysOfWeek)) continue
            const current = rate.extraInfant || 0
            const newValue = Math.round(current * (1 + value / 100))
            await Rate.findByIdAndUpdate(rate._id, { extraInfant: newValue })
            updated++
          }
          updateResult = { modifiedCount: updated }
        } else {
          updateData = { extraInfant: value }
        }
        break

      case 'update_child_free': {
        const rates = await Rate.find(rateFilter)
        let updated = 0
        for (const rate of rates) {
          if (!matchesDayOfWeek(rate.date, filters?.daysOfWeek)) continue
          const childPricing = rate.childPricing || []
          const idx = (childIndex || 1) - 1
          if (childPricing[idx]) {
            childPricing[idx].price = 0
          }
          await Rate.findByIdAndUpdate(rate._id, { childPricing })
          updated++
        }
        updateResult = { modifiedCount: updated }
        break
      }

      default:
        logger.warn(`Unknown AI action: ${action}`)
        continue
    }

    if (Object.keys(updateData).length > 0) {
      if (useDirectIds) {
        updateResult = await Rate.updateMany(
          { _id: { $in: rateIds }, hotel: hotelId, partner: partnerId },
          { $set: { ...updateData, source: 'ai', aiCommand: action } }
        )
        logger.info(`updateData with directIds: updated ${updateResult.modifiedCount} rates`)
      } else {
        if (!rateFilter.date) {
          rateFilter.date = buildDateFilter(
            dateRange.startDate,
            dateRange.endDate,
            filters?.daysOfWeek
          )
        }

        if (
          filters?.daysOfWeek &&
          filters.daysOfWeek !== 'all' &&
          Array.isArray(filters.daysOfWeek)
        ) {
          const rates = await Rate.find(rateFilter)
          let updated = 0
          for (const rate of rates) {
            if (matchesDayOfWeek(rate.date, filters.daysOfWeek)) {
              await Rate.findByIdAndUpdate(rate._id, { $set: updateData })
              updated++
            }
          }
          updateResult = { modifiedCount: updated }
        } else {
          updateResult = await Rate.updateMany(rateFilter, { $set: updateData })
        }
      }
    }

    const affected = updateResult?.modifiedCount || 0
    totalAffected += affected
    logger.info(`AI action executed for hotel ${hotelId}: ${action}, affected: ${affected}`)
  }

  await AuditLog.log({
    actor: getAuditActor(req),
    module: 'planning',
    subModule: 'rate',
    action: 'update',
    target: {
      collection: 'rates',
      documentName: `AI Command: ${parsedCommand.actions?.[0]?.action || parsedCommand.action || 'unknown'}`
    },
    changes: {
      after: {
        dateRange: dateRange,
        actions: actions.map(a => ({ action: a.action, value: a.value, valueType: a.valueType })),
        rateIds: rateIds?.slice(0, 10),
        totalAffected
      }
    },
    metadata: {
      batchId: `ai-pricing-${Date.now()}`,
      notes: `AI pricing command: ${actions.length} actions, ${totalAffected} rates affected`
    },
    request: { method: req.method, path: req.originalUrl },
    status: 'success'
  })

  res.json({
    success: true,
    message: req.t('AI_COMMAND_EXECUTED'),
    data: {
      actionsExecuted: actions.length,
      affected: totalAffected
    }
  })
})

// ==================== CONTRACT IMPORT ====================

/**
 * Parse hotel contract document using Gemini AI
 */
export const parseContract = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { fileContent, mimeType, fileName } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!fileContent) throw new BadRequestError('FILE_CONTENT_REQUIRED')
  if (!mimeType) throw new BadRequestError('MIME_TYPE_REQUIRED')

  await verifyHotelOwnership(hotelId, partnerId)

  const [roomTypes, mealPlans, markets] = await Promise.all([
    RoomType.find({ hotel: hotelId, partner: partnerId, status: { $ne: 'deleted' } })
      .select('code name')
      .lean(),
    MealPlan.find({
      $or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
      partner: partnerId,
      status: 'active'
    })
      .select('code name')
      .lean(),
    Market.find({ hotel: hotelId, partner: partnerId, status: 'active' })
      .select('code currency')
      .lean()
  ])

  const currency = markets[0]?.currency || 'EUR'

  logger.info(`Parsing contract for hotel ${hotelId} - file: ${fileName}, mimeType: ${mimeType}`)
  logger.info(
    `Context - rooms: ${roomTypes.length}, mealPlans: ${mealPlans.length}, currency: ${currency}`
  )

  const result = await parseHotelContract(fileContent, mimeType, {
    roomTypes,
    mealPlans,
    currency
  })

  if (!result.success) {
    throw new BadRequestError(result.error || 'CONTRACT_PARSE_FAILED')
  }

  if (result.data.roomTypes) {
    const existingCodes = roomTypes.map(rt => rt.code.toUpperCase())
    result.data.roomTypes = result.data.roomTypes.map(room => {
      const matchedCodeUpper = room.matchedCode?.toUpperCase()
      const isValidMatch = matchedCodeUpper && existingCodes.includes(matchedCodeUpper)

      let suggestedCode = room.suggestedCode
      if (!suggestedCode && room.contractName) {
        const words = room.contractName
          .replace(/[^a-zA-Z\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 0)
        if (words.length >= 3) {
          suggestedCode = words
            .slice(0, 3)
            .map(w => w[0].toUpperCase())
            .join('')
        } else if (words.length === 2) {
          suggestedCode = (words[0][0] + words[1].slice(0, 2)).toUpperCase()
        } else if (words.length === 1) {
          suggestedCode = words[0].slice(0, 3).toUpperCase()
        }
      }

      return {
        ...room,
        matchedCode: isValidMatch ? room.matchedCode : null,
        isNewRoom: !isValidMatch,
        suggestedCode: suggestedCode || room.contractCode || 'NEW',
        confidence: room.confidence || (isValidMatch ? 80 : 50)
      }
    })
  }

  if (result.data.mealPlans) {
    const existingMPCodes = mealPlans.map(mp => mp.code.toUpperCase())
    result.data.mealPlans = result.data.mealPlans.map(mp => {
      const matchedCodeUpper = mp.matchedCode?.toUpperCase()
      const isValidMatch = matchedCodeUpper && existingMPCodes.includes(matchedCodeUpper)

      let suggestedCode = mp.suggestedCode || mp.contractCode
      if (!suggestedCode) {
        const nameUpper = mp.contractName?.toUpperCase() || ''
        if (nameUpper.includes('ULTRA') || nameUpper.includes('UAI')) suggestedCode = 'UAI'
        else if (nameUpper.includes('ALL INCLUSIVE') || nameUpper.includes('HER ŞEY DAHİL'))
          suggestedCode = 'AI'
        else if (nameUpper.includes('FULL BOARD') || nameUpper.includes('TAM PANSİYON'))
          suggestedCode = 'FB'
        else if (nameUpper.includes('HALF BOARD') || nameUpper.includes('YARIM PANSİYON'))
          suggestedCode = 'HB'
        else if (nameUpper.includes('BREAKFAST') || nameUpper.includes('KAHVALTI'))
          suggestedCode = 'BB'
        else if (nameUpper.includes('ROOM ONLY') || nameUpper.includes('SADECE ODA'))
          suggestedCode = 'RO'
        else suggestedCode = 'AI'
      }

      return {
        ...mp,
        matchedCode: isValidMatch ? mp.matchedCode : null,
        isNewMealPlan: !isValidMatch,
        suggestedCode,
        confidence: mp.confidence || (isValidMatch ? 80 : 50)
      }
    })
  }

  result.data.existingRoomTypes = roomTypes
  result.data.existingMealPlans = mealPlans

  logger.info(
    `Contract parsed - periods: ${result.data.periods?.length || 0}, rooms: ${result.data.roomTypes?.length || 0}, prices: ${result.data.pricing?.length || 0}`
  )

  res.json({
    success: true,
    data: result.data
  })
})

/**
 * Import pricing from parsed contract data
 */
export const importContractPricing = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { contractData, mappings, options = {} } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!contractData) throw new BadRequestError('CONTRACT_DATA_REQUIRED')

  await verifyHotelOwnership(hotelId, partnerId)

  const {
    periods,
    pricing,
    roomTypes: contractRoomTypes = [],
    mealPlans: contractMealPlans = []
  } = contractData
  const { roomMappings = {}, mealPlanMappings = {}, periodMappings = {} } = mappings || {}

  const {
    overwriteExisting = false,
    defaultAllotment = 10,
    defaultMinStay = 1,
    createMissingRooms = true,
    createMissingMealPlans = true,
    updateRoomCapacity = true
  } = options

  let [roomTypes, mealPlans, markets] = await Promise.all([
    RoomType.find({ hotel: hotelId, partner: partnerId, status: { $ne: 'deleted' } }),
    MealPlan.find({
      $or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
      partner: partnerId,
      status: 'active'
    }),
    Market.find({ hotel: hotelId, partner: partnerId, status: 'active' }).lean()
  ])

  let roomsCreated = 0
  let roomsUpdated = 0
  let mealPlansCreated = 0

  logger.info(`Processing ${contractRoomTypes.length} contract room types for capacity update`)
  logger.info(`Room mappings received: ${JSON.stringify(roomMappings)}`)

  for (const contractRoom of contractRoomTypes) {
    const mappedCode =
      roomMappings[contractRoom.contractName] ||
      contractRoom.matchedCode ||
      contractRoom.suggestedCode

    if (!mappedCode) continue

    const existingRoom = roomTypes.find(rt => rt.code === mappedCode)

    if (existingRoom) {
      if (updateRoomCapacity && contractRoom.capacity) {
        const cap = contractRoom.capacity
        const existingOccupancy = existingRoom.occupancy || {}

        const newMaxAdults = cap.maxAdults || existingOccupancy.maxAdults || 2
        const newBaseOccupancy =
          cap.standardOccupancy || cap.maxAdults || existingOccupancy.baseOccupancy || 2
        const newMaxChildren =
          cap.maxChildren !== undefined ? cap.maxChildren : existingOccupancy.maxChildren || 2
        const newMaxInfants =
          cap.maxInfants !== undefined ? cap.maxInfants : existingOccupancy.maxInfants || 1
        const newTotalMaxGuests = cap.maxOccupancy || existingOccupancy.totalMaxGuests || 4

        const needsUpdate =
          newMaxAdults !== existingOccupancy.maxAdults ||
          newBaseOccupancy !== existingOccupancy.baseOccupancy ||
          newMaxChildren !== existingOccupancy.maxChildren ||
          newMaxInfants !== existingOccupancy.maxInfants ||
          newTotalMaxGuests !== existingOccupancy.totalMaxGuests

        if (needsUpdate) {
          await RoomType.findByIdAndUpdate(
            existingRoom._id,
            {
              'occupancy.maxAdults': newMaxAdults,
              'occupancy.baseOccupancy': newBaseOccupancy,
              'occupancy.maxChildren': newMaxChildren,
              'occupancy.maxInfants': newMaxInfants,
              'occupancy.totalMaxGuests': newTotalMaxGuests
            },
            { new: true }
          )
          roomsUpdated++
          logger.info(`Updated room capacity: ${mappedCode}`)
        }
      }
    } else if (createMissingRooms && contractRoom.isNewRoom) {
      const cap = contractRoom.capacity || {}
      const newRoom = await RoomType.create({
        hotel: hotelId,
        partner: partnerId,
        code: mappedCode,
        name: { tr: contractRoom.contractName, en: contractRoom.contractName },
        description: { tr: '', en: '' },
        occupancy: {
          maxAdults: cap.maxAdults || 2,
          baseOccupancy: cap.standardOccupancy || cap.maxAdults || 2,
          maxChildren: cap.maxChildren || 2,
          maxInfants: cap.maxInfants || 1,
          totalMaxGuests: cap.maxOccupancy || 4
        },
        status: 'active',
        displayOrder: roomTypes.length
      })
      roomTypes.push(newRoom)
      roomsCreated++
      logger.info(`Created new room type: ${mappedCode}`)
    }
  }

  for (const contractMP of contractMealPlans) {
    const mappedCode =
      mealPlanMappings[contractMP.contractName] ||
      contractMP.matchedCode ||
      contractMP.suggestedCode
    if (!mappedCode) continue

    const existingMP = mealPlans.find(mp => mp.code === mappedCode)

    if (!existingMP && createMissingMealPlans && contractMP.isNewMealPlan) {
      const newMP = await MealPlan.create({
        hotel: hotelId,
        partner: partnerId,
        code: mappedCode,
        name: { tr: contractMP.contractName, en: contractMP.contractName },
        description: { tr: '', en: '' },
        status: 'active'
      })
      mealPlans.push(newMP)
      mealPlansCreated++
      logger.info(`Created new meal plan: ${mappedCode}`)
    }
  }

  roomTypes = await RoomType.find({
    hotel: hotelId,
    partner: partnerId,
    status: { $ne: 'deleted' }
  }).lean()
  mealPlans = await MealPlan.find({
    $or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
    partner: partnerId,
    status: 'active'
  }).lean()

  const roomTypeMap = {}
  roomTypes.forEach(rt => {
    roomTypeMap[rt.code] = rt
  })

  const mealPlanMap = {}
  mealPlans.forEach(mp => {
    mealPlanMap[mp.code] = mp
  })

  let seasonStartDate = null
  let seasonEndDate = null
  for (const period of periods) {
    const start = new Date(period.startDate)
    const end = new Date(period.endDate)
    if (!seasonStartDate || start < seasonStartDate) seasonStartDate = start
    if (!seasonEndDate || end > seasonEndDate) seasonEndDate = end
  }

  const year = seasonStartDate ? seasonStartDate.getFullYear() : new Date().getFullYear()
  const seasonName = `${year} Sezonu`
  const seasonCode = `S${year}`

  let seasonsCreated = 0

  for (const market of markets) {
    const fullSeasonCode = `${seasonCode}-${market.code}`.toUpperCase()

    const existingSeason = await Season.findOne({
      hotel: hotelId,
      partner: partnerId,
      market: market._id,
      code: fullSeasonCode
    })

    if (!existingSeason) {
      await Season.create({
        hotel: hotelId,
        partner: partnerId,
        market: market._id,
        code: fullSeasonCode,
        name: { tr: seasonName, en: `${year} Season` },
        color: '#6366f1',
        dateRanges: [
          {
            startDate: seasonStartDate,
            endDate: seasonEndDate
          }
        ],
        priority: 0,
        displayOrder: 0,
        status: 'active'
      })
      seasonsCreated++
    }
  }

  const periodDates = {}
  const periodMinStay = {}
  for (const period of periods) {
    const startDate = new Date(period.startDate)
    const endDate = new Date(period.endDate)
    const dates = []

    const current = new Date(startDate)
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    periodDates[period.code] = dates
    periodMinStay[period.code] = period.minStay || defaultMinStay
  }

  let createdCount = 0
  let updatedCount = 0
  let skippedCount = 0
  const bulkOps = []

  for (const priceEntry of pricing) {
    const {
      periodCode,
      roomCode,
      mealPlanCode,
      pricePerNight,
      singleSupplement,
      extraAdult,
      extraChild,
      extraInfant,
      pricingType,
      occupancyPricing,
      minStay,
      allotment
    } = priceEntry

    const effectiveMinStay = minStay || periodMinStay[periodCode] || defaultMinStay
    const mappedRoomCode = roomMappings[roomCode] || roomCode
    const mappedMealPlanCode = mealPlanMappings[mealPlanCode] || mealPlanCode

    const roomType = roomTypeMap[mappedRoomCode]
    const mealPlan = mealPlanMap[mappedMealPlanCode]

    if (!roomType || !mealPlan) {
      skippedCount++
      continue
    }

    const dates = periodDates[periodCode]
    if (!dates || dates.length === 0) {
      skippedCount++
      continue
    }

    for (const market of markets) {
      for (const dateStr of dates) {
        const rateData = {
          pricingType: pricingType || 'unit',
          currency: market.currency || 'EUR',
          allotment: allotment || defaultAllotment,
          minStay: effectiveMinStay,
          source: 'contract',
          status: 'active'
        }

        if (pricingType === 'per_person' && occupancyPricing) {
          rateData.occupancyPricing = {}
          for (const [pax, price] of Object.entries(occupancyPricing)) {
            if (price !== undefined && price !== null) {
              rateData.occupancyPricing[pax] = price
            }
          }
          rateData.pricePerNight = 0
        } else {
          rateData.pricePerNight = pricePerNight || 0
          rateData.singleSupplement = singleSupplement || 0
          rateData.extraAdult = extraAdult || 0
          rateData.extraInfant = extraInfant || 0
        }

        if (Array.isArray(extraChild)) {
          rateData.childOrderPricing = extraChild
        }

        const filter = {
          hotel: hotelId,
          partner: partnerId,
          roomType: roomType._id,
          mealPlan: mealPlan._id,
          market: market._id,
          date: dateStr
        }

        if (overwriteExisting) {
          bulkOps.push({
            updateOne: {
              filter,
              update: { $set: { ...filter, ...rateData } },
              upsert: true
            }
          })
        } else {
          bulkOps.push({
            updateOne: {
              filter,
              update: { $setOnInsert: { ...filter, ...rateData } },
              upsert: true
            }
          })
        }
      }
    }
  }

  const BATCH_SIZE = 500
  for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
    const batch = bulkOps.slice(i, i + BATCH_SIZE)
    if (batch.length > 0) {
      const result = await Rate.bulkWrite(batch, { ordered: false })
      createdCount += result.upsertedCount || 0
      updatedCount += result.modifiedCount || 0
    }
  }

  if (!overwriteExisting) {
    skippedCount = bulkOps.length - createdCount
  }

  logger.info(
    `Contract import - bulkOps: ${bulkOps.length}, created: ${createdCount}, updated: ${updatedCount}, skipped: ${skippedCount}`
  )

  await AuditLog.log({
    actor: getAuditActor(req),
    module: 'planning',
    subModule: 'rate',
    action: 'import',
    target: {
      collection: 'rates',
      documentName: `Contract Import: ${contractData.contractInfo?.hotelName || 'Unknown'}`
    },
    changes: {
      after: {
        periods: periods?.length || 0,
        pricing: pricing?.length || 0,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount
      }
    },
    metadata: {
      batchId: `contract-import-${Date.now()}`,
      notes: `Contract import: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped`
    },
    request: { method: req.method, path: req.originalUrl },
    status: 'success'
  })

  let campaignsCreated = 0
  const createdCampaigns = []
  const earlyBookingDiscounts = contractData.earlyBookingDiscounts || []

  for (const eb of earlyBookingDiscounts) {
    if (!eb.discountPercentage || eb.discountPercentage <= 0) continue

    let saleStart, saleEnd, stayStart, stayEnd

    if (eb.salePeriod?.startDate) {
      saleStart = new Date(eb.salePeriod.startDate)
      saleEnd = new Date(eb.salePeriod.endDate)
    } else if (eb.bookingUntil) {
      saleStart = new Date()
      saleEnd = new Date(eb.bookingUntil)
    } else {
      saleStart = new Date()
      saleEnd = seasonEndDate
    }

    if (eb.stayPeriod?.startDate) {
      stayStart = new Date(eb.stayPeriod.startDate)
      stayEnd = new Date(eb.stayPeriod.endDate)
    } else {
      stayStart = seasonStartDate
      stayEnd = seasonEndDate
    }

    const ebCode = `EB${eb.discountPercentage}-${year}`.toUpperCase()
    const ebName = eb.name || `Erken Rezervasyon %${eb.discountPercentage}`

    try {
      const existingCampaign = await Campaign.findOne({
        hotel: hotelId,
        partner: partnerId,
        code: ebCode
      })

      if (!existingCampaign) {
        await Campaign.create({
          hotel: hotelId,
          partner: partnerId,
          code: ebCode,
          name: { tr: ebName, en: `Early Bird ${eb.discountPercentage}%` },
          description: {
            tr: `Kontrat EB indirimi: %${eb.discountPercentage}`,
            en: `Contract EB discount: ${eb.discountPercentage}%`
          },
          type: 'early_bird',
          bookingWindow: {
            startDate: saleStart,
            endDate: saleEnd
          },
          stayWindow: {
            startDate: stayStart,
            endDate: stayEnd
          },
          discount: {
            type: 'percentage',
            value: eb.discountPercentage
          },
          conditions: {
            minNights: 1
          },
          combinable: eb.isCumulative || false,
          applicationType: 'stay',
          calculationType: 'cumulative',
          priority: eb.discountPercentage,
          status: 'active'
        })
        createdCampaigns.push({
          code: ebCode,
          name: ebName,
          discount: eb.discountPercentage,
          salePeriod: { startDate: saleStart, endDate: saleEnd },
          stayPeriod: { startDate: stayStart, endDate: stayEnd }
        })
        campaignsCreated++
        logger.info(`Created EB campaign: ${ebCode}`)
      }
    } catch (err) {
      logger.warn(`Failed to create EB campaign ${ebCode}: ${err.message}`)
    }
  }

  logger.info(
    `Contract import completed - rooms: ${roomsCreated}/${roomsUpdated}, mealPlans: ${mealPlansCreated}, seasons: ${seasonsCreated}, rates: ${createdCount}/${updatedCount}/${skippedCount}, campaigns: ${campaignsCreated}`
  )

  res.json({
    success: true,
    message: req.t('CONTRACT_IMPORTED'),
    data: {
      roomsCreated,
      roomsUpdated,
      mealPlansCreated,
      seasonsCreated,
      campaignsCreated,
      campaigns: createdCampaigns,
      ratesCreated: createdCount,
      ratesUpdated: updatedCount,
      ratesSkipped: skippedCount,
      totalOperations: bulkOps.length
    }
  })
})

/**
 * Delete all pricing data for a specific market
 */
export const deleteMarketPricingData = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, marketId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

  await verifyHotelOwnership(hotelId, partnerId)

  const market = await Market.findOne({ _id: marketId, hotel: hotelId, partner: partnerId })
  if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

  const ratesDeleted = await Rate.deleteMany({
    hotel: hotelId,
    partner: partnerId,
    market: marketId
  })

  const seasonsDeleted = await Season.deleteMany({
    hotel: hotelId,
    partner: partnerId,
    market: marketId
  })

  await AuditLog.log({
    actor: getAuditActor(req),
    module: 'planning',
    subModule: 'pricing',
    action: 'delete',
    target: {
      collection: 'rates,seasons',
      documentId: marketId,
      documentName: `Market: ${market.name?.tr || market.code}`
    },
    changes: {
      before: {
        rates: ratesDeleted.deletedCount,
        seasons: seasonsDeleted.deletedCount
      },
      after: null
    },
    metadata: {
      notes: `Platform admin deleted all pricing data for market ${market.code}`
    },
    request: { method: req.method, path: req.originalUrl },
    status: 'success'
  })

  logger.info(
    `Platform admin deleted pricing data - hotel: ${hotelId}, market: ${marketId}, rates: ${ratesDeleted.deletedCount}, seasons: ${seasonsDeleted.deletedCount}`
  )

  res.json({
    success: true,
    message: req.t('PRICING_DATA_DELETED'),
    data: {
      ratesDeleted: ratesDeleted.deletedCount,
      seasonsDeleted: seasonsDeleted.deletedCount
    }
  })
})

// ==================== PRICING CALCULATION ENDPOINTS ====================

export const calculateRatePrice = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, rateId } = req.params
  const { adults = 2, children = [], nights = 1 } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const rate = await Rate.findById(rateId)
    .populate('roomType')
    .populate('mealPlan')
    .populate('market')

  if (!rate) throw new NotFoundError('RATE_NOT_FOUND')
  if (rate.hotel.toString() !== hotelId) throw new ForbiddenError('FORBIDDEN')

  const hotel = await Hotel.findById(hotelId).select('childAgeGroups').lean()
  const season = await Season.findByDate(hotelId, rate.market._id, rate.date)

  const restrictionCheck = pricingService.checkRestrictions(rate, {
    adults,
    bookingDate: new Date()
  })

  const priceResult = pricingService.calculateOccupancyPrice(
    rate,
    { adults, children, nights },
    {
      roomType: rate.roomType,
      market: rate.market,
      season,
      hotel
    }
  )

  res.json({
    success: true,
    data: {
      ...priceResult,
      restrictions: restrictionCheck,
      rate: {
        _id: rate._id,
        date: rate.date,
        roomType: rate.roomType?.code,
        mealPlan: rate.mealPlan?.code,
        market: rate.market?.code
      }
    }
  })
})

export const calculatePriceByQuery = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { roomTypeId, mealPlanId, marketId, date, adults = 2, children = [], nights = 1 } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!roomTypeId || !mealPlanId || !marketId || !date) {
    throw new BadRequestError('MISSING_REQUIRED_FIELDS')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const result = await pricingService.calculateBookingPrice({
    hotelId,
    roomTypeId,
    mealPlanId,
    marketId,
    date,
    adults,
    children,
    nights
  })

  res.json({
    success: result.success,
    data: result
  })
})

export const bulkCalculatePrices = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { queries } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!Array.isArray(queries) || queries.length === 0) {
    throw new BadRequestError('QUERIES_REQUIRED')
  }
  if (queries.length > 100) {
    throw new BadRequestError('MAX_100_QUERIES')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const queriesWithHotel = queries.map(q => ({ ...q, hotelId }))
  const results = await pricingService.bulkCalculatePrices(queriesWithHotel)

  res.json({
    success: true,
    data: results
  })
})

export const checkPricingAvailability = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { roomTypeId, mealPlanId, marketId, startDate, endDate, adults = 2 } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!roomTypeId || !mealPlanId || !marketId || !startDate || !endDate) {
    throw new BadRequestError('MISSING_REQUIRED_FIELDS')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const result = await pricingService.checkAvailability({
    hotelId,
    roomTypeId,
    mealPlanId,
    marketId,
    startDate,
    endDate,
    adults
  })

  res.json({
    success: true,
    data: result
  })
})

export const getEffectiveRateEndpoint = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { roomTypeId, mealPlanId, marketId, date } = req.query

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!roomTypeId || !mealPlanId || !marketId || !date) {
    throw new BadRequestError('MISSING_REQUIRED_FIELDS')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const result = await pricingService.getEffectiveRate(
    hotelId,
    roomTypeId,
    mealPlanId,
    marketId,
    date
  )

  res.json({
    success: true,
    data: result
  })
})

export const getEffectiveMultipliers = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { roomTypeId, marketId, date } = req.query

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!roomTypeId) {
    throw new BadRequestError('ROOM_TYPE_REQUIRED')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const roomType = await RoomType.findById(roomTypeId).lean()
  if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

  let market = null
  if (marketId) {
    market = await Market.findById(marketId).lean()
  }

  let season = null
  if (date && marketId) {
    season = await Season.findByDate(hotelId, marketId, date)
    if (season) season = season.toObject()
  }

  const effectiveMultipliers = pricingService.getEffectiveMultiplierTemplate(
    roomType,
    market,
    season
  )
  const effectivePricingType = pricingService.getEffectivePricingType(roomType, market, season)

  const hotel = await Hotel.findById(hotelId).select('childAgeGroups').lean()
  const effectiveChildAgeGroups = pricingService.getEffectiveChildAgeGroups(hotel, market, season)

  res.json({
    success: true,
    data: {
      roomType: {
        _id: roomType._id,
        code: roomType.code,
        pricingType: roomType.pricingType,
        useMultipliers: roomType.useMultipliers
      },
      market: market
        ? {
            _id: market._id,
            code: market.code
          }
        : null,
      season: season
        ? {
            _id: season._id,
            code: season.code,
            name: season.name
          }
        : null,
      effectivePricingType,
      effectiveMultipliers,
      effectiveChildAgeGroups
    }
  })
})

export const getCombinationTable = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { roomTypeId, marketId, date } = req.query

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!roomTypeId) {
    throw new BadRequestError('ROOM_TYPE_REQUIRED')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const roomType = await RoomType.findById(roomTypeId).lean()
  if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

  let market = null
  if (marketId) {
    market = await Market.findById(marketId).lean()
  }

  let season = null
  if (date && marketId) {
    season = await Season.findByDate(hotelId, marketId, date)
    if (season) season = season.toObject()
  }

  const effectiveMultipliers = pricingService.getEffectiveMultiplierTemplate(
    roomType,
    market,
    season
  )

  res.json({
    success: true,
    data: {
      roomType: {
        _id: roomType._id,
        code: roomType.code,
        occupancy: roomType.occupancy
      },
      effectivePricingType: pricingService.getEffectivePricingType(roomType, market, season),
      useMultipliers: effectiveMultipliers.useMultipliers,
      combinationTable: effectiveMultipliers.combinationTable,
      adultMultipliers: effectiveMultipliers.adultMultipliers,
      childMultipliers: effectiveMultipliers.childMultipliers,
      roundingRule: effectiveMultipliers.roundingRule
    }
  })
})

export const getEffectiveChildAgeGroups = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { marketId, date } = req.query

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

  await verifyHotelOwnership(hotelId, partnerId)

  const hotel = await Hotel.findById(hotelId).select('childAgeGroups').lean()

  let market = null
  if (marketId) {
    market = await Market.findById(marketId).lean()
  }

  let season = null
  if (date && marketId) {
    season = await Season.findByDate(hotelId, marketId, date)
    if (season) season = season.toObject()
  }

  const effectiveChildAgeGroups = pricingService.getEffectiveChildAgeGroups(hotel, market, season)

  let source = 'hotel'
  if (season && !season.childAgeSettings?.inheritFromMarket) {
    source = 'season'
  } else if (market && !market.childAgeSettings?.inheritFromHotel) {
    source = 'market'
  }

  res.json({
    success: true,
    data: {
      childAgeGroups: effectiveChildAgeGroups,
      source,
      hotel: {
        childAgeGroups: hotel?.childAgeGroups || []
      },
      market: market
        ? {
            _id: market._id,
            code: market.code,
            inheritFromHotel: market.childAgeSettings?.inheritFromHotel !== false,
            childAgeGroups: market.childAgeSettings?.childAgeGroups || []
          }
        : null,
      season: season
        ? {
            _id: season._id,
            code: season.code,
            inheritFromMarket: season.childAgeSettings?.inheritFromMarket !== false,
            childAgeGroups: season.childAgeSettings?.childAgeGroups || []
          }
        : null
    }
  })
})

export const calculatePriceWithCampaigns = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const {
    roomTypeId,
    mealPlanId,
    marketId,
    checkInDate,
    checkOutDate,
    adults = 2,
    children = [],
    includeCampaigns = true
  } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!roomTypeId || !mealPlanId || !marketId || !checkInDate || !checkOutDate) {
    throw new BadRequestError('MISSING_REQUIRED_FIELDS')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const result = await pricingService.calculatePriceWithCampaigns({
    hotelId,
    roomTypeId,
    mealPlanId,
    marketId,
    checkInDate,
    checkOutDate,
    adults,
    children,
    includeCampaigns
  })

  res.json({
    success: true,
    data: result
  })
})

export const getApplicableCampaigns = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { roomTypeId, marketId, mealPlanId, checkInDate, checkOutDate } = req.query

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!checkInDate || !checkOutDate) {
    throw new BadRequestError('DATES_REQUIRED')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const checkIn = new Date(checkInDate)
  const checkOut = new Date(checkOutDate)
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

  const campaigns = await pricingService.getApplicableCampaigns(hotelId, {
    checkInDate,
    checkOutDate,
    roomTypeId,
    marketId,
    mealPlanId,
    nights
  })

  res.json({
    success: true,
    data: {
      campaigns: campaigns.map(c => ({
        _id: c._id,
        code: c.code,
        name: c.name,
        type: c.type,
        discount: c.discount,
        conditions: c.conditions,
        combinable: c.combinable,
        priority: c.priority,
        applicationType: c.applicationType,
        calculationType: c.calculationType,
        stayWindow: c.stayWindow,
        bookingWindow: c.bookingWindow
      })),
      count: campaigns.length,
      query: {
        checkInDate,
        checkOutDate,
        nights,
        roomTypeId: roomTypeId || 'all',
        marketId: marketId || 'all',
        mealPlanId: mealPlanId || 'all'
      }
    }
  })
})

// ==================== CACHE MANAGEMENT ====================

export const getCacheStats = asyncHandler(async (req, res) => {
  const stats = cache.getStats()

  res.json({
    success: true,
    data: stats
  })
})

export const clearCache = asyncHandler(async (req, res) => {
  const { pattern } = req.body

  let clearedCount = 0
  if (pattern) {
    clearedCount = cache.deleteByPattern(pattern)
  } else {
    cache.clear()
    clearedCount = -1
  }

  logger.info(`Cache cleared by ${req.user.email}`, { pattern, clearedCount })

  res.json({
    success: true,
    message: pattern
      ? `Cleared ${clearedCount} cache entries matching pattern: ${pattern}`
      : 'Entire cache cleared',
    clearedCount
  })
})

export const invalidateCache = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params

  cache.invalidateEntity(entityType, entityId)

  logger.info(`Cache invalidated for ${entityType}:${entityId} by ${req.user.email}`)

  res.json({
    success: true,
    message: `Cache invalidated for ${entityType}:${entityId}`
  })
})
