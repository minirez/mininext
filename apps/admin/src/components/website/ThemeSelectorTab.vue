<template>
  <div class="space-y-6">
    <!-- Theme Editor View (when editing a specific theme) -->
    <div v-if="editingTheme">
      <!-- Top Action Bar with Save Button -->
      <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
        <button
          class="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          @click="exitThemeEditor"
        >
          <span class="material-icons">arrow_back</span>
          {{ $t('website.themes.backToThemes') }}
        </button>
        <div class="flex items-center gap-3">
          <button
            class="btn-outline flex items-center gap-2"
            @click="previewCurrentTheme"
          >
            <span class="material-icons text-sm">visibility</span>
            {{ $t('website.themes.preview') }}
          </button>
          <button class="btn-primary flex items-center gap-2" :disabled="saving" @click="handleSave">
            <span v-if="saving" class="animate-spin">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </span>
            <span class="material-icons text-base" v-else>save</span>
            {{ $t('common.save') }}
          </button>
        </div>
      </div>

      <!-- Theme Editor Header -->
      <div class="bg-gradient-to-br rounded-xl p-6 mb-6 text-white" :class="getThemeGradient(editingTheme)">
        <div class="flex items-center gap-4">
          <span class="material-icons text-4xl opacity-80">{{ getThemeIcon(editingTheme) }}</span>
          <div>
            <h2 class="text-2xl font-bold">{{ getThemeName(editingTheme) }}</h2>
            <p class="opacity-80">{{ getThemeDescription(editingTheme) }}</p>
          </div>
        </div>
      </div>

      <!-- Theme-Specific Content Editor -->
      <ThemeContentEditor
        v-model="themeContent"
        :themeType="editingTheme"
        :storefront="storefront"
        @update="handleThemeContentUpdate"
      />

      <!-- Bottom Save Button (Theme Editor) -->
      <div class="flex justify-end pt-4 mt-6 border-t border-gray-200 dark:border-slate-700">
        <button class="btn-primary flex items-center gap-2" :disabled="saving" @click="handleSave">
          <span v-if="saving" class="animate-spin">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
          <span class="material-icons text-base" v-else>save</span>
          {{ $t('common.save') }}
        </button>
      </div>
    </div>

    <!-- Theme Selection Grid (default view) -->
    <div v-else>
      <!-- Top Action Bar with Save Button -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-700 mb-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ $t('website.themes.title') }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('website.themes.description') }}
          </p>
        </div>
        <button class="btn-primary flex items-center gap-2" :disabled="saving" @click="handleSave">
          <span v-if="saving" class="animate-spin">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
          <span class="material-icons text-base" v-else>save</span>
          {{ $t('common.save') }}
        </button>
      </div>

      <!-- Theme Color - Moved to TOP -->
      <div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span class="material-icons text-purple-500">palette</span>
              {{ $t('website.themes.themeColor') }}
            </h4>
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {{ $t('website.themes.themeColorDescription') }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex gap-1.5">
              <button
                v-for="color in presetColors"
                :key="color"
                class="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                :class="
                  themeColor === color
                    ? 'border-gray-800 dark:border-white scale-110 ring-2 ring-offset-2 ring-purple-500'
                    : 'border-transparent'
                "
                :style="{ backgroundColor: color }"
                @click="themeColor = color"
              />
            </div>
            <div class="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-700">
              <label class="relative cursor-pointer">
                <input
                  v-model="themeColor"
                  type="color"
                  class="w-8 h-8 rounded-full cursor-pointer opacity-0 absolute inset-0"
                />
                <div
                  class="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center hover:border-purple-400 transition-colors"
                  :style="{ backgroundColor: themeColor }"
                >
                  <span class="material-icons text-white text-sm drop-shadow">colorize</span>
                </div>
              </label>
              <input
                v-model="themeColor"
                type="text"
                class="form-input w-24 text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div>

        <!-- Theme Grid with Animations -->
        <TransitionGroup 
          name="theme-grid" 
          tag="div" 
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div
            v-for="(theme, index) in availableThemes"
            :key="theme.id"
            class="relative group cursor-pointer transform transition-all duration-300"
            :style="{ transitionDelay: `${index * 50}ms` }"
            @click="selectTheme(theme.id)"
          >
            <!-- Theme Card -->
            <div
              class="rounded-xl overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              :class="
                selectedTheme === theme.id
                  ? 'border-purple-600 shadow-lg shadow-purple-200 dark:shadow-purple-900/30 ring-2 ring-purple-300 dark:ring-purple-700'
                  : 'border-gray-200 dark:border-slate-700 hover:border-purple-400'
              "
            >
              <!-- Theme Preview Image -->
              <div class="aspect-video bg-gray-100 dark:bg-slate-700 relative overflow-hidden">
                <img
                  v-if="theme.preview"
                  :src="theme.preview"
                  :alt="theme.name"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center bg-gradient-to-br transition-all duration-500"
                  :class="theme.gradient"
                >
                  <span class="material-icons text-6xl text-white/50 group-hover:scale-110 transition-transform duration-300">{{ theme.icon }}</span>
                </div>

                <!-- Hover Overlay with smooth animation -->
                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4"
                >
                  <button
                    class="px-5 py-2.5 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-all duration-200 shadow-lg transform translate-y-4 group-hover:translate-y-0"
                    @click.stop="enterThemeEditor(theme.id)"
                  >
                    <span class="flex items-center gap-2">
                      <span class="material-icons text-sm">edit</span>
                      {{ $t('website.themes.modify') }}
                    </span>
                  </button>
                </div>

                <!-- Selected Badge with animation -->
                <Transition
                  enter-active-class="transition-all duration-300 ease-out"
                  enter-from-class="opacity-0 scale-50"
                  enter-to-class="opacity-100 scale-100"
                  leave-active-class="transition-all duration-200 ease-in"
                  leave-from-class="opacity-100 scale-100"
                  leave-to-class="opacity-0 scale-50"
                >
                  <div
                    v-if="selectedTheme === theme.id"
                    class="absolute top-3 right-3 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <span class="material-icons text-white text-lg">check</span>
                  </div>
                </Transition>

                <!-- Active Theme Badge with animation -->
                <Transition
                  enter-active-class="transition-all duration-300 ease-out"
                  enter-from-class="opacity-0 -translate-x-4"
                  enter-to-class="opacity-100 translate-x-0"
                  leave-active-class="transition-all duration-200 ease-in"
                  leave-from-class="opacity-100 translate-x-0"
                  leave-to-class="opacity-0 -translate-x-4"
                >
                  <div
                    v-if="selectedTheme === theme.id"
                    class="absolute top-3 left-3 px-3 py-1 bg-green-500 text-white text-xs rounded-full font-medium shadow-lg flex items-center gap-1"
                  >
                    <span class="material-icons text-xs">check_circle</span>
                    {{ $t('website.themes.active') }}
                  </div>
                </Transition>
              </div>

              <!-- Theme Info -->
              <div class="p-4 bg-white dark:bg-slate-800">
                <h4 class="font-semibold text-gray-800 dark:text-white">{{ theme.name }}</h4>
                <p class="text-sm text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">{{ theme.description }}</p>
                <div class="flex flex-wrap gap-2 mt-3">
                  <span
                    v-for="tag in theme.tags"
                    :key="tag"
                    class="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-300"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
        <button class="btn-primary" :disabled="saving" @click="handleSave">
          <span v-if="saving" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{ $t('common.loading') }}
          </span>
          <span v-else>{{ $t('common.save') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ThemeContentEditor from './ThemeContentEditor.vue'

const { t } = useI18n()

const props = defineProps({
  storefront: Object,
  saving: Boolean
})

const emit = defineEmits(['save', 'preview'])

const selectedTheme = ref('home1')
const themeColor = ref('#3498DB')
const editingTheme = ref(null)
const themeContent = ref({})

const presetColors = [
  '#3498DB', // Blue
  '#2ECC71', // Green
  '#E74C3C', // Red
  '#9B59B6', // Purple
  '#F39C12', // Orange
  '#1ABC9C', // Teal
  '#34495E', // Dark Blue
  '#E91E63'  // Pink
]

const availableThemes = computed(() => [
  {
    id: 'home1',
    name: t('website.themes.home1.name'),
    description: t('website.themes.home1.description'),
    icon: 'home',
    gradient: 'from-blue-500 to-purple-600',
    tags: [t('website.themes.tags.hotel'), t('website.themes.tags.tour'), t('website.themes.tags.default')]
  },
  {
    id: 'home2',
    name: t('website.themes.home2.name'),
    description: t('website.themes.home2.description'),
    icon: 'villa',
    gradient: 'from-emerald-500 to-teal-600',
    tags: [t('website.themes.tags.hotel'), t('website.themes.tags.modern')]
  },
  {
    id: 'tour',
    name: t('website.themes.tour.name'),
    description: t('website.themes.tour.description'),
    icon: 'tour',
    gradient: 'from-orange-500 to-red-600',
    tags: [t('website.themes.tags.tour'), t('website.themes.tags.activity')]
  },
  {
    id: 'flight',
    name: t('website.themes.flight.name'),
    description: t('website.themes.flight.description'),
    icon: 'flight',
    gradient: 'from-sky-500 to-blue-600',
    tags: [t('website.themes.tags.flight'), t('website.themes.tags.travel')]
  },
  {
    id: 'activity',
    name: t('website.themes.activity.name'),
    description: t('website.themes.activity.description'),
    icon: 'local_activity',
    gradient: 'from-pink-500 to-rose-600',
    tags: [t('website.themes.tags.activity'), t('website.themes.tags.events')]
  },
  {
    id: 'transfer',
    name: t('website.themes.transfer.name'),
    description: t('website.themes.transfer.description'),
    icon: 'airport_shuttle',
    gradient: 'from-gray-600 to-slate-800',
    tags: [t('website.themes.tags.transfer')]
  },
  {
    id: 'cruise',
    name: t('website.themes.cruise.name'),
    description: t('website.themes.cruise.description'),
    icon: 'sailing',
    gradient: 'from-cyan-500 to-blue-700',
    tags: [t('website.themes.tags.cruise'), t('website.themes.tags.yacht')]
  },
  {
    id: 'bedbank',
    name: t('website.themes.bedbank.name'),
    description: t('website.themes.bedbank.description'),
    icon: 'bed',
    gradient: 'from-indigo-500 to-purple-700',
    tags: [t('website.themes.tags.hotel'), t('website.themes.tags.global')]
  }
])

// Watch for storefront changes - avoid deep watching for performance
let lastStorefrontId = null
watch(
  () => props.storefront,
  newStorefront => {
    // Only update if storefront actually changed (not on every nested prop change)
    const currentId = newStorefront?._id || newStorefront?.homepageTheme?.type
    if (newStorefront && currentId !== lastStorefrontId) {
      lastStorefrontId = currentId
      selectedTheme.value = newStorefront.homepageTheme?.type || 'home1'
      themeColor.value = newStorefront.themeColor || '#3498DB'
      // Update theme content if we're editing
      if (editingTheme.value) {
        loadThemeContent(editingTheme.value)
      }
    }
  },
  { immediate: true }
)

const selectTheme = themeId => {
  selectedTheme.value = themeId
}

const enterThemeEditor = themeId => {
  editingTheme.value = themeId
  selectedTheme.value = themeId
  loadThemeContent(themeId)
}

const exitThemeEditor = () => {
  editingTheme.value = null
}

const loadThemeContent = themeId => {
  const storefront = props.storefront
  if (!storefront) return

  // Load theme-specific content based on theme type
  switch (themeId) {
    case 'home1':
    case 'home2':
      themeContent.value = {
        hero: storefront.hero || {},
        locationSection: storefront.locationSection || {},
        campaignSection: storefront.campaignSection || [],
        hotels: storefront.hotels || {},
        tours: storefront.tours || {}
      }
      break
    case 'tour':
      themeContent.value = storefront.homepageTheme?.tour || {
        hero: { photo: {}, title: [], description: [] },
        campaignSection: { title: [], description: [], campaign: { photo: {}, title: [], url: '', description: [] }, campaignTourIds: [] },
        locations: { title: [], description: [], items: [] },
        tours: { title: [], description: [], ids: [], names: [] },
        subdomain: { status: false, value: '' },
        listType: 'carousel',
        categories: []
      }
      break
    case 'flight':
      themeContent.value = storefront.homepageTheme?.flight || {
        hero: { photo: [], title: [], description: [] },
        routes: { title: [], description: [], items: [] },
        locations: { title: [], description: [], items: [] },
        subdomain: { status: false, value: '' },
        mr: 0.03
      }
      break
    case 'activity':
      themeContent.value = storefront.homepageTheme?.activity || {
        hero: { photo: {}, title: [], description: [] },
        campaignSection: { title: [], description: [], campaign: [] },
        tourIds: { top4: [], bottom8: [] },
        locations: { title: [], description: [], items: [] },
        subdomain: { status: false, value: '' },
        categories: []
      }
      break
    case 'bedbank':
      themeContent.value = storefront.homepageTheme?.bedbank || {
        hero: { photo: {}, title: [], description: [] },
        locations: { title: [], description: [], items: [] },
        subdomain: { status: false, value: '' },
        showcase: { title: [], description: [], ids: [] },
        sections: [],
        mr: 0.03
      }
      break
    case 'transfer':
      themeContent.value = storefront.homepageTheme?.transfer || {
        hero: { photo: {}, title: [], description: [] },
        transfers: { title: [], description: [], ids: [] },
        subdomain: { status: false, value: '' }
      }
      break
    case 'cruise':
      themeContent.value = storefront.homepageTheme?.cruise || {
        hero: { photo: {}, title: [], description: [] },
        tours: { title: [], description: [], ids: [] },
        searchLocationPreset: { departure: [], arrival: [] },
        subdomain: { status: false, value: '' }
      }
      break
    default:
      themeContent.value = {}
  }
}

const handleThemeContentUpdate = updatedContent => {
  themeContent.value = updatedContent
}

const getThemeGradient = themeId => {
  const theme = availableThemes.value.find(t => t.id === themeId)
  return theme?.gradient || 'from-gray-500 to-gray-700'
}

const getThemeIcon = themeId => {
  const theme = availableThemes.value.find(t => t.id === themeId)
  return theme?.icon || 'palette'
}

const getThemeName = themeId => {
  const theme = availableThemes.value.find(t => t.id === themeId)
  return theme?.name || themeId
}

const getThemeDescription = themeId => {
  const theme = availableThemes.value.find(t => t.id === themeId)
  return theme?.description || ''
}

const previewCurrentTheme = () => {
  const baseUrl = props.storefront?.settings?.b2cDomain || 'localhost:3000'
  const previewUrl = `https://${baseUrl}?preview_theme=${editingTheme.value}`
  emit('preview', previewUrl)
}

const handleSave = () => {
  const saveData = {
    homepageTheme: {
      type: selectedTheme.value
    },
    themeColor: themeColor.value
  }

  // If we're in theme editor, also save the theme-specific content
  if (editingTheme.value) {
    const themeId = editingTheme.value
    if (themeId === 'home1' || themeId === 'home2') {
      // For home themes, content is at root level
      saveData.hero = themeContent.value.hero
      saveData.locationSection = themeContent.value.locationSection
      saveData.campaignSection = themeContent.value.campaignSection
      saveData.hotels = themeContent.value.hotels
      saveData.tours = themeContent.value.tours
    } else {
      // For other themes, content goes into homepageTheme.<themeId>
      saveData.homepageTheme[themeId] = themeContent.value
    }
  }

  emit('save', saveData)
}
</script>

<style scoped>
/* Theme grid animations */
.theme-grid-enter-active {
  transition: all 0.4s ease-out;
}
.theme-grid-leave-active {
  transition: all 0.3s ease-in;
}
.theme-grid-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.theme-grid-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.theme-grid-move {
  transition: transform 0.4s ease;
}

/* Line clamp for description */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
