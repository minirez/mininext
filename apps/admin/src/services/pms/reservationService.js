import apiClient from '@/services/api'

const BASE = '/pms/reservations/hotels'

export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  NO_SHOW: 'no_show'
}

export const RESERVATION_STATUS_INFO = {
  pending: {
    label: 'Bekliyor',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    darkBgColor: 'dark:bg-yellow-900/30',
    darkTextColor: 'dark:text-yellow-300',
    icon: 'pending'
  },
  confirmed: {
    label: 'Onaylandi',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    darkBgColor: 'dark:bg-green-900/30',
    darkTextColor: 'dark:text-green-300',
    icon: 'check_circle'
  },
  cancelled: {
    label: 'Iptal',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    darkBgColor: 'dark:bg-red-900/30',
    darkTextColor: 'dark:text-red-300',
    icon: 'cancel'
  },
  completed: {
    label: 'Tamamlandi',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    darkBgColor: 'dark:bg-blue-900/30',
    darkTextColor: 'dark:text-blue-300',
    icon: 'task_alt'
  },
  no_show: {
    label: 'Gelmedi',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    darkBgColor: 'dark:bg-gray-700',
    darkTextColor: 'dark:text-gray-300',
    icon: 'person_off'
  },
  checked_in: {
    label: 'Giris Yapti',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    darkBgColor: 'dark:bg-emerald-900/30',
    darkTextColor: 'dark:text-emerald-300',
    icon: 'login'
  },
  checked_out: {
    label: 'Cikis Yapti',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-800',
    darkBgColor: 'dark:bg-slate-700',
    darkTextColor: 'dark:text-slate-300',
    icon: 'logout'
  }
}

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded'
}

export const PAYMENT_STATUS_INFO = {
  pending: { label: 'Odeme Bekleniyor', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  partial: { label: 'Kismi Odeme', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  paid: { label: 'Odendi', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  refunded: { label: 'Iade Edildi', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
}

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Nakit' },
  { value: 'credit_card', label: 'Kredi Karti' },
  { value: 'bank_transfer', label: 'Havale/EFT' },
  { value: 'online', label: 'Online Odeme' },
  { value: 'agency_credit', label: 'Acenta Kredisi' }
]

export const BOOKING_SOURCES = {
  'booking-engine': { label: 'Web', icon: 'public' },
  b2c: { label: 'B2C Web', icon: 'public' },
  b2b: { label: 'B2B / Acenta', icon: 'business' },
  admin: { label: 'Staff', icon: 'admin_panel_settings' },
  staff: { label: 'Staff', icon: 'admin_panel_settings' },
  api: { label: 'API', icon: 'api' },
  channel: { label: 'Kanal', icon: 'hub' },
  direct: { label: 'Direkt', icon: 'storefront' },
  'walk-in': { label: 'Walk-in', icon: 'directions_walk' },
  walkin: { label: 'Walk-in', icon: 'directions_walk' },
  phone: { label: 'Telefon', icon: 'phone' },
  email: { label: 'E-posta', icon: 'email' },
  'booking.com': { label: 'Booking.com', icon: 'travel_explore' },
  bookingcom: { label: 'Booking.com', icon: 'travel_explore' },
  expedia: { label: 'Expedia', icon: 'travel_explore' },
  airbnb: { label: 'Airbnb', icon: 'house' },
  agoda: { label: 'Agoda', icon: 'travel_explore' },
  trivago: { label: 'Trivago', icon: 'travel_explore' },
  hotels: { label: 'Hotels.com', icon: 'travel_explore' }
}

const reservationService = {
  async getReservations(hotelId, params = {}) {
    const response = await apiClient.get(`${BASE}/${hotelId}/reservations`, { params })
    return response.data
  },
  async getReservationsByDateRange(hotelId, startDate, endDate) {
    const response = await apiClient.get(`${BASE}/${hotelId}/reservations/calendar`, {
      params: { startDate, endDate }
    })
    return response.data
  },
  async getTodayArrivals(hotelId) {
    const response = await apiClient.get(`${BASE}/${hotelId}/reservations/arrivals`)
    return response.data
  },
  async getTodayDepartures(hotelId) {
    const response = await apiClient.get(`${BASE}/${hotelId}/reservations/departures`)
    return response.data
  },
  async getStats(hotelId) {
    const response = await apiClient.get(`${BASE}/${hotelId}/reservations/stats`)
    return response.data
  },
  async getReservation(hotelId, reservationId) {
    const response = await apiClient.get(`${BASE}/${hotelId}/reservations/${reservationId}`)
    return response.data
  },
  async create(hotelId, data) {
    const response = await apiClient.post(`${BASE}/${hotelId}/reservations`, data)
    return response.data
  },
  async update(hotelId, reservationId, data) {
    const response = await apiClient.put(`${BASE}/${hotelId}/reservations/${reservationId}`, data)
    return response.data
  },
  async confirm(hotelId, reservationId) {
    const response = await apiClient.post(
      `${BASE}/${hotelId}/reservations/${reservationId}/confirm`
    )
    return response.data
  },
  async cancel(hotelId, reservationId, data) {
    const response = await apiClient.post(
      `${BASE}/${hotelId}/reservations/${reservationId}/cancel`,
      data
    )
    return response.data
  },
  async markNoShow(hotelId, reservationId) {
    const response = await apiClient.post(
      `${BASE}/${hotelId}/reservations/${reservationId}/no-show`
    )
    return response.data
  },
  async addNote(hotelId, reservationId, data) {
    const response = await apiClient.post(
      `${BASE}/${hotelId}/reservations/${reservationId}/notes`,
      data
    )
    return response.data
  },
  async addPayment(hotelId, reservationId, data) {
    const response = await apiClient.post(
      `${BASE}/${hotelId}/reservations/${reservationId}/payments`,
      data
    )
    return response.data
  }
}

export default reservationService
