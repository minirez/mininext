import mongoose from 'mongoose'

const subscriptionInvoiceSchema = new mongoose.Schema(
  {
    // Fatura Numarası (INV-0001 formatı)
    invoiceNumber: {
      type: String,
      unique: true,
      required: true
    },

    // İlişkiler
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true
    },
    purchase: {
      // Partner'ın subscription.purchases içindeki satın alım _id'si
      type: mongoose.Schema.Types.ObjectId
    },

    // Fatura Tarihi
    invoiceDate: {
      type: Date,
      default: Date.now
    },
    dueDate: Date,

    // Satıcı Bilgileri (Platform)
    seller: {
      companyName: String,
      taxNumber: String,
      taxOffice: String,
      address: {
        street: String,
        city: String,
        country: String,
        postalCode: String
      },
      email: String,
      phone: String
    },

    // Alıcı Bilgileri (Partner)
    buyer: {
      companyName: String,
      tradeName: String,
      taxNumber: String,
      taxOffice: String,
      address: {
        street: String,
        city: String,
        country: String,
        postalCode: String
      },
      email: String,
      phone: String
    },

    // Fatura Kalemleri
    lineItems: [
      {
        description: String, // Örn: "Professional Paket - Yıllık Abonelik"
        quantity: { type: Number, default: 1 },
        unitPrice: Number,
        taxRate: { type: Number, default: 0 }, // Yüzde olarak (18 = %18)
        taxAmount: Number,
        total: Number
      }
    ],

    // Özet
    subtotal: Number, // Vergi hariç toplam
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: Number, // Genel toplam

    // Para Birimi
    currency: {
      type: String,
      default: 'USD'
    },

    // Ödeme Bilgileri
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'credit_card', 'payment_link', 'cash', 'other']
    },
    paymentReference: String,
    paidAt: Date,

    // Durum
    status: {
      type: String,
      enum: ['draft', 'issued', 'paid', 'cancelled', 'refunded'],
      default: 'issued'
    },

    // Abonelik Bilgileri
    subscriptionPeriod: {
      plan: String, // business, professional, enterprise
      startDate: Date,
      endDate: Date
    },

    // PDF
    pdfPath: String, // Oluşturulan PDF dosya yolu
    pdfGeneratedAt: Date,

    // E-Fatura Altyapısı
    eInvoice: {
      enabled: { type: Boolean, default: false },
      uuid: String, // E-fatura UUID
      status: String, // pending, sent, accepted, rejected
      sentAt: Date,
      response: mongoose.Schema.Types.Mixed
    },

    // Notlar
    notes: String,
    internalNotes: String,

    // Meta
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    cancellationReason: String
  },
  {
    timestamps: true
  }
)

// Indexes
subscriptionInvoiceSchema.index({ partner: 1, invoiceDate: -1 })
subscriptionInvoiceSchema.index({ invoiceNumber: 1 })
subscriptionInvoiceSchema.index({ status: 1 })

// Fatura numarası oluştur (INV-0001 formatı)
subscriptionInvoiceSchema.statics.getNextInvoiceNumber = async function () {
  const lastInvoice = await this.findOne({}, {}, { sort: { createdAt: -1 } })

  if (!lastInvoice) {
    return 'INV-0001'
  }

  const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[1])
  const nextNumber = (lastNumber + 1).toString().padStart(4, '0')
  return `INV-${nextNumber}`
}

// Toplam hesapla
subscriptionInvoiceSchema.methods.calculateTotals = function () {
  let subtotal = 0
  let taxAmount = 0

  for (const item of this.lineItems) {
    item.total = item.quantity * item.unitPrice
    item.taxAmount = this.taxRate > 0 ? (item.total * this.taxRate) / 100 : 0
    subtotal += item.total
    taxAmount += item.taxAmount
  }

  this.subtotal = subtotal
  this.taxAmount = taxAmount
  this.total = subtotal + taxAmount - (this.discount || 0)

  return this
}

export default mongoose.model('SubscriptionInvoice', subscriptionInvoiceSchema)
