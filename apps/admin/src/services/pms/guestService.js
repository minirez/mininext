import apiClient from '@/services/api'

const BASE = '/pms/guests/hotels'

export const VIP_LEVELS = {
  NONE: 'none',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum'
}

export const VIP_LEVEL_INFO = {
  none: { label: 'Standart', bgColor: 'bg-gray-100', textColor: 'text-gray-600', icon: 'person' },
  silver: {
    label: 'Silver',
    bgColor: 'bg-slate-200',
    textColor: 'text-slate-700',
    icon: 'star_half'
  },
  gold: { label: 'Gold', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', icon: 'star' },
  platinum: {
    label: 'Platinum',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    icon: 'workspace_premium'
  }
}

export const ID_TYPES = [
  { value: 'tc_kimlik', label: 'TC Kimlik' },
  { value: 'passport', label: 'Pasaport' },
  { value: 'driving_license', label: 'Ehliyet' },
  { value: 'national_id', label: 'Ulusal Kimlik' },
  { value: 'other', label: 'Diger' }
]

export const TITLE_OPTIONS = [
  { value: 'mr', label: 'Bay' },
  { value: 'mrs', label: 'Bayan' },
  { value: 'ms', label: 'Bn.' },
  { value: 'miss', label: 'Bayan' },
  { value: 'dr', label: 'Dr.' },
  { value: 'prof', label: 'Prof.' }
]

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Erkek' },
  { value: 'female', label: 'Kadin' },
  { value: 'other', label: 'Diger' },
  { value: 'prefer_not_to_say', label: 'Belirtmek Istemiyor' }
]

export const COMMON_TAGS = [
  'VIP',
  'Business',
  'Tatilci',
  'Aile',
  'Cift',
  'Solo',
  'Uzun Sureli',
  'Sadik Misafir',
  'Sikayet',
  'Odul'
]

const guestService = {
  async getGuests(hotelId, params = {}) {
    const response = await apiClient.get(`${BASE}/${hotelId}/guests`, { params })
    return response.data
  },
  async getGuest(hotelId, guestId) {
    const response = await apiClient.get(`${BASE}/${hotelId}/guests/${guestId}`)
    return response.data
  },
  async getStats(hotelId) {
    const response = await apiClient.get(`${BASE}/${hotelId}/guests/stats`)
    return response.data
  },
  async getVipGuests(hotelId) {
    const response = await apiClient.get(`${BASE}/${hotelId}/guests/vip`)
    return response.data
  },
  async getBlacklistedGuests(hotelId) {
    const response = await apiClient.get(`${BASE}/${hotelId}/guests/blacklisted`)
    return response.data
  },
  async getRecentGuests(hotelId, days = 30) {
    const response = await apiClient.get(`${BASE}/${hotelId}/guests/recent`, { params: { days } })
    return response.data
  },
  async create(hotelId, data) {
    const response = await apiClient.post(`${BASE}/${hotelId}/guests`, data)
    return response.data
  },
  async update(hotelId, guestId, data) {
    const response = await apiClient.put(`${BASE}/${hotelId}/guests/${guestId}`, data)
    return response.data
  },
  async delete(hotelId, guestId) {
    const response = await apiClient.delete(`${BASE}/${hotelId}/guests/${guestId}`)
    return response.data
  },
  async setVipLevel(hotelId, guestId, vipLevel) {
    const response = await apiClient.patch(`${BASE}/${hotelId}/guests/${guestId}/vip`, { vipLevel })
    return response.data
  },
  async blacklist(hotelId, guestId, reason) {
    const response = await apiClient.post(`${BASE}/${hotelId}/guests/${guestId}/blacklist`, {
      reason
    })
    return response.data
  },
  async removeFromBlacklist(hotelId, guestId) {
    const response = await apiClient.delete(`${BASE}/${hotelId}/guests/${guestId}/blacklist`)
    return response.data
  },
  async addNote(hotelId, guestId, data) {
    const response = await apiClient.post(`${BASE}/${hotelId}/guests/${guestId}/notes`, data)
    return response.data
  },
  async deleteNote(hotelId, guestId, noteId) {
    const response = await apiClient.delete(`${BASE}/${hotelId}/guests/${guestId}/notes/${noteId}`)
    return response.data
  },
  async updateTags(hotelId, guestId, tags) {
    const response = await apiClient.patch(`${BASE}/${hotelId}/guests/${guestId}/tags`, { tags })
    return response.data
  },
  async getStayHistory(hotelId, guestId, params = {}) {
    const response = await apiClient.get(`${BASE}/${hotelId}/guests/${guestId}/stays`, { params })
    return response.data
  },
  async merge(hotelId, primaryGuestId, secondaryGuestId) {
    const response = await apiClient.post(`${BASE}/${hotelId}/guests/merge`, {
      primaryGuestId,
      secondaryGuestId
    })
    return response.data
  }
}

export default guestService
