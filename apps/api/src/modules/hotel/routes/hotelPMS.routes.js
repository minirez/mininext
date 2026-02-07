/**
 * Hotel PMS Integration Routes
 * PMS status and provisioning
 */

import express from 'express'
import * as hotelService from '../hotel.service.js'

const router = express.Router()

/**
 * @swagger
 * /api/hotel/{id}/pms-status:
 *   get:
 *     tags: [Hotels]
 *     summary: Get hotel PMS status
 *     description: Get the PMS provisioning status for a hotel
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: PMS status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     pmsStatus:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [pending, active, failed]
 *                         pmsHotelId:
 *                           type: string
 *                         provisionedAt:
 *                           type: string
 *                           format: date-time
 *                     pmsEnabled:
 *                       type: boolean
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/pms-status', hotelService.getHotelPmsStatus)

/**
 * @swagger
 * /api/hotel/{id}/provision-pms:
 *   post:
 *     tags: [Hotels]
 *     summary: Provision hotel to PMS
 *     description: Provision a hotel to the PMS system. Returns temporary credentials for PMS access.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Provisioning started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     hotelJobId:
 *                       type: string
 *                       description: BullMQ job ID for hotel provisioning
 *                     userJobId:
 *                       type: string
 *                       description: BullMQ job ID for user provisioning
 *                     username:
 *                       type: string
 *                       description: PMS login username (email)
 *                     tempPassword:
 *                       type: string
 *                       description: Temporary password for PMS login
 *       400:
 *         description: PMS not enabled or hotel already provisioned
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/provision-pms', hotelService.provisionHotelToPms)

export default router
