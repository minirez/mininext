import mongoose from 'mongoose'

const tursabAgencySchema = new mongoose.Schema(
  {
    acenteId: {
      type: Number,
      required: true
    },
    subeId: {
      type: Number
    },
    belgeNo: {
      type: String,
      trim: true
    },
    unvan: {
      type: String,
      required: true,
      trim: true
    },
    ticariUnvan: {
      type: String,
      trim: true
    },
    grup: {
      type: String,
      enum: ['A', 'B', 'C']
    },
    il: {
      type: String,
      trim: true
    },
    ilce: {
      type: String,
      trim: true
    },
    telefon: {
      type: String,
      trim: true
    },
    telefon2: {
      type: String,
      trim: true
    },
    telefon3: {
      type: String,
      trim: true
    },
    faks: {
      type: String,
      trim: true
    },
    adres: {
      type: String,
      trim: true
    },
    eposta: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
)

// Indexes
tursabAgencySchema.index({ acenteId: 1, subeId: 1 }, { unique: true })
tursabAgencySchema.index({ il: 1 })
tursabAgencySchema.index({ grup: 1 })
tursabAgencySchema.index({ unvan: 'text', ticariUnvan: 'text' })

export default mongoose.model('TursabAgency', tursabAgencySchema)
