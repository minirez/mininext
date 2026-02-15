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

// Configure storage for hotel images
const hotelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Best-guess folder for multer; ensureCorrectFolder() fixes mismatches after DB lookup
    const partnerId = req.partnerId || req.user?.accountId || 'base'
    const hotelId = req.params?.id

    if (!hotelId) {
      return cb(new Error('Hotel ID is required'))
    }

    const hotelDir = path.join(uploadsDir, 'hotels', partnerId.toString(), hotelId.toString())

    if (!fs.existsSync(hotelDir)) {
      fs.mkdirSync(hotelDir, { recursive: true })
    }
    cb(null, hotelDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `hotel-${uniqueSuffix}${ext}`)
  }
})

// File filter - only images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = /image\/(jpeg|jpg|png|gif|webp)/.test(file.mimetype)

  if (extname && mimetype) {
    return cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only image files (JPEG, PNG, GIF, WEBP) are allowed.'))
  }
}

// Configure multer for hotel images
export const hotelUpload = multer({
  storage: hotelStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit (images are optimized after upload)
  }
})

// Helper to get file URL
export const getHotelFileUrl = (partnerId, hotelId, filename) => {
  return `/uploads/hotels/${partnerId}/${hotelId}/${filename}`
}

/**
 * Ensure uploaded file is in the correct folder based on folderIdentifier.
 * Multer decides destination before we know the hotel type,
 * so if the folder doesn't match, move the file.
 */
export const ensureCorrectFolder = (file, folderIdentifier, hotelId) => {
  const correctDir = path.join(
    uploadsDir,
    'hotels',
    folderIdentifier.toString(),
    hotelId.toString()
  )
  const currentDir = file.destination

  if (path.resolve(currentDir) === path.resolve(correctDir)) return // already correct

  if (!fs.existsSync(correctDir)) {
    fs.mkdirSync(correctDir, { recursive: true })
  }

  const oldPath = file.path
  const newPath = path.join(correctDir, file.filename)
  fs.renameSync(oldPath, newPath)

  // Update file object so callers see the right path
  file.destination = correctDir
  file.path = newPath
}

// Helper to delete file
export const deleteHotelFile = (partnerId, hotelId, filename) => {
  const filePath = path.join(
    uploadsDir,
    'hotels',
    partnerId.toString(),
    hotelId.toString(),
    filename
  )
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
}

// Helper to delete all files for a hotel
export const deleteHotelFolder = (partnerId, hotelId) => {
  const hotelDir = path.join(uploadsDir, 'hotels', partnerId.toString(), hotelId.toString())
  if (fs.existsSync(hotelDir)) {
    fs.rmSync(hotelDir, { recursive: true, force: true })
    return true
  }
  return false
}

// ===== Base Hotel Room Template Image Upload =====

// Configure storage for base hotel room template images
const roomTemplateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const hotelId = req.params?.id
    const roomCode = req.params?.code?.toUpperCase()

    if (!hotelId || !roomCode) {
      return cb(new Error('Hotel ID and Room Code are required'))
    }

    // Base hotel room template images go to: /uploads/hotels/base/{hotelId}/rooms/{roomCode}/
    const roomDir = path.join(uploadsDir, 'hotels', 'base', hotelId.toString(), 'rooms', roomCode)

    if (!fs.existsSync(roomDir)) {
      fs.mkdirSync(roomDir, { recursive: true })
    }
    cb(null, roomDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `room-${uniqueSuffix}${ext}`)
  }
})

// Configure multer for room template images
export const roomTemplateUpload = multer({
  storage: roomTemplateStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit (images are optimized after upload)
  }
})

// Helper to get room template file URL
export const getRoomTemplateFileUrl = (hotelId, roomCode, filename) => {
  return `/uploads/hotels/base/${hotelId}/rooms/${roomCode.toUpperCase()}/${filename}`
}

// Helper to delete room template file
export const deleteRoomTemplateFile = (hotelId, roomCode, filename) => {
  const filePath = path.join(
    uploadsDir,
    'hotels',
    'base',
    hotelId.toString(),
    'rooms',
    roomCode.toUpperCase(),
    filename
  )
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
}

// Helper to delete all room template files
export const deleteRoomTemplateFolder = (hotelId, roomCode) => {
  const roomDir = path.join(
    uploadsDir,
    'hotels',
    'base',
    hotelId.toString(),
    'rooms',
    roomCode.toUpperCase()
  )
  if (fs.existsSync(roomDir)) {
    fs.rmSync(roomDir, { recursive: true, force: true })
    return true
  }
  return false
}
