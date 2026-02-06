/**
 * Widget Router
 * Memory-based router for modal navigation (URL doesn't change)
 */

import { createRouter, createMemoryHistory } from 'vue-router'

// Lazy load views
const SearchView = () => import('../views/SearchView.vue')
const RoomsView = () => import('../views/RoomsView.vue')
const GuestsView = () => import('../views/GuestsView.vue')
const PaymentView = () => import('../views/PaymentView.vue')
const ConfirmationView = () => import('../views/ConfirmationView.vue')
const MyBookingView = () => import('../views/MyBookingView.vue')

const routes = [
  {
    path: '/',
    name: 'widget-search',
    component: SearchView,
    meta: {
      step: 1,
      titleKey: 'widget.steps.search',
      icon: 'calendar_month'
    }
  },
  {
    path: '/rooms',
    name: 'widget-rooms',
    component: RoomsView,
    meta: {
      step: 2,
      titleKey: 'widget.steps.rooms',
      icon: 'bed'
    }
  },
  {
    path: '/guests',
    name: 'widget-guests',
    component: GuestsView,
    meta: {
      step: 3,
      titleKey: 'widget.steps.guests',
      icon: 'person'
    }
  },
  {
    path: '/payment',
    name: 'widget-payment',
    component: PaymentView,
    meta: {
      step: 4,
      titleKey: 'widget.steps.payment',
      icon: 'credit_card'
    }
  },
  {
    path: '/confirmation/:bookingNumber?',
    name: 'widget-confirmation',
    component: ConfirmationView,
    meta: {
      step: 5,
      titleKey: 'widget.steps.confirmation',
      icon: 'check_circle'
    }
  },
  {
    path: '/my-booking',
    name: 'widget-my-booking',
    component: MyBookingView,
    meta: {
      step: 0,
      titleKey: 'widget.myBooking',
      icon: 'receipt_long'
    }
  }
]

export function createWidgetRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })

  return router
}

export { routes }
