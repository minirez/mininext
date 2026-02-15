import { createRouter, createWebHistory } from 'vue-router'
import { routerLogger } from '@/utils/logger'

// Import Layouts
import DefaultLayout from '@/layouts/DefaultLayout.vue'

// Import modular route files
import adminRoutes from './routes/admin.js'
import { authLayoutRoutes, standaloneAuthRoutes, authRedirects } from './routes/auth.js'
import bookingRoutes from './routes/booking.js'
import tourRoutes from './routes/tours.js'
import paymentRoutes from './routes/payment.js'
import hotelRoutes from './routes/hotels.js'
import siteRoutes from './routes/site.js'
import pmsRoutes from './routes/pms.js'

// Lazy load components for standalone routes
const DashboardView = () => import('../views/DashboardView.vue')
const PartnersView = () => import('../views/PartnersView.vue')
const PartnerSubscriptionsView = () => import('../views/partners/SubscriptionsView.vue')
const MembershipServicesView = () => import('../views/membership/ServicesView.vue')
const MembershipPackagesView = () => import('../views/membership/PackagesView.vue')
const AgenciesView = () => import('../views/AgenciesView.vue')
const AgencyUsersView = () => import('../views/AgencyUsersView.vue')
const ProfileView = () => import('../views/ProfileView.vue')
const DevelopersView = () => import('../views/DevelopersView.vue')
const UIShowcaseView = () => import('../views/UIShowcaseView.vue')
const UsersView = () => import('../views/UsersView.vue')
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
          path: 'partners/subscriptions',
          name: 'partner-subscriptions',
          component: PartnerSubscriptionsView,
          meta: { requiresPlatformAdmin: true }
        },
        {
          path: 'partners/services',
          name: 'partner-services',
          component: MembershipServicesView,
          meta: { requiresPlatformAdmin: true, titleKey: 'membership.services.title' }
        },
        {
          path: 'partners/packages',
          name: 'partner-packages',
          component: MembershipPackagesView,
          meta: { requiresPlatformAdmin: true, titleKey: 'membership.packages.title' }
        },
        {
          path: 'agencies',
          name: 'agencies',
          component: AgenciesView,
          meta: { requiresPartnerOrAdmin: true, requiredPermission: 'agencies' }
        },
        {
          path: 'agencies/:id/users',
          name: 'agency-users',
          component: AgencyUsersView,
          meta: { requiresPartnerOrAdmin: true, requiredPermission: 'agencies' }
        },
        {
          path: 'users',
          name: 'users',
          component: UsersView,
          meta: {
            requiresAuth: true,
            titleKey: 'users.title',
            requiredPermission: 'users'
          }
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
          path: 'developers',
          name: 'developers',
          component: DevelopersView,
          meta: { requiresPartnerOrAdmin: true, requiredPermission: 'settings' }
        },
        // PMS Integration (legacy - redirect to PMS dashboard)
        {
          path: 'pms-integration',
          name: 'pms-integration',
          redirect: '/pms/dashboard'
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
        // My Membership (for partner users only)
        {
          path: 'my-membership',
          name: 'my-membership',
          component: () => import('../views/MyMembershipView.vue'),
          meta: {
            requiresPartner: true,
            titleKey: 'membership.myMembership.title'
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
        // Modular routes
        ...adminRoutes,
        ...bookingRoutes,
        ...tourRoutes,
        ...hotelRoutes,
        ...siteRoutes,
        ...paymentRoutes,
        ...pmsRoutes
      ]
    },

    // Routes using the Auth Layout (for public pages like login)
    authLayoutRoutes,

    // Standalone auth routes
    ...standaloneAuthRoutes,

    // Auth redirects
    ...authRedirects,

    // Catch-all 404 route
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      redirect: '/dashboard'
    }
  ]
})

// Helper function to check module permission
function hasModulePermission(authStore, module) {
  // Platform admins and admin role users have all permissions
  if (authStore.isPlatformAdmin || authStore.user?.role === 'admin') {
    return true
  }

  // Check user's permissions array
  const permissions = authStore.user?.permissions || []
  const permission = permissions.find(p => p.module === module)
  return permission?.actions?.view === true
}

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

  // Force Mini theme on auth/public pages (no component lifecycle needed)
  if (typeof document !== 'undefined') {
    const isMiniThemeRoute =
      to.path === '/auth' ||
      to.path.startsWith('/auth/') ||
      to.path.startsWith('/activate/') ||
      to.path.startsWith('/invite/accept/')

    if (isMiniThemeRoute) {
      document.documentElement.dataset.theme = 'mini'
    } else {
      // Restore selected theme for all other routes
      try {
        const { useThemeStore } = await import('@/stores/theme')
        const themeStore = useThemeStore()
        document.documentElement.dataset.theme = themeStore.themeId
      } catch {
        // ignore (theme store not ready)
      }
    }
  }

  // Handle regular admin routes
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresPlatformAdmin = to.matched.some(record => record.meta.requiresPlatformAdmin)
  const requiresPartnerOrAdmin = to.matched.some(record => record.meta.requiresPartnerOrAdmin)
  const requiresPartner = to.matched.some(record => record.meta.requiresPartner)

  // Get required permission from route meta (check all matched routes)
  const requiredPermission = to.matched.find(record => record.meta.requiredPermission)?.meta
    .requiredPermission

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
  } else if (requiredPermission && !hasModulePermission(authStore, requiredPermission)) {
    // Check module-level permission
    routerLogger.warn(
      `Authorization failed: User does not have permission for module '${requiredPermission}'`
    )
    next({ name: 'dashboard' })
  } else if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    // Redirect to dashboard if already logged in
    next({ name: 'dashboard' })
  } else {
    // Auto-manage PMS mode based on route
    const isPmsRoute = to.matched.some(record => record.meta.isPmsRoute)
    if (isPmsRoute) {
      try {
        const { usePmsStore } = await import('@/stores/pms')
        const pmsStore = usePmsStore()
        if (!pmsStore.isPmsMode) {
          pmsStore.enterPmsMode()
        }
      } catch {
        // PMS store not ready
      }
    }
    // Proceed to the route
    next()
  }
})

export default router
