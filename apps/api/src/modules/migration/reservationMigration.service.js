import crypto from 'crypto'
import { asyncHandler } from '#helpers'
import { BadRequestError } from '#core/errors.js'
import logger from '#core/logger.js'
import { emitToRoom } from '#core/socket.js'
import Hotel from '#modules/hotel/hotel.model.js'
import RoomType from '#modules/planning/roomType.model.js'
import MealPlan from '#modules/planning/mealPlan.model.js'
import Market from '#modules/planning/market.model.js'
import Booking from '#modules/booking/booking.model.js'
import Payment from '#modules/booking/payment.model.js'
import Partner from '#modules/partner/partner.model.js'
import MigrationHistory from './migrationHistory.model.js'
import { createLegacyConnection, getLegacyStatus } from './legacyDb.js'
import {
  LegacyBooking,
  LegacyRoom,
  LegacyPricePlan,
  LegacyHotel,
  LegacyAccount,
  LegacyMarket
} from './legacyModels.js'
import {
  convertLangArray,
  mapCurrency,
  mapMealPlanCode,
  parseLegacyDate,
  parseLegacyStatus,
  parseGuestName,
  mapLegacyGuestType,
  parseLegacyPayments
} from './transformers.js'

// ========================
// Helpers
// ========================

async function ensureConnected() {
  const status = getLegacyStatus()
  if (!status.connected) {
    await createLegacyConnection()
  }
}

// ========================
// Endpoints
// ========================

/**
 * GET /reservations/legacy-hotels
 * Legacy DB'den booking'li otel listesi (account bazında gruplu)
 */
export const getLegacyHotelsWithBookings = asyncHandler(async (req, res) => {
  await ensureConnected()

  // Step 1: Count bookings per account
  const bookingsByAccount = await LegacyBooking().aggregate([
    { $group: { _id: '$account', bookingCount: { $sum: 1 } } },
    { $sort: { bookingCount: -1 } }
  ])

  const accountIds = bookingsByAccount.map(b => b._id).filter(Boolean)

  // Step 2: Fetch account names and their hotels
  const [accounts, legacyHotels] = await Promise.all([
    LegacyAccount()
      .find({ id: { $in: accountIds } })
      .select('id companyName founder')
      .lean(),
    LegacyHotel()
      .find({ account: { $in: accountIds } })
      .select('id account name')
      .lean()
  ])

  const accountNameMap = {}
  for (const a of accounts) {
    accountNameMap[a.id] = a.companyName || a.founder || `Account #${a.id}`
  }

  // Group hotels by account
  const hotelsByAccount = {}
  for (const h of legacyHotels) {
    if (!hotelsByAccount[h.account]) hotelsByAccount[h.account] = []
    hotelsByAccount[h.account].push(h)
  }

  // Step 3: Build response - each account becomes an entry with its hotels
  const data = []
  for (const ba of bookingsByAccount) {
    const accountId = ba._id
    if (!accountId) continue

    const accountName = accountNameMap[accountId] || `Account #${accountId}`
    const accountHotels = hotelsByAccount[accountId] || []

    let hotels
    if (accountHotels.length === 1) {
      // Single hotel account -> all bookings belong to this hotel
      const h = accountHotels[0]
      hotels = [
        {
          legacyHotelId: h.id,
          hotelName: h.name || accountName,
          bookingCount: ba.bookingCount
        }
      ]
    } else if (accountHotels.length > 1) {
      // Multiple hotels -> show as account-level entry (can't determine per-hotel)
      hotels = [
        {
          legacyHotelId: null,
          hotelName: `${accountName} (${accountHotels.length} hotels)`,
          bookingCount: ba.bookingCount
        }
      ]
    } else {
      // No hotels found -> show as account entry
      hotels = [
        {
          legacyHotelId: null,
          hotelName: accountName,
          bookingCount: ba.bookingCount
        }
      ]
    }

    data.push({ accountId, accountName, hotels })
  }

  res.json({ success: true, data })
})

/**
 * GET /reservations/new-hotels?partnerId=X
 * Partner'ın mevcut otellerini roomType ve mealPlan kodlarıyla birlikte döner
 */
