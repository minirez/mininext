import apiClient from '@/services/api'

const BASE = '/pms/guests/hotels'

export const KBS_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  NOT_REQUIRED: 'not_required'
}

export const KBS_STATUS_INFO = {
  pending: { label: 'Bekliyor', color: 'amber', icon: 'pending' },
  sent: { label: 'Gonderildi', color: 'green', icon: 'check_circle' },
  failed: { label: 'Basarisiz', color: 'red', icon: 'error' },
  not_required: { label: 'Gerekli Degil', color: 'gray', icon: 'remove_circle' }
}

export const ID_TYPES = {
  TC_KIMLIK: 'tc_kimlik',
  PASSPORT: 'passport',
  DRIVING_LICENSE: 'driving_license',
  NATIONAL_ID: 'national_id',
  OTHER: 'other'
}

export const ID_TYPE_INFO = {
  tc_kimlik: { label: 'TC Kimlik', icon: 'badge' },
  passport: { label: 'Pasaport', icon: 'flight' },
  driving_license: { label: 'Ehliyet', icon: 'drive_eta' },
  national_id: { label: 'Ulusal Kimlik', icon: 'card_membership' },
  other: { label: 'Diger', icon: 'description' }
}

export const KBS_REQUIRED_FIELDS = {
  turkish: ['firstName', 'lastName', 'idNumber', 'dateOfBirth'],
  foreign: [
    'firstName',
    'lastName',
    'idNumber',
    'dateOfBirth',
    'nationality',
    'birthPlace',
    'fatherName',
    'motherName'
  ]
}

export const KBS_FIELD_LABELS = {
  firstName: 'Ad',
  lastName: 'Soyad',
  idNumber: 'Kimlik No',
  dateOfBirth: 'Dogum Tarihi',
  nationality: 'Uyruk',
  birthPlace: 'Dogum Yeri',
  fatherName: 'Baba Adi',
  motherName: 'Ana Adi',
  tcKimlikInvalid: 'TC Kimlik gecersiz (11 hane olmali)'
}

export const getPending = async (hotelId, params = {}) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/kbs/pending`, { params })
  return response.data
}

export const generateXML = async (hotelId, guestIds) => {
  const response = await apiClient.post(
    `${BASE}/${hotelId}/kbs/generate-xml`,
    { guestIds },
    { responseType: 'blob' }
  )
  return response.data
}

export const downloadXML = async (hotelId, guestIds) => {
  const blob = await generateXML(hotelId, guestIds)
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  link.download = `kbs_${dateStr}.xml`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const markAsSent = async (hotelId, guestIds, kbsReference = null) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/kbs/mark-sent`, {
    guestIds,
    kbsReference
  })
  return response.data
}

export const getReport = async (hotelId, params = {}) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/kbs/report`, { params })
  return response.data
}

export const updateGuestFields = async (hotelId, stayId, guestId, fields) => {
  const response = await apiClient.put(
    `${BASE}/${hotelId}/kbs/stays/${stayId}/guests/${guestId}`,
    fields
  )
  return response.data
}

export const testConnection = async hotelId => {
  const response = await apiClient.post(`${BASE}/${hotelId}/kbs/test-connection`)
  return response.data
}

export const sendToKBS = async (hotelId, data) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/kbs/send`, data)
  return response.data
}

export const sendStayToKBS = async (hotelId, data) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/kbs/send-stay`, data)
  return response.data
}

export const isTurkishCitizen = guest => {
  return guest.nationality === 'TR' || guest.idType === ID_TYPES.TC_KIMLIK
}

export const validateKBSFields = guest => {
  const isTurkish = isTurkishCitizen(guest)
  const requiredFields = isTurkish ? KBS_REQUIRED_FIELDS.turkish : KBS_REQUIRED_FIELDS.foreign
  const missingFields = []
  for (const field of requiredFields) {
    if (!guest[field]) missingFields.push(field)
  }
  if (isTurkish && guest.idNumber && !/^\d{11}$/.test(guest.idNumber)) {
    missingFields.push('tcKimlikInvalid')
  }
  return { isValid: missingFields.length === 0, missingFields, isTurkish }
}

export const getMissingFieldLabels = missingFields => {
  return missingFields.map(field => KBS_FIELD_LABELS[field] || field)
}

export const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR')
}

export default {
  KBS_STATUS,
  KBS_STATUS_INFO,
  ID_TYPES,
  ID_TYPE_INFO,
  KBS_REQUIRED_FIELDS,
  KBS_FIELD_LABELS,
  getPending,
  generateXML,
  downloadXML,
  markAsSent,
  getReport,
  updateGuestFields,
  testConnection,
  sendToKBS,
  sendStayToKBS,
  isTurkishCitizen,
  validateKBSFields,
  getMissingFieldLabels,
  formatDate
}
