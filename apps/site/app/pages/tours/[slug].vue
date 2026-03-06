<template>
  <div class="bg-white min-h-screen">
    <!-- Loading state -->
    <div v-if="loading" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-48 mb-6" />
        <div class="rounded-xl bg-gray-200 w-full" style="aspect-ratio: 16/7" />
        <div class="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-4">
            <div class="h-8 bg-gray-200 rounded w-3/4" />
            <div class="h-4 bg-gray-200 rounded w-1/2" />
            <div class="h-32 bg-gray-200 rounded" />
          </div>
          <div class="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">{{ $t('common.error') }}</h1>
      <p class="text-gray-500 mb-6">{{ error }}</p>
      <NuxtLink to="/tours" class="text-site-primary hover:underline">
        &larr; {{ $t('common.back') }}
      </NuxtLink>
    </div>

    <!-- Tour content -->
    <template v-else-if="tour">
      <!-- Gallery -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <Breadcrumb
          :items="[
            { label: $t('common.home'), to: '/' },
            { label: $t('common.tours'), to: '/tours' },
            { label: tourName }
          ]"
          class="mb-4"
        />

        <div v-if="galleryImages.length" class="relative rounded-xl overflow-hidden">
          <div
            v-if="galleryImages.length === 1"
            class="w-full rounded-xl overflow-hidden"
            style="aspect-ratio: 16/7"
          >
            <img
              :src="galleryImages[0]"
              :alt="tourName"
              class="w-full h-full object-cover cursor-pointer"
              @click="openGallery(0)"
            />
          </div>
          <div v-else class="grid grid-cols-4 grid-rows-2 gap-2" style="height: 420px">
            <div
              class="col-span-2 row-span-2 rounded-l-xl overflow-hidden cursor-pointer"
              @click="openGallery(0)"
            >
              <img
                :src="galleryImages[0]"
                :alt="tourName"
                class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div
              v-for="(img, i) in galleryImages.slice(1, 5)"
              :key="i"
              class="overflow-hidden cursor-pointer"
              :class="{
                'rounded-tr-xl': i === 0,
                'rounded-br-xl': i === 3 || (i === galleryImages.slice(1, 5).length - 1 && i >= 2)
              }"
              @click="openGallery(i + 1)"
            >
              <div class="relative w-full h-full">
                <img
                  :src="img"
                  :alt="`${tourName} - ${i + 2}`"
                  class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <div
                  v-if="i === 3 && galleryImages.length > 5"
                  class="absolute inset-0 bg-black/50 flex items-center justify-center"
                >
                  <span class="text-white font-semibold text-lg">
                    +{{ galleryImages.length - 5 }} {{ $t('tour.allPhotos') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Main content -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <!-- Left: Tour info (2/3) -->
          <div class="lg:col-span-2">
            <!-- Title & meta -->
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">{{ tourName }}</h1>

            <div class="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
              <span v-if="tourLocation" class="flex items-center gap-1">
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z"
                  />
                </svg>
                {{ tourLocation }}
              </span>
              <span
                v-if="tourType"
                class="px-2.5 py-0.5 bg-site-primary/10 text-site-primary rounded-full text-xs font-medium capitalize"
              >
                {{ tourType }}
              </span>
            </div>

            <!-- Quick stats -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 p-4 bg-gray-50 rounded-xl">
              <div v-if="durationText" class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg bg-site-primary/10 flex items-center justify-center shrink-0"
                >
                  <svg
                    class="w-5 h-5 text-site-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <div class="text-xs text-gray-500">{{ $t('tour.duration') }}</div>
                  <div class="text-sm font-medium text-gray-900">{{ durationText }}</div>
                </div>
              </div>
              <div v-if="tourType" class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg bg-site-primary/10 flex items-center justify-center shrink-0"
                >
                  <svg
                    class="w-5 h-5 text-site-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-xs text-gray-500">{{ $t('tour.type') }}</div>
                  <div class="text-sm font-medium text-gray-900 capitalize">{{ tourType }}</div>
                </div>
              </div>
            </div>

            <!-- Overview / Description -->
            <div class="mt-8">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ $t('tour.overview') }}</h2>
              <div
                v-if="tourDescription"
                class="prose prose-gray max-w-none text-gray-600 leading-relaxed"
                v-html="tourDescription"
              />
              <p v-else class="text-gray-500">{{ $t('tour.noDescription') }}</p>
            </div>

            <!-- Included / Excluded services -->
            <div
              v-if="includedServices.length || excludedServices.length"
              class="mt-8 pt-8 border-t"
            >
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div v-if="includedServices.length">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">
                    {{ $t('tour.included') }}
                  </h3>
                  <ul class="space-y-2.5">
                    <li
                      v-for="(svc, i) in includedServices"
                      :key="i"
                      class="flex items-start gap-2.5"
                    >
                      <svg
                        class="w-5 h-5 text-green-500 shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span class="text-gray-600 text-sm">{{ svc }}</span>
                    </li>
                  </ul>
                </div>
                <div v-if="excludedServices.length">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">
                    {{ $t('tour.notIncluded') }}
                  </h3>
                  <ul class="space-y-2.5">
                    <li
                      v-for="(svc, i) in excludedServices"
                      :key="i"
                      class="flex items-start gap-2.5"
                    >
                      <svg
                        class="w-5 h-5 text-red-400 shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span class="text-gray-600 text-sm">{{ svc }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Route Plan / Itinerary -->
            <div v-if="routeStops.length" class="mt-8 pt-8 border-t">
              <h2 class="text-xl font-semibold text-gray-900 mb-6">{{ $t('tour.itinerary') }}</h2>
              <div class="space-y-0">
                <div v-for="(stop, i) in routeStops" :key="i" class="relative pl-8 pb-8 last:pb-0">
                  <div
                    v-if="i < routeStops.length - 1"
                    class="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200"
                  />
                  <div
                    class="absolute left-0 top-1 w-6 h-6 rounded-full bg-site-primary text-white text-xs font-semibold flex items-center justify-center"
                  >
                    {{ i + 1 }}
                  </div>
                  <div class="bg-gray-50 rounded-xl p-4">
                    <h4 class="font-medium text-gray-900">
                      {{ stop.title || stop.locationName || `${$t('tour.stop')} ${i + 1}` }}
                    </h4>
                    <p v-if="stop.description" class="text-sm text-gray-600 mt-1">
                      {{ stop.description }}
                    </p>
                    <div v-if="stop.stay" class="text-xs text-gray-500 mt-2">
                      {{ stop.stay }}
                    </div>
                    <img
                      v-if="stop.photoUrl"
                      :src="stop.photoUrl"
                      :alt="stop.title"
                      class="mt-3 rounded-lg w-full max-h-48 object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Sidebar (1/3) -->
          <div class="lg:col-span-1">
            <div class="sticky top-28">
              <div class="bg-white border rounded-xl p-6 shadow-sm">
                <div v-if="tourPrice > 0" class="mb-4">
                  <span class="text-sm text-gray-500">{{ $t('common.from') }}</span>
                  <div class="text-2xl font-bold text-gray-900 mt-0.5">
                    {{ formattedPrice }}
                  </div>
                  <span class="text-xs text-gray-400">/ {{ $t('common.person') }}</span>
                </div>

                <button
                  class="w-full py-3.5 bg-site-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  {{ $t('tour.addToCart') }}
                </button>

                <div v-if="tourTags.length" class="mt-5 pt-5 border-t">
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="tag in tourTags"
                      :key="tag"
                      class="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- Gallery lightbox -->
    <Teleport to="body">
      <div
        v-if="galleryOpen"
        class="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
        @click.self="galleryOpen = false"
      >
        <button
          class="absolute top-4 right-4 text-white/80 hover:text-white z-10"
          @click="galleryOpen = false"
        >
          <svg
            class="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          v-if="galleryImages.length > 1"
          class="absolute left-4 text-white/80 hover:text-white z-10"
          @click="galleryIndex = (galleryIndex - 1 + galleryImages.length) % galleryImages.length"
        >
          <svg
            class="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <img
          :src="galleryImages[galleryIndex]"
          :alt="`${tourName} - ${galleryIndex + 1}`"
          class="max-w-[90vw] max-h-[85vh] object-contain rounded"
        />
        <button
          v-if="galleryImages.length > 1"
          class="absolute right-4 text-white/80 hover:text-white z-10"
          @click="galleryIndex = (galleryIndex + 1) % galleryImages.length"
        >
          <svg
            class="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        <div class="absolute bottom-4 text-white/60 text-sm">
          {{ galleryIndex + 1 }} / {{ galleryImages.length }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const api = useApi()
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()
const partner = usePartnerStore()
const { locale } = useI18n()

const loading = ref(true)
const error = ref('')
const tour = ref<any>(null)

const galleryOpen = ref(false)
const galleryIndex = ref(0)

function openGallery(index: number) {
  galleryIndex.value = index
  galleryOpen.value = true
}

function getLangValue(arr: any, preferredLangs?: string[]): string {
  const langs = preferredLangs || [locale.value, 'en', 'tr']
  if (!Array.isArray(arr)) {
    if (typeof arr === 'string') return arr
    if (arr && typeof arr === 'object') return arr.tr || arr.en || ''
    return ''
  }
  for (const lang of langs) {
    const entry = arr.find((i: any) => i.lang === lang && i.value)
    if (entry) return entry.value
  }
  const first = arr.find((i: any) => i.value)
  return first?.value || ''
}

const tourName = computed(() => {
  if (!tour.value) return ''
  const raw = tour.value
  return getLangValue(raw.name) || raw.name?.tr || raw.name?.en || slug
})

const tourLocation = computed(() => {
  if (!tour.value) return ''
  return tour.value.primaryLocation?.name || ''
})

const tourType = computed(() => tour.value?.type || '')

const tourDescription = computed(() => {
  if (!tour.value?.content) return ''
  return (
    getLangValue(tour.value.content.description) ||
    getLangValue(tour.value.content.shortDescription) ||
    ''
  )
})

const galleryImages = computed(() => {
  if (!tour.value?.gallery?.length) return []
  return tour.value.gallery
    .sort((a: any, b: any) => {
      if (a.isMain && !b.isMain) return -1
      if (!a.isMain && b.isMain) return 1
      return (a.order || 0) - (b.order || 0)
    })
    .map((img: any) => imageUrl(img.url || img.link || img))
    .filter(Boolean)
})

const durationText = computed(() => {
  const bp = tour.value?.basePricing
  if (!bp) return ''
  const nights = bp.nights || bp.duration?.nights || 0
  const days = bp.days || bp.duration?.days || nights + 1
  if (days > 0)
    return `${days} ${days === 1 ? 'day' : 'days'}${nights > 0 ? ` / ${nights} ${nights === 1 ? 'night' : 'nights'}` : ''}`
  return ''
})

const tourPrice = computed(() => {
  const bp = tour.value?.basePricing
  if (!bp) return 0
  return bp.adultPrice?.value || bp.perPerson?.value || 0
})

const formattedPrice = computed(() => {
  if (!tourPrice.value) return ''
  const bp = tour.value?.basePricing
  const currency = bp?.adultPrice?.currency || bp?.perPerson?.currency || 'TRY'
  try {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(tourPrice.value)
  } catch {
    return `${tourPrice.value} ${currency}`
  }
})

const includedServices = computed(() => {
  const services = tour.value?.content?.services?.included || []
  return services.map((s: any) => getLangValue(s)).filter(Boolean)
})

const excludedServices = computed(() => {
  const services = tour.value?.content?.services?.excluded || []
  return services.map((s: any) => getLangValue(s)).filter(Boolean)
})

const routeStops = computed(() => {
  const stops = tour.value?.routePlan?.stops || []
  return stops
    .sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0))
    .map((stop: any) => {
      const stayValue = stop.stay?.value || 0
      const stayUnit = stop.stay?.unit || 'days'
      let stayText = ''
      if (stayValue > 0) {
        stayText = `${stayValue} ${stayUnit}`
        if (stop.stay?.timeWindow?.start && stop.stay?.timeWindow?.end) {
          stayText += ` (${stop.stay.timeWindow.start} - ${stop.stay.timeWindow.end})`
        }
      }
      return {
        title: getLangValue(stop.title) || stop.locationSnapshot?.name,
        description: getLangValue(stop.description),
        locationName: stop.locationSnapshot?.name || '',
        stay: stayText,
        photoUrl: stop.photo?.url ? imageUrl(stop.photo.url) : ''
      }
    })
})

const tourTags = computed(() => tour.value?.tags || [])

async function fetchTour() {
  loading.value = true
  error.value = ''
  try {
    const domain = import.meta.client ? window.location.hostname : ''
    const res = await api.get<any>(`/api/storefronts/tour/${encodeURIComponent(slug)}`, {
      referer: domain
    })
    if (res.status && res.record) {
      tour.value = res.record
    } else {
      error.value = res.msg || 'Tour not found'
    }
  } catch (e: any) {
    error.value = e?.message || 'Failed to load tour'
  } finally {
    loading.value = false
  }
}

watch(
  tourName,
  name => {
    if (name) useSeo({ title: name })
  },
  { immediate: true }
)

if (!tourName.value) {
  useSeo({ title: slug })
}

onMounted(() => {
  fetchTour()
})
</script>
