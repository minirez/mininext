/**
 * Fix Lures Hotel migration bugs
 *
 * Fixes 3 issues:
 * 1. Wrong room type (code-only matching → name-based)
 * 2. Inflated grandTotal (commission included in product.price)
 * 3. Wrong paidAmount (fromAmount vs toAmount)
 *
 * Usage: node --experimental-specifier-resolution=node apps/api/src/modules/migration/fixLuresBookings.js
 * Run from project root (booking-engine/)
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config({ path: 'apps/api/.env.development' })
dotenv.config({ path: 'apps/api/.env' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-engine'

// Lures Hotel details
const LURES_HOTEL_ID = '699195e680b2b50d976f3178'
const PARTNER_ID = '695cdd6df613a0597a4914d5'

// Room type mapping
const ROOM_TYPES = {
  SUP: {
    _id: '6991e07d1ea787b068d9af0a',
    code: 'SUP',
    name: { tr: 'Superior Oda, Deniz Manzaralı' }
  },
  DLX: {
    _id: '6991e1551ea787b068d9afa3',
    code: 'DLX',
    name: { tr: 'Deluxe Oda, Deniz Manzaralı, Jakuzili' }
  },
  JSP: {
    _id: '6991e2181ea787b068d9b03a',
    code: 'JSP',
    name: { tr: 'Junior Süit, Deniz Manzaralı, Özel Havuzlu' }
  },
  SSP: {
    _id: '6991e2a61ea787b068d9b0c1',
    code: 'SSP',
    name: { tr: 'Senior Süit, Bahçe Manzaralı, Özel Havuzlu' }
  },
  PSD: {
    _id: '6991e38a1ea787b068d9b159',
    code: 'PSD',
    name: { tr: 'Penthouse Süit, Deniz Manzaralı, Jakuzili' }
  },
  DVP: {
    _id: '6991e40a1ea787b068d9b1e9',
    code: 'DVP',
    name: { tr: 'Dubleks Villa, Deniz Manzaralı, Teraslı ve Özel Havuzlu' }
  }
}

// 12 specific booking corrections from user feedback
const CORRECTIONS = [
  {
    legacyBookingId: 15647912,
    bookingNumber: 'BKG-2026-000260',
    correctRoomCode: 'PSD',
    correctGrandTotal: null, // user didn't specify
    correctPaidAmount: null
  },
  {
    legacyBookingId: 15608622,
    bookingNumber: 'BKG-2026-000253',
    correctRoomCode: 'JSP', // legacy name: Junior Suit
    correctGrandTotal: 2723,
    correctPaidAmount: null // will be recalculated from toAmount
  },
  {
    legacyBookingId: 15605626,
    bookingNumber: 'BKG-2026-000251',
    correctRoomCode: 'JSP',
    correctGrandTotal: 157000,
    correctPaidAmount: 7000
  },
  {
    legacyBookingId: 15595852,
    bookingNumber: 'BKG-2026-000249',
    correctRoomCode: 'JSP', // legacy name: Junior Suit
    correctGrandTotal: 75000,
    correctPaidAmount: null
  },
  {
    legacyBookingId: 15571530,
    bookingNumber: 'BKG-2026-000248',
    correctRoomCode: null, // Superior Oda, correct already
    correctGrandTotal: 121000,
    correctPaidAmount: null
  },
  {
    legacyBookingId: 15556671,
    bookingNumber: 'BKG-2026-000247',
    correctRoomCode: null, // Superior Oda, correct already
    correctGrandTotal: 39900,
    correctPaidAmount: null
  },
  {
    legacyBookingId: 15556459,
    bookingNumber: 'BKG-2026-000246',
    correctRoomCode: 'PSD',
    correctGrandTotal: 86000,
    correctPaidAmount: null
  },
  {
    legacyBookingId: 15546163,
    bookingNumber: 'BKG-2026-000245',
    correctRoomCode: 'PSD',
    correctGrandTotal: null,
    correctPaidAmount: null
  },
  {
    legacyBookingId: 14940383,
    bookingNumber: 'BKG-2026-000241',
    correctRoomCode: 'PSD',
    correctGrandTotal: 555,
    correctPaidAmount: null
  },
  {
    legacyBookingId: 14923369,
    bookingNumber: 'BKG-2026-000240',
    correctRoomCode: 'JSP',
    correctGrandTotal: null,
    correctPaidAmount: 20000
  },
  {
    legacyBookingId: 14440847,
    bookingNumber: 'BKG-2026-000238',
    correctRoomCode: 'DVP',
    correctGrandTotal: null,
    correctPaidAmount: null
  },
  {
    legacyBookingId: 14411174,
    bookingNumber: 'BKG-2026-000237',
    correctRoomCode: 'DVP',
    correctGrandTotal: 2500,
    correctPaidAmount: 500
  }
]

// Name-based room matching (same logic as reservationMigration.service.js)
function matchRoomByName(legacyRoomName) {
  if (!legacyRoomName) return null
  const name = (
    typeof legacyRoomName === 'string'
      ? legacyRoomName
      : legacyRoomName.tr || legacyRoomName.en || ''
  ).toLowerCase()

  if (!name) return null

  const keywords = [
    { pattern: /villa|dubleks|duplex/i, codes: ['DVP'] },
    { pattern: /penthouse/i, codes: ['PSD'] },
    { pattern: /senior\s*s[uü]it/i, codes: ['SSP'] },
    { pattern: /junior\s*s[uü]it/i, codes: ['JSP'] },
    { pattern: /deluxe|dlx/i, codes: ['DLX'] },
    { pattern: /superior|sup/i, codes: ['SUP'] }
  ]

  for (const { pattern, codes } of keywords) {
    if (pattern.test(name)) {
      return ROOM_TYPES[codes[0]] || null
    }
  }
  return null
}

// Recalculate paidAmount from legacy payments using toAmount priority
function recalculatePaidAmount(legacyPayments, bookingCurrency) {
  if (!Array.isArray(legacyPayments) || !legacyPayments.length) return 0

  const cur = (bookingCurrency || 'EUR').toLowerCase()
  let paidAmount = 0

  for (const p of legacyPayments) {
    const paymentStatus = (p.status || '').toLowerCase()
    const isCompleted =
      paymentStatus === 'completed' || paymentStatus === 'complete' || paymentStatus === 'paid'

    if (!isCompleted) continue

    let amount = 0
    const fromAmt = p.fromAmount
    const toAmt = p.toAmount

    // Priority: toAmount (actual payment) > fromAmount (invoice amount)
    if (toAmt && typeof toAmt === 'object' && (toAmt.currency || '').toLowerCase() === cur) {
      amount = Number(toAmt.value) || 0
    } else if (fromAmt && typeof fromAmt === 'object') {
      if ((fromAmt.currency || '').toLowerCase() === cur) {
        amount = Number(fromAmt.value) || 0
      } else {
        amount = Number(fromAmt.value) || 0
      }
    } else {
      amount = Number(p.toAmount || p.fromAmount || p.amount) || 0
    }

    if (amount > 0) paidAmount += amount
  }

  return Math.round(paidAmount * 100) / 100
}

async function main() {
  console.log('=== Lures Hotel Migration Bug Fix ===\n')
  console.log(`MongoDB: ${MONGODB_URI}`)
  console.log(`Hotel ID: ${LURES_HOTEL_ID}`)
  console.log(`Partner ID: ${PARTNER_ID}\n`)

  await mongoose.connect(MONGODB_URI)
  console.log('MongoDB connected\n')

  const Booking = mongoose.connection.collection('bookings')
  const Payment = mongoose.connection.collection('payments')

  // ============================================================
  // PART 1: Fix 12 specific bookings from user feedback
  // ============================================================
  console.log('--- PART 1: Fixing 12 specific bookings ---\n')

  let fixedCount = 0
  let errorCount = 0

  for (const correction of CORRECTIONS) {
    const booking = await Booking.findOne({
      hotel: new mongoose.Types.ObjectId(LURES_HOTEL_ID),
      'metadata.legacyBookingId': correction.legacyBookingId
    })

    if (!booking) {
      console.log(`[SKIP] Legacy #${correction.legacyBookingId} - booking not found`)
      errorCount++
      continue
    }

    const updates = {}
    const changes = []

    // Fix room type
    if (correction.correctRoomCode) {
      const rt = ROOM_TYPES[correction.correctRoomCode]
      if (rt) {
        updates['rooms.0.roomType'] = new mongoose.Types.ObjectId(rt._id)
        updates['rooms.0.roomTypeCode'] = rt.code
        updates['rooms.0.roomTypeName'] = rt.name
        updates['metadata.unmappedRoom'] = null // clear the flag
        changes.push(`room: ${booking.rooms?.[0]?.roomTypeCode || '?'} → ${rt.code}`)
      }
    }

    // Fix grandTotal
    if (correction.correctGrandTotal !== null) {
      const oldGrandTotal = booking.pricing?.grandTotal
      const newGrandTotal = correction.correctGrandTotal
      const nights = booking.nights || 1

      updates['pricing.grandTotal'] = newGrandTotal
      updates['pricing.subtotal'] = newGrandTotal
      updates['rooms.0.pricing.originalTotal'] = newGrandTotal
      updates['rooms.0.pricing.finalTotal'] = newGrandTotal
      updates['rooms.0.pricing.avgPerNight'] = Math.round((newGrandTotal / nights) * 100) / 100

      // Recalculate commission if applicable
      const commissionRate = booking.pricing?.commissionRate
      if (commissionRate && commissionRate > 0) {
        const newCommission = Math.round(((newGrandTotal * commissionRate) / 100) * 100) / 100
        const newNetPrice = newGrandTotal - newCommission
        updates['pricing.commission'] = newCommission
        updates['pricing.netPrice'] = newNetPrice
      }

      changes.push(`grandTotal: ${oldGrandTotal} → ${newGrandTotal}`)
    }

    // Fix paidAmount
    if (correction.correctPaidAmount !== null) {
      const oldPaidAmount = booking.payment?.paidAmount
      const newPaidAmount = correction.correctPaidAmount

      updates['payment.paidAmount'] = newPaidAmount

      // Recalculate payment status
      const grandTotal = correction.correctGrandTotal || booking.pricing?.grandTotal || 0
      if (newPaidAmount >= grandTotal && grandTotal > 0) {
        updates['payment.status'] = 'paid'
      } else if (newPaidAmount > 0) {
        updates['payment.status'] = 'partial'
      } else {
        updates['payment.status'] = 'pending'
      }

      // Update dueAmount
      updates['payment.dueAmount'] = grandTotal - newPaidAmount

      changes.push(`paidAmount: ${oldPaidAmount} → ${newPaidAmount}`)

      // Fix Payment collection records
      await Payment.deleteMany({ booking: booking._id })
      if (newPaidAmount > 0) {
        await Payment.insertOne({
          partner: new mongoose.Types.ObjectId(PARTNER_ID),
          booking: booking._id,
          type: booking.payment?.method || 'credit_card',
          amount: newPaidAmount,
          currency: booking.pricing?.currency || 'EUR',
          status: 'completed',
          completedAt: booking.createdAt || new Date(),
          notes: `Fixed from legacy booking #${correction.legacyBookingId}`,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }

    if (Object.keys(updates).length > 0) {
      // Separate $set and $unset
      const $set = {}
      const $unset = {}
      for (const [key, val] of Object.entries(updates)) {
        if (val === null) {
          $unset[key] = ''
        } else {
          $set[key] = val
        }
      }

      const updateOp = {}
      if (Object.keys($set).length) updateOp.$set = $set
      if (Object.keys($unset).length) updateOp.$unset = $unset

      await Booking.updateOne({ _id: booking._id }, updateOp)
      console.log(
        `[FIXED] ${correction.bookingNumber} (legacy #${correction.legacyBookingId}): ${changes.join(', ')}`
      )
      fixedCount++
    } else {
      console.log(
        `[OK] ${correction.bookingNumber} (legacy #${correction.legacyBookingId}): no changes needed`
      )
    }
  }

  console.log(`\nPart 1 complete: ${fixedCount} fixed, ${errorCount} errors\n`)

  // ============================================================
  // PART 2: Fix remaining unmapped bookings using name matching
  // ============================================================
  console.log('--- PART 2: Auto-fixing unmapped room bookings ---\n')

  const unmappedBookings = await Booking.find({
    hotel: new mongoose.Types.ObjectId(LURES_HOTEL_ID),
    'metadata.unmappedRoom': true
  }).toArray()

  console.log(`Found ${unmappedBookings.length} unmapped room bookings`)

  let autoFixedCount = 0

  for (const booking of unmappedBookings) {
    // Skip if already fixed in Part 1
    const alreadyFixed = CORRECTIONS.find(
      c => c.legacyBookingId === booking.metadata?.legacyBookingId
    )
    if (alreadyFixed && alreadyFixed.correctRoomCode) {
      continue
    }

    const legacyRoomName = booking.metadata?.legacyRoomName
    if (!legacyRoomName) continue

    const matchedRoom = matchRoomByName(legacyRoomName)
    if (!matchedRoom) {
      console.log(
        `  [SKIP] ${booking.bookingNumber}: no match for "${typeof legacyRoomName === 'object' ? JSON.stringify(legacyRoomName) : legacyRoomName}"`
      )
      continue
    }

    const currentCode = booking.rooms?.[0]?.roomTypeCode
    if (currentCode === matchedRoom.code) {
      // Already correct room, just clear the flag
      await Booking.updateOne({ _id: booking._id }, { $unset: { 'metadata.unmappedRoom': '' } })
      continue
    }

    await Booking.updateOne(
      { _id: booking._id },
      {
        $set: {
          'rooms.0.roomType': new mongoose.Types.ObjectId(matchedRoom._id),
          'rooms.0.roomTypeCode': matchedRoom.code,
          'rooms.0.roomTypeName': matchedRoom.name
        },
        $unset: { 'metadata.unmappedRoom': '' }
      }
    )

    console.log(
      `  [FIXED] ${booking.bookingNumber}: ${currentCode} → ${matchedRoom.code} (matched "${typeof legacyRoomName === 'object' ? JSON.stringify(legacyRoomName) : legacyRoomName}")`
    )
    autoFixedCount++
  }

  console.log(`\nPart 2 complete: ${autoFixedCount} auto-fixed\n`)

  // ============================================================
  // PART 3: Recalculate paidAmount for all Lures bookings using toAmount
  // ============================================================
  console.log('--- PART 3: Recalculating paidAmount (toAmount priority) ---\n')

  const allLuresBookings = await Booking.find({
    hotel: new mongoose.Types.ObjectId(LURES_HOTEL_ID),
    'source.type': 'migration'
  }).toArray()

  let paymentFixedCount = 0

  for (const booking of allLuresBookings) {
    // Skip bookings already fixed with explicit paidAmount in Part 1
    const explicitFix = CORRECTIONS.find(
      c => c.legacyBookingId === booking.metadata?.legacyBookingId && c.correctPaidAmount !== null
    )
    if (explicitFix) continue

    const legacyPayments = booking.metadata?.legacyPayments
    if (!legacyPayments?.length) continue

    const currency = booking.pricing?.currency || 'EUR'
    const newPaidAmount = recalculatePaidAmount(legacyPayments, currency)
    const oldPaidAmount = booking.payment?.paidAmount || 0

    // Only update if different (tolerance of 0.01)
    if (Math.abs(newPaidAmount - oldPaidAmount) < 0.01) continue

    const grandTotal = booking.pricing?.grandTotal || 0
    let paymentStatus
    if (booking.status === 'completed' && newPaidAmount > 0) {
      paymentStatus = 'paid'
    } else if (newPaidAmount >= grandTotal && grandTotal > 0) {
      paymentStatus = 'paid'
    } else if (newPaidAmount > 0) {
      paymentStatus = 'partial'
    } else {
      paymentStatus = 'pending'
    }

    await Booking.updateOne(
      { _id: booking._id },
      {
        $set: {
          'payment.paidAmount': newPaidAmount,
          'payment.status': paymentStatus,
          'payment.dueAmount': grandTotal - newPaidAmount
        }
      }
    )

    // Update Payment collection records
    await Payment.deleteMany({ booking: booking._id })
    if (newPaidAmount > 0) {
      await Payment.insertOne({
        partner: new mongoose.Types.ObjectId(PARTNER_ID),
        booking: booking._id,
        type: booking.payment?.method || 'credit_card',
        amount: newPaidAmount,
        currency,
        status: 'completed',
        completedAt: booking.createdAt || new Date(),
        notes: `Recalculated from legacy booking #${booking.metadata?.legacyBookingId}`,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    console.log(
      `  [FIXED] ${booking.bookingNumber}: paidAmount ${oldPaidAmount} → ${newPaidAmount} (${currency})`
    )
    paymentFixedCount++
  }

  console.log(`\nPart 3 complete: ${paymentFixedCount} payment amounts recalculated\n`)

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('=== SUMMARY ===')
  console.log(`Part 1 (12 specific bookings): ${fixedCount} fixed`)
  console.log(`Part 2 (auto room matching): ${autoFixedCount} fixed`)
  console.log(`Part 3 (paidAmount recalc): ${paymentFixedCount} fixed`)

  // Final verification - count remaining unmapped
  const remainingUnmapped = await Booking.countDocuments({
    hotel: new mongoose.Types.ObjectId(LURES_HOTEL_ID),
    'metadata.unmappedRoom': true
  })
  console.log(`\nRemaining unmapped room bookings: ${remainingUnmapped}`)

  await mongoose.disconnect()
  console.log('\nDone!')
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
