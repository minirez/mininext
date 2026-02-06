/**
 * B2C Booking Widget Module
 *
 * This module provides an embeddable booking widget for hotel websites.
 *
 * Usage:
 * - Inline mode: <div id="minires-widget" data-hotel="hotelCode"></div>
 * - Floating mode: <script data-hotel="hotelCode" data-mode="floating" src="widget.js"></script>
 * - Fullpage mode: Direct navigation to widget URL
 */

// Main App
export { default as WidgetApp } from './WidgetApp.vue'

// Store
export { useWidgetStore } from './stores/widgetStore'

// Router
export { createWidgetRouter, routes as widgetRoutes } from './router'

// Composables
export { useWidgetApi, useWidgetTheme } from './composables'

// Components
export * from './components'

// Views
export { default as SearchView } from './views/SearchView.vue'
export { default as RoomsView } from './views/RoomsView.vue'
export { default as GuestsView } from './views/GuestsView.vue'
export { default as PaymentView } from './views/PaymentView.vue'
export { default as ConfirmationView } from './views/ConfirmationView.vue'
export { default as MyBookingView } from './views/MyBookingView.vue'
