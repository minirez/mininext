import express from 'express'
import { protect, requirePlatformAdmin } from '#middleware/auth.js'
import { list, stats, detail, sync, syncJobs, triggerDeploy } from './deployment.service.js'

const router = express.Router()

// All routes require platform admin
router.use(protect, requirePlatformAdmin)

// GET /api/deployments - List deployments
router.get('/', list)

// GET /api/deployments/stats - Statistics
router.get('/stats', stats)

// POST /api/deployments/sync - Sync from GitHub
router.post('/sync', sync)

// POST /api/deployments/trigger - Trigger manual deploy
router.post('/trigger', triggerDeploy)

// GET /api/deployments/:id - Detail
router.get('/:id', detail)

// POST /api/deployments/:id/sync-jobs - Sync jobs for a run
router.post('/:id/sync-jobs', syncJobs)

export default router
