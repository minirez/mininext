import mongoose from 'mongoose'
import logger from '#core/logger.js'
import Booking from '#modules/booking/booking.model.js'
import ChannelConnection from './channelConnection.model.js'
import * as reselivaClient from './reseliva.client.js'
import { GUEST_PLACEHOLDER_NAME } from '#constants/defaults.js'

/**
 * Generate a unique booking number
 */
async function generateBookingNumber() {
  const prefix = 'CH'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const bookingNumber = `${prefix}${timestamp}${random}`

  // Check uniqueness
  const exists = await Booking.findOne({ bookingNumber }).lean()
  if (exists) {
    return generateBookingNumber()
  }
  return bookingNumber
}

/**
 * Map Reseliva room data to local room booking
 */
function mapRoomToBooking(connection, roomData) {
  // Find room mapping
  const roomMapping = connection.roomMappings.find(m => m.reselivaRoomId === roomData.roomId)

  if (!roomMapping) {
    logger.warn(`No room mapping found for Reseliva room ${roomData.roomId}`)
    return null
  }

  // Find rate mapping
  const rateMapping = roomMapping.rateMappings.find(
    m => m.reselivaRateId === roomData.rateId || m.reselivaRateId === Number(roomData.channelRateId)
  )

  const room = {
    roomType: roomMapping.localRoomTypeId,
    roomTypeCode: roomData.roomType || `RSV-${roomData.roomId}`,
    roomTypeName: {
      tr: roomData.roomType || roomMapping.reselivaRoomName || '',
      en: roomData.roomType || roomMapping.reselivaRoomName || ''
    },
    mealPlan: rateMapping?.localMealPlanId || roomMapping.rateMappings[0]?.localMealPlanId,
    mealPlanCode: roomData.rateName || rateMapping?.boardType || 'RO',
    mealPlanName: { tr: roomData.rateName || '', en: roomData.rateName || '' },
    guests: [],
    pricing: {
      currency: 'EUR', // Will be overridden by reservation currency
      originalTotal: roomData.totalAmount,
      discount: 0,
      finalTotal: roomData.totalAmount
    }
  }

  // Add guests
  for (let i = 0; i < roomData.totalPax; i++) {
    room.guests.push({
      type: 'adult',
      firstName: GUEST_PLACEHOLDER_NAME,
      lastName: `${i + 1}`,
      isLead: i === 0
    })
  }
  for (let i = 0; i < roomData.totalChildren; i++) {
    room.guests.push({
      type: 'child',
      firstName: 'Child',
      lastName: `${i + 1}`,
      age: roomData.childAges[i] || null
    })
  }

  // Add daily breakdown if available
  if (roomData.priceBreakdown && roomData.priceBreakdown.length > 0) {
    room.dailyBreakdown = roomData.priceBreakdown.map(pb => ({
      date: new Date(`${pb.date}T00:00:00.000Z`),
      price: pb.price,
      originalPrice: pb.price,
      discountAmount: 0
    }))
  }

  return room
}

/**
 * Create a booking from channel reservation data
 */
async function createChannelBooking(connection, resData) {
  const bookingNumber = await generateBookingNumber()

  // Map rooms
  const rooms = resData.rooms.map(room => mapRoomToBooking(connection, room)).filter(Boolean)

  if (rooms.length === 0) {
    logger.error(`No valid room mappings for reservation ${resData.reservno}`)
    return null
  }

  // Update currency from reservation data
  rooms.forEach(room => {
    room.pricing.currency = resData.currency
  })

  // Calculate totals
  const totalAdults =
    resData.totalPax ||
    rooms.reduce((sum, r) => sum + r.guests.filter(g => g.type === 'adult').length, 0)
  const totalChildren =
    resData.totalChildren ||
    rooms.reduce((sum, r) => sum + r.guests.filter(g => g.type === 'child').length, 0)

  const booking = new Booking({
    bookingNumber,
    partner: connection.partner,
    hotel: connection.hotel,
    checkIn: resData.checkIn,
    checkOut: resData.checkOut,
    nights: Math.ceil((resData.checkOut - resData.checkIn) / (1000 * 60 * 60 * 24)),
    rooms,
    totalRooms: rooms.length,
    totalAdults,
    totalChildren,
    totalInfants: 0,
    leadGuest: {
      type: 'adult',
      firstName: resData.firstName || GUEST_PLACEHOLDER_NAME,
      lastName: resData.lastName || 'Unknown',
      nationality: resData.nationality || '',
      isLead: true
    },
    contact: {
      email: resData.email || '',
      phone: resData.tel || ''
    },
    pricing: {
      currency: resData.currency,
      subtotal: resData.totalAmount,
      totalDiscount: resData.hotelDiscount || 0,
      grandTotal: resData.totalAmount
    },
    payment: {
      status: resData.prepaid ? 'paid' : 'pending',
      method: mapPaymentType(resData.paymentType),
      paidAmount: resData.prepaid ? resData.totalAmount : resData.depositedAmount || 0
    },
    status: 'confirmed',
    source: {
      type: 'channel',
      channel: resData.otaName || resData.source || 'reseliva'
    },
    externalReferences: {
      channelBookingId: String(resData.reservno),
      supplierConfirmation: resData.reservnoOta || ''
    },
    specialRequests: resData.note || '',
    confirmedAt: new Date()
  })

  await booking.save()
  logger.info(`Channel booking created: ${bookingNumber} (Reseliva: ${resData.reservno})`)
  return booking
}

