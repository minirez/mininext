/**
 * Room Types Service
 * Handles room type CRUD and image management
 * Split from planning.service.js for better maintainability
 */

import RoomType from './roomType.model.js'
import Rate from './rate.model.js'
import Hotel from '../hotel/hotel.model.js'
import { NotFoundError, BadRequestError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import logger from '../../core/logger.js'
import { getRoomTypeFileUrl, deleteRoomTypeFile } from '../../helpers/roomTypeUpload.js'
import { getPartnerId, verifyHotelOwnership } from '../../services/helpers.js'

// ==================== ROOM TYPES ====================

export const getRoomTypes = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const { status, includeDeleted } = req.query
  const filter = { partner: partnerId, hotel: hotelId }

  if (status) {
    filter.status = status
  } else if (includeDeleted !== 'true') {
    filter.status = { $ne: 'deleted' }
  }

  const roomTypes = await RoomType.find(filter).sort('displayOrder')

  res.json({ success: true, data: roomTypes })
})

export const getRoomType = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const roomType = await RoomType.findOne({ _id: id, hotel: hotelId, partner: partnerId })
  if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

  res.json({ success: true, data: roomType })
})

export const createRoomType = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const roomType = await RoomType.create({
    ...req.body,
    partner: partnerId,
    hotel: hotelId
  })

  logger.info(`RoomType created: ${roomType.code} for hotel ${hotelId}`)

  res.status(201).json({
    success: true,
    message: req.t('ROOM_TYPE_CREATED'),
    data: roomType
  })
})

export const updateRoomType = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const roomType = await RoomType.findOneAndUpdate(
    { _id: id, hotel: hotelId, partner: partnerId },
    req.body,
    { new: true, runValidators: true }
  )

  if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('ROOM_TYPE_UPDATED'),
    data: roomType
  })
})

export const deleteRoomType = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const rateCount = await Rate.countDocuments({ roomType: id })
  if (rateCount > 0) {
    throw new BadRequestError('ROOM_TYPE_HAS_RATES')
  }

  const roomType = await RoomType.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
  if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('ROOM_TYPE_DELETED')
  })
})

export const updateRoomTypeStatus = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params
  const { status } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!['draft', 'active', 'inactive'].includes(status)) throw new BadRequestError('INVALID_STATUS')

  await verifyHotelOwnership(hotelId, partnerId)

  const roomType = await RoomType.findOneAndUpdate(
    { _id: id, hotel: hotelId, partner: partnerId },
    { status },
    { new: true }
  )

  if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('STATUS_UPDATED'),
    data: roomType
  })
})

export const reorderRoomTypes = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { ids } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!Array.isArray(ids)) throw new BadRequestError('INVALID_IDS')

  await verifyHotelOwnership(hotelId, partnerId)

  await Promise.all(
    ids.map((id, index) =>
      RoomType.updateOne({ _id: id, hotel: hotelId, partner: partnerId }, { displayOrder: index })
    )
  )

  res.json({
    success: true,
    message: req.t('ORDER_UPDATED')
  })
})

export const setBaseRoom = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  await RoomType.updateMany({ hotel: hotelId, partner: partnerId }, { isBaseRoom: false })

  const roomType = await RoomType.findOneAndUpdate(
    { _id: id, hotel: hotelId, partner: partnerId },
    { isBaseRoom: true, priceAdjustment: 0 },
    { new: true }
  )

  if (!roomType) {
    throw new NotFoundError('ROOM_TYPE_NOT_FOUND')
  }

  logger.info(`Base room set: ${roomType.code} for hotel ${hotelId}`)

  res.json({
    success: true,
    message: req.t('BASE_ROOM_SET'),
    data: roomType
  })
})

export const updateRoomTypePriceAdjustment = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params
  const { adjustment } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (adjustment === undefined) throw new BadRequestError('ADJUSTMENT_REQUIRED')

  await verifyHotelOwnership(hotelId, partnerId)

  const roomType = await RoomType.findOneAndUpdate(
    { _id: id, hotel: hotelId, partner: partnerId },
    { priceAdjustment: adjustment },
    { new: true, runValidators: true }
  )

  if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('PRICE_ADJUSTMENT_UPDATED'),
    data: roomType
  })
})

