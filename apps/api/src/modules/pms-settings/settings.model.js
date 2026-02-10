import mongoose from 'mongoose'

/**
 * PMS Settings Model
 * Otel bazlı PMS operasyonel ayarları
 */

const settingsSchema = new mongoose.Schema(
  {
    // Hotel reference
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true
    },

    // ===== GENEL AYARLAR =====
    general: {
      timezone: {
        type: String,
        default: 'Europe/Istanbul'
      },
      dateFormat: {
        type: String,
        enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
        default: 'DD/MM/YYYY'
      },
      timeFormat: {
        type: String,
        enum: ['24h', '12h'],
        default: '24h'
      },
      language: {
        type: String,
        default: 'tr'
      },
      currency: {
        type: String,
        enum: ['TRY', 'USD', 'EUR', 'GBP'],
        default: 'TRY'
      }
    },

    // ===== RESEPSIYON AYARLARI =====
    frontDesk: {
      defaultCheckInTime: {
        type: String,
        default: '14:00'
      },
      defaultCheckOutTime: {
        type: String,
        default: '12:00'
      },
      allowEarlyCheckIn: {
        type: Boolean,
        default: true
      },
      allowLateCheckOut: {
        type: Boolean,
        default: true
      },
      earlyCheckInFee: {
        type: Number,
        default: 0
      },
      lateCheckOutFee: {
        type: Number,
        default: 0
      },
      defaultPaymentMethod: {
        type: String,
        enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'room_charge'],
        default: 'cash'
      },
      requireDepositForWalkIn: {
        type: Boolean,
        default: true
      },
      minimumDepositPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
      },
      requireZeroBalanceCheckOut: {
        type: Boolean,
        default: true
      }
    },

    // ===== VERGİ AYARLARI =====
    taxes: {
      pricesIncludeTax: {
        type: Boolean,
        default: true
      },
      taxTypes: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          name: { type: String, required: true },
          code: { type: String, required: true, uppercase: true },
          rate: { type: Number, min: 0, max: 100, required: true },
          isActive: { type: Boolean, default: true },
          applyTo: {
            type: String,
            enum: ['all', 'accommodation', 'food_beverage', 'services'],
            default: 'all'
          }
        }
      ],
      accommodationTaxRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 10
      },
      foodBeverageTaxRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 10
      }
    },

    // ===== FATURA AYARLARI =====
    invoicing: {
      autoGenerateInvoice: {
        type: Boolean,
        default: true
      },
      invoicePrefix: {
        type: String,
        default: 'INV'
      },
      invoiceYearSuffix: {
        type: Boolean,
        default: true
      },
      lastInvoiceNumber: {
        type: Number,
        default: 0
      },
      companyInfo: {
        name: { type: String },
        taxOffice: { type: String },
        taxNumber: { type: String },
        address: { type: String },
        phone: { type: String },
        email: { type: String }
      },
      invoiceNotes: {
        type: String,
        default: ''
      }
    },

    // ===== KAT HİZMETLERİ AYARLARI =====
    housekeeping: {
      dailyCleaningTime: {
        type: String,
        default: '10:00'
      },
      autoMarkDirtyOnCheckout: {
        type: Boolean,
        default: true
      },
      cleaningPriority: {
        type: String,
        enum: ['checkout_first', 'vip_first', 'floor_order'],
        default: 'checkout_first'
      },
      cleaningStatuses: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          code: { type: String, required: true },
          name: { type: String, required: true },
          color: { type: String, default: '#gray' },
          order: { type: Number, default: 0 }
        }
      ],
      taskTypes: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          code: { type: String, required: true },
          name: { type: String, required: true },
          estimatedMinutes: { type: Number, default: 30 },
          isActive: { type: Boolean, default: true }
        }
      ]
    },

    // ===== KASA/POS AYARLARI =====
    cashier: {
      activeCurrencies: {
        type: [String],
        default: ['TRY']
      },
      requireShift: {
        type: Boolean,
        default: true
      },
      autoCloseShiftTime: {
        type: String,
        default: ''
      },
      cashDiscrepancyTolerance: {
        type: Number,
        default: 0
      },
      receiptPrefix: {
        type: String,
        default: 'RCP'
      },
      lastReceiptNumber: {
        type: Number,
        default: 0
      },
      paymentMethods: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          code: { type: String, required: true },
          name: { type: String, required: true },
          isActive: { type: Boolean, default: true },
          isCash: { type: Boolean, default: false },
          requireReference: { type: Boolean, default: false },
          order: { type: Number, default: 0 }
        }
      ],
      transactionCategories: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          code: { type: String, required: true },
          name: { type: String, required: true },
          type: { type: String, enum: ['income', 'expense'], default: 'income' },
          isActive: { type: Boolean, default: true }
        }
      ]
    },

    // ===== BİLDİRİM AYARLARI =====
    notifications: {
      emailNotifications: {
        enabled: { type: Boolean, default: true },
        sendReservationConfirmation: { type: Boolean, default: true },
        sendCheckInReminder: { type: Boolean, default: true },
        checkInReminderDays: { type: Number, default: 1 },
        sendCheckOutReminder: { type: Boolean, default: true },
        sendInvoiceEmail: { type: Boolean, default: true }
      },
      smsNotifications: {
        enabled: { type: Boolean, default: false },
        sendReservationConfirmation: { type: Boolean, default: false },
        sendCheckInReminder: { type: Boolean, default: false }
      },
      internalNotifications: {
        notifyVipArrival: { type: Boolean, default: true },
        notifyHighBalance: { type: Boolean, default: true },
        highBalanceThreshold: { type: Number, default: 5000 },
        notifyNoShow: { type: Boolean, default: true }
      }
    },

    // ===== REZERVASYON AYARLARI =====
    reservations: {
      minimumStay: {
        type: Number,
        min: 1,
        default: 1
      },
      maximumStay: {
        type: Number,
        min: 1,
        default: 30
      },
      advanceBookingDays: {
        type: Number,
        min: 0,
        default: 365
      },
      allowSameDayBooking: {
        type: Boolean,
        default: true
      },
      requireConfirmation: {
        type: Boolean,
        default: false
      },
      autoCancelHours: {
        type: Number,
        default: 24
      },
      bookingSources: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          code: { type: String, required: true },
          name: { type: String, required: true },
          isActive: { type: Boolean, default: true },
          commission: { type: Number, default: 0 }
        }
      ],
      cancellationReasons: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          code: { type: String, required: true },
          name: { type: String, required: true },
          isActive: { type: Boolean, default: true }
        }
      ]
    },

    // ===== MİSAFİR AYARLARI =====
    guests: {
      requireIdentification: {
        type: Boolean,
        default: true
      },
      requireEmail: {
        type: Boolean,
        default: false
      },
      requirePhone: {
        type: Boolean,
        default: true
      },
      requireAddress: {
        type: Boolean,
        default: false
      },
      vipLevels: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          code: { type: String, required: true },
          name: { type: String, required: true },
          color: { type: String, default: '#gold' },
          benefits: { type: String },
          order: { type: Number, default: 0 }
        }
      ],
      autoVipAssignment: {
        enabled: { type: Boolean, default: true },
        silverAfterStays: { type: Number, default: 3 },
        goldAfterStays: { type: Number, default: 5 },
        platinumAfterStays: { type: Number, default: 10 }
      }
    },

    // ===== DÖVİZ KURU AYARLARI =====
    exchange: {
      mode: {
        type: String,
        enum: ['tcmb', 'manual'],
        default: 'tcmb'
      },
      manualRates: {
        type: Map,
        of: Number,
        default: new Map()
      }
    },

    // ===== KBS (KİMLİK BİLDİRİM SİSTEMİ) AYARLARI =====
    kbs: {
      enabled: {
        type: Boolean,
        default: false
      },
      type: {
        type: String,
        enum: ['egm', 'jandarma'],
        default: 'egm'
      },
      facilityCode: {
        type: String,
        trim: true,
        default: ''
      },
      username: {
        type: String,
        trim: true,
        default: ''
      },
      password: {
        type: String,
        default: ''
      },
      personnelIdNumber: {
        type: String,
        trim: true,
        default: ''
      },
      endpoints: {
        egmWsdl: {
          type: String,
          default: 'https://kbs.egm.gov.tr/kbstesis/services/KbsTesisService?wsdl'
        },
        jandarmaWsdl: {
          type: String,
          default: 'https://kbs.jandarma.gov.tr/KBS_Tesis_2/services/KBS?wsdl'
        }
      },
      autoSend: {
        enabled: { type: Boolean, default: false },
        delayMinutes: { type: Number, default: 5 },
        pauseAtNight: { type: Boolean, default: true },
        nightStartHour: { type: Number, default: 23 },
        nightEndHour: { type: Number, default: 7 }
      },
      lastConnection: {
        status: { type: String, enum: ['success', 'error', 'never'], default: 'never' },
        timestamp: { type: Date },
        message: { type: String }
      },
      serverIp: {
        type: String,
        trim: true,
        default: ''
      }
    }
  },
  {
    timestamps: true
  }
)

