/**
 * Payment Analytics Service
 * Provides payment statistics and reports
 */

import { asyncHandler, getEffectivePartnerId } from '#helpers'
import Payment from './payment.model.js'
import mongoose from 'mongoose'

/**
 * Get revenue summary
 * GET /api/payments/analytics/revenue
 */
export const getRevenueSummary = asyncHandler(async (req, res) => {
  const partnerId = getEffectivePartnerId(req)
  const { startDate, endDate, currency, groupBy = 'day' } = req.query

  // Build match conditions
  const match = {
    status: 'completed',
    ...(partnerId && { partner: new mongoose.Types.ObjectId(partnerId) })
  }

  // Date range filter
  if (startDate || endDate) {
    match.completedAt = {}
    if (startDate) match.completedAt.$gte = new Date(startDate)
    if (endDate) match.completedAt.$lte = new Date(endDate)
  }

  // Currency filter
  if (currency) {
    match.currency = currency.toUpperCase()
  }

  // Group by configuration
  const groupByConfig = {
    day: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
    week: { $dateToString: { format: '%Y-W%V', date: '$completedAt' } },
    month: { $dateToString: { format: '%Y-%m', date: '$completedAt' } },
    year: { $dateToString: { format: '%Y', date: '$completedAt' } }
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          period: groupByConfig[groupBy] || groupByConfig.day,
          currency: '$currency'
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
        // Commission stats
        totalCommission: { $sum: '$commission.totalAmount' },
        totalNetAmount: { $sum: '$commission.netAmount' }
      }
    },
    { $sort: { '_id.period': -1 } },
    {
      $group: {
        _id: '$_id.currency',
        periods: {
          $push: {
            period: '$_id.period',
            totalAmount: '$totalAmount',
            count: '$count',
            avgAmount: '$avgAmount',
            totalCommission: '$totalCommission',
            totalNetAmount: '$totalNetAmount'
          }
        },
        grandTotal: { $sum: '$totalAmount' },
        totalCount: { $sum: '$count' }
      }
    }
  ]

  const results = await Payment.aggregate(pipeline)

  // Also get totals
  const totalsPipeline = [
    { $match: match },
    {
      $group: {
        _id: '$currency',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
        totalCommission: { $sum: '$commission.totalAmount' },
        totalNetAmount: { $sum: '$commission.netAmount' }
      }
    }
  ]

  const totals = await Payment.aggregate(totalsPipeline)

  res.json({
    success: true,
    data: {
      byCurrency: results,
      totals: totals.reduce((acc, t) => {
        acc[t._id] = {
          totalAmount: t.totalAmount,
          count: t.count,
          avgAmount: Math.round(t.avgAmount * 100) / 100,
          totalCommission: t.totalCommission || 0,
          totalNetAmount: t.totalNetAmount || 0
        }
        return acc
      }, {})
    }
  })
})

/**
 * Get payment methods breakdown
 * GET /api/payments/analytics/methods
 */
export const getPaymentMethods = asyncHandler(async (req, res) => {
  const partnerId = getEffectivePartnerId(req)
  const { startDate, endDate } = req.query

  const match = {
    status: 'completed',
    ...(partnerId && { partner: new mongoose.Types.ObjectId(partnerId) })
  }

  if (startDate || endDate) {
    match.completedAt = {}
    if (startDate) match.completedAt.$gte = new Date(startDate)
    if (endDate) match.completedAt.$lte = new Date(endDate)
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          type: '$type',
          currency: '$currency'
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        currencies: {
          $push: {
            currency: '$_id.currency',
            totalAmount: '$totalAmount',
            count: '$count',
            avgAmount: '$avgAmount'
          }
        },
        totalCount: { $sum: '$count' }
      }
    },
    { $sort: { totalCount: -1 } }
  ]

  const results = await Payment.aggregate(pipeline)

  // Calculate percentages
  const totalPayments = results.reduce((sum, r) => sum + r.totalCount, 0)
  const methodsWithPercentage = results.map(r => ({
    type: r._id,
    currencies: r.currencies,
    count: r.totalCount,
    percentage: Math.round((r.totalCount / totalPayments) * 10000) / 100
  }))

  res.json({
    success: true,
    data: {
      methods: methodsWithPercentage,
      totalPayments
    }
  })
})

/**
 * Get commission report
 * GET /api/payments/analytics/commission
 */
