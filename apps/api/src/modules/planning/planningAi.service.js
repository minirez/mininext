/**
 * Planning AI Service
 * AI-powered pricing command parsing and execution
 */

import RoomType from './roomType.model.js'
import MealPlan from './mealPlan.model.js'
import Market from './market.model.js'
import Season from './season.model.js'
import Rate from './rate.model.js'
import AuditLog from '../audit/audit.model.js'
import { BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import logger from '#core/logger.js'
import { parsePricingCommand } from '#services/geminiService.js'
import { getPartnerId, verifyHotelOwnership, getAuditActor } from '#services/helpers.js'

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
          // Use bulkWrite for efficient batch update
          const rates = await Rate.find(rateFilter).select('_id pricePerNight').lean()
          if (rates.length > 0) {
            const bulkOps = rates.map(rate => ({
              updateOne: {
                filter: { _id: rate._id },
                update: {
                  $set: {
                    pricePerNight: Math.round(rate.pricePerNight * (1 + value / 100)),
                    source: 'ai',
                    aiCommand: 'update_price'
                  }
                }
              }
            }))
            const bulkResult = await Rate.bulkWrite(bulkOps)
            updateResult = { modifiedCount: bulkResult.modifiedCount }
          } else {
            updateResult = { modifiedCount: 0 }
          }
          logger.info(`update_price (percentage): updated ${updateResult.modifiedCount} rates`)
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
          // Use bulkWrite for efficient batch update
          const rates = await Rate.find(rateFilter).select('_id singleSupplement').lean()
          if (rates.length > 0) {
            const bulkOps = rates.map(rate => ({
              updateOne: {
                filter: { _id: rate._id },
                update: {
                  $set: {
                    singleSupplement: Math.round((rate.singleSupplement || 0) * (1 + value / 100))
                  }
                }
              }
            }))
            const bulkResult = await Rate.bulkWrite(bulkOps)
            updateResult = { modifiedCount: bulkResult.modifiedCount }
          } else {
            updateResult = { modifiedCount: 0 }
          }
        } else {
          updateData = { singleSupplement: value }
        }
        break

      case 'update_extra_adult':
        if (valueType === 'percentage') {
          // Use bulkWrite for efficient batch update
          const rates = await Rate.find(rateFilter).select('_id date extraAdult').lean()
          const filteredRates = rates.filter(rate => matchesDayOfWeek(rate.date, filters?.daysOfWeek))
          if (filteredRates.length > 0) {
            const bulkOps = filteredRates.map(rate => ({
              updateOne: {
                filter: { _id: rate._id },
                update: {
                  $set: {
                    extraAdult: Math.round((rate.extraAdult || 0) * (1 + value / 100))
                  }
                }
              }
            }))
            const bulkResult = await Rate.bulkWrite(bulkOps)
            updateResult = { modifiedCount: bulkResult.modifiedCount }
          } else {
            updateResult = { modifiedCount: 0 }
          }
        } else {
          updateData = { extraAdult: value }
        }
        break

      case 'update_extra_child':
        if (valueType === 'percentage') {
          // Use bulkWrite for efficient batch update
          const rates = await Rate.find(rateFilter).select('_id date extraChild').lean()
          const filteredRates = rates.filter(rate => matchesDayOfWeek(rate.date, filters?.daysOfWeek))
          if (filteredRates.length > 0) {
            const bulkOps = filteredRates.map(rate => ({
              updateOne: {
                filter: { _id: rate._id },
                update: {
                  $set: {
                    extraChild: Math.round((rate.extraChild || 0) * (1 + value / 100))
                  }
                }
              }
            }))
            const bulkResult = await Rate.bulkWrite(bulkOps)
            updateResult = { modifiedCount: bulkResult.modifiedCount }
          } else {
            updateResult = { modifiedCount: 0 }
          }
        } else {
          updateData = { extraChild: value }
        }
        break

      case 'update_extra_infant':
        if (valueType === 'percentage') {
          // Use bulkWrite for efficient batch update
          const rates = await Rate.find(rateFilter).select('_id date extraInfant').lean()
          const filteredRates = rates.filter(rate => matchesDayOfWeek(rate.date, filters?.daysOfWeek))
          if (filteredRates.length > 0) {
            const bulkOps = filteredRates.map(rate => ({
              updateOne: {
                filter: { _id: rate._id },
                update: {
                  $set: {
                    extraInfant: Math.round((rate.extraInfant || 0) * (1 + value / 100))
                  }
                }
              }
            }))
            const bulkResult = await Rate.bulkWrite(bulkOps)
            updateResult = { modifiedCount: bulkResult.modifiedCount }
          } else {
            updateResult = { modifiedCount: 0 }
          }
        } else {
          updateData = { extraInfant: value }
        }
        break

      case 'update_child_free': {
        // Use bulkWrite for efficient batch update
        const rates = await Rate.find(rateFilter).select('_id date childPricing').lean()
        const filteredRates = rates.filter(rate => matchesDayOfWeek(rate.date, filters?.daysOfWeek))
        if (filteredRates.length > 0) {
          const idx = (childIndex || 1) - 1
          const bulkOps = filteredRates.map(rate => {
            const childPricing = [...(rate.childPricing || [])]
            if (childPricing[idx]) {
              childPricing[idx] = { ...childPricing[idx], price: 0 }
            }
            return {
              updateOne: {
                filter: { _id: rate._id },
                update: { $set: { childPricing } }
              }
            }
          })
          const bulkResult = await Rate.bulkWrite(bulkOps)
          updateResult = { modifiedCount: bulkResult.modifiedCount }
        } else {
          updateResult = { modifiedCount: 0 }
        }
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
          // Use bulkWrite for efficient batch update
          const rates = await Rate.find(rateFilter).select('_id date').lean()
          const filteredRates = rates.filter(rate => matchesDayOfWeek(rate.date, filters.daysOfWeek))
          if (filteredRates.length > 0) {
            const bulkOps = filteredRates.map(rate => ({
              updateOne: {
                filter: { _id: rate._id },
                update: { $set: updateData }
              }
            }))
            const bulkResult = await Rate.bulkWrite(bulkOps)
            updateResult = { modifiedCount: bulkResult.modifiedCount }
          } else {
            updateResult = { modifiedCount: 0 }
          }
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
