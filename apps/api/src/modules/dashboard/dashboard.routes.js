import express from 'express'
import * as dashboardService from './dashboard.service.js'
import {
  protect,
  requirePlatformAdmin,
  requirePartnerOrAdmin,
  requireAccountType
} from '#middleware/auth.js'

const router = express.Router()

// Platform Admin Dashboard
router.get('/platform', protect, requirePlatformAdmin, dashboardService.getPlatformDashboard)

// Partner Dashboard
router.get('/partner', protect, requirePartnerOrAdmin, dashboardService.getPartnerDashboard)

// Agency Dashboard - restricted to agency users and platform admins
router.get(
  '/agency',
  protect,
  requireAccountType('agency', 'platform'),
  dashboardService.getAgencyDashboard
)

export default router
