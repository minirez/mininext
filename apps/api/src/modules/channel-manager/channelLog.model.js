import mongoose from 'mongoose'

const MAX_PAYLOAD_LENGTH = 10240 // 10KB

const channelLogSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
      index: true
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true
    },
    channelConnection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChannelConnection',
      index: true
    },
    type: {
      type: String,
      enum: [
        'reservation_fetch',
        'reservation_confirm',
        'inventory_update',
        'product_sync',
        'ota_sync',
        'error_report',
        'connection_test'
      ],
      required: true,
      index: true
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true
    },
    status: {
      type: String,
      enum: ['success', 'error', 'partial'],
      required: true
    },
    request: { type: String },
    response: { type: String },
    errorMessage: { type: String },
    metadata: {
      reservationCount: { type: Number },
      affectedDates: { from: Date, to: Date },
      rqid: { type: String },
      duration: { type: Number } // ms
    }
  },
  {
    timestamps: true
  }
)

// TTL index: 90 days auto-delete
channelLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

// Compound index for efficient queries
channelLogSchema.index({ hotel: 1, type: 1, createdAt: -1 })

// Static: truncate payload to prevent large documents
channelLogSchema.statics.truncate = function (text) {
  if (!text) return null
  if (typeof text !== 'string') text = JSON.stringify(text)
  return text.length > MAX_PAYLOAD_LENGTH
    ? text.substring(0, MAX_PAYLOAD_LENGTH) + '...[truncated]'
    : text
}

// Static: create log entry
channelLogSchema.statics.log = async function ({
  connection,
  type,
  direction,
  status,
  request,
  response,
  errorMessage,
  metadata
}) {
  return this.create({
    partner: connection.partner,
    hotel: connection.hotel,
    channelConnection: connection._id,
    type,
    direction,
    status,
    request: this.truncate(request),
    response: this.truncate(response),
    errorMessage,
    metadata
  })
}

const ChannelLog = mongoose.model('ChannelLog', channelLogSchema)

export default ChannelLog
