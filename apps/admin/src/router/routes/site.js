// Site Management Routes
const SiteManagementView = () => import('@/views/SiteManagementView.vue')
const SiteSettingsView = () => import('@/views/SiteSettingsView.vue')
const SiteWebsiteView = () => import('@/views/SiteWebsiteView.vue')
const SiteNotificationsView = () => import('@/views/SiteNotificationsView.vue')

export default [
  {
    path: 'site-management',
    component: SiteManagementView,
    meta: {
      requiresPartnerOrAdmin: true,
      titleKey: 'siteManagement.title',
      descriptionKey: 'siteManagement.description',
      requiredPermission: 'settings'
    },
    children: [
      {
        path: '',
        redirect: 'settings'
      },
      {
        path: 'settings',
        name: 'site-settings',
        component: SiteSettingsView
      },
      {
        path: 'pages',
        name: 'site-pages',
        component: SiteWebsiteView
      },
      {
        path: 'notifications',
        name: 'site-notifications',
        component: SiteNotificationsView
      },
      {
        path: 'company',
        name: 'site-company-profile',
        component: () => import('@/views/CompanyProfileView.vue'),
        meta: { tab: 'company' }
      }
    ]
  }
]
