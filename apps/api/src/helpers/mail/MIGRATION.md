# Mail Helper Refactoring - Migration Guide

## Summary

The `mail.js` helper (982 lines) has been split into smaller, focused files for better maintainability.

## Changes

### Before

```
helpers/
└── mail.js (982 lines)
```

### After

```
helpers/
├── mail.js (56 lines) - Re-exports everything
└── mail/
    ├── transporter.js (130 lines)   - SES/SMTP config
    ├── core.js (231 lines)          - Core sending functions
    ├── senders.js (615 lines)       - Template senders
    └── README.md                    - Documentation
```

## File Breakdown

### `mail/transporter.js` (130 lines)

- `getEmailSettings(partnerId)` - Database/env email config
- `getSESClient(settings, cacheKey)` - SES client creation & caching
- `clearEmailCache()` - Cache management
- `getAdminUrl(partnerId)` - Partner URL resolution

### `mail/core.js` (231 lines)

- `sendEmail(options)` - Core SES email sending
- `sendEmailWithAttachments(options)` - Raw MIME email with attachments

### `mail/senders.js` (615 lines)

- `sendWelcomeEmail(options)`
- `send2FASetupEmail(options)`
- `sendActivationEmail(options)`
- `sendBookingConfirmation(options)`
- `sendBookingCancellation(options)`
- `sendPasswordResetEmail(options)`
- `sendNightAuditReports(options)`
- `sendIssueNudgeEmail(options)`

### `mail.js` (56 lines)

Main export file that re-exports all functions from sub-modules for backward compatibility.

## Migration Required?

**NO!** All existing code continues to work without changes.

### Existing Imports (still work)

```javascript
// Named imports
import { sendEmail, sendActivationEmail } from '#helpers/mail.js'

// Default import
import mail from '#helpers/mail.js'
```

### New Options (for new code)

```javascript
// Import specific modules directly
import { sendEmail } from '#helpers/mail/core.js'
import { getEmailSettings } from '#helpers/mail/transporter.js'
import { sendWelcomeEmail } from '#helpers/mail/senders.js'
```

## Benefits

1. **Maintainability**: Smaller files (~130-615 lines vs 982)
2. **Clarity**: Clear separation of concerns
3. **Performance**: Can import only what you need
4. **Developer Experience**: Easier to find and modify code
5. **Zero Breaking Changes**: 100% backward compatible

## Testing

All exports verified:

```javascript
// Named exports (14 functions)
clearEmailCache, getAdminUrl, getEmailSettings, getSESClient,
send2FASetupEmail, sendActivationEmail, sendBookingCancellation,
sendBookingConfirmation, sendEmail, sendEmailWithAttachments,
sendIssueNudgeEmail, sendNightAuditReports, sendPasswordResetEmail,
sendWelcomeEmail

// Default export (12 functions)
Same as named exports except getEmailSettings and getSESClient
```

## Files Using Mail Helper

The following files import from `#helpers/mail.js` (all continue to work):

- `modules/auth/auth.service.js`
- `modules/user/user.service.js`
- `modules/issue/issue.service.js`
- `modules/partner/partner.service.js`
- `modules/partner/partnerEmail.service.js`
- `modules/partner/partnerProfile.service.js`
- `modules/booking/email.service.js`
- `modules/agency/agency.service.js`
- `services/notificationService.js`

## Next Steps

- Consider using direct imports for new code
- Update documentation if needed
- No immediate action required - all existing code works as-is
