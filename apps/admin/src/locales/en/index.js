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
  ...widget
}
