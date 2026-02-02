<template>
  <Modal
    :modelValue="modelValue"
    size="xl"
    :title="$t('website.aiMigration.title')"
    @update:modelValue="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <div class="space-y-6">
      <!-- Step 1: Input -->
      <div v-if="step === 'input'">
        <p class="text-sm text-gray-600 dark:text-slate-400 mb-4">
          {{ $t('website.aiMigration.description') }}
        </p>

        <div class="space-y-4">
          <div>
            <label class="form-label">{{ $t('website.aiMigration.contentLabel') }}</label>
            <textarea
              v-model="jsonContent"
              class="form-input min-h-[350px] font-mono text-xs"
              :placeholder="$t('website.aiMigration.placeholder')"
            ></textarea>
            <p class="text-xs text-gray-500 dark:text-slate-500 mt-1">
              {{ $t('website.aiMigration.hint') }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="downloadImages"
              v-model="downloadImages"
              class="form-checkbox"
            />
            <label for="downloadImages" class="text-sm text-gray-700 dark:text-slate-300">
              {{ $t('website.aiMigration.downloadImages') }}
            </label>
          </div>
        </div>
      </div>

      <!-- Step 2: Processing -->
      <div v-else-if="step === 'processing'" class="text-center py-12">
        <span class="material-icons animate-spin text-5xl text-purple-500 mb-4">refresh</span>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ $t('website.aiMigration.processing') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('website.aiMigration.processingDescription') }}
        </p>
      </div>

      <!-- Step 3: Uploading Images -->
      <div v-else-if="step === 'uploading'" class="text-center py-8">
        <span class="material-icons animate-spin text-5xl text-purple-500 mb-4">cloud_upload</span>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ $t('website.aiMigration.uploadingImages') }}
        </h3>
        <div class="max-w-md mx-auto mt-4">
          <div class="flex justify-between text-sm text-gray-600 dark:text-slate-400 mb-2">
            <span>{{ $t('website.aiMigration.progress') }}</span>
            <span>{{ uploadProgress.current }} / {{ uploadProgress.total }}</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
            <div
              class="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
              :style="{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }"
            ></div>
          </div>
          <p class="text-xs text-gray-500 dark:text-slate-500 mt-2">
            {{ currentUploadingImage }}
          </p>
        </div>
      </div>

      <!-- Step 4: Preview -->
      <div v-else-if="step === 'preview' && extractedData">
        <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
          <div class="flex items-center">
            <span class="material-icons text-green-600 dark:text-green-400 mr-2">check_circle</span>
            <span class="text-sm text-green-800 dark:text-green-300">
              {{ $t('website.aiMigration.success') }}
            </span>
          </div>
        </div>

        <!-- Summary -->
        <div class="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {{ $t('website.aiMigration.summary') }}
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-slate-500">{{ $t('website.aiMigration.sectionsFound') }}:</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="section in summary.sectionsFound"
                  :key="section"
                  class="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs"
                >
                  {{ section }}
                </span>
              </div>
            </div>
            <div>
              <span class="text-gray-500 dark:text-slate-500">{{ $t('website.aiMigration.imagesFound') }}:</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ summary.imagesFound }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-slate-500">{{ $t('website.aiMigration.languages') }}:</span>
              <div class="flex gap-1 mt-1">
                <span
                  v-for="lang in summary.languagesFound"
                  :key="lang"
                  class="px-2 py-0.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded text-xs uppercase"
                >
                  {{ lang }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Section Import Selection -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <h4 class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-3">
            {{ $t('website.aiMigration.selectSections') || 'Select sections to import' }}
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <label v-if="extractedData.hero?.photo?.link || extractedData.hero?.title?.length" class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="importSections.hero" class="form-checkbox" />
              <span class="text-gray-700 dark:text-slate-300">{{ $t('website.sections.hero') || 'Hero Banner' }}</span>
            </label>
            <label v-if="extractedData.locationSection?.items?.length" class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="importSections.locationSection" class="form-checkbox" />
              <span class="text-gray-700 dark:text-slate-300">{{ $t('website.sections.locations') || 'Locations' }}</span>
            </label>
            <label v-if="extractedData.campaignSection?.length" class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="importSections.campaignSection" class="form-checkbox" />
              <span class="text-gray-700 dark:text-slate-300">{{ $t('website.sections.campaigns') || 'Campaigns' }}</span>
            </label>
            <label v-if="extractedData.hotels?.ids?.length" class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="importSections.hotels" class="form-checkbox" />
              <span class="text-gray-700 dark:text-slate-300">{{ $t('website.sections.hotels') || 'Hotels' }}</span>
            </label>
            <label v-if="extractedData.tours?.ids?.length" class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="importSections.tours" class="form-checkbox" />
              <span class="text-gray-700 dark:text-slate-300">{{ $t('website.sections.tours') || 'Tours' }}</span>
            </label>
            <label v-if="extractedData.pages?.length" class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="importSections.pages" class="form-checkbox" />
              <span class="text-gray-700 dark:text-slate-300">{{ $t('website.sections.pages') || 'Pages' }} ({{ extractedData.pages?.length || 0 }})</span>
            </label>
            <label v-if="extractedData.photos?.length" class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="importSections.photos" class="form-checkbox" />
              <span class="text-gray-700 dark:text-slate-300">{{ $t('website.sections.photos') || 'Photos' }} ({{ extractedData.photos?.length || 0 }})</span>
            </label>
            <label v-if="extractedData.settings" class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="importSections.settings" class="form-checkbox" />
              <span class="text-gray-700 dark:text-slate-300">{{ $t('website.aiMigration.tabs.settings') || 'Settings' }}</span>
            </label>
            <label v-if="extractedData.header?.tabs?.length" class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="importSections.header" class="form-checkbox" />
              <span class="text-gray-700 dark:text-slate-300">{{ $t('website.header.title') || 'Header' }}</span>
            </label>
            <label v-if="extractedData.footer?.items?.length" class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="importSections.footer" class="form-checkbox" />
              <span class="text-gray-700 dark:text-slate-300">{{ $t('website.footer.title') || 'Footer' }}</span>
            </label>
          </div>
          
          <!-- Homepage Theme Sections -->
          <div v-if="hasAnyThemeData" class="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
            <h5 class="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2 uppercase tracking-wide">
              {{ $t('website.aiMigration.themeSpecificSections') || 'Theme-Specific Sections' }}
            </h5>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
              <label v-if="extractedData.homepageTheme?.tour?.hero?.photo?.link" class="flex items-center gap-2 text-sm">
                <input type="checkbox" v-model="importSections.tourTheme" class="form-checkbox" />
                <span class="text-gray-700 dark:text-slate-300">{{ $t('website.themes.tour.name') || 'Tour Theme' }}</span>
              </label>
              <label v-if="extractedData.homepageTheme?.flight?.hero?.photo?.length || extractedData.homepageTheme?.flight?.routes?.items?.length" class="flex items-center gap-2 text-sm">
                <input type="checkbox" v-model="importSections.flightTheme" class="form-checkbox" />
                <span class="text-gray-700 dark:text-slate-300">{{ $t('website.themes.flight.name') || 'Flight Theme' }}</span>
              </label>
              <label v-if="extractedData.homepageTheme?.activity?.hero?.photo?.link" class="flex items-center gap-2 text-sm">
                <input type="checkbox" v-model="importSections.activityTheme" class="form-checkbox" />
                <span class="text-gray-700 dark:text-slate-300">{{ $t('website.themes.activity.name') || 'Activity Theme' }}</span>
              </label>
              <label v-if="extractedData.homepageTheme?.bedbank?.hero?.photo?.link || extractedData.homepageTheme?.bedbank?.locations?.items?.length" class="flex items-center gap-2 text-sm">
                <input type="checkbox" v-model="importSections.bedbankTheme" class="form-checkbox" />
                <span class="text-gray-700 dark:text-slate-300">{{ $t('website.themes.bedbank.name') || 'Bedbank Theme' }}</span>
              </label>
              <label v-if="extractedData.homepageTheme?.transfer?.hero?.photo?.link" class="flex items-center gap-2 text-sm">
                <input type="checkbox" v-model="importSections.transferTheme" class="form-checkbox" />
                <span class="text-gray-700 dark:text-slate-300">{{ $t('website.themes.transfer.name') || 'Transfer Theme' }}</span>
              </label>
              <label v-if="extractedData.homepageTheme?.cruise?.hero?.photo?.link" class="flex items-center gap-2 text-sm">
                <input type="checkbox" v-model="importSections.cruiseTheme" class="form-checkbox" />
                <span class="text-gray-700 dark:text-slate-300">{{ $t('website.themes.cruise.name') || 'Cruise Theme' }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Preview Tabs -->
        <div class="border-b border-gray-200 dark:border-slate-700 mb-4">
          <nav class="flex space-x-4 overflow-x-auto">
            <button
              v-for="tab in previewTabs"
              :key="tab.key"
              class="px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap"
              :class="activeTab === tab.key
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Hero Preview -->
        <div v-show="activeTab === 'hero'" class="space-y-4">
          <div v-if="extractedData.hero" class="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
            <div class="flex gap-4">
              <div v-if="extractedData.hero.photo?.link" class="w-32 h-20 rounded overflow-hidden flex-shrink-0">
                <img :src="getImageUrl(extractedData.hero.photo.link)" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1">
                <h4 class="font-medium text-gray-900 dark:text-white">
                  {{ getLocalizedText(extractedData.hero.title, 'en') || getLocalizedText(extractedData.hero.title, 'tr') || '-' }}
                </h4>
                <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">
                  {{ getLocalizedText(extractedData.hero.description, 'en') || getLocalizedText(extractedData.hero.description, 'tr') || '-' }}
                </p>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
            {{ $t('website.aiMigration.noHeroData') }}
          </div>
        </div>

        <!-- Settings Preview -->
        <div v-show="activeTab === 'settings'" class="space-y-4">
          <div v-if="extractedData.settings" class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <label class="text-xs text-gray-500 dark:text-slate-500">{{ $t('website.aiMigration.siteName') }}</label>
              <p class="font-medium text-gray-900 dark:text-white">{{ extractedData.settings.name || '-' }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <label class="text-xs text-gray-500 dark:text-slate-500">{{ $t('website.aiMigration.siteTitle') }}</label>
              <p class="font-medium text-gray-900 dark:text-white">{{ extractedData.settings.siteTitle || '-' }}</p>
            </div>
            <div v-if="extractedData.settings.logo" class="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <label class="text-xs text-gray-500 dark:text-slate-500">{{ $t('website.aiMigration.logo') }}</label>
              <img :src="getImageUrl(extractedData.settings.logo?.link || extractedData.settings.logo)" class="h-8 mt-1" />
            </div>
            <div v-if="extractedData.settings.themeColor" class="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <label class="text-xs text-gray-500 dark:text-slate-500">{{ $t('website.aiMigration.themeColor') }}</label>
              <div class="flex items-center gap-2 mt-1">
                <div class="w-6 h-6 rounded" :style="{ backgroundColor: extractedData.settings.themeColor }"></div>
                <span class="text-sm text-gray-900 dark:text-white">{{ extractedData.settings.themeColor }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Locations Preview -->
        <div v-show="activeTab === 'locations'" class="space-y-3 max-h-[400px] overflow-y-auto">
          <div
            v-for="(loc, index) in extractedData.locationSection?.items || extractedData.locations || []"
            :key="index"
            class="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 flex items-center gap-4"
          >
            <div v-if="loc.photo?.link" class="w-16 h-16 rounded overflow-hidden flex-shrink-0">
              <img :src="getImageUrl(loc.photo.link)" class="w-full h-full object-cover" />
            </div>
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white">{{ loc.city }}</h4>
              <p class="text-sm text-gray-500 dark:text-slate-400">{{ loc.country }}</p>
            </div>
          </div>
          <div v-if="!(extractedData.locationSection?.items?.length || extractedData.locations?.length)" class="text-center py-8 text-gray-500 dark:text-slate-400">
            {{ $t('website.aiMigration.noLocationsData') }}
          </div>
        </div>

        <!-- Campaigns Preview -->
        <div v-show="activeTab === 'campaigns'" class="space-y-3 max-h-[400px] overflow-y-auto">
          <div
            v-for="(campaign, index) in extractedData.campaignSection || []"
            :key="index"
            class="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 flex items-center gap-4"
          >
            <div v-if="campaign.photo?.link" class="w-20 h-16 rounded overflow-hidden flex-shrink-0">
              <img :src="getImageUrl(campaign.photo.link)" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-gray-900 dark:text-white">
                {{ getLocalizedText(campaign.title, 'en') || getLocalizedText(campaign.title, 'tr') || '-' }}
              </h4>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ getLocalizedText(campaign.description, 'en') || getLocalizedText(campaign.description, 'tr') || '-' }}
              </p>
            </div>
          </div>
          <div v-if="!extractedData.campaignSection?.length" class="text-center py-8 text-gray-500 dark:text-slate-400">
            {{ $t('website.aiMigration.noCampaignsData') }}
          </div>
        </div>

        <!-- Pages Preview -->
        <div v-show="activeTab === 'pages'" class="space-y-3 max-h-[400px] overflow-y-auto">
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <p class="text-sm text-blue-700 dark:text-blue-300">
              {{ $t('website.aiMigration.pagesNote') || 'Pages will be imported as CMS pages for your website.' }}
            </p>
          </div>
          <div
            v-for="(page, index) in extractedData.pages || []"
            :key="index"
            class="bg-gray-50 dark:bg-slate-800 rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-medium text-gray-900 dark:text-white">
                {{ getLocalizedText(page.title, 'en') || getLocalizedText(page.title, 'tr') || page.url || '-' }}
              </h4>
              <span class="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                /{{ page.url }}
              </span>
            </div>
            <p v-if="page.content?.length" class="text-sm text-gray-500 dark:text-slate-400 line-clamp-2">
              {{ getPageContentPreview(page.content) }}
            </p>
            <div v-else class="text-xs text-gray-400">{{ $t('website.aiMigration.noContent') || 'No content' }}</div>
          </div>
          <div v-if="!extractedData.pages?.length" class="text-center py-8 text-gray-500 dark:text-slate-400">
            {{ $t('website.aiMigration.noPagesData') }}
          </div>
        </div>

        <!-- Photos Preview (root level photos array) -->
        <div v-show="activeTab === 'photos'" class="space-y-4">
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <p class="text-sm text-blue-700 dark:text-blue-300">
              {{ $t('website.aiMigration.photosNote') || 'These are general photos stored in the storefront photo gallery.' }}
            </p>
          </div>
          <div class="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-[400px] overflow-y-auto">
            <div
              v-for="(photo, index) in extractedData.photos || []"
              :key="index"
              class="relative aspect-square rounded overflow-hidden bg-gray-100 dark:bg-slate-700"
            >
              <img :src="getImageUrl(photo?.link || photo)" class="w-full h-full object-cover" />
              <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5 truncate">
                {{ photo.width || '?' }}x{{ photo.height || '?' }}
              </div>
            </div>
          </div>
          <div v-if="!extractedData.photos?.length" class="text-center py-8 text-gray-500 dark:text-slate-400">
            {{ $t('website.aiMigration.noPhotosData') || 'No photos found in the data.' }}
          </div>
        </div>

        <!-- Images Preview -->
        <div v-show="activeTab === 'images'" class="space-y-4">
          <div class="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-[400px] overflow-y-auto">
            <div
              v-for="(img, index) in images"
              :key="index"
              class="relative aspect-square rounded overflow-hidden bg-gray-100 dark:bg-slate-700"
            >
              <img :src="img.newUrl ? getFileUrl(`/uploads/${img.newUrl}`) : img.url" class="w-full h-full object-cover" />
              <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5 truncate">
                {{ img.section }}
              </div>
              <span
                v-if="img.status === 'uploaded'"
                class="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
              >
                <span class="material-icons text-xs text-white">check</span>
              </span>
              <span
                v-else-if="img.status === 'failed'"
                class="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
              >
                <span class="material-icons text-xs text-white">close</span>
              </span>
            </div>
          </div>
          <div v-if="!images.length" class="text-center py-8 text-gray-500 dark:text-slate-400">
            {{ $t('website.aiMigration.noImagesData') }}
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="step === 'error'" class="text-center py-12">
        <span class="material-icons text-5xl text-red-500 mb-4">error</span>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ $t('website.aiMigration.error') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          {{ errorMessage }}
        </p>
        <button class="btn-outline" @click="step = 'input'">
          {{ $t('common.tryAgain') }}
        </button>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button class="btn-outline" @click="handleClose">
          {{ $t('common.cancel') }}
        </button>
        <button
          v-if="step === 'input'"
          class="btn-primary bg-purple-600 hover:bg-purple-700"
          :disabled="!isValidJson || jsonContent.trim().length < 100"
          @click="processMigration"
        >
          <span class="material-icons mr-2">auto_awesome</span>
          {{ $t('website.aiMigration.analyze') }}
        </button>
        <button
          v-if="step === 'preview'"
          class="btn-primary bg-purple-600 hover:bg-purple-700"
          :disabled="applyingData"
          @click="applyData"
        >
          <span v-if="applyingData" class="material-icons animate-spin mr-2">refresh</span>
          <span v-else class="material-icons mr-2">check</span>
          {{ $t('website.aiMigration.apply') }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import websiteService from '@/services/websiteService'
import { getImageUrl as getCdnImageUrl, getFileUrl } from '@/utils/imageUrl'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'apply'])

const { t } = useI18n()
const toast = useToast()

// State
const step = ref('input')
const jsonContent = ref('')
const downloadImages = ref(true)
const extractedData = ref(null)
const images = ref([])
const summary = ref({})
const errorMessage = ref('')
const activeTab = ref('hero')
const applyingData = ref(false)
const uploadProgress = ref({ current: 0, total: 0 })
const currentUploadingImage = ref('')

// Import section selections - all enabled by default, user can uncheck
const importSections = ref({
  hero: false,           // Hero banner - disabled by default since it often creates unwanted blocks
  locationSection: false, // Locations - disabled by default since it often creates unwanted blocks
  campaignSection: true,
  hotels: true,
  tours: true,
  pages: true,           // Pages - enabled by default (user's main content)
  photos: true,          // Photos gallery
  settings: true,        // Site settings
  header: true,          // Navigation header
  footer: true,          // Footer
  // Theme-specific sections
  tourTheme: true,
  flightTheme: true,
  activityTheme: true,
  bedbankTheme: true,
  transferTheme: true,
  cruiseTheme: true
})

// Check if any theme data exists
const hasAnyThemeData = computed(() => {
  const theme = extractedData.value?.homepageTheme
  if (!theme) return false
  return !!(
    theme.tour?.hero?.photo?.link ||
    theme.flight?.hero?.photo?.length ||
    theme.flight?.routes?.items?.length ||
    theme.activity?.hero?.photo?.link ||
    theme.bedbank?.hero?.photo?.link ||
    theme.bedbank?.locations?.items?.length ||
    theme.transfer?.hero?.photo?.link ||
    theme.cruise?.hero?.photo?.link
  )
})

// Preview tabs
const previewTabs = computed(() => [
  { key: 'hero', label: t('website.aiMigration.tabs.hero') },
  { key: 'settings', label: t('website.aiMigration.tabs.settings') },
  { key: 'locations', label: t('website.aiMigration.tabs.locations') },
  { key: 'campaigns', label: t('website.aiMigration.tabs.campaigns') },
  { key: 'pages', label: t('website.aiMigration.tabs.pages') + ` (${extractedData.value?.pages?.length || 0})` },
  { key: 'photos', label: t('website.aiMigration.tabs.photos') + ` (${extractedData.value?.photos?.length || 0})` },
  { key: 'images', label: t('website.aiMigration.tabs.images') }
])

// Check if JSON is valid
const isValidJson = computed(() => {
  if (!jsonContent.value.trim()) return false
  try {
    JSON.parse(jsonContent.value)
    return true
  } catch {
    return false
  }
})

// Get image URL (from CDN or API server)
const getImageUrl = (photo) => {
  if (!photo) return ''
  const link = typeof photo === 'string' ? photo : photo.link
  if (!link) return ''
  // Full external URLs pass through
  if (link.startsWith('http://') || link.startsWith('https://')) return link
  // Storefront uploads are served from API server's /uploads/ path
  if (link.startsWith('storefront/')) return getFileUrl(`/uploads/${link}`)
  // Other images use the CDN
  return getCdnImageUrl(link)
}

// Get localized text from array
const getLocalizedText = (arr, lang) => {
  if (!Array.isArray(arr)) return arr || ''
  const item = arr.find(i => i.lang === lang)
  return item?.value || ''
}

// Get page content preview (strip HTML and truncate)
const getPageContentPreview = (content) => {
  if (!Array.isArray(content)) return ''
  const item = content.find(i => i.lang === 'en') || content.find(i => i.lang === 'tr') || content[0]
  if (!item?.value) return ''
  // Strip HTML tags and get first 200 chars
  const text = item.value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > 200 ? text.substring(0, 200) + '...' : text
}

// Methods
const handleClose = () => {
  emit('update:modelValue', false)
  // Reset state after animation
  setTimeout(() => {
    step.value = 'input'
    jsonContent.value = ''
    extractedData.value = null
    images.value = []
    summary.value = {}
    errorMessage.value = ''
    activeTab.value = 'hero'
    applyingData.value = false
    uploadProgress.value = { current: 0, total: 0 }
    // Reset import sections (hero & locations off by default to avoid unexpected blocks)
    importSections.value = {
      hero: false,
      locationSection: false,
      campaignSection: true,
      hotels: true,
      tours: true,
      pages: true,
      photos: true,
      settings: true,
      header: true,
      footer: true,
      tourTheme: true,
      flightTheme: true,
      activityTheme: true,
      bedbankTheme: true,
      transferTheme: true,
      cruiseTheme: true
    }
  }, 300)
}

const processMigration = async () => {
  step.value = 'processing'

  try {
    const parsed = JSON.parse(jsonContent.value)
    const result = await websiteService.aiMigrateStorefront(parsed, downloadImages.value)

    if (result.success && result.data) {
      extractedData.value = result.data
      images.value = result.images || []
      summary.value = result.summary || {}

      // If download images is enabled, upload them
      if (downloadImages.value && images.value.length > 0) {
        await uploadImages()
      }

      step.value = 'preview'
      toast.success(t('website.aiMigration.migrationSuccess'))
    } else {
      throw new Error(result.message || 'Migration failed')
    }
  } catch (error) {
    console.error('Migration error:', error)
    errorMessage.value = error.response?.data?.message || error.message || t('website.aiMigration.migrationError')
    step.value = 'error'
    toast.error(errorMessage.value)
  }
}

const uploadImages = async () => {
  step.value = 'uploading'
  uploadProgress.value = { current: 0, total: images.value.length }

  for (let i = 0; i < images.value.length; i++) {
    const img = images.value[i]
    uploadProgress.value.current = i + 1
    currentUploadingImage.value = img.section + (img.index !== null ? ` #${img.index}` : '')

    try {
      const result = await websiteService.downloadAndUploadImage(
        img.url,
        img.section,
        img.index?.toString() || '0'
      )

      if (result.success && result.data) {
        images.value[i].status = 'uploaded'
        images.value[i].newUrl = result.data.link

        // Update the extracted data with new image URL
        updateImageInData(img.section, img.index, result.data)
      } else {
        images.value[i].status = 'failed'
        images.value[i].error = result.message || 'Upload failed'
      }
    } catch (error) {
      console.error('Image upload error:', error)
      images.value[i].status = 'failed'
      images.value[i].error = error.message
    }
  }
}

const updateImageInData = (section, index, newImageData) => {
  if (!extractedData.value) return

  const newPhoto = {
    id: newImageData.id,
    width: newImageData.width || 0,
    height: newImageData.height || 0,
    link: newImageData.link
  }

  switch (section) {
    case 'hero':
      if (extractedData.value.hero) {
        extractedData.value.hero.photo = newPhoto
      }
      break
    case 'logo':
      if (extractedData.value.settings) {
        extractedData.value.settings.logo = newPhoto
      }
      break
    case 'favicon':
      if (extractedData.value.settings) {
        extractedData.value.settings.favicon = newPhoto
      }
      break
    case 'location':
      if (extractedData.value.locationSection?.items?.[index]) {
        extractedData.value.locationSection.items[index].photo = newPhoto
      }
      if (extractedData.value.locations?.[index]) {
        extractedData.value.locations[index].photo = newPhoto
      }
      break
    case 'campaign':
      if (extractedData.value.campaignSection?.[index]) {
        extractedData.value.campaignSection[index].photo = newPhoto
      }
      break
    case 'headerTab':
      if (extractedData.value.header?.tabs?.[index]) {
        extractedData.value.header.tabs[index].photo = newPhoto
      }
      break
    // Theme-specific images
    case 'tour-hero':
      if (extractedData.value.homepageTheme?.tour?.hero) {
        extractedData.value.homepageTheme.tour.hero.photo = newPhoto
      }
      break
    case 'bedbank-hero':
      if (extractedData.value.homepageTheme?.bedbank?.hero) {
        extractedData.value.homepageTheme.bedbank.hero.photo = newPhoto
      }
      break
    case 'bedbank-location':
      if (extractedData.value.homepageTheme?.bedbank?.locations?.items?.[index]) {
        extractedData.value.homepageTheme.bedbank.locations.items[index].photo = newPhoto
      }
      break
    case 'transfer-hero':
      if (extractedData.value.homepageTheme?.transfer?.hero) {
        extractedData.value.homepageTheme.transfer.hero.photo = newPhoto
      }
      break
    case 'activity-hero':
      if (extractedData.value.homepageTheme?.activity?.hero) {
        extractedData.value.homepageTheme.activity.hero.photo = newPhoto
      }
      break
    case 'activity-campaign':
      if (extractedData.value.homepageTheme?.activity?.campaignSection?.campaign?.[index]) {
        extractedData.value.homepageTheme.activity.campaignSection.campaign[index].photo = newPhoto
      }
      break
    case 'photos':
      if (extractedData.value.photos?.[index]) {
        extractedData.value.photos[index] = newPhoto
      }
      break
    case 'etbis':
      if (extractedData.value.settings?.etbis) {
        extractedData.value.settings.etbis.photo = newPhoto
      }
      break
    case 'tursab':
      if (extractedData.value.settings?.tursab) {
        extractedData.value.settings.tursab.photo = newPhoto
      }
      break
    case 'tour-location':
      if (extractedData.value.homepageTheme?.tour?.locations?.items?.[index]) {
        extractedData.value.homepageTheme.tour.locations.items[index].photo = newPhoto
      }
      break
    case 'tour-campaign':
      if (extractedData.value.homepageTheme?.tour?.campaignSection?.campaign) {
        extractedData.value.homepageTheme.tour.campaignSection.campaign.photo = newPhoto
      }
      break
    case 'cruise-hero':
      if (extractedData.value.homepageTheme?.cruise?.hero) {
        extractedData.value.homepageTheme.cruise.hero.photo = newPhoto
      }
      break
    case 'flight-hero':
      if (extractedData.value.homepageTheme?.flight?.hero?.photo) {
        if (Array.isArray(extractedData.value.homepageTheme.flight.hero.photo)) {
          extractedData.value.homepageTheme.flight.hero.photo[index] = newPhoto
        } else {
          extractedData.value.homepageTheme.flight.hero.photo = newPhoto
        }
      }
      break
  }
}

const applyData = async () => {
  applyingData.value = true

  try {
    // Build filtered data based on user selections
    const filteredData = {}
    
    if (importSections.value.hero && extractedData.value.hero) {
      filteredData.hero = extractedData.value.hero
    }
    if (importSections.value.locationSection && extractedData.value.locationSection) {
      filteredData.locationSection = extractedData.value.locationSection
    }
    if (importSections.value.campaignSection && extractedData.value.campaignSection) {
      filteredData.campaignSection = extractedData.value.campaignSection
    }
    if (importSections.value.hotels && extractedData.value.hotels) {
      filteredData.hotels = extractedData.value.hotels
    }
    if (importSections.value.tours && extractedData.value.tours) {
      filteredData.tours = extractedData.value.tours
    }
    if (importSections.value.pages && extractedData.value.pages) {
      filteredData.pages = extractedData.value.pages
    }
    if (importSections.value.photos && extractedData.value.photos) {
      filteredData.photos = extractedData.value.photos
    }
    if (importSections.value.settings && extractedData.value.settings) {
      filteredData.settings = extractedData.value.settings
    }
    if (importSections.value.header && extractedData.value.header) {
      filteredData.header = extractedData.value.header
    }
    if (importSections.value.footer && extractedData.value.footer) {
      filteredData.footer = extractedData.value.footer
    }
    
    // Build homepageTheme based on selected theme sections
    if (extractedData.value.homepageTheme) {
      const sourceTheme = extractedData.value.homepageTheme
      const filteredTheme = { type: sourceTheme.type || 'home1' }
      
      if (importSections.value.tourTheme && sourceTheme.tour) {
        filteredTheme.tour = sourceTheme.tour
      }
      if (importSections.value.flightTheme && sourceTheme.flight) {
        filteredTheme.flight = sourceTheme.flight
      }
      if (importSections.value.activityTheme && sourceTheme.activity) {
        filteredTheme.activity = sourceTheme.activity
      }
      if (importSections.value.bedbankTheme && sourceTheme.bedbank) {
        filteredTheme.bedbank = sourceTheme.bedbank
      }
      if (importSections.value.transferTheme && sourceTheme.transfer) {
        filteredTheme.transfer = sourceTheme.transfer
      }
      if (importSections.value.cruiseTheme && sourceTheme.cruise) {
        filteredTheme.cruise = sourceTheme.cruise
      }
      
      // Only include if we have any theme data selected
      if (Object.keys(filteredTheme).length > 1) {
        filteredData.homepageTheme = filteredTheme
      }
    }
    
    if (extractedData.value.themeColor) {
      filteredData.themeColor = extractedData.value.themeColor
    }

    const result = await websiteService.applyMigratedStorefront(filteredData)

    if (result.success) {
      // Show detailed success message
      let successMsg = t('website.aiMigration.applySuccess')
      if (result.pagesImported > 0) {
        successMsg += ` (${result.pagesImported} ${t('website.aiMigration.tabs.pages') || 'pages'} imported)`
      }
      toast.success(successMsg)
      emit('apply', result.data)
      handleClose()
    } else {
      throw new Error(result.message || 'Apply failed')
    }
  } catch (error) {
    console.error('Apply error:', error)
    toast.error(error.response?.data?.message || error.message || t('website.aiMigration.applyError'))
  } finally {
    applyingData.value = false
  }
}
</script>
