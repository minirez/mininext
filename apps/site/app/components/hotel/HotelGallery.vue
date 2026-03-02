<template>
  <div class="relative">
    <!-- Main gallery grid -->
    <div
      class="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-1 h-[300px] sm:h-[360px] md:h-[420px] lg:h-[480px]"
    >
      <!-- Main image -->
      <div class="md:col-span-2 md:row-span-2 overflow-hidden">
        <img
          :src="images[0]?.url"
          :alt="hotelName"
          class="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
          @click="ui.openLightbox(images, 0)"
        />
      </div>
      <!-- Thumbnails -->
      <div v-for="(img, i) in images.slice(1, 5)" :key="i" class="hidden md:block overflow-hidden">
        <img
          :src="img.url"
          :alt="img.caption || hotelName"
          class="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
          loading="lazy"
          @click="ui.openLightbox(images, i + 1)"
        />
      </div>
    </div>

    <!-- View all photos button -->
    <button
      v-if="images.length > 5"
      @click="ui.openLightbox(images, 0)"
      class="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium text-gray-800 hover:bg-white transition-colors shadow"
    >
      {{ $t('hotel.morePhotos', { n: images.length }) }}
    </button>

    <!-- Lightbox -->
    <Teleport to="body">
      <div
        v-if="ui.lightboxOpen"
        class="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
        @click.self="ui.closeLightbox()"
      >
        <button
          @click="ui.closeLightbox()"
          class="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-10"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Previous -->
        <button
          @click="ui.lightboxIndex = Math.max(0, ui.lightboxIndex - 1)"
          class="absolute left-4 text-white/80 hover:text-white p-2"
          :class="{ 'opacity-30': ui.lightboxIndex === 0 }"
        >
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <!-- Image -->
        <img
          :src="ui.lightboxImages[ui.lightboxIndex]?.url"
          :alt="hotelName"
          class="max-w-[90vw] max-h-[85vh] object-contain"
        />

        <!-- Next -->
        <button
          @click="ui.lightboxIndex = Math.min(ui.lightboxImages.length - 1, ui.lightboxIndex + 1)"
          class="absolute right-4 text-white/80 hover:text-white p-2"
          :class="{ 'opacity-30': ui.lightboxIndex === ui.lightboxImages.length - 1 }"
        >
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <!-- Counter -->
        <div class="absolute bottom-4 text-white/70 text-sm">
          {{ ui.lightboxIndex + 1 }} / {{ ui.lightboxImages.length }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const ui = useUiStore()

defineProps<{
  images: Array<{ url: string; caption?: string }>
  hotelName: string
}>()
</script>
