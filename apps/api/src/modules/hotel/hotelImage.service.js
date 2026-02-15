/**
 * Hotel Image Service
 * Handles hotel image and logo operations
 */

import Hotel from './hotel.model.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import { getHotelFileUrl, deleteHotelFile, ensureCorrectFolder } from '#helpers/hotelUpload.js'
import logger from '#core/logger.js'
import { getPartnerId, verifyHotelOwnership } from '#services/helpers.js'

/**
 * Helper to get hotel for image operations
 * For base hotels, allows access for platform admin without partner
 * For partner/linked hotels, verifies ownership
 */
const getHotelForImageOp = async (hotelId, partnerId, user) => {
  // First check if it's a base hotel
  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Base hotels can only be modified by platform admin (no partner required)
  if (hotel.hotelType === 'base') {
    if (user?.accountType !== 'platform') {
      throw new BadRequestError('PLATFORM_ADMIN_REQUIRED')
    }
    return { hotel, folderIdentifier: 'base' }
  }

  // For partner/linked hotels, partner is required
  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  // Verify ownership for non-base hotels
  await verifyHotelOwnership(hotelId, partnerId)
  return { hotel, folderIdentifier: partnerId }
}

/**
 * Upload hotel image
 */
export const uploadHotelImage = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params

  if (!req.file) {
    throw new BadRequestError('FILE_REQUIRED')
  }

  const { hotel, folderIdentifier } = await getHotelForImageOp(id, partnerId, req.user)

  // Ensure file is in the correct folder (multer may have saved to wrong location)
  ensureCorrectFolder(req.file, folderIdentifier, id)

  const fileUrl = getHotelFileUrl(folderIdentifier, id, req.file.filename)

  // Add image to hotel
  const newImage = {
    url: fileUrl,
    caption: req.body.caption ? JSON.parse(req.body.caption) : { tr: '', en: '' },
    order: hotel.images.length,
    isMain: hotel.images.length === 0 // First image is main by default
  }

  hotel.images.push(newImage)
  await hotel.save()

  logger.info(`Image uploaded for hotel ${id}`)

  res.json({
    success: true,
    message: req.t('IMAGE_UPLOADED'),
    data: {
      image: hotel.images[hotel.images.length - 1],
      hotel
    }
  })
})

/**
 * Delete hotel image
 */
export const deleteHotelImage = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id, imageId } = req.params

  const { hotel, folderIdentifier } = await getHotelForImageOp(id, partnerId, req.user)

  const imageIndex = hotel.images.findIndex(img => img._id.toString() === imageId)
  if (imageIndex === -1) {
    throw new NotFoundError('IMAGE_NOT_FOUND')
  }

  const image = hotel.images[imageIndex]

  // Delete file from disk
  try {
    const filename = image.url.split('/').pop()
    deleteHotelFile(folderIdentifier, id, filename)
  } catch (err) {
    logger.warn(`Failed to delete image file: ${err.message}`)
  }

  // Remove from array
  const wasMain = image.isMain
  hotel.images.splice(imageIndex, 1)

  // If deleted image was main, set first image as main
  if (wasMain && hotel.images.length > 0) {
    hotel.images[0].isMain = true
  }

  await hotel.save()

  res.json({
    success: true,
    message: req.t('IMAGE_DELETED'),
    data: hotel
  })
})

/**
 * Reorder hotel images
 */
export const reorderHotelImages = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params
  const { imageIds } = req.body // Array of image IDs in new order

  if (!Array.isArray(imageIds)) {
    throw new BadRequestError('INVALID_IMAGE_IDS')
  }

  const { hotel } = await getHotelForImageOp(id, partnerId, req.user)

  // Reorder images based on provided IDs
  const reorderedImages = []
  imageIds.forEach((imgId, index) => {
    const image = hotel.images.find(img => img._id.toString() === imgId)
    if (image) {
      image.order = index
      reorderedImages.push(image)
    }
  })

  // Add any images not in the list at the end
  hotel.images.forEach(img => {
    if (!imageIds.includes(img._id.toString())) {
      img.order = reorderedImages.length
      reorderedImages.push(img)
    }
  })

  hotel.images = reorderedImages
  await hotel.save()

  res.json({
    success: true,
    message: req.t('IMAGES_REORDERED'),
    data: hotel
  })
})

/**
 * Set main image
 */
export const setMainImage = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id, imageId } = req.params

  const { hotel } = await getHotelForImageOp(id, partnerId, req.user)

  const imageIndex = hotel.images.findIndex(img => img._id.toString() === imageId)
  if (imageIndex === -1) {
    throw new NotFoundError('IMAGE_NOT_FOUND')
  }

  // Reset all isMain to false
  hotel.images.forEach(img => {
    img.isMain = false
  })

  // Set the selected image as main
  hotel.images[imageIndex].isMain = true

  await hotel.save()

  res.json({
    success: true,
    message: req.t('MAIN_IMAGE_SET'),
    data: hotel
  })
})

/**
 * Upload hotel logo
 */
export const uploadHotelLogo = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params

  if (!req.file) {
    throw new BadRequestError('FILE_REQUIRED')
  }

  const { hotel, folderIdentifier } = await getHotelForImageOp(id, partnerId, req.user)

  // Ensure file is in the correct folder (multer may have saved to wrong location)
  ensureCorrectFolder(req.file, folderIdentifier, id)

  // Delete old logo if exists
  if (hotel.logo) {
    try {
      const oldFilename = hotel.logo.split('/').pop()
      deleteHotelFile(folderIdentifier, id, oldFilename)
    } catch (err) {
      logger.warn(`Failed to delete old logo: ${err.message}`)
    }
  }

  const fileUrl = getHotelFileUrl(folderIdentifier, id, req.file.filename)
  hotel.logo = fileUrl
  await hotel.save()

  logger.info(`Logo uploaded for hotel ${id}`)

  res.json({
    success: true,
    message: req.t('LOGO_UPLOADED'),
    data: {
      logo: fileUrl,
      hotel
    }
  })
})

/**
 * Delete hotel logo
 */
export const deleteHotelLogo = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params

  const { hotel, folderIdentifier } = await getHotelForImageOp(id, partnerId, req.user)

  if (!hotel.logo) {
    throw new NotFoundError('LOGO_NOT_FOUND')
  }

  // Delete file from disk
  try {
    const filename = hotel.logo.split('/').pop()
    deleteHotelFile(folderIdentifier, id, filename)
  } catch (err) {
    logger.warn(`Failed to delete logo file: ${err.message}`)
  }

  hotel.logo = ''
  await hotel.save()

  res.json({
    success: true,
    message: req.t('LOGO_DELETED'),
    data: hotel
  })
})
