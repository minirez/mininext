import express from 'express'
import tursabAgencyService from './tursab-agency.service.js'
import { asyncHandler } from '#helpers'
import { protect, requirePlatformAdmin } from '#middleware/auth.js'

const router = express.Router()

// All routes require platform admin
router.use(protect)
router.use(requirePlatformAdmin)

router.get('/stats', asyncHandler(tursabAgencyService.getStats))
router.get('/cities', asyncHandler(tursabAgencyService.getCities))
router.get('/cities/:city/districts', asyncHandler(tursabAgencyService.getDistricts))
router.get('/', asyncHandler(tursabAgencyService.list))
router.get('/:id', asyncHandler(tursabAgencyService.getById))

export default router