export const getNewSystemHotels = asyncHandler(async (req, res) => {
  const { partnerId } = req.query
  if (!partnerId) throw new BadRequestError('partnerId is required')

  const hotels = await Hotel.find({ partner: partnerId })
    .select('_id name code status')
    .sort({ name: 1 })
    .lean()

  const hotelIds = hotels.map(h => h._id)

  const [roomTypes, mealPlans] = await Promise.all([
    RoomType.find({ hotel: { $in: hotelIds } })
      .select('hotel code name')
      .lean(),
    MealPlan.find({ hotel: { $in: hotelIds } })
      .select('hotel code name')
      .lean()
  ])

  const roomTypesByHotel = {}
  const mealPlansByHotel = {}

  for (const rt of roomTypes) {
    const hid = rt.hotel.toString()
    if (!roomTypesByHotel[hid]) roomTypesByHotel[hid] = []
    roomTypesByHotel[hid].push({ _id: rt._id, code: rt.code, name: rt.name })
  }

  for (const mp of mealPlans) {
    const hid = mp.hotel.toString()
    if (!mealPlansByHotel[hid]) mealPlansByHotel[hid] = []
    mealPlansByHotel[hid].push({ _id: mp._id, code: mp.code, name: mp.name })
  }

  const data = hotels.map(h => ({
    _id: h._id,
    name: h.name,
    code: h.code,
    roomTypes: roomTypesByHotel[h._id.toString()] || [],
    mealPlans: mealPlansByHotel[h._id.toString()] || []
  }))

  res.json({ success: true, data })
})

/**
 * POST /reservations/migrate
 * Body: { partnerId, hotelMappings: [{ legacyHotelId, newHotelId, accountId }] }
 */
export const startMigration = asyncHandler(async (req, res) => {
  await ensureConnected()

  const { partnerId, hotelMappings, minCheckIn } = req.body

  if (!partnerId) throw new BadRequestError('partnerId is required')
  if (!hotelMappings?.length) throw new BadRequestError('hotelMappings is required')

  // Validate partner exists
  const partner = await Partner.findById(partnerId).select('companyName').lean()
  if (!partner) throw new BadRequestError('Partner not found')

  // Validate all newHotelIds exist
  const newHotelIds = hotelMappings.map(m => m.newHotelId)
  const existingHotels = await Hotel.find({ _id: { $in: newHotelIds } })
    .select('_id name')
    .lean()

  const existingHotelMap = new Map(existingHotels.map(h => [h._id.toString(), h]))
  for (const mapping of hotelMappings) {
    if (!existingHotelMap.has(mapping.newHotelId)) {
      throw new BadRequestError(`Hotel not found: ${mapping.newHotelId}`)
    }
  }

  const operationId = crypto.randomUUID()
  res.json({ success: true, data: { operationId } })

  // Run in background
  runStandaloneReservationMigration(
    operationId,
    req.user._id,
    partnerId,
    partner.companyName,
    hotelMappings,
    existingHotelMap,
    minCheckIn
  )
})

/**
 * GET /reservations/history
 */
