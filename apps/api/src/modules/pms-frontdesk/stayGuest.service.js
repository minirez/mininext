/**
 * Stay Service - Guest Operations
 * CRUD operations for stay guest management
 */

import Stay from './stay.model.js'
import { asyncHandler } from '#helpers'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import { findOrCreateGuestProfile } from './stay.helpers.js'
import { emitStayUpdate, getGuestDisplayName } from './stay.internal.js'

/**
 * Update stay guests (bulk replace)
 */
export const updateGuests = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const { guests } = req.body

  if (!guests || !Array.isArray(guests)) {
    throw new BadRequestError('Misafir listesi gerekli')
  }

  // Ensure at least one main guest
  const guestList = guests.map((g, index) => ({
    ...g,
    isMainGuest: g.isMainGuest || index === 0
  }))

  // Ensure exactly one main guest
  const mainGuestCount = guestList.filter(g => g.isMainGuest).length
  if (mainGuestCount > 1) {
    // Keep only first main guest
    let foundFirst = false
    guestList.forEach(g => {
      if (g.isMainGuest) {
        if (foundFirst) {
          g.isMainGuest = false
        } else {
          foundFirst = true
        }
      }
    })
  }

  const stay = await Stay.findOneAndUpdate(
    {
      _id: stayId,
      hotel: hotelId
    },
    {
      $set: {
        guests: guestList,
        adultsCount: guestList.filter(g => g.type !== 'child').length,
        childrenCount: guestList.filter(g => g.type === 'child').length
      }
    },
    { new: true }
  )
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  if (!stay) {
    throw new NotFoundError('Konaklama bulunamadi')
  }

  // Emit socket event
  emitStayUpdate(hotelId, {
    stayId: stay._id,
    roomId: stay.room?._id,
    roomNumber: stay.room?.roomNumber,
    guestName: getGuestDisplayName(guestList[0])
  })

  res.json({
    success: true,
    data: stay
  })
})

/**
 * Add single guest to stay
 */
export const addGuest = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const guestData = req.body

  if (!guestData.firstName || !guestData.lastName) {
    throw new BadRequestError('Misafir adı ve soyadı gerekli')
  }

  // Find or create Guest profile for stay history tracking
  const guestProfileId = await findOrCreateGuestProfile(hotelId, guestData)

  const newGuest = {
    ...guestData,
    guest: guestProfileId,
    isMainGuest: guestData.isMainGuest || false,
    type: guestData.type || 'adult'
  }

  // Use atomic operation to prevent race conditions
  const updatedStay = await Stay.findOneAndUpdate(
    { _id: stayId, hotel: hotelId },
    {
      $push: { guests: newGuest },
      $inc: {
        adultsCount: newGuest.type !== 'child' ? 1 : 0,
        childrenCount: newGuest.type === 'child' ? 1 : 0
      }
    },
    { new: true }
  )

  if (!updatedStay) {
    throw new NotFoundError('Konaklama bulunamadi')
  }

  // If this is first guest and no main guest set, update to make them main
  if (updatedStay.guests.length === 1 && !updatedStay.guests[0].isMainGuest) {
    await Stay.updateOne({ _id: stayId }, { $set: { 'guests.0.isMainGuest': true } })
  }

  const populatedStay = await Stay.findById(stayId)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  res.json({
    success: true,
    data: populatedStay
  })
})

/**
 * Update single guest in stay
 */
export const updateGuest = asyncHandler(async (req, res) => {
  const { hotelId, stayId, guestIndex } = req.params
  const guestData = req.body

  const index = parseInt(guestIndex, 10)
  if (isNaN(index) || index < 0) {
    throw new BadRequestError('Geçersiz misafir indeksi')
  }

  // First get the stay to access current guest data
  const stay = await Stay.findOne({ _id: stayId, hotel: hotelId })

  if (!stay) {
    throw new NotFoundError('Konaklama bulunamadi')
  }

  if (index >= stay.guests.length) {
    throw new BadRequestError('Geçersiz misafir indeksi')
  }

  const currentGuest = stay.guests[index]

  // Find or create Guest profile if idNumber is provided
  let guestProfileId = currentGuest.guest
  if (guestData.idNumber || guestData.firstName || guestData.lastName) {
    const profileData = { ...currentGuest.toObject(), ...guestData }
    guestProfileId = await findOrCreateGuestProfile(hotelId, profileData)
  }

  // Build atomic update for the specific guest
  const updateFields = {}
  const allowedFields = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'nationality',
    'idType',
    'idNumber',
    'type',
    'isMainGuest',
    'dateOfBirth',
    'gender'
  ]

  allowedFields.forEach(field => {
    if (guestData[field] !== undefined) {
      updateFields[`guests.${index}.${field}`] = guestData[field]
    }
  })
  updateFields[`guests.${index}.guest`] = guestProfileId

  // Use atomic operation
  const updateOps = { $set: updateFields }

  // If setting as main guest, unset others first
  if (guestData.isMainGuest) {
    // First unset all main guests
    await Stay.updateOne({ _id: stayId }, { $set: { 'guests.$[].isMainGuest': false } })
  }

  const updatedStay = await Stay.findOneAndUpdate({ _id: stayId, hotel: hotelId }, updateOps, {
    new: true
  })

  // Recalculate counts atomically
  const adultsCount = updatedStay.guests.filter(g => g.type !== 'child').length
  const childrenCount = updatedStay.guests.filter(g => g.type === 'child').length

  await Stay.updateOne({ _id: stayId }, { $set: { adultsCount, childrenCount } })

  const populatedStay = await Stay.findById(stayId)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  res.json({
    success: true,
    data: populatedStay
  })
})

/**
 * Remove guest from stay
 */
export const removeGuest = asyncHandler(async (req, res) => {
  const { hotelId, stayId, guestIndex } = req.params

  const index = parseInt(guestIndex, 10)
  if (isNaN(index) || index < 0) {
    throw new BadRequestError('Geçersiz misafir indeksi')
  }

  const stay = await Stay.findOne({ _id: stayId, hotel: hotelId })

  if (!stay) {
    throw new NotFoundError('Konaklama bulunamadi')
  }

  if (index >= stay.guests.length) {
    throw new BadRequestError('Geçersiz misafir indeksi')
  }

  // Don't allow removing last guest
  if (stay.guests.length <= 1) {
    throw new BadRequestError('Son misafir silinemez')
  }

  const removedGuest = stay.guests[index]
  const wasMainGuest = removedGuest.isMainGuest

  // MongoDB doesn't support $pull by index, so we use $unset + $pull null pattern
  // First, unset the element at index
  await Stay.updateOne({ _id: stayId }, { $unset: { [`guests.${index}`]: 1 } })

  // Then pull null values to remove the gap
  await Stay.updateOne({ _id: stayId }, { $pull: { guests: null } })

  // If removed guest was main, set first as main
  if (wasMainGuest) {
    await Stay.updateOne({ _id: stayId }, { $set: { 'guests.0.isMainGuest': true } })
  }

  // Recalculate counts from current state
  const updatedStay = await Stay.findById(stayId)
  const adultsCount = updatedStay.guests.filter(g => g.type !== 'child').length
  const childrenCount = updatedStay.guests.filter(g => g.type === 'child').length

  await Stay.updateOne({ _id: stayId }, { $set: { adultsCount, childrenCount } })

  const populatedStay = await Stay.findById(stayId)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  res.json({
    success: true,
    data: populatedStay
  })
})
