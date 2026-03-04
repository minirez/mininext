<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-4" ref="sidebarRef">
    <!-- Date Range -->
    <div>
      <DateRangePicker
        :model-check-in="searchStore.checkIn"
        :model-check-out="searchStore.checkOut"
        @update:model-check-in="searchStore.checkIn = $event"
        @update:model-check-out="searchStore.checkOut = $event"
      />
    </div>

    <!-- Guests -->
    <div class="relative" ref="guestRef">
      <button
        type="button"
        @click="guestOpen = !guestOpen"
        class="w-full text-left focus:outline-none"
      >
        <span class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          {{ $t('search.who') }}
        </span>
        <span class="block text-sm text-gray-800 font-medium mt-1">
          {{ searchStore.adults }} {{ $t('search.adults') }}
          <template v-if="searchStore.children.length">
            , {{ searchStore.children.length }} {{ $t('search.children') }}
          </template>
        </span>
      </button>

      <Transition name="dropdown">
        <div v-if="guestOpen" class="absolute top-full left-0 right-0 mt-2 z-50">
          <GuestSelector @close="guestOpen = false" />
        </div>
      </Transition>
    </div>

    <!-- Nights info -->
    <div
      v-if="searchStore.hasDates"
      class="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t border-gray-100"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
        />
      </svg>
      {{ searchStore.nights }} {{ $t('common.nights') }}
    </div>

    <!-- Search / Update button -->
    <button
      type="button"
      @click="handleSearch"
      :disabled="!searchStore.hasDates"
      class="w-full py-2.5 bg-site-primary text-white rounded-lg font-medium text-sm hover:bg-site-primary-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <path stroke-linecap="round" d="m21 21-4.3-4.3" />
      </svg>
      {{ $t('search.updateSearch') }}
    </button>

    <!-- Hint when no dates -->
    <p v-if="!searchStore.hasDates" class="text-xs text-gray-400 text-center">
      {{ $t('search.selectDatesHint') }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const searchStore = useSearchStore()

const emit = defineEmits<{ search: [] }>()
const sidebarRef = ref<HTMLElement>()
const guestRef = ref<HTMLElement>()
const guestOpen = ref(false)

function handleSearch() {
  emit('search')
}

// Close guest dropdown on outside click
onMounted(() => {
  const handler = (e: Event) => {
    if (guestRef.value && !guestRef.value.contains(e.target as Node)) {
      guestOpen.value = false
    }
  }
  document.addEventListener('click', handler)
  onUnmounted(() => document.removeEventListener('click', handler))
})

defineExpose({ el: sidebarRef })
</script>
