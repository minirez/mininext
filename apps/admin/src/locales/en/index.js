import common from './common.json'
import auth from './auth.json'
import booking from './booking.json'
import hotels from './hotels.json'
import planning from './planning.json'
import pmsIntegration from './pmsIntegration.json'
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

export default {
  ...common,
  ...auth,
  ...booking,
  ...hotels,
  ...planning,
  pmsIntegration,
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
  ...paymentLink
}
