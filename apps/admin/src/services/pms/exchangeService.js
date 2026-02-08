/**
 * PMS Exchange Rate Service
 * Wrapper around BE exchange endpoints with PMS-compatible function names
 */

import apiClient from '../api'

export async function getExchangeRates() {
  const response = await apiClient.get('/exchange/rates')
  return response.data
}

export async function getSupportedCurrencies() {
  const response = await apiClient.get('/exchange/currencies')
  return response.data
}

export async function convertCurrency(amount, from, to) {
  const response = await apiClient.post('/exchange/convert', { amount, from, to })
  return response.data
}

export async function getExchangeRate(from, to) {
  const response = await apiClient.get(`/exchange/rate/${from}/${to}`)
  return response.data
}

export async function getRateHistory(days = 7) {
  const response = await apiClient.get('/exchange/history', { params: { days } })
  return response.data
}

export async function refreshRates() {
  const response = await apiClient.post('/exchange/refresh')
  return response.data
}

export async function setManualRate(currency, value) {
  const response = await apiClient.post('/exchange/manual-rate', { currency, value })
  return response.data
}

export async function getSchedulerStatus() {
  const response = await apiClient.get('/exchange/scheduler-status')
  return response.data
}

export const CURRENCY_SYMBOLS = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CHF: 'CHF',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  DKK: 'kr',
  SEK: 'kr',
  NOK: 'kr',
  SAR: 'SR',
  KWD: 'KD',
  AED: 'AED',
  BGN: 'лв',
  RON: 'lei',
  RUB: '₽'
}

export function getCurrencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency?.toUpperCase()] || currency
}

export function formatCurrency(amount, currency, locale = 'tr-TR') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  } catch {
    return `${amount?.toFixed(2)} ${getCurrencySymbol(currency)}`
  }
}
