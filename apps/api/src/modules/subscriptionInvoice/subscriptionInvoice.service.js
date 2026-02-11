import mongoose from 'mongoose'
import SubscriptionInvoice from './subscriptionInvoice.model.js'
import Partner from '#modules/partner/partner.model.js'
import PlatformSettings from '#modules/platform-settings/platformSettings.model.js'
import { asyncHandler } from '#helpers'
import { parsePagination } from '#services/queryBuilder.js'
import { NotFoundError, ValidationError } from '#core/errors.js'
import { SUBSCRIPTION_PLANS } from '#constants/subscriptionPlans.js'
import PDFDocument from 'pdfkit'

// Fatura Listesi
export const getInvoices = asyncHandler(async (req, res) => {
  const { partnerId, status, startDate, endDate } = req.query
  const { page, limit, skip } = parsePagination(req.query)

  const query = {}
  if (partnerId) query.partner = partnerId
  if (status) query.status = status
  if (startDate || endDate) {
    query.invoiceDate = {}
    if (startDate) query.invoiceDate.$gte = new Date(startDate)
    if (endDate) query.invoiceDate.$lte = new Date(endDate)
  }

  const invoices = await SubscriptionInvoice.find(query)
    .populate('partner', 'companyName email code')
    .sort({ invoiceDate: -1 })
    .skip(skip)
    .limit(limit)

  const total = await SubscriptionInvoice.countDocuments(query)

  res.json({
    success: true,
    data: {
      invoices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }
  })
})

// Tek Fatura Detayı
export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await SubscriptionInvoice.findById(req.params.id)
    .populate('partner', 'companyName tradeName email phone taxNumber taxOffice address')
    .populate('createdBy', 'name email')

  if (!invoice) throw new NotFoundError('INVOICE_NOT_FOUND')

  res.json({ success: true, data: invoice })
})

// Fatura Oluştur (purchase eklendiğinde çağrılır) - internal function
export const createInvoice = async (partnerId, purchaseData, userId) => {
  const partner = await Partner.findById(partnerId)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  const platformSettings = await PlatformSettings.getSettings()
  const plan = SUBSCRIPTION_PLANS[purchaseData.plan] || SUBSCRIPTION_PLANS.business

  const invoiceNumber = await SubscriptionInvoice.getNextInvoiceNumber()

  // Vergi hesaplama
  const taxRate = platformSettings?.billing?.defaultTaxRate || 0
  const subtotal = purchaseData.price?.amount || 0
  const taxAmount = taxRate > 0 ? (subtotal * taxRate) / 100 : 0
  const total = subtotal + taxAmount

  // Abonelik dönemi (purchase'tan al)
  const startDate = purchaseData.period?.startDate || new Date()
  const endDate =
    purchaseData.period?.endDate || new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000)

  const invoice = await SubscriptionInvoice.create({
    invoiceNumber,
    partner: partnerId,
    purchase: purchaseData._id,
    invoiceDate: purchaseData.payment?.date || new Date(),

    // Satıcı (Platform)
    seller: {
      companyName: platformSettings?.billing?.companyName || 'Platform',
      taxNumber: platformSettings?.billing?.taxNumber,
      taxOffice: platformSettings?.billing?.taxOffice,
      address: platformSettings?.billing?.address,
      email: platformSettings?.billing?.email,
      phone: platformSettings?.billing?.phone
    },

    // Alıcı (Partner)
    buyer: {
      companyName: partner.companyName,
      tradeName: partner.tradeName,
      taxNumber: partner.taxNumber,
      taxOffice: partner.taxOffice,
      address: partner.address,
      email: partner.email,
      phone: partner.phone
    },

    // Kalemler
    lineItems: [
      {
        description: `${plan.name} Paket - Yıllık Abonelik`,
        quantity: 1,
        unitPrice: subtotal,
        taxRate,
        taxAmount,
        total
      }
    ],

    subtotal,
    taxRate,
    taxAmount,
    total,
    currency: purchaseData.price?.currency || 'USD',

    paymentMethod: purchaseData.payment?.method,
    paymentReference: purchaseData.payment?.reference,
    paidAt: purchaseData.payment?.date,
    status: 'paid',

    subscriptionPeriod: {
      plan: purchaseData.plan,
      startDate,
      endDate
    },

    notes: platformSettings?.billing?.invoiceNotes,
    createdBy: userId
  })

  return invoice
}

