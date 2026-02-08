import InboxEmail from './inboxEmail.model.js'
import logger from '#core/logger.js'
import config from '#config'
import { emitToAll } from '#core/socket.js'
import { getEmailSettings, getSESClient } from '#helpers/mail/transporter.js'
import { renderEmailTemplate, htmlToText } from '#helpers/emailTemplates.js'
import { NotFoundError } from '#core/errors.js'

// Lazy-loaded AWS SDK modules
let _s3Client = null
let _mailparser = null

const getS3Client = async () => {
  if (!_s3Client) {
    const { S3Client } = await import('@aws-sdk/client-s3')
    const settings = await getEmailSettings()
    _s3Client = new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: settings.accessKeyId,
        secretAccessKey: settings.secretAccessKey
      }
    })
  }
  return _s3Client
}

const getMailparser = async () => {
  if (!_mailparser) {
    _mailparser = await import('mailparser')
  }
  return _mailparser
}

const S3_BUCKET = process.env.SES_EMAIL_BUCKET || 'ses-maxirez-emails'

/**
 * Handle SNS webhook (subscription confirmation + notification)
 */
export const handleWebhook = async body => {
  // Parse SNS message
  const snsMessage = typeof body === 'string' ? JSON.parse(body) : body

  // Handle subscription confirmation
  if (snsMessage.Type === 'SubscriptionConfirmation') {
    logger.info('SNS Subscription Confirmation received, confirming...')
    try {
      const response = await fetch(snsMessage.SubscribeURL)
      if (response.ok) {
        logger.info('SNS Subscription confirmed successfully')
      } else {
        logger.error('Failed to confirm SNS subscription:', response.statusText)
      }
    } catch (error) {
      logger.error('Failed to confirm SNS subscription:', error.message)
    }
    return { confirmed: true }
  }

  // Handle notification
  if (snsMessage.Type === 'Notification') {
    const message =
      typeof snsMessage.Message === 'string' ? JSON.parse(snsMessage.Message) : snsMessage.Message

    // SES notification contains mail metadata
    const { mail, receipt } = message

    if (!mail) {
      logger.warn('SNS notification without mail metadata')
      return { skipped: true }
    }

    try {
      // Fetch raw email from S3
      const rawEmail = await fetchEmailFromS3(mail.messageId)

      // Parse with mailparser
      const { simpleParser } = await getMailparser()
      const parsed = await simpleParser(rawEmail)

      // Determine thread
      const inReplyTo = parsed.inReplyTo || null
      const references = parsed.references
        ? Array.isArray(parsed.references)
          ? parsed.references
          : [parsed.references]
        : []

      let threadId
      if (inReplyTo) {
        // Find existing thread by inReplyTo
        const existingEmail = await InboxEmail.findOne({
          $or: [{ messageId: inReplyTo }, { threadId: inReplyTo }]
        }).lean()
        threadId = existingEmail?.threadId || inReplyTo
      } else {
        // New thread - use messageId
        threadId = mail.messageId
      }

      // Parse attachments
      const attachments = []
      if (parsed.attachments?.length) {
        for (const att of parsed.attachments) {
          const s3Key = `attachments/${mail.messageId}/${att.filename || 'unnamed'}`
          await uploadToS3(s3Key, att.content, att.contentType)
          attachments.push({
            filename: att.filename || 'unnamed',
            contentType: att.contentType,
            size: att.size,
            s3Key
          })
        }
      }

      // Get text for snippet
      const textBody = parsed.text || ''
      const snippet = textBody.substring(0, 200).replace(/\s+/g, ' ').trim()

      // Create email record
      const email = await InboxEmail.create({
        messageId: mail.messageId,
        from: {
          address: parsed.from?.value?.[0]?.address || mail.source,
          name: parsed.from?.value?.[0]?.name || ''
        },
        to: mail.destination || [],
        cc: parsed.cc?.value?.map(c => c.address) || [],
        subject: parsed.subject || '(Konu yok)',
        textBody,
        htmlBody: parsed.html || parsed.textAsHtml || '',
        snippet,
        attachments,
        threadId,
        inReplyTo,
        references,
        direction: 'inbound',
        status: 'unread',
        verdicts: {
          spam: receipt?.spamVerdict?.status,
          virus: receipt?.virusVerdict?.status,
          spf: receipt?.spfVerdict?.status,
          dkim: receipt?.dkimVerdict?.status,
          dmarc: receipt?.dmarcVerdict?.status
        },
        s3Key: `emails/${mail.messageId}`,
        receivedAt: new Date(mail.timestamp)
      })

      logger.info(`Inbound email saved: ${email._id} from ${email.from.address}`)

      // Emit realtime event
      emitToAll('mailbox:new', {
        email: {
          _id: email._id,
          from: email.from,
          subject: email.subject,
          snippet: email.snippet,
          receivedAt: email.receivedAt
        }
      })

      return { saved: true, emailId: email._id }
    } catch (error) {
      // Duplicate messageId - skip
      if (error.code === 11000) {
        logger.warn(`Duplicate email messageId: ${mail.messageId}`)
        return { duplicate: true }
      }
      throw error
    }
  }

  return { skipped: true }
}

