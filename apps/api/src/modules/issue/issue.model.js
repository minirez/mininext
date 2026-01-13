import mongoose from 'mongoose'

// Yorum Schema
const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date
}, {
  timestamps: true
})

// Aktivite Schema
const activitySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: [
      'created', 'updated', 'status_changed', 'assigned', 'unassigned',
      'priority_changed', 'label_added', 'label_removed', 'comment_added',
      'comment_edited', 'comment_deleted', 'attachment_added', 'attachment_removed',
      'due_date_set', 'due_date_removed', 'watcher_added', 'watcher_removed',
      'related_added', 'related_removed', 'reopened', 'resolved', 'closed'
    ],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  details: {
    from: mongoose.Schema.Types.Mixed,
    to: mongoose.Schema.Types.Mixed,
    comment: String
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

// Ana Issue Schema
const issueSchema = new mongoose.Schema({
  // Issue Numarası (ISS-0001)
  issueNumber: {
    type: String,
    unique: true,
    required: true
  },

  // Temel Bilgiler
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true
  },

  // Durum & Öncelik
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'reopened'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['bug', 'feature', 'improvement', 'question', 'task', 'other'],
    default: 'other'
  },

  // Etiketler
  labels: [{
    type: String,
    trim: true
  }],

  // Dosyalar
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Kullanıcılar
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Tarihler
  dueDate: Date,
  resolvedAt: Date,
  closedAt: Date,

  // İlişkiler
  relatedIssues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  }],

  // Yorumlar & Aktivite
  comments: [commentSchema],
  activity: [activitySchema],

  // Meta
  metadata: {
    browser: String,
    os: String,
    url: String,
    userAgent: String
  }
}, {
  timestamps: true
})

// Indexes (issueNumber already has unique: true which creates index)
issueSchema.index({ status: 1 })
issueSchema.index({ priority: 1 })
issueSchema.index({ reporter: 1 })
issueSchema.index({ assignee: 1 })
issueSchema.index({ createdAt: -1 })
issueSchema.index({ title: 'text', description: 'text' })

// Issue numarası oluştur
issueSchema.statics.getNextIssueNumber = async function() {
  const lastIssue = await this.findOne({}, {}, { sort: { createdAt: -1 } })

  if (!lastIssue) {
    return 'ISS-0001'
  }

  const lastNumber = parseInt(lastIssue.issueNumber.split('-')[1])
  const nextNumber = (lastNumber + 1).toString().padStart(4, '0')
  return `ISS-${nextNumber}`
}

// Aktivite ekle helper
issueSchema.methods.addActivity = function(action, userId, details = {}) {
  this.activity.push({
    action,
    user: userId,
    details
  })
}

export default mongoose.model('Issue', issueSchema)
