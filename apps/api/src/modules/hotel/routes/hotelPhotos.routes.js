/**
 * Hotel Photos & Logo Routes
 * Image and logo management
 */

import express from 'express'
import * as hotelService from '../hotel.service.js'
import { hotelUpload } from '#helpers/hotelUpload.js'

const router = express.Router()

/**
 * @swagger
 * /api/hotel/{id}/images:
 *   post:
 *     tags: [Hotels]
 *     summary: Upload hotel image
 *     description: Upload an image for a hotel
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded
 *       400:
 *         description: Invalid file type or size
 */
router.post('/:id/images', hotelUpload.single('image'), hotelService.uploadHotelImage)

/**
 * @swagger
 * /api/hotel/{id}/images/{imageId}:
 *   delete:
 *     tags: [Hotels]
 *     summary: Delete hotel image
 *     description: Delete an image from a hotel
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: imageId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id/images/:imageId', hotelService.deleteHotelImage)

/**
 * @swagger
 * /api/hotel/{id}/images/reorder:
 *   patch:
 *     tags: [Hotels]
 *     summary: Reorder hotel images
 *     description: Reorder images for a hotel
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Images reordered
 */
router.patch('/:id/images/reorder', hotelService.reorderHotelImages)

/**
 * @swagger
 * /api/hotel/{id}/images/{imageId}/main:
 *   patch:
 *     tags: [Hotels]
 *     summary: Set main hotel image
 *     description: Set an image as the main image for a hotel
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: imageId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Main image set
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/images/:imageId/main', hotelService.setMainImage)

/**
 * @swagger
 * /api/hotel/{id}/logo:
 *   post:
 *     tags: [Hotels]
 *     summary: Upload hotel logo
 *     description: Upload a logo for a hotel
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo uploaded
 *       400:
 *         description: Invalid file type or size
 */
router.post('/:id/logo', hotelUpload.single('logo'), hotelService.uploadHotelLogo)

/**
 * @swagger
 * /api/hotel/{id}/logo:
 *   delete:
 *     tags: [Hotels]
 *     summary: Delete hotel logo
 *     description: Delete the logo from a hotel
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Logo deleted
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id/logo', hotelService.deleteHotelLogo)

export default router
