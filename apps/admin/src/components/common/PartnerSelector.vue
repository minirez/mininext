<template>
  <div v-if="authStore.isPlatformAdmin" ref="dropdownRef" class="relative">
    <button
      class="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      :class="{
        'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400':
          partnerStore.hasSelectedPartner
      }"
      @click="toggleDropdown"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
      <div class="text-left">
        <div class="text-xs text-gray-500 dark:text-slate-400">{{ $t('nav.selectPartner') }}</div>
        <div class="text-sm font-medium flex items-center gap-1.5">
          <span>{{ partnerStore.selectedPartner?.companyName || 'Platform' }}</span>
          <span
            v-if="partnerStore.selectedPartner"
            class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
            :class="partnerStore.selectedPartner.partnerType === 'hotel'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'"
          >
            {{ $t(`partners.types.${partnerStore.selectedPartner.partnerType || 'agency'}`) }}
          </span>
        </div>
      </div>
      <svg
        class="w-4 h-4 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-50"
      >
        <!-- Search Input -->
        <div class="p-2 border-b border-gray-200 dark:border-slate-700">
          <div class="relative">
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="$t('partners.searchPlaceholder')"
              class="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-slate-700 border-0 rounded-lg focus:ring-2 focus:ring-purple-500 dark:text-white placeholder-gray-400"
              @input="handleSearch"
            />
            <button
              v-if="searchQuery"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              @click="clearSearch"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Clear Selection -->
        <button
          class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 border-b border-gray-200 dark:border-slate-700"
          :class="{
            'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20':
              !partnerStore.hasSelectedPartner
          }"
          @click="clearSelection"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span class="font-medium">Platform View</span>
        </button>

        <!-- Scrollable List -->
        <div class="max-h-64 overflow-y-auto">
          <!-- Loading State -->
          <div v-if="loading" class="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
            <svg class="animate-spin h-5 w-5 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span class="text-sm">{{ $t('common.loading') }}</span>
          </div>

          <!-- Partners List -->
          <div v-else-if="partners.length > 0">
            <button
              v-for="partner in partners"
              :key="partner._id"
              class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-between"
              :class="{
                'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20':
                  partnerStore.selectedPartner?._id === partner._id
              }"
              @click="selectPartner(partner)"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-medium truncate">{{ partner.companyName }}</span>
                  <span
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
                    :class="partner.partnerType === 'hotel'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'"
                  >
                    {{ $t(`partners.types.${partner.partnerType || 'agency'}`) }}
                  </span>
                </div>
                <div
                  v-if="partner.branding?.siteDomain"
                  class="text-xs text-emerald-600 dark:text-emerald-400 truncate font-medium"
                >
                  {{ partner.branding.siteDomain }}
                </div>
                <div v-else class="text-xs text-gray-500 dark:text-slate-400 truncate">
                  {{ partner.email }}
                </div>
              </div>
              <svg
                v-if="partnerStore.selectedPartner?._id === partner._id"
                class="w-4 h-4 flex-shrink-0 ml-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>

          <!-- No Results -->
          <div v-else class="px-4 py-8 text-center text-gray-500 dark:text-slate-400 text-sm">
            {{ searchQuery ? $t('partners.noSearchResults') : $t('partners.noPartners') }}
          </div>
        </div>

        <!-- Results Info -->
        <div
          v-if="!loading && totalCount > 0"
          class="px-4 py-2 text-xs text-gray-500 dark:text-slate-400 border-t border-gray-200 dark:border-slate-700"
        >
          {{ $t('partners.showingResults', { count: partners.length, total: totalCount }) }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePartnerStore } from '@/stores/partner'
import apiClient from '@/services/api'

const authStore = useAuthStore()
const partnerStore = usePartnerStore()

const isOpen = ref(false)
const dropdownRef = ref(null)
const searchInputRef = ref(null)
const partners = ref([])
const loading = ref(false)
const searchQuery = ref('')
const totalCount = ref(0)
const LIMIT = 20
let searchTimeout = null

const toggleDropdown = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await fetchPartners()
    // Focus search input when dropdown opens
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
}

const fetchPartners = async (search = '') => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      status: 'active',
      limit: LIMIT
    })
    if (search) {
      params.append('search', search)
    }
    const response = await apiClient.get(`/partners?${params.toString()}`)
    if (response.data.success) {
      partners.value = response.data.data.partners || []
      totalCount.value = response.data.data.pagination?.total || partners.value.length
    }
  } catch (error) {
    console.error('Failed to fetch partners:', error)
  } finally {
    loading.value = false
  }
}

// Debounced search handler
const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    fetchPartners(searchQuery.value)
  }, 300)
}

const clearSearch = () => {
  searchQuery.value = ''
  fetchPartners()
  searchInputRef.value?.focus()
}

const selectPartner = partner => {
  partnerStore.selectPartner(partner)
  isOpen.value = false
  searchQuery.value = ''
}

const clearSelection = () => {
  partnerStore.clearSelectedPartner()
  isOpen.value = false
  searchQuery.value = ''
}

// Close dropdown when clicking outside
const handleClickOutside = event => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>
