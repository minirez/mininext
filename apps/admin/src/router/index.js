import { createRouter, createWebHistory } from 'vue-router'
import { h } from 'vue'
import { routerLogger } from '@/utils/logger'

// Empty component for tab-based routes (parent handles rendering)
const EmptyRouteView = { render: () => h('div') }

// Import Layouts
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

// Lazy load components for better performance
const LoginView = () => import('../views/LoginView.vue')
const RegisterView = () => import('../views/RegisterView.vue')
const ForcePasswordChangeView = () => import('../views/ForcePasswordChangeView.vue')
const DashboardView = () => import('../views/DashboardView.vue')
const PartnersView = () => import('../views/PartnersView.vue')
const AgenciesView = () => import('../views/AgenciesView.vue')
const AgencyUsersView = () => import('../views/AgencyUsersView.vue')
const SiteManagementView = () => import('../views/SiteManagementView.vue')
const SiteSettingsView = () => import('../views/SiteSettingsView.vue')
const SitePagesView = () => import('../views/SitePagesView.vue')
const _SiteEmailSetupView = () => import('../views/SiteEmailSetupView.vue')
const SiteNotificationsView = () => import('../views/SiteNotificationsView.vue')
const ProfileView = () => import('../views/ProfileView.vue')
const HotelsView = () => import('../views/HotelsView.vue')
const HotelDetailView = () => import('../views/HotelDetailView.vue')
const PlanningView = () => import('../views/PlanningView.vue')
const RoomTypeDetailView = () => import('../views/RoomTypeDetailView.vue')
const MarketDetailView = () => import('../views/MarketDetailView.vue')
const RegionManagementView = () => import('../views/admin/RegionManagementView.vue')
const HotelBaseListView = () => import('../views/admin/HotelBaseListView.vue')
const HotelBaseDetailView = () => import('../views/admin/HotelBaseDetailView.vue')
const AuditLogsView = () => import('../views/admin/AuditLogsView.vue')
const PlatformSettingsView = () => import('../views/admin/PlatformSettingsView.vue')
const EmailLogsView = () => import('../views/admin/EmailLogsView.vue')
const DevelopersView = () => import('../views/DevelopersView.vue')
const UIShowcaseView = () => import('../views/UIShowcaseView.vue')
const BookingListView = () => import('../views/booking/BookingListView.vue')
const BookingWizardView = () => import('../views/booking/BookingWizardView.vue')
const BookingDetailView = () => import('../views/booking/BookingDetailView.vue')
const UsersView = () => import('../views/UsersView.vue')
const InviteAcceptView = () => import('../views/InviteAcceptView.vue')
const ActivateAccountView = () => import('../views/ActivateAccountView.vue')
const IssuesView = () => import('../views/IssuesView.vue')
const IssueDetailView = () => import('../views/IssueDetailView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Routes using the Default Layout (for authenticated users)
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView
        },
        {
          path: 'partners',
          name: 'partners',
          component: PartnersView,
          meta: { requiresPlatformAdmin: true }
        },
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
        },
        {
          path: 'agencies',
          name: 'agencies',
          component: AgenciesView,
          meta: { requiresPartnerOrAdmin: true }
        },
        {
          path: 'agencies/:id/users',
          name: 'agency-users',
          component: AgencyUsersView,
          meta: { requiresPartnerOrAdmin: true }
        },
        {
          path: 'users',
          name: 'users',
          component: UsersView,
          meta: {
            requiresAuth: true,
            titleKey: 'users.title'
          }
        },
        {
          path: 'site-management',
          component: SiteManagementView,
          meta: {
            requiresPartnerOrAdmin: true,
            titleKey: 'siteManagement.title',
            descriptionKey: 'siteManagement.description'
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
              component: SitePagesView
            },
            {
              path: 'notifications',
              name: 'site-notifications',
              component: SiteNotificationsView
            }
          ]
        },
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView
        },
        {
          path: 'ui-showcase',
          name: 'ui-showcase',
          component: UIShowcaseView,
          meta: {
            requiresPlatformAdmin: true,
            titleKey: 'UI Framework Showcase'
          }
        },
        {
          path: 'hotels',
          name: 'hotels',
          component: HotelsView,
          meta: { requiresPartnerOrAdmin: true }
        },
        {
          path: 'hotels/new',
          name: 'hotel-new',
          component: HotelDetailView,
          meta: { requiresPartnerOrAdmin: true }
        },
        {
          path: 'hotels/:id',
          name: 'hotel-detail',
          component: HotelDetailView,
          meta: { requiresPartnerOrAdmin: true }
        },
        {
          path: 'planning',
          component: PlanningView,
          meta: { requiresPartnerOrAdmin: true },
          children: [
            {
              path: '',
              redirect: '/planning/settings'
            },
            {
              path: 'settings',
              name: 'planning-settings',
              component: EmptyRouteView,
              meta: { tab: 'settings' }
            },
            {
              path: 'rooms',
              name: 'planning-rooms',
              component: EmptyRouteView,
              meta: { tab: 'rooms' }
            },
            {
              path: 'markets',
              name: 'planning-markets',
              component: EmptyRouteView,
              meta: { tab: 'markets' }
            },
            {
              path: 'campaigns',
              name: 'planning-campaigns',
              component: EmptyRouteView,
              meta: { tab: 'campaigns' }
            },
            {
              path: 'pricing',
              name: 'planning-pricing',
              component: EmptyRouteView,
              meta: { tab: 'pricing' }
            },
            {
              path: 'hotels/:hotelId/room-types/new',
              name: 'room-type-new',
              component: RoomTypeDetailView
            },
            {
              path: 'hotels/:hotelId/room-types/:id',
              name: 'room-type-detail',
              component: RoomTypeDetailView
            },
            {
              path: 'hotels/:hotelId/markets/new',
              name: 'market-new',
              component: MarketDetailView
            },
            {
              path: 'hotels/:hotelId/markets/:id',
              name: 'market-detail',
              component: MarketDetailView
            }
          ]
        },
        {
          path: 'developers',
          name: 'developers',
          component: DevelopersView,
          meta: { requiresPartnerOrAdmin: true }
        },
        {
          path: 'bookings',
          name: 'bookings',
          component: BookingListView,
          meta: { requiresPartnerOrAdmin: true }
        },
        {
          path: 'bookings/new',
          name: 'booking-new',
          component: BookingWizardView,
          meta: { requiresPartnerOrAdmin: true }
        },
        {
          path: 'bookings/draft/:bookingNumber',
          name: 'booking-draft',
          component: BookingWizardView,
          meta: { requiresPartnerOrAdmin: true }
        },
        {
          path: 'bookings/:id',
          name: 'booking-detail',
          component: BookingDetailView,
          meta: { requiresPartnerOrAdmin: true }
        },
        // PMS Integration
        {
          path: 'pms-integration',
          name: 'pms-integration',
          component: () => import('../views/PmsIntegrationView.vue'),
          meta: { requiresPartnerOrAdmin: true }
        },
        // My Subscription (for partner users only)
        {
          path: 'my-subscription',
          name: 'my-subscription',
          component: () => import('../views/MySubscriptionView.vue'),
          meta: {
            requiresPartner: true,
            titleKey: 'mySubscription.title'
          }
        },
        // Issues (Platform users only)
        {
          path: 'issues',
          name: 'issues',
          component: IssuesView,
          meta: {
            requiresPlatformAdmin: true,
            titleKey: 'issues.title'
          }
        },
        {
          path: 'issues/:id',
          name: 'issue-detail',
          component: IssueDetailView,
          meta: {
            requiresPlatformAdmin: true,
            titleKey: 'issues.title'
          }
        },
        // Virtual POS / Payment Management (Platform admin only)
        {
          path: 'payment',
          component: () => import('../views/payment/PaymentModule.vue'),
          meta: {
            requiresPlatformAdmin: true,
            titleKey: 'payment.title'
          },
          children: [
            {
              path: '',
              redirect: '/payment/test'
            },
            {
              path: 'test',
              name: 'payment-test',
              component: () => import('../views/payment/PaymentTest.vue'),
              meta: { tab: 'test' }
            },
            {
              path: 'transactions',
              name: 'payment-transactions',
              component: () => import('../views/payment/PaymentTransactions.vue'),
              meta: { tab: 'transactions' }
            },
            {
              path: 'pos',
              name: 'payment-pos',
              component: () => import('../views/payment/PaymentPos.vue'),
              meta: { tab: 'pos' }
            },
            {
              path: 'commissions',
              name: 'payment-commissions',
              component: () => import('../views/payment/PaymentCommissions.vue'),
              meta: { tab: 'commissions' }
            },
            {
              path: 'bins',
              name: 'payment-bins',
              component: () => import('../views/payment/PaymentBins.vue'),
              meta: { tab: 'bins' }
            },
            {
              path: 'docs',
              name: 'payment-docs',
              component: () => import('../views/payment/PaymentDocs.vue'),
              meta: { tab: 'docs' }
            }
          ]
        }
      ]
    },

    // Routes using the Auth Layout (for public pages like login)
    {
      path: '/auth',
      component: AuthLayout,
      children: [
        {
          path: '',
          redirect: 'login'
        },
        {
          path: 'login',
          name: 'login',
          component: LoginView
        },
        {
          path: 'force-password-change',
          name: 'force-password-change',
          component: ForcePasswordChangeView,
          meta: { requiresAuth: true }
        },
        {
          path: 'forgot-password',
          name: 'forgot-password',
          component: () => import('../views/ForgotPasswordView.vue')
        },
        {
          path: 'reset-password/:token',
          name: 'reset-password',
          component: () => import('../views/ResetPasswordView.vue')
        }
      ]
    },

    // Register page (standalone, no layout wrapper)
    {
      path: '/auth/register',
      name: 'register',
      component: RegisterView
    },

    // Invite Accept (legacy - for old invite links)
    {
      path: '/invite/accept/:token',
      name: 'invite-accept',
      component: InviteAcceptView,
      meta: { public: true }
    },

    // Account Activation (public - no auth required)
    {
      path: '/activate/:token',
      name: 'activate-account',
      component: ActivateAccountView,
      meta: { public: true }
    },

    // Redirect shortcuts for auth routes
    {
      path: '/login',
      redirect: '/auth/login'
    },
    {
      path: '/register',
      redirect: '/auth/register'
    },
    {
      path: '/forgot-password',
      redirect: '/auth/forgot-password'
    },
    {
      path: '/reset-password/:token',
      redirect: to => `/auth/reset-password/${to.params.token}`
    },

    // Catch-all 404 route
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      redirect: '/dashboard'
    }
  ]
})

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  // Import stores inside beforeEach to ensure Pinia is initialized
  // This prevents "getActivePinia()" errors during HMR
  let authStore

  try {
    const { useAuthStore } = await import('@/stores/auth')
    authStore = useAuthStore()
  } catch {
    // Pinia not ready yet (initial load), allow navigation and let component handle auth
    routerLogger.warn('[Router Guard] Store not ready, allowing navigation')
    next()
    return
  }

  // Handle regular admin routes
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresPlatformAdmin = to.matched.some(record => record.meta.requiresPlatformAdmin)
  const requiresPartnerOrAdmin = to.matched.some(record => record.meta.requiresPartnerOrAdmin)
  const requiresPartner = to.matched.some(record => record.meta.requiresPartner)

  // Check authentication on first load
  if (authStore.token && !authStore.user) {
    await authStore.checkAuth()
  }

  // Check regular auth
  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login page if not authenticated
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (
    authStore.isAuthenticated &&
    authStore.forcePasswordChange &&
    to.name !== 'force-password-change'
  ) {
    // Force password change is required - redirect to password change page
    next({ name: 'force-password-change' })
  } else if (requiresPlatformAdmin && !authStore.isPlatformAdmin) {
    // Redirect to dashboard if not platform admin
    routerLogger.warn('Authorization failed: User is not a platform admin')
    next({ name: 'dashboard' })
  } else if (
    requiresPartnerOrAdmin &&
    !authStore.isPlatformAdmin &&
    authStore.accountType !== 'partner'
  ) {
    // Redirect to dashboard if not partner or platform admin
    routerLogger.warn('Authorization failed: User is not a partner or platform admin')
    next({ name: 'dashboard' })
  } else if (requiresPartner && authStore.accountType !== 'partner') {
    // Redirect to dashboard if not a partner user (partner-only routes)
    routerLogger.warn('Authorization failed: User is not a partner')
    next({ name: 'dashboard' })
  } else if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    // Redirect to dashboard if already logged in
    next({ name: 'dashboard' })
  } else {
    // Proceed to the route
    next()
  }
})

export default router
