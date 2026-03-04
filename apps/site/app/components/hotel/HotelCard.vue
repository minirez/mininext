<template>
  <NuxtLink
    :to="`/hotels/${hotel.slug}`"
    class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
  >
    <!-- Image -->
    <div class="relative aspect-[4/3] overflow-hidden">
      <img
        v-if="hotel.logo || hotel.image || hotel.images?.[0]?.url"
        :src="imageUrl(hotel.logo || hotel.image || hotel.images?.[0]?.url)"
        :alt="hotel.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div v-else class="w-full h-full bg-gray-100 img-placeholder" />

      <!-- Favorite button (top right) -->
      <div class="absolute top-3 right-3">
        <FavoriteButton :hotel-id="hotel.id || hotel.slug" />
      </div>

      <!-- Badge (top left) -->
      <div class="absolute top-3 left-3 flex gap-1.5">
        <Badge v-if="hotel.featured" variant="warning">Featured</Badge>
        <Badge v-if="hotel.type && hotel.type !== 'hotel'" variant="neutral">
          {{ hotel.type }}
        </Badge>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Location -->
      <p v-if="hotel.city" class="text-xs text-gray-400 flex items-center gap-1 mb-1">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
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
        {{ hotel.city }}<template v-if="hotel.country">, {{ hotel.country }}</template>
      </p>

      <!-- Hotel name -->
      <h3
        class="font-bold text-gray-900 line-clamp-1 group-hover:text-site-primary transition-colors"
      >
        {{ hotel.name }}
      </h3>

      <!-- Stars -->
      <div class="mt-1.5">
        <StarRating v-if="hotel.stars" :stars="hotel.stars" />
      </div>

      <!-- Price -->
      <div class="mt-3 pt-3 border-t border-gray-100">
        <!-- Live price from search -->
        <template v-if="priceData">
          <!-- Loading shimmer -->
          <div v-if="priceData.loading" class="flex items-end justify-between">
            <div class="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            <div class="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <!-- Available with price -->
          <div
            v-else-if="priceData.available && priceData.price"
            class="flex items-end justify-between"
          >
            <div>
              <span v-if="priceData.mealPlan" class="block text-[10px] text-gray-400 mb-0.5">{{
                priceData.mealPlan
              }}</span>
              <span class="text-xs text-gray-400">{{ $t('common.perNight') }}</span>
            </div>
            <div class="text-right">
              <span class="text-lg font-bold text-site-primary">
                {{ formatPriceValue(priceData.perNight || priceData.price, priceData.currency) }}
              </span>
              <span
                v-if="priceData.perNight && priceData.price !== priceData.perNight"
                class="block text-xs text-gray-400"
              >
                {{ $t('common.total') }} {{ formatPriceValue(priceData.price, priceData.currency) }}
              </span>
            </div>
          </div>
          <!-- Not available -->
          <div v-else-if="priceData.available === false" class="flex items-center justify-center">
            <span class="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded">{{
              $t('hotel.notAvailable')
            }}</span>
          </div>
        </template>
        <!-- Static price (no search) -->
        <div v-else-if="hotel.minPrice || hotel.price" class="flex items-end justify-between">
          <span class="text-xs text-gray-400">{{ $t('common.from') }}</span>
          <span class="text-lg font-bold text-site-primary">
            {{ formatPriceValue(hotel.minPrice || hotel.price) }}
          </span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  hotel: any
  priceData?: {
    loading: boolean
    price?: number
    currency?: string
    available?: boolean
    mealPlan?: string
    perNight?: number
    error?: boolean
  }
}>()

const { imageUrl } = useImageUrl()
const searchStore = useSearchStore()

function formatPriceValue(price: number | string | undefined, currency?: string) {
  if (!price) return ''
  const num = typeof price === 'string' ? parseFloat(price) : price
  const cur = currency || searchStore.currency
  const symbols: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€', GBP: '£', RUB: '₽' }
  const symbol = symbols[cur] || cur + ' '
  return `${symbol}${num.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
</script>
