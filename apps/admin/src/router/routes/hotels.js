// Hotel & Planning Routes
import { h } from 'vue'

// Empty component for tab-based routes (parent handles rendering)
const EmptyRouteView = { render: () => h('div') }

const HotelsView = () => import('@/views/HotelsView.vue')
const HotelDetailView = () => import('@/views/HotelDetailView.vue')
const PlanningView = () => import('@/views/PlanningView.vue')
const RoomTypeDetailView = () => import('@/views/RoomTypeDetailView.vue')
const MarketDetailView = () => import('@/views/MarketDetailView.vue')

export default [
  {
    path: 'hotels',
    name: 'hotels',
    component: HotelsView,
    meta: { requiresPartnerOrAdmin: true, requiredPermission: 'hotels' }
  },
  {
    path: 'hotels/new',
    name: 'hotel-new',
    component: HotelDetailView,
    meta: { requiresPartnerOrAdmin: true, requiredPermission: 'hotels' }
  },
  {
    path: 'hotels/:id',
    name: 'hotel-detail',
    component: HotelDetailView,
    meta: { requiresPartnerOrAdmin: true, requiredPermission: 'hotels' }
  },
  {
    path: 'planning',
    component: PlanningView,
    meta: { requiresPartnerOrAdmin: true, requiredPermission: 'planning' },
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
  }
]
