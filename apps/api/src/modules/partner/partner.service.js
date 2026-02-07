/**
 * Partner Service - Main entry point
 *
 * This file re-exports all partner service functions from specialized sub-services.
 * All existing imports like `import { createPartner } from './partner.service.js'`
 * will continue to work unchanged.
 */

// Profile CRUD operations
export {
  createPartner,
  getPartners,
  getPartner,
  updatePartner,
  deletePartner,
  activatePartner,
  deactivatePartner,
  approvePartner
} from './partnerProfile.service.js'

// Document management
export {
  uploadDocument,
  deleteDocument,
  serveDocument
} from './partnerDocuments.service.js'

// Email settings and SES integration
export {
  getEmailSettings,
  updateEmailSettings,
  createEmailIdentity,
  getVerificationStatus,
  deleteEmailIdentity,
  testPartnerEmail
} from './partnerEmail.service.js'

// SMS settings and provider integration
export {
  getSMSSettings,
  updateSMSSettings,
  testPartnerSMS,
  getSMSBalance,
  getSMSProviders
} from './partnerSMS.service.js'

// PMS integration
export {
  activatePms,
  getPmsStatus
} from './partnerPMS.service.js'

// Branding and self-profile management
export {
  getMyProfile,
  updateMyProfile,
  updateMyAdminTheme,
  updatePartnerAdminTheme,
  uploadMyLogo,
  deleteMyLogo,
  uploadMyFavicon,
  deleteMyFavicon
} from './partnerBranding.service.js'

// Subscription and billing
export {
  getAllPurchases,
  getSubscriptionPlans,
  getSubscription,
  updateSubscription,
  addPurchase,
  updatePurchase,
  markPurchaseAsPaid,
  cancelPurchase
} from './partnerBilling.service.js'
