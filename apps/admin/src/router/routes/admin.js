// Platform Admin Routes
const HotelBaseListView = () => import('@/views/admin/HotelBaseListView.vue')
const HotelBaseDetailView = () => import('@/views/admin/HotelBaseDetailView.vue')
const MailboxView = () => import('@/views/admin/MailboxView.vue')
const PlatformReservationsView = () => import('@/views/admin/PlatformReservationsView.vue')

export default [
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
    path: 'admin/logs',
    component: () => import('@/views/admin/AdminLogsView.vue'),
    meta: { requiresPlatformAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/logs/audit'
      },
      {
        path: 'audit',
        name: 'audit-logs',
        component: () => import('@/views/admin/AuditLogsView.vue'),
        meta: { tab: 'audit-logs' }
      },
      {
        path: 'email',
        name: 'email-logs',
        component: () => import('@/views/admin/EmailLogsView.vue'),
        meta: { tab: 'email-logs' }
      }
    ]
  },
  {
    path: 'admin/mailbox',
    name: 'mailbox',
    component: MailboxView,
    meta: {
      requiresPlatformAdmin: true,
      titleKey: 'mailbox.title',
      descriptionKey: 'mailbox.description'
    }
  },
  {
    path: 'admin/reservations',
    name: 'platform-reservations',
    component: PlatformReservationsView,
    meta: {
      requiresPlatformAdmin: true,
      titleKey: 'platformBookings.title',
      descriptionKey: 'platformBookings.description'
    }
  },
  {
    path: 'admin/settings',
    component: () => import('@/views/admin/AdminSettingsMiscView.vue'),
    meta: { requiresPlatformAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/settings/platform'
      },
      {
        path: 'platform',
        name: 'platform-settings',
        component: () => import('@/views/admin/PlatformSettingsView.vue'),
        meta: { tab: 'platform-settings' }
      },
      {
        path: 'regions',
        name: 'region-management',
        component: () => import('@/views/admin/RegionManagementView.vue'),
        meta: { tab: 'regions' }
      },
      {
        path: 'migration',
        name: 'migration',
        component: () => import('@/views/admin/MigrationView.vue'),
        meta: { tab: 'migration' }
      },
      {
        path: 'tursab',
        name: 'tursab-directory',
        component: () => import('@/views/admin/TursabDirectoryView.vue'),
        meta: { tab: 'tursab' }
      },
      {
        path: 'responsive-viewer',
        name: 'responsive-viewer',
        component: () => import('@/views/admin/ResponsiveViewerView.vue'),
        meta: { tab: 'responsive-viewer' }
      }
    ]
  }
]