// PDF Oluştur
export const generatePDF = asyncHandler(async (req, res) => {
  const invoice = await SubscriptionInvoice.findById(req.params.id).populate('partner')

  if (!invoice) throw new NotFoundError('INVOICE_NOT_FOUND')

  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true
  })

  // Response headers
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`)

  doc.pipe(res)

  // === PDF İÇERİĞİ ===

  // Header
  doc.fontSize(24).font('Helvetica-Bold').text('FATURA / INVOICE', { align: 'center' })
  doc.moveDown(0.5)
  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Fatura No: ${invoice.invoiceNumber}`, { align: 'center' })
  doc.text(`Tarih: ${invoice.invoiceDate.toLocaleDateString('tr-TR')}`, { align: 'center' })
  doc.moveDown(2)

  // Satıcı ve Alıcı Bilgileri (yan yana)
  const startY = doc.y

  // Satıcı (Sol)
  doc.fontSize(10).font('Helvetica-Bold').text('SATICI / SELLER', 50, startY)
  doc.font('Helvetica').fontSize(9)
  doc.text(invoice.seller.companyName || '-', 50, startY + 15)
  if (invoice.seller.taxNumber) {
    doc.text(`Vergi No: ${invoice.seller.taxNumber}`, 50)
  }
  if (invoice.seller.taxOffice) {
    doc.text(`Vergi Dairesi: ${invoice.seller.taxOffice}`, 50)
  }
  if (invoice.seller.address?.street) {
    doc.text(invoice.seller.address.street, 50)
    doc.text(`${invoice.seller.address.city || ''} ${invoice.seller.address.country || ''}`, 50)
  }
  if (invoice.seller.email) {
    doc.text(`Email: ${invoice.seller.email}`, 50)
  }
  if (invoice.seller.phone) {
    doc.text(`Tel: ${invoice.seller.phone}`, 50)
  }

  // Alıcı (Sağ)
  doc.fontSize(10).font('Helvetica-Bold').text('ALICI / BUYER', 320, startY)
  doc.font('Helvetica').fontSize(9)
  doc.text(invoice.buyer.companyName || '-', 320, startY + 15)
  if (invoice.buyer.tradeName) {
    doc.text(invoice.buyer.tradeName, 320)
  }
  if (invoice.buyer.taxNumber) {
    doc.text(`Vergi No: ${invoice.buyer.taxNumber}`, 320)
  }
  if (invoice.buyer.taxOffice) {
    doc.text(`Vergi Dairesi: ${invoice.buyer.taxOffice}`, 320)
  }
  if (invoice.buyer.address?.street) {
    doc.text(invoice.buyer.address.street, 320)
    doc.text(`${invoice.buyer.address.city || ''} ${invoice.buyer.address.country || ''}`, 320)
  }
  if (invoice.buyer.email) {
    doc.text(`Email: ${invoice.buyer.email}`, 320)
  }

  doc.moveDown(5)

  // Tablo Başlığı
  const tableTop = doc.y + 20
  doc.fontSize(9).font('Helvetica-Bold')
  doc.text('Açıklama / Description', 50, tableTop)
  doc.text('Miktar', 300, tableTop)
  doc.text('Birim Fiyat', 360, tableTop)
  doc.text('KDV', 440, tableTop)
  doc.text('Toplam', 490, tableTop)

  // Çizgi
  doc
    .moveTo(50, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke()

  // Kalemler
  let y = tableTop + 25
  doc.font('Helvetica').fontSize(9)

  for (const item of invoice.lineItems) {
    doc.text(item.description, 50, y, { width: 240 })
    doc.text(item.quantity.toString(), 300, y)
    doc.text(`${item.unitPrice.toFixed(2)}`, 360, y)
    doc.text(`%${item.taxRate}`, 440, y)
    doc.text(`${item.total.toFixed(2)}`, 490, y)
    y += 20
  }

  // Alt Çizgi
  doc
    .moveTo(50, y + 5)
    .lineTo(550, y + 5)
    .stroke()

  // Toplamlar (Sağ alt)
  y += 20
  doc.font('Helvetica').fontSize(10)
  doc.text('Ara Toplam / Subtotal:', 380, y)
  doc.text(`${invoice.subtotal.toFixed(2)} ${invoice.currency}`, 490, y)

  if (invoice.taxAmount > 0) {
    y += 18
    doc.text(`KDV / VAT (%${invoice.taxRate}):`, 380, y)
    doc.text(`${invoice.taxAmount.toFixed(2)} ${invoice.currency}`, 490, y)
  }

  y += 25
  doc.font('Helvetica-Bold').fontSize(12)
  doc.text('GENEL TOPLAM / TOTAL:', 350, y)
  doc.text(`${invoice.total.toFixed(2)} ${invoice.currency}`, 490, y)

  // Ödeme Bilgisi
  if (invoice.status === 'paid') {
    y += 40
    doc.font('Helvetica').fontSize(10)
    doc.fillColor('green').text('ODENDI / PAID', 400, y)
    doc.fillColor('black')
    if (invoice.paidAt) {
      doc
        .fontSize(9)
        .text(`Odeme Tarihi: ${invoice.paidAt.toLocaleDateString('tr-TR')}`, 400, y + 15)
    }
    if (invoice.paymentReference) {
      doc.text(`Referans: ${invoice.paymentReference}`, 400, y + 28)
    }
  }

  // Abonelik Dönemi
  if (invoice.subscriptionPeriod?.startDate && invoice.subscriptionPeriod?.endDate) {
    y += 60
    doc.fontSize(9).font('Helvetica')
    doc.text('Abonelik Donemi / Subscription Period:', 50, y)
    doc.text(
      `${invoice.subscriptionPeriod.startDate.toLocaleDateString('tr-TR')} - ${invoice.subscriptionPeriod.endDate.toLocaleDateString('tr-TR')}`,
      50,
      y + 12
    )
  }

  // Notlar
  if (invoice.notes) {
    doc.moveDown(3)
    doc.fontSize(9).font('Helvetica-Bold').text('Notlar / Notes:', 50)
    doc.font('Helvetica').text(invoice.notes, 50, doc.y + 5, { width: 500 })
  }

  // Footer
  doc
    .fontSize(8)
    .font('Helvetica')
    .text('Bu fatura elektronik ortamda olusturulmustur.', 50, 780, { align: 'center' })
  doc.text('This invoice was generated electronically.', 50, 792, { align: 'center' })

  doc.end()
})

