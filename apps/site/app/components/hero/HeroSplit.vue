<template>
  <section class="relative overflow-hidden min-h-[85vh] flex items-center">
    <!-- SVG pattern background + theme color tint -->
    <div class="absolute inset-0 -z-10">
      <div class="absolute inset-0 bg-gray-50" />
      <div
        v-if="themeColor"
        class="absolute inset-0 pointer-events-none"
        :style="{ backgroundColor: themeColor, opacity: 0.22, mixBlendMode: 'multiply' }"
      />
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24 lg:py-0">
      <div class="grid lg:grid-cols-12 gap-8 items-center">
        <!-- Left: Content (col-xl-9 equivalent) -->
        <div class="lg:col-span-7 xl:col-span-8">
          <h1
            v-if="heroTitle"
            class="text-[60px] lg:text-[40px] md:text-[30px] font-semibold leading-tight"
          >
            <template v-for="(line, idx) in titleLines" :key="idx">
              <span :class="idx === 1 ? 'text-site-primary relative' : ''">
                {{ line }}
                <span
                  v-if="idx === 1"
                  class="block h-4 w-full mt-1"
                  :style="themeColor
                    ? { backgroundColor: themeColor, maskImage: 'url(/img/general/line.png)', WebkitMaskImage: 'url(/img/general/line.png)', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskSize: 'contain', WebkitMaskSize: 'contain', maskPosition: 'center', WebkitMaskPosition: 'center' }
                    : { background: 'currentColor', maskImage: 'url(/img/general/line.png)', WebkitMaskImage: 'url(/img/general/line.png)', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskSize: 'contain', WebkitMaskSize: 'contain', maskPosition: 'center', WebkitMaskPosition: 'center' }"
                />
              </span>
            </template>
          </h1>

          <p v-if="heroDescription" class="mt-5 text-gray-600">
            {{ heroDescription }}
          </p>

          <div class="mt-8">
            <SearchBar default-tab="tours" />
          </div>
        </div>

        <!-- Right: Hero image -->
        <div class="lg:col-span-5 xl:col-span-4 hidden lg:block">
          <div class="rounded-2xl overflow-hidden shadow-xl">
            <img
              v-if="heroImage"
              :src="heroImage"
              alt=""
              class="w-full h-full object-cover transition-opacity duration-500"
              :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
              @load="imageLoaded = true"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const storefront = useStorefrontStore()
const partner = usePartnerStore()
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()

const imageLoaded = ref(false)

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

const themeColor = computed(() => {
  const c = partner.themeColor || storefront.settings?.themeColor
  return c && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) ? c : null
})
</script>
