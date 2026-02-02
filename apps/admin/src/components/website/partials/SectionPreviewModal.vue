<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="relative max-w-5xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          <button
            class="absolute top-4 right-4 z-10 w-10 h-10 bg-gray-900/70 hover:bg-gray-900/90 text-white rounded-full flex items-center justify-center"
            @click="close"
          >
            <span class="material-icons">close</span>
          </button>
          <img
            v-if="preview"
            :src="preview"
            :alt="section?.name"
            class="w-full h-auto max-h-[80vh] object-contain"
          />
          <div
            class="p-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between"
          >
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                {{ section?.name }}
              </h3>
              <p class="text-sm text-gray-500 capitalize">{{ section?.category }}</p>
            </div>
            <button class="btn-primary" @click="add">
              <span class="material-icons text-sm mr-1">add</span>Add Section
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ modelValue: String, sections: Array })
const emit = defineEmits(['update:modelValue', 'add'])

const section = computed(() => props.sections?.find(s => s.id === props.modelValue))
const previews = {
  // Hero sections
  'hero-1': '/previews/hero-1.webp',
  'hero-5': '/previews/hero-5.webp',
  'hero-6': '/previews/hero-6.webp',
  'hero-8': '/previews/hero-8.webp',
  'hero-9': '/previews/hero-9.webp',
  'hero-10': '/previews/hero-10.webp',
  'hero-bedbank': '/previews/hero-bedbank.webp',
  // Content sections
  destinations: '/previews/destinations.webp',
  campaigns: '/previews/campaigns.webp',
  hotels: '/previews/hotels.webp',
  'tours-carousel': '/previews/tours.webp',
  'campaign-tours': '/previews/campaign+tours.webp',
  'tours-grid': '/previews/tours-grid.webp',
  'activity-campaigns': '/previews/activities.webp',
  'activities-grid': '/previews/activities-grid.webp',
  flights: '/previews/flights.webp',
  'cruise-deals': '/previews/cruise-deals.webp',
  transfers: '/previews/transfers.webp',
  'bedbank-destinations': '/previews/bedbank-destinations.webp',
  'bedbank-showcase': '/previews/bedbank-showcase.webp',
  'bedbank-section': '/previews/bedbanksection.webp',
  // Utility sections
  'block-guide': '/previews/block-guide.webp',
  'block-guide-2': '/previews/block-guide.webp',
  'cta-newsletter': '/previews/call-to-actions.webp',
  // Footer sections
  'footer-default': '/previews/footer-default.webp',
  'footer-minimal': '/previews/footer-default.webp'
}
const preview = computed(() => previews[props.modelValue] || null)

const close = () => emit('update:modelValue', null)
const add = () => {
  emit('add', props.modelValue)
  close()
}
</script>
