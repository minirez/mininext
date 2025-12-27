import Hotel from './hotel.model.js'
import Partner from '../partner/partner.model.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import { getHotelFileUrl, deleteHotelFile } from '../../helpers/hotelUpload.js'
import logger from '../../core/logger.js'
import fs from 'fs'
import path from 'path'

// Get partner ID from request (partner user or platform admin viewing as partner)
const getPartnerId = (req) => {
	if (req.user.accountType === 'partner') {
		return req.user.accountId
	}
	if (req.partnerId) {
		return req.partnerId
	}
	return null
}

// Verify hotel belongs to partner
const verifyHotelOwnership = async (hotelId, partnerId) => {
	const hotel = await Hotel.findById(hotelId)
	if (!hotel) {
		throw new NotFoundError('HOTEL_NOT_FOUND')
	}
	if (hotel.partner.toString() !== partnerId.toString()) {
		throw new ForbiddenError('FORBIDDEN')
	}
	return hotel
}

/**
 * Get all hotels for partner
 */
export const getHotels = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const { status, stars, city, search, page = 1, limit = 20 } = req.query

	// Build filter
	const filter = { partner: partnerId }

	if (status) {
		filter.status = status
	}

	if (stars) {
		filter.stars = parseInt(stars)
	}

	if (city) {
		filter['address.city'] = { $regex: city, $options: 'i' }
	}

	if (search) {
		filter.$or = [
			{ name: { $regex: search, $options: 'i' } },
			{ 'address.city': { $regex: search, $options: 'i' } }
		]
	}

	const skip = (parseInt(page) - 1) * parseInt(limit)
	const total = await Hotel.countDocuments(filter)

	const hotels = await Hotel.find(filter)
		.sort({ displayOrder: 1, createdAt: -1 })
		.skip(skip)
		.limit(parseInt(limit))
		.select('-__v')

	res.json({
		success: true,
		data: {
			items: hotels,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / parseInt(limit))
			}
		}
	})
})

/**
 * Get single hotel
 */
export const getHotel = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id } = req.params

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	res.json({
		success: true,
		data: hotel
	})
})

/**
 * Create hotel
 */
export const createHotel = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	// Verify partner exists
	const partner = await Partner.findById(partnerId)
	if (!partner) {
		throw new NotFoundError('PARTNER_NOT_FOUND')
	}

	const hotel = await Hotel.create({
		...req.body,
		partner: partnerId
	})

	logger.info(`Hotel created: ${hotel.name} by partner ${partnerId}`)

	res.status(201).json({
		success: true,
		message: req.t('HOTEL_CREATED'),
		data: hotel
	})
})

/**
 * Update hotel
 */
export const updateHotel = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id } = req.params

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	// Fields that can be updated
	const allowedFields = [
		'name', 'description', 'slug', 'logo', 'stars', 'type', 'category',
		'visibility', 'address', 'location', 'contact', 'amenities', 'policies',
		'roomConfig', 'pricingSettings', 'seo', 'profile', 'tags',
		'featured', 'displayOrder'
	]

	allowedFields.forEach(field => {
		if (req.body[field] !== undefined) {
			if (typeof req.body[field] === 'object' && !Array.isArray(req.body[field])) {
				// Merge objects
				hotel[field] = { ...hotel[field]?.toObject?.() || hotel[field], ...req.body[field] }
			} else {
				hotel[field] = req.body[field]
			}
		}
	})

	await hotel.save()

	logger.info(`Hotel updated: ${hotel._id}`)

	res.json({
		success: true,
		message: req.t('HOTEL_UPDATED'),
		data: hotel
	})
})

/**
 * Delete hotel
 */
export const deleteHotel = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id } = req.params

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	// TODO: Check if hotel has active bookings before deleting

	// Delete all hotel images from disk
	if (hotel.images && hotel.images.length > 0) {
		hotel.images.forEach(image => {
			try {
				const filename = image.url.split('/').pop()
				deleteHotelFile(partnerId, hotel._id, filename)
			} catch (err) {
				logger.warn(`Failed to delete hotel image: ${err.message}`)
			}
		})
	}

	await hotel.deleteOne()

	logger.info(`Hotel deleted: ${id}`)

	res.json({
		success: true,
		message: req.t('HOTEL_DELETED')
	})
})

/**
 * Update hotel status
 */
export const updateHotelStatus = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id } = req.params
	const { status } = req.body

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	if (!['draft', 'active', 'inactive'].includes(status)) {
		throw new BadRequestError('INVALID_STATUS')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	hotel.status = status
	await hotel.save()

	const messageKey = status === 'active' ? 'HOTEL_ACTIVATED' :
	                   status === 'inactive' ? 'HOTEL_DEACTIVATED' : 'HOTEL_STATUS_UPDATED'

	res.json({
		success: true,
		message: req.t(messageKey),
		data: hotel
	})
})

/**
 * Upload hotel image
 */
export const uploadHotelImage = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id } = req.params

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	if (!req.file) {
		throw new BadRequestError('FILE_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	const fileUrl = getHotelFileUrl(partnerId, id, req.file.filename)

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

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	const imageIndex = hotel.images.findIndex(img => img._id.toString() === imageId)
	if (imageIndex === -1) {
		throw new NotFoundError('IMAGE_NOT_FOUND')
	}

	const image = hotel.images[imageIndex]

	// Delete file from disk
	try {
		const filename = image.url.split('/').pop()
		deleteHotelFile(partnerId, id, filename)
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

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	if (!Array.isArray(imageIds)) {
		throw new BadRequestError('INVALID_IMAGE_IDS')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

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

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

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

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	if (!req.file) {
		throw new BadRequestError('FILE_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	// Delete old logo if exists
	if (hotel.logo) {
		try {
			const oldFilename = hotel.logo.split('/').pop()
			deleteHotelFile(partnerId, id, oldFilename)
		} catch (err) {
			logger.warn(`Failed to delete old logo: ${err.message}`)
		}
	}

	const fileUrl = getHotelFileUrl(partnerId, id, req.file.filename)
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

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	if (!hotel.logo) {
		throw new NotFoundError('LOGO_NOT_FOUND')
	}

	// Delete file from disk
	try {
		const filename = hotel.logo.split('/').pop()
		deleteHotelFile(partnerId, id, filename)
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

/**
 * Get cities with hotel count (for filtering)
 */
export const getHotelCities = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const cities = await Hotel.aggregate([
		{ $match: { partner: partnerId } },
		{ $group: {
			_id: '$address.city',
			count: { $sum: 1 }
		}},
		{ $match: { _id: { $ne: null } } },
		{ $sort: { count: -1 } }
	])

	res.json({
		success: true,
		data: cities.map(c => ({
			city: c._id,
			count: c.count
		}))
	})
})
