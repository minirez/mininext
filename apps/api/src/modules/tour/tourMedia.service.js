import { asyncHandler } from '#helpers'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import Tour from './tour.model.js'
import {
  getTourGalleryFileUrl,
  getTourStopPhotoUrl,
  deleteTourGalleryFile,
  deleteTourStopPhotoFile
} from '#helpers/tourUpload.js'
import { optimizeUpload } from '#helpers/imageOptimizer.js'

const requirePartnerId = req => {
  const partnerId = req.partnerId
  if (!partnerId) throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  return partnerId
}

// ==================== MEDIA ====================

export const uploadGalleryImage = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const tourId = req.params.id

  const tour = await Tour.findOne({ _id: tourId, partner: partnerId })
  if (!tour) throw new NotFoundError('TOUR_NOT_FOUND')
  if (!req.file) throw new BadRequestError('NO_FILE_UPLOADED')

  // Optimize: resize + WebP conversion
  const optimized = await optimizeUpload(req.file.path, 'tour')
  req.file.filename = optimized.filename
  req.file.path = optimized.path

  const url = getTourGalleryFileUrl(partnerId, tourId, req.file.filename)
  const image = {
    url,
    filename: req.file.filename,
    uploadedAt: new Date(),
    caption: { tr: '', en: '' },
    order: (tour.gallery?.length || 0) + 1,
    isMain: (tour.gallery?.length || 0) === 0
  }

  tour.gallery.push(image)
  await tour.save()

  res.json({
    success: true,
    data: { tour, image: tour.gallery[tour.gallery.length - 1] }
  })
})

export const deleteGalleryImage = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const tourId = req.params.id
  const imageId = req.params.imageId

  const tour = await Tour.findOne({ _id: tourId, partner: partnerId })
  if (!tour) throw new NotFoundError('TOUR_NOT_FOUND')

  const idx = (tour.gallery || []).findIndex(img => String(img._id) === String(imageId))
  if (idx === -1) throw new NotFoundError('IMAGE_NOT_FOUND')

  const [removed] = tour.gallery.splice(idx, 1)
  if (removed?.filename) {
    deleteTourGalleryFile(partnerId, tourId, removed.filename)
  }

  // Ensure a main image exists
  if (removed?.isMain && tour.gallery.length > 0) {
    tour.gallery[0].isMain = true
  }

  await tour.save()

  res.json({ success: true, data: tour })
})

export const uploadRouteStopPhoto = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const tourId = req.params.id
  const stopId = req.params.stopId

  const tour = await Tour.findOne({ _id: tourId, partner: partnerId })
  if (!tour) throw new NotFoundError('TOUR_NOT_FOUND')
  if (!req.file) throw new BadRequestError('NO_FILE_UPLOADED')

  const stop = tour.routePlan?.stops?.id(stopId)
  if (!stop) throw new NotFoundError('ROUTE_STOP_NOT_FOUND')

  // Delete previous file if present
  if (stop.photo?.filename) {
    deleteTourStopPhotoFile(partnerId, tourId, stopId, stop.photo.filename)
  }

  // Optimize: resize + WebP conversion
  const optimized = await optimizeUpload(req.file.path, 'tour')
  req.file.filename = optimized.filename
  req.file.path = optimized.path

  stop.photo = {
    url: getTourStopPhotoUrl(partnerId, tourId, stopId, req.file.filename),
    filename: req.file.filename,
    uploadedAt: new Date(),
    alt: { tr: '', en: '' }
  }

  await tour.save()

  res.json({ success: true, data: stop })
})

export const deleteRouteStopPhoto = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const tourId = req.params.id
  const stopId = req.params.stopId

  const tour = await Tour.findOne({ _id: tourId, partner: partnerId })
  if (!tour) throw new NotFoundError('TOUR_NOT_FOUND')

  const stop = tour.routePlan?.stops?.id(stopId)
  if (!stop) throw new NotFoundError('ROUTE_STOP_NOT_FOUND')

  if (stop.photo?.filename) {
    deleteTourStopPhotoFile(partnerId, tourId, stopId, stop.photo.filename)
  }
  stop.photo = undefined

  await tour.save()

  res.json({ success: true, data: stop })
})
