// PMS Route Definitions
// All PMS routes are under /pms/* prefix

const PmsDashboardView = () => import('@/views/pms/PmsDashboardView.vue')
const PmsFrontDeskView = () => import('@/views/pms/PmsFrontDeskView.vue')
const PmsRoomPlanView = () => import('@/views/pms/PmsRoomPlanView.vue')
const PmsHousekeepingView = () => import('@/views/pms/PmsHousekeepingView.vue')
const PmsHousekeepingMobileView = () => import('@/views/pms/PmsHousekeepingMobileView.vue')
const PmsReservationsView = () => import('@/views/pms/PmsReservationsView.vue')
const PmsGuestsView = () => import('@/views/pms/PmsGuestsView.vue')
const PmsKBSView = () => import('@/views/pms/PmsKBSView.vue')
const PmsCashierView = () => import('@/views/pms/PmsCashierView.vue')
const PmsBillingView = () => import('@/views/pms/PmsBillingView.vue')
const PmsNightAuditView = () => import('@/views/pms/PmsNightAuditView.vue')
const PmsNightAuditDetailView = () => import('@/views/pms/PmsNightAuditDetailView.vue')
const PmsReportsView = () => import('@/views/pms/PmsReportsView.vue')
const PmsChannelManagerView = () => import('@/views/pms/PmsChannelManagerView.vue')
const PmsSettingsView = () => import('@/views/pms/PmsSettingsView.vue')
const PmsUsersView = () => import('@/views/pms/PmsUsersView.vue')

const pmsMeta = {
  requiresPartnerOrAdmin: true,
  requiredPermission: 'pms',
  isPmsRoute: true
}

const pmsRoutes = [
  {
    path: 'pms/dashboard',
    name: 'pms-dashboard',
    component: PmsDashboardView,
    meta: { ...pmsMeta, titleKey: 'pms.dashboard' }
  },
  {
    path: 'pms/front-desk',
    name: 'pms-front-desk',
    component: PmsFrontDeskView,
    meta: { ...pmsMeta, titleKey: 'pms.frontDesk' }
  },
  {
    path: 'pms/room-plan',
    name: 'pms-room-plan',
    component: PmsRoomPlanView,
    meta: { ...pmsMeta, titleKey: 'pms.roomPlan' }
  },
  {
    path: 'pms/housekeeping',
    name: 'pms-housekeeping',
    component: PmsHousekeepingView,
    meta: { ...pmsMeta, titleKey: 'pms.housekeeping' }
  },
  {
    path: 'pms/housekeeping-mobile',
    name: 'pms-housekeeping-mobile',
    component: PmsHousekeepingMobileView,
    meta: { ...pmsMeta, titleKey: 'pms.housekeeping' }
  },
  {
    path: 'pms/reservations',
    name: 'pms-reservations',
    component: PmsReservationsView,
    meta: { ...pmsMeta, titleKey: 'pms.reservations' }
  },
  {
    path: 'pms/guests',
    name: 'pms-guests',
    component: PmsGuestsView,
    meta: { ...pmsMeta, titleKey: 'pms.guests' }
  },
  {
    path: 'pms/kbs',
    name: 'pms-kbs',
    component: PmsKBSView,
    meta: { ...pmsMeta, titleKey: 'pms.kbs' }
  },
  {
    path: 'pms/cashier',
    name: 'pms-cashier',
    component: PmsCashierView,
    meta: { ...pmsMeta, titleKey: 'pms.cashier' }
  },
  {
    path: 'pms/billing',
    name: 'pms-billing',
    component: PmsBillingView,
    meta: { ...pmsMeta, titleKey: 'pms.billing' }
  },
  {
    path: 'pms/night-audit',
    name: 'pms-night-audit',
    component: PmsNightAuditView,
    meta: { ...pmsMeta, titleKey: 'pms.nightAudit' }
  },
  {
    path: 'pms/night-audit/:auditId',
    name: 'pms-night-audit-detail',
    component: PmsNightAuditDetailView,
    meta: { ...pmsMeta, titleKey: 'pms.nightAudit' }
  },
  {
    path: 'pms/reports',
    name: 'pms-reports',
    component: PmsReportsView,
    meta: { ...pmsMeta, titleKey: 'pms.reports' }
  },
  {
    path: 'pms/channel-manager',
    name: 'pms-channel-manager',
    component: PmsChannelManagerView,
    meta: { ...pmsMeta, titleKey: 'pms.channelManager.title' }
  },
  {
    path: 'pms/settings',
    name: 'pms-settings',
    component: PmsSettingsView,
    meta: { ...pmsMeta, titleKey: 'pms.settings' }
  },
  {
    path: 'pms/users',
    name: 'pms-users',
    component: PmsUsersView,
    meta: { ...pmsMeta, titleKey: 'pms.users' }
  }
]

export default pmsRoutes
