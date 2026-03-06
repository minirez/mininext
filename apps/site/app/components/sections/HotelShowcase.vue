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
        <!-- Image: 1:1 square -->
        <div class="relative rounded overflow-hidden" style="aspect-ratio: 1/1">
          <img
            v-if="resolveHotelImage(hotel)"
            :src="resolveHotelImage(hotel)"
            :alt="hotel.name"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div v-else class="w-full h-full bg-gray-100" />

          <!-- Wishlist button -->
          <button
            class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:text-red-500 transition-colors"
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
            class="absolute top-3 left-0 py-1.5 px-4 rounded-r text-xs font-medium uppercase text-white bg-site-primary"
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

function resolveHotelImage(hotel: any): string {
  const directImage = getDirectImageValue(hotel)
  if (directImage) return imageUrl(directImage)
  return ''
}

const missingMediaSlugs = computed(() => {
  return displayedHotels.value
    .filter((hotel: any) => !getDirectImageValue(hotel))
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
        const image =
          d.image ||
          d.images?.find((img: any) => img.isMain)?.url ||
          d.images?.[0]?.url ||
          d.logo ||
          ''

        fallbackDataBySlug.value = {
          ...fallbackDataBySlug.value,
          [slug]: {
            ...(image ? { image } : {}),
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
