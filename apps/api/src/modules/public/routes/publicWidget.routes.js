/**
 * Public Widget Routes
 * Market detection and domain resolution
 */

import express from 'express'
import * as publicService from '../public.service.js'

const router = express.Router()

/**
 * @swagger
 * /api/public/detect-market:
 *   get:
 *     tags: [Public]
 *     summary: Detect market from IP
 *     description: Detect visitor's country and appropriate currency from IP address
 *     security: []
 *     responses:
 *       200:
 *         description: Market information
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
 *                     countryCode:
 *                       type: string
 *                       example: TR
 *                     currency:
 *                       type: string
 *                       example: TRY
 *                     locale:
 *                       type: string
 *                       example: tr-TR
 */
router.get('/detect-market', publicService.detectMarket)

/**
 * @swagger
 * /api/public/resolve-domain:
 *   get:
 *     tags: [Public]
 *     summary: Resolve PMS domain
 *     description: Resolve a domain to its associated hotel or partner for white-label setups
 *     security: []
 *     parameters:
 *       - name: domain
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         example: pms.example.com
 *     responses:
 *       200:
 *         description: Domain resolved successfully
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
 *                     type:
 *                       type: string
 *                       enum: [hotel, partner]
 *                     hotel:
 *                       $ref: '#/components/schemas/Hotel'
 *       404:
 *         description: Domain not found
 */
router.get('/resolve-domain', publicService.resolveDomain)

export default router
