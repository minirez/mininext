/**
 * Room Template Routes (SuperAdmin only)
 * Room templates for base hotels
 */

import express from 'express'
import * as hotelService from '../hotel.service.js'
import { requirePlatformAdmin } from '#middleware/auth.js'
import { roomTemplateUpload } from '#helpers/hotelUpload.js'

const router = express.Router()

/**
 * @swagger
 * /api/hotel/base/{id}/room-templates:
 *   get:
 *     tags: [Hotels]
 *     summary: Get room templates
 *     description: Get all room templates for a base hotel (platform admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: List of room templates
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
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       maxOccupancy:
 *                         type: integer
 *                       amenities:
 *                         type: array
 *                         items:
 *                           type: string
 */
router.get('/base/:id/room-templates', requirePlatformAdmin, hotelService.getRoomTemplates)

/**
 * @swagger
 * /api/hotel/base/{id}/room-templates:
 *   post:
 *     tags: [Hotels]
 *     summary: Create room template
 *     description: Create a new room template for a base hotel (platform admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "STD"
 *               name:
 *                 type: string
 *                 example: "Standard Room"
 *               maxOccupancy:
 *                 type: integer
 *                 example: 2
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Room template created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/base/:id/room-templates', requirePlatformAdmin, hotelService.createRoomTemplate)

/**
 * @swagger
 * /api/hotel/base/{id}/room-templates/{code}:
 *   put:
 *     tags: [Hotels]
 *     summary: Update room template
 *     description: Update a room template (platform admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: code
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Room template code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               maxOccupancy:
 *                 type: integer
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Room template updated
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/base/:id/room-templates/:code', requirePlatformAdmin, hotelService.updateRoomTemplate)

/**
 * @swagger
 * /api/hotel/base/{id}/room-templates/{code}:
 *   delete:
 *     tags: [Hotels]
 *     summary: Delete room template
 *     description: Delete a room template (platform admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: code
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Room template code
 *     responses:
 *       200:
 *         description: Room template deleted
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/base/:id/room-templates/:code',
  requirePlatformAdmin,
  hotelService.deleteRoomTemplate
)

/**
 * @swagger
 * /api/hotel/base/{id}/room-templates/{code}/images:
 *   post:
 *     tags: [Hotels]
 *     summary: Upload room template image
 *     description: Upload an image for a room template (platform admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: code
 *         in: path
 *         required: true
 *         schema:
 *           type: string
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
router.post(
  '/base/:id/room-templates/:code/images',
  requirePlatformAdmin,
  roomTemplateUpload.single('image'),
  hotelService.uploadRoomTemplateImage
)

/**
 * @swagger
 * /api/hotel/base/{id}/room-templates/{code}/images/{imageId}:
 *   delete:
 *     tags: [Hotels]
 *     summary: Delete room template image
 *     description: Delete an image from a room template (platform admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: code
 *         in: path
 *         required: true
 *         schema:
 *           type: string
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
router.delete(
  '/base/:id/room-templates/:code/images/:imageId',
  requirePlatformAdmin,
  hotelService.deleteRoomTemplateImage
)

/**
 * @swagger
 * /api/hotel/base/{id}/room-templates/{code}/images/{imageId}/main:
 *   patch:
 *     tags: [Hotels]
 *     summary: Set main room template image
 *     description: Set an image as the main image for a room template (platform admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: code
 *         in: path
 *         required: true
 *         schema:
 *           type: string
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
router.patch(
  '/base/:id/room-templates/:code/images/:imageId/main',
  requirePlatformAdmin,
  hotelService.setRoomTemplateMainImage
)

/**
 * @swagger
 * /api/hotel/base/{id}/room-templates/{code}/images/reorder:
 *   patch:
 *     tags: [Hotels]
 *     summary: Reorder room template images
 *     description: Reorder images for a room template (platform admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: code
 *         in: path
 *         required: true
 *         schema:
 *           type: string
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
router.patch(
  '/base/:id/room-templates/:code/images/reorder',
  requirePlatformAdmin,
  hotelService.reorderRoomTemplateImages
)

export default router
