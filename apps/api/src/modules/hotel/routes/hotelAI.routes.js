/**
 * Hotel AI Extraction Routes (SuperAdmin only)
 * AI-powered hotel data extraction
 */

import express from 'express'
import * as hotelService from '../hotel.service.js'
import { requirePlatformAdmin } from '#middleware/auth.js'

const router = express.Router()

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

export default router
