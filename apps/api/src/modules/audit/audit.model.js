import mongoose from 'mongoose'
import logger from '#core/logger.js'

const auditLogSchema = new mongoose.Schema(
  {
    // Kim yaptı
    actor: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
      email: String,
      name: String,
      role: {
        type: String,
        enum: ['superadmin', 'admin', 'partner', 'user', 'system'],
        default: 'system'
      },
      ip: String,
      userAgent: String
    },

    // Ne zaman
    timestamp: { type: Date, default: Date.now, index: true },

    // Hangi modül
    module: {
      type: String,
      required: true,
      enum: [
        'auth',
        'user',
        'partner',
        'hotel',
        'planning',
        'booking',
        'content',
        'settings',
        'file',
        'system',
        'agency',
        'location',
        'tag',
        'tour'
      ],
      index: true
    },

    // Alt modül (opsiyonel)
    subModule: String, // örn: 'room_type', 'rate_plan', 'contract'

    // Ne yaptı
    action: {
      type: String,
      required: true,
      enum: [
        'create',
        'update',
        'delete',
        'view',
        'login',
        'logout',
        'export',
        'import',
        'approve',
        'reject',
        'activate',
        'deactivate',
        'link',
        'unlink',
        'upload',
        'download'
      ],
      index: true
    },

    // Hedef kayıt
    target: {
      collection: String, // 'hotels', 'partners', 'users'
      documentId: mongoose.Schema.Types.ObjectId,
      documentName: String, // Okunabilir isim (otel adı, kullanıcı adı vb.)
      parentId: mongoose.Schema.Types.ObjectId, // İlişkili üst kayıt
      parentCollection: String
    },

    // Değişiklik detayları
    changes: {
      before: mongoose.Schema.Types.Mixed, // Önceki değerler
      after: mongoose.Schema.Types.Mixed, // Sonraki değerler
      diff: [
        {
          // Değişen alanlar
          field: String,
          from: mongoose.Schema.Types.Mixed,
          to: mongoose.Schema.Types.Mixed
        }
      ]
    },

    // HTTP request bilgileri
    request: {
      method: String, // GET, POST, PUT, DELETE
      path: String, // /api/hotels/123
      query: mongoose.Schema.Types.Mixed,
      statusCode: Number,
      duration: Number // ms
    },

    // Ek bilgi
    metadata: {
      reason: String, // Silme/değişiklik sebebi
      notes: String,
      correlationId: String, // İlişkili işlemler için
      batchId: String // Toplu işlemler için
    },

    // Durum
    status: {
      type: String,
      enum: ['success', 'failure', 'partial'],
      default: 'success'
    },
    errorMessage: String
  },
  {
    timestamps: false,
    collection: 'audit_logs'
  }
)

// Indexes for common queries
auditLogSchema.index({ 'actor.userId': 1, timestamp: -1 })
auditLogSchema.index({ 'actor.partnerId': 1, timestamp: -1 })
auditLogSchema.index({ module: 1, action: 1, timestamp: -1 })
auditLogSchema.index({ 'target.collection': 1, 'target.documentId': 1 })
auditLogSchema.index({ status: 1, timestamp: -1 })

// TTL index - 90 gün sonra otomatik sil (opsiyonel - uncomment to enable)
// auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 })

// Static methods
auditLogSchema.statics.findByActor = function (userId, options = {}) {
  const query = { 'actor.userId': userId }
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0)
}

auditLogSchema.statics.findByPartner = function (partnerId, options = {}) {
  const query = { 'actor.partnerId': partnerId }
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0)
}

auditLogSchema.statics.findByDocument = function (collection, documentId) {
  return this.find({
    'target.collection': collection,
    'target.documentId': documentId
  }).sort({ timestamp: -1 })
}

auditLogSchema.statics.getStats = async function (period = 'day') {
  const now = new Date()
  let startDate

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    default: // day
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  }

  const stats = await this.aggregate([
    { $match: { timestamp: { $gte: startDate } } },
    {
      $group: {
        _id: { module: '$module', action: '$action' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.module',
        actions: {
          $push: { action: '$_id.action', count: '$count' }
        },
        total: { $sum: '$count' }
      }
    },
    { $sort: { total: -1 } }
  ])

  return stats
}

// Helper method to create audit log easily
auditLogSchema.statics.log = async function ({
  actor,
  module,
  subModule,
  action,
  target,
  changes,
  request,
  metadata,
  status = 'success',
  errorMessage
}) {
  try {
    return await this.create({
      actor,
      module,
      subModule,
      action,
      target,
      changes,
      request,
      metadata,
      status,
      errorMessage
    })
  } catch (error) {
    logger.error('Failed to create audit log:', error)
    return null
  }
}

export default mongoose.model('AuditLog', auditLogSchema)
