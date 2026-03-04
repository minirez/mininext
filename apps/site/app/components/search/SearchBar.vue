<template>
  <div>
    <!-- Search Tabs -->
    <div v-if="availableTabs.length > 1" class="flex items-center justify-center gap-1 mb-3">
      <button
        v-for="tab in availableTabs"
        :key="tab.key"
        type="button"
        @click="activeTab = tab.key"
        class="relative px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200"
        :class="
          activeTab === tab.key
            ? 'bg-white/95 text-gray-800 shadow-md'
            : 'text-white/80 hover:text-white hover:bg-white/10'
        "
      >
        <span class="flex items-center gap-1.5">
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </span>
      </button>
    </div>

    <!-- Search Form -->
    <div
      class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-2 sm:p-2.5 text-gray-800"
    >
      <form @submit.prevent="handleSearch" class="flex flex-col sm:flex-row sm:items-center">
        <!-- Location -->
        <div
          class="flex-1 min-w-0 px-4 py-2.5 sm:py-1.5 border-b sm:border-b-0 border-gray-100 group"
        >
          <label class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            {{ activeTab === 'flights' ? $t('search.departure') : $t('search.where') }}
          </label>
          <div class="flex items-center gap-2.5 mt-1">
            <svg
              class="w-[18px] h-[18px] text-gray-400 group-focus-within:text-site-primary shrink-0 transition-colors"
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
              v-model="searchStore.location"
              type="text"
              :placeholder="$t('search.destination')"
              class="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        <!-- Divider -->
        <div class="hidden sm:block w-px h-11 bg-gray-200/80 shrink-0" />

        <!-- Arrival (Flights only) -->
        <template v-if="activeTab === 'flights'">
          <div
            class="flex-1 min-w-0 px-4 py-2.5 sm:py-1.5 border-b sm:border-b-0 border-gray-100 group"
          >
            <label class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{{
              $t('search.arrival')
            }}</label>
            <div class="flex items-center gap-2.5 mt-1">
              <svg
                class="w-[18px] h-[18px] text-gray-400 group-focus-within:text-site-primary shrink-0 transition-colors"
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
                type="text"
                :placeholder="$t('search.arrivalPlaceholder')"
                class="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
              />
            </div>
          </div>
          <div class="hidden sm:block w-px h-11 bg-gray-200/80 shrink-0" />
        </template>

        <!-- Tour: Month selector -->
        <template v-if="activeTab === 'tours'">
          <div
            class="relative flex-1 min-w-0 px-4 py-2.5 sm:py-1.5 border-b sm:border-b-0 border-gray-100 group"
            ref="monthRef"
          >
            <button
              type="button"
              @click="monthOpen = !monthOpen"
              class="w-full text-left focus:outline-none"
            >
              <span class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{{
                $t('search.when')
              }}</span>
              <div class="flex items-center gap-2.5 mt-1">
                <svg
                  class="w-[18px] h-[18px] text-gray-400 shrink-0 transition-colors"
                  :class="{ 'text-site-primary': monthOpen }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  />
                </svg>
                <span
                  class="text-sm"
                  :class="tourMonth ? 'text-gray-800 font-medium' : 'text-gray-400'"
                >
                  {{ tourMonth ? selectedMonthLabel : $t('search.selectMonth') }}
                </span>
              </div>
            </button>

            <!-- Month grid dropdown -->
            <Transition name="dropdown">
              <div
                v-if="monthOpen"
                class="absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-3 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 w-[300px]"
              >
                <div class="grid grid-cols-3 gap-1.5">
                  <button
                    v-for="m in monthOptions"
                    :key="m.value"
                    type="button"
                    @click="selectMonth(m.value)"
                    class="px-2 py-2.5 rounded-lg text-sm text-center transition-all"
                    :class="
                      tourMonth === m.value
                        ? 'bg-site-primary text-white font-semibold shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-site-primary'
                    "
                  >
                    {{ m.shortLabel }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </template>

        <!-- Date Range (hotels, transfer, etc.) -->
        <template v-else>
          <div class="flex-1 min-w-0 px-4 py-2.5 sm:py-1.5 border-b sm:border-b-0 border-gray-100">
            <DateRangePicker
              :model-check-in="searchStore.checkIn"
              :model-check-out="searchStore.checkOut"
              @update:model-check-in="searchStore.checkIn = $event"
              @update:model-check-out="searchStore.checkOut = $event"
            />
          </div>
        </template>

        <!-- Divider -->
        <div class="hidden sm:block w-px h-11 bg-gray-200/80 shrink-0" />

        <!-- Guests (hidden for flights & tours) -->
        <div
          v-if="activeTab !== 'flights' && activeTab !== 'tours'"
          class="relative flex-1 min-w-0 px-4 py-2.5 sm:py-1.5"
          ref="guestRef"
        >
          <button
            type="button"
            @click="guestOpen = !guestOpen"
            class="w-full text-left focus:outline-none"
          >
            <span class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{{
              $t('search.who')
            }}</span>
            <span class="block text-sm text-gray-800 font-medium mt-1">
              {{ searchStore.adults }} {{ $t('search.adults') }}
              <template v-if="searchStore.children.length">
                , {{ searchStore.children.length }} {{ $t('search.children') }}
              </template>
            </span>
          </button>

          <!-- Guest dropdown -->
          <Transition name="dropdown">
            <div v-if="guestOpen" class="absolute top-full left-0 mt-3 z-50">
              <GuestSelector @close="guestOpen = false" />
            </div>
          </Transition>
        </div>

        <!-- Passengers (flights only) -->
        <div v-if="activeTab === 'flights'" class="relative flex-1 min-w-0 px-4 py-2.5 sm:py-1.5">
          <span class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{{
            $t('search.passengers')
          }}</span>
          <span class="block text-sm text-gray-800 font-medium mt-1">
            {{ searchStore.adults }} {{ $t('search.adults') }}
          </span>
        </div>

        <!-- Search button -->
        <button
          type="submit"
          class="m-1 h-12 rounded-xl bg-site-primary hover:bg-site-primary-dark text-white flex items-center justify-center transition-all hover:scale-[1.02] hover:shadow-lg shrink-0 px-4 sm:px-6 gap-2"
          :aria-label="$t('common.search')"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path stroke-linecap="round" d="m21 21-4.3-4.3" />
          </svg>
          <span class="hidden sm:inline text-sm font-semibold">{{ $t('common.search') }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'

const props = withDefaults(defineProps<{ defaultTab?: string }>(), { defaultTab: '' })

const { t, locale } = useI18n()
const searchStore = useSearchStore()
const storefront = useStorefrontStore()
const router = useRouter()
const guestOpen = ref(false)
const guestRef = ref<HTMLElement>()
const monthOpen = ref(false)
const monthRef = ref<HTMLElement>()
const tourMonth = ref('')

const resolvedDefaultTab = computed(() => {
  if (props.defaultTab) return props.defaultTab
  const opts = storefront.hero?.searchOptions
  if (opts?.length) {
    const first = opts[0]
    const canon: Record<string, string> = {
      hotel: 'hotels', hotels: 'hotels',
      flight: 'flights', flights: 'flights',
      tour: 'tours', tours: 'tours',
      transfer: 'transfer',
      cruise: 'cruises', cruises: 'cruises',
      activity: 'activities', activities: 'activities',
    }
    return canon[first] || 'hotels'
  }
  return 'hotels'
})

const activeTab = ref(resolvedDefaultTab.value)

watch(resolvedDefaultTab, (v) => {
  if (v) activeTab.value = v
})

// Month options for tour search
const monthOptions = computed(() => {
  const now = new Date()
  const months: { value: string; label: string; shortLabel: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const localeTag =
      locale.value === 'tr' ? 'tr-TR' : locale.value === 'en' ? 'en-US' : locale.value
    const label = d.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })
    const shortMonth = d.toLocaleDateString(localeTag, { month: 'short' })
    const year = d.getFullYear()
    const shortLabel =
      `${shortMonth.charAt(0).toUpperCase() + shortMonth.slice(1)} ${year !== now.getFullYear() ? year : ''}`.trim()
    months.push({
      value,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      shortLabel
    })
  }
  return months
})

