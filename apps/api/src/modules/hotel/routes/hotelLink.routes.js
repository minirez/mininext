/**
 * Hotel Link Routes
 * Partner hotel linking to base hotels
 */

import express from 'express'
import * as hotelService from '../hotel.service.js'

const router = express.Router()

/**
 * @swagger
 * /api/hotel/available-bases:
 *   get:
 *     tags: [Hotels]
 *     summary: Get available base hotels
 *     description: Get base hotels that the partner can link to
 *     parameters:
 *       - $ref: '#/components/parameters/SearchParam'
 *     responses:
 *       200:
 *         description: List of available base hotels
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
 */
router.get('/available-bases', hotelService.getAvailableBases)

/**
 * @swagger
 * /api/hotel/link/{baseId}:
 *   post:
 *     tags: [Hotels]
 *     summary: Link to base hotel
 *     description: Create a linked hotel from a base hotel template
 *     parameters:
 *       - name: baseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Base hotel ID to link to
 *     responses:
 *       201:
 *         description: Hotel linked successfully
 *       400:
 *         description: Already linked or invalid base hotel
 *       404:
 *         description: Base hotel not found
 */
router.post('/link/:baseId', hotelService.linkToBase)

/**
 * @swagger
 * /api/hotel/{id}/unlink:
 *   post:
 *     tags: [Hotels]
 *     summary: Unlink from base hotel
 *     description: Convert a linked hotel to a standalone partner hotel
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Hotel unlinked successfully
 *       400:
 *         description: Hotel is not linked to a base
 */
router.post('/:id/unlink', hotelService.unlinkFromBase)

/**
 * @swagger
 * /api/hotel/{id}/importable-rooms:
 *   get:
 *     tags: [Hotels]
 *     summary: Get importable room templates
 *     description: Get room templates that can be imported from the linked base hotel
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: List of importable room templates
 *       400:
 *         description: Hotel is not linked to a base
 */
router.get('/:id/importable-rooms', hotelService.getImportableRooms)

export default router
