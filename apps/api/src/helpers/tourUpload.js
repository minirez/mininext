import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsDir = path.join(__dirname, '../../uploads')

const ensureDir = dirPath => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

ensureDir(uploadsDir)

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = /image\/(jpeg|jpg|png|gif|webp)/.test(file.mimetype)

  if (extname && mimetype) {
    return cb(null, true)
  }
  cb(new Error('Invalid file type. Only image files (JPEG, PNG, GIF, WEBP) are allowed.'))
}

const getPartnerId = req => req.partnerId || req.user?.accountId

const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const partnerId = getPartnerId(req)
    const tourId = req.params?.id
    if (!partnerId || !tourId) return cb(new Error('Partner ID and Tour ID are required'))

    const destDir = path.join(
      uploadsDir,
      'tours',
      partnerId.toString(),
      tourId.toString(),
      'gallery'
    )
    ensureDir(destDir)
    cb(null, destDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `gallery-${uniqueSuffix}${ext}`)
  }
})

const stopPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const partnerId = getPartnerId(req)
    const tourId = req.params?.id
    const stopId = req.params?.stopId
    if (!partnerId || !tourId || !stopId) {
      return cb(new Error('Partner ID, Tour ID and Stop ID are required'))
    }

    const destDir = path.join(
      uploadsDir,
      'tours',
      partnerId.toString(),
      tourId.toString(),
      'stops',
      stopId.toString()
    )
    ensureDir(destDir)
    cb(null, destDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `stop-${uniqueSuffix}${ext}`)
  }
})

export const tourGalleryUpload = multer({
  storage: galleryStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
})

export const tourStopPhotoUpload = multer({
  storage: stopPhotoStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
})

export const getTourGalleryFileUrl = (partnerId, tourId, filename) => {
  return `/uploads/tours/${partnerId}/${tourId}/gallery/${filename}`
}

export const getTourStopPhotoUrl = (partnerId, tourId, stopId, filename) => {
  return `/uploads/tours/${partnerId}/${tourId}/stops/${stopId}/${filename}`
}

export const deleteTourGalleryFile = (partnerId, tourId, filename) => {
  const filePath = path.join(
    uploadsDir,
    'tours',
    partnerId.toString(),
    tourId.toString(),
    'gallery',
    filename
  )
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
}

export const deleteTourStopPhotoFile = (partnerId, tourId, stopId, filename) => {
  const filePath = path.join(
    uploadsDir,
    'tours',
    partnerId.toString(),
    tourId.toString(),
    'stops',
    stopId.toString(),
    filename
  )
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
}
