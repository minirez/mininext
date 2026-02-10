import mongoose from 'mongoose'

const pendingSyncSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true
    },
    connection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChannelConnection',
      required: true
    },
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    mealPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    date: {
      type: Date,
      required: true
    },
    syncFields: [
      {
        type: String,
        enum: ['availability', 'rates', 'restrictions']
      }
    ],
    status: {
      type: String,
      enum: ['pending', 'processing', 'failed'],
      default: 'pending'
    },
    priority: {
      type: Number,
      default: 0
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    lastError: {
      type: String,
      default: null
    },
    scheduledAfter: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
)

// Dedup index: same connection+roomType+date should merge when pending
pendingSyncSchema.index({ connection: 1, roomTypeId: 1, date: 1, status: 1 })

// Query index: processor finds pending items efficiently
pendingSyncSchema.index({ status: 1, scheduledAfter: 1, priority: -1 })

// TTL: auto-delete failed records after 7 days
pendingSyncSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60, partialFilterExpression: { status: 'failed' } }
)

const PendingSync = mongoose.model('PendingSync', pendingSyncSchema)

export default PendingSync
