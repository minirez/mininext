import apiClient from '@/services/api'

const BASE = '/pms/frontdesk/hotels'

export const STAY_STATUS = {
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  NO_SHOW: 'no_show',
  CANCELLED: 'cancelled'
}

export const STAY_STATUS_INFO = {
  checked_in: { label: 'Aktif', color: 'green', bgClass: 'bg-green-500' },
  checked_out: { label: 'Cikti', color: 'gray', bgClass: 'bg-gray-400' },
  no_show: { label: 'Gelmedi', color: 'red', bgClass: 'bg-red-400' },
  cancelled: { label: 'Iptal', color: 'gray', bgClass: 'bg-gray-300' }
}

export const RESERVATION_STATUS_INFO = {
  confirmed: { label: 'Onaylandi', color: 'blue', bgClass: 'bg-blue-400' },
  pending: { label: 'Bekliyor', color: 'amber', bgClass: 'bg-amber-400' }
}

export const ZOOM_LEVELS = {
  DAY: { name: 'day', label: 'Gun', daysVisible: 14, cellWidth: 80 },
  WEEK: { name: 'week', label: 'Hafta', daysVisible: 28, cellWidth: 40 },
  MONTH: { name: 'month', label: 'Ay', daysVisible: 42, cellWidth: 25 }
}

export const getRoomsWithOccupancy = async (hotelId, params = {}) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/room-plan`, { params })
  return response.data
}

export const changeStayDates = async (hotelId, stayId, data) => {
  const response = await apiClient.put(`${BASE}/${hotelId}/room-plan/stays/${stayId}/dates`, data)
  return response.data
}

export const moveStayToRoom = async (hotelId, stayId, data) => {
  const response = await apiClient.put(`${BASE}/${hotelId}/room-plan/stays/${stayId}/room`, data)
  return response.data
}

export const checkRoomAvailability = async (hotelId, roomId, params) => {
  const response = await apiClient.get(
    `${BASE}/${hotelId}/room-plan/rooms/${roomId}/availability`,
    { params }
  )
  return response.data
}

export const dateToPixel = (date, startDate, cellWidth) => {
  const d = new Date(date)
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((d - start) / (1000 * 60 * 60 * 24))
  return diffDays * cellWidth
}

export const pixelToDate = (pixel, startDate, cellWidth) => {
  const days = Math.floor(pixel / cellWidth)
  const date = new Date(startDate)
  date.setDate(date.getDate() + days)
  return date
}

export const getBarWidth = (checkIn, checkOut, cellWidth) => {
  const inDate = new Date(checkIn)
  const outDate = new Date(checkOut)
  const nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24))
  return Math.max(nights * cellWidth - 4, cellWidth - 4)
}

export const getBarPosition = (checkIn, startDate, cellWidth) => {
  return dateToPixel(checkIn, startDate, cellWidth) + 2
}

export const generateDateArray = (startDate, daysCount) => {
  const dates = []
  const current = new Date(startDate)
  for (let i = 0; i < daysCount; i++) {
    dates.push({
      date: new Date(current),
      dayOfWeek: current.getDay(),
      dayOfMonth: current.getDate(),
      month: current.getMonth(),
      year: current.getFullYear(),
      isToday: isToday(current),
      isWeekend: current.getDay() === 0 || current.getDay() === 6
    })
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export const isToday = date => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export const formatDate = (date, format = 'short') => {
  const d = new Date(date)
  if (format === 'day') return d.getDate().toString()
  if (format === 'short') return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export const getDayName = dayOfWeek => {
  const days = ['Paz', 'Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt']
  return days[dayOfWeek]
}

export const getMonthName = month => {
  const months = [
    'Ocak',
    'Subat',
    'Mart',
    'Nisan',
    'Mayis',
    'Haziran',
    'Temmuz',
    'Agustos',
    'Eylul',
    'Ekim',
    'Kasim',
    'Aralik'
  ]
  return months[month]
}

export const getBarColorClass = item => {
  if (item.isVip) return 'bg-amber-500 dark:bg-amber-600'
  if (item.type === 'reservation')
    return RESERVATION_STATUS_INFO[item.status]?.bgClass || 'bg-blue-400'
  if (item.paymentStatus === 'pending') return 'bg-red-400 dark:bg-red-500'
  return STAY_STATUS_INFO[item.status]?.bgClass || 'bg-green-500'
}

export default {
  STAY_STATUS,
  STAY_STATUS_INFO,
  RESERVATION_STATUS_INFO,
  ZOOM_LEVELS,
  getRoomsWithOccupancy,
  changeStayDates,
  moveStayToRoom,
  checkRoomAvailability,
  dateToPixel,
  pixelToDate,
  getBarWidth,
  getBarPosition,
  generateDateArray,
  isToday,
  formatDate,
  getDayName,
  getMonthName,
  getBarColorClass
}
