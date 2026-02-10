import crypto from 'crypto'
import { asyncHandler } from '#helpers'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import logger from '#core/logger.js'
import { emitToRoom } from '#core/socket.js'
import Hotel from '#modules/hotel/hotel.model.js'
import RoomType from '#modules/planning/roomType.model.js'
import MealPlan from '#modules/planning/mealPlan.model.js'
import Market from '#modules/planning/market.model.js'
import MigrationHistory from './migrationHistory.model.js'
import { createLegacyConnection, disconnectLegacy, getLegacyStatus } from './legacyDb.js'
import {
  LegacyAccount,
  LegacyHotel,
  LegacyRoom,
  LegacyPricePlan,
  LegacyMarket,
  LegacyCity,
  LegacyCountry,
  clearModelCache
} from './legacyModels.js'
import {
  convertLangArray,
  mapPropertyType,
  mapAmenities,
  mapCurrency,
  mapMealPlanCode,
  getIncludedMeals,
  buildOldPhotoUrl,
  convertOccupancyAdjustments,
  resolveLocation
} from './transformers.js'
import { downloadImage } from '#helpers/imageDownloader.js'

/**
 * POST /connect - Connect to legacy DB
 */
export const connect = asyncHandler(async (req, res) => {
  const { uri } = req.body
  await createLegacyConnection(uri || undefined)
  res.json({ success: true, data: getLegacyStatus() })
})

/**
 * POST /disconnect - Disconnect legacy DB
 */
export const disconnect = asyncHandler(async (req, res) => {
  clearModelCache()
  await disconnectLegacy()
  res.json({ success: true, data: getLegacyStatus() })
})

/**
 * GET /status - Connection status
 */
export const getStatus = asyncHandler(async (req, res) => {
  res.json({ success: true, data: getLegacyStatus() })
})

/**
 * GET /accounts - List legacy accounts
 */
