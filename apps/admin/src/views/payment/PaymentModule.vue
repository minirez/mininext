<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePartnerStore } from '@/stores/partner'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const authStore = useAuthStore()
const partnerStore = usePartnerStore()
const { t } = useI18n()

// Platform view mi? (Partner seçilmemişse platform view)
const isPlatformView = computed(() => authStore.isPlatformAdmin && !partnerStore.hasSelectedPartner)

// Tabs - Partner view'da komisyonlar ve BIN listesi gizli
const tabs = computed(() => {
  const list = [
    { id: 'test', label: t('paymentSystem.tabs.test'), icon: 'credit_card', path: '/payment/test' },
    { id: 'transactions', label: t('paymentSystem.tabs.transactions'), icon: 'receipt_long', path: '/payment/transactions' },
    { id: 'links', label: t('paymentSystem.tabs.links'), icon: 'link', path: '/payment/links' },
    { id: 'pos', label: t('paymentSystem.tabs.pos'), icon: 'point_of_sale', path: '/payment/pos' }
  ]

  // Sadece platform view'da göster
  if (isPlatformView.value) {
    list.push(
      { id: 'commissions', label: t('paymentSystem.tabs.commissions'), icon: 'percent', path: '/payment/commissions' },
      { id: 'bins', label: t('paymentSystem.tabs.bins'), icon: 'credit_score', path: '/payment/bins' }
    )
  }

  return list
})

const activeTab = computed(() => route.meta?.tab || 'test')
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Tabs -->
    <div class="border-b border-gray-200 bg-white px-6">
      <nav class="flex space-x-6">
        <router-link
          v-for="tab in tabs"
          :key="tab.id"
          :to="tab.path"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors',
            activeTab === tab.id
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          <span class="material-icons text-lg">{{ tab.icon }}</span>
          {{ tab.label }}
        </router-link>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-auto p-6 bg-gray-50">
      <router-view />
    </div>
  </div>
</template>
