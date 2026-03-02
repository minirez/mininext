<template>
  <section class="py-16 sm:py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
        {{ $t('sections.trustTitle') }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        <div
          v-for="(feature, i) in features"
          :key="feature.key"
          class="text-center px-6 py-8 rounded-2xl hover:bg-gray-50 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
          :class="`stagger-${i + 1}`"
        >
          <div
            class="w-16 h-16 mx-auto mb-5 rounded-2xl bg-blue-50 flex items-center justify-center"
          >
            <component :is="feature.icon" class="w-8 h-8 text-site-primary" />
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">
            {{ $t(`sections.${feature.key}`) }}
          </h3>
          <p class="text-gray-500 text-sm leading-relaxed">
            {{ $t(`sections.${feature.key}Desc`) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import IconShield from '../common/icons/IconShield.vue'
import IconCalendar from '../common/icons/IconCalendar.vue'
import IconHeadset from '../common/icons/IconHeadset.vue'

const features = [
  { key: 'trustPriceGuarantee', icon: IconShield },
  { key: 'trustEasyBooking', icon: IconCalendar },
  { key: 'trustSupport', icon: IconHeadset }
]
</script>
