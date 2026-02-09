import common from './common.json'
import auth from './auth.json'
import booking from './booking.json'
import hotels from './hotels.json'
import planning from './planning.json'
import misc from './misc.json'
import users from './users.json'
import issues from './issues.json'
import emailLogs from './emailLogs.json'
import tour from './tour.json'
import widget from './widget.json'
import agencies from './agencies.json'
import partners from './partners.json'
import developers from './developers.json'
import settings from './settings.json'
import siteSettings from './siteSettings.json'
import siteManagement from './siteManagement.json'
import website from './website.json'
import companyProfile from './companyProfile.json'
import notifications from './notifications.json'
import mySubscription from './mySubscription.json'
import paymentLink from './paymentLink.json'
import mailbox from './mailbox.json'
import pms from './pms.json'

// Deep merge: adds PMS keys without overwriting existing booking-engine values
function deepMerge(target, source) {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (!(key in result)) {
      result[key] = source[key]
    } else if (
      typeof result[key] === 'object' &&
      result[key] !== null &&
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !Array.isArray(result[key]) &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(result[key], source[key])
    }
  }
  return result
}

const base = {
  ...common,
  ...auth,
  ...booking,
  ...hotels,
  ...planning,
  ...misc,
  ...users,
  ...issues,
  emailLogs,
  ...tour,
  ...widget,
  ...agencies,
  ...partners,
  ...developers,
  ...settings,
  ...siteSettings,
  ...siteManagement,
  ...website,
  ...companyProfile,
  ...notifications,
  ...mySubscription,
  ...paymentLink,
  ...mailbox
}

export default deepMerge(base, pms)
