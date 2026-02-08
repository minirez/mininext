/**
 * Night Audit PDF Reports Service
 * Generates PDF reports for night audit
 */

import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Color palette
const COLORS = {
  primary: '#4F46E5', // Indigo
  secondary: '#6B7280', // Gray
  success: '#10B981', // Green
  warning: '#F59E0B', // Amber
  danger: '#EF4444', // Red
  dark: '#1F2937', // Dark gray
  light: '#F3F4F6', // Light gray
  white: '#FFFFFF'
}

/**
 * Format currency
 */
const formatCurrency = (amount, currency = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0)
}

/**
 * Format date
 */
const formatDate = date => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format time
 */
const formatTime = date => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format datetime
 */
const formatDateTime = date => {
  if (!date) return ''
  return `${formatDate(date)} ${formatTime(date)}`
}

/**
 * Add header to PDF
 */
const addHeader = (doc, hotel, title, auditDate) => {
  // Background header bar
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.primary)

  // Hotel name
  doc
    .fontSize(20)
    .fillColor(COLORS.white)
    .text(hotel.name || 'Hotel', 50, 25, { width: 300 })

  // Report title
  doc.fontSize(12).fillColor(COLORS.white).text(title, 50, 50)

  // Date on right
  doc
    .fontSize(10)
    .fillColor(COLORS.white)
    .text(formatDate(auditDate), 400, 30, { width: 150, align: 'right' })

  // Generated at
  doc
    .fontSize(8)
    .text(`Olusturulma: ${formatDateTime(new Date())}`, 400, 50, { width: 150, align: 'right' })

  // Reset position
  doc.fillColor(COLORS.dark)
  doc.y = 100
}

/**
 * Add footer to PDF
 */
const addFooter = (doc, pageNumber) => {
  const bottom = doc.page.height - 30

  doc
    .fontSize(8)
    .fillColor(COLORS.secondary)
    .text(`Sayfa ${pageNumber}`, 50, bottom, { width: doc.page.width - 100, align: 'center' })
}

/**
 * Add section title
 */
const addSectionTitle = (doc, title, icon = null) => {
  doc.moveDown(0.5)

  // Section bar
  doc.rect(50, doc.y, doc.page.width - 100, 25).fill(COLORS.light)

  doc
    .fontSize(12)
    .fillColor(COLORS.primary)
    .text(title, 60, doc.y - 18)

  doc.fillColor(COLORS.dark)
  doc.moveDown(0.5)
}

/**
 * Add stat box
 */
const addStatBox = (doc, x, y, width, label, value, color = COLORS.primary) => {
  // Box background
  doc.rect(x, y, width, 50).fill(COLORS.light)

  // Value
  doc
    .fontSize(18)
    .fillColor(color)
    .text(value, x + 10, y + 10, { width: width - 20, align: 'center' })

  // Label
  doc
    .fontSize(9)
    .fillColor(COLORS.secondary)
    .text(label, x + 10, y + 32, { width: width - 20, align: 'center' })

  doc.fillColor(COLORS.dark)
}

/**
 * Add table
 */
const addTable = (doc, headers, rows, options = {}) => {
  const { startX = 50, columnWidths = [], headerBg = COLORS.primary } = options
  const pageWidth = doc.page.width - 100
  const defaultWidth = pageWidth / headers.length

  let y = doc.y

  // Calculate column widths
  const widths = headers.map((_, i) => columnWidths[i] || defaultWidth)

  // Header row
  doc.rect(startX, y, pageWidth, 20).fill(headerBg)

  let x = startX
  headers.forEach((header, i) => {
    doc
      .fontSize(9)
      .fillColor(COLORS.white)
      .text(header, x + 5, y + 6, { width: widths[i] - 10 })
    x += widths[i]
  })

  y += 20
  doc.fillColor(COLORS.dark)

  // Data rows
  rows.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (y > doc.page.height - 80) {
      doc.addPage()
      y = 50
    }

    // Alternating row background
    if (rowIndex % 2 === 0) {
      doc.rect(startX, y, pageWidth, 18).fill('#F9FAFB')
    }

    x = startX
    row.forEach((cell, i) => {
      doc
        .fontSize(9)
        .fillColor(COLORS.dark)
        .text(String(cell || '-'), x + 5, y + 5, { width: widths[i] - 10 })
      x += widths[i]
    })

    y += 18
  })

  doc.y = y + 10
}

