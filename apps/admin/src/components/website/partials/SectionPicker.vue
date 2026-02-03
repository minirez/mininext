<template>
  <div
    class="w-72 flex-shrink-0 flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
  >
    <div class="p-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30">
      <h4
        class="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2"
      >
        <span class="material-icons text-purple-500 text-sm">widgets</span>Available Sections
      </h4>
    </div>

    <div class="p-3 border-b border-gray-200 dark:border-slate-700">
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="px-2 py-1 rounded-full text-xs font-medium transition-all"
          :class="
            category === cat.id
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-700 text-gray-600 hover:bg-gray-100 border border-gray-200'
          "
          @click="$emit('update:category', cat.id)"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-2">
      <div
        v-for="section in sections"
        :key="section.id"
        class="flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer group relative mb-1.5"
        :class="
          isActive(section.id)
            ? 'border-green-300 bg-green-50/50'
            : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50/50'
        "
        @click="$emit('add', section)"
        @dblclick="$emit('add', section)"
      >
        <div
          class="w-12 h-8 rounded overflow-hidden bg-gray-100 flex-shrink-0 preview-thumbnail"
          @click.stop="$emit('preview', section.id)"
          @mouseenter="showPreview($event, section.id)"
          @mouseleave="hidePreview"
        >
          <img
            v-if="getPreview(section.id)"
            :src="getPreview(section.id)"
            :alt="section.name"
            class="w-full h-full object-cover object-top"
            loading="lazy"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <span class="material-icons text-sm text-gray-400">{{ section.icon }}</span>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <span class="text-xs font-medium text-gray-800 dark:text-white block truncate">{{
            section.name
          }}</span>
          <span v-if="isSingleton(section.id)" class="text-[10px] text-gray-400">{{
            getSingletonLabel(section.id)
          }}</span>
        </div>
        <span v-if="isActive(section.id)" class="material-icons text-green-500 text-sm"
          >check_circle</span
        >
        <div
          class="absolute right-0 top-0 bottom-0 w-[20%] flex items-center justify-center hover:bg-purple-500/10 rounded-r-lg cursor-pointer"
          @click.stop="$emit('add', section)"
        >
          <span class="material-icons text-purple-500 opacity-0 group-hover:opacity-100 text-lg"
            >add_circle</span
          >
        </div>
      </div>
      <p class="text-xs text-gray-400 text-center mt-3 px-2">
        Click + to add • Double-click • Drag to reorder
      </p>
    </div>

    <!-- Floating preview popup (teleported to body) -->
    <Teleport to="body">
      <div v-show="hoveredPreview" class="preview-popup" :style="previewStyle">
        <img
          v-if="hoveredPreview"
          :src="hoveredPreview"
          alt="Section preview"
          class="w-full h-full object-cover object-top"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toCanonicalSectionType } from '@booking-engine/constants'

const { t } = useI18n()
const props = defineProps({ sections: Array, active: Array, category: String })
defineEmits(['update:category', 'add', 'preview'])

// Hover preview state
const hoveredPreview = ref(null)
const previewStyle = ref({})

const showPreview = (event, sectionId) => {
  const preview = getPreview(sectionId)
  if (!preview) return

  const rect = event.currentTarget.getBoundingClientRect()
  const popupWidth = 320
  const popupHeight = 200

  // Position to the right of the thumbnail
  let left = rect.right + 12
  let top = rect.top + rect.height / 2 - popupHeight / 2

  // Keep within viewport
  if (left + popupWidth > window.innerWidth - 20) {
    left = rect.left - popupWidth - 12
  }
  if (top < 20) top = 20
  if (top + popupHeight > window.innerHeight - 20) {
    top = window.innerHeight - popupHeight - 20
  }

  previewStyle.value = {
    left: `${left}px`,
    top: `${top}px`
  }
  hoveredPreview.value = preview
}

const hidePreview = () => {
  hoveredPreview.value = null
}

const categories = computed(() => [
  { id: 'all', name: 'All' },
  { id: 'hero', name: t('website.sections.categories.hero') },
  { id: 'content', name: t('website.sections.categories.content') },
  { id: 'utility', name: t('website.sections.categories.utility') },
  { id: 'footer', name: t('website.sections.categories.footer') }
])

const isActive = id => props.active?.includes(toCanonicalSectionType(id))
const isSingleton = id => /^hero-|^footer-/.test(toCanonicalSectionType(id))
const getSingletonLabel = id =>
  toCanonicalSectionType(id).startsWith('hero-') ? 'Only 1 hero' : 'Only 1 footer'

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
const getPreview = id => previews[id] || previews[toCanonicalSectionType(id)] || null
</script>

<style>
/* Not scoped so it applies to teleported element */
.preview-popup {
  position: fixed;
  width: 320px;
  height: 200px;
  background: white;
  border-radius: 12px;
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  z-index: 9999;
  overflow: hidden;
  pointer-events: none;
  animation: preview-fade-in 0.2s ease-out;
}

@keyframes preview-fade-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.dark .preview-popup {
  background: #1e293b;
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}
</style>
