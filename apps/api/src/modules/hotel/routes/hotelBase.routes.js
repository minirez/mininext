/**
 * HotelBase Routes (SuperAdmin only)
 * Base hotel templates management
 */

import express from 'express'
import * as hotelService from '../hotel.service.js'
import { requirePlatformAdmin } from '#middleware/auth.js'

const router = express.Router()

/**
 * @swagger
 * /api/hotel/base:
 *   get:
 *     tags: [Hotels]
 *     summary: List base hotels
 *     description: Get all base hotels (platform admin only). Base hotels are templates that partners can link to.
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - $ref: '#/components/parameters/StatusParam'
 *     responses:
 *       200:
 *         description: List of base hotels
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hotel'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/base', requirePlatformAdmin, hotelService.getBaseHotels)

/**
 * @swagger
 * /api/hotel/base/{id}:
 *   get:
 *     tags: [Hotels]
 *     summary: Get base hotel details
 *     description: Get a specific base hotel by ID (platform admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Base hotel details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Hotel'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/base/:id', requirePlatformAdmin, hotelService.getBaseHotel)

/**
 * @swagger
 * /api/hotel/base:
 *   post:
 *     tags: [Hotels]
 *     summary: Create base hotel
 *     description: Create a new base hotel template (platform admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Grand Hotel Istanbul"
 *               code:
 *                 type: string
 *                 example: "GRD001"
 *               stars:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               description:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [28.9784, 41.0082]
 *     responses:
 *       201:
 *         description: Base hotel created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/base', requirePlatformAdmin, hotelService.createBaseHotel)

/**
 * @swagger
 * /api/hotel/base/{id}:
 *   put:
 *     tags: [Hotels]
 *     summary: Update base hotel
 *     description: Update base hotel details (platform admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       200:
 *         description: Base hotel updated
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/base/:id', requirePlatformAdmin, hotelService.updateBaseHotel)

/**
 * @swagger
 * /api/hotel/base/{id}:
 *   delete:
 *     tags: [Hotels]
 *     summary: Delete base hotel
 *     description: Delete a base hotel (platform admin only). Cannot delete if linked to partners.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Base hotel deleted
 *       400:
 *         description: Cannot delete - hotel has linked partners
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/base/:id', requirePlatformAdmin, hotelService.deleteBaseHotel)

/**
 * @swagger
 * /api/hotel/base/{id}/linked-partners:
 *   get:
 *     tags: [Hotels]
 *     summary: Get linked partners
 *     description: Get all partners linked to a base hotel (platform admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: List of linked partners
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Partner'
 */
router.get('/base/:id/linked-partners', requirePlatformAdmin, hotelService.getLinkedPartners)

/**
 * @swagger
 * /api/hotel/{id}/promote:
 *   post:
 *     tags: [Hotels]
 *     summary: Promote to base hotel
 *     description: Promote a partner hotel to a base hotel (platform admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Hotel promoted to base
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/promote', requirePlatformAdmin, hotelService.promoteToBase)

export default router