/**
 * Map Reseliva payment type to our payment method
 */
function mapPaymentType(type) {
  const mapping = {
    CC: 'credit_card',
    MO: 'bank_transfer',
    POS: 'credit_card',
    PayPal: 'online'
  }
  return mapping[type] || 'credit_card'
}

/**
 * Process reservations from Reseliva
 * Main sync flow: fetch → create/update/cancel → confirm
 */
export async function processReservations(connection) {
  const results = {
    created: 0,
    cancelled: 0,
    modified: 0,
    confirmed: 0,
    errors: []
  }

  try {
    // 1. Fetch pending reservations
    const reservations = await reselivaClient.fetchReservations(connection)

    if (!reservations || reservations.length === 0) {
      connection.lastSync.reservations = new Date()
      await connection.save()
      return results
    }

    const toConfirm = []

    // 2. Process each reservation
    for (const resData of reservations) {
      try {
        // Check if reservation already exists
        const existingBooking = await Booking.findOne({
          partner: connection.partner,
          hotel: connection.hotel,
          'externalReferences.channelBookingId': String(resData.reservno)
        })

        if (resData.status === 'A') {
          // Active reservation
          if (!existingBooking) {
            const booking = await createChannelBooking(connection, resData)
            if (booking) {
              results.created++
              toConfirm.push({
                reselivaId: resData.reservno,
                pmsId: booking.bookingNumber,
                changetoken: resData.changetoken
              })
            }
          } else {
            // Already exists, just confirm
            toConfirm.push({
              reselivaId: resData.reservno,
              pmsId: existingBooking.bookingNumber,
              changetoken: resData.changetoken
            })
          }
        } else if (resData.status === 'C') {
          // Cancellation
          if (existingBooking && existingBooking.status !== 'cancelled') {
            existingBooking.status = 'cancelled'
            existingBooking.cancellation = {
              cancelledAt: resData.modificationTime || new Date(),
              reason: `Cancelled via ${resData.otaName || 'channel'}`
            }
            await existingBooking.save()
            results.cancelled++
          }
          toConfirm.push({
            reselivaId: resData.reservno,
            pmsId: existingBooking?.bookingNumber || `CANCEL-${resData.reservno}`,
            changetoken: resData.changetoken
          })
        } else if (resData.status === 'M') {
          // Modification
          if (existingBooking) {
            // Save amendment snapshot
            existingBooking.amendmentSnapshots.push({
              takenAt: new Date(),
              reason: `Modified via ${resData.otaName || 'channel'}`,
              bookingState: {
                checkIn: existingBooking.checkIn,
                checkOut: existingBooking.checkOut,
                nights: existingBooking.nights,
                rooms: existingBooking.rooms.toObject(),
                leadGuest: existingBooking.leadGuest?.toObject(),
                contact: existingBooking.contact?.toObject(),
                pricing: existingBooking.pricing?.toObject(),
                totalAdults: existingBooking.totalAdults,
                totalChildren: existingBooking.totalChildren,
                totalRooms: existingBooking.totalRooms
              },
              amendment: {
                type: 'full',
                changes: [{ field: 'channel_modification', fieldLabel: 'Channel modification' }]
              }
            })

            // Update booking with new data
            existingBooking.checkIn = resData.checkIn
            existingBooking.checkOut = resData.checkOut
            existingBooking.nights = Math.ceil(
              (resData.checkOut - resData.checkIn) / (1000 * 60 * 60 * 24)
            )

            const rooms = resData.rooms
              .map(room => mapRoomToBooking(connection, room))
              .filter(Boolean)
            if (rooms.length > 0) {
              rooms.forEach(r => {
                r.pricing.currency = resData.currency
              })
              existingBooking.rooms = rooms
              existingBooking.totalRooms = rooms.length
            }

            existingBooking.pricing.grandTotal = resData.totalAmount
            existingBooking.pricing.subtotal = resData.totalAmount
            existingBooking.leadGuest.firstName =
              resData.firstName || existingBooking.leadGuest.firstName
            existingBooking.leadGuest.lastName =
              resData.lastName || existingBooking.leadGuest.lastName

            await existingBooking.save()
            results.modified++
          }
          toConfirm.push({
            reselivaId: resData.reservno,
            pmsId: existingBooking?.bookingNumber || `MOD-${resData.reservno}`,
            changetoken: resData.changetoken
          })
        }
      } catch (err) {
        logger.error(`Error processing reservation ${resData.reservno}:`, err.message)
        results.errors.push({
          reservno: resData.reservno,
          error: err.message
        })
      }
    }

    // 3. Confirm processed reservations
    if (toConfirm.length > 0) {
      try {
        const confirmResult = await reselivaClient.confirmReservations(connection, toConfirm)
        results.confirmed = confirmResult.affected || toConfirm.length
      } catch (err) {
        logger.error('Error confirming reservations:', err.message)
        results.errors.push({ type: 'confirm', error: err.message })
      }
    }

    // 4. Update last sync time
    connection.lastSync.reservations = new Date()
    connection.lastError = null
    connection.status = 'active'
    await connection.save()
  } catch (err) {
    logger.error('Reservation sync failed:', err.message)
    connection.lastError = {
      message: err.message,
      occurredAt: new Date(),
      context: 'reservation_sync'
    }
    connection.status = 'error'
    await connection.save()
    throw err
  }

  return results
}

export default {
  processReservations
}
