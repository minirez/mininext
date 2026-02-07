// Booking Routes
const BookingListView = () => import('@/views/booking/BookingListView.vue')
const BookingWizardView = () => import('@/views/booking/BookingWizardView.vue')
const BookingDetailView = () => import('@/views/booking/BookingDetailView.vue')

export default [
  {
    path: 'bookings',
    name: 'bookings',
    component: BookingListView,
    meta: { requiresPartnerOrAdmin: true, requiredPermission: 'booking' }
  },
  {
    path: 'bookings/new',
    name: 'booking-new',
    component: BookingWizardView,
    meta: { requiresPartnerOrAdmin: true, requiredPermission: 'booking' }
  },
  {
    path: 'bookings/draft/:bookingNumber',
    name: 'booking-draft',
    component: BookingWizardView,
    meta: { requiresPartnerOrAdmin: true, requiredPermission: 'booking' }
  },
  {
    path: 'bookings/:id',
    name: 'booking-detail',
    component: BookingDetailView,
    meta: { requiresPartnerOrAdmin: true, requiredPermission: 'booking' }
  }
]
