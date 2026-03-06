<template>
  <section class="py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-wrap justify-center gap-8">
        <div
          v-for="feature in features"
          :key="feature.key"
          class="text-center w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-[360px] mx-auto"
        >
          <div class="w-12 h-12 mx-auto mb-8 flex items-center justify-center">
            <component :is="feature.icon" class="w-12 h-12 text-site-primary" />
          </div>
          <h3 class="text-lg font-medium text-gray-900">
            {{ $t(`sections.${feature.key}`) }}
          </h3>
          <p class="text-[15px] text-gray-500 mt-2.5 leading-relaxed max-w-[34ch] mx-auto">
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
