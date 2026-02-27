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

// Configure storage for site images
const siteStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Partner ID from request
    const partnerId = req.partnerId || req.user?.accountId
    const siteDir = path.join(uploadsDir, 'sites', partnerId?.toString() || 'default')

    if (!fs.existsSync(siteDir)) {
      fs.mkdirSync(siteDir, { recursive: true })
    }
    cb(null, siteDir)
  },
  filename: (req, file, cb) => {
    // Use type from body or generate unique name
    const type = req.body?.type || 'image'
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)

    // For logo/favicon, use fixed names so they're replaced
    if (type === 'logo' || type === 'favicon') {
      cb(null, `${type}${ext}`)
    } else {
      cb(null, `${type}-${uniqueSuffix}${ext}`)
    }
  }
})

// File filter - only images for site uploads
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|ico/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = /image\/(jpeg|jpg|png|gif|webp|x-icon|vnd.microsoft.icon)/.test(file.mimetype)

  if (extname || mimetype) {
    return cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only image files are allowed.'))
  }
}

// Configure multer for site images
export const siteUpload = multer({
  storage: siteStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

// Helper to get file URL
export const getSiteFileUrl = (partnerId, filename) => {
  return `/uploads/sites/${partnerId}/${filename}`
}

// Helper to delete file
export const deleteSiteFile = (partnerId, filename) => {
  const filePath = path.join(uploadsDir, 'sites', partnerId.toString(), filename)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
}
