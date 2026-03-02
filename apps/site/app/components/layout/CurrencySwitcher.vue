<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="open = !open"
      class="flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-lg hover:bg-gray-100/20 transition-colors"
    >
      <span class="font-semibold text-xs">{{ currentSymbol }}</span>
      <span class="font-medium text-xs">{{ searchStore.currency }}</span>
      <svg
        class="w-3 h-3 transition-transform"
        :class="open ? 'rotate-180' : ''"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition name="dropdown">
      <div
        v-if="open"
        class="absolute right-0 top-full mt-2 dropdown-panel py-1 min-w-[140px] z-50"
      >
        <button
          v-for="curr in currencies"
          :key="curr.code"
          @click="selectCurrency(curr.code)"
          class="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          :class="{
            'font-semibold text-site-primary bg-site-primary/5': searchStore.currency === curr.code
          }"
        >
          <span class="w-5 text-center font-semibold text-gray-400">{{ curr.symbol }}</span>
          {{ curr.code }}
          <svg
            v-if="searchStore.currency === curr.code"
            class="w-4 h-4 ml-auto text-site-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const searchStore = useSearchStore()
const open = ref(false)
const dropdownRef = ref<HTMLElement>()

const currencies = [
  { code: 'TRY', symbol: '₺' },
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' }
]

const currentSymbol = computed(() => {
  return currencies.find(c => c.code === searchStore.currency)?.symbol || '₺'
})

function selectCurrency(code: string) {
  searchStore.currency = code
  open.value = false
}

onMounted(() => {
  const handler = (e: Event) => {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
      open.value = false
    }
  }
  document.addEventListener('click', handler)
  onUnmounted(() => document.removeEventListener('click', handler))
})
</script>
