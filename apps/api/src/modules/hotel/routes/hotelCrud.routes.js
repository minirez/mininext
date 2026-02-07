/**
 * Hotel CRUD Routes
 * List, create, get, update, delete partner hotels
 */

import express from 'express'
import * as hotelService from '../hotel.service.js'

const router = express.Router()

/**
 * @swagger
 * /api/hotel:
 *   get:
 *     tags: [Hotels]
 *     summary: List partner hotels
 *     description: Get all hotels for the current partner
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - $ref: '#/components/parameters/StatusParam'
 *     responses:
 *       200:
 *         description: List of hotels
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
 */
router.get('/', hotelService.getHotels)

/**
 * @swagger
 * /api/hotel/cities:
 *   get:
 *     tags: [Hotels]
 *     summary: Get hotel cities
 *     description: Get distinct cities from partner's hotels
 *     responses:
 *       200:
 *         description: List of cities
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
 *                     type: string
 */
router.get('/cities', hotelService.getHotelCities)

/**
 * @swagger
 * /api/hotel/{id}:
 *   get:
 *     tags: [Hotels]
 *     summary: Get hotel details
 *     description: Get a specific hotel by ID
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Hotel details
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
router.get('/:id', hotelService.getHotel)

/**
 * @swagger
 * /api/hotel:
 *   post:
 *     tags: [Hotels]
 *     summary: Create hotel
 *     description: Create a new hotel for the partner
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
 *               code:
 *                 type: string
 *               stars:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               description:
 *                 type: string
 *               address:
 *                 type: object
 *               location:
 *                 type: object
 *     responses:
 *       201:
 *         description: Hotel created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', hotelService.createHotel)

/**
 * @swagger
 * /api/hotel/{id}:
 *   put:
 *     tags: [Hotels]
 *     summary: Update hotel
 *     description: Update hotel details
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
 *         description: Hotel updated
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', hotelService.updateHotel)

/**
 * @swagger
 * /api/hotel/{id}:
 *   delete:
 *     tags: [Hotels]
 *     summary: Delete hotel
 *     description: Delete a hotel
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Hotel deleted
 *       400:
 *         description: Cannot delete - hotel has active bookings
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', hotelService.deleteHotel)

/**
 * @swagger
 * /api/hotel/{id}/status:
 *   patch:
 *     tags: [Hotels]
 *     summary: Update hotel status
 *     description: Update hotel status (active, inactive, draft)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft]
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/status', hotelService.updateHotelStatus)

export default router
