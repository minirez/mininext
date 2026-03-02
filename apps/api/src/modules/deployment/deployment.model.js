import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema(
  {
    jobId: Number,
    name: String,
    status: {
      type: String,
      enum: ['queued', 'in_progress', 'completed', 'waiting']
    },
    conclusion: {
      type: String,
      enum: ['success', 'failure', 'cancelled', 'skipped', 'timed_out', null]
    },
    startedAt: Date,
    completedAt: Date,
    steps: [
      {
        name: String,
        status: String,
        conclusion: String,
        number: Number
      }
    ]
  },
  { _id: false }
)

const deploymentSchema = new mongoose.Schema(
  {
    runId: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    workflowName: {
      type: String,
      default: 'Deploy to Production'
    },
    status: {
      type: String,
      enum: ['queued', 'in_progress', 'completed'],
      default: 'queued',
      index: true
    },
    conclusion: {
      type: String,
      enum: ['success', 'failure', 'cancelled', 'skipped', 'timed_out', null],
      default: null
    },
    headSha: String,
    headBranch: {
      type: String,
      index: true
    },
    commitMessage: String,
    commitAuthor: String,
    actor: {
      login: String,
      avatarUrl: String
    },
    startedAt: Date,
    completedAt: Date,
    duration: Number, // seconds
    htmlUrl: String,
    jobs: [jobSchema],
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      select: false
    }
  },
  {
    timestamps: true,
    collection: 'deployments'
  }
)

// Compound index for listing queries
deploymentSchema.index({ createdAt: -1 })
deploymentSchema.index({ status: 1, createdAt: -1 })

export default mongoose.model('Deployment', deploymentSchema)
