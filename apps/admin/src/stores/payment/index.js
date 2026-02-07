/**
 * Payment Store
 * Modular Pinia store composed from domain-specific composables.
 *
 * Sub-composables:
 *   - usePaymentPos          -> POS CRUD, banks, providers, commission
 *   - usePaymentTransactions -> Transaction listing, stats
 *   - usePaymentActions      -> Payment processing, refund, cancel, BIN
 *
 * Fully backward-compatible: all properties previously exposed
 * by the monolithic store are still available at the top level.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

import { usePaymentPos } from './usePaymentPos'
import { usePaymentTransactions } from './usePaymentTransactions'
import { usePaymentActions } from './usePaymentActions'

export const usePaymentStore = defineStore('payment', () => {
  // =====================
  // SHARED STATE
  // =====================
  const loading = ref(false)
  const error = ref(null)

  const sharedState = { loading, error }

  // =====================
  // COMPOSE SUB-MODULES
  // =====================
  const pos = usePaymentPos(sharedState)
  const txn = usePaymentTransactions(sharedState)
  const actions = usePaymentActions(sharedState)

  // =====================
  // EXPOSE (backward-compatible flat API)
  // =====================
  return {
    // Shared state
    loading,
    error,

    // --- POS ---
    posList: pos.posList,
    banks: pos.banks,
    providers: pos.providers,
    fetchPosList: pos.fetchPosList,
    fetchBanks: pos.fetchBanks,
    fetchProviders: pos.fetchProviders,
    createPos: pos.createPos,
    updatePos: pos.updatePos,
    deletePos: pos.deletePos,
    setDefaultPos: pos.setDefaultPos,
    unsetDefaultPos: pos.unsetDefaultPos,
    getPosCapabilities: pos.getPosCapabilities,
    updatePosCommission: pos.updatePosCommission,

    // --- Transactions ---
    transactions: txn.transactions,
    stats: txn.stats,
    fetchTransactions: txn.fetchTransactions,
    fetchStats: txn.fetchStats,
    getTransaction: txn.getTransaction,
    fetchFilterPosList: txn.fetchFilterPosList,

    // --- Payment Actions ---
    processPayment: actions.processPayment,
    queryBin: actions.queryBin,
    refundPayment: actions.refundPayment,
    cancelPayment: actions.cancelPayment,
    queryBankStatus: actions.queryBankStatus
  }
})
