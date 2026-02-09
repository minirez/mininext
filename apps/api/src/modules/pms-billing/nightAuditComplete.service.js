/**
 * Night Audit Complete Service
 * Summary generation and audit completion
 */

import { asyncHandler } from '#helpers'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import NightAudit from './nightAudit.model.js'
import Stay, { STAY_STATUS } from '#modules/pms-frontdesk/stay.model.js'
import Room from '#modules/pms-housekeeping/room.model.js'
import Transaction from './transaction.model.js'
import Booking from '#modules/booking/booking.model.js'
import Hotel from '#modules/hotel/hotel.model.js'
import * as reportService from './nightAuditReports.service.js'
import { sendNightAuditReports } from '#helpers/mail.js'
import logger from '#core/logger.js'
import { emitAuditEvent } from './nightAuditCore.service.js'

/**
 * Get summary for day close
 * GET /api/hotels/:hotelId/night-audit/summary
 */
export const getAuditSummary = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const audit = await NightAudit.getCurrentAudit(hotelId)
  if (!audit) {
    throw new NotFoundError('Aktif audit bulunamadi')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Room statistics
  const roomStats = await Room.getStatistics(hotelId)

  // Today's transactions
  const transactions = await Transaction.find({
    hotel: hotelId,
    createdAt: { $gte: today, $lt: tomorrow },
    status: 'completed'
  }).lean()

  // Calculate revenue
  const roomRevenue = transactions
    .filter(t => t.type === 'ROOM_CHARGE')
    .reduce((sum, t) => sum + t.amount, 0)

  const extraRevenue = transactions
    .filter(t =>
      ['EXTRA_CHARGE', 'MINIBAR', 'SPA', 'LAUNDRY', 'RESTAURANT', 'BAR'].includes(t.type)
    )
    .reduce((sum, t) => sum + t.amount, 0)

  const totalRevenue = roomRevenue + extraRevenue

  // Payment breakdown
  const cashPayments = transactions
    .filter(t => t.type === 'PAYMENT' && t.paymentMethod === 'CASH')
    .reduce((sum, t) => sum + t.amount, 0)

  const cardPayments = transactions
    .filter(t => t.type === 'PAYMENT' && ['CREDIT_CARD', 'DEBIT_CARD'].includes(t.paymentMethod))
    .reduce((sum, t) => sum + t.amount, 0)

  const bankPayments = transactions
    .filter(t => t.type === 'PAYMENT' && t.paymentMethod === 'BANK_TRANSFER')
    .reduce((sum, t) => sum + t.amount, 0)

  // Guest movement
  const arrivals = await Booking.countDocuments({
    hotel: hotelId,
    checkIn: { $gte: today, $lt: tomorrow },
    status: 'checked_in'
  })

  const departures = await Stay.countDocuments({
    hotel: hotelId,
    actualCheckOut: { $gte: today, $lt: tomorrow }
  })

  const inHouseGuests = await Stay.countDocuments({
    hotel: hotelId,
    status: STAY_STATUS.CHECKED_IN
  })

  const noShows = audit.noShowProcessing?.records?.filter(r => r.action === 'no_show').length || 0

  // Calculate metrics
  const occupancyRate =
    roomStats.total > 0 ? Math.round((roomStats.occupied / roomStats.total) * 100) : 0

  const averageDailyRate = roomStats.occupied > 0 ? Math.round(roomRevenue / roomStats.occupied) : 0

  const revPar = roomStats.total > 0 ? Math.round(roomRevenue / roomStats.total) : 0

  // Update audit summary
  audit.summary = {
    totalRooms: roomStats.total,
    occupiedRooms: roomStats.occupied,
    availableRooms: roomStats.available,
    occupancyRate,
    arrivals,
    departures,
    inHouseGuests,
    noShows,
    cancellations: 0,
    walkIns: 0,
    roomRevenue,
    extraRevenue,
    totalRevenue,
    averageDailyRate,
    revPar,
    cashPayments,
    cardPayments,
    bankPayments,
    otherPayments: 0,
    totalPayments: cashPayments + cardPayments + bankPayments
  }

  await audit.save()

  res.json({
    success: true,
    data: audit.summary
  })
})

/**
 * Complete audit and close day
 * POST /api/hotels/:hotelId/night-audit/complete
 */
export const completeAudit = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { emailRecipients, notes } = req.body

  const audit = await NightAudit.getCurrentAudit(hotelId)
  if (!audit) {
    throw new NotFoundError('Aktif audit bulunamadi')
  }

  // Verify all steps completed
  if (
    !audit.preAuditCheck?.completed ||
    !audit.noShowProcessing?.completed ||
    !audit.roomChargePosting?.completed ||
    !audit.cashierReconciliation?.completed
  ) {
    throw new BadRequestError('Tum adimlar tamamlanmadan audit kapatılamaz')
  }

  // Get hotel for reports
  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    throw new NotFoundError('Hotel bulunamadi')
  }

  // Generate PDF reports
  const reportTypes = ['daily', 'revenue', 'occupancy', 'cashier']
  const reportNames = {
    daily: 'Gunluk_Rapor',
    revenue: 'Gelir_Raporu',
    occupancy: 'Doluluk_Raporu',
    cashier: 'Kasa_Raporu'
  }
  // Map service report types to model enum values
  const reportTypeToEnum = {
    daily: 'daily_summary',
    revenue: 'revenue',
    occupancy: 'occupancy',
    cashier: 'cashier'
  }

  const generatedReports = []
  const pdfReports = [] // For email attachments

  for (const reportType of reportTypes) {
    try {
      const data = await reportService.getReportData(hotelId, audit._id, reportType)

      let pdfBuffer
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

      const dateStr = new Date(audit.auditDate).toISOString().split('T')[0].replace(/-/g, '')
      const filename = `${reportNames[reportType]}_${dateStr}.pdf`

      generatedReports.push({
        type: reportTypeToEnum[reportType] || reportType,
        filename,
        generatedAt: new Date()
      })

      pdfReports.push({
        filename,
        buffer: pdfBuffer
      })
    } catch (error) {
      logger.error(`Failed to generate ${reportType} report:`, error)
    }
  }

  // Send email with reports if recipients provided
  let emailSent = false
  if (emailRecipients && emailRecipients.length > 0 && pdfReports.length > 0) {
    try {
      await sendNightAuditReports({
        to: emailRecipients,
        hotelName: hotel.name,
        auditDate: audit.auditDate,
        summary: audit.summary,
        reports: pdfReports,
        hotelId: hotelId
      })
      emailSent = true
      logger.info(`Night audit reports sent to: ${emailRecipients.join(', ')}`)
    } catch (error) {
      logger.error('Failed to send night audit email:', error)
      // Don't fail the audit completion, just log the error
    }
  }

  // Mark reports step as completed
  audit.reportsAndClose = {
    completed: true,
    completedAt: new Date(),
    completedBy: req.user._id,
    reports: generatedReports,
    emailSent,
    emailRecipients: emailRecipients || [],
    dayClosed: true,
    dayClosedAt: new Date()
  }

  // Complete the audit
  audit.status = 'completed'
  audit.completedAt = new Date()
  audit.completedBy = req.user._id
  audit.notes = notes

  await audit.save()

  // Emit WebSocket event for audit completion
  emitAuditEvent(hotelId, 'completed', {
    auditId: audit._id,
    audit,
    emailSent
  })

  res.json({
    success: true,
    data: audit,
    message: emailSent
      ? 'Night audit tamamlandi ve raporlar e-posta ile gonderildi'
      : 'Night audit basariyla tamamlandi'
  })
})
