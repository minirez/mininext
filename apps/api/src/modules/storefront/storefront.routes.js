/**
 * Storefront Routes - Simplified
 *
 * Main endpoints:
 * - GET /storefronts - Full data (use view=core for minimal)
 * - PUT /storefronts - Update any fields
 * - PUT /storefronts/draft - Save draft
 * - POST /storefronts/draft/publish - Publish draft
 */

import express from 'express'
import * as service from './storefront.service.js'
import { protect, requireAdmin } from '#middleware/auth.js'
import { partnerContext } from '#middleware/partnerContext.js'
import { storefrontUpload } from '#helpers/storefrontUpload.js'
import { validateBody } from '#middleware/validation.js'

const router = express.Router()

router.use(protect)
router.use(partnerContext)

// ==================== MAIN ====================

router.get('/', service.getStorefront)
router.get('/core', service.getStorefront) // Alias - use view=core query param
router.put('/', requireAdmin, service.updateStorefront)

// ==================== PAGES ====================

router.get('/pages', service.getPages)
router.post(
  '/pages',
  requireAdmin,
  validateBody({ url: { type: 'string', required: true } }),
  service.addPage
)
router.put('/pages/:url', requireAdmin, service.updatePage)
router.delete('/pages/:url', requireAdmin, service.deletePage)

// ==================== CUSTOM THEME ====================

router.get('/custom-theme', service.getCustomTheme)
router.put('/custom-theme', requireAdmin, service.updateCustomTheme)

// ==================== PRESETS ====================

router.get('/custom-theme/presets', requireAdmin, service.getPresets)
router.post(
  '/custom-theme/presets',
  requireAdmin,
  validateBody({ name: { type: 'string', required: true } }),
  service.savePreset
)
router.put('/custom-theme/presets/:presetId', requireAdmin, service.updatePreset)
router.post('/custom-theme/presets/:presetId/apply', requireAdmin, service.applyPreset)
router.delete('/custom-theme/presets/:presetId', requireAdmin, service.deletePreset)

// ==================== DRAFT ====================

router.put('/draft', requireAdmin, service.saveDraft)
router.post('/draft/publish', requireAdmin, service.publishDraft)
router.delete('/draft', requireAdmin, service.discardDraft)

// ==================== UPLOAD ====================

router.post('/upload', requireAdmin, storefrontUpload.single('file'), service.uploadImage)
router.delete(
  '/upload',
  requireAdmin,
  validateBody({ relativePath: { type: 'string', required: true } }),
  service.deleteImage
)

// ==================== AI MIGRATION ====================

router.post('/ai-migrate', requireAdmin, service.aiMigrateStorefront)
router.post('/ai-migrate/apply', requireAdmin, service.applyMigratedStorefront)
router.post('/ai-migrate/download-image', requireAdmin, service.downloadAndUploadImage)

// ==================== LEGACY COMPATIBILITY ====================
export default router
