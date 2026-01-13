import apiClient from './api'

/**
 * Get current exchange rates
 */
const getRates = async () => {
  const response = await apiClient.get('/exchange/rates')
  return response.data
}

/**
 * Get supported currencies list
 */
const getCurrencies = async () => {
  const response = await apiClient.get('/exchange/currencies')
  return response.data
}

/**
 * Refresh rates from TCMB
 */
const refreshRates = async () => {
  const response = await apiClient.post('/exchange/refresh')
  return response.data
}

/**
 * Set manual exchange rate
 */
const setManualRate = async (currency, value) => {
  const response = await apiClient.post('/exchange/manual-rate', { currency, value })
  return response.data
}

/**
 * Get scheduler status
 */
const getSchedulerStatus = async () => {
  const response = await apiClient.get('/exchange/scheduler-status')
  return response.data
}

/**
 * Get rate history
 */
const getHistory = async (days = 7) => {
  const response = await apiClient.get('/exchange/history', { params: { days } })
  return response.data
}

/**
 * Convert currency
 */
const convert = async (amount, from, to) => {
  const response = await apiClient.post('/exchange/convert', { amount, from, to })
  return response.data
}

export default {
  getRates,
  getCurrencies,
  refreshRates,
  setManualRate,
  getSchedulerStatus,
  getHistory,
  convert
}
