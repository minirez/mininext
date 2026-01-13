/**
 * Avatar Upload Helper
 * Handles profile picture uploads for users
 */
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

// Configure storage for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const avatarDir = path.join(uploadsDir, 'avatars')

    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true })
    }
    cb(null, avatarDir)
  },
  filename: (req, file, cb) => {
    const userId = req.user?._id || 'unknown'
    const ext = path.extname(file.originalname).toLowerCase()
    // Use userId as filename to automatically replace old avatar
    cb(null, `${userId}${ext}`)
  }
})

// File filter - images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = /image\/(jpeg|jpg|png|gif|webp)/.test(file.mimetype)

  if (extname && mimetype) {
    return cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only image files (JPEG, PNG, GIF, WEBP) are allowed.'))
  }
}

// Configure multer for avatar uploads
export const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

// Helper to get avatar URL
export const getAvatarUrl = (filename) => {
  return `/uploads/avatars/${filename}`
}

// Helper to delete old avatar (all extensions)
export const deleteOldAvatar = (userId) => {
  const avatarDir = path.join(uploadsDir, 'avatars')
  const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

  for (const ext of extensions) {
    const filePath = path.join(avatarDir, `${userId}${ext}`)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }
}

// Helper to delete old avatar but keep the new one
export const deleteOldAvatarExcept = (userId, keepFilename) => {
  const avatarDir = path.join(uploadsDir, 'avatars')
  const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

  for (const ext of extensions) {
    const filename = `${userId}${ext}`
    // Skip the file we just uploaded
    if (filename === keepFilename) continue

    const filePath = path.join(avatarDir, filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }
}