export const getHistory = asyncHandler(async (req, res) => {
  const { partnerId, limit = 50 } = req.query

  const filter = { migrationType: 'reservations' }
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
// Background Runner
// ========================

async function runStandaloneReservationMigration(
  operationId,
  userId,
  partnerId,
  partnerName,
  hotelMappings,
  existingHotelMap,
  minCheckIn
) {
  const emit = (event, data) => {
    emitToRoom(operationId, `resmig:${event}`, { operationId, timestamp: Date.now(), ...data })
  }

  // Create history record
  const mappingSummary = hotelMappings.map(m => {
    const hotel = existingHotelMap.get(m.newHotelId)
    return {
      legacyHotelId: m.legacyHotelId,
      newHotelId: m.newHotelId,
      newHotelName: hotel?.name || '',
      accountId: m.accountId,
      reservations: { total: 0, migrated: 0, failed: 0 }
    }
  })

  const history = await MigrationHistory.create({
    partner: partnerId,
    performedBy: userId,
    migrationType: 'reservations',
    status: 'in_progress',
    hotelMappings: mappingSummary,
    summary: { totalHotels: hotelMappings.length }
  })

  emit('started', {
    totalHotels: hotelMappings.length,
    partnerName,
    historyId: history._id
  })

  let totalMigrated = 0
  let totalFailed = 0
  let totalReservations = 0

  for (let i = 0; i < hotelMappings.length; i++) {
    const mapping = hotelMappings[i]
    const newHotel = existingHotelMap.get(mapping.newHotelId)
    const hotelName = newHotel?.name || `Hotel #${mapping.legacyHotelId}`

    emit('hotel:start', {
      hotelIndex: i,
      hotelName,
      legacyHotelId: mapping.legacyHotelId,
      totalHotels: hotelMappings.length
    })

    try {
      const result = await migrateHotelReservationsStandalone(
        mapping,
        partnerId,
        emit,
        i,
        minCheckIn
      )

      // Update history mapping
      if (history.hotelMappings[i]) {
        history.hotelMappings[i].reservations = {
          total: result.total,
          migrated: result.migrated,
          failed: result.failed
        }
      }

      totalMigrated += result.migrated
      totalFailed += result.failed
      totalReservations += result.total

      emit('hotel:complete', {
        hotelIndex: i,
        hotelName,
        status: 'success',
        stats: { total: result.total, migrated: result.migrated, failed: result.failed },
        errors: result.errors
      })
    } catch (err) {
      logger.error(`[ResMigration] Hotel ${mapping.legacyHotelId} failed:`, err.message)

      emit('hotel:complete', {
        hotelIndex: i,
        hotelName,
        status: 'failed',
        errors: [err.message]
      })
    }
  }

  // Finalize history
  const finalStatus =
    totalFailed === 0 && totalMigrated > 0
      ? 'completed'
      : totalMigrated === 0
        ? 'failed'
        : 'partial'

  history.status = finalStatus
  history.completedAt = new Date()
  history.summary = {
    totalHotels: hotelMappings.length,
    totalReservations,
    migratedReservations: totalMigrated,
    failedReservations: totalFailed
  }
  await history.save()

  emit('complete', {
    status: finalStatus,
    summary: history.summary,
    historyId: history._id
  })
}

/**
 * Migrate reservations for a single hotel mapping
 */
async function migrateHotelReservationsStandalone(
  mapping,
  partnerId,
  emit,
  hotelIndex,
  minCheckIn
) {
  const { legacyHotelId, newHotelId, accountId } = mapping

  // Load new hotel with full data
  const newHotel = await Hotel.findById(newHotelId).lean()
  if (!newHotel) throw new Error(`New hotel not found: ${newHotelId}`)

  // Build room type, meal plan, and market mappings via code matching
  const [roomTypes, mealPlans, markets] = await Promise.all([
    RoomType.find({ hotel: newHotelId }).lean(),
    MealPlan.find({ hotel: newHotelId }).lean(),
    Market.find({ hotel: newHotelId }).lean()
  ])

  // Fetch legacy rooms, price plans, and markets
  let legacyRooms, legacyPlans, legacyMarkets
  if (legacyHotelId) {
    // Specific hotel
    ;[legacyRooms, legacyPlans, legacyMarkets] = await Promise.all([
      LegacyRoom().find({ hotel: legacyHotelId }).lean(),
      LegacyPricePlan().find({ hotel: legacyHotelId }).lean(),
      LegacyMarket().find({ hotel: legacyHotelId }).lean()
    ])
  } else {
    // No specific hotel - fetch rooms/plans/markets for ALL hotels under this account
    const accountHotels = await LegacyHotel().find({ account: accountId }).select('id').lean()
    const hotelIds = accountHotels.map(h => h.id)
    if (hotelIds.length > 0) {
      ;[legacyRooms, legacyPlans, legacyMarkets] = await Promise.all([
        LegacyRoom()
          .find({ hotel: { $in: hotelIds } })
          .lean(),
        LegacyPricePlan()
          .find({ hotel: { $in: hotelIds } })
          .lean(),
        LegacyMarket()
          .find({ hotel: { $in: hotelIds } })
          .lean()
      ])
    } else {
      legacyRooms = []
      legacyPlans = []
      legacyMarkets = []
    }
  }

  // Map: legacy room id → new RoomType (code matching)
  const roomMap = new Map()
  for (const lr of legacyRooms) {
    const legacyCode = (lr.code || `RM${lr.id}`).toUpperCase().substring(0, 10)
    const match = roomTypes.find(
      rt => rt.code === legacyCode || rt.code.startsWith(legacyCode.substring(0, 8))
    )
    if (match) roomMap.set(lr.id, match)
  }

  // Map: legacy priceplan id → new MealPlan (code matching)
  const mealPlanMap = new Map()
  for (const lp of legacyPlans) {
    const mappedCode = mapMealPlanCode(lp.code)
    const match = mealPlans.find(mp => mp.code === mappedCode)
    if (match) mealPlanMap.set(lp.id, match)
  }

  // Map: legacy market id → new Market (currency + name matching)
  const marketMap = new Map()
  for (const lm of legacyMarkets || []) {
    const legacyCurrency = mapCurrency(lm.currency)
    const legacyName =
      typeof lm.name === 'string'
        ? lm.name.toLowerCase()
        : (convertLangArray(lm.name).tr || convertLangArray(lm.name).en || '').toLowerCase()

    // Try match by currency first, then by name similarity
    const match = markets.find(m => {
      if (m.currency === legacyCurrency) return true
      const newName = (m.name?.tr || m.name?.en || '').toLowerCase()
      return newName && legacyName && newName.includes(legacyName)
    })
    if (match) marketMap.set(lm.id, match)
  }

  // Default market: first available or first matching hotel currency
  const defaultMarket =
    markets.find(m => m.currency === mapCurrency(newHotel.pricingSettings?.currency)) ||
    markets[0] ||
    null

  // Clean up previously migrated reservations and their Payment records (re-run support)
  const oldMigratedBookings = await Booking.find({
    hotel: newHotelId,
    'source.type': 'migration'
  })
    .select('_id')
    .lean()
  const oldBookingIds = oldMigratedBookings.map(b => b._id)
  if (oldBookingIds.length) {
    await Payment.deleteMany({ booking: { $in: oldBookingIds } })
  }
  await Booking.deleteMany({
    hotel: newHotelId,
    'source.type': 'migration'
  })

  // Fetch legacy bookings by account only
  // Don't filter by products.hotel.id because most legacy bookings don't have this field
  const bookingQuery = { account: accountId }
  // If minCheckIn is provided (YYYY-MM-DD string), filter bookings with products.checkIn >= YYYYMMDD
  if (minCheckIn) {
    const minCheckInNum = parseInt(minCheckIn.replace(/-/g, ''), 10)
    if (minCheckInNum) {
      bookingQuery['products.checkIn'] = { $gte: minCheckInNum }
    }
  }
  const legacyBookings = await LegacyBooking().find(bookingQuery).lean()

  const result = {
    legacyHotelId,
    hotelName: newHotel.name,
    total: 0,
    migrated: 0,
    failed: 0,
    errors: []
  }

  emit('hotel:progress', {
    hotelIndex,
    current: 0,
    total: legacyBookings.length,
    migrated: 0
  })

  let processedCount = 0

  for (const legacyBooking of legacyBookings) {
    // Include products: if legacyHotelId set, match OR include products without hotel.id
    // Most legacy bookings don't have products.hotel.id, so we include them all for single-hotel accounts
    const relevantProducts = (legacyBooking.products || []).filter(p => {
      if (!legacyHotelId) return true // No hotel filter - include all products
      // Include if hotel matches OR hotel.id is missing (most bookings)
      return !p?.hotel?.id || p.hotel.id === legacyHotelId
    })

    for (const product of relevantProducts) {
      result.total++

      try {
        await createBookingFromLegacy(
          legacyBooking,
          product,
          newHotel,
          partnerId,
          roomMap,
          mealPlanMap,
          roomTypes,
          mealPlans,
          marketMap,
          defaultMarket,
          markets
        )
        result.migrated++
      } catch (err) {
        result.failed++
        result.errors.push(`Booking #${legacyBooking.id}: ${err.message}`)
        logger.warn(`[ResMigration] Reservation ${legacyBooking.id} failed: ${err.message}`)
      }
    }

    processedCount++
    if (processedCount % 10 === 0 || processedCount === legacyBookings.length) {
      emit('hotel:progress', {
        hotelIndex,
        current: processedCount,
        total: legacyBookings.length,
        migrated: result.migrated
      })
    }
  }

  return result
}

/**
 * Create a new Booking document from a legacy booking + product
 * (Standalone version - uses fallback to first available room/mealplan)
 */
async function createBookingFromLegacy(
  legacyBooking,
  product,
  newHotel,
  partnerId,
  roomMap,
  mealPlanMap,
  allRoomTypes,
  allMealPlans,
  marketMap,
  defaultMarket,
  allMarkets
) {
  const checkIn = parseLegacyDate(product.checkIn)
  const checkOut = parseLegacyDate(product.checkOut)
  if (!checkIn || !checkOut) throw new Error('Invalid dates')

  const status = parseLegacyStatus(legacyBooking.status)
  const currency = mapCurrency(product.currency)
  const price = Number(product.price) || 0

  // Resolve room type - fallback to first available
  const roomTypeDoc = roomMap.get(product.room?.id)
  const finalRoomType = roomTypeDoc || allRoomTypes[0]
  const mealPlanDoc = mealPlanMap.get(product.pricePlan?.id)
  const finalMealPlan = mealPlanDoc || allMealPlans[0]

  if (!finalRoomType) throw new Error('No room type available')
  if (!finalMealPlan) throw new Error('No meal plan available')

  // Parse guests - use top-level legacyBooking.guests for actual names
  // product.guests usually has empty names but valid type info for counting
  const guests = []
  let adultCountFromGuests = 0
  let childCountFromGuests = 0
  let infantCountFromGuests = 0

  // Count guest types from product.guests (reliable type counts)
  if (Array.isArray(product.guests)) {
    for (const g of product.guests) {
      const { type: guestType } = mapLegacyGuestType(g?.type)
      if (guestType === 'child') childCountFromGuests++
      else if (guestType === 'infant') infantCountFromGuests++
      else adultCountFromGuests++
    }
  }

  // Get actual guest names from top-level legacyBooking.guests
  // Legacy has SEPARATE name and surname fields (not a single full name)
  const topLevelGuests = Array.isArray(legacyBooking.guests) ? legacyBooking.guests : []
  for (const g of topLevelGuests) {
    const firstName = g?.name?.trim()
    if (!firstName) continue
    const lastName = g?.surname?.trim() || '-'
    // Combine type+gender for proper title mapping (e.g. "adult-female" → mrs)
    const typeStr = [g.type, g.gender].filter(Boolean).join('-') || 'adult'
    const { type: guestType, title } = mapLegacyGuestType(typeStr)
    guests.push({ type: guestType, title, firstName, lastName, isLead: guests.length === 0 })
  }

  // Determine actual counts from pax field or guests array
  const pax = Number(product.pax) || 0
  const totalAdults =
    adultCountFromGuests || Math.max(pax - childCountFromGuests - infantCountFromGuests, 1)
  const totalChildren = childCountFromGuests
  const totalInfants = infantCountFromGuests

  // Build lead guest from customer name/surname (fallback if no top-level guests)
  const cust = legacyBooking.customer
  const custName = cust?.name?.trim()
  const custSurname = cust?.surname?.trim()

  if (!guests.length) {
    // No named guests from top-level array, use customer info
    let leadGuestEntry = null
    if (custName && custSurname) {
      leadGuestEntry = {
        type: 'adult',
        title: 'mr',
        firstName: custName,
        lastName: custSurname,
        isLead: true
      }
    } else if (custName) {
      const { firstName, lastName } = parseGuestName(custName)
      leadGuestEntry = { type: 'adult', title: 'mr', firstName, lastName, isLead: true }
    }
    if (leadGuestEntry) guests.push(leadGuestEntry)

    // Add remaining adults as unnamed
    for (let i = guests.length; i < totalAdults; i++) {
      guests.push({
        type: 'adult',
        title: 'mr',
        firstName: 'Guest',
        lastName: `${i + 1}`,
        isLead: false
      })
    }
    // Add children
    for (let i = 0; i < totalChildren; i++) {
      guests.push({
        type: 'child',
        title: 'mr',
        firstName: 'Child',
        lastName: `${i + 1}`,
        isLead: false
      })
    }
  }

  // Ensure at least 1 guest
  if (!guests.length) {
    guests.push({ type: 'adult', title: 'mr', firstName: 'Guest', lastName: '-', isLead: true })
  }
  // Ensure lead is marked
  if (!guests.find(g => g.isLead)) guests[0].isLead = true

  const leadGuest = guests.find(g => g.isLead) || guests[0]
  const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)))
  const bookingNumber = await Booking.generateBookingNumber(partnerId, 'booking')

  const roomBooking = {
    roomType: finalRoomType._id,
    roomTypeCode: finalRoomType.code,
    roomTypeName: finalRoomType.name || {},
    mealPlan: finalMealPlan._id,
    mealPlanCode: finalMealPlan.code,
    mealPlanName: finalMealPlan.name || {},
    guests,
    pricing: {
      currency,
      originalTotal: price,
      discount: Number(product.discount) || 0,
      finalTotal: price - (Number(product.discount) || 0),
      avgPerNight: nights > 0 ? Math.round((price / nights) * 100) / 100 : price
    }
  }

  let billing
  if (legacyBooking.customer?.billing) {
    const b = legacyBooking.customer.billing
    billing = {
      companyName: b.companyName || '',
      taxNumber: b.taxNumber || '',
      taxOffice: b.taxOffice || '',
      address: b.address || ''
    }
  }

  // Resolve market from legacy booking
  // Primary: match by legacy market ID via marketMap
  // Fallback: if the resolved market's currency doesn't match the product currency,
  // find a market with the correct currency (legacy data can have mismatched market/currency)
  const legacyMarketId =
    typeof legacyBooking.market === 'object'
      ? legacyBooking.market?.id || legacyBooking.market?._id
      : legacyBooking.market
  let resolvedMarket = (legacyMarketId && marketMap.get(legacyMarketId)) || null

  if (!resolvedMarket || resolvedMarket.currency !== currency) {
    const currencyMatchedMarket = allMarkets.find(m => m.currency === currency)
    if (currencyMatchedMarket) {
      resolvedMarket = currencyMatchedMarket
    } else if (!resolvedMarket) {
      resolvedMarket = defaultMarket
    }
  }

  // Commission from legacy booking
  const legacyCommission = Number(legacyBooking.commission) || 0
  const grandTotal = price - (Number(product.discount) || 0)
  const commissionAmount =
    legacyCommission > 0
      ? legacyCommission <= 100
        ? Math.round(((grandTotal * legacyCommission) / 100) * 100) / 100
        : legacyCommission
      : 0
  const netPrice = grandTotal - commissionAmount

  // Determine sales channel from legacy channel field
  const legacyChannel = (legacyBooking.channel || '').toLowerCase()
  const salesChannel =
    legacyChannel.includes('b2b') || legacyChannel.includes('agency') ? 'b2b' : 'b2c'

  // Build invoice details from billing
  let invoiceDetails
  if (billing?.taxNumber && billing?.companyName) {
    invoiceDetails = {
      type: 'corporate',
      corporate: {
        companyName: billing.companyName,
        taxNumber: billing.taxNumber,
        taxOffice: billing.taxOffice || '',
        address: { street: billing.address || '' }
      }
    }
  }

  // Cancellation details
  let cancellation
  if (status === 'cancelled' && Array.isArray(legacyBooking.status)) {
    const cancelledEntry = legacyBooking.status.find(s => {
      const t = (s?.type || '').toLowerCase()
      return t === 'cancelled' || t === 'cancel'
    })
    cancellation = {
      cancelledAt: cancelledEntry?.date ? new Date(cancelledEntry.date) : new Date(),
      reason: cancelledEntry?.description || cancelledEntry?.note || ''
    }
  }

  const booking = new Booking({
    bookingNumber,
    partner: partnerId,
    hotel: newHotel._id,
    hotelCode: newHotel.code || '',
    hotelName: newHotel.name,

    // Market
    market: resolvedMarket?._id,
    marketCode: resolvedMarket?.code,
    marketName: resolvedMarket?.name,
    salesChannel,

    checkIn,
    checkOut,
    nights,
    rooms: [roomBooking],
    totalRooms: 1,
    totalAdults,
    totalChildren,
    totalInfants,
    leadGuest,
    contact: {
      email: legacyBooking.customer?.email || '',
      phone: legacyBooking.customer?.phone || '',
      countryCode: legacyBooking.customer?.country || ''
    },
    billing,
    invoiceDetails,
    pricing: {
      currency,
      subtotal: price,
      totalDiscount: Number(product.discount) || 0,
      grandTotal,
      netPrice: commissionAmount > 0 ? netPrice : undefined,
      commission: commissionAmount > 0 ? commissionAmount : undefined,
      commissionRate: legacyCommission > 0 && legacyCommission <= 100 ? legacyCommission : undefined
    },
    payment: (() => {
      const { method, paidAmount, transactions } = parseLegacyPayments(
        legacyBooking.payments,
        currency
      )
      let paymentStatus
      if (status === 'completed' && paidAmount > 0) {
        paymentStatus = 'paid'
      } else if (paidAmount >= grandTotal) {
        paymentStatus = 'paid'
      } else if (paidAmount > 0) {
        paymentStatus = 'partial'
      } else {
        paymentStatus = 'pending'
      }
      return {
        status: paymentStatus,
        method,
        paidAmount: Math.round(paidAmount * 100) / 100,
        transactions
      }
    })(),
    status,
    specialRequests: legacyBooking.specialRequests || '',
    source: {
      type: 'migration',
      channel: legacyBooking.channel || 'legacy'
    },
    cancellation,
    confirmedAt: (() => {
      if (legacyBooking.created?.date) return new Date(legacyBooking.created.date)
      return undefined
    })(),
    completedAt: (() => {
      if (status !== 'completed' || !Array.isArray(legacyBooking.status)) return undefined
      const completedEntry = legacyBooking.status.find(s => {
        const t = (s?.type || '').toLowerCase()
        return t === 'completed' || t === 'complete'
      })
      if (completedEntry?.date) return new Date(completedEntry.date)
      return undefined
    })(),
    metadata: {
      legacyBookingId: legacyBooking.id,
      legacyAccountId: legacyBooking.account,
      legacyPayments: legacyBooking.payments?.length ? legacyBooking.payments : undefined,
      legacyRoomId: product.room?.id,
      legacyRoomName: product.room?.name,
      legacyPricePlanId: product.pricePlan?.id,
      legacyPricePlanName: product.pricePlan?.name,
      legacyMarketId: legacyMarketId || undefined,
      legacyCommission: legacyCommission || undefined,
      unmappedRoom: !roomMap.get(product.room?.id) ? true : undefined,
      unmappedMealPlan: !mealPlanMap.get(product.pricePlan?.id) ? true : undefined,
      unmappedMarket: !legacyMarketId || !marketMap.get(legacyMarketId) ? true : undefined
    }
  })

  // Set createdAt to the original booking creation date (before save, so Mongoose doesn't override)
  if (legacyBooking.created?.date) {
    booking.createdAt = new Date(legacyBooking.created.date)
  }

  await booking.save()

  // Create Payment collection records for each completed transaction
  // This is critical because the booking list API calculates paidAmount
  // from the Payment collection, not from booking.payment.transactions
  const paymentIds = []
  for (const tx of booking.payment?.transactions || []) {
    if (tx.status !== 'completed') continue
    const paymentRecord = new Payment({
      partner: partnerId,
      booking: booking._id,
      type: booking.payment.method || 'credit_card',
      amount: tx.amount,
      currency: tx.currency || currency,
      status: 'completed',
      completedAt: tx.date || booking.createdAt,
      notes: `Migrated from legacy booking #${legacyBooking.id}`,
      cardDetails:
        booking.payment.method === 'credit_card'
          ? {
              gatewayTransactionId: tx.gatewayTransactionId || '',
              gatewayStatus: 'completed',
              installment: tx.metadata?.installment || 1
            }
          : undefined,
      bankTransfer:
        booking.payment.method === 'bank_transfer'
          ? {
              reference: tx.reference || ''
            }
          : undefined
    })
    await paymentRecord.save()
    paymentIds.push(paymentRecord._id)
  }

  // Link Payment records to booking
  if (paymentIds.length) {
    booking.payment.payments = paymentIds
    await booking.save()
  }

  return booking
}
