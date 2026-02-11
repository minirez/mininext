<script setup>
import { computed, ref, onMounted } from 'vue'
import { useWidgetStore } from '../stores/widget'
import { useFormatters } from '../composables/useFormatters'
import { useTranslation } from '../composables/useTranslation'
import ViewHeader from '../components/ViewHeader.vue'

const widgetStore = useWidgetStore()
const { formatCurrency } = useFormatters()
const { t } = useTranslation()

const booking = computed(() => widgetStore.booking)
const bankAccounts = computed(() => widgetStore.bankAccounts)
const bankTransferDescription = computed(() => {
  const desc = widgetStore.bankTransferDescription
  if (!desc) return ''
  const lang = widgetStore.config.language || 'tr'
  return desc[lang] || desc.tr || desc.en || ''
})
const isLoading = computed(() => widgetStore.isLoading)
const selectedOption = computed(() => widgetStore.selectedOption)

const copiedIndex = ref(null)

async function copyIban(iban, index) {
  try {
    await navigator.clipboard.writeText(iban.replace(/\s/g, ''))
    copiedIndex.value = index
    setTimeout(() => {
      copiedIndex.value = null
    }, 2000)
  } catch {
    // Fallback: select text
    const el = document.createElement('textarea')
    el.value = iban.replace(/\s/g, '')
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copiedIndex.value = index
    setTimeout(() => {
      copiedIndex.value = null
    }, 2000)
  }
}

function goToConfirmation() {
  widgetStore.currentStep = 'confirmation'
}

onMounted(() => {
  widgetStore.fetchBankAccounts()
})
</script>

<template>
  <div class="bank-transfer-view">
    <ViewHeader :title="t('bankTransfer.title')" />

    <!-- Booking Reference -->
    <div v-if="booking?.bookingNumber" class="bt-booking-ref">
      <span class="bt-booking-ref-label">{{ t('bankTransfer.bookingNumber') }}</span>
      <span class="bt-booking-ref-value">{{ booking.bookingNumber }}</span>
    </div>

    <!-- Amount -->
    <div v-if="selectedOption?.pricing?.finalTotal" class="bt-amount">
      <span class="bt-amount-label">{{ t('bankTransfer.amount') }}</span>
      <span class="bt-amount-value">{{ formatCurrency(selectedOption.pricing.finalTotal) }}</span>
    </div>

    <!-- Description -->
    <div v-if="bankTransferDescription" class="bt-description">
      <p>{{ bankTransferDescription }}</p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="bt-loading">
      <span class="spinner"></span>
    </div>

    <!-- Bank Accounts -->
    <div v-else-if="bankAccounts.length > 0" class="bt-accounts">
      <div v-for="(account, index) in bankAccounts" :key="index" class="bt-account-card">
        <div class="bt-account-header">
          <span class="bt-bank-name">{{ account.bankName }}</span>
          <span class="bt-currency-badge">{{ account.currency }}</span>
        </div>
        <div class="bt-account-body">
          <div class="bt-field">
            <span class="bt-field-label">{{ t('bankTransfer.accountName') }}</span>
            <span class="bt-field-value">{{ account.accountName }}</span>
          </div>
          <div class="bt-field">
            <span class="bt-field-label">IBAN</span>
            <div class="bt-iban-row">
              <span class="bt-iban-value">{{ account.iban }}</span>
              <button class="bt-copy-btn" @click="copyIban(account.iban, index)">
                <template v-if="copiedIndex === index">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  {{ t('bankTransfer.copied') }}
                </template>
                <template v-else>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  {{ t('bankTransfer.copyIban') }}
                </template>
              </button>
            </div>
          </div>
          <div v-if="account.swift" class="bt-field">
            <span class="bt-field-label">SWIFT</span>
            <span class="bt-field-value">{{ account.swift }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- No accounts -->
    <div v-else class="bt-empty">
      <p>{{ t('bankTransfer.noAccounts') }}</p>
    </div>

    <!-- Important Note -->
    <div class="bt-note">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{{ t('bankTransfer.note') }}</span>
    </div>

    <!-- Continue Button -->
    <button class="btn btn-primary btn-block btn-lg" @click="goToConfirmation">
      {{ t('bankTransfer.continue') }}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </button>
  </div>
</template>

<!-- All styles in widget.css for Shadow DOM compatibility -->
