# Mail Helper - Module Structure

The mail helper has been split into focused modules for better maintainability.

## File Structure

```
helpers/
├── mail.js                 # Main export file (backward compatible)
└── mail/
    ├── transporter.js     # SMTP/SES configuration and client management
    ├── core.js            # Core email sending functions
    └── senders.js         # Individual email template senders
```

## Modules

### `transporter.js`

Handles email service configuration and client management.

**Exports:**

- `getEmailSettings(partnerId)` - Get email settings from DB or env
- `getSESClient(settings, cacheKey)` - Get or create cached SES client
- `clearEmailCache()` - Clear SES client cache
- `getAdminUrl(partnerId)` - Get admin URL for partner

### `core.js`

Core email sending functionality.

**Exports:**

- `sendEmail(options)` - Send basic email via SES
- `sendEmailWithAttachments(options)` - Send email with attachments

### `senders.js`

Template-based email senders for specific use cases.

**Exports:**

- `sendWelcomeEmail(options)` - Send welcome email with credentials
- `send2FASetupEmail(options)` - Send 2FA setup with backup codes
- `sendActivationEmail(options)` - Send account activation email
- `sendBookingConfirmation(options)` - Send booking confirmation
- `sendBookingCancellation(options)` - Send booking cancellation
- `sendPasswordResetEmail(options)` - Send password reset email
- `sendNightAuditReports(options)` - Send Night Audit reports with PDFs
- `sendIssueNudgeEmail(options)` - Send issue reminder/nudge

## Usage

All existing imports continue to work:

```javascript
// Named imports (recommended)
import { sendEmail, sendActivationEmail } from '#helpers/mail.js'

// Default import (if needed)
import mail from '#helpers/mail.js'
await mail.sendEmail({ to, subject, html })
```

## Backward Compatibility

The main `mail.js` file re-exports all functions from the sub-modules, ensuring 100% backward compatibility with existing code.

## Benefits

- **Smaller files**: Each file is now ~150-250 lines instead of 982
- **Better organization**: Related functions grouped together
- **Easier maintenance**: Find and modify specific functionality faster
- **Improved readability**: Clearer separation of concerns
- **No breaking changes**: All existing imports continue to work
