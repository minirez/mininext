<template>
  <Carousel
    :title="title || $t('sections.popularHotels')"
    :description="description"
    view-all-link="/hotels"
    :show-arrows="items.length > 3"
    :show-dots="items.length > 4"
    :gap="30"
    bg-class="bg-white"
  >
    <div
      v-for="(hotel, i) in displayedHotels"
      :key="hotel.id || i"
      class="shrink-0 w-[260px] sm:w-[280px] snap-start"
    >
      <NuxtLink :to="`/hotels/${hotel.slug || hotel.id}`" class="group block">
        <!-- Image: 1:1 square with photo carousel -->
        <div class="relative rounded overflow-hidden" style="aspect-ratio: 1/1">
          <div v-if="resolveHotelImages(hotel).length" class="relative w-full h-full">
            <img
              v-for="(src, imgIdx) in resolveHotelImages(hotel)"
              :key="imgIdx"
              :src="src"
              :alt="hotel.name"
              class="absolute inset-0 w-full h-full object-cover transition-all duration-500"
              :class="
                imgIdx === (activeSlide[hotel.slug || hotel.id || i] || 0)
                  ? 'opacity-100 scale-100 group-hover:scale-105'
                  : 'opacity-0 scale-100'
              "
              loading="lazy"
            />
            <template v-if="resolveHotelImages(hotel).length > 1">
              <button
                class="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/70 shadow flex items-center justify-center transition-all hover:bg-white hover:scale-110"
                @click.stop.prevent="
                  prevSlide(hotel.slug || hotel.id || i, resolveHotelImages(hotel).length)
                "
              >
                <svg
                  class="w-3.5 h-3.5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
              <button
                class="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/70 shadow flex items-center justify-center transition-all hover:bg-white hover:scale-110"
                @click.stop.prevent="
                  nextSlide(hotel.slug || hotel.id || i, resolveHotelImages(hotel).length)
                "
              >
                <svg
                  class="w-3.5 h-3.5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
              <div class="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
                <span
                  v-for="(_, dotIdx) in resolveHotelImages(hotel).slice(0, 5)"
                  :key="dotIdx"
                  class="w-1.5 h-1.5 rounded-full transition-colors"
                  :class="
                    dotIdx === (activeSlide[hotel.slug || hotel.id || i] || 0)
                      ? 'bg-white'
                      : 'bg-white/50'
                  "
                />
              </div>
            </template>
          </div>
          <div v-else class="w-full h-full bg-gray-100" />

          <!-- Wishlist button -->
          <button
            class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:text-red-500 transition-colors z-10"
          >
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
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>

          <!-- Badge -->
          <span
            v-if="hotel.tag"
            class="absolute top-3 left-0 py-1.5 px-4 rounded-r text-xs font-medium uppercase text-white bg-site-primary z-10"
          >
            {{ hotel.tag }}
          </span>
        </div>

        <!-- Content -->
        <div class="mt-2.5">
          <!-- Location with dot separator -->
          <div class="flex items-center text-sm text-gray-500 leading-snug">
            <span v-if="hotel.city && !isObjectIdString(hotel.city)">{{ hotel.city }}</span>
            <span
              v-if="
                hotel.city &&
                !isObjectIdString(hotel.city) &&
                hotel.country &&
                !isObjectIdString(hotel.country)
              "
              class="mx-2.5 w-[3px] h-[3px] rounded-full bg-gray-400 shrink-0"
            />
            <span v-if="hotel.country && !isObjectIdString(hotel.country)">{{
              hotel.country
            }}</span>
            <template v-if="!hotel.city && hotel.location && !isObjectIdString(hotel.location)">
              <span>{{ hotel.location }}</span>
            </template>
          </div>

          <!-- Name -->
          <h4
            class="text-lg font-medium text-gray-900 mt-1 group-hover:underline leading-tight line-clamp-1"
          >
            {{ hotel.name }}
          </h4>

          <!-- Stars -->
          <div v-if="hotel.stars" class="flex items-center gap-0.5 mt-1">
            <svg
              v-for="s in 5"
              :key="s"
              class="w-2.5 h-2.5"
              :class="s <= hotel.stars ? 'text-yellow-400' : 'text-gray-300'"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          </div>

          <!-- Price -->
          <div v-if="hotel.price || hotel.minPrice" class="flex items-center gap-1 mt-2">
            <span class="text-sm text-gray-500">{{ $t('common.from') }}</span>
            <span class="font-medium text-site-primary">{{
              formatPrice(hotel.minPrice || hotel.price, hotel.currency)
            }}</span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </Carousel>
</template>

<script setup lang="ts">
const props = defineProps<{
  title?: string
  description?: string
  items: any[]
}>()

const api = useApi()
const { imageUrl } = useImageUrl()
const partner = usePartnerStore()
const searchStore = useSearchStore()
const fallbackDataBySlug = ref<Record<string, any>>({})
const mediaFetchInFlight = ref<Record<string, boolean>>({})
const activeSlide = ref<Record<string, number>>({})

function normalizeId(value: unknown): string {
  return String(value ?? '').trim()
}

