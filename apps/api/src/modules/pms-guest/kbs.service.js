/**
 * KBS (Kimlik Bildirim Sistemi) Service
 * Turkish police/gendarmerie guest notification system
 *
 * KBS is legally required in Turkey for all accommodations to report
 * guest identities within 24 hours of check-in.
 */

import Stay, { STAY_STATUS } from '#modules/pms-frontdesk/stay.model.js'
import Guest, { KBS_STATUS, ID_TYPES } from './guest.model.js'
import Room from '#modules/pms-housekeeping/room.model.js'
import { asyncHandler } from '#helpers'
import * as kbsClient from './kbsClient.js'

/**
 * Validate KBS required fields for a guest
 * Turkish citizens: TC Kimlik, name, birth date
 * Foreign guests: Passport/ID, name, nationality, birth date, birth place, father/mother name
 */
export const validateKBSFields = guest => {
  const errors = []
  const isTurkish = guest.nationality === 'TR' || guest.idType === ID_TYPES.TC_KIMLIK

  // Common required fields
  if (!guest.firstName) errors.push('firstName')
  if (!guest.lastName) errors.push('lastName')
  if (!guest.idNumber) errors.push('idNumber')
  if (!guest.dateOfBirth) errors.push('dateOfBirth')

  if (isTurkish) {
    // TC Kimlik validation (11 digits)
    if (guest.idNumber && !/^\d{11}$/.test(guest.idNumber)) {
      errors.push('tcKimlikInvalid')
    }
  } else {
    // Foreign guest additional requirements
    if (!guest.nationality) errors.push('nationality')
    if (!guest.birthPlace) errors.push('birthPlace')
    if (!guest.fatherName) errors.push('fatherName')
    if (!guest.motherName) errors.push('motherName')
  }

  return {
    isValid: errors.length === 0,
    missingFields: errors,
    isTurkish
  }
}

/**
 * Get pending KBS notifications for a hotel
 * Returns stays with guests that haven't been reported to KBS
 * Query params:
 *   - startDate, endDate: Date range filter
 *   - includeAll: If true, include all guests (not just pending)
 *   - status: Filter by stay status (checked_in, checked_out, all)
 */
export const getKBSPending = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { startDate, endDate, includeAll, status } = req.query

  const query = {
    hotel: hotelId
  }

  // Status filter - default to checked_in, but allow all or checked_out
  if (status === 'all') {
    query.status = { $in: [STAY_STATUS.CHECKED_IN, STAY_STATUS.CHECKED_OUT] }
  } else if (status === 'checked_out') {
    query.status = STAY_STATUS.CHECKED_OUT
  } else {
    query.status = STAY_STATUS.CHECKED_IN
  }

  // Date range filter - use $or to check both actualCheckIn and checkInDate
  if (startDate || endDate) {
    const dateFilter = {}
    if (startDate) dateFilter.$gte = new Date(startDate)
    if (endDate) {
      // Set end date to end of day
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)
      dateFilter.$lte = endOfDay
    }

    // Check both actualCheckIn and checkInDate
    query.$or = [{ actualCheckIn: dateFilter }, { actualCheckIn: null, checkInDate: dateFilter }]
  }

  const stays = await Stay.find(query)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')
    .sort({ actualCheckIn: -1, checkInDate: -1 })
    .lean()

  // Process stays to extract guest KBS info
  const allGuests = []

  for (const stay of stays) {
    for (const guest of stay.guests) {
      // Check if guest has been reported
      // For embedded guests, we check if all required fields are present
      const validation = validateKBSFields(guest)

      // Find centralized guest record if exists
      let centralGuest = null
      if (guest.idNumber) {
        centralGuest = await Guest.findOne({
          hotel: hotelId,
          idNumber: guest.idNumber
        }).lean()
      }

      const kbsStatus = centralGuest?.kbsStatus || KBS_STATUS.PENDING

      // Include all guests if includeAll=true, otherwise only pending/failed
      const shouldInclude =
        includeAll === 'true' || kbsStatus === KBS_STATUS.PENDING || kbsStatus === KBS_STATUS.FAILED

      if (shouldInclude) {
        allGuests.push({
          stayId: stay._id,
          stayNumber: stay.stayNumber,
          stayStatus: stay.status,
          guestId: guest._id,
          centralGuestId: centralGuest?._id,
          roomNumber: stay.room?.roomNumber,
          checkInDate: stay.actualCheckIn || stay.checkInDate,
          checkOutDate: stay.checkOutDate,
          // Guest info
          firstName: guest.firstName,
          lastName: guest.lastName,
          nationality: guest.nationality,
          idType: guest.idType,
          idNumber: guest.idNumber,
          dateOfBirth: guest.dateOfBirth || centralGuest?.dateOfBirth,
          birthPlace: guest.birthPlace || centralGuest?.birthPlace,
          fatherName: guest.fatherName || centralGuest?.fatherName,
          motherName: guest.motherName || centralGuest?.motherName,
          // KBS status
          kbsStatus,
          kbsSentAt: centralGuest?.kbsSentAt,
          // Validation
          isValid: validation.isValid,
          missingFields: validation.missingFields,
          isTurkish: validation.isTurkish
        })
      }
    }
  }

  // Calculate summary
  const pendingGuests = allGuests.filter(
    g => g.kbsStatus === KBS_STATUS.PENDING || g.kbsStatus === KBS_STATUS.FAILED
  )
  const sentGuests = allGuests.filter(g => g.kbsStatus === KBS_STATUS.SENT)

  res.json({
    success: true,
    data: allGuests,
    summary: {
      total: allGuests.length,
      pending: pendingGuests.length,
      sent: sentGuests.length,
      valid: allGuests.filter(g => g.isValid).length,
      invalid: allGuests.filter(g => !g.isValid).length,
      turkish: allGuests.filter(g => g.isTurkish).length,
      foreign: allGuests.filter(g => !g.isTurkish).length
    }
  })
})

