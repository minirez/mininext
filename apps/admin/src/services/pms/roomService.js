import apiClient from '@/services/api'

const BASE = '/pms/housekeeping/hotels'

export const ROOM_STATUS = {
  VACANT_CLEAN: 'vacant_clean',
  VACANT_DIRTY: 'vacant_dirty',
  OCCUPIED: 'occupied',
  CHECKOUT: 'checkout',
  MAINTENANCE: 'maintenance',
  OUT_OF_ORDER: 'out_of_order',
  INSPECTED: 'inspected'
}

export const HOUSEKEEPING_STATUS = {
  CLEAN: 'clean',
  DIRTY: 'dirty',
  CLEANING: 'cleaning',
  INSPECTED: 'inspected'
}

export const HOUSEKEEPING_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
}

export const ROOM_STATUS_INFO = {
  [ROOM_STATUS.VACANT_CLEAN]: {
    label: 'Bos - Temiz',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400',
    icon: 'check_circle'
  },
  [ROOM_STATUS.VACANT_DIRTY]: {
    label: 'Bos - Kirli',
    color: 'amber',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    icon: 'cleaning_services'
  },
  [ROOM_STATUS.OCCUPIED]: {
    label: 'Dolu',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    icon: 'person'
  },
  [ROOM_STATUS.CHECKOUT]: {
    label: 'Cikis Yapildi',
    color: 'orange',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-700 dark:text-orange-400',
    icon: 'logout'
  },
  [ROOM_STATUS.MAINTENANCE]: {
    label: 'Bakimda',
    color: 'purple',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-700 dark:text-purple-400',
    icon: 'build'
  },
  [ROOM_STATUS.OUT_OF_ORDER]: {
    label: 'Kullanim Disi',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    icon: 'block'
  },
  [ROOM_STATUS.INSPECTED]: {
    label: 'Denetlendi',
    color: 'teal',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    textColor: 'text-teal-700 dark:text-teal-400',
    icon: 'verified'
  }
}

export const HOUSEKEEPING_STATUS_INFO = {
  [HOUSEKEEPING_STATUS.CLEAN]: {
    label: 'Temiz',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400'
  },
  [HOUSEKEEPING_STATUS.DIRTY]: {
    label: 'Kirli',
    color: 'amber',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400'
  },
  [HOUSEKEEPING_STATUS.CLEANING]: {
    label: 'Temizleniyor',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400'
  },
  [HOUSEKEEPING_STATUS.INSPECTED]: {
    label: 'Denetlendi',
    color: 'teal',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    textColor: 'text-teal-700 dark:text-teal-400'
  }
}

export const PRIORITY_INFO = {
  [HOUSEKEEPING_PRIORITY.LOW]: {
    label: 'Dusuk',
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    textColor: 'text-gray-700 dark:text-gray-300'
  },
  [HOUSEKEEPING_PRIORITY.NORMAL]: {
    label: 'Normal',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400'
  },
  [HOUSEKEEPING_PRIORITY.HIGH]: {
    label: 'Yuksek',
    color: 'amber',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400'
  },
  [HOUSEKEEPING_PRIORITY.URGENT]: {
    label: 'Acil',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400'
  }
}

export const getRoomTypes = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/room-types`)
  return response.data
}

export const createRoomType = async (hotelId, data) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/room-types`, data)
  return response.data
}

export const updateRoomType = async (hotelId, id, data) => {
  const response = await apiClient.patch(`${BASE}/${hotelId}/room-types/${id}`, data)
  return response.data
}

export const deleteRoomType = async (hotelId, id) => {
  const response = await apiClient.delete(`${BASE}/${hotelId}/room-types/${id}`)
  return response.data
}

export const getMealPlans = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/meal-plans`)
  return response.data
}

export const createMealPlan = async (hotelId, data) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/meal-plans`, data)
  return response.data
}

export const updateMealPlan = async (hotelId, id, data) => {
  const response = await apiClient.patch(`${BASE}/${hotelId}/meal-plans/${id}`, data)
  return response.data
}

export const deleteMealPlan = async (hotelId, id) => {
  const response = await apiClient.delete(`${BASE}/${hotelId}/meal-plans/${id}`)
  return response.data
}

export const getHousekeeping = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/housekeeping`)
  return response.data
}

export const getRooms = async (hotelId, filters = {}) => {
  const params = new URLSearchParams()
  if (filters.floor !== undefined) params.append('floor', filters.floor)
  if (filters.status) params.append('status', filters.status)
  if (filters.roomType) params.append('roomType', filters.roomType)
  if (filters.housekeepingStatus) params.append('housekeepingStatus', filters.housekeepingStatus)

  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await apiClient.get(`${BASE}/${hotelId}/rooms${query}`)
  return response.data
}

export const getRoom = async (hotelId, roomId) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/rooms/${roomId}`)
  return response.data
}

export const getRoomStatistics = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/rooms/statistics`)
  return response.data
}

export const getRoomsNeedingCleaning = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/rooms/needs-cleaning`)
  return response.data
}

export const getRoomsByFloor = async (hotelId, floor) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/rooms/floor/${floor}`)
  return response.data
}

export const createRoom = async (hotelId, data) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/rooms`, data)
  return response.data
}

export const createRoomsBulk = async (hotelId, rooms) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/rooms/bulk`, { rooms })
  return response.data
}

export const updateRoom = async (hotelId, roomId, data) => {
  const response = await apiClient.put(`${BASE}/${hotelId}/rooms/${roomId}`, data)
  return response.data
}

export const deleteRoom = async (hotelId, roomId) => {
  const response = await apiClient.delete(`${BASE}/${hotelId}/rooms/${roomId}`)
  return response.data
}

export const updateRoomStatus = async (hotelId, roomId, status, notes = '') => {
  const response = await apiClient.patch(`${BASE}/${hotelId}/rooms/${roomId}/status`, {
    status,
    notes
  })
  return response.data
}

export const updateHousekeepingStatus = async (hotelId, roomId, data) => {
  const response = await apiClient.patch(`${BASE}/${hotelId}/rooms/${roomId}/housekeeping`, data)
  return response.data
}

export const bulkUpdateHousekeeping = async (hotelId, roomIds, data) => {
  const response = await apiClient.patch(`${BASE}/${hotelId}/rooms/bulk/housekeeping`, {
    roomIds,
    ...data
  })
  return response.data
}

export default {
  getRoomTypes,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  getMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getHousekeeping,
  getRooms,
  getRoom,
  getRoomStatistics,
  getRoomsNeedingCleaning,
  getRoomsByFloor,
  createRoom,
  createRoomsBulk,
  updateRoom,
  deleteRoom,
  updateRoomStatus,
  updateHousekeepingStatus,
  bulkUpdateHousekeeping,
  ROOM_STATUS,
  HOUSEKEEPING_STATUS,
  HOUSEKEEPING_PRIORITY,
  ROOM_STATUS_INFO,
  HOUSEKEEPING_STATUS_INFO,
  PRIORITY_INFO
}