function normalizeSlug(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function normalizeName(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function getDirectImageValue(hotel: any) {
  return (
    hotel?.image ||
    hotel?.images?.[0]?.url ||
    hotel?.images?.[0]?.link ||
    hotel?.photo?.link ||
    hotel?.photo?.url ||
    hotel?.photo ||
    hotel?.logo ||
    ''
  )
}

function isObjectIdString(val: unknown): boolean {
  return typeof val === 'string' && /^[a-f\d]{24}$/i.test(val)
}

const displayedHotels = computed(() => {
  const partnerHotels = Array.isArray(partner.hotels) ? partner.hotels : []

  return props.items.slice(0, 12).map(item => {
    const itemId = normalizeId(item?.id || item?._id)
    const itemSlug = normalizeSlug(item?.slug)
    const itemName = normalizeName(item?.name)

    const fullHotel = partnerHotels.find((h: any) => {
      const hotelId = normalizeId(h?.id || h?._id)
      const hotelSlug = normalizeSlug(h?.slug)
      const hotelName = normalizeName(h?.name)

      if (itemId && hotelId) return hotelId === itemId
      if (itemSlug && hotelSlug) return hotelSlug === itemSlug
      return Boolean(itemName && hotelName && hotelName === itemName)
    })

    const slug = normalizeSlug(item?.slug || fullHotel?.slug)
    const fetchedData = slug ? fallbackDataBySlug.value[slug] : null

    return { ...item, ...fullHotel, ...fetchedData }
  })
})

function resolveHotelImages(hotel: any): string[] {
  const photos: string[] = []

  if (Array.isArray(hotel?.photos) && hotel.photos.length) {
    for (const p of hotel.photos) {
      const url = typeof p === 'string' ? p : p?.url || p?.link || ''
      if (url) photos.push(imageUrl(url))
    }
  }

  if (Array.isArray(hotel?.images) && hotel.images.length && !photos.length) {
    for (const img of hotel.images) {
      const url = typeof img === 'string' ? img : img?.url || img?.link || ''
      if (url) photos.push(imageUrl(url))
    }
  }

  if (!photos.length) {
    const single = getDirectImageValue(hotel)
    if (single) photos.push(imageUrl(single))
  }

  return photos
}

function nextSlide(key: string | number, total: number) {
  const k = String(key)
  const cur = activeSlide.value[k] || 0
  activeSlide.value = { ...activeSlide.value, [k]: (cur + 1) % total }
}

function prevSlide(key: string | number, total: number) {
  const k = String(key)
  const cur = activeSlide.value[k] || 0
  activeSlide.value = { ...activeSlide.value, [k]: (cur - 1 + total) % total }
}

const missingMediaSlugs = computed(() => {
  return displayedHotels.value
    .filter((hotel: any) => !resolveHotelImages(hotel).length)
    .map((hotel: any) => normalizeSlug(hotel?.slug))
    .filter((slug: string) => Boolean(slug))
    .filter((slug: string) => !fallbackDataBySlug.value[slug] && !mediaFetchInFlight.value[slug])
})

async function fetchHotelMedia(slugs: string[]) {
  const uniqueSlugs = Array.from(new Set(slugs.filter(Boolean)))
  if (!uniqueSlugs.length) return

  await Promise.all(
    uniqueSlugs.map(async slug => {
      mediaFetchInFlight.value = { ...mediaFetchInFlight.value, [slug]: true }

      try {
        const res = await api.get<{ success: boolean; data: any }>(`/api/public/hotels/${slug}`)
        if (!res?.success || !res?.data) return

        const d = res.data
        const photos: string[] = []
        if (Array.isArray(d.photos) && d.photos.length) {
          for (const p of d.photos) {
            const url = typeof p === 'string' ? p : p?.url || p?.link || ''
            if (url) photos.push(url)
          }
        }
        if (!photos.length && Array.isArray(d.images) && d.images.length) {
          for (const img of d.images) {
            const url = typeof img === 'string' ? img : img?.url || img?.link || ''
            if (url) photos.push(url)
          }
        }
        const image = photos[0] || d.image || d.logo || ''

        fallbackDataBySlug.value = {
          ...fallbackDataBySlug.value,
          [slug]: {
            ...(image ? { image } : {}),
            ...(photos.length ? { photos } : {}),
            ...(d.stars ? { stars: d.stars } : {}),
            ...(d.address?.city ? { city: d.address.city } : {}),
            ...(d.address?.country ? { country: d.address.country } : {}),
            slug: d.slug || slug
          }
        }
      } catch {
        // Non-critical: cards render without photo when fetch fails
      }
    })
  )
}

onServerPrefetch(async () => {
  await fetchHotelMedia(missingMediaSlugs.value)
})

watch(
  missingMediaSlugs,
  slugs => {
    if (typeof window === 'undefined' || !slugs.length) return
    void fetchHotelMedia(slugs)
  },
  { immediate: true }
)

function formatPrice(price: number | string, currency?: string) {
  if (!price) return ''
  const num = typeof price === 'string' ? parseFloat(price) : price
  const cur = currency || searchStore.currency || 'TRY'
  const symbols: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€', GBP: '£', RUB: '₽' }
  const symbol = symbols[cur.toUpperCase()] || cur + ' '
  return `${symbol}${num.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
</script>
