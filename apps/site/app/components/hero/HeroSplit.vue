<template>
  <section class="masthead-type-5 relative min-h-[85vh] flex items-center">
    <!-- Background: SVG pattern + theme color overlay -->
    <div class="absolute inset-0 z-0 overflow-hidden">
      <img alt="" src="/img/masthead/5/bg.svg" class="w-full h-full object-cover" />
      <span
        v-if="themeColor"
        class="absolute inset-0 pointer-events-none"
        :style="{ backgroundColor: themeColor, opacity: 0.22, mixBlendMode: 'multiply' }"
      />
    </div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div class="flex flex-wrap items-center">
        <!-- Left: Content (col-xl-9 equivalent) -->
        <div class="w-full xl:w-3/4 pr-0 xl:pr-8">
          <h1
            v-if="heroTitle"
            class="text-[60px] lg:text-[40px] md:text-[30px] font-semibold leading-tight"
          >
            <template v-for="(line, idx) in titleLines" :key="idx">
              <span :class="idx === 1 ? 'text-site-primary relative' : ''">
                {{ line }}
                <span v-if="idx === 1" class="-line block">
                  <span
                    v-if="themeColor"
                    class="block w-full h-4"
                    :style="{
                      backgroundColor: themeColor,
                      maskImage: 'url(/img/general/line.png)',
                      WebkitMaskImage: 'url(/img/general/line.png)',
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain',
                      maskPosition: 'center',
                      WebkitMaskPosition: 'center'
                    }"
                  />
                  <img v-else src="/img/general/line.png" alt="" class="w-full" />
                </span>
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

        <!-- Right: Hero image (masthead__image) -->
        <div class="hidden xl:block xl:w-1/4">
          <div class="masthead-image rounded-2xl overflow-hidden">
            <img v-if="heroImage" :src="heroImage" alt="" class="w-full h-full object-cover" />
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

<style scoped>
.masthead-type-5 {
  padding-top: 120px;
  padding-bottom: 60px;
}

.masthead-image {
  position: relative;
  min-height: 400px;
}

@media (max-width: 1199px) {
  .masthead-type-5 {
    padding-top: 140px;
    padding-bottom: 40px;
  }
}
</style>
