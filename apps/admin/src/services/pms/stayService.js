import apiClient from '@/services/api'

const BASE = '/pms/frontdesk/hotels'

export const STAY_STATUS = {
  PENDING: 'pending',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  NO_SHOW: 'no_show',
  CANCELLED: 'cancelled'
}

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded'
}

export const GUEST_TYPE = {
  ADULT: 'adult',
  CHILD: 'child',
  INFANT: 'infant'
}

export const STAY_STATUS_INFO = {
  [STAY_STATUS.PENDING]: {
    label: 'Giriş Bekliyor',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    icon: 'schedule'
  },
  [STAY_STATUS.CHECKED_IN]: {
    label: 'Konaklıyor',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400',
    icon: 'hotel'
  },
  [STAY_STATUS.CHECKED_OUT]: {
    label: 'Çıkış Yaptı',
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: 'logout'
  },
  [STAY_STATUS.NO_SHOW]: {
    label: 'Gelmedi',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    icon: 'person_off'
  },
  [STAY_STATUS.CANCELLED]: {
    label: 'İptal',
    color: 'orange',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-700 dark:text-orange-400',
    icon: 'cancel'
  }
}

export const PAYMENT_STATUS_INFO = {
  [PAYMENT_STATUS.PENDING]: {
    label: 'Ödeme Bekliyor',
    color: 'amber',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400'
  },
  [PAYMENT_STATUS.PARTIAL]: {
    label: 'Kısmi Ödeme',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400'
  },
  [PAYMENT_STATUS.PAID]: {
    label: 'Ödendi',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400'
  },
  [PAYMENT_STATUS.REFUNDED]: {
    label: 'İade Edildi',
    color: 'purple',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-700 dark:text-purple-400'
  }
}

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Nakit' },
  { value: 'credit_card', label: 'Kredi Kartı' },
  { value: 'debit_card', label: 'Banka Kartı' },
  { value: 'bank_transfer', label: 'Havale/EFT' },
  { value: 'online', label: 'Online Ödeme' },
  { value: 'other', label: 'Diğer' }
]

export const EXTRA_CATEGORIES = [
  { value: 'minibar', label: 'Minibar' },
  { value: 'room_service', label: 'Oda Servisi' },
  { value: 'laundry', label: 'Çamaşırhane' },
  { value: 'spa', label: 'SPA' },
  { value: 'restaurant', label: 'Restoran' },
  { value: 'phone', label: 'Telefon' },
  { value: 'damage', label: 'Hasar' },
  { value: 'other', label: 'Diğer' }
]

export const getStays = async (hotelId, params = {}) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/stays`, { params })
  return response.data
}

export const getStay = async (hotelId, stayId) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/stays/${stayId}`)
  return response.data
}

export const getFrontDeskStats = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/stays/stats`)
  return response.data
}

export const getTodayActivity = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/stays/today`)
  return response.data
}

export const getActiveStays = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/stays/active`)
  return response.data
}

export const getAvailableRooms = async (hotelId, params = {}) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/stays/available-rooms`, { params })
  return response.data
}

export const walkInCheckIn = async (hotelId, data) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/stays/walk-in`, data)
  return response.data
}

export const checkInFromBooking = async (hotelId, data) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/stays/check-in`, data)
  return response.data
}

export const checkInFromStay = async (hotelId, stayId, data) => {
  const response = await apiClient.patch(`${BASE}/${hotelId}/stays/${stayId}/check-in`, data)
  return response.data
}

export const checkOut = async (hotelId, stayId, data = {}) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/stays/${stayId}/check-out`, data)
  return response.data
}

export const addExtra = async (hotelId, stayId, data) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/stays/${stayId}/extras`, data)
  return response.data
}

export const addPayment = async (hotelId, stayId, data) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/stays/${stayId}/payments`, data)
  return response.data
}

export const changeRoom = async (hotelId, stayId, data) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/stays/${stayId}/change-room`, data)
  return response.data
}

export const extendStay = async (hotelId, stayId, data) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/stays/${stayId}/extend`, data)
  return response.data
}

export const updateNotes = async (hotelId, stayId, data) => {
  const response = await apiClient.patch(`${BASE}/${hotelId}/stays/${stayId}/notes`, data)
  return response.data
}

export default {
  getStays,
  getStay,
  getFrontDeskStats,
  getTodayActivity,
  getActiveStays,
  getAvailableRooms,
  walkInCheckIn,
  checkInFromBooking,
  checkInFromStay,
  checkOut,
  addExtra,
  addPayment,
  changeRoom,
  extendStay,
  updateNotes,
  STAY_STATUS,
  PAYMENT_STATUS,
  GUEST_TYPE,
  STAY_STATUS_INFO,
  PAYMENT_STATUS_INFO,
  PAYMENT_METHODS,
  EXTRA_CATEGORIES
}
