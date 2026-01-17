import mongoose from 'mongoose'

const notificationLogSchema = new mongoose.Schema(
  {
    // Notification type
    type: {
      type: String,
      required: true,
      enum: [
        'booking_confirmation',
        'booking_cancelled',
        'booking_modified',
        'payment_reminder',
        'payment_received',
        'payment_link',
        'checkin_reminder',
        'welcome',
        'password_reset',
        '2fa_setup',
        'partner_approved',
        'agency_created',
        'custom'
      ],
      index: true
    },

    // Recipient
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },

    recipientEmail: {
      type: String,
      lowercase: true
    },

    recipientPhone: {
      type: String
    },

    // Partner (for multi-tenant filtering)
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      index: true
    },

    // Related entity
    relatedTo: {
      model: {
        type: String,
        enum: ['Booking', 'User', 'Partner', 'Agency', 'PaymentLink', null]
      },
      id: {
        type: mongoose.Schema.Types.ObjectId
      }
    },

    // Channels and their results
    channels: {
      email: {
        attempted: { type: Boolean, default: false },
        success: { type: Boolean },
        messageId: { type: String },
        error: { type: String },
        sentAt: { type: Date },
        source: { type: String, enum: ['platform-db', 'partner', 'env'] }
      },
      sms: {
        attempted: { type: Boolean, default: false },
        success: { type: Boolean },
        messageId: { type: String },
        error: { type: String },
        sentAt: { type: Date }
      },
      push: {
        attempted: { type: Boolean, default: false },
        success: { type: Boolean },
        sent: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        sentAt: { type: Date }
      }
    },

    // Subject/Title for email/push
    subject: {
      type: String
    },

    // Template data (for debugging/replay)
    templateData: {
      type: mongoose.Schema.Types.Mixed
    },

    // Overall status
    status: {
      type: String,
      enum: ['pending', 'partial', 'success', 'failed'],
      default: 'pending',
      index: true
    },

    // Retry information
    retryCount: {
      type: Number,
      default: 0
    },

    lastRetryAt: {
      type: Date
    },

    // IP and user agent for audit
    requestMeta: {
      ip: String,
      userAgent: String,
      triggeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  {
    timestamps: true,
    collection: 'notification_logs'
  }
)

// Indexes for common queries
notificationLogSchema.index({ createdAt: -1 })
notificationLogSchema.index({ type: 1, partner: 1, createdAt: -1 })
notificationLogSchema.index({ recipient: 1, createdAt: -1 })
notificationLogSchema.index({ status: 1, createdAt: -1 })

// Calculate overall status before save
notificationLogSchema.pre('save', function (next) {
  const channels = this.channels

  const attempted = []
  const succeeded = []

  if (channels.email?.attempted) {
    attempted.push('email')
    if (channels.email.success) succeeded.push('email')
  }
  if (channels.sms?.attempted) {
    attempted.push('sms')
    if (channels.sms.success) succeeded.push('sms')
  }
  if (channels.push?.attempted) {
    attempted.push('push')
    if (channels.push.success) succeeded.push('push')
  }

  if (attempted.length === 0) {
    this.status = 'pending'
  } else if (succeeded.length === attempted.length) {
    this.status = 'success'
  } else if (succeeded.length === 0) {
    this.status = 'failed'
  } else {
    this.status = 'partial'
  }

  next()
})

// Static method to find by partner with pagination
notificationLogSchema.statics.findByPartner = function (partnerId, options = {}) {
  const { page = 1, limit = 20, type, status, startDate, endDate } = options

  const query = { partner: partnerId }

  if (type) query.type = type
  if (status) query.status = status
  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = new Date(startDate)
    if (endDate) query.createdAt.$lte = new Date(endDate)
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('recipient', 'name email')
}

// Static method to get stats
notificationLogSchema.statics.getStats = async function (partnerId, period = 'week') {
  const now = new Date()
  let startDate

  switch (period) {
    case 'day':
      startDate = new Date(now - 24 * 60 * 60 * 1000)
      break
    case 'week':
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000)
  }

  const match = { createdAt: { $gte: startDate } }
  if (partnerId) match.partner = new mongoose.Types.ObjectId(partnerId)

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
        partial: { $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        emailSent: { $sum: { $cond: ['$channels.email.success', 1, 0] } },
        smsSent: { $sum: { $cond: ['$channels.sms.success', 1, 0] } },
        pushSent: { $sum: '$channels.push.sent' }
      }
    }
  ])

  const byType = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } }
      }
    },
    { $sort: { count: -1 } }
  ])

  return {
    period,
    startDate,
    summary: stats[0] || {
      total: 0,
      success: 0,
      partial: 0,
      failed: 0,
      emailSent: 0,
      smsSent: 0,
      pushSent: 0
    },
    byType
  }
}

export default mongoose.model('NotificationLog', notificationLogSchema)
