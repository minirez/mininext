<template>
  <div class="space-y-6">
    <!-- Star rating -->
    <div>
      <button
        @click="starsOpen = !starsOpen"
        class="flex items-center justify-between w-full text-sm font-semibold text-gray-800 mb-3"
      >
        {{ $t('filter.starRating') }}
        <svg
          class="w-4 h-4 text-gray-400 transition-transform"
          :class="starsOpen ? 'rotate-180' : ''"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div v-show="starsOpen" class="space-y-1.5">
        <label
          v-for="star in [5, 4, 3, 2, 1]"
          :key="star"
          class="flex items-center gap-3 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span
            class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0"
            :class="
              searchStore.filters.stars.includes(star)
                ? 'border-site-primary bg-site-primary'
                : 'border-gray-300'
            "
          >
            <svg
              v-if="searchStore.filters.stars.includes(star)"
              class="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="3"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </span>
          <input
            type="checkbox"
            :checked="searchStore.filters.stars.includes(star)"
            @change="toggleStar(star)"
            class="sr-only"
          />
          <StarRating :stars="star" />
        </label>
      </div>
    </div>

    <!-- Hotel type -->
    <div>
      <button
        @click="typesOpen = !typesOpen"
        class="flex items-center justify-between w-full text-sm font-semibold text-gray-800 mb-3"
      >
        {{ $t('filter.hotelType') }}
        <svg
          class="w-4 h-4 text-gray-400 transition-transform"
          :class="typesOpen ? 'rotate-180' : ''"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div v-show="typesOpen" class="space-y-1.5">
        <label
          v-for="type in hotelTypes"
          :key="type.value"
          class="flex items-center gap-3 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span
            class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0"
            :class="
              searchStore.filters.types.includes(type.value)
                ? 'border-site-primary bg-site-primary'
                : 'border-gray-300'
            "
          >
            <svg
              v-if="searchStore.filters.types.includes(type.value)"
              class="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="3"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </span>
          <input
            type="checkbox"
            :checked="searchStore.filters.types.includes(type.value)"
            @change="toggleType(type.value)"
            class="sr-only"
          />
          <span class="text-sm text-gray-700">{{ $t(`hotel.types.${type.value}`) }}</span>
        </label>
      </div>
    </div>

    <!-- Clear filters -->
    <button
      @click="searchStore.resetFilters()"
      class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-site-primary transition-colors"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      {{ $t('filter.clearAll') }}
    </button>
  </div>
</template>

<script setup lang="ts">
const searchStore = useSearchStore()

const starsOpen = ref(true)
const typesOpen = ref(true)

const hotelTypes = [
  { value: 'hotel' },
  { value: 'resort' },
  { value: 'boutique' },
  { value: 'apart' },
  { value: 'villa' }
]

function toggleStar(star: number) {
  const idx = searchStore.filters.stars.indexOf(star)
  if (idx >= 0) searchStore.filters.stars.splice(idx, 1)
  else searchStore.filters.stars.push(star)
}

function toggleType(type: string) {
  const idx = searchStore.filters.types.indexOf(type)
  if (idx >= 0) searchStore.filters.types.splice(idx, 1)
  else searchStore.filters.types.push(type)
}
</script>
