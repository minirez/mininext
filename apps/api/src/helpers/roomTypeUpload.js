import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure storage for room type images
const roomTypeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Partner ID from request
    const partnerId = req.partnerId || req.user?.accountId
    const hotelId = req.params?.hotelId
    const roomTypeId = req.params?.roomTypeId

    if (!partnerId || !hotelId || !roomTypeId) {
      return cb(new Error('Partner ID, Hotel ID and RoomType ID are required'))
    }

    const roomTypeDir = path.join(
      uploadsDir,
      'hotels',
      partnerId.toString(),
      hotelId.toString(),
      'room-types',
      roomTypeId.toString()
    )

    if (!fs.existsSync(roomTypeDir)) {
      fs.mkdirSync(roomTypeDir, { recursive: true })
    }
    cb(null, roomTypeDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `room-${uniqueSuffix}${ext}`)
  }
})

// File filter - only images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = /image\/(jpeg|jpg|png|gif|webp)/.test(file.mimetype)

  if (extname || mimetype) {
    return cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only image files (JPEG, PNG, GIF, WEBP) are allowed.'))
  }
}

// Configure multer for room type images
export const roomTypeUpload = multer({
  storage: roomTypeStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit (images are optimized after upload)
  }
})

// Helper to get file URL
export const getRoomTypeFileUrl = (partnerId, hotelId, roomTypeId, filename) => {
  return `/uploads/hotels/${partnerId}/${hotelId}/room-types/${roomTypeId}/${filename}`
}

// Helper to delete file
export const deleteRoomTypeFile = (partnerId, hotelId, roomTypeId, filename) => {
  const filePath = path.join(
    uploadsDir,
    'hotels',
    partnerId.toString(),
    hotelId.toString(),
    'room-types',
    roomTypeId.toString(),
    filename
  )
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
}

// Helper to delete all files for a room type
export const deleteRoomTypeFolder = (partnerId, hotelId, roomTypeId) => {
  const roomTypeDir = path.join(
    uploadsDir,
    'hotels',
    partnerId.toString(),
    hotelId.toString(),
    'room-types',
    roomTypeId.toString()
  )
  if (fs.existsSync(roomTypeDir)) {
    fs.rmSync(roomTypeDir, { recursive: true, force: true })
    return true
  }
  return false
}
