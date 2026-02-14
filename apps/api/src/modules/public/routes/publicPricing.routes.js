/**
 * Public Pricing Routes
 * Price quotes and pricing endpoints
 */

import express from 'express'
import * as publicService from '../public.service.js'
import { pricingLimiter } from '#middleware/rateLimiter.js'
import { validateBody } from '#middleware/validation.js'

const router = express.Router()

/**
 * @swagger
 * /api/public/hotels/{hotelCode}/price-quote:
 *   post:
 *     tags: [Public]
 *     summary: Get detailed price quote
 *     description: Get a detailed price breakdown including applicable campaigns and discounts
 *     security: []
 *     parameters:
 *       - name: hotelCode
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
 *             required: [checkIn, checkOut, roomTypeCode, mealPlanCode]
 *             properties:
 *               checkIn:
 *                 type: string
 *                 format: date
 *               checkOut:
 *                 type: string
 *                 format: date
 *               roomTypeCode:
 *                 type: string
 *                 example: "STD"
 *               mealPlanCode:
 *                 type: string
 *                 example: "AI"
 *               adults:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 2
 *               children:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Price quote
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PriceQuote'
 */
router.post(
  '/hotels/:hotelCode/price-quote',
  pricingLimiter,
  validateBody({
    checkIn: { type: 'date', required: true },
    checkOut: { type: 'date', required: true },
    roomTypeCode: { type: 'string', required: true },
    mealPlanCode: { type: 'string', required: true },
    adults: { type: 'integer', min: 1, max: 10 },
    children: { type: 'array' }
  }),
  publicService.getPriceQuote
)

/**
 * @swagger
 * /api/public/hotels/{hotelCode}/apply-promo:
 *   post:
 *     tags: [Public]
 *     summary: Validate and apply a promo code
 *     security: []
 *     parameters:
 *       - name: hotelCode
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
 *             required: [code, checkIn, checkOut]
 *             properties:
 *               code:
 *                 type: string
 *               checkIn:
 *                 type: string
 *                 format: date
 *               checkOut:
 *                 type: string
 *                 format: date
 */
router.post(
  '/hotels/:hotelCode/apply-promo',
  pricingLimiter,
  validateBody({
    code: { type: 'string', required: true },
    checkIn: { type: 'date', required: true },
    checkOut: { type: 'date', required: true },
    roomTypeCode: { type: 'string' },
    mealPlanCode: { type: 'string' },
    adults: { type: 'integer', min: 1, max: 10 },
    children: { type: 'array' }
  }),
  publicService.applyPromoCode
)

export default router
