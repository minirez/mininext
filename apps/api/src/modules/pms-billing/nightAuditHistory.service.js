/**
 * Night Audit History Service
 * Audit history and report download
 */

import { asyncHandler } from '#helpers'
import { parsePagination } from '#services/queryBuilder.js'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import NightAudit from './nightAudit.model.js'
import Hotel from '#modules/hotel/hotel.model.js'
import * as reportService from './nightAuditReports.service.js'

/**
 * Get audit history
 * GET /api/hotels/:hotelId/night-audit/history
 */
export const getAuditHistory = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { page, limit, skip } = parsePagination(req.query)

  const audits = await NightAudit.getHistory(hotelId, { page, limit })

  const total = await NightAudit.countDocuments({
    hotel: hotelId,
    status: 'completed'
  })

  res.json({
    success: true,
    data: {
      audits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

/**
 * Get specific audit details
 * GET /api/hotels/:hotelId/night-audit/:auditId
 */
export const getAuditById = asyncHandler(async (req, res) => {
  const { hotelId, auditId } = req.params

  const audit = await NightAudit.findOne({
    _id: auditId,
    hotel: hotelId
  })
    .populate('startedBy', 'firstName lastName')
    .populate('completedBy', 'firstName lastName')

  if (!audit) {
    throw new NotFoundError('Audit bulunamadi')
  }

  res.json({
    success: true,
    data: audit
  })
})

/**
 * Download audit report as PDF
 * GET /api/hotels/:hotelId/night-audit/:auditId/reports/:reportType
 */
export const downloadReport = asyncHandler(async (req, res) => {
  const { hotelId, auditId, reportType } = req.params

  // Validate report type
  const validTypes = ['daily', 'revenue', 'occupancy', 'cashier']
  if (!validTypes.includes(reportType)) {
    throw new BadRequestError(`Gecersiz rapor tipi. Gecerli tipler: ${validTypes.join(', ')}`)
  }

  // Get audit
  const audit = await NightAudit.findOne({
    _id: auditId,
    hotel: hotelId
  })

  if (!audit) {
    throw new NotFoundError('Audit bulunamadi')
  }

  // Get hotel
  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    throw new NotFoundError('Hotel bulunamadi')
  }

  // Get report data
  const data = await reportService.getReportData(hotelId, auditId, reportType)

  // Generate PDF
  let pdfBuffer
  const reportTitles = {
    daily: 'Gunluk_Rapor',
    revenue: 'Gelir_Raporu',
    occupancy: 'Doluluk_Raporu',
    cashier: 'Kasa_Raporu'
  }

  switch (reportType) {
    case 'daily':
      pdfBuffer = await reportService.generateDailyReport(audit, hotel, data)
      break
    case 'revenue':
      pdfBuffer = await reportService.generateRevenueReport(audit, hotel, data)
      break
    case 'occupancy':
      pdfBuffer = await reportService.generateOccupancyReport(audit, hotel, data)
      break
    case 'cashier':
      pdfBuffer = await reportService.generateCashierReport(audit, hotel, data)
      break
  }

  // Format filename
  const dateStr = new Date(audit.auditDate).toISOString().split('T')[0]
  const filename = `${reportTitles[reportType]}_${dateStr}.pdf`

  // Send PDF
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Content-Length', pdfBuffer.length)
  res.send(pdfBuffer)
})
