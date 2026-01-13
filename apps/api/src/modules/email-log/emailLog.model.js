import mongoose from 'mongoose'

const emailLogSchema = new mongoose.Schema(
  {
    // Email details
    to: {
      type: String,
      required: true,
      index: true
    },
    subject: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: [
        'activation',
        'password-reset',
        'welcome',
        'booking-confirmation',
        'booking-cancelled',
        'booking-modified',
        '2fa-setup',
        'night-audit',
        'payment-reminder',
        'checkin-reminder',
        'other'
      ],
      default: 'other',
      index: true
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'bounced', 'complained'],
      default: 'pending',
      index: true
    },

    // AWS SES response
    messageId: String,
    source: {
      type: String,
      enum: ['platform-db', 'partner', 'env', 'dev-mode'],
      default: 'platform-db'
    },

    // Error details
    error: {
      message: String,
      code: String,
      stack: String
    },

    // Context
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedModel'
    },
    relatedModel: {
      type: String,
      enum: ['Booking', 'User', 'Partner', 'Agency', null]
    },

    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },

    // Timestamps
    sentAt: Date,
    failedAt: Date
  },
  {
    timestamps: true
  }
)

// Indexes for common queries
emailLogSchema.index({ createdAt: -1 })
emailLogSchema.index({ status: 1, createdAt: -1 })
emailLogSchema.index({ to: 1, createdAt: -1 })
emailLogSchema.index({ partnerId: 1, createdAt: -1 })

// Static method to create log entry
emailLogSchema.statics.createLog = async function (data) {
  return this.create(data)
}

// Static method to mark as sent
emailLogSchema.statics.markSent = async function (id, messageId, source) {
  return this.findByIdAndUpdate(
    id,
    {
      status: 'sent',
      messageId,
      source,
      sentAt: new Date()
    },
    { new: true }
  )
}

// Static method to mark as failed
emailLogSchema.statics.markFailed = async function (id, error) {
  return this.findByIdAndUpdate(
    id,
    {
      status: 'failed',
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      failedAt: new Date()
    },
    { new: true }
  )
}

// Static method to get stats
emailLogSchema.statics.getStats = async function (filter = {}) {
  const match = { ...filter }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ])

  return stats.reduce((acc, item) => {
    acc[item._id] = item.count
    return acc
  }, {})
}

export default mongoose.model('EmailLog', emailLogSchema)
