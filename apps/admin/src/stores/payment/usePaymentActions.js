/**
 * Payment Actions Composable
 * Payment processing, refund, cancel, BIN lookup
 */
import * as api from '@/services/virtualPosService'

export function usePaymentActions(sharedState) {
  async function processPayment(paymentData) {
    sharedState.loading.value = true
    sharedState.error.value = null
    try {
      const res = await api.testPayment(paymentData)
      return res
    } catch (e) {
      sharedState.error.value = e.message
      throw e
    } finally {
      sharedState.loading.value = false
    }
  }

  async function queryBin(bin) {
    try {
      const res = await api.lookupBin(bin)
      return res
    } catch (e) {
      console.error('BIN query failed:', e)
      return null
    }
  }

  async function refundPayment(transactionId) {
    sharedState.loading.value = true
    sharedState.error.value = null
    try {
      const res = await api.refundTransaction(transactionId)
      return res
    } catch (e) {
      sharedState.error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      sharedState.loading.value = false
    }
  }

  async function cancelPayment(transactionId) {
    sharedState.loading.value = true
    sharedState.error.value = null
    try {
      const res = await api.cancelTransaction(transactionId)
      return res
    } catch (e) {
      sharedState.error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      sharedState.loading.value = false
    }
  }

  async function queryBankStatus(transactionId) {
    sharedState.loading.value = true
    sharedState.error.value = null
    try {
      const res = await api.getTransaction(transactionId)
      return res
    } catch (e) {
      sharedState.error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      sharedState.loading.value = false
    }
  }

  return {
    processPayment,
    queryBin,
    refundPayment,
    cancelPayment,
    queryBankStatus
  }
}
