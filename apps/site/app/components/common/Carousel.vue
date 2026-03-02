<template>
  <section class="py-12 sm:py-16" :class="bgClass">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="flex items-end justify-between mb-8">
        <div>
          <h2 v-if="title" class="text-2xl sm:text-3xl font-bold text-gray-900">
            {{ title }}
          </h2>
          <p v-if="description" class="mt-2 text-gray-500 max-w-2xl">
            {{ description }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Navigation arrows -->
          <template v-if="showArrows">
            <button
              @click="scrollPrev"
              :disabled="!canScrollPrev"
              class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-site-primary hover:text-site-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              :aria-label="$t('common.previous')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              @click="scrollNext"
              :disabled="!canScrollNext"
              class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-site-primary hover:text-site-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              :aria-label="$t('common.next')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </template>

          <!-- View all link -->
          <NuxtLink
            v-if="viewAllLink"
            :to="viewAllLink"
            class="hidden sm:inline-flex text-sm font-medium text-site-primary hover:text-site-primary-dark transition-colors ml-4"
          >
            {{ viewAllText || $t('common.viewAll') }} &rarr;
          </NuxtLink>
        </div>
      </div>

      <!-- Scroll container -->
      <div
        ref="containerRef"
        class="flex overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory"
        :style="{ gap: `${gap}px` }"
      >
        <slot />
      </div>

      <!-- Dots -->
      <div v-if="showDots && totalSlides > 1" class="flex justify-center gap-1.5 mt-6">
        <button
          v-for="i in totalSlides"
          :key="i"
          @click="scrollTo(i - 1)"
          class="w-2 h-2 rounded-full transition-all duration-300"
          :class="currentIndex === i - 1 ? 'bg-site-primary w-6' : 'bg-gray-300 hover:bg-gray-400'"
          :aria-label="`Slide ${i}`"
        />
      </div>

      <!-- Mobile view all -->
      <div v-if="viewAllLink" class="mt-6 text-center sm:hidden">
        <NuxtLink :to="viewAllLink" class="text-sm font-medium text-site-primary">
          {{ viewAllText || $t('common.viewAll') }} &rarr;
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    viewAllLink?: string
    viewAllText?: string
    gap?: number
    showDots?: boolean
    showArrows?: boolean
    bgClass?: string
  }>(),
  {
    gap: 16,
    showDots: false,
    showArrows: true,
    bgClass: 'bg-white'
  }
)

const {
  containerRef,
  currentIndex,
  totalSlides,
  canScrollPrev,
  canScrollNext,
  scrollTo,
  scrollPrev,
  scrollNext
} = useCarousel()
</script>