/**
 * Generate Daily Report PDF
 */
export const generateDailyReport = async (audit, hotel, data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks = []

      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      addHeader(doc, hotel, 'GUNLUK RAPOR (Night Audit)', audit.auditDate)

      // Summary stats
      doc.moveDown()
      const statWidth = (doc.page.width - 120) / 4
      const statY = doc.y

      addStatBox(
        doc,
        50,
        statY,
        statWidth,
        'Doluluk',
        `%${data.occupancyRate || 0}`,
        COLORS.primary
      )
      addStatBox(
        doc,
        60 + statWidth,
        statY,
        statWidth,
        'Toplam Gelir',
        formatCurrency(data.totalRevenue),
        COLORS.success
      )
      addStatBox(
        doc,
        70 + statWidth * 2,
        statY,
        statWidth,
        'Giris/Cikis',
        `${data.arrivals || 0}/${data.departures || 0}`,
        COLORS.primary
      )
      addStatBox(
        doc,
        80 + statWidth * 3,
        statY,
        statWidth,
        'Misafir',
        `${data.inHouseGuests || 0}`,
        COLORS.primary
      )

      doc.y = statY + 70

      // Audit Summary
      addSectionTitle(doc, 'AUDIT OZETI')

      doc.fontSize(10)
      doc.text(`Audit No: ${audit.auditNumber}`, 60)
      doc.text(`Audit Tarihi: ${formatDate(audit.auditDate)}`, 60)
      doc.text(`Baslama: ${formatDateTime(audit.startedAt)}`, 60)
      doc.text(`Tamamlanma: ${formatDateTime(audit.completedAt)}`, 60)
      doc.moveDown()

      // Revenue breakdown
      addSectionTitle(doc, 'GELIR DAGILIMI')

      addTable(
        doc,
        ['Kategori', 'Tutar', 'Oran'],
        [
          [
            'Oda Geliri',
            formatCurrency(data.roomRevenue),
            `%${Math.round((data.roomRevenue / (data.totalRevenue || 1)) * 100)}`
          ],
          [
            'Ekstra Gelir',
            formatCurrency(data.extraRevenue),
            `%${Math.round((data.extraRevenue / (data.totalRevenue || 1)) * 100)}`
          ],
          ['TOPLAM', formatCurrency(data.totalRevenue), '%100']
        ],
        { columnWidths: [200, 150, 100] }
      )

      // Operations summary
      addSectionTitle(doc, 'OPERASYON OZETI')

      addTable(
        doc,
        ['Islem', 'Sayi', 'Detay'],
        [
          ['Check-in', data.arrivals || 0, 'Bugun giris yapan'],
          ['Check-out', data.departures || 0, 'Bugun cikis yapan'],
          ['No-Show', data.noShows || 0, 'Gelmeyen rezervasyon'],
          ['Iptal', data.cancellations || 0, 'Iptal edilen']
        ],
        { columnWidths: [200, 100, 150] }
      )

      // Issues if any
      if (audit.preAuditCheck?.issues?.length > 0) {
        addSectionTitle(doc, 'AUDIT UYARILARI')

        audit.preAuditCheck.issues.forEach(issue => {
          const color =
            issue.severity === 'error'
              ? COLORS.danger
              : issue.severity === 'warning'
                ? COLORS.warning
                : COLORS.secondary
          doc.fontSize(9).fillColor(color).text(`• ${issue.message}`, 60)
        })
        doc.fillColor(COLORS.dark)
      }

      // Footer
      addFooter(doc, 1)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generate Revenue Report PDF
 */
export const generateRevenueReport = async (audit, hotel, data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks = []

      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      addHeader(doc, hotel, 'GELIR RAPORU', audit.auditDate)

      // Summary
      doc.moveDown()
      const statWidth = (doc.page.width - 110) / 3
      const statY = doc.y

      addStatBox(
        doc,
        50,
        statY,
        statWidth,
        'Oda Geliri',
        formatCurrency(data.roomRevenue),
        COLORS.success
      )
      addStatBox(
        doc,
        60 + statWidth,
        statY,
        statWidth,
        'Ekstra Gelir',
        formatCurrency(data.extraRevenue),
        COLORS.primary
      )
      addStatBox(
        doc,
        70 + statWidth * 2,
        statY,
        statWidth,
        'Toplam Gelir',
        formatCurrency(data.totalRevenue),
        COLORS.success
      )

      doc.y = statY + 70

      // Room revenue details
      addSectionTitle(doc, 'ODA GELIRLERI')

      if (data.roomCharges?.length > 0) {
        addTable(
          doc,
          ['Oda', 'Misafir', 'Oda Tipi', 'Geceler', 'Tutar'],
          data.roomCharges.map(c => [
            c.roomNumber,
            c.guestName,
            c.roomType,
            c.nights || 1,
            formatCurrency(c.amount)
          ]),
          { columnWidths: [60, 150, 100, 60, 80] }
        )
      } else {
        doc.fontSize(10).text('Bugun icin oda geliri kaydedilmedi.', 60)
      }

      // Extra revenue details
      addSectionTitle(doc, 'EKSTRA GELIRLER')

      if (data.extras?.length > 0) {
        addTable(
          doc,
          ['Oda', 'Misafir', 'Aciklama', 'Tutar'],
          data.extras.map(e => [
            e.roomNumber,
            e.guestName,
            e.description,
            formatCurrency(e.amount)
          ]),
          { columnWidths: [60, 150, 170, 80] }
        )
      } else {
        doc.fontSize(10).text('Bugun icin ekstra gelir kaydedilmedi.', 60)
      }

      // Payment methods breakdown
      addSectionTitle(doc, 'ODEME YONTEMLERI')

      addTable(
        doc,
        ['Yontem', 'Islem Sayisi', 'Tutar'],
        [
          [
            'Nakit',
            data.paymentMethods?.cash?.count || 0,
            formatCurrency(data.paymentMethods?.cash?.total)
          ],
          [
            'Kredi Karti',
            data.paymentMethods?.card?.count || 0,
            formatCurrency(data.paymentMethods?.card?.total)
          ],
          [
            'Banka Transferi',
            data.paymentMethods?.transfer?.count || 0,
            formatCurrency(data.paymentMethods?.transfer?.total)
          ]
        ],
        { columnWidths: [200, 100, 150] }
      )

      // Footer
      addFooter(doc, 1)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generate Occupancy Report PDF
 */
export const generateOccupancyReport = async (audit, hotel, data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks = []

      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      addHeader(doc, hotel, 'DOLULUK RAPORU', audit.auditDate)

      // Summary stats
      doc.moveDown()
      const statWidth = (doc.page.width - 120) / 4
      const statY = doc.y

      addStatBox(
        doc,
        50,
        statY,
        statWidth,
        'Toplam Oda',
        `${data.totalRooms || 0}`,
        COLORS.secondary
      )
      addStatBox(
        doc,
        60 + statWidth,
        statY,
        statWidth,
        'Dolu',
        `${data.occupiedRooms || 0}`,
        COLORS.success
      )
      addStatBox(
        doc,
        70 + statWidth * 2,
        statY,
        statWidth,
        'Bos',
        `${data.availableRooms || 0}`,
        COLORS.primary
      )
      addStatBox(
        doc,
        80 + statWidth * 3,
        statY,
        statWidth,
        'Doluluk',
        `%${data.occupancyRate || 0}`,
        COLORS.primary
      )

      doc.y = statY + 70

      // Room type breakdown
      addSectionTitle(doc, 'ODA TIPLERINE GORE DOLULUK')

      if (data.roomTypes?.length > 0) {
        addTable(
          doc,
          ['Oda Tipi', 'Toplam', 'Dolu', 'Bos', 'Doluluk'],
          data.roomTypes.map(rt => [
            rt.name,
            rt.total,
            rt.occupied,
            rt.available,
            `%${rt.occupancyRate}`
          ]),
          { columnWidths: [150, 80, 80, 80, 80] }
        )
      }

      // Floor breakdown
      addSectionTitle(doc, 'KATLARA GORE DOLULUK')

      if (data.floors?.length > 0) {
        addTable(
          doc,
          ['Kat', 'Toplam Oda', 'Dolu', 'Bos', 'Doluluk'],
          data.floors.map(f => [
            `Kat ${f.floor}`,
            f.total,
            f.occupied,
            f.available,
            `%${f.occupancyRate}`
          ]),
          { columnWidths: [100, 100, 80, 80, 100] }
        )
      }

      // Room status
      addSectionTitle(doc, 'ODA DURUMLARI')

      addTable(
        doc,
        ['Durum', 'Sayi', 'Oran'],
        [
          ['Dolu - Temiz', data.roomStatus?.occupiedClean || 0, '-'],
          ['Dolu - Kirli', data.roomStatus?.occupiedDirty || 0, '-'],
          ['Bos - Temiz', data.roomStatus?.vacantClean || 0, '-'],
          ['Bos - Kirli', data.roomStatus?.vacantDirty || 0, '-'],
          ['Bakim', data.roomStatus?.maintenance || 0, '-'],
          ['Bloklu', data.roomStatus?.blocked || 0, '-']
        ],
        { columnWidths: [200, 100, 150] }
      )

      // Footer
      addFooter(doc, 1)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generate Cashier Report PDF
 */
export const generateCashierReport = async (audit, hotel, data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks = []

      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      addHeader(doc, hotel, 'KASA RAPORU', audit.auditDate)

      // Summary
      doc.moveDown()
      const statWidth = (doc.page.width - 110) / 3
      const statY = doc.y

      addStatBox(
        doc,
        50,
        statY,
        statWidth,
        'Nakit Islem',
        formatCurrency(data.totalCash),
        COLORS.success
      )
      addStatBox(
        doc,
        60 + statWidth,
        statY,
        statWidth,
        'Kart Islem',
        formatCurrency(data.totalCard),
        COLORS.primary
      )
      addStatBox(
        doc,
        70 + statWidth * 2,
        statY,
        statWidth,
        'Toplam',
        formatCurrency(data.totalTransactions),
        COLORS.success
      )

      doc.y = statY + 70

      // Shifts
      addSectionTitle(doc, 'VARDIYA DETAYLARI')

      if (data.shifts?.length > 0) {
        data.shifts.forEach((shift, index) => {
          doc
            .fontSize(11)
            .fillColor(COLORS.primary)
            .text(`${shift.cashierName} - ${shift.shiftNumber}`, 60)

          doc.fontSize(9).fillColor(COLORS.dark)

          doc.text(`Acilis: ${formatDateTime(shift.openedAt)}`, 70)
          doc.text(`Kapanis: ${formatDateTime(shift.closedAt)}`, 70)
          doc.moveDown(0.3)

          addTable(
            doc,
            ['Islem', 'Tutar'],
            [
              ['Acilis Bakiyesi', formatCurrency(shift.openingBalance)],
              ['Nakit Giris', formatCurrency(shift.cashIn)],
              ['Nakit Cikis', formatCurrency(-shift.cashOut)],
              ['Beklenen Nakit', formatCurrency(shift.expectedCash)],
              ['Gercek Nakit', formatCurrency(shift.actualCash)],
              ['Fark', formatCurrency(shift.discrepancy)]
            ],
            { columnWidths: [250, 150] }
          )

          if (shift.discrepancy !== 0 && shift.discrepancyNote) {
            doc
              .fontSize(9)
              .fillColor(COLORS.warning)
              .text(`Fark Aciklamasi: ${shift.discrepancyNote}`, 60)
            doc.fillColor(COLORS.dark)
          }

          doc.moveDown()
        })
      } else {
        doc.fontSize(10).text('Bugun icin vardiya bilgisi bulunamadi.', 60)
      }

      // Transaction summary
      addSectionTitle(doc, 'ISLEM OZETI')

      addTable(
        doc,
        ['Islem Tipi', 'Adet', 'Tutar'],
        [
          [
            'Odeme',
            data.summary?.payments?.count || 0,
            formatCurrency(data.summary?.payments?.total)
          ],
          ['Iade', data.summary?.refunds?.count || 0, formatCurrency(data.summary?.refunds?.total)],
          ['Iptal', data.summary?.voids?.count || 0, formatCurrency(data.summary?.voids?.total)]
        ],
        { columnWidths: [200, 100, 150] }
      )

      // Footer
      addFooter(doc, 1)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Get report data for a specific report type
 */
export const getReportData = async (hotelId, auditId, reportType) => {
  // Import models
  const Stay = (await import('#modules/pms-frontdesk/stay.model.js')).default
  const Room = (await import('#modules/pms-housekeeping/room.model.js')).default
  const CashRegister = (await import('./cashRegister.model.js')).default
  const NightAudit = (await import('./nightAudit.model.js')).default

  const audit = await NightAudit.findById(auditId)
  if (!audit) {
    throw new Error('Audit not found')
  }

  const auditDate = new Date(audit.auditDate)
  const startOfDay = new Date(auditDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(auditDate)
  endOfDay.setHours(23, 59, 59, 999)

  switch (reportType) {
    case 'daily':
      return {
        occupancyRate: audit.summary?.occupancyRate || 0,
        totalRevenue: audit.summary?.totalRevenue || 0,
        roomRevenue: audit.summary?.roomRevenue || 0,
        extraRevenue: audit.summary?.extraRevenue || 0,
        arrivals: audit.summary?.arrivals || 0,
        departures: audit.summary?.departures || 0,
        inHouseGuests: audit.summary?.inHouseGuests || 0,
        noShows: audit.summary?.noShows || 0,
        cancellations: audit.summary?.cancellations || 0
      }

    case 'revenue': {
      const stays = await Stay.find({
        hotel: hotelId,
        status: 'checked_in',
        checkInDate: { $lte: endOfDay }
      }).populate('room roomType')

      return {
        roomRevenue: audit.summary?.roomRevenue || 0,
        extraRevenue: audit.summary?.extraRevenue || 0,
        totalRevenue: audit.summary?.totalRevenue || 0,
        roomCharges: stays.map(stay => {
          // Get main guest from embedded guests array
          const mainGuest = stay.guests?.find(g => g.isMainGuest) || stay.guests?.[0]
          const guestName = mainGuest
            ? `${mainGuest.firstName || ''} ${mainGuest.lastName || ''}`.trim()
            : 'N/A'
          return {
            roomNumber: stay.room?.roomNumber,
            guestName,
            roomType: stay.roomType?.name?.tr || stay.roomType?.code || 'Standard',
            nights: 1,
            amount: stay.roomRate || 0
          }
        }),
        extras: [],
        paymentMethods: {
          cash: { count: 0, total: 0 },
          card: { count: 0, total: 0 },
          transfer: { count: 0, total: 0 }
        }
      }
    }

    case 'occupancy': {
      const rooms = await Room.find({ hotel: hotelId })
      const activeStays = await Stay.find({
        hotel: hotelId,
        status: 'checked_in'
      })

      const totalRooms = rooms.length
      const occupiedRooms = activeStays.length
      const availableRooms = totalRooms - occupiedRooms

      // Group by room type
      const roomTypeStats = {}
      rooms.forEach(room => {
        const typeName = room.roomType?.name || 'Standard'
        if (!roomTypeStats[typeName]) {
          roomTypeStats[typeName] = { total: 0, occupied: 0 }
        }
        roomTypeStats[typeName].total++
      })

      activeStays.forEach(stay => {
        const typeName = stay.room?.roomType?.name || 'Standard'
        if (roomTypeStats[typeName]) {
          roomTypeStats[typeName].occupied++
        }
      })

      return {
        totalRooms,
        occupiedRooms,
        availableRooms,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
        roomTypes: Object.entries(roomTypeStats).map(([name, stats]) => ({
          name,
          total: stats.total,
          occupied: stats.occupied,
          available: stats.total - stats.occupied,
          occupancyRate: stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0
        })),
        floors: [],
        roomStatus: {
          occupiedClean: 0,
          occupiedDirty: 0,
          vacantClean: 0,
          vacantDirty: 0,
          maintenance: 0,
          blocked: 0
        }
      }
    }

    case 'cashier': {
      const shifts = audit.cashierReconciliation?.shifts || []

      let totalCash = 0
      const totalCard = 0

      shifts.forEach(shift => {
        totalCash += shift.actualCash || shift.expectedCash || 0
      })

      return {
        totalCash,
        totalCard,
        totalTransactions: totalCash + totalCard,
        shifts: shifts.map(s => ({
          cashierName: s.cashierName || 'Kasiyer',
          shiftNumber: s.shiftNumber || 'SFT-001',
          openedAt: s.openedAt,
          closedAt: s.closedAt,
          openingBalance: s.openingBalance || 0,
          cashIn: s.cashIn || 0,
          cashOut: s.cashOut || 0,
          expectedCash: s.expectedCash || 0,
          actualCash: s.actualCash || 0,
          discrepancy: s.discrepancy || 0,
          discrepancyNote: s.discrepancyNote
        })),
        summary: {
          payments: { count: 0, total: totalCash + totalCard },
          refunds: { count: 0, total: 0 },
          voids: { count: 0, total: 0 }
        }
      }
    }

    default:
      throw new Error(`Unknown report type: ${reportType}`)
  }
}

export default {
  generateDailyReport,
  generateRevenueReport,
  generateOccupancyReport,
  generateCashierReport,
  getReportData
}
