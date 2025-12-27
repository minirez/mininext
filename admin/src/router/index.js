import {createRouter, createWebHistory} from 'vue-router'

// Import Layouts
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

// Lazy load components for better performance
const LoginView = () => import('../views/LoginView.vue')
const RegisterView = () => import('../views/RegisterView.vue')
const DashboardView = () => import('../views/DashboardView.vue')
const PartnersView = () => import('../views/PartnersView.vue')
const AgenciesView = () => import('../views/AgenciesView.vue')
const AgencyUsersView = () => import('../views/AgencyUsersView.vue')
const SiteManagementView = () => import('../views/SiteManagementView.vue')
const SiteSettingsView = () => import('../views/SiteSettingsView.vue')
const SitePagesView = () => import('../views/SitePagesView.vue')
const ProfileView = () => import('../views/ProfileView.vue')
const HotelsView = () => import('../views/HotelsView.vue')
const HotelDetailView = () => import('../views/HotelDetailView.vue')
const PlanningView = () => import('../views/PlanningView.vue')
const RoomTypeDetailView = () => import('../views/RoomTypeDetailView.vue')
const MarketDetailView = () => import('../views/MarketDetailView.vue')
const RegionManagementView = () => import('../views/admin/RegionManagementView.vue')

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		// Routes using the Default Layout (for authenticated users)
		{
			path: '/',
			component: DefaultLayout,
			meta: {requiresAuth: true},
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
					meta: {requiresPlatformAdmin: true}
				},
				{
					path: 'admin/regions',
					name: 'region-management',
					component: RegionManagementView,
					meta: {requiresPlatformAdmin: true}
				},
				{
					path: 'agencies',
					name: 'agencies',
					component: AgenciesView,
					meta: {requiresPartnerOrAdmin: true}
				},
				{
					path: 'agencies/:id/users',
					name: 'agency-users',
					component: AgencyUsersView,
					meta: {requiresPartnerOrAdmin: true}
				},
				{
					path: 'site-management',
					component: SiteManagementView,
					meta: {requiresPartnerOrAdmin: true},
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
						}
					]
				},
				{
					path: 'profile',
					name: 'profile',
					component: ProfileView
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
					name: 'planning',
					component: PlanningView,
					meta: { requiresPartnerOrAdmin: true }
				},
				{
					path: 'planning/hotels/:hotelId/room-types/new',
					name: 'room-type-new',
					component: RoomTypeDetailView,
					meta: { requiresPartnerOrAdmin: true }
				},
				{
					path: 'planning/hotels/:hotelId/room-types/:id',
					name: 'room-type-detail',
					component: RoomTypeDetailView,
					meta: { requiresPartnerOrAdmin: true }
				},
				{
					path: 'planning/hotels/:hotelId/markets/new',
					name: 'market-new',
					component: MarketDetailView,
					meta: { requiresPartnerOrAdmin: true }
				},
				{
					path: 'planning/hotels/:hotelId/markets/:id',
					name: 'market-detail',
					component: MarketDetailView,
					meta: { requiresPartnerOrAdmin: true }
				}
			]
		},

		// Routes using the Auth Layout (for public pages like login)
		{
			path: '/auth',
			component: AuthLayout,
			children: [
				{
					path: 'login',
					name: 'login',
					component: LoginView
				},
				{
					path: 'register',
					name: 'register',
					component: RegisterView
				}
			]
		},

		// Redirect /login directly to /auth/login for convenience
		{
			path: '/login',
			redirect: '/auth/login'
		},
		{
			path: '/register',
			redirect: '/auth/register'
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
import { useAuthStore } from '@/stores/auth'

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresPlatformAdmin = to.matched.some(record => record.meta.requiresPlatformAdmin)
  const requiresPartnerOrAdmin = to.matched.some(record => record.meta.requiresPartnerOrAdmin)

  // Check authentication on first load
  if (authStore.token && !authStore.user) {
    await authStore.checkAuth()
  }

  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login page if not authenticated
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (requiresPlatformAdmin && !authStore.isPlatformAdmin) {
    // Redirect to dashboard if not platform admin
    console.warn(`Authorization failed: User is not a platform admin`)
    next({ name: 'dashboard' })
  } else if (requiresPartnerOrAdmin && !authStore.isPlatformAdmin && authStore.accountType !== 'partner') {
    // Redirect to dashboard if not partner or platform admin
    console.warn(`Authorization failed: User is not a partner or platform admin`)
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
