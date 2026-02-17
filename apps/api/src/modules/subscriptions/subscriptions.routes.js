import express from 'express'
import serviceRoutes from './subscription-service.routes.js'
import packageRoutes from './subscription-package.routes.js'

const router = express.Router()

router.use('/services', serviceRoutes)
router.use('/packages', packageRoutes)

export default router
