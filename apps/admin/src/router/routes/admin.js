// Platform Admin Routes
const RegionManagementView = () => import('@/views/admin/RegionManagementView.vue')
const HotelBaseListView = () => import('@/views/admin/HotelBaseListView.vue')
const HotelBaseDetailView = () => import('@/views/admin/HotelBaseDetailView.vue')
const AuditLogsView = () => import('@/views/admin/AuditLogsView.vue')
const PlatformSettingsView = () => import('@/views/admin/PlatformSettingsView.vue')
const EmailLogsView = () => import('@/views/admin/EmailLogsView.vue')

export default [
  {
    path: 'admin/regions',
    name: 'region-management',
    component: RegionManagementView,
    meta: { requiresPlatformAdmin: true }
  },
  {
    path: 'admin/hotel-base',
    name: 'hotel-base',
    component: HotelBaseListView,
    meta: {
      requiresPlatformAdmin: true,
      titleKey: 'hotels.hotelBase.title',
      descriptionKey: 'hotels.hotelBase.description'
    }
  },
  {
    path: 'admin/hotel-base/new',
    name: 'hotel-base-new',
    component: HotelBaseDetailView,
    meta: {
      requiresPlatformAdmin: true,
      titleKey: 'hotels.hotelBase.newHotel',
      descriptionKey: 'hotels.hotelBase.newHotelDesc'
    }
  },
  {
    path: 'admin/hotel-base/:id',
    name: 'hotel-base-detail',
    component: HotelBaseDetailView,
    meta: {
      requiresPlatformAdmin: true,
      titleKey: 'hotels.hotelBase.editHotel',
      descriptionKey: 'hotels.hotelBase.editHotelDesc'
    }
  },
  {
    path: 'admin/audit-logs',
    name: 'audit-logs',
    component: AuditLogsView,
    meta: {
      requiresPlatformAdmin: true,
      titleKey: 'audit.title',
      descriptionKey: 'audit.description'
    }
  },
  {
    path: 'admin/platform-settings',
    name: 'platform-settings',
    component: PlatformSettingsView,
    meta: {
      requiresPlatformAdmin: true,
      titleKey: 'platformSettings.title',
      descriptionKey: 'platformSettings.description'
    }
  },
  {
    path: 'admin/email-logs',
    name: 'email-logs',
    component: EmailLogsView,
    meta: {
      requiresPlatformAdmin: true,
      titleKey: 'emailLogs.title',
      descriptionKey: 'emailLogs.description'
    }
  }
]