export const getAccounts = asyncHandler(async (req, res) => {
  await ensureConnected()

  const filter = { status: true }
  const { search, type } = req.query

  if (type) filter.corporateType = type
  if (search) {
    filter.$or = [
      { companyName: { $regex: search, $options: 'i' } },
      { founder: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }

  const accounts = await LegacyAccount()
    .find(filter)
    .select('id companyName founder corporateType type email companyPhone status')
    .sort({ companyName: 1 })
    .lean()

  // Count hotels per account
  const accountIds = accounts.map(a => a.id)
  const hotelCounts = await LegacyHotel().aggregate([
    { $match: { account: { $in: accountIds } } },
    { $group: { _id: '$account', count: { $sum: 1 } } }
  ])
  const countMap = Object.fromEntries(hotelCounts.map(h => [h._id, h.count]))

  const data = accounts
    .filter(a => (countMap[a.id] || 0) > 0)
    .map(a => ({
      id: a.id,
      companyName: a.companyName || a.founder || 'N/A',
      founder: a.founder,
      type: a.corporateType || a.type,
      email: a.email,
      phone: a.companyPhone,
      hotelCount: countMap[a.id] || 0
    }))

  res.json({ success: true, data })
})

/**
 * GET /accounts/:accountId/hotels - List hotels for an account
 */
export const getAccountHotels = asyncHandler(async (req, res) => {
  await ensureConnected()

  const accountId = Number(req.params.accountId)
  const hotels = await LegacyHotel()
    .find({ account: accountId })
    .select('id name code location photos currency details')
    .sort({ name: 1 })
    .lean()

  // Count rooms + priceplans per hotel
  const hotelIds = hotels.map(h => h.id)

  const [roomCounts, planCounts] = await Promise.all([
    LegacyRoom().aggregate([
      { $match: { hotel: { $in: hotelIds } } },
      { $group: { _id: '$hotel', count: { $sum: 1 } } }
    ]),
    LegacyPricePlan().aggregate([
      { $match: { hotel: { $in: hotelIds } } },
      { $group: { _id: '$hotel', count: { $sum: 1 } } }
    ])
  ])

  const roomMap = Object.fromEntries(roomCounts.map(r => [r._id, r.count]))
  const planMap = Object.fromEntries(planCounts.map(p => [p._id, p.count]))

  const data = await Promise.all(
    hotels.map(async h => {
      // Resolve city name
      let cityName = ''
      if (h.location?.city) {
        try {
          const city = await LegacyCity().findOne({ id: h.location.city }).lean()
          if (city) {
            const names = convertLangArray(city.name)
            cityName = names.tr || names.en || ''
          }
        } catch {}
      }

      return {
        id: h.id,
        name: h.name,
        code: h.code,
        city: cityName,
        stars: h.details?.rating || 0,
        roomCount: roomMap[h.id] || 0,
        mealPlanCount: planMap[h.id] || 0,
        photoCount: h.photos?.filter(p => p.status !== false)?.length || 0,
        currency: h.currency
      }
    })
  )

  res.json({ success: true, data })
})

/**
 * GET /accounts/:accountId/hotels/:hotelId/preview - Hotel detail preview
 */
export const previewHotel = asyncHandler(async (req, res) => {
  await ensureConnected()

  const hotelId = Number(req.params.hotelId)
  const hotel = await LegacyHotel().findOne({ id: hotelId }).lean()
  if (!hotel) throw new NotFoundError('Hotel not found in legacy DB')

  const [rooms, pricePlans, markets] = await Promise.all([
    LegacyRoom().find({ hotel: hotelId }).lean(),
    LegacyPricePlan().find({ hotel: hotelId }).lean(),
    LegacyMarket().find({ hotel: hotelId }).lean()
  ])

  // Resolve location
  const location = await resolveLocation(hotel.location, LegacyCity, LegacyCountry)

  const data = {
    hotel: {
      id: hotel.id,
      name: hotel.name,
      code: hotel.code,
      stars: hotel.details?.rating,
      type: mapPropertyType(hotel.details?.propertyType),
      description: convertLangArray(hotel.details?.factSheet),
      city: location.city,
      country: location.country,
      address: location.street,
      contact: hotel.contact,
      currency: hotel.currency,
      amenities: mapAmenities(hotel.amenities?.standard),
      checkinTime: hotel.details?.checkinTime,
      checkoutTime: hotel.details?.checkoutTime,
      infantAge: hotel.age?.infant,
      childAge: hotel.age?.child,
      photoCount: hotel.photos?.filter(p => p.status !== false)?.length || 0,
      photos: (hotel.photos || [])
        .filter(p => p.status !== false)
        .slice(0, 5)
        .map(p => buildOldPhotoUrl(hotel.id, p.id, 'general'))
    },
    rooms: rooms.map(r => ({
      id: r.id,
      name: convertLangArray(r.name),
      code: r.code,
      maxOccupant: r.maxOccupant,
      maxAdult: r.maxAdult,
      roomCount: r.roomCount,
      size: r.size,
      onlyAdult: r.onlyAdult,
      isBase: r.pricing?.isBase,
      photoCount: r.photos?.filter(p => p.status !== false)?.length || 0
    })),
    mealPlans: pricePlans.map(p => ({
      id: p.id,
      name: convertLangArray(p.name),
      code: p.code,
      isBase: p.pricing?.isBase,
      rateType: p.rateType
    })),
    markets: markets.map(m => ({
      id: m.id,
      name: m.name,
      currency: m.currency,
      status: m.status
    }))
  }

  res.json({ success: true, data })
})

/**
 * POST /migrate - Start migration (returns immediately, runs in background)
 */
export const migrate = asyncHandler(async (req, res) => {
  await ensureConnected()

  const { partnerId, accountId, hotels: hotelConfigs } = req.body

  if (!partnerId) throw new BadRequestError('partnerId is required')
  if (!accountId) throw new BadRequestError('accountId is required')
  if (!hotelConfigs?.length) throw new BadRequestError('At least one hotel must be selected')

  // Verify account exists
  const account = await LegacyAccount().findOne({ id: accountId }).lean()
  if (!account) throw new NotFoundError('Legacy account not found')

  // Clean up previously migrated hotels (allow re-migration)
  for (const hc of hotelConfigs) {
    await cleanupPreviousMigration(hc.oldHotelId)
  }

  const operationId = crypto.randomUUID()

  // Return immediately with operationId
  res.json({ success: true, data: { operationId } })

  // Run migration in background
  runMigration(operationId, req.user._id, partnerId, accountId, account, hotelConfigs)
})

/**
 * Run migration in background with real-time socket progress
 */
async function runMigration(operationId, userId, partnerId, accountId, account, hotelConfigs) {
  const emit = (event, data) => {
    emitToRoom(operationId, `migration:${event}`, { operationId, timestamp: Date.now(), ...data })
  }

  const accountName = account.companyName || account.founder

  // Create history record
  const history = await MigrationHistory.create({
    partner: partnerId,
    performedBy: userId,
    legacyAccountId: accountId,
    legacyAccountName: accountName,
    status: 'in_progress',
    summary: { totalHotels: hotelConfigs.length }
  })

  emit('started', { totalHotels: hotelConfigs.length, accountName, historyId: history._id })

  const results = []
  let migratedCount = 0
  let failedCount = 0
  let totalPhotos = 0
  let downloadedPhotos = 0

  for (let i = 0; i < hotelConfigs.length; i++) {
    const config = hotelConfigs[i]
    const startTime = Date.now()
    const hotelResult = {
      legacyHotelId: config.oldHotelId,
      legacyHotelName: '',
      newHotelId: null,
      status: 'success',
      roomTypes: { total: 0, migrated: 0, failed: 0 },
      mealPlans: { total: 0, migrated: 0, failed: 0 },
      markets: { total: 0, migrated: 0, failed: 0 },
      photos: { total: 0, downloaded: 0, failed: 0 },
      errors: [],
      duration: 0
    }

    emit('hotel:start', { hotelIndex: i, hotelName: '', totalHotels: hotelConfigs.length })

    try {
      const migrated = await migrateHotel(config, partnerId, hotelResult, emit, i)
      hotelResult.newHotelId = migrated._id
      hotelResult.legacyHotelName = migrated.name
      migratedCount++

      emit('hotel:complete', {
        hotelIndex: i,
        hotelName: migrated.name,
        status: 'success',
        stats: {
          rooms: hotelResult.roomTypes,
          mealPlans: hotelResult.mealPlans,
          markets: hotelResult.markets,
          photos: hotelResult.photos
        }
      })
    } catch (err) {
      hotelResult.status = 'failed'
      hotelResult.errors.push(err.message)
      failedCount++
      logger.error(`[Migration] Hotel ${config.oldHotelId} failed:`, err.message)

      emit('hotel:complete', {
        hotelIndex: i,
        hotelName: hotelResult.legacyHotelName || `Hotel #${config.oldHotelId}`,
        status: 'failed',
        errors: hotelResult.errors
      })
    }

    hotelResult.duration = Date.now() - startTime
    totalPhotos += hotelResult.photos.total
    downloadedPhotos += hotelResult.photos.downloaded
    results.push(hotelResult)
  }

  // Update history
  const finalStatus = failedCount === 0 ? 'completed' : migratedCount === 0 ? 'failed' : 'partial'

  history.status = finalStatus
  history.hotels = results
  history.completedAt = new Date()
  history.summary = {
    totalHotels: hotelConfigs.length,
    migratedHotels: migratedCount,
    failedHotels: failedCount,
    totalPhotos,
    downloadedPhotos
  }
  await history.save()

  emit('complete', { status: finalStatus, summary: history.summary, historyId: history._id })
}

/**
 * GET /history - Migration history
 */
export const getHistory = asyncHandler(async (req, res) => {
  const { partnerId, limit = 50 } = req.query

  const filter = {}
  if (partnerId) filter.partner = partnerId

  const history = await MigrationHistory.find(filter)
    .populate('partner', 'companyName')
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean()

  res.json({ success: true, data: history })
})

// ========================
// Internal helpers
// ========================

async function ensureConnected() {
  const status = getLegacyStatus()
  if (!status.connected) {
    await createLegacyConnection()
  }
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false
  return /^\S+@\S+\.\S+$/.test(email.trim())
}

/**
 * Migrate a single hotel
 */
async function migrateHotel(config, partnerId, hotelResult, emit, hotelIndex) {
  const { oldHotelId, includePhotos = true, includeRooms = true, includeMealPlans = true } = config

  // Fetch legacy hotel
  const legacyHotel = await LegacyHotel().findOne({ id: oldHotelId }).lean()
  if (!legacyHotel) throw new Error(`Hotel ${oldHotelId} not found in legacy DB`)

  hotelResult.legacyHotelName = legacyHotel.name

  // Update hotel:start with actual name
  emit('hotel:start', { hotelIndex, hotelName: legacyHotel.name, totalHotels: undefined })

  // Resolve location
  const location = await resolveLocation(legacyHotel.location, LegacyCity, LegacyCountry)

  // Create new hotel
  const newHotel = new Hotel({
    partner: partnerId,
    hotelType: 'partner',
    status: 'active',
    name: legacyHotel.name || 'Unnamed Hotel',
    description: convertLangArray(legacyHotel.details?.factSheet),
    stars: legacyHotel.details?.rating || 3,
    type: mapPropertyType(legacyHotel.details?.propertyType),
    address: {
      street: location.street,
      city: location.city,
      country: location.country,
      coordinates: location.coordinates
    },
    contact: {
      phone: legacyHotel.contact?.phone || '',
      email: isValidEmail(legacyHotel.contact?.email) ? legacyHotel.contact.email : undefined,
      website: legacyHotel.contact?.website || ''
    },
    amenities: mapAmenities(legacyHotel.amenities?.standard),
    policies: {
      checkIn: legacyHotel.details?.checkinTime || '14:00',
      checkOut: legacyHotel.details?.checkoutTime || '12:00',
      maxBabyAge: Math.min(legacyHotel.age?.infant || 2, 7),
      maxChildAge: Math.min(legacyHotel.age?.child || 12, 18)
    },
    pricingSettings: {
      currency: mapCurrency(legacyHotel.currency)
    },
    source: {
      type: 'migration',
      legacyId: oldHotelId
    }
  })

  await newHotel.save()
  logger.info(`[Migration] Hotel created: ${newHotel.name} (${newHotel._id})`)

  // Download hotel photos
  if (includePhotos && legacyHotel.photos?.length) {
    const activePhotos = legacyHotel.photos.filter(p => p.status !== false)
    hotelResult.photos.total = activePhotos.length

    const images = []
    const photoLimit = Math.min(activePhotos.length, 30)
    for (let i = 0; i < photoLimit; i++) {
      const photo = activePhotos[i]
      const url = buildOldPhotoUrl(oldHotelId, photo.id, 'general')

      emit('hotel:photo', { hotelIndex, current: i + 1, total: photoLimit, url })

      try {
        const result = await downloadImage(url, newHotel._id.toString(), `gallery-${i}`)
        if (result.success) {
          images.push({
            url: result.path,
            caption: {},
            isMain: i === 0,
            order: i
          })
          hotelResult.photos.downloaded++
        } else {
          hotelResult.photos.failed++
        }
      } catch {
        hotelResult.photos.failed++
      }
    }

    if (images.length) {
      newHotel.images = images
      await newHotel.save()
    }
  }

  // Migrate room types
  if (includeRooms) {
    const legacyRooms = await LegacyRoom().find({ hotel: oldHotelId }).lean()
    hotelResult.roomTypes.total = legacyRooms.length

    for (let ri = 0; ri < legacyRooms.length; ri++) {
      const legacyRoom = legacyRooms[ri]
      const roomName = convertLangArray(legacyRoom.name)
      emit('hotel:room', {
        hotelIndex,
        current: ri + 1,
        total: legacyRooms.length,
        roomName: roomName.tr || roomName.en || legacyRoom.code
      })

      try {
        await migrateRoomType(
          legacyRoom,
          newHotel,
          partnerId,
          oldHotelId,
          includePhotos,
          hotelResult,
          emit,
          hotelIndex
        )
        hotelResult.roomTypes.migrated++
      } catch (err) {
        hotelResult.roomTypes.failed++
        hotelResult.errors.push(`Room ${legacyRoom.code || legacyRoom.id}: ${err.message}`)
        logger.warn(`[Migration] Room ${legacyRoom.id} failed: ${err.message}`)
      }
    }
  }

  // Migrate meal plans
  if (includeMealPlans) {
    const legacyPlans = await LegacyPricePlan().find({ hotel: oldHotelId }).lean()
    hotelResult.mealPlans.total = legacyPlans.length

    for (let mi = 0; mi < legacyPlans.length; mi++) {
      const legacyPlan = legacyPlans[mi]
      emit('hotel:mealplan', {
        hotelIndex,
        current: mi + 1,
        total: legacyPlans.length,
        planCode: legacyPlan.code
      })

      try {
        await migrateMealPlan(legacyPlan, newHotel, partnerId)
        hotelResult.mealPlans.migrated++
      } catch (err) {
        hotelResult.mealPlans.failed++
        hotelResult.errors.push(`MealPlan ${legacyPlan.code || legacyPlan.id}: ${err.message}`)
        logger.warn(`[Migration] MealPlan ${legacyPlan.id} failed: ${err.message}`)
      }
    }
  }

  // Migrate markets
  const legacyMarkets = await LegacyMarket().find({ hotel: oldHotelId }).lean()
  hotelResult.markets.total = legacyMarkets.length

  for (let mki = 0; mki < legacyMarkets.length; mki++) {
    const legacyMarket = legacyMarkets[mki]
    const mktName =
      typeof legacyMarket.name === 'string'
        ? legacyMarket.name
        : convertLangArray(legacyMarket.name).tr ||
          convertLangArray(legacyMarket.name).en ||
          `Market ${legacyMarket.id}`
    emit('hotel:market', {
      hotelIndex,
      current: mki + 1,
      total: legacyMarkets.length,
      marketName: mktName
    })

    try {
      await migrateMarket(legacyMarket, newHotel, partnerId, mki === 0)
      hotelResult.markets.migrated++
    } catch (err) {
      hotelResult.markets.failed++
      hotelResult.errors.push(`Market ${mktName}: ${err.message}`)
      logger.warn(`[Migration] Market ${legacyMarket.id} failed: ${err.message}`)
    }
  }

  return newHotel
}

/**
 * Migrate a single room type
 */
async function migrateRoomType(
  legacyRoom,
  newHotel,
  partnerId,
  oldHotelId,
  includePhotos,
  hotelResult,
  emit,
  hotelIndex
) {
  const name = convertLangArray(legacyRoom.name)
  const description = convertLangArray(legacyRoom.description)
  const occupancy = convertOccupancyAdjustments(legacyRoom)

  // Generate a code, fallback to 'RM' + id
  let code = legacyRoom.code || `RM${legacyRoom.id}`
  code = code.toUpperCase().substring(0, 10)

  // Ensure code uniqueness within this hotel
  const existingCodes = await RoomType.find({ hotel: newHotel._id }).select('code').lean()
  const codeSet = new Set(existingCodes.map(r => r.code))
  let suffix = 1
  let finalCode = code
  while (codeSet.has(finalCode)) {
    finalCode = `${code.substring(0, 8)}${suffix}`
    suffix++
  }

  const isOnlyAdult = legacyRoom.onlyAdult === true || legacyRoom.onlyAdult === 1

  const roomType = new RoomType({
    partner: partnerId,
    hotel: newHotel._id,
    name: Object.keys(name).length
      ? name
      : { tr: legacyRoom.name || 'Oda', en: legacyRoom.name || 'Room' },
    code: finalCode,
    description,
    occupancy: {
      maxAdults: legacyRoom.maxAdult || 2,
      minAdults: 1,
      maxChildren: isOnlyAdult
        ? 0
        : Math.max(0, (legacyRoom.maxOccupant || 2) - (legacyRoom.maxAdult || 2)),
      maxInfants: isOnlyAdult ? 0 : 1,
      totalMaxGuests: legacyRoom.maxOccupant || 2,
      baseOccupancy: legacyRoom.maxAdult || 2
    },
    size: legacyRoom.size || undefined,
    status: 'active',
    isBaseRoom: legacyRoom.pricing?.isBase === true,
    pricingType: occupancy.pricingType,
    useMultipliers: occupancy.useMultipliers
  })

  // Download room photos
  if (includePhotos && legacyRoom.photos?.length) {
    const activePhotos = legacyRoom.photos.filter(p => p.status !== false)
    hotelResult.photos.total += activePhotos.length

    const images = []
    for (let i = 0; i < activePhotos.length && i < 10; i++) {
      const photo = activePhotos[i]
      const url = buildOldPhotoUrl(oldHotelId, photo.id, 'rooms')

      try {
        const result = await downloadImage(
          url,
          newHotel._id.toString(),
          `room-${finalCode.toLowerCase()}-${i}`
        )
        if (result.success) {
          images.push({
            url: result.path,
            caption: {},
            isMain: i === 0,
            order: i
          })
          hotelResult.photos.downloaded++
        } else {
          hotelResult.photos.failed++
        }
      } catch {
        hotelResult.photos.failed++
      }
    }

    if (images.length) {
      roomType.images = images
    }
  }

  await roomType.save()
  logger.info(`[Migration] RoomType created: ${finalCode} (${roomType._id})`)
}

/**
 * Migrate a single meal plan
 */
async function migrateMealPlan(legacyPlan, newHotel, partnerId) {
  const name = convertLangArray(legacyPlan.name)
  const code = mapMealPlanCode(legacyPlan.code)

  // Check if this code already exists for this hotel
  const existing = await MealPlan.findOne({
    partner: partnerId,
    hotel: newHotel._id,
    code
  })

  if (existing) {
    logger.info(`[Migration] MealPlan ${code} already exists for hotel, skipping`)
    return existing
  }

  const mealPlan = new MealPlan({
    partner: partnerId,
    hotel: newHotel._id,
    code,
    name: Object.keys(name).length ? name : { tr: code, en: code },
    includedMeals: getIncludedMeals(code),
    isStandard: false,
    status: 'active',
    isBaseMealPlan: legacyPlan.pricing?.isBase === true
  })

  await mealPlan.save()
  logger.info(`[Migration] MealPlan created: ${code} (${mealPlan._id})`)
  return mealPlan
}

/**
 * Migrate a single market
 */
async function migrateMarket(legacyMarket, newHotel, partnerId, isFirst) {
  // name can be string, multi-lang array, or object
  let marketName
  if (typeof legacyMarket.name === 'string') {
    marketName = { tr: legacyMarket.name, en: legacyMarket.name }
  } else {
    marketName = convertLangArray(legacyMarket.name)
  }
  const displayName = marketName.tr || marketName.en || `MKT${legacyMarket.id}`

  // Generate market code from name (e.g. "Europe" -> "EUROPE", max 10 chars)
  let code =
    String(displayName)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10) || `MKT${legacyMarket.id}`

  // Ensure code uniqueness within this hotel
  const existingCodes = await Market.find({ partner: partnerId, hotel: newHotel._id })
    .select('code')
    .lean()
  const codeSet = new Set(existingCodes.map(m => m.code))
  let suffix = 1
  let finalCode = code
  while (codeSet.has(finalCode)) {
    finalCode = `${code.substring(0, 8)}${suffix}`
    suffix++
  }

  const currency = mapCurrency(legacyMarket.currency)
  const isActive =
    legacyMarket.status === true ||
    legacyMarket.status?.active === true ||
    legacyMarket.status === 1

  // Map countries (legacy may store as array of objects with code/id, or array of strings)
  let countries = []
  if (Array.isArray(legacyMarket.countries)) {
    countries = legacyMarket.countries
      .map(c => (typeof c === 'string' ? c : c?.code || c?.isoCode || ''))
      .filter(c => c && c.length === 2)
      .map(c => c.toUpperCase())
  }

  // Map sales channels
  const salesChannels = { b2c: true, b2b: true }
  if (legacyMarket.channel) {
    if (typeof legacyMarket.channel === 'object') {
      salesChannels.b2c = legacyMarket.channel.b2c !== false
      salesChannels.b2b = legacyMarket.channel.b2b !== false
    }
  }

  // Map commission
  let commissionRate = 10
  let workingMode = 'net'
  if (legacyMarket.commission) {
    if (typeof legacyMarket.commission === 'number') {
      commissionRate = legacyMarket.commission
    } else if (typeof legacyMarket.commission === 'object') {
      commissionRate = legacyMarket.commission.rate || legacyMarket.commission.value || 10
      workingMode = legacyMarket.commission.mode || 'net'
    }
  }

  const market = new Market({
    partner: partnerId,
    hotel: newHotel._id,
    name: Object.keys(marketName).length ? marketName : { tr: finalCode, en: finalCode },
    code: finalCode,
    currency,
    countries,
    salesChannels,
    commissionRate: Math.min(Math.max(commissionRate, 0), 100),
    workingMode: ['net', 'commission'].includes(workingMode) ? workingMode : 'net',
    isDefault: isFirst && !existingCodes.length,
    status: isActive ? 'active' : 'inactive'
  })

  await market.save()
  logger.info(`[Migration] Market created: ${finalCode} (${market._id})`)
  return market
}

/**
 * Clean up previously migrated hotel data (for re-migration)
 */
async function cleanupPreviousMigration(legacyHotelId) {
  const existingHotel = await Hotel.findOne({
    'source.type': 'migration',
    'source.legacyId': legacyHotelId
  })
  if (!existingHotel) return

  const hotelId = existingHotel._id
  logger.info(
    `[Migration] Cleaning up previous migration for legacy hotel ${legacyHotelId} (hotel: ${hotelId})`
  )

  // Delete associated data
  await Promise.all([
    RoomType.deleteMany({ hotel: hotelId }),
    MealPlan.deleteMany({ hotel: hotelId }),
    Market.deleteMany({ hotel: hotelId }),
    Hotel.deleteOne({ _id: hotelId })
  ])

  // Mark old migration history as superseded
  await MigrationHistory.updateMany(
    { 'hotels.legacyHotelId': legacyHotelId, 'hotels.status': 'success' },
    { $set: { 'hotels.$.status': 'superseded' } }
  )

  logger.info(`[Migration] Cleanup complete for legacy hotel ${legacyHotelId}`)
}
