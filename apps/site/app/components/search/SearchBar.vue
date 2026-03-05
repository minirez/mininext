<template>
  <div>
    <!-- Search Tabs (like site3 underline tabs) -->
    <div
      v-if="availableTabs.length > 1"
      class="flex items-center justify-center gap-x-8 gap-y-5 sm:justify-center mb-8"
    >
      <div v-for="tab in availableTabs" :key="tab.key" class="relative">
        <button
          type="button"
          @click="activeTab = tab.key"
          class="text-[15px] font-medium text-white pb-1 border-b-2 transition-colors cursor-pointer"
          :class="activeTab === tab.key
            ? 'border-white opacity-100'
            : 'border-transparent opacity-80 hover:opacity-100'"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Search Form Container (pill-shaped like site3) -->
    <div class="relative mt-8 md:mt-5 flex justify-center">
      <div
        class="mainSearch bg-white px-2.5 py-2.5 lg:px-5 lg:pt-1.5 lg:pb-5 rounded-full w-[950px] max-w-full"
      >
        <form @submit.prevent="handleSearch" class="button-grid items-center">
          <!-- Location search -->
          <div class="searchMenu-loc px-8 lg:py-5 lg:px-0">
            <h4 class="text-[15px] font-medium leading-normal tracking-wide">
              {{ activeTab === 'flights' ? $t('search.departure') : $t('search.where') }}
            </h4>
            <div class="relative">
              <ClientOnly>
                <DestinationPicker v-if="activeTab === 'hotels'" class="search-input-inline" />
                <template #fallback>
                  <input
                    v-model="searchStore.location"
                    type="text"
                    :placeholder="$t('search.destination')"
                    class="w-full text-[15px] text-gray-500 leading-normal bg-transparent focus:outline-none"
                  />
                </template>
              </ClientOnly>
              <input
                v-if="activeTab !== 'hotels'"
                v-model="searchStore.location"
                type="text"
                :placeholder="$t('search.destination')"
                class="w-full text-[15px] text-gray-500 leading-normal bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <!-- Tour month selector -->
          <div v-if="activeTab === 'tours'" class="searchMenu-date px-8 lg:py-5 lg:px-0 relative" ref="monthRef">
            <button type="button" @click="monthOpen = !monthOpen" class="w-full text-left">
              <h4 class="text-[15px] font-medium leading-normal tracking-wide">
                {{ $t('search.when') }}
              </h4>
              <div class="text-[15px] text-gray-500 leading-normal cursor-pointer">
                {{ selectedMonthLabel || $t('search.selectMonth') }}
              </div>
            </button>
            <!-- Month dropdown -->
            <Transition name="dropdown">
              <div
                v-if="monthOpen"
                class="absolute top-full left-0 mt-5 bg-white rounded shadow-lg min-w-[300px] z-30"
              >
                <div class="px-5 py-5 sm:px-0 sm:py-4">
                  <ul class="space-y-1.5">
                    <li
                      v-for="month in monthOptions"
                      :key="month.value"
                      class="cursor-pointer rounded px-0 pr-4 py-4"
                      :class="tourMonth === month.value ? 'bg-site-primary/5' : 'hover:bg-gray-50'"
                      @click="selectMonth(month.value)"
                    >
                      <div class="flex items-center">
                        <svg class="w-5 h-5 text-gray-400 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <div class="text-[15px] font-medium">{{ month.label }}</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Date Range (hotels, transfer, etc.) -->
          <div v-else class="searchMenu-date px-8 lg:py-5 lg:px-0">
            <h4 class="text-[15px] font-medium leading-normal tracking-wide">
              {{ $t('search.when') }}
            </h4>
            <DateRangePicker
              :model-check-in="searchStore.checkIn"
              :model-check-out="searchStore.checkOut"
              @update:model-check-in="searchStore.checkIn = $event"
              @update:model-check-out="searchStore.checkOut = $event"
            />
          </div>

          <!-- Guests -->
          <div
            v-if="activeTab !== 'flights'"
            class="searchMenu-guests px-8 lg:py-5 lg:px-0 relative"
            ref="guestRef"
          >
            <button type="button" @click="guestOpen = !guestOpen" class="w-full text-left">
              <h4 class="text-[15px] font-medium leading-normal tracking-wide">
                {{ $t('search.who') }}
              </h4>
              <div class="text-[15px] text-gray-500 leading-normal">
                {{ searchStore.adults }} {{ $t('search.adults') }}
                <template v-if="searchStore.children.length">
                  , {{ searchStore.children.length }} {{ $t('search.children') }}
                </template>
              </div>
            </button>
            <Transition name="dropdown">
              <div v-if="guestOpen" class="absolute top-full left-0 mt-5 z-30">
                <GuestSelector @close="guestOpen = false" />
              </div>
            </Transition>
          </div>

          <!-- Search button -->
          <div class="button-item">
            <button
              type="submit"
              class="mainSearch__submit flex items-center justify-center h-[60px] px-9 w-full rounded-full bg-site-primary text-white font-medium hover:bg-site-primary-dark transition-colors"
            >
              <svg class="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path stroke-linecap="round" d="m21 21-4.3-4.3" />
              </svg>
              {{ $t('common.search') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

const monthOptions = computed(() => {
  const now = new Date()
  const months: { value: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const localeTag = locale.value === 'tr' ? 'tr-TR' : locale.value === 'en' ? 'en-US' : locale.value
    const label = d.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })
    months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
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

const canonicalKey: Record<string, string> = {
  hotel: 'hotels', hotels: 'hotels',
  flight: 'flights', flights: 'flights',
  tour: 'tours', tours: 'tours',
  transfer: 'transfer',
  cruise: 'cruises', cruises: 'cruises',
  activity: 'activities', activities: 'activities'
}

const tabLabels: Record<string, () => string> = {
  hotels: () => t('common.hotels'),
  flights: () => t('search.flights'),
  tours: () => t('common.tours'),
  transfer: () => t('search.transfer'),
  cruises: () => t('sections.cruiseDeals'),
  activities: () => t('search.activities')
}

const availableTabs = computed(() => {
  const searchOptions = storefront.hero?.searchOptions
  const keys = searchOptions?.length ? searchOptions : ['hotel', 'flight', 'tour', 'transfer']
  return keys
    .filter((key: string) => canonicalKey[key])
    .map((key: string) => {
      const canonical = canonicalKey[key] || key
      return { key: canonical, label: tabLabels[canonical]?.() || canonical }
    })
})

function handleSearch() {
  const query: Record<string, string> = {}
  if (searchStore.city) query.city = searchStore.city
  else if (searchStore.location) query.city = searchStore.location
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

<style scoped>
.button-grid {
  display: grid;
  grid-template-columns: 1fr 250px 290px auto;
  align-items: center;
}

@media (max-width: 1023px) {
  .button-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .mainSearch {
    border-radius: 4px !important;
  }

  .mainSearch__submit {
    height: 48px;
    min-width: 140px;
    white-space: nowrap;
  }
}

.search-input-inline :deep(label) {
  display: none;
}
.search-input-inline :deep(.flex.items-center.gap-2\.5) svg {
  display: none;
}
.search-input-inline :deep(input) {
  font-size: 15px;
  color: var(--color-gray-500, #6b7280);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
