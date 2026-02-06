<template>
  <div class="widget-bottom-bar">
    <!-- Price Info -->
    <div class="bottom-bar-price">
      <span class="bottom-bar-label">{{ $t('widget.total') }}</span>
      <span class="bottom-bar-amount">{{ formatPrice(grandTotal) }}</span>
      <span class="bottom-bar-nights">{{ nights }} {{ $t('widget.nights') }}</span>
    </div>

    <!-- CTA Button -->
    <button
      class="bottom-bar-button"
      :disabled="!canProceed"
      @click="handleCta"
    >
      {{ ctaText }}
      <WidgetIcon name="arrow-right" :size="18" />
    </button>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import WidgetIcon from './WidgetIcon.vue'

const store = inject('widgetStore')
const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()

const nights = computed(() => store.nights)
const grandTotal = computed(() => store.grandTotal)
const currency = computed(() => store.currency)

function formatPrice(amount) {
  if (!amount) return '-'
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: currency.value,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

// CTA Logic
const currentStep = computed(() => route.meta?.step || 1)

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 2: return store.canProceedToGuests
    case 3: return store.canProceedToPayment
    case 4: return store.canCreateBooking
    default: return false
  }
})

const ctaText = computed(() => {
  switch (currentStep.value) {
    case 2: return t('widget.continue')
    case 3: return t('widget.continueToPayment')
    case 4: return t('widget.pay')
    default: return t('widget.continue')
  }
})

function handleCta() {
  switch (currentStep.value) {
    case 2:
      router.push({ name: 'widget-guests' })
      break
    case 3:
      router.push({ name: 'widget-payment' })
      break
    case 4:
      // Will be handled by PaymentView
      break
  }
}
</script>

<style scoped>
.widget-bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: white;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -4px 6px -1px rgb(0 0 0 / 0.1);
}

:deep(.dark) .widget-bottom-bar {
  background: #111827;
  border-top-color: #374151;
}

@media (min-width: 1024px) {
  .widget-bottom-bar {
    display: none;
  }
}

.bottom-bar-price {
  display: flex;
  flex-direction: column;
}

.bottom-bar-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.bottom-bar-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--widget-primary, #7c3aed);
}

.bottom-bar-nights {
  font-size: 0.75rem;
  color: #9ca3af;
}

.bottom-bar-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--widget-primary, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.bottom-bar-button:hover:not(:disabled) {
  background: var(--widget-primary-600, #9333ea);
}

.bottom-bar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
