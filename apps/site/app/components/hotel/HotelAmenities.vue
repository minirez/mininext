<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ $t('hotel.amenities') }}</h3>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <div
        v-for="amenity in displayedAmenities"
        :key="amenity"
        class="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2"
      >
        <svg
          class="w-4 h-4 text-site-primary shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        {{ formatAmenity(amenity) }}
      </div>
    </div>
    <button
      v-if="amenities.length > 12 && !showAll"
      @click="showAll = true"
      class="mt-3 text-sm text-site-primary hover:underline"
    >
      +{{ amenities.length - 12 }} {{ $t('common.viewAll').toLowerCase() }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ amenities: string[] }>()
const showAll = ref(false)

const displayedAmenities = computed(() =>
  showAll.value ? props.amenities : props.amenities.slice(0, 12)
)

function formatAmenity(key: string): string {
  // Convert camelCase/snake_case keys to human-readable labels
  // "roomService" → "Room Service", "free_wifi" → "Free Wifi", "spa" → "Spa"
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → spaced
    .replace(/[_-]/g, ' ') // snake_case/kebab → spaced
    .replace(/\b\w/g, c => c.toUpperCase()) // capitalize each word
}
</script>
