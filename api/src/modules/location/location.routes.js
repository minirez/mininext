import express from 'express'
import * as locationService from './location.service.js'
import { protect, requireAdmin } from '../../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

// Search (autocomplete)
router.get('/search', locationService.searchLocations) // Query: ?q=text&country=TR&type=all

// Cities
router.get('/cities', locationService.getCities) // Query: ?country=TR
router.get('/cities/all', requireAdmin, locationService.getAllCities) // Admin: all cities
router.post('/cities', requireAdmin, locationService.createCity) // Platform admin only
router.put('/cities/:id', requireAdmin, locationService.updateCity) // Platform admin only
router.delete('/cities/:id', requireAdmin, locationService.deleteCity) // Platform admin only

// Districts (İlçeler)
router.get('/districts', locationService.getDistricts) // Query: ?city=ID
router.get('/districts/all', requireAdmin, locationService.getAllDistricts) // Admin: all districts
router.get('/districts/:id', locationService.getDistrict)
router.post('/districts', requireAdmin, locationService.createDistrict) // Platform admin only
router.put('/districts/:id', requireAdmin, locationService.updateDistrict) // Platform admin only
router.delete('/districts/:id', requireAdmin, locationService.deleteDistrict) // Platform admin only

// Tourism Regions
router.get('/regions', locationService.getRegions) // Query: ?city=ID
router.get('/regions/all', requireAdmin, locationService.getAllRegions) // Admin: all regions
router.get('/regions/:id', locationService.getRegion)
router.post('/regions', requireAdmin, locationService.createRegion) // Platform admin only
router.put('/regions/:id', requireAdmin, locationService.updateRegion) // Platform admin only
router.delete('/regions/:id', requireAdmin, locationService.deleteRegion) // Platform admin only

export default router
