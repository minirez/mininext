import mongoose from 'mongoose'

const inboxEmailSchema = new mongoose.Schema(
  {
    // SES message ID
    messageId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },

    // Sender
    from: {
      address: { type: String, required: true },
      name: String
    },

    // Recipients
    to: [String],
    cc: [String],

    // Content
    subject: {
      type: String,
      index: true,
      default: '(Konu yok)'
    },
    textBody: String,
    htmlBody: String,
    snippet: String, // First 200 chars for list preview

    // Attachments
    attachments: [
      {
        filename: String,
        contentType: String,
        size: Number,
        s3Key: String
      }
    ],

    // Threading
    threadId: {
      type: String,
      index: true
    },
    inReplyTo: String,
    references: [String],

    // Direction
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      default: 'inbound',
      index: true
    },

    // Status
    status: {
      type: String,
      enum: ['unread', 'read', 'replied', 'archived', 'trash'],
      default: 'unread',
      index: true
    },
    isStarred: {
      type: Boolean,
      default: false
    },

    // Trash support
    previousStatus: String,
    deletedAt: Date,

    // SES verdicts (spam, virus, spf, dkim, dmarc)
    verdicts: {
      spam: String,
      virus: String,
      spf: String,
      dkim: String,
      dmarc: String
    },

    // S3 storage
    s3Key: String,

    // Timestamps
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    repliedAt: Date,
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

// Compound indexes for common queries
inboxEmailSchema.index({ status: 1, receivedAt: -1 })
inboxEmailSchema.index({ threadId: 1, receivedAt: 1 })
inboxEmailSchema.index({ 'from.address': 1 })
inboxEmailSchema.index({ isStarred: 1, receivedAt: -1 })
inboxEmailSchema.index({ direction: 1, receivedAt: -1 })
inboxEmailSchema.index({ status: 1, deletedAt: -1 })

// Get unread count
inboxEmailSchema.statics.getUnreadCount = async function () {
  return this.countDocuments({ status: 'unread', direction: 'inbound' })
}

// Get stats
inboxEmailSchema.statics.getStats = async function () {
  const [unread, total, starred, trash, sent] = await Promise.all([
    this.countDocuments({ status: 'unread', direction: 'inbound' }),
    this.countDocuments({ status: { $ne: 'trash' }, direction: 'inbound' }),
    this.countDocuments({ isStarred: true, status: { $ne: 'trash' } }),
    this.countDocuments({ status: 'trash' }),
    this.countDocuments({ direction: 'outbound', status: { $ne: 'trash' } })
  ])
  return { unread, total, starred, trash, sent }
}

// Generate snippet from text/html body
inboxEmailSchema.pre('save', function (next) {
  if (this.isNew && !this.snippet) {
    const text = this.textBody || ''
    this.snippet = text.substring(0, 200).replace(/\s+/g, ' ').trim()
  }
  next()
})

export default mongoose.model('InboxEmail', inboxEmailSchema)
