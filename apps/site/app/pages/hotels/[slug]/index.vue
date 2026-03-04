<template>
  <div v-if="hotel" class="bg-white">
    <!-- Gallery -->
    <HotelGallery v-if="hotel.images?.length" :images="hotel.images" :hotel-name="hotel.name" />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <Breadcrumb :items="breadcrumbs" class="mb-4" />

      <!-- Header -->
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">{{ hotel.name }}</h1>
            <StarRating v-if="hotel.stars" :stars="hotel.stars" />
          </div>
          <p v-if="hotel.address" class="text-gray-500 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z"
              />
            </svg>
            {{
              hotel.address.formattedAddress || `${hotel.address.city}, ${hotel.address.country}`
            }}
          </p>
        </div>

        <div class="flex gap-3">
          <button
            @click="scrollToRooms"
            class="inline-flex items-center px-6 py-3 bg-site-primary text-white font-medium rounded-xl hover:bg-site-primary-dark transition-colors"
          >
            {{ $t('common.bookNow') }}
          </button>
        </div>
      </div>

      <!-- Content grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Description -->
          <div v-if="ml(hotel.description) || hotel.stars">
            <p class="text-gray-700 leading-relaxed">
              {{
                ml(hotel.description) ||
                $t('hotel.defaultDescription', {
                  name: hotel.name,
                  stars: hotel.stars || '',
                  city: hotel.address?.city || ''
                })
              }}
            </p>
          </div>

          <!-- Profile sections -->
          <HotelProfile :hotel="hotel" :sections="profileSections" />

          <!-- Amenities -->
          <HotelAmenities v-if="hotel.amenities?.length" :amenities="hotel.amenities" />

          <!-- Policies -->
          <HotelPolicies v-if="hotel.policies" :policies="hotel.policies" />

          <!-- Room Availability -->
          <RoomAvailability :hotel-code="hotel.hotelCode || slug" />
        </div>

        <!-- Sidebar -->
        <aside class="space-y-6">
          <!-- Search Sidebar -->
          <SearchSidebar @search="scrollToRooms" />

          <!-- Map -->
          <div
            v-if="hotel.address?.coordinates && mapboxToken"
            class="rounded-xl overflow-hidden border border-gray-200 h-[250px]"
          >
            <HotelMap :coordinates="hotel.address.coordinates" :name="hotel.name" />
          </div>
          <div v-else-if="hotel.address" class="bg-gray-50 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-1">
              <svg
                class="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z"
                />
              </svg>
              <h3 class="font-semibold text-gray-800 text-sm">{{ $t('hotel.location') }}</h3>
            </div>
            <p class="text-sm text-gray-600">
              {{
                hotel.address.formattedAddress || `${hotel.address.city}, ${hotel.address.country}`
              }}
            </p>
          </div>

          <!-- Contact -->
          <div v-if="hotel.contact" class="bg-gray-50 rounded-xl p-4 space-y-2">
            <h3 class="font-semibold text-gray-800">{{ $t('common.contact') }}</h3>
            <p v-if="hotel.contact.phone" class="text-sm text-gray-600">
              <a :href="`tel:${hotel.contact.phone}`" class="hover:text-site-primary">{{
                hotel.contact.phone
              }}</a>
            </p>
            <p v-if="hotel.contact.email" class="text-sm text-gray-600">
              <a :href="`mailto:${hotel.contact.email}`" class="hover:text-site-primary">{{
                hotel.contact.email
              }}</a>
            </p>
          </div>
        </aside>
      </div>
    </div>

    <!-- Floating Cart Bar -->
    <CartBar :hotel-code="hotel.hotelCode || slug" />
  </div>

  <!-- Loading state -->
  <div v-else-if="loading" class="max-w-7xl mx-auto px-4 py-8">
    <Skeleton height="400px" rounded="rounded-xl" class="mb-6" />
    <Skeleton height="32px" width="300px" class="mb-4" />
    <Skeleton height="20px" width="200px" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const { ml } = useMultiLang()
const { t: $t } = useI18n()
const partner = usePartnerStore()
const searchStore = useSearchStore()
const mapboxToken = useRuntimeConfig().public.mapboxToken

const { hotel, loading, profileSections, fetchHotel } = useHotelDetail(slug)

await fetchHotel()

// Parse search params from query
if (route.query.checkIn && !searchStore.checkIn) searchStore.checkIn = route.query.checkIn as string
if (route.query.checkOut && !searchStore.checkOut)
  searchStore.checkOut = route.query.checkOut as string
if (route.query.adults) searchStore.adults = Number(route.query.adults)

function scrollToRooms() {
  const el = document.getElementById('room-availability')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const breadcrumbs = computed(() => [
  { label: $t('common.home'), to: '/' },
  { label: $t('common.hotels'), to: '/hotels' },
  ...(hotel.value?.address?.city
    ? [{ label: hotel.value.address.city, to: `/destinations/${hotel.value.address.city}` }]
    : []),
  { label: hotel.value?.name || '', to: `/hotels/${slug}` }
])

// SEO
watchEffect(() => {
  if (hotel.value) {
    useSeo({
      title: hotel.value.name,
      description: ml(hotel.value.seo?.description) || ml(hotel.value.description) || '',
      image: hotel.value.images?.[0]?.url,
      type: 'hotel'
    })
  }
})
</script>