// Fatura Durumu Güncelle
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, cancellationReason } = req.body

  const invoice = await SubscriptionInvoice.findById(req.params.id)
  if (!invoice) throw new NotFoundError('INVOICE_NOT_FOUND')

  // Durum geçiş kontrolü
  const validTransitions = {
    draft: ['issued', 'cancelled'],
    issued: ['paid', 'cancelled'],
    paid: ['refunded'],
    cancelled: [],
    refunded: []
  }

  if (!validTransitions[invoice.status]?.includes(status)) {
    throw new ValidationError('INVALID_STATUS_TRANSITION')
  }

  invoice.status = status

  if (status === 'cancelled') {
    invoice.cancelledAt = new Date()
    invoice.cancelledBy = req.user._id
    invoice.cancellationReason = cancellationReason
  }

  if (status === 'paid' && !invoice.paidAt) {
    invoice.paidAt = new Date()
  }

  await invoice.save()

  res.json({ success: true, data: invoice })
})

// İstatistikler
export const getStats = asyncHandler(async (req, res) => {
  const { year, partnerId } = req.query
  const currentYear = year || new Date().getFullYear()

  const matchStage = {
    invoiceDate: {
      $gte: new Date(`${currentYear}-01-01`),
      $lt: new Date(`${parseInt(currentYear) + 1}-01-01`)
    }
  }

  if (partnerId) matchStage.partner = new mongoose.Types.ObjectId(partnerId)

  const stats = await SubscriptionInvoice.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$total' }
      }
    }
  ])

  const monthlyStats = await SubscriptionInvoice.aggregate([
    { $match: { ...matchStage, status: 'paid' } },
    {
      $group: {
        _id: { $month: '$invoiceDate' },
        count: { $sum: 1 },
        total: { $sum: '$total' }
      }
    },
    { $sort: { _id: 1 } }
  ])

  res.json({
    success: true,
    data: {
      byStatus: stats,
      monthly: monthlyStats,
      year: currentYear
    }
  })
})

// Partner'ın faturalarını getir
export const getPartnerInvoices = asyncHandler(async (req, res) => {
  const { partnerId } = req.params
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10 })

  const invoices = await SubscriptionInvoice.find({ partner: partnerId })
    .sort({ invoiceDate: -1 })
    .skip(skip)
    .limit(limit)

  const total = await SubscriptionInvoice.countDocuments({ partner: partnerId })

  res.json({
    success: true,
    data: {
      invoices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }
  })
})
