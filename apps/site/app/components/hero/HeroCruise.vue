<template>
  <section class="relative min-h-[100vh] overflow-hidden">
    <!-- Swiper / Slide background - single image for now (carousel can be extended) -->
    <div class="absolute inset-0 bg-gray-900">
      <img
        v-if="heroImage"
        ref="heroRef"
        :src="heroImage"
        alt=""
        class="w-full h-full object-cover transition-opacity duration-500"
        :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
        @load="imageLoaded = true"
      />
      <!-- Dark overlay when backdrop filter active -->
      <div v-if="hasBackdropFilter" class="absolute inset-0 bg-black/40" />
    </div>

    <!-- Centered content -->
    <div
      class="absolute inset-0 flex items-center justify-center"
      style="transform: translateY(-10%)"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div class="flex justify-center">
          <div class="w-full xl:w-3/4 text-center">
            <h1
              v-if="heroTitle"
              class="text-[80px] lg:text-[60px] sm:text-[40px] text-white font-semibold leading-tight"
              :style="noBackdrop ? textShadowStyle : undefined"
            >
              <template v-for="(line, idx) in titleLines" :key="idx">
                <span>{{ line }}</span>
                <br v-if="idx < titleLines.length - 1" class="hidden md:inline" />
              </template>
            </h1>
            <p
              v-if="heroDescription"
              class="text-white text-xl mt-5"
              :style="noBackdrop ? descShadowStyle : undefined"
            >
              {{ heroDescription }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Scroll indicator -->
    <a
      href="#featuredCruises"
      class="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center text-white z-10"
    >
      <div class="text-right mr-2.5 leading-snug">
        <div class="font-medium">{{ $t('hero.scrollDown') }}</div>
        <div class="text-[15px] opacity-80">{{ $t('hero.toDiscover') }}</div>
      </div>
      <div class="scroll-icon">
        <div class="scroll-icon__bar" />
        <div class="scroll-icon__bar" />
      </div>
    </a>

    <!-- Search Box at bottom -->
    <div class="absolute bottom-0 left-0 right-0 z-10 pb-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white shadow-md rounded p-4">
          <SearchBar default-tab="cruises" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const storefront = useStorefrontStore()
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()
const { t: $t } = useI18n()

const imageLoaded = ref(false)
const heroRef = ref<HTMLImageElement | null>(null)

onMounted(() => {
  if (heroRef.value?.complete && heroRef.value.naturalWidth > 0) {
    imageLoaded.value = true
  }
})

const heroImage = computed(() => {
  const photo = storefront.hero?.photo
  if (!photo) return ''
  return imageUrl(photo)
})

const heroTitle = computed(() => ml(storefront.hero?.title))
const heroDescription = computed(() => ml(storefront.hero?.description))

const titleLines = computed(() => {
  const t = heroTitle.value || ''
  return t.split('\\n').length > 1 ? t.split('\\n') : [t]
})

const hasBackdropFilter = computed(() => storefront.hero?.backdropFilter !== false)
const noBackdrop = computed(() => !hasBackdropFilter.value)

const textShadowStyle = {
  textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.3)'
}
const descShadowStyle = {
  textShadow: '0 2px 6px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5), 0 0 30px rgba(0,0,0,0.3)'
}
</script>

<style scoped>
.scroll-icon {
  width: 24px;
  height: 40px;
  position: relative;
}
.scroll-icon__bar {
  width: 2px;
  height: 8px;
  background: white;
  margin: 3px auto;
  border-radius: 1px;
  animation: scrollBounce 1.5s ease-in-out infinite;
}
.scroll-icon__bar:nth-child(2) {
  animation-delay: 0.2s;
}
@keyframes scrollBounce {
  0%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(4px);
  }
}
</style>
