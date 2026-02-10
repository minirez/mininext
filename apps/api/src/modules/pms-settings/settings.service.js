import { asyncHandler } from '#helpers'
import PmsSettings from './settings.model.js'
import Hotel from '#modules/hotel/hotel.model.js'

/**
 * PMS Settings Service
 * Otel bazlı PMS ayarlarını yönetir
 */

// ==========================================
// GET SETTINGS
// ==========================================

/**
 * Otel ayarlarını getir (yoksa oluştur)
 */
export const getSettings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)

  res.json({
    success: true,
    data: settings
  })
})

// ==========================================
// UPDATE SETTINGS (Bölüm bazlı)
// ==========================================

/**
 * Genel ayarları güncelle
 */
export const updateGeneralSettings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { general } = req.body

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)

  if (general) {
    settings.general = { ...settings.general, ...general }
  }

  await settings.save()

  res.json({
    success: true,
    data: settings.general,
    message: 'Genel ayarlar güncellendi'
  })
})

/**
 * Resepsiyon ayarlarını güncelle
 */
export const updateFrontDeskSettings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { frontDesk } = req.body

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)

  if (frontDesk) {
    settings.frontDesk = { ...settings.frontDesk, ...frontDesk }
  }

  await settings.save()

  res.json({
    success: true,
    data: settings.frontDesk,
    message: 'Resepsiyon ayarları güncellendi'
  })
})

/**
 * Vergi ayarlarını güncelle
 */
export const updateTaxSettings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { taxes } = req.body

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)

  if (taxes) {
    if (taxes.taxTypes) {
      settings.taxes.taxTypes = taxes.taxTypes
    }
    if (taxes.pricesIncludeTax !== undefined) {
      settings.taxes.pricesIncludeTax = taxes.pricesIncludeTax
    }
    if (taxes.accommodationTaxRate !== undefined) {
      settings.taxes.accommodationTaxRate = taxes.accommodationTaxRate
    }
    if (taxes.foodBeverageTaxRate !== undefined) {
      settings.taxes.foodBeverageTaxRate = taxes.foodBeverageTaxRate
    }
  }

  await settings.save()

  res.json({
    success: true,
    data: settings.taxes,
    message: 'Vergi ayarları güncellendi'
  })
})

/**
 * Fatura ayarlarını güncelle
 */
export const updateInvoicingSettings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { invoicing } = req.body

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)

  if (invoicing) {
    if (invoicing.companyInfo) {
      settings.invoicing.companyInfo = {
        ...settings.invoicing.companyInfo,
        ...invoicing.companyInfo
      }
    }
    const { companyInfo, ...rest } = invoicing
    Object.assign(settings.invoicing, rest)
  }

  await settings.save()

  res.json({
    success: true,
    data: settings.invoicing,
    message: 'Fatura ayarları güncellendi'
  })
})

/**
 * Kat hizmetleri ayarlarını güncelle
 */
export const updateHousekeepingSettings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { housekeeping } = req.body

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)

  if (housekeeping) {
    if (housekeeping.cleaningStatuses) {
      settings.housekeeping.cleaningStatuses = housekeeping.cleaningStatuses
    }
    if (housekeeping.taskTypes) {
      settings.housekeeping.taskTypes = housekeeping.taskTypes
    }
    const { cleaningStatuses, taskTypes, ...rest } = housekeeping
    Object.assign(settings.housekeeping, rest)
  }

  await settings.save()

  res.json({
    success: true,
    data: settings.housekeeping,
    message: 'Kat hizmetleri ayarları güncellendi'
  })
})

/**
 * Kasa/POS ayarlarını güncelle
 */
export const updateCashierSettings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { cashier } = req.body

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)

  if (cashier) {
    if (cashier.paymentMethods) {
      settings.cashier.paymentMethods = cashier.paymentMethods
    }
    if (cashier.transactionCategories) {
      settings.cashier.transactionCategories = cashier.transactionCategories
    }
    const { paymentMethods, transactionCategories, ...rest } = cashier
    Object.assign(settings.cashier, rest)
  }

  await settings.save()

  res.json({
    success: true,
    data: settings.cashier,
    message: 'Kasa ayarları güncellendi'
  })
})

/**
 * Bildirim ayarlarını güncelle
 */
export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { notifications } = req.body

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)

  if (notifications) {
    if (notifications.emailNotifications) {
      settings.notifications.emailNotifications = {
        ...settings.notifications.emailNotifications,
        ...notifications.emailNotifications
      }
    }
    if (notifications.smsNotifications) {
      settings.notifications.smsNotifications = {
        ...settings.notifications.smsNotifications,
        ...notifications.smsNotifications
      }
    }
    if (notifications.internalNotifications) {
      settings.notifications.internalNotifications = {
        ...settings.notifications.internalNotifications,
        ...notifications.internalNotifications
      }
    }
  }

  await settings.save()

  res.json({
    success: true,
    data: settings.notifications,
    message: 'Bildirim ayarları güncellendi'
  })
})

