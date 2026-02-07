/**
 * Mail Helper - Main Export File
 *
 * This file maintains backward compatibility by re-exporting all mail functions.
 * The implementation has been split into focused modules:
 * - mail/transporter.js: SMTP/SES configuration and transporter setup
 * - mail/core.js: Core email sending functions (sendEmail, sendEmailWithAttachments)
 * - mail/senders.js: Individual email sending functions (sendActivation, sendWelcome, etc.)
 */

// Core email functions
export { sendEmail, sendEmailWithAttachments } from './mail/core.js'

// Transporter utilities
export { getEmailSettings, getSESClient, clearEmailCache, getAdminUrl } from './mail/transporter.js'

// Email sender functions
export {
  sendWelcomeEmail,
  send2FASetupEmail,
  sendActivationEmail,
  sendBookingConfirmation,
  sendBookingCancellation,
  sendPasswordResetEmail,
  sendNightAuditReports,
  sendIssueNudgeEmail
} from './mail/senders.js'

// Default export for backward compatibility
import { sendEmail, sendEmailWithAttachments } from './mail/core.js'
import { clearEmailCache, getAdminUrl } from './mail/transporter.js'
import {
  sendWelcomeEmail,
  send2FASetupEmail,
  sendActivationEmail,
  sendBookingConfirmation,
  sendBookingCancellation,
  sendPasswordResetEmail,
  sendNightAuditReports,
  sendIssueNudgeEmail
} from './mail/senders.js'

export default {
  sendEmail,
  sendEmailWithAttachments,
  sendWelcomeEmail,
  send2FASetupEmail,
  sendActivationEmail,
  sendBookingConfirmation,
  sendBookingCancellation,
  sendPasswordResetEmail,
  sendNightAuditReports,
  sendIssueNudgeEmail,
  clearEmailCache,
  getAdminUrl
}
