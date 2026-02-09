import apiClient from '@/services/api'

const BASE = '/pms/billing/hotels'

export const SHIFT_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  SUSPENDED: 'suspended'
}

export const SHIFT_STATUS_INFO = {
  open: {
    label: 'Acik',
    color: 'green',
    bgClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  closed: {
    label: 'Kapali',
    color: 'gray',
    bgClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  },
  suspended: {
    label: 'Askida',
    color: 'yellow',
    bgClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  }
}

export const CASH_MOVEMENT_TYPES = {
  OPENING: 'opening',
  SALE: 'sale',
  REFUND: 'refund',
  PAYOUT: 'payout',
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  ADJUSTMENT: 'adjustment',
  CLOSING: 'closing'
}

export const CASH_MOVEMENT_INFO = {
  opening: { label: 'Acilis', icon: 'login', color: 'blue' },
  sale: { label: 'Satis', icon: 'shopping_cart', color: 'green' },
  refund: { label: 'Iade', icon: 'replay', color: 'orange' },
  payout: { label: 'Odeme (Cikis)', icon: 'payments', color: 'red' },
  deposit: { label: 'Para Yatirma', icon: 'account_balance_wallet', color: 'green' },
  withdrawal: { label: 'Para Cekme', icon: 'money_off', color: 'red' },
  adjustment: { label: 'Duzeltme', icon: 'tune', color: 'purple' },
  closing: { label: 'Kapanis', icon: 'logout', color: 'gray' }
}

export const TRANSACTION_TYPES = {
  ROOM_CHARGE: 'room_charge',
  EXTRA_CHARGE: 'extra_charge',
  RESTAURANT: 'restaurant',
  BAR: 'bar',
  MINIBAR: 'minibar',
  SPA: 'spa',
  LAUNDRY: 'laundry',
  PARKING: 'parking',
  PHONE: 'phone',
  OTHER_INCOME: 'other_income',
  PAYMENT: 'payment',
  DEPOSIT: 'deposit',
  ADVANCE: 'advance',
  REFUND: 'refund',
  DISCOUNT: 'discount',
  VOID: 'void',
  EXPENSE: 'expense',
  PAYOUT: 'payout'
}

export const TRANSACTION_TYPE_INFO = {
  room_charge: { label: 'Oda Ucreti', icon: 'hotel', color: 'blue', category: 'income' },
  extra_charge: {
    label: 'Ekstra Ucret',
    icon: 'add_shopping_cart',
    color: 'blue',
    category: 'income'
  },
  restaurant: { label: 'Restoran', icon: 'restaurant', color: 'orange', category: 'income' },
  bar: { label: 'Bar', icon: 'local_bar', color: 'purple', category: 'income' },
  minibar: { label: 'Minibar', icon: 'kitchen', color: 'indigo', category: 'income' },
  spa: { label: 'Spa', icon: 'spa', color: 'teal', category: 'income' },
  laundry: { label: 'Camasir', icon: 'local_laundry_service', color: 'cyan', category: 'income' },
  parking: { label: 'Otopark', icon: 'local_parking', color: 'gray', category: 'income' },
  phone: { label: 'Telefon', icon: 'phone', color: 'green', category: 'income' },
  other_income: { label: 'Diger Gelir', icon: 'attach_money', color: 'green', category: 'income' },
  payment: { label: 'Odeme', icon: 'payments', color: 'green', category: 'payment' },
  deposit: { label: 'Depozit', icon: 'account_balance_wallet', color: 'blue', category: 'payment' },
  advance: { label: 'On Odeme', icon: 'forward', color: 'blue', category: 'payment' },
  refund: { label: 'Iade', icon: 'replay', color: 'red', category: 'refund' },
  discount: { label: 'Indirim', icon: 'discount', color: 'orange', category: 'adjustment' },
  void: { label: 'Iptal', icon: 'cancel', color: 'red', category: 'adjustment' },
  expense: { label: 'Gider', icon: 'receipt_long', color: 'red', category: 'expense' },
  payout: { label: 'Odeme Cikisi', icon: 'money_off', color: 'red', category: 'expense' }
}

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  BANK_TRANSFER: 'bank_transfer',
  ROOM_CHARGE: 'room_charge',
  CITY_LEDGER: 'city_ledger',
  VOUCHER: 'voucher',
  ONLINE: 'online',
  OTHER: 'other'
}