export const importRoomTypesFromBase = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { templateCodes } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!Array.isArray(templateCodes) || templateCodes.length === 0) {
    throw new BadRequestError('TEMPLATE_CODES_REQUIRED')
  }

  const hotel = await verifyHotelOwnership(hotelId, partnerId)

  if (!hotel.hotelBase) {
    throw new BadRequestError('HOTEL_NOT_LINKED_TO_BASE')
  }

  const baseHotel = await Hotel.findById(hotel.hotelBase).select('roomTemplates')
  if (!baseHotel) {
    throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
  }

  if (!baseHotel.roomTemplates || baseHotel.roomTemplates.length === 0) {
    throw new BadRequestError('NO_TEMPLATES_AVAILABLE')
  }

  const existingRoomTypes = await RoomType.find({
    hotel: hotelId,
    partner: partnerId
  }).select('code')
  const existingCodes = existingRoomTypes.map(rt => rt.code)

  const templatesToImport = baseHotel.roomTemplates.filter(
    template => templateCodes.includes(template.code) && !existingCodes.includes(template.code)
  )

  if (templatesToImport.length === 0) {
    return res.json({
      success: true,
      message: 'NO_NEW_TEMPLATES_TO_IMPORT',
      data: { imported: 0 }
    })
  }

  const maxOrderResult = await RoomType.findOne({
    hotel: hotelId,
    partner: partnerId
  })
    .sort({ displayOrder: -1 })
    .select('displayOrder')
  let nextOrder = (maxOrderResult?.displayOrder || 0) + 1

  const createdRoomTypes = []
  for (const template of templatesToImport) {
    const roomTypeData = {
      hotel: hotelId,
      partner: partnerId,
      code: template.code,
      name: template.name || {},
      description: template.description || {},
      occupancy: template.occupancy || {
        maxAdults: 2,
        maxChildren: 2,
        maxInfants: 1,
        totalMaxGuests: 4
      },
      amenities: template.amenities || [],
      size: template.size || null,
      bedConfiguration: template.bedConfiguration || [],
      images: (template.images || []).map(img => ({
        url: img.url,
        caption: img.caption || {},
        order: img.order || 0,
        isMain: img.isMain || false
      })),
      status: 'draft',
      displayOrder: nextOrder++
    }

    const roomType = await RoomType.create(roomTypeData)
    createdRoomTypes.push(roomType)
  }

  logger.info(
    `Imported ${createdRoomTypes.length} room types from base hotel ${hotel.hotelBase} to partner hotel ${hotelId}`
  )

  res.json({
    success: true,
    message: req.t ? req.t('ROOM_TYPES_IMPORTED') : 'Room types imported successfully',
    data: {
      imported: createdRoomTypes.length,
      roomTypes: createdRoomTypes
    }
  })
})

// ==================== ROOM TYPE IMAGES ====================

export const uploadRoomTypeImage = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, roomTypeId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!req.file) throw new BadRequestError('FILE_REQUIRED')

  await verifyHotelOwnership(hotelId, partnerId)

  const roomType = await RoomType.findOne({
    _id: roomTypeId,
    hotel: hotelId,
    partner: partnerId
  })

  if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

  const fileUrl = getRoomTypeFileUrl(partnerId, hotelId, roomTypeId, req.file.filename)

  let caption = {}
  if (req.body.caption) {
    try {
      caption = JSON.parse(req.body.caption)
    } catch {
      throw new BadRequestError('INVALID_CAPTION_FORMAT')
    }
  }

  const newImage = {
    url: fileUrl,
    caption,
    order: roomType.images.length,
    isMain: roomType.images.length === 0
  }

  roomType.images.push(newImage)
  await roomType.save()

  logger.info(`Image uploaded for room type ${roomTypeId}`)

  res.json({
    success: true,
    message: req.t('IMAGE_UPLOADED'),
    data: roomType.images[roomType.images.length - 1]
  })
})

export const deleteRoomTypeImage = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, roomTypeId, imageId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

  await verifyHotelOwnership(hotelId, partnerId)

  const roomType = await RoomType.findOne({
    _id: roomTypeId,
    hotel: hotelId,
    partner: partnerId
  })

  if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

  const imageIndex = roomType.images.findIndex(img => img._id.toString() === imageId)
  if (imageIndex === -1) throw new NotFoundError('IMAGE_NOT_FOUND')

  const image = roomType.images[imageIndex]

  try {
    const filename = image.url.split('/').pop()
    deleteRoomTypeFile(partnerId, hotelId, roomTypeId, filename)
  } catch (err) {
    logger.warn(`Failed to delete room type image file: ${err.message}`)
  }

  const wasMain = image.isMain
  roomType.images.splice(imageIndex, 1)

  if (wasMain && roomType.images.length > 0) {
    roomType.images[0].isMain = true
  }

  await roomType.save()

  logger.info(`Image deleted from room type ${roomTypeId}`)

  res.json({
    success: true,
    message: req.t('IMAGE_DELETED')
  })
})

export const reorderRoomTypeImages = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, roomTypeId } = req.params
  const { imageIds } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!Array.isArray(imageIds)) throw new BadRequestError('INVALID_IMAGE_IDS')

  await verifyHotelOwnership(hotelId, partnerId)

  const roomType = await RoomType.findOne({
    _id: roomTypeId,
    hotel: hotelId,
    partner: partnerId
  })

  if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

  const newOrder = []
  for (let i = 0; i < imageIds.length; i++) {
    const img = roomType.images.find(img => img._id.toString() === imageIds[i])
    if (img) {
      img.order = i
      newOrder.push(img)
    }
  }

  roomType.images = newOrder
  await roomType.save()

  res.json({
    success: true,
    message: req.t('ORDER_UPDATED'),
    data: roomType.images
  })
})

export const setRoomTypeMainImage = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, roomTypeId, imageId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

  await verifyHotelOwnership(hotelId, partnerId)

  const roomType = await RoomType.findOne({
    _id: roomTypeId,
    hotel: hotelId,
    partner: partnerId
  })

  if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

  const image = roomType.images.find(img => img._id.toString() === imageId)
  if (!image) throw new NotFoundError('IMAGE_NOT_FOUND')

  roomType.images.forEach(img => {
    img.isMain = img._id.toString() === imageId
  })

  await roomType.save()

  res.json({
    success: true,
    message: req.t('MAIN_IMAGE_SET'),
    data: roomType.images
  })
})