const selectedMonthLabel = computed(() => {
  return monthOptions.value.find(m => m.value === tourMonth.value)?.label || ''
})

function selectMonth(value: string) {
  tourMonth.value = value
  monthOpen.value = false
}

// Tab icons as render functions
const IconHotel = () =>
  h(
    'svg',
    {
      class: 'w-4 h-4',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
      'stroke-width': '1.5'
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        d: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z'
      })
    ]
  )

const IconTour = () =>
  h(
    'svg',
    {
      class: 'w-4 h-4',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
      'stroke-width': '1.5'
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        d: 'M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.592L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.877.293a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.206c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l.876.293a1.585 1.585 0 00.982.816l.036.073a1.453 1.453 0 002.328.377L16.5 15h.628a2.25 2.25 0 012.135 1.533l.177.529m0 0a9 9 0 01-6.69-14.036'
      })
    ]
  )

const IconFlight = () =>
  h(
    'svg',
    {
      class: 'w-4 h-4',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
      'stroke-width': '1.5'
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        d: 'M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5'
      })
    ]
  )

const IconCruise = () =>
  h(
    'svg',
    {
      class: 'w-4 h-4',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
      'stroke-width': '1.5'
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        d: 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-.117-2.243l.117-.007h17.25a1.125 1.125 0 01.117 2.243l-.117.007H3.375zm0 0c-.621 0-1.125.504-1.125 1.125M3.375 19.5h17.25c.621 0 1.125.504 1.125 1.125M2.25 20.625c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125M12 2.25l3.75 6.75H8.25L12 2.25zM5.25 9h13.5v7.5H5.25V9z'
      })
    ]
  )