export const PAYMENT_METHOD_INFO = {
  cash: { label: 'Nakit', icon: 'payments', color: 'green' },
  credit_card: { label: 'Kredi Karti', icon: 'credit_card', color: 'blue' },
  debit_card: { label: 'Banka Karti', icon: 'credit_card', color: 'indigo' },
  bank_transfer: { label: 'Havale/EFT', icon: 'account_balance', color: 'purple' },
  room_charge: { label: 'Oda Hesabina', icon: 'hotel', color: 'orange' },
  city_ledger: { label: 'Cari Hesap', icon: 'business', color: 'teal' },
  voucher: { label: 'Kupon/Voucher', icon: 'confirmation_number', color: 'pink' },
  online: { label: 'Online', icon: 'computer', color: 'cyan' },
  other: { label: 'Diger', icon: 'more_horiz', color: 'gray' }
}

export const TRANSACTION_CATEGORIES = {
  ACCOMMODATION: 'accommodation',
  FOOD_BEVERAGE: 'food_beverage',
  SPA_WELLNESS: 'spa_wellness',
  OTHER_SERVICES: 'other_services',
  PAYMENTS: 'payments',
  ADJUSTMENTS: 'adjustments'
}

export const TRANSACTION_CATEGORY_INFO = {
  accommodation: { label: 'Konaklama', icon: 'hotel', color: 'blue' },
  food_beverage: { label: 'Yiyecek & Icecek', icon: 'restaurant', color: 'orange' },
  spa_wellness: { label: 'Spa & Wellness', icon: 'spa', color: 'teal' },
  other_services: { label: 'Diger Hizmetler', icon: 'room_service', color: 'purple' },
  payments: { label: 'Odemeler', icon: 'payments', color: 'green' },
  adjustments: { label: 'Duzeltmeler', icon: 'tune', color: 'gray' }
}

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
}

export const TRANSACTION_STATUS_INFO = {
  pending: {
    label: 'Beklemede',
    color: 'yellow',
    bgClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  },
  completed: {
    label: 'Tamamlandi',
    color: 'green',
    bgClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  cancelled: {
    label: 'Iptal Edildi',
    color: 'red',
    bgClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
  refunded: {
    label: 'Iade Edildi',
    color: 'orange',
    bgClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  }
}

export const QUICK_CHARGE_ITEMS = [
  { type: 'restaurant', description: 'Kahvalti', amount: 0, icon: 'free_breakfast' },
  { type: 'restaurant', description: 'Ogle Yemegi', amount: 0, icon: 'lunch_dining' },
  { type: 'restaurant', description: 'Aksam Yemegi', amount: 0, icon: 'dinner_dining' },
  { type: 'bar', description: 'Icecek', amount: 0, icon: 'local_bar' },
  { type: 'minibar', description: 'Minibar', amount: 0, icon: 'kitchen' },
  { type: 'laundry', description: 'Camasir', amount: 0, icon: 'local_laundry_service' },
  { type: 'parking', description: 'Otopark', amount: 0, icon: 'local_parking' },
  { type: 'spa', description: 'Spa', amount: 0, icon: 'spa' }
]

export const getStats = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/cashier/stats`)
  return response.data
}

export const getTypes = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/cashier/types`)
  return response.data
}

export const getDailySummary = async (hotelId, date = null) => {
  const params = date ? { date } : {}
  const response = await apiClient.get(`${BASE}/${hotelId}/cashier/daily-summary`, { params })
  return response.data
}