/**
 * Generate KBS XML file for police submission
 * Format based on Turkish KBS specifications
 */
export const generateKBSXML = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { guestIds } = req.body // Array of guest IDs to include

  if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Misafir listesi gerekli'
    })
  }

  // Get hotel info
  const Hotel = (await import('#modules/hotel/hotel.model.js')).default
  const hotel = await Hotel.findById(hotelId).lean()

  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  // Get stays with specified guests
  const stays = await Stay.find({
    hotel: hotelId,
    'guests._id': { $in: guestIds },
    status: STAY_STATUS.CHECKED_IN
  })
    .populate('room', 'roomNumber')
    .lean()

  // Build XML
  const now = new Date()
  const formatDate = date => {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`
  }

  let xmlGuests = ''

  for (const stay of stays) {
    for (const guest of stay.guests) {
      if (!guestIds.includes(guest._id.toString())) continue

      const validation = validateKBSFields(guest)
      if (!validation.isValid) continue

      if (validation.isTurkish) {
        // Turkish citizen format
        xmlGuests += `
    <MUSTERI>
      <TCKIMLIK>${guest.idNumber || ''}</TCKIMLIK>
      <ADI>${guest.firstName || ''}</ADI>
      <SOYADI>${guest.lastName || ''}</SOYADI>
      <DOGUMTARIH>${formatDate(guest.dateOfBirth)}</DOGUMTARIH>
      <ODANO>${stay.room?.roomNumber || ''}</ODANO>
      <GIRISTARIHI>${formatDate(stay.actualCheckIn || stay.checkInDate)}</GIRISTARIHI>
      <CIKISTARIHI>${formatDate(stay.checkOutDate)}</CIKISTARIHI>
      <ULKE>TR</ULKE>
    </MUSTERI>`
      } else {
        // Foreign guest format
        xmlGuests += `
    <MUSTERI>
      <PASAPORTNO>${guest.idNumber || ''}</PASAPORTNO>
      <ADI>${guest.firstName || ''}</ADI>
      <SOYADI>${guest.lastName || ''}</SOYADI>
      <BABAADI>${guest.fatherName || ''}</BABAADI>
      <ANAADI>${guest.motherName || ''}</ANAADI>
      <DOGUMTARIH>${formatDate(guest.dateOfBirth)}</DOGUMTARIH>
      <DOGUMYERI>${guest.birthPlace || ''}</DOGUMYERI>
      <ULKE>${guest.nationality || ''}</ULKE>
      <ODANO>${stay.room?.roomNumber || ''}</ODANO>
      <GIRISTARIHI>${formatDate(stay.actualCheckIn || stay.checkInDate)}</GIRISTARIHI>
      <CIKISTARIHI>${formatDate(stay.checkOutDate)}</CIKISTARIHI>
    </MUSTERI>`
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<KBSBILDIRIM>
  <TESISBILGI>
    <TESISADI>${hotel.name || ''}</TESISADI>
    <TESISKODU>${hotel.kbsCode || ''}</TESISKODU>
    <TARIH>${formatDate(now)}</TARIH>
  </TESISBILGI>
  <MUSTERILER>${xmlGuests}
  </MUSTERILER>
</KBSBILDIRIM>`

  // Set headers for XML download
  res.setHeader('Content-Type', 'application/xml')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="kbs_${formatDate(now).replace(/\./g, '')}.xml"`
  )

  res.send(xml)
})

/**
 * Mark guests as sent to KBS
 */
export const markAsSent = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { guestIds, kbsReference } = req.body

  if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Misafir listesi gerekli'
    })
  }

  const now = new Date()
  let updatedCount = 0

  // Update central guest records
  for (const guestId of guestIds) {
    // Try to find in Stay guests
    const stay = await Stay.findOne({
      hotel: hotelId,
      'guests._id': guestId
    })

    if (stay) {
      const guest = stay.guests.id(guestId)
      if (guest && guest.idNumber) {
        // Update or create central guest record
        await Guest.findOneAndUpdate(
          { hotel: hotelId, idNumber: guest.idNumber },
          {
            $set: {
              kbsStatus: KBS_STATUS.SENT,
              kbsSentAt: now,
              kbsReference: kbsReference || null
            }
          },
          { upsert: false }
        )
        updatedCount++
      }
    }
  }

  res.json({
    success: true,
    message: `${updatedCount} misafir KBS'ye gönderildi olarak işaretlendi`,
    data: {
      updatedCount,
      sentAt: now,
      reference: kbsReference
    }
  })
})

