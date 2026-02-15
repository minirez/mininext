import express from 'express'
import * as siteSettingsService from './siteSettings.service.js'
import { protect, requireAdmin } from '#middleware/auth.js'
import { partnerContext } from '#middleware/partnerContext.js'
import { siteUpload } from '#helpers/siteUpload.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(protect)
router.use(requireAdmin)
router.use(partnerContext)

// Get all site settings
router.get('/', siteSettingsService.getSiteSettings)

// Update all site settings at once
router.put('/', siteSettingsService.updateSiteSettings)

// Section-specific updates
router.put('/setup', siteSettingsService.updateSetup)
router.put('/general', siteSettingsService.updateGeneral)
router.put('/homepage', siteSettingsService.updateHomepage)
router.put('/contact', siteSettingsService.updateContact)
router.put('/tracking', siteSettingsService.updateTracking)

// File uploads
router.post('/upload', siteUpload.single('file'), siteSettingsService.uploadSiteImage)
router.delete('/upload', siteSettingsService.deleteSiteImage)

// Slider management
router.post('/slider', siteSettingsService.addSliderItem)
router.put('/slider/:sliderId', siteSettingsService.updateSliderItem)
router.delete('/slider/:sliderId', siteSettingsService.deleteSliderItem)

// SSL management
router.post('/ssl/request', siteSettingsService.requestSsl)
router.post('/ssl/verify-dns', siteSettingsService.verifyDns)
router.post('/ssl/setup', siteSettingsService.setupSsl)
router.get('/ssl/status/:type', siteSettingsService.getSslStatus)

// DNS management (Hostinger)
router.get('/dns/records', siteSettingsService.getDnsRecords)
router.put('/dns/records', siteSettingsService.updateDnsRecords)
router.delete('/dns/records', siteSettingsService.deleteDnsRecords)
router.post('/dns/auto-cname', siteSettingsService.createCname)
router.post('/dns/one-click-setup', siteSettingsService.oneClickSetup)

export default router
