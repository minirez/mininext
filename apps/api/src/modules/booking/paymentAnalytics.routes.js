/**
 * Payment Analytics Routes
 * /api/payments/analytics/*
 */

import express from 'express'
import { protect } from '#middleware/auth.js'
import * as analyticsService from './paymentAnalytics.service.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

/**
 * @swagger
 * /api/payments/analytics/revenue:
 *   get:
 *     tags: [Payment Analytics]
 *     summary: Get revenue summary
 *     description: Get revenue breakdown by period and currency
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: currency
 *         in: query
 *         schema:
 *           type: string
 *           enum: [TRY, USD, EUR, GBP]
 *       - name: groupBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: day
 *     responses:
 *       200:
 *         description: Revenue summary
 */
router.get('/revenue', analyticsService.getRevenueSummary)

/**
 * @swagger
 * /api/payments/analytics/methods:
 *   get:
 *     tags: [Payment Analytics]
 *     summary: Get payment methods breakdown
 *     description: Get distribution of payment methods
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Payment methods distribution
 */
router.get('/methods', analyticsService.getPaymentMethods)

/**
 * @swagger
 * /api/payments/analytics/commission:
 *   get:
 *     tags: [Payment Analytics]
 *     summary: Get commission report
 *     description: Get commission breakdown for credit card payments
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: groupBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: month
 *     responses:
 *       200:
 *         description: Commission report
 */
router.get('/commission', analyticsService.getCommissionReport)

/**
 * @swagger
 * /api/payments/analytics/installments:
 *   get:
 *     tags: [Payment Analytics]
 *     summary: Get installment distribution
 *     description: Get distribution of installment counts
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Installment distribution
 */
router.get('/installments', analyticsService.getInstallmentDistribution)

/**
 * @swagger
 * /api/payments/analytics/status:
 *   get:
 *     tags: [Payment Analytics]
 *     summary: Get payment status overview
 *     description: Get counts by payment status
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Status overview
 */
router.get('/status', analyticsService.getStatusOverview)

export default router