/**
 * Get KBS report for a date range
 */
export const getKBSReport = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { startDate, endDate } = req.query

  const start = startDate
    ? new Date(startDate)
    : new Date(new Date().setDate(new Date().getDate() - 30))
  const end = endDate ? new Date(endDate) : new Date()

  // Get all stays in date range
  const stays = await Stay.find({
    hotel: hotelId,
    actualCheckIn: { $gte: start, $lte: end },
    status: { $in: [STAY_STATUS.CHECKED_IN, STAY_STATUS.CHECKED_OUT] }
  })
    .populate('room', 'roomNumber')
    .lean()

  // Collect unique guests and their KBS status
  const guestMap = new Map()

  for (const stay of stays) {
    for (const guest of stay.guests) {
      const key = guest.idNumber || `${guest.firstName}-${guest.lastName}`

      if (!guestMap.has(key)) {
        // Get central guest record
        let centralGuest = null
        if (guest.idNumber) {
          centralGuest = await Guest.findOne({
            hotel: hotelId,
            idNumber: guest.idNumber
          }).lean()
        }

        const validation = validateKBSFields(guest)

        guestMap.set(key, {
          firstName: guest.firstName,
          lastName: guest.lastName,
          nationality: guest.nationality,
          idType: guest.idType,
          idNumber: guest.idNumber,
          kbsStatus: centralGuest?.kbsStatus || KBS_STATUS.PENDING,
          kbsSentAt: centralGuest?.kbsSentAt,
          isValid: validation.isValid,
          isTurkish: validation.isTurkish,
          stays: []
        })
      }

      guestMap.get(key).stays.push({
        stayNumber: stay.stayNumber,
        roomNumber: stay.room?.roomNumber,
        checkInDate: stay.actualCheckIn || stay.checkInDate,
        checkOutDate: stay.checkOutDate
      })
    }
  }

  const guests = Array.from(guestMap.values())

  // Summary statistics
  const summary = {
    totalGuests: guests.length,
    sent: guests.filter(g => g.kbsStatus === KBS_STATUS.SENT).length,
    pending: guests.filter(g => g.kbsStatus === KBS_STATUS.PENDING).length,
    failed: guests.filter(g => g.kbsStatus === KBS_STATUS.FAILED).length,
    notRequired: guests.filter(g => g.kbsStatus === KBS_STATUS.NOT_REQUIRED).length,
    turkish: guests.filter(g => g.isTurkish).length,
    foreign: guests.filter(g => !g.isTurkish).length,
    validForKBS: guests.filter(g => g.isValid).length,
    invalidForKBS: guests.filter(g => !g.isValid).length
  }

  res.json({
    success: true,
    data: {
      dateRange: { start, end },
      guests,
      summary
    }
  })
})

/**
 * Update guest KBS fields
 * Allows updating missing KBS fields for a guest
 */
