import mongoose from 'mongoose'
import { customAlphabet } from 'nanoid'

// 6 karakterlik kısa kod üretici (URL-safe karakterler)
const generateCode = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6)

/**
 * ShortUrl Model
 * URL kısaltma servisi için
 */
const shortUrlSchema = new mongoose.Schema(
  {
    // Kısa kod (ör: sxx34a)
    code: {
      type: String,
      unique: true,
      index: true,
      required: true
    },

    // Orijinal URL
    originalUrl: {
      type: String,
      required: true
    },

    // İlişkili kaynak tipi
    type: {
      type: String,
      enum: ['payment_link', 'booking', 'other'],
      default: 'other',
      index: true
    },

    // İlişkili kaynak ID'si
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },

    // Partner (opsiyonel)
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      index: true
    },

    // İstatistikler
    clicks: {
      type: Number,
      default: 0
    },
    lastClickedAt: {
      type: Date
    },

    // Süre sınırı (opsiyonel)
    expiresAt: {
      type: Date,
      index: true
    },

    // Aktiflik durumu
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

// Indexes
shortUrlSchema.index({ type: 1, relatedId: 1 })
shortUrlSchema.index({ createdAt: -1 })

// Virtuals
shortUrlSchema.virtual('shortUrl').get(function () {
  const isDev = process.env.NODE_ENV === 'development'
  const baseUrl = isDev ? 'https://link.mini.com' : 'https://link.minires.com'
  return `${baseUrl}/${this.code}`
})

// Static: Yeni kısa URL oluştur
shortUrlSchema.statics.createShortUrl = async function (data) {
  const { originalUrl, type, relatedId, partner, expiresAt } = data

  // Aynı kaynak için mevcut kısa URL var mı kontrol et
  if (relatedId) {
    const existing = await this.findOne({ type, relatedId, isActive: true })
    if (existing) {
      return existing
    }
  }

  // Benzersiz kod üret
  let code
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    code = generateCode()
    const exists = await this.findOne({ code })
    if (!exists) break
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error('Kısa URL kodu üretilemedi')
  }

  return this.create({
    code,
    originalUrl,
    type: type || 'other',
    relatedId,
    partner,
    expiresAt
  })
}

// Static: Kodu çözümle ve yönlendir
shortUrlSchema.statics.resolve = async function (code) {
  const shortUrl = await this.findOne({ code, isActive: true })

  if (!shortUrl) {
    return null
  }

  // Süresi dolmuş mu kontrol et
  if (shortUrl.expiresAt && shortUrl.expiresAt < new Date()) {
    return null
  }

  // Tıklama sayısını artır
  shortUrl.clicks += 1
  shortUrl.lastClickedAt = new Date()
  await shortUrl.save()

  return shortUrl
}

// Static: İlişkili kaydın kısa URL'ini getir
shortUrlSchema.statics.getByRelated = function (type, relatedId) {
  return this.findOne({ type, relatedId, isActive: true })
}

export default mongoose.model('ShortUrl', shortUrlSchema)
