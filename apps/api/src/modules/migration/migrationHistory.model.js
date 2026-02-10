import mongoose from 'mongoose'

const hotelResultSchema = new mongoose.Schema(
  {
    legacyHotelId: Number,
    legacyHotelName: String,
    newHotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    status: {
      type: String,
      enum: ['success', 'failed', 'skipped', 'superseded'],
      default: 'success'
    },
    roomTypes: {
      total: { type: Number, default: 0 },
      migrated: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    },
    mealPlans: {
      total: { type: Number, default: 0 },
      migrated: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    },
    markets: {
      total: { type: Number, default: 0 },
      migrated: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    },
    photos: {
      total: { type: Number, default: 0 },
      downloaded: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    },
    errors: [String],
    duration: Number // ms
  },
  { _id: false }
)

const migrationHistorySchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
      index: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    legacyAccountId: Number,
    legacyAccountName: String,
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'failed', 'partial'],
      default: 'in_progress'
    },
    hotels: [hotelResultSchema],
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    summary: {
      totalHotels: { type: Number, default: 0 },
      migratedHotels: { type: Number, default: 0 },
      failedHotels: { type: Number, default: 0 },
      totalPhotos: { type: Number, default: 0 },
      downloadedPhotos: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
)

migrationHistorySchema.index({ legacyAccountId: 1 })
migrationHistorySchema.index({ createdAt: -1 })

export default mongoose.model('MigrationHistory', migrationHistorySchema)