/**
 * Rezervasyon ayarlarını güncelle
 */
export const updateReservationSettings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { reservations } = req.body

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)

  if (reservations) {
    if (reservations.bookingSources) {
      settings.reservations.bookingSources = reservations.bookingSources
    }
    if (reservations.cancellationReasons) {
      settings.reservations.cancellationReasons = reservations.cancellationReasons
    }
    const { bookingSources, cancellationReasons, ...rest } = reservations
    Object.assign(settings.reservations, rest)
  }

  await settings.save()

  res.json({
    success: true,
    data: settings.reservations,
    message: 'Rezervasyon ayarları güncellendi'
  })
})

/**
 * Misafir ayarlarını güncelle
 */
export const updateGuestSettings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { guests } = req.body

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)

  if (guests) {
    if (guests.vipLevels) {
      settings.guests.vipLevels = guests.vipLevels
    }
    if (guests.autoVipAssignment) {
      settings.guests.autoVipAssignment = {
        ...settings.guests.autoVipAssignment,
        ...guests.autoVipAssignment
      }
    }
    const { vipLevels, autoVipAssignment, ...rest } = guests
    Object.assign(settings.guests, rest)
  }

  await settings.save()

  res.json({
    success: true,
    data: settings.guests,
    message: 'Misafir ayarları güncellendi'
  })
})

/**
 * Döviz kuru ayarlarını güncelle
 */
export const updateExchangeSettings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { exchange } = req.body

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)

  if (exchange) {
    if (exchange.mode) {
      settings.exchange.mode = exchange.mode
    }
    if (exchange.manualRates) {
      // Map olarak kaydet
      for (const [currency, rate] of Object.entries(exchange.manualRates)) {
        if (rate !== null && rate !== undefined && rate > 0) {
          settings.exchange.manualRates.set(currency, rate)
        } else {
          settings.exchange.manualRates.delete(currency)
        }
      }
    }
  }

  await settings.save()

  res.json({
    success: true,
    data: {
      mode: settings.exchange.mode,
      manualRates: Object.fromEntries(settings.exchange.manualRates)
    },
    message: 'Döviz kuru ayarları güncellendi'
  })
})

/**
 * KBS ayarlarını güncelle
 */
export const updateKbsSettings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { kbs } = req.body

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)

  if (kbs) {
    if (kbs.enabled !== undefined) settings.kbs.enabled = kbs.enabled
    if (kbs.type) settings.kbs.type = kbs.type
    if (kbs.facilityCode) settings.kbs.facilityCode = kbs.facilityCode
    if (kbs.username) settings.kbs.username = kbs.username
    if (kbs.password) settings.kbs.password = kbs.password
    if (kbs.personnelIdNumber) settings.kbs.personnelIdNumber = kbs.personnelIdNumber
    if (kbs.serverIp) settings.kbs.serverIp = kbs.serverIp

    if (kbs.endpoints) {
      settings.kbs.endpoints = {
        ...settings.kbs.endpoints,
        ...kbs.endpoints
      }
    }

    if (kbs.autoSend) {
      settings.kbs.autoSend = {
        ...settings.kbs.autoSend,
        ...kbs.autoSend
      }
    }
  }

  await settings.save()

  // Şifreyi response'da gönderme (güvenlik)
  const responseData = settings.kbs.toObject()
  if (responseData.password) {
    responseData.password = '********'
  }

  res.json({
    success: true,
    data: responseData,
    message: 'KBS ayarları güncellendi'
  })
})

// ==========================================
// FULL UPDATE
// ==========================================

/**
 * Tüm ayarları güncelle
 */
