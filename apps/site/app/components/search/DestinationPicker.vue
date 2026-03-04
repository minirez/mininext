<template>
  <div class="relative" ref="containerRef">
    <label class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
      {{ $t('search.where') }}
    </label>
    <div class="flex items-center gap-2.5 mt-1">
      <svg
        class="w-[18px] h-[18px] shrink-0 transition-colors"
        :class="open ? 'text-site-primary' : 'text-gray-400'"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        stroke-width="1.5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
        />
      </svg>
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        :placeholder="$t('search.destination')"
        class="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
        @focus="open = true"
        @input="open = true"
      />
    </div>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="open && (filteredLocations.length || filteredHotels.length)"
        class="absolute top-full left-0 right-0 sm:left-auto sm:right-auto sm:w-[340px] mt-3 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[320px] overflow-y-auto"
      >
        <!-- Locations -->
        <div v-if="filteredLocations.length">
          <div
            class="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50"
          >
            {{ $t('sections.popularDestinations') }}
          </div>
          <button
            v-for="loc in filteredLocations"
            :key="'loc-' + loc.city"
            type="button"
            @click="selectLocation(loc)"
            class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
          >
            <svg
              class="w-4 h-4 text-gray-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
            <div>
              <div class="text-sm font-medium text-gray-800">{{ loc.city }}</div>
              <div v-if="loc.country" class="text-xs text-gray-400">{{ loc.country }}</div>
            </div>
          </button>
        </div>

        <!-- Divider -->
        <div
          v-if="filteredLocations.length && filteredHotels.length"
          class="border-t border-gray-100"
        />

        <!-- Hotels -->
        <div v-if="filteredHotels.length">
          <div
            class="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50"
          >
            {{ $t('common.hotels') }}
          </div>
          <button
            v-for="h in filteredHotels"
            :key="'hotel-' + h.slug"
            type="button"
            @click="selectHotel(h)"
            class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
          >
            <svg
              class="w-4 h-4 text-gray-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
              />
            </svg>
            <div>
              <div class="text-sm font-medium text-gray-800">{{ h.name }}</div>
              <div v-if="h.city" class="text-xs text-gray-400">{{ h.city }}</div>
            </div>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const searchStore = useSearchStore()
const storefront = useStorefrontStore()
const router = useRouter()

const containerRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const open = ref(false)
const query = ref(searchStore.location || searchStore.selectedDestination?.city || '')

// Sync from store on mount
watch(
  () => searchStore.selectedDestination,
  dest => {
    if (dest?.city && !query.value) {
      query.value = dest.city
    }
  }
)

const allLocations = computed(() => {
  return (storefront.locationSection?.items || []).map((item: any) => ({
    city: item.name || item.city || item.title,
    country: item.country || '',
    photo: item.photo || item.image
  }))
})

const allHotels = computed(() => {
  return (storefront.hotelsSection?.items || []).map((item: any) => ({
    name: item.name || item.title,
    slug: item.slug,
    city: item.city || item.address?.city || ''
  }))
})

const filteredLocations = computed(() => {
  const q = query.value.toLowerCase().trim()
  const items = allLocations.value
  if (!q) return items.slice(0, 6)
  return items
    .filter(
      (loc: any) => loc.city?.toLowerCase().includes(q) || loc.country?.toLowerCase().includes(q)
    )
    .slice(0, 6)
})

const filteredHotels = computed(() => {
  const q = query.value.toLowerCase().trim()
  const items = allHotels.value
  if (!q) return items.slice(0, 4)
  return items
    .filter((h: any) => h.name?.toLowerCase().includes(q) || h.city?.toLowerCase().includes(q))
    .slice(0, 6)
})

function selectLocation(loc: any) {
  query.value = loc.city
  searchStore.location = loc.city
  searchStore.city = loc.city
  searchStore.country = loc.country || ''
  searchStore.selectedDestination = { city: loc.city, country: loc.country }
  open.value = false
}

function selectHotel(h: any) {
  open.value = false
  router.push(`/hotels/${h.slug}`)
}

// Close on outside click
onMounted(() => {
  const handler = (e: Event) => {
    if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
      open.value = false
    }
  }
  document.addEventListener('click', handler)
  onUnmounted(() => document.removeEventListener('click', handler))
})

defineExpose({ focus: () => inputRef.value?.focus() })
</script>
