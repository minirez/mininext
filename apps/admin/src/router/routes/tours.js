// Tour Module Routes
const TourListView = () => import('@/views/tours/TourListView.vue')
const TourDetailView = () => import('@/views/tours/TourDetailView.vue')
const TourDepartureListView = () => import('@/views/tours/TourDepartureListView.vue')
const TourExtraListView = () => import('@/views/tours/TourExtraListView.vue')
const TourBookingListView = () => import('@/views/tours/TourBookingListView.vue')
const TourBookingDetailView = () => import('@/views/tours/TourBookingDetailView.vue')

export default [
  {
    path: 'tours',
    name: 'tours',
    component: TourListView,
    meta: {
      requiresPartnerOrAdmin: true,
      titleKey: 'tour.title',
      descriptionKey: 'tour.description',
      requiredPermission: 'booking'
    }
  },
  {
    path: 'tours/new',
    name: 'tour-new',
    component: TourDetailView,
    props: { id: 'new' },
    meta: {
      requiresPartnerOrAdmin: true,
      titleKey: 'tour.newTour',
      descriptionKey: 'tour.description',
      requiredPermission: 'booking'
    }
  },
  {
    path: 'tours/departures',
    name: 'tour-departures',
    component: TourDepartureListView,
    meta: {
      requiresPartnerOrAdmin: true,
      titleKey: 'departure.title',
      descriptionKey: 'departure.calendar',
      requiredPermission: 'booking'
    }
  },
  {
    path: 'tours/extras',
    name: 'tour-extras',
    component: TourExtraListView,
    meta: {
      requiresPartnerOrAdmin: true,
      titleKey: 'extra.title',
      descriptionKey: 'extra.extras',
      requiredPermission: 'booking'
    }
  },
  {
    path: 'tours/bookings',
    name: 'tour-bookings',
    component: TourBookingListView,
    meta: {
      requiresPartnerOrAdmin: true,
      titleKey: 'tourBooking.title',
      descriptionKey: 'tourBooking.bookings',
      requiredPermission: 'booking'
    }
  },
  {
    path: 'tours/bookings/new',
    name: 'tour-booking-new',
    component: () => import('@/views/tours/TourBookingWizardView.vue'),
    meta: {
      requiresPartnerOrAdmin: true,
      titleKey: 'wizard.title',
      descriptionKey: 'tourBooking.newBooking',
      requiredPermission: 'booking'
    }
  },
  {
    path: 'tours/bookings/:id',
    name: 'tour-booking-detail',
    component: TourBookingDetailView,
    meta: {
      requiresPartnerOrAdmin: true,
      titleKey: 'tourBooking.bookingDetails',
      descriptionKey: 'tourBooking.bookings',
      requiredPermission: 'booking'
    }
  },
  {
    path: 'tours/:id',
    name: 'tour-detail',
    component: TourDetailView,
    meta: {
      requiresPartnerOrAdmin: true,
      titleKey: 'tour.editTour',
      descriptionKey: 'tour.tourDetails',
      requiredPermission: 'booking'
    }
  },
  {
    path: 'tours/:id/departures',
    name: 'tour-departure-management',
    component: TourDepartureListView,
    meta: {
      requiresPartnerOrAdmin: true,
      titleKey: 'departure.title',
      descriptionKey: 'departure.departures',
      requiredPermission: 'booking'
    }
  }
]