export const updateAllSettings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const updates = req.body

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)

  if (updates.general) {
    settings.general = { ...settings.general, ...updates.general }
  }
  if (updates.frontDesk) {
    settings.frontDesk = { ...settings.frontDesk, ...updates.frontDesk }
  }
  if (updates.taxes) {
    Object.assign(settings.taxes, updates.taxes)
  }
  if (updates.invoicing) {
    if (updates.invoicing.companyInfo) {
      settings.invoicing.companyInfo = {
        ...settings.invoicing.companyInfo,
        ...updates.invoicing.companyInfo
      }
    }
    const { companyInfo, ...rest } = updates.invoicing
    Object.assign(settings.invoicing, rest)
  }
  if (updates.housekeeping) {
    Object.assign(settings.housekeeping, updates.housekeeping)
  }
  if (updates.cashier) {
    Object.assign(settings.cashier, updates.cashier)
  }
  if (updates.notifications) {
    if (updates.notifications.emailNotifications) {
      settings.notifications.emailNotifications = {
        ...settings.notifications.emailNotifications,
        ...updates.notifications.emailNotifications
      }
    }
    if (updates.notifications.smsNotifications) {
      settings.notifications.smsNotifications = {
        ...settings.notifications.smsNotifications,
        ...updates.notifications.smsNotifications
      }
    }
    if (updates.notifications.internalNotifications) {
      settings.notifications.internalNotifications = {
        ...settings.notifications.internalNotifications,
        ...updates.notifications.internalNotifications
      }
    }
  }
  if (updates.reservations) {
    Object.assign(settings.reservations, updates.reservations)
  }
  if (updates.guests) {
    if (updates.guests.autoVipAssignment) {
      settings.guests.autoVipAssignment = {
        ...settings.guests.autoVipAssignment,
        ...updates.guests.autoVipAssignment
      }
    }
    const { autoVipAssignment, ...rest } = updates.guests
    Object.assign(settings.guests, rest)
  }
  if (updates.exchange) {
    if (updates.exchange.mode) {
      settings.exchange.mode = updates.exchange.mode
    }
    if (updates.exchange.manualRates) {
      for (const [currency, rate] of Object.entries(updates.exchange.manualRates)) {
        if (rate !== null && rate !== undefined && rate > 0) {
          settings.exchange.manualRates.set(currency, rate)
        } else {
          settings.exchange.manualRates.delete(currency)
        }
      }
    }
  }

  await settings.save()

  res.json({
    success: true,
    data: settings,
    message: 'Ayarlar güncellendi'
  })
})

// ==========================================
// RESET SETTINGS
// ==========================================

/**
 * Ayarları varsayılana sıfırla
 */
export const resetSettings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { section } = req.body

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  if (!section || section === 'all') {
    await PmsSettings.deleteOne({ hotel: hotelId })
    const settings = await PmsSettings.getOrCreate(hotelId)

    return res.json({
      success: true,
      data: settings,
      message: 'Tüm ayarlar varsayılana sıfırlandı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)

  const defaults = {
    general: {
      timezone: 'Europe/Istanbul',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      language: 'tr',
      currency: 'TRY'
    },
    frontDesk: {
      defaultCheckInTime: '14:00',
      defaultCheckOutTime: '12:00',
      allowEarlyCheckIn: true,
      allowLateCheckOut: true,
      earlyCheckInFee: 0,
      lateCheckOutFee: 0,
      defaultPaymentMethod: 'cash',
      requireDepositForWalkIn: true,
      minimumDepositPercent: 50,
      requireZeroBalanceCheckOut: true
    }
  }

  if (defaults[section]) {
    settings[section] = defaults[section]
    await settings.save()
  }

  res.json({
    success: true,
    data: settings[section],
    message: `${section} ayarları varsayılana sıfırlandı`
  })
})

// ==========================================
// UTILITY ENDPOINTS
// ==========================================

/**
 * Fatura numarası al
 */
export const getNextInvoiceNumber = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)
  const nextNumber = await settings.generateInvoiceNumber()

  res.json({
    success: true,
    data: { invoiceNumber: nextNumber }
  })
})

/**
 * Fiş numarası al
 */
export const getNextReceiptNumber = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Otel bulunamadı'
    })
  }

  const settings = await PmsSettings.getOrCreate(hotelId)
  const nextNumber = await settings.generateReceiptNumber()

  res.json({
    success: true,
    data: { receiptNumber: nextNumber }
  })
})

/**
 * Desteklenen zaman dilimleri listesi
 */
export const getTimezones = asyncHandler(async (req, res) => {
  const timezones = [
    { value: 'Europe/Istanbul', label: 'Türkiye (UTC+3)' },
    { value: 'Europe/London', label: 'Londra (UTC+0/+1)' },
    { value: 'Europe/Paris', label: 'Paris (UTC+1/+2)' },
    { value: 'Europe/Berlin', label: 'Berlin (UTC+1/+2)' },
    { value: 'Europe/Moscow', label: 'Moskova (UTC+3)' },
    { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
    { value: 'Asia/Bangkok', label: 'Bangkok (UTC+7)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
    { value: 'America/New_York', label: 'New York (UTC-5/-4)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8/-7)' }
  ]

  res.json({
    success: true,
    data: timezones
  })
})

/**
 * Desteklenen para birimleri listesi
 */
export const getCurrencies = asyncHandler(async (req, res) => {
  const currencies = [
    { value: 'TRY', label: 'Türk Lirası (₺)', symbol: '₺' },
    { value: 'USD', label: 'Amerikan Doları ($)', symbol: '$' },
    { value: 'EUR', label: 'Euro (€)', symbol: '€' },
    { value: 'GBP', label: 'İngiliz Sterlini (£)', symbol: '£' }
  ]

  res.json({
    success: true,
    data: currencies
  })
})
