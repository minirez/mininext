/**
 * Planning Contract Service
 * Contract parsing and import operations
 */

import fs from 'fs'
import path from 'path'
import RoomType from './roomType.model.js'
import MealPlan from './mealPlan.model.js'
import Market from './market.model.js'
import Season from './season.model.js'
import Rate from './rate.model.js'
import Campaign from './campaign.model.js'
import AuditLog from '../audit/audit.model.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import logger from '#core/logger.js'
import { parseHotelContract } from '#services/geminiService.js'
import { getPartnerId, verifyHotelOwnership, getAuditActor } from '#services/helpers.js'

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

  // Save contract file to disk
  const extMap = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
  }
  const ext = extMap[mimeType] || '.bin'
  const safeFileName = (fileName || 'contract').replace(/[^a-zA-Z0-9._-]/g, '_')
  const storedName = `${Date.now()}-${safeFileName}${safeFileName.endsWith(ext) ? '' : ext}`
  const uploadDir = path.join('uploads', 'contracts', String(partnerId), String(hotelId))
  const filePath = path.join(uploadDir, storedName)

  fs.mkdirSync(uploadDir, { recursive: true })
  fs.writeFileSync(filePath, Buffer.from(fileContent, 'base64'))

  const fileUrl = `/${filePath}`
  logger.info(`Contract file saved: ${fileUrl}`)

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
    `Contract parsed - periods: ${result.data.periods?.length || 0}, rooms: ${result.data.roomTypes?.length || 0}, prices: ${result.data.pricing?.length || 0}, completeness: ${result.data.validation?.completeness ?? 'N/A'}%`
  )

  result.data.fileUrl = fileUrl
  result.data.fileName = fileName || 'contract'

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
    mealPlans: contractMealPlans = [],
    multiplierData
  } = contractData
  const { roomMappings = {}, mealPlanMappings = {}, periodMappings = {} } = mappings || {}
  const contractPricingType = contractData.contractInfo?.pricingType || 'unit'

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

        const newMaxAdults = cap.maxAdults ?? existingOccupancy.maxAdults ?? 2
        const newBaseOccupancy =
          cap.standardOccupancy ?? cap.maxAdults ?? existingOccupancy.baseOccupancy ?? 2
        const newMaxChildren =
          cap.maxChildren !== undefined ? cap.maxChildren : (existingOccupancy.maxChildren ?? 0)
        const newMaxInfants =
          cap.maxInfants !== undefined ? cap.maxInfants : (existingOccupancy.maxInfants ?? 0)
        const newTotalMaxGuests = cap.maxOccupancy ?? existingOccupancy.totalMaxGuests ?? 4

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
          maxAdults: cap.maxAdults ?? 2,
          baseOccupancy: cap.standardOccupancy ?? cap.maxAdults ?? 2,
          maxChildren: cap.maxChildren ?? 0,
          maxInfants: cap.maxInfants ?? 0,
          totalMaxGuests: cap.maxOccupancy ?? 4
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

  // Apply multiplier template if contract uses per_person_multiplier pricing
  let multipliersApplied = 0
  if (multiplierData && contractPricingType === 'per_person_multiplier') {
    logger.info('Applying multiplier template to room types...')
    for (const contractRoom of contractRoomTypes) {
      const mappedCode =
        roomMappings[contractRoom.contractName] ||
        contractRoom.matchedCode ||
        contractRoom.suggestedCode
      if (!mappedCode) continue

      const existingRoom = roomTypes.find(rt => rt.code === mappedCode)
      if (!existingRoom) continue

      const updateData = {
        pricingType: 'per_person',
        useMultipliers: true
      }
      if (multiplierData.adultMultipliers) {
        updateData['multiplierTemplate.adultMultipliers'] = multiplierData.adultMultipliers
      }
      if (multiplierData.childMultipliers) {
        updateData['multiplierTemplate.childMultipliers'] = multiplierData.childMultipliers
      }
      if (multiplierData.roundingRule) {
        updateData['multiplierTemplate.roundingRule'] = multiplierData.roundingRule
      }

      await RoomType.findByIdAndUpdate(existingRoom._id, updateData)
      multipliersApplied++
      logger.info(`Applied multiplier template to room: ${mappedCode}`)
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
  const periodReleaseDay = {}
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
    periodReleaseDay[period.code] = period.releaseDay ?? 0
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
    const effectiveReleaseDay = periodReleaseDay[periodCode] ?? 0
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
        // Normalize pricing type: per_person_multiplier → per_person for Rate storage
        const effectivePricingType =
          pricingType === 'per_person_multiplier' ? 'per_person' : pricingType || 'unit'

        const rateData = {
          pricingType: effectivePricingType,
          currency: market.currency || 'EUR',
          allotment: allotment || defaultAllotment,
          minStay: effectiveMinStay,
          releaseDays: effectiveReleaseDay,
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
        } else if (pricingType === 'per_person_multiplier') {
          // Multiplier-based OBP: store base price, multipliers live on RoomType
          rateData.pricePerNight = pricePerNight || 0
          rateData.extraInfant = extraInfant || 0
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
      notes: `Contract import: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped`,
      ...(contractData.fileUrl && { fileUrl: contractData.fileUrl }),
      ...(contractData.fileName && { fileName: contractData.fileName })
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
    `Contract import completed - rooms: ${roomsCreated}/${roomsUpdated}, mealPlans: ${mealPlansCreated}, seasons: ${seasonsCreated}, rates: ${createdCount}/${updatedCount}/${skippedCount}, campaigns: ${campaignsCreated}, multipliers: ${multipliersApplied}`
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
      totalOperations: bulkOps.length,
      multipliersApplied,
      pricingType: contractPricingType,
      validation: contractData.validation || null
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

  const market = await Market.findOne({ _id: marketId, hotel: hotelId })
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