const IconActivity = () =>
  h(
    'svg',
    {
      class: 'w-4 h-4',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
      'stroke-width': '1.5'
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        d: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z'
      })
    ]
  )

const IconTransfer = () =>
  h(
    'svg',
    {
      class: 'w-4 h-4',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
      'stroke-width': '1.5'
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        d: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'
      })
    ]
  )

const tabDefinitions: Record<string, { label: () => string; icon: any }> = {
  hotel: { label: () => t('common.hotels'), icon: IconHotel },
  hotels: { label: () => t('common.hotels'), icon: IconHotel },
  flight: { label: () => t('search.flights'), icon: IconFlight },
  flights: { label: () => t('search.flights'), icon: IconFlight },
  tour: { label: () => t('common.tours'), icon: IconTour },
  tours: { label: () => t('common.tours'), icon: IconTour },
  transfer: { label: () => t('search.transfer'), icon: IconTransfer },
  cruise: { label: () => t('sections.cruiseDeals'), icon: IconCruise },
  cruises: { label: () => t('sections.cruiseDeals'), icon: IconCruise },
  activity: { label: () => t('search.activities'), icon: IconActivity },
  activities: { label: () => t('search.activities'), icon: IconActivity }
}

// Normalize keys to canonical form for routing
const canonicalKey: Record<string, string> = {
  hotel: 'hotels',
  hotels: 'hotels',
  flight: 'flights',
  flights: 'flights',
  tour: 'tours',
  tours: 'tours',
  transfer: 'transfer',
  cruise: 'cruises',
  cruises: 'cruises',
  activity: 'activities',
  activities: 'activities'
}

const availableTabs = computed(() => {
  const searchOptions = storefront.hero?.searchOptions
  const keys =
    searchOptions && searchOptions.length > 0
      ? searchOptions
      : ['hotel', 'flight', 'tour', 'transfer']
  return keys
    .filter((key: string) => tabDefinitions[key])
    .map((key: string) => ({
      key: canonicalKey[key] || key,
      label: tabDefinitions[key].label(),
      icon: tabDefinitions[key].icon
    }))
})

function handleSearch() {
  const query: Record<string, string> = {}
  if (searchStore.location) query.city = searchStore.location
  if (searchStore.checkIn) query.checkIn = searchStore.checkIn
  if (searchStore.checkOut) query.checkOut = searchStore.checkOut
  if (searchStore.adults) query.adults = String(searchStore.adults)
  if (searchStore.children.length) query.children = searchStore.children.join(',')

  if (activeTab.value === 'hotels') {
    router.push({ path: '/hotels', query })
  } else if (activeTab.value === 'tours') {
    if (tourMonth.value) query.month = tourMonth.value
    router.push({ path: '/tours', query })
  } else if (activeTab.value === 'transfer') {
    router.push({ path: '/search', query: { ...query, type: 'transfer' } })
  } else {
    router.push({ path: '/search', query: { ...query, type: activeTab.value } })
  }
}

// Close dropdowns on outside click
onMounted(() => {
  const handler = (e: Event) => {
    if (guestRef.value && !guestRef.value.contains(e.target as Node)) {
      guestOpen.value = false
    }
    if (monthRef.value && !monthRef.value.contains(e.target as Node)) {
      monthOpen.value = false
    }
  }
  document.addEventListener('click', handler)
  onUnmounted(() => document.removeEventListener('click', handler))
})
</script>
