<template>
  <section class="relative min-h-[85vh] overflow-hidden">
    <!-- Slide images with auto-fade -->
    <div class="absolute inset-0">
      <TransitionGroup name="hero-fade">
        <div
          v-for="(img, i) in slideImages"
          v-show="i === activeSlide"
          :key="i"
          class="absolute inset-0"
        >
          <div class="absolute inset-0 bg-gray-900">
            <img
              :src="img"
              :alt="`Cruise hero ${i + 1}`"
              class="w-full h-full object-cover"
            />
          </div>
          <div v-if="hasBackdropFilter" class="absolute inset-0 bg-black/40" />
        </div>
      </TransitionGroup>
    </div>

    <!-- Content centered -->
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[70%] z-10 w-full px-4"
    >
      <div class="max-w-4xl mx-auto text-center">
        <h1
          v-if="heroTitle"
          class="text-[80px] lg:text-[60px] sm:text-[40px] text-white font-semibold leading-tight"
          :style="noBackdrop ? textShadowStyle : undefined"
        >
          <template v-for="(line, idx) in titleLines" :key="idx">
            {{ line }}<br v-if="idx < titleLines.length - 1" class="hidden md:inline" />
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

    <!-- Navigation arrows -->
    <template v-if="slideImages.length > 1">
      <div class="absolute left-6 top-1/2 -translate-y-1/2 z-20">
        <button
          class="py-2.5 px-1 text-white hover:opacity-80 transition-opacity"
          @click="prevSlide"
        >
          <span class="block h-[2px] w-12 bg-white" />
        </button>
      </div>
      <div class="absolute right-6 top-1/2 -translate-y-1/2 z-20">
        <button
          class="py-2.5 px-1 text-white hover:opacity-80 transition-opacity"
          @click="nextSlide"
        >
          <span class="block h-[2px] w-12 bg-white" />
        </button>
      </div>
    </template>

    <!-- Scroll indicator -->
    <div class="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 text-white text-center">
      <div class="flex items-center gap-2.5">
        <div class="text-right leading-tight">
          <div class="font-medium text-sm">{{ $t('hero.scrollDown') || 'Scroll Down' }}</div>
          <div class="text-[15px] opacity-70">{{ $t('hero.toDiscover') || 'to discover' }}</div>
        </div>
        <div class="scroll-indicator">
          <div /><div />
        </div>
      </div>
    </div>

    <!-- Search bar at bottom -->
    <div class="absolute bottom-0 left-0 right-0 z-10 pb-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white shadow-lg rounded p-4">
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

const activeSlide = ref(0)
let autoplayInterval: ReturnType<typeof setInterval> | null = null

const heroImage = computed(() => {
  const photo = storefront.hero?.photo
  if (!photo) return ''
  return imageUrl(photo)
})

const slideImages = computed(() => {
  const images = (storefront.hero as any)?.images
  if (images?.length) {
    return images.map((img: any) => {
      if (typeof img === 'string') return img
      return img?.link || ''
    }).filter(Boolean)
  }
  return heroImage.value ? [heroImage.value] : []
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
  textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.3)',
}
const descShadowStyle = {
  textShadow: '0 2px 6px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5), 0 0 30px rgba(0,0,0,0.3)',
}

function nextSlide() {
  activeSlide.value = (activeSlide.value + 1) % slideImages.value.length
}
function prevSlide() {
  activeSlide.value = (activeSlide.value - 1 + slideImages.value.length) % slideImages.value.length
}

onMounted(() => {
  if (slideImages.value.length > 1) {
    autoplayInterval = setInterval(nextSlide, 5000)
  }
})

onUnmounted(() => {
  if (autoplayInterval) clearInterval(autoplayInterval)
})
</script>

<style scoped>
.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 1s ease;
}
.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}

.scroll-indicator {
  width: 20px;
  height: 30px;
  position: relative;
}
.scroll-indicator div {
  width: 2px;
  height: 8px;
  background: white;
  margin: 4px auto;
  border-radius: 1px;
  animation: scrollBounce 1.5s infinite;
}
.scroll-indicator div:nth-child(2) {
  animation-delay: 0.2s;
}

@keyframes scrollBounce {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(4px); opacity: 1; }
}
</style>
