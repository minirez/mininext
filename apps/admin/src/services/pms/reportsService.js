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

// Labels are i18n keys - use t() to translate in components
export const REPORT_CATEGORIES = [
  {
    id: 'operational',
    labelKey: 'reports.categories.operational',
    icon: 'analytics',
    color: 'blue',
    reports: [
      {
        type: REPORT_TYPES.OCCUPANCY,
        labelKey: 'reports.types.occupancy',
        icon: 'hotel',
        descriptionKey: 'reports.descriptions.occupancy'
      },
      {
        type: REPORT_TYPES.ARRIVALS,
        labelKey: 'reports.types.arrivals',
        icon: 'login',
        descriptionKey: 'reports.descriptions.arrivals'
      },
      {
        type: REPORT_TYPES.DEPARTURES,
        labelKey: 'reports.types.departures',
        icon: 'logout',
        descriptionKey: 'reports.descriptions.departures'
      },
      {
        type: REPORT_TYPES.IN_HOUSE,
        labelKey: 'reports.types.inHouse',
        icon: 'people',
        descriptionKey: 'reports.descriptions.inHouse'
      },
      {
        type: REPORT_TYPES.HOUSEKEEPING,
        labelKey: 'reports.types.housekeeping',
        icon: 'cleaning_services',
        descriptionKey: 'reports.descriptions.housekeeping'
      }
    ]
  },
  {
    id: 'financial',
    labelKey: 'reports.categories.financial',
    icon: 'payments',
    color: 'green',
    reports: [
      {
        type: REPORT_TYPES.REVENUE,
        labelKey: 'reports.types.revenue',
        icon: 'trending_up',
        descriptionKey: 'reports.descriptions.revenue'
      },
      {
        type: REPORT_TYPES.SHIFTS,
        labelKey: 'reports.types.shifts',
        icon: 'schedule',
        descriptionKey: 'reports.descriptions.shifts'
      }
    ]
  },
  {
    id: 'guest',
    labelKey: 'reports.categories.guest',
    icon: 'person',
    color: 'purple',
    reports: [
      {
        type: REPORT_TYPES.NATIONALITY,
        labelKey: 'reports.types.nationality',
        icon: 'public',
        descriptionKey: 'reports.descriptions.nationality'
      },
      {
        type: REPORT_TYPES.VIP_GUESTS,
        labelKey: 'reports.types.vipGuests',
        icon: 'workspace_premium',
        descriptionKey: 'reports.descriptions.vipGuests'
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

// Date range options - values are i18n keys
export const DATE_RANGE_OPTIONS = [
  { value: 'today', labelKey: 'reports.dateRange.today' },
  { value: 'yesterday', labelKey: 'reports.dateRange.yesterday' },
  { value: 'this_week', labelKey: 'reports.dateRange.thisWeek' },
  { value: 'last_week', labelKey: 'reports.dateRange.lastWeek' },
  { value: 'this_month', labelKey: 'reports.dateRange.thisMonth' },
  { value: 'last_month', labelKey: 'reports.dateRange.lastMonth' },
  { value: 'last_30_days', labelKey: 'reports.dateRange.last30Days' },
  { value: 'last_90_days', labelKey: 'reports.dateRange.last90Days' },
  { value: 'this_year', labelKey: 'reports.dateRange.thisYear' },
  { value: 'custom', labelKey: 'reports.dateRange.custom' }
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