export const getDailySummaryByCurrency = async (hotelId, date = null) => {
  const params = date ? { date } : {}
  const response = await apiClient.get(`${BASE}/${hotelId}/cashier/daily-summary-by-currency`, {
    params
  })
  return response.data
}

export const getCurrencies = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/cashier/currencies`)
  return response.data
}

export const getActiveShift = async hotelId => {
  const response = await apiClient.get(`${BASE}/${hotelId}/cashier/shifts/active`)
  return response.data
}

export const getShifts = async (hotelId, params = {}) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/cashier/shifts`, { params })
  return response.data
}

export const getShift = async (hotelId, shiftId) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/cashier/shifts/${shiftId}`)
  return response.data
}

export const openShift = async (hotelId, data) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/cashier/shifts`, data)
  return response.data
}

export const closeShift = async (hotelId, shiftId, data) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/cashier/shifts/${shiftId}/close`, data)
  return response.data
}

export const addCashMovement = async (hotelId, shiftId, data) => {
  const response = await apiClient.post(
    `${BASE}/${hotelId}/cashier/shifts/${shiftId}/movements`,
    data
  )
  return response.data
}

export const getTransactions = async (hotelId, params = {}) => {
  const response = await apiClient.get(`${BASE}/${hotelId}/cashier/transactions`, { params })
  return response.data
}

export const createTransaction = async (hotelId, data) => {
  const response = await apiClient.post(`${BASE}/${hotelId}/cashier/transactions`, data)
  return response.data
}

export const voidTransaction = async (hotelId, transactionId, reason) => {
  const response = await apiClient.post(
    `${BASE}/${hotelId}/cashier/transactions/${transactionId}/void`,
    { reason }
  )
  return response.data
}

export const refundTransaction = async (hotelId, transactionId, data) => {
  const response = await apiClient.post(
    `${BASE}/${hotelId}/cashier/transactions/${transactionId}/refund`,
    data
  )
  return response.data
}

export const formatCurrency = (amount, currency = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount || 0)
}

export const formatShiftDuration = (openedAt, closedAt = null) => {
  const start = new Date(openedAt)
  const end = closedAt ? new Date(closedAt) : new Date()
  const diffMs = end - start
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}s ${minutes}dk`
}

export const getTransactionTypeOptions = () => {
  return Object.entries(TRANSACTION_TYPE_INFO).map(([value, info]) => ({
    value,
    label: info.label,
    icon: info.icon,
    category: info.category
  }))
}

export const getPaymentMethodOptions = () => {
  return Object.entries(PAYMENT_METHOD_INFO).map(([value, info]) => ({
    value,
    label: info.label,
    icon: info.icon
  }))
}

export const getCashMovementOptions = () => {
  return Object.entries(CASH_MOVEMENT_INFO)
    .filter(([key]) => !['opening', 'closing', 'sale'].includes(key))
    .map(([value, info]) => ({ value, label: info.label, icon: info.icon }))
}

export default {
  SHIFT_STATUS,
  SHIFT_STATUS_INFO,
  CASH_MOVEMENT_TYPES,
  CASH_MOVEMENT_INFO,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_INFO,
  PAYMENT_METHODS,
  PAYMENT_METHOD_INFO,
  TRANSACTION_CATEGORIES,
  TRANSACTION_CATEGORY_INFO,
  TRANSACTION_STATUS,
  TRANSACTION_STATUS_INFO,
  QUICK_CHARGE_ITEMS,
  getStats,
  getTypes,
  getDailySummary,
  getDailySummaryByCurrency,
  getCurrencies,
  getActiveShift,
  getShifts,
  getShift,
  openShift,
  closeShift,
  addCashMovement,
  getTransactions,
  createTransaction,
  voidTransaction,
  refundTransaction,
  formatCurrency,
  formatShiftDuration,
  getTransactionTypeOptions,
  getPaymentMethodOptions,
  getCashMovementOptions
}
