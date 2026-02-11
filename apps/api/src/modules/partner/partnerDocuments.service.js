import Partner from './partner.model.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Upload partner document
export const uploadDocument = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  if (!req.file) {
    throw new BadRequestError('NO_FILE_UPLOADED')
  }

  const { documentType } = req.body

  if (!documentType || !['license', 'certificate', 'other'].includes(documentType)) {
    throw new BadRequestError('INVALID_DOCUMENT_TYPE')
  }

  // Create document entry
  const document = {
    type: documentType,
    name: req.file.originalname,
    url: `/uploads/partners/${req.file.filename}`,
    uploadedAt: new Date()
  }

  // Add to partner documents
  partner.documents.push(document)
  await partner.save()

  res.json({
    success: true,
    message: req.t('DOCUMENT_UPLOADED'),
    data: {
      document,
      partner
    }
  })
})

// Delete partner document
export const deleteDocument = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const documentId = req.params.documentId
  const documentIndex = partner.documents.findIndex(doc => doc._id.toString() === documentId)

  if (documentIndex === -1) {
    throw new NotFoundError('DOCUMENT_NOT_FOUND')
  }

  // Remove document
  partner.documents.splice(documentIndex, 1)
  await partner.save()

  res.json({
    success: true,
    message: req.t('DOCUMENT_DELETED'),
    data: partner
  })
})

// Serve partner document (authenticated)
export const serveDocument = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const documentId = req.params.documentId
  const document = partner.documents.find(doc => doc._id.toString() === documentId)

  if (!document) {
    throw new NotFoundError('DOCUMENT_NOT_FOUND')
  }

  // Build file path
  const uploadsDir = path.join(__dirname, '../../../uploads')
  const filePath = path.join(uploadsDir, document.url.replace('/uploads/', ''))

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new NotFoundError('FILE_NOT_FOUND')
  }

  // Get file extension to set content type
  const ext = path.extname(filePath).toLowerCase()
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }

  const contentType = contentTypes[ext] || 'application/octet-stream'

  // Set headers
  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `inline; filename="${document.name}"`)

  // Stream file
  const fileStream = fs.createReadStream(filePath)
  fileStream.on('error', err => {
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'FILE_READ_ERROR' })
    }
  })
  fileStream.pipe(res)
})
