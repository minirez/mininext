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

// Configure storage for issue attachments
const issueStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const issueId = req.params?.id

    if (!issueId) {
      return cb(new Error('Issue ID is required'))
    }

    const issueDir = path.join(uploadsDir, 'issues', issueId.toString())

    if (!fs.existsSync(issueDir)) {
      fs.mkdirSync(issueDir, { recursive: true })
    }
    cb(null, issueDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `attachment-${uniqueSuffix}${ext}`)
  }
})

// File filter - images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/
  const isPdf = file.mimetype === 'application/pdf'
  const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = /image\/(jpeg|jpg|png|gif|webp)/.test(file.mimetype)

  if (extname || mimetype || isPdf) {
    return cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only image files (JPEG, PNG, GIF, WEBP) and PDF are allowed.'))
  }
}

// Configure multer for issue attachments
export const issueUpload = multer({
  storage: issueStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})

// Helper to get file URL
export const getIssueFileUrl = (issueId, filename) => {
  return `/uploads/issues/${issueId}/${filename}`
}

// Helper to delete file
export const deleteIssueFile = (issueId, filename) => {
  const filePath = path.join(
    uploadsDir,
    'issues',
    issueId.toString(),
    filename
  )
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
}

// Helper to delete all files for an issue
export const deleteIssueFolder = (issueId) => {
  const issueDir = path.join(uploadsDir, 'issues', issueId.toString())
  if (fs.existsSync(issueDir)) {
    fs.rmSync(issueDir, { recursive: true, force: true })
    return true
  }
  return false
}
