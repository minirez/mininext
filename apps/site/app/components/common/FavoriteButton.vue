<template>
  <button
    type="button"
    @click.prevent.stop="toggle"
    class="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all hover:scale-110 active:scale-95"
    :aria-label="isFavorite ? $t('common.removeFromFavorites') : $t('common.addToFavorites')"
  >
    <svg
      class="w-4.5 h-4.5 transition-colors"
      :class="isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      stroke-width="1.5"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{ hotelId: string }>()
const ui = useUiStore()

const isFavorite = computed(() => ui.favorites?.includes(props.hotelId) ?? false)

function toggle() {
  if (ui.toggleFavorite) {
    ui.toggleFavorite(props.hotelId)
  }
}
</script>