// Unique index: Her otel için tek settings
settingsSchema.index({ hotel: 1 }, { unique: true })

// Statics
settingsSchema.statics.findByHotel = function (hotelId) {
  return this.findOne({ hotel: hotelId })
}

settingsSchema.statics.getOrCreate = async function (hotelId) {
  let settings = await this.findOne({ hotel: hotelId })

  if (!settings) {
    settings = await this.create({
      hotel: hotelId,
      cashier: {
        activeCurrencies: ['TRY'],
        paymentMethods: [
          { code: 'cash', name: 'Nakit', isActive: true, isCash: true, order: 0 },
          { code: 'credit_card', name: 'Kredi Kartı', isActive: true, isCash: false, order: 1 },
          { code: 'debit_card', name: 'Banka Kartı', isActive: true, isCash: false, order: 2 },
          {
            code: 'bank_transfer',
            name: 'Havale/EFT',
            isActive: true,
            isCash: false,
            requireReference: true,
            order: 3
          }
        ],
        transactionCategories: [
          { code: 'accommodation', name: 'Konaklama', type: 'income' },
          { code: 'food_beverage', name: 'Yiyecek & İçecek', type: 'income' },
          { code: 'minibar', name: 'Minibar', type: 'income' },
          { code: 'spa', name: 'Spa & Wellness', type: 'income' },
          { code: 'laundry', name: 'Çamaşırhane', type: 'income' },
          { code: 'parking', name: 'Otopark', type: 'income' },
          { code: 'other', name: 'Diğer', type: 'income' },
          { code: 'refund', name: 'İade', type: 'expense' },
          { code: 'discount', name: 'İndirim', type: 'expense' }
        ]
      },
      taxes: {
        taxTypes: [
          { name: 'KDV', code: 'KDV', rate: 10, isActive: true, applyTo: 'all' },
          {
            name: 'Konaklama Vergisi',
            code: 'KV',
            rate: 2,
            isActive: true,
            applyTo: 'accommodation'
          }
        ]
      },
      housekeeping: {
        cleaningStatuses: [
          { code: 'clean', name: 'Temiz', color: '#22c55e', order: 0 },
          { code: 'dirty', name: 'Kirli', color: '#ef4444', order: 1 },
          { code: 'inspected', name: 'Kontrol Edildi', color: '#3b82f6', order: 2 },
          { code: 'in_progress', name: 'Temizleniyor', color: '#f59e0b', order: 3 },
          { code: 'out_of_order', name: 'Arızalı', color: '#6b7280', order: 4 }
        ],
        taskTypes: [
          { code: 'standard', name: 'Standart Temizlik', estimatedMinutes: 30 },
          { code: 'checkout', name: 'Check-out Temizliği', estimatedMinutes: 45 },
          { code: 'deep', name: 'Derin Temizlik', estimatedMinutes: 60 },
          { code: 'turndown', name: 'Akşam Servisi', estimatedMinutes: 15 }
        ]
      },
      guests: {
        vipLevels: [
          { code: 'silver', name: 'Silver', color: '#9ca3af', order: 0 },
          { code: 'gold', name: 'Gold', color: '#f59e0b', order: 1 },
          { code: 'platinum', name: 'Platinum', color: '#8b5cf6', order: 2 }
        ]
      },
      reservations: {
        bookingSources: [
          { code: 'direct', name: 'Direkt', commission: 0 },
          { code: 'phone', name: 'Telefon', commission: 0 },
          { code: 'walk_in', name: 'Walk-in', commission: 0 },
          { code: 'website', name: 'Website', commission: 0 },
          { code: 'booking_com', name: 'Booking.com', commission: 15 },
          { code: 'expedia', name: 'Expedia', commission: 18 },
          { code: 'agency', name: 'Acente', commission: 10 }
        ],
        cancellationReasons: [
          { code: 'guest_request', name: 'Misafir Talebi' },
          { code: 'no_show', name: 'No-Show' },
          { code: 'overbooking', name: 'Overbooking' },
          { code: 'payment_issue', name: 'Ödeme Sorunu' },
          { code: 'force_majeure', name: 'Mücbir Sebep' },
          { code: 'other', name: 'Diğer' }
        ]
      }
    })
  }

  return settings
}

// Fatura numarası üret
settingsSchema.methods.generateInvoiceNumber = async function () {
  const year = new Date().getFullYear()
  this.invoicing.lastInvoiceNumber += 1
  await this.save()

  const number = this.invoicing.lastInvoiceNumber.toString().padStart(6, '0')
  const prefix = this.invoicing.invoicePrefix || 'INV'

  if (this.invoicing.invoiceYearSuffix) {
    return `${prefix}-${year}-${number}`
  }
  return `${prefix}-${number}`
}

// Fiş numarası üret
settingsSchema.methods.generateReceiptNumber = async function () {
  this.cashier.lastReceiptNumber += 1
  await this.save()

  const number = this.cashier.lastReceiptNumber.toString().padStart(8, '0')
  const prefix = this.cashier.receiptPrefix || 'RCP'

  return `${prefix}${number}`
}

export default mongoose.model('PmsSettings', settingsSchema)
