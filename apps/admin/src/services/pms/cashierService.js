import apiClient from '@/services/api'

const BASE = '/pms/billing/hotels'

export const SHIFT_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  SUSPENDED: 'suspended'
}

export const SHIFT_STATUS_INFO = {
  open: {
    label: 'cashier.shiftStatus.open',
    color: 'green',
    bgClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  closed: {
    label: 'cashier.shiftStatus.closed',
    color: 'gray',
    bgClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  },
  suspended: {
    label: 'cashier.shiftStatus.suspended',
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
  opening: { label: 'billing.cashMovement.types.opening', icon: 'login', color: 'blue' },
  sale: { label: 'billing.cashMovement.types.sale', icon: 'shopping_cart', color: 'green' },
  refund: { label: 'billing.cashMovement.types.refund', icon: 'replay', color: 'orange' },
  payout: { label: 'billing.cashMovement.types.payout', icon: 'payments', color: 'red' },
  deposit: {
    label: 'billing.cashMovement.types.deposit',
    icon: 'account_balance_wallet',
    color: 'green'
  },
  withdrawal: { label: 'billing.cashMovement.types.withdrawal', icon: 'money_off', color: 'red' },
  adjustment: { label: 'billing.cashMovement.types.adjustment', icon: 'tune', color: 'purple' },
  closing: { label: 'billing.cashMovement.types.closing', icon: 'logout', color: 'gray' }
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
  room_charge: {
    label: 'billing.transaction.types.roomCharge',
    icon: 'hotel',
    color: 'blue',
    category: 'income'
  },
  extra_charge: {
    label: 'billing.transaction.types.extraCharge',
    icon: 'add_shopping_cart',
    color: 'blue',
    category: 'income'
  },
  restaurant: {
    label: 'billing.transaction.types.restaurant',
    icon: 'restaurant',
    color: 'orange',
    category: 'income'
  },
  bar: {
    label: 'billing.transaction.types.bar',
    icon: 'local_bar',
    color: 'purple',
    category: 'income'
  },
  minibar: {
    label: 'billing.transaction.types.minibar',
    icon: 'kitchen',
    color: 'indigo',
    category: 'income'
  },
  spa: { label: 'billing.transaction.types.spa', icon: 'spa', color: 'teal', category: 'income' },
  laundry: {
    label: 'billing.transaction.types.laundry',
    icon: 'local_laundry_service',
    color: 'cyan',
    category: 'income'
  },
  parking: {
    label: 'billing.transaction.types.parking',
    icon: 'local_parking',
    color: 'gray',
    category: 'income'
  },
  phone: {
    label: 'billing.transaction.types.phone',
    icon: 'phone',
    color: 'green',
    category: 'income'
  },
  other_income: {
    label: 'billing.transaction.types.otherIncome',
    icon: 'attach_money',
    color: 'green',
    category: 'income'
  },
  payment: {
    label: 'billing.transaction.types.payment',
    icon: 'payments',
    color: 'green',
    category: 'payment'
  },
  deposit: {
    label: 'billing.transaction.types.deposit',
    icon: 'account_balance_wallet',
    color: 'blue',
    category: 'payment'
  },
  advance: {
    label: 'billing.transaction.types.advance',
    icon: 'forward',
    color: 'blue',
    category: 'payment'
  },
  refund: {
    label: 'billing.transaction.types.refund',
    icon: 'replay',
    color: 'red',
    category: 'refund'
  },
  discount: {
    label: 'billing.transaction.types.discount',
    icon: 'discount',
    color: 'orange',
    category: 'adjustment'
  },
  void: {
    label: 'billing.transaction.types.void',
    icon: 'cancel',
    color: 'red',
    category: 'adjustment'
  },
  expense: {
    label: 'billing.transaction.types.expense',
    icon: 'receipt_long',
    color: 'red',
    category: 'expense'
  },
  payout: {
    label: 'billing.transaction.types.payout',
    icon: 'money_off',
    color: 'red',
    category: 'expense'
  }
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
  cash: { label: 'billing.paymentMethods.cash', icon: 'payments', color: 'green' },
  credit_card: { label: 'billing.paymentMethods.credit_card', icon: 'credit_card', color: 'blue' },
  debit_card: { label: 'billing.paymentMethods.debit_card', icon: 'credit_card', color: 'indigo' },
  bank_transfer: {
    label: 'billing.paymentMethods.bank_transfer',
    icon: 'account_balance',
    color: 'purple'
  },
  room_charge: { label: 'billing.paymentMethods.room_charge', icon: 'hotel', color: 'orange' },
  city_ledger: { label: 'billing.paymentMethods.city_ledger', icon: 'business', color: 'teal' },
  voucher: { label: 'billing.paymentMethods.voucher', icon: 'confirmation_number', color: 'pink' },
  online: { label: 'billing.paymentMethods.online', icon: 'computer', color: 'cyan' },
  other: { label: 'billing.paymentMethods.other', icon: 'more_horiz', color: 'gray' }
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
  accommodation: {
    label: 'billing.transactionCategories.accommodation',
    icon: 'hotel',
    color: 'blue'
  },
  food_beverage: {
    label: 'billing.transactionCategories.foodBeverage',
    icon: 'restaurant',
    color: 'orange'
  },
  spa_wellness: { label: 'billing.transactionCategories.spaWellness', icon: 'spa', color: 'teal' },
  other_services: {
    label: 'billing.transactionCategories.otherServices',
    icon: 'room_service',
    color: 'purple'
  },
  payments: { label: 'billing.transactionCategories.payments', icon: 'payments', color: 'green' },
  adjustments: { label: 'billing.transactionCategories.adjustments', icon: 'tune', color: 'gray' }
}

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
}

export const TRANSACTION_STATUS_INFO = {
  pending: {
    label: 'cashier.status.pending',
    color: 'yellow',
    bgClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  },
  completed: {
    label: 'cashier.status.completed',
    color: 'green',
    bgClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  cancelled: {
    label: 'cashier.status.cancelled',
    color: 'red',
    bgClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
  refunded: {
    label: 'cashier.status.refunded',
    color: 'orange',
    bgClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  }
}

export const QUICK_CHARGE_ITEMS = [
  {
    type: 'restaurant',
    descriptionKey: 'billing.transaction.quickCharge.breakfast',
    amount: 0,
    icon: 'free_breakfast'
  },
  {
    type: 'restaurant',
    descriptionKey: 'billing.transaction.quickCharge.lunch',
    amount: 0,
    icon: 'lunch_dining'
  },
  {
    type: 'restaurant',
    descriptionKey: 'billing.transaction.quickCharge.dinner',
    amount: 0,
    icon: 'dinner_dining'
  },
  {
    type: 'bar',
    descriptionKey: 'billing.transaction.quickCharge.beverage',
    amount: 0,
    icon: 'local_bar'
  },
  {
    type: 'minibar',
    descriptionKey: 'billing.transaction.quickCharge.minibar',
    amount: 0,
    icon: 'kitchen'
  },
  {
    type: 'laundry',
    descriptionKey: 'billing.transaction.quickCharge.laundry',
    amount: 0,
    icon: 'local_laundry_service'
  },
  {
    type: 'parking',
    descriptionKey: 'billing.transaction.quickCharge.parking',
    amount: 0,
    icon: 'local_parking'
  },
  { type: 'spa', descriptionKey: 'billing.transaction.quickCharge.spa', amount: 0, icon: 'spa' }
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
