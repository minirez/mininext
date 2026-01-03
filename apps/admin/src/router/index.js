import { createRouter, createWebHistory } from 'vue-router'
import { h } from 'vue'

// Empty component for tab-based routes (parent handles rendering)
const EmptyRouteView = { render: () => h('div') }

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
const SiteEmailSetupView = () => import('../views/SiteEmailSetupView.vue')
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
const DevelopersView = () => import('../views/DevelopersView.vue')
const UIShowcaseView = () => import('../views/UIShowcaseView.vue')
const BookingListView = () => import('../views/booking/BookingListView.vue')
const BookingWizardView = () => import('../views/booking/BookingWizardView.vue')
const BookingDetailView = () => import('../views/booking/BookingDetailView.vue')


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
				// PMS Routes - uses DefaultLayout with PMSNavigation wrapper
				{
					path: 'pms',
					component: () => import('../layouts/PMSLayout.vue'),
					meta: { requiresPartnerOrAdmin: true },
					children: [
						{
							path: '',
							redirect: '/pms/dashboard'
						},
						{
							path: 'dashboard',
							name: 'pms-dashboard',
							component: () => import('../modules/dashboard/views/DashboardView.vue')
						},
						{
							path: 'reservations',
							name: 'pms-reservations',
							component: () => import('../modules/reservations/views/ReservationsView.vue')
						},
						{
							path: 'front-desk',
							name: 'pms-front-desk',
							component: () => import('../modules/frontdesk/views/FrontDeskView.vue')
						},
						{
							path: 'housekeeping',
							name: 'pms-housekeeping',
							component: () => import('../modules/housekeeping/views/HousekeepingView.vue')
						},
						{
							path: 'housekeeping-mobile',
							name: 'pms-housekeeping-mobile',
							component: () => import('../modules/housekeeping/views/HousekeepingMobileView.vue'),
							meta: { hideLayout: true } // Full screen mobile view
						},
						{
							path: 'guests',
							name: 'pms-guests',
							component: () => import('../modules/guests/views/GuestsView.vue')
						},
						{
							path: 'billing',
							name: 'pms-billing',
							component: () => import('../modules/billing/views/BillingView.vue')
						},
						{
							path: 'cashier',
							name: 'pms-cashier',
							component: () => import('../modules/billing/views/CashierView.vue')
						},
						{
							path: 'reports',
							name: 'pms-reports',
							component: () => import('../modules/reports/views/ReportsView.vue')
						},
						{
							path: 'settings',
							name: 'pms-settings',
							component: () => import('../modules/settings/views/SettingsView.vue')
						},
						{
							path: 'users',
							name: 'pms-users',
							component: () => import('../modules/settings/views/UsersView.vue')
						},
						{
							path: 'night-audit',
							name: 'pms-night-audit',
							component: () => import('../modules/billing/views/NightAuditView.vue')
						},
						{
							path: 'night-audit/history/:auditId',
							name: 'pms-night-audit-detail',
							component: () => import('../modules/billing/views/NightAuditDetailView.vue')
						},
						{
							path: 'kbs',
							name: 'pms-kbs',
							component: () => import('../modules/guests/views/KBSView.vue')
						},
						{
							path: 'room-plan',
							name: 'pms-room-plan',
							component: () => import('../modules/frontdesk/views/RoomPlanView.vue')
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

		// PMS Login (public - no auth required)
		{
			path: '/pms/login',
			name: 'pms-login',
			component: () => import('../modules/auth/views/LoginView.vue'),
			meta: { public: true }
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

// Check if current domain is a PMS custom domain
const isPmsCustomDomain = () => {
	const hostname = window.location.hostname
	const defaultDomains = ['localhost', '127.0.0.1', 'admin.booking-engine.com', 'app.minires.com', 'minires.com']
	return !defaultDomains.some(d => hostname.includes(d))
}

// Navigation Guard
router.beforeEach(async (to, from, next) => {
	// Import stores inside beforeEach to ensure Pinia is initialized
	// This prevents "getActivePinia()" errors during HMR
	const { useAuthStore } = await import('@/stores/auth')
	const { usePmsAuthStore } = await import('@/stores/pms/pmsAuth')

	const authStore = useAuthStore()
	const pmsAuthStore = usePmsAuthStore()

	// If on custom PMS domain and trying to access non-PMS routes, redirect to PMS
	if (isPmsCustomDomain()) {
		const isPmsRoute = to.path.startsWith('/pms') || to.matched.some(record => record.path.includes('pms'))
		if (!isPmsRoute && to.name !== 'pms-login') {
			// Redirect non-PMS routes to PMS login on custom domains
			next({ name: 'pms-login' })
			return
		}
	}

	// Check if this is a PMS route
	const isPmsRoute = to.path.startsWith('/pms') || to.matched.some(record => record.path.includes('pms'))
	const isPublicRoute = to.matched.some(record => record.meta.public)

	// Handle regular admin routes (including PMS for partners)
	const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
	const requiresPlatformAdmin = to.matched.some(record => record.meta.requiresPlatformAdmin)
	const requiresPartnerOrAdmin = to.matched.some(record => record.meta.requiresPartnerOrAdmin)

	// Check authentication on first load
	if (authStore.token && !authStore.user) {
		await authStore.checkAuth()
	}

	// For PMS routes, check PMS authentication
	if (isPmsRoute && !isPublicRoute) {
		// Check PMS token on first load
		if (pmsAuthStore.token && !pmsAuthStore.user) {
			await pmsAuthStore.checkAuth()
		}

		// PMS routes can be accessed by PMS users OR platform admin/partner users
		const isPmsAuthenticated = pmsAuthStore.isAuthenticated
		const isAdminAuthenticated = authStore.isAuthenticated && (authStore.isPlatformAdmin || authStore.accountType === 'partner')

		console.log('[Router Guard] PMS Route:', to.path, {
			isPmsAuthenticated,
			isAdminAuthenticated,
			pmsToken: !!pmsAuthStore.token,
			pmsUser: !!pmsAuthStore.user,
			pmsCurrentHotel: !!pmsAuthStore.currentHotel
		})

		if (!isPmsAuthenticated && !isAdminAuthenticated) {
			console.log('[Router Guard] Redirecting to pms-login')
			// Redirect to PMS login page
			next({ name: 'pms-login', query: { redirect: to.fullPath } })
			return
		}
	}

	// For non-PMS routes, use regular auth check
	if (!isPmsRoute && requiresAuth && !authStore.isAuthenticated) {
		// Redirect to login page if not authenticated
		next({ name: 'login', query: { redirect: to.fullPath } })
	} else if (requiresPlatformAdmin && !authStore.isPlatformAdmin) {
		// Redirect to dashboard if not platform admin
		console.warn(`Authorization failed: User is not a platform admin`)
		next({ name: 'dashboard' })
	} else if (!isPmsRoute && requiresPartnerOrAdmin && !authStore.isPlatformAdmin && authStore.accountType !== 'partner') {
		// Redirect to dashboard if not partner or platform admin
		console.warn(`Authorization failed: User is not a partner or platform admin`)
		next({ name: 'dashboard' })
	} else if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
		// Redirect to dashboard if already logged in
		next({ name: 'dashboard' })
	} else if (to.name === 'pms-login' && pmsAuthStore.isAuthenticated) {
		// Redirect to PMS dashboard if already logged in to PMS
		next({ name: 'pms-dashboard' })
	} else {
		// Proceed to the route
		next()
	}
})

export default router