export const getCommissionReport = asyncHandler(async (req, res) => {
  const partnerId = getEffectivePartnerId(req)
  const { startDate, endDate, groupBy = 'month' } = req.query

  const match = {
    status: 'completed',
    type: 'credit_card',
    'commission.totalAmount': { $exists: true, $gt: 0 },
    ...(partnerId && { partner: new mongoose.Types.ObjectId(partnerId) })
  }

  if (startDate || endDate) {
    match.completedAt = {}
    if (startDate) match.completedAt.$gte = new Date(startDate)
    if (endDate) match.completedAt.$lte = new Date(endDate)
  }

  const groupByConfig = {
    day: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
    week: { $dateToString: { format: '%Y-W%V', date: '$completedAt' } },
    month: { $dateToString: { format: '%Y-%m', date: '$completedAt' } }
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          period: groupByConfig[groupBy] || groupByConfig.month,
          currency: '$currency'
        },
        grossAmount: { $sum: '$amount' },
        bankCommission: { $sum: '$commission.bankAmount' },
        platformCommission: { $sum: '$commission.platformAmount' },
        totalCommission: { $sum: '$commission.totalAmount' },
        netAmount: { $sum: '$commission.netAmount' },
        count: { $sum: 1 },
        avgBankRate: { $avg: '$commission.bankRate' },
        avgPlatformRate: { $avg: '$commission.platformRate' }
      }
    },
    { $sort: { '_id.period': -1 } }
  ]

  const results = await Payment.aggregate(pipeline)

  // Group by currency
  const byCurrency = {}
  results.forEach(r => {
    const currency = r._id.currency
    if (!byCurrency[currency]) {
      byCurrency[currency] = {
        periods: [],
        totals: {
          grossAmount: 0,
          bankCommission: 0,
          platformCommission: 0,
          totalCommission: 0,
          netAmount: 0,
          count: 0
        }
      }
    }
    byCurrency[currency].periods.push({
      period: r._id.period,
      grossAmount: r.grossAmount,
      bankCommission: Math.round(r.bankCommission * 100) / 100,
      platformCommission: Math.round(r.platformCommission * 100) / 100,
      totalCommission: Math.round(r.totalCommission * 100) / 100,
      netAmount: Math.round(r.netAmount * 100) / 100,
      count: r.count,
      avgBankRate: Math.round(r.avgBankRate * 100) / 100,
      avgPlatformRate: Math.round(r.avgPlatformRate * 100) / 100
    })
    byCurrency[currency].totals.grossAmount += r.grossAmount
    byCurrency[currency].totals.bankCommission += r.bankCommission
    byCurrency[currency].totals.platformCommission += r.platformCommission
    byCurrency[currency].totals.totalCommission += r.totalCommission
    byCurrency[currency].totals.netAmount += r.netAmount
    byCurrency[currency].totals.count += r.count
  })

  res.json({
    success: true,
    data: byCurrency
  })
})

/**
 * Get installment distribution
 * GET /api/payments/analytics/installments
 */
export const getInstallmentDistribution = asyncHandler(async (req, res) => {
  const partnerId = getEffectivePartnerId(req)
  const { startDate, endDate } = req.query

  const match = {
    status: 'completed',
    type: 'credit_card',
    ...(partnerId && { partner: new mongoose.Types.ObjectId(partnerId) })
  }

  if (startDate || endDate) {
    match.completedAt = {}
    if (startDate) match.completedAt.$gte = new Date(startDate)
    if (endDate) match.completedAt.$lte = new Date(endDate)
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          installment: '$cardDetails.installment',
          currency: '$currency'
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $group: {
        _id: '$_id.installment',
        currencies: {
          $push: {
            currency: '$_id.currency',
            totalAmount: '$totalAmount',
            count: '$count',
            avgAmount: '$avgAmount'
          }
        },
        totalCount: { $sum: '$count' }
      }
    },
    { $sort: { _id: 1 } }
  ]

  const results = await Payment.aggregate(pipeline)

  // Calculate percentages
  const totalPayments = results.reduce((sum, r) => sum + r.totalCount, 0)
  const installmentsWithPercentage = results.map(r => ({
    installment: r._id || 1,
    currencies: r.currencies,
    count: r.totalCount,
    percentage: Math.round((r.totalCount / totalPayments) * 10000) / 100
  }))

  res.json({
    success: true,
    data: {
      installments: installmentsWithPercentage,
      totalPayments
    }
  })
})

/**
 * Get payment status overview
 * GET /api/payments/analytics/status
 */
export const getStatusOverview = asyncHandler(async (req, res) => {
  const partnerId = getEffectivePartnerId(req)
  const { startDate, endDate } = req.query

  const match = {
    ...(partnerId && { partner: new mongoose.Types.ObjectId(partnerId) })
  }

  if (startDate || endDate) {
    match.createdAt = {}
    if (startDate) match.createdAt.$gte = new Date(startDate)
    if (endDate) match.createdAt.$lte = new Date(endDate)
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          status: '$status',
          currency: '$currency'
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.status',
        currencies: {
          $push: {
            currency: '$_id.currency',
            totalAmount: '$totalAmount',
            count: '$count'
          }
        },
        totalCount: { $sum: '$count' }
      }
    }
  ]

  const results = await Payment.aggregate(pipeline)

  const statusMap = results.reduce((acc, r) => {
    acc[r._id] = {
      currencies: r.currencies,
      count: r.totalCount
    }
    return acc
  }, {})

  res.json({
    success: true,
    data: {
      byStatus: statusMap,
      summary: {
        pending: statusMap.pending?.count || 0,
        completed: statusMap.completed?.count || 0,
        failed: statusMap.failed?.count || 0,
        refunded: statusMap.refunded?.count || 0,
        cancelled: statusMap.cancelled?.count || 0
      }
    }
  })
})