export const updateGuestKBSFields = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { stayId, guestId } = req.params
  const { fatherName, motherName, birthPlace, dateOfBirth, nationality, idNumber, idType } =
    req.body

  // Find the stay
  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId
  })

  if (!stay) {
    return res.status(404).json({
      success: false,
      message: 'Konaklama bulunamadı'
    })
  }

  // Find the guest in stay
  const guest = stay.guests.id(guestId)
  if (!guest) {
    return res.status(404).json({
      success: false,
      message: 'Misafir bulunamadı'
    })
  }

  // Update guest fields
  if (fatherName !== undefined) guest.fatherName = fatherName
  if (motherName !== undefined) guest.motherName = motherName
  if (birthPlace !== undefined) guest.birthPlace = birthPlace
  if (dateOfBirth !== undefined) guest.dateOfBirth = dateOfBirth
  if (nationality !== undefined) guest.nationality = nationality
  if (idNumber !== undefined) guest.idNumber = idNumber
  if (idType !== undefined) guest.idType = idType

  await stay.save()

  // Also update central guest record if exists
  if (guest.idNumber) {
    await Guest.findOneAndUpdate(
      { hotel: hotelId, idNumber: guest.idNumber },
      {
        $set: {
          ...(fatherName !== undefined && { fatherName }),
          ...(motherName !== undefined && { motherName }),
          ...(birthPlace !== undefined && { birthPlace }),
          ...(dateOfBirth !== undefined && { dateOfBirth }),
          ...(nationality !== undefined && { nationality })
        }
      }
    )
  }

  // Re-validate
  const validation = validateKBSFields(guest)

  res.json({
    success: true,
    message: 'Misafir bilgileri güncellendi',
    data: {
      guest,
      validation
    }
  })
})

/**
 * Test KBS web service connection
 */
export const testKBSConnection = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const result = await kbsClient.testConnection(hotelId)

  res.json({
    success: result.success,
    message: result.message,
    data: result
  })
})

/**
 * Send single guest to KBS
 */
export const sendToKBS = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { stayId, guestId, action } = req.body

  if (!stayId || !guestId || !action) {
    return res.status(400).json({
      success: false,
      message: 'stayId, guestId ve action gerekli'
    })
  }

  if (!['checkin', 'checkout', 'roomchange'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz action. checkin, checkout veya roomchange olmalı'
    })
  }

  // Get stay with room
  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId
  }).populate('room', 'roomNumber floor')

  if (!stay) {
    return res.status(404).json({
      success: false,
      message: 'Konaklama bulunamadı'
    })
  }

  // Find the guest
  const guest = stay.guests.id(guestId)
  if (!guest) {
    return res.status(404).json({
      success: false,
      message: 'Misafir bulunamadı'
    })
  }

  // Validate guest data
  const validation = validateKBSFields(guest)
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Eksik KBS bilgileri var',
      missingFields: validation.missingFields
    })
  }

  // Send to KBS
  const result = await kbsClient.sendGuestNotification(hotelId, action, guest, stay, stay.room)

  // Update guest KBS status
  if (result.status === kbsClient.KBS_RESPONSE_STATUS.SUCCESS) {
    // Update central guest record
    if (guest.idNumber) {
      await Guest.findOneAndUpdate(
        { hotel: hotelId, idNumber: guest.idNumber },
        {
          $set: {
            kbsStatus: KBS_STATUS.SENT,
            kbsSentAt: new Date(),
            kbsReference: result.raw?.referansNo || null
          }
        }
      )
    }
  }

  res.json({
    success: result.status === kbsClient.KBS_RESPONSE_STATUS.SUCCESS,
    message: result.message,
    data: {
      guestName: `${guest.firstName} ${guest.lastName}`,
      action,
      kbsStatus: result.status,
      kbsCode: result.code,
      kbsMessage: result.message
    }
  })
})

/**
 * Send all guests in a stay to KBS
 */
export const sendStayToKBS = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { stayId, action } = req.body

  if (!stayId || !action) {
    return res.status(400).json({
      success: false,
      message: 'stayId ve action gerekli'
    })
  }

  if (!['checkin', 'checkout'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz action. checkin veya checkout olmalı'
    })
  }

  // Get stay with room
  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId
  }).populate('room', 'roomNumber floor')

  if (!stay) {
    return res.status(404).json({
      success: false,
      message: 'Konaklama bulunamadı'
    })
  }

  // Send all guests to KBS
  const result = await kbsClient.sendStayNotifications(hotelId, action, stay, stay.room)

  // Update guest records
  for (const detail of result.details) {
    if (detail.status === kbsClient.KBS_RESPONSE_STATUS.SUCCESS) {
      const guest = stay.guests.find(g => `${g.firstName} ${g.lastName}` === detail.guestName)
      if (guest?.idNumber) {
        await Guest.findOneAndUpdate(
          { hotel: hotelId, idNumber: guest.idNumber },
          {
            $set: {
              kbsStatus: KBS_STATUS.SENT,
              kbsSentAt: new Date()
            }
          }
        )
      }
    }
  }

  res.json({
    success: result.failed === 0,
    message:
      result.failed === 0
        ? `${result.success} misafir başarıyla KBS'ye gönderildi`
        : `${result.success} başarılı, ${result.failed} başarısız`,
    data: result
  })
})

export default {
  validateKBSFields,
  getKBSPending,
  generateKBSXML,
  markAsSent,
  getKBSReport,
  updateGuestKBSFields,
  testKBSConnection,
  sendToKBS,
  sendStayToKBS
}
