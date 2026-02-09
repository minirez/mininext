import apiClient from '@/services/api'

const BASE = '/pms/frontdesk/hotels'

export const REPORT_TYPES = {
  OCCUPANCY: 'occupancy',
  ARRIVALS: 'arrivals',
  DEPARTURES: 'departures',
  IN_HOUSE: 'in_house',
  HOUSEKEEPING: 'housekeeping',
  REVENUE: 'revenue',
  SHIFTS: 'shifts',
  NATIONALITY: 'nationality',
  VIP_GUESTS: 'vip_guests'
}

export const REPORT_CATEGORIES = [
  {
    id: 'operational',
    label: 'Operasyonel',
    icon: 'analytics',
    color: 'blue',
    reports: [
      {
        type: REPORT_TYPES.OCCUPANCY,
        label: 'Doluluk Raporu',
        icon: 'hotel',
        description: 'Gunluk doluluk oranlari ve oda durumlari'
      },
      {
        type: REPORT_TYPES.ARRIVALS,
        label: 'Giris Raporu',
        icon: 'login',
        description: 'Bugunku ve gelecek girisler'
      },
      {
        type: REPORT_TYPES.DEPARTURES,
        label: 'Cikis Raporu',
        icon: 'logout',
        description: 'Bugunku ve gelecek cikislar'
      },
      {
        type: REPORT_TYPES.IN_HOUSE,
        label: 'Konaklayan Misafirler',
        icon: 'people',
        description: 'Su an otelde bulunan misafirler'
      },
      {
        type: REPORT_TYPES.HOUSEKEEPING,
        label: 'Housekeeping Raporu',
        icon: 'cleaning_services',
        description: 'Oda temizlik durumlari'
      }
    ]
  },
  {
    id: 'financial',
    label: 'Finansal',
    icon: 'payments',
    color: 'green',
    reports: [
      {
        type: REPORT_TYPES.REVENUE,
        label: 'Gelir Raporu',
        icon: 'trending_up',
        description: 'Gelir ve odeme analizleri'
      },
      {
        type: REPORT_TYPES.SHIFTS,
        label: 'Vardiya Raporu',
        icon: 'schedule',
        description: 'Kasa vardiya raporlari'
      }
    ]
  },
  {
    id: 'guest',
    label: 'Misafir',
    icon: 'person',
    color: 'purple',
    reports: [
      {
        type: REPORT_TYPES.NATIONALITY,
        label: 'Ulke Bazli Rapor',
        icon: 'public',
        description: 'Misafirlerin ulkelere gore dagilimi'
      },
      {
        type: REPORT_TYPES.VIP_GUESTS,
        label: 'VIP Misafirler',
        icon: 'workspace_premium',
        description: 'VIP misafir listesi ve istatistikleri'
      }
    ]
  }
]

export const getDashboardReport = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/reports/dashboard`)
  return response.data
}

export const getOccupancyReport = async (hotelId, params = {}) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/reports/occupancy`, { params })
  return response.data
}

export const getRoomTypeOccupancy = async (hotelId, date = null) => {
  const params = date ? { date } : {}
  const response = await apiClient.get(`${BASE}/${hotelId}/reports/occupancy/room-types`, {
    params
  })
  return response.data
}

export const getArrivalsReport = async (hotelId, params = {}) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/reports/arrivals`, { params })
  return response.data
}

export const getDeparturesReport = async (hotelId, params = {}) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/reports/departures`, { params })
  return response.data
}

export const getInHouseReport = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/reports/in-house`)
  return response.data
}

export const getRevenueReport = async (hotelId, params = {}) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/reports/revenue`, { params })
  return response.data
}

export const getShiftReport = async (hotelId, params = {}) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/reports/shifts`, { params })
  return response.data
}

export const getHousekeepingReport = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/reports/housekeeping`)
  return response.data
}

export const getNationalityReport = async (hotelId, params = {}) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/reports/guests/nationality`, { params })
  return response.data
}

export const getVipGuestsReport = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/reports/guests/vip`)
  return response.data
}

export const formatCurrency = (amount, currency = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount || 0)
}

export const formatPercentage = value => `%${parseFloat(value || 0).toFixed(1)}`

export const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export const getDateRange = period => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(today)
  const endDate = new Date(today)
  switch (period) {
    case 'today':
      break
    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1)
      endDate.setDate(endDate.getDate() - 1)
      break
    case 'this_week':
      startDate.setDate(startDate.getDate() - startDate.getDay())
      break
    case 'last_week':
      startDate.setDate(startDate.getDate() - startDate.getDay() - 7)
      endDate.setDate(endDate.getDate() - endDate.getDay() - 1)
      break
    case 'this_month':
      startDate.setDate(1)
      break
    case 'last_month':
      startDate.setMonth(startDate.getMonth() - 1)
      startDate.setDate(1)
      endDate.setDate(0)
      break
    case 'this_year':
      startDate.setMonth(0, 1)
      break
    case 'last_30_days':
      startDate.setDate(startDate.getDate() - 30)
      break
    case 'last_90_days':
      startDate.setDate(startDate.getDate() - 90)
      break
    default:
      break
  }
  const pad = n => String(n).padStart(2, '0')
  return {
    startDate: `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`,
    endDate: `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`
  }
}

export const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Bugun' },
  { value: 'yesterday', label: 'Dun' },
  { value: 'this_week', label: 'Bu Hafta' },
  { value: 'last_week', label: 'Gecen Hafta' },
  { value: 'this_month', label: 'Bu Ay' },
  { value: 'last_month', label: 'Gecen Ay' },
  { value: 'last_30_days', label: 'Son 30 Gun' },
  { value: 'last_90_days', label: 'Son 90 Gun' },
  { value: 'this_year', label: 'Bu Yil' },
  { value: 'custom', label: 'Ozel Tarih' }
]

export default {
  REPORT_TYPES,
  REPORT_CATEGORIES,
  DATE_RANGE_OPTIONS,
  getDashboardReport,
  getOccupancyReport,
  getRoomTypeOccupancy,
  getArrivalsReport,
  getDeparturesReport,
  getInHouseReport,
  getRevenueReport,
  getShiftReport,
  getHousekeepingReport,
  getNationalityReport,
  getVipGuestsReport,
  formatCurrency,
  formatPercentage,
  formatDate,
  getDateRange
}