/**
 * List inbox emails with filters and pagination
 */
export const list = async ({ status, starred, search, page = 1, limit = 30 }) => {
  const query = {}

  // Status filter
  if (status === 'unread') {
    query.status = 'unread'
  } else if (status === 'archived') {
    query.status = 'archived'
  } else if (status !== 'all') {
    query.status = { $ne: 'archived' }
  }

  // Starred filter
  if (starred === 'true' || starred === true) {
    query.isStarred = true
  }

  // Search
  if (search) {
    query.$or = [
      { subject: { $regex: search, $options: 'i' } },
      { 'from.address': { $regex: search, $options: 'i' } },
      { 'from.name': { $regex: search, $options: 'i' } },
      { snippet: { $regex: search, $options: 'i' } }
    ]
  }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    InboxEmail.find(query)
      .sort({ receivedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-htmlBody -textBody')
      .lean(),
    InboxEmail.countDocuments(query)
  ])

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

/**
 * Get thread (all messages in a conversation)
 */
export const getThread = async threadId => {
  const emails = await InboxEmail.find({ threadId }).sort({ receivedAt: 1 }).lean()

  if (!emails.length) {
    throw new NotFoundError('Thread not found')
  }

  // Mark unread inbound ones as read
  await InboxEmail.updateMany(
    { threadId, status: 'unread', direction: 'inbound' },
    { status: 'read' }
  )

  return emails
}

/**
 * Get single email by ID
 */
export const getEmail = async id => {
  const email = await InboxEmail.findById(id).lean()
  if (!email) throw new NotFoundError('Email not found')

  // Mark as read if unread
  if (email.status === 'unread') {
    await InboxEmail.findByIdAndUpdate(id, { status: 'read' })
    email.status = 'read'
  }

  return email
}

/**
 * Mark email as read
 */
export const markAsRead = async id => {
  const email = await InboxEmail.findByIdAndUpdate(id, { status: 'read' }, { new: true })
  if (!email) throw new NotFoundError('Email not found')
  return email
}

/**
 * Mark email as unread
 */
export const markAsUnread = async id => {
  const email = await InboxEmail.findByIdAndUpdate(id, { status: 'unread' }, { new: true })
  if (!email) throw new NotFoundError('Email not found')
  return email
}

/**
 * Toggle star
 */
export const toggleStar = async id => {
  const email = await InboxEmail.findById(id)
  if (!email) throw new NotFoundError('Email not found')

  email.isStarred = !email.isStarred
  await email.save()
  return email
}

/**
 * Archive email
 */
export const archive = async id => {
  const email = await InboxEmail.findByIdAndUpdate(id, { status: 'archived' }, { new: true })
  if (!email) throw new NotFoundError('Email not found')
  return email
}

/**
 * Reply to an email
 */
export const reply = async (id, { body, cc }, userId) => {
  const original = await InboxEmail.findById(id)
  if (!original) throw new NotFoundError('Email not found')

  const replyTo = original.from.address
  const subject = original.subject.startsWith('Re: ') ? original.subject : `Re: ${original.subject}`

  // Build quoted original section HTML
  const originalFrom = original.from.name || original.from.address
  const originalDate = new Date(original.receivedAt).toLocaleString('tr-TR')
  const originalBody = original.htmlBody || original.textBody || ''
  const quotedSection = `<tr><td style="padding:0 40px 32px;" class="sm-px-6">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;border-left:4px solid #2563eb;" role="none"><tr><td style="padding:16px 20px;">
<p style="margin:0 0 8px;font-size:12px;color:#64748b;font-weight:600;">&#128172; ${originalFrom} — ${originalDate}</p>
<div style="font-size:13px;line-height:1.6;color:#475569;">${originalBody}</div>
</td></tr></table></td></tr>`

  // Render reply template
  const html = await renderEmailTemplate(
    'email-reply',
    {
      SUBJECT: subject,
      REPLY_BODY: body,
      QUOTED_SECTION: quotedSection
    },
    'tr'
  )

  // Build MIME message with In-Reply-To and References headers
  const settings = await getEmailSettings()

  if (!settings.enabled) {
    if (config.isDev) {
      logger.warn('SES not configured, logging reply to console')
      logger.info({ to: replyTo, subject, body })
    } else {
      throw new Error('AWS SES is not configured')
    }
  }

  const fromAddress = `${settings.fromName} <${settings.fromEmail}>`
  const toAddresses = [replyTo]
  if (cc?.length) toAddresses.push(...cc)

  const references = [...(original.references || [])]
  if (original.messageId && !references.includes(original.messageId)) {
    references.push(original.messageId)
  }

  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const textContent = htmlToText(body)

  const headers = [
    `From: ${fromAddress}`,
    `To: ${replyTo}`,
    ...(cc?.length ? [`Cc: ${cc.join(', ')}`] : []),
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    `In-Reply-To: ${original.messageId}`,
    `References: ${references.join(' ')}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`
  ]

  const rawMessage = [
    ...headers,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(textContent).toString('base64'),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(html).toString('base64'),
    '',
    `--${boundary}--`
  ]

  let sentMessageId = 'dev-mode'

  if (settings.enabled) {
    const client = await getSESClient(settings, 'platform')
    const { SendRawEmailCommand } = await import('@aws-sdk/client-ses')
    const command = new SendRawEmailCommand({
      RawMessage: { Data: Buffer.from(rawMessage.join('\r\n')) }
    })
    const response = await client.send(command)
    sentMessageId = response.MessageId
    logger.info(`Reply sent to ${replyTo}. MessageId: ${sentMessageId}`)
  }

  // Save outbound email record
  const outbound = await InboxEmail.create({
    messageId: sentMessageId,
    from: {
      address: settings.fromEmail || 'noreply@maxirez.com',
      name: settings.fromName || 'Maxirez'
    },
    to: [replyTo],
    cc: cc || [],
    subject,
    textBody: textContent,
    htmlBody: html,
    snippet: textContent.substring(0, 200).replace(/\s+/g, ' ').trim(),
    threadId: original.threadId,
    inReplyTo: original.messageId,
    references,
    direction: 'outbound',
    status: 'read',
    receivedAt: new Date()
  })

  // Update original as replied
  original.status = 'replied'
  original.repliedAt = new Date()
  original.repliedBy = userId
  await original.save()

  return outbound
}

/**
 * Compose a new email
 */
export const compose = async ({ to, cc, subject, body }, userId) => {
  // Render reply template (reuse it for new emails too, no quoted section)
  const html = await renderEmailTemplate(
    'email-reply',
    {
      SUBJECT: subject,
      REPLY_BODY: body,
      QUOTED_SECTION: ''
    },
    'tr'
  )

  const settings = await getEmailSettings()

  if (!settings.enabled && !config.isDev) {
    throw new Error('AWS SES is not configured')
  }

  const fromAddress = `${settings.fromName} <${settings.fromEmail}>`
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const textContent = htmlToText(body)

  const allTo = Array.isArray(to) ? to : [to]

  const headers = [
    `From: ${fromAddress}`,
    `To: ${allTo.join(', ')}`,
    ...(cc?.length ? [`Cc: ${cc.join(', ')}`] : []),
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`
  ]

  const rawMessage = [
    ...headers,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(textContent).toString('base64'),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(html).toString('base64'),
    '',
    `--${boundary}--`
  ]

  let sentMessageId = 'dev-mode'

  if (settings.enabled) {
    const client = await getSESClient(settings, 'platform')
    const { SendRawEmailCommand } = await import('@aws-sdk/client-ses')
    const command = new SendRawEmailCommand({
      RawMessage: { Data: Buffer.from(rawMessage.join('\r\n')) }
    })
    const response = await client.send(command)
    sentMessageId = response.MessageId
    logger.info(`Email sent to ${allTo.join(', ')}. MessageId: ${sentMessageId}`)
  }

  // Save outbound email record
  const email = await InboxEmail.create({
    messageId: sentMessageId,
    from: {
      address: settings.fromEmail || 'noreply@maxirez.com',
      name: settings.fromName || 'Maxirez'
    },
    to: allTo,
    cc: cc || [],
    subject,
    textBody: textContent,
    htmlBody: html,
    snippet: textContent.substring(0, 200).replace(/\s+/g, ' ').trim(),
    threadId: sentMessageId, // New thread
    direction: 'outbound',
    status: 'read',
    receivedAt: new Date()
  })

  return email
}

/**
 * Get inbox stats
 */
export const getStats = async () => {
  return InboxEmail.getStats()
}

/**
 * Get attachment (S3 signed URL)
 */
export const getAttachment = async (emailId, attachmentIndex) => {
  const email = await InboxEmail.findById(emailId).lean()
  if (!email) throw new NotFoundError('Email not found')

  const attachment = email.attachments?.[attachmentIndex]
  if (!attachment) throw new NotFoundError('Attachment not found')

  const { GetObjectCommand } = await import('@aws-sdk/client-s3')
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

  const client = await getS3Client()
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: attachment.s3Key
  })

  const url = await getSignedUrl(client, command, { expiresIn: 3600 })
  return { url, filename: attachment.filename, contentType: attachment.contentType }
}

// ---- S3 Helpers ----

async function fetchEmailFromS3(messageId) {
  const { GetObjectCommand } = await import('@aws-sdk/client-s3')
  const client = await getS3Client()

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: messageId
  })

  const response = await client.send(command)
  const chunks = []
  for await (const chunk of response.Body) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function uploadToS3(key, content, contentType) {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3')
  const client = await getS3Client()

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: content,
    ContentType: contentType
  })

  await client.send(command)
}
