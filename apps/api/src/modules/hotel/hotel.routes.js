import express from 'express'
import * as hotelService from './hotel.service.js'
import { protect, requireAdmin, requirePlatformAdmin } from '#middleware/auth.js'
import { partnerContext } from '#middleware/partnerContext.js'
import { hotelUpload, roomTemplateUpload } from '#helpers/hotelUpload.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(protect)
router.use(requireAdmin)

// ===== HotelBase Routes (SuperAdmin only) =====
// These routes must come BEFORE partnerContext and general routes

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

// ===== Room Template Routes (SuperAdmin only) =====

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

// Room Template Image Management (SuperAdmin only)

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

// AI Hotel Data Extraction (SuperAdmin only)

/**
 * @swagger
 * /api/hotel/ai-extract:
 *   post:
 *     tags: [Hotels]
 *     summary: AI extract hotel data
 *     description: Extract hotel data from a URL using AI (platform admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL to extract hotel data from
 *     responses:
 *       200:
 *         description: Extracted hotel data
 *       400:
 *         description: Invalid URL or extraction failed
 */
router.post('/ai-extract', requirePlatformAdmin, hotelService.aiExtractHotelData)

/**
 * @swagger
 * /api/hotel/ai-extract/start:
 *   post:
 *     tags: [Hotels]
 *     summary: Start async AI extraction
 *     description: Start async hotel data extraction with progress tracking (platform admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Operation started
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
 *                     operationId:
 *                       type: string
 *                       description: ID to track extraction progress via WebSocket
 */
router.post('/ai-extract/start', requirePlatformAdmin, hotelService.startAiExtraction)

/**
 * @swagger
 * /api/hotel/ai-extract/{operationId}:
 *   get:
 *     tags: [Hotels]
 *     summary: Get AI extraction result
 *     description: Get the result of an async AI extraction operation (platform admin only)
 *     parameters:
 *       - name: operationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Extraction result
 *       404:
 *         description: Operation not found or expired
 */
router.get('/ai-extract/:operationId', requirePlatformAdmin, hotelService.getExtractionResult)

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

// Apply partner context for remaining routes
router.use(partnerContext)

// ===== Partner HotelBase Link Routes =====

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

// ===== Partner Hotel CRUD =====

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

// Image management

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

// Logo management

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

// ===== PMS Integration Routes =====

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
