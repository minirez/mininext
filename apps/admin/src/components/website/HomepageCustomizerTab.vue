<template>
  <div class="h-full flex flex-col">
    <!-- Top Action Bar -->
    <div
      class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-700 mb-4"
    >
      <div class="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="px-4 py-2 text-sm font-medium rounded-md transition-all"
          :class="
            activeTab === tab.id
              ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          "
          @click="setActiveTab(tab.id)"
        >
          <span class="flex items-center gap-2">
            <span class="material-icons text-base">{{ tab.icon }}</span
            >{{ tab.label }}
          </span>
        </button>
      </div>

      <div class="flex items-center gap-3">
        <DraftStatus :dirty="isDirty" :saving="isSaving" :lastSave="lastSave" />
        <button class="btn-outline flex items-center gap-2" @click="handlePreview">
          <span class="material-icons text-base">visibility</span>{{ $t('website.preview.title') }}
        </button>
        <button
          class="btn-primary flex items-center gap-2"
          :disabled="saving"
          @click="handlePublish"
        >
          <span v-if="saving" class="animate-spin material-icons text-base">sync</span>
          <span v-else class="material-icons text-base">publish</span>
          {{ $t('website.draft.publishToLive') }}
        </button>
      </div>
    </div>

    <!-- Header Editor -->
    <div v-show="activeTab === 'header'" class="flex-1 overflow-hidden">
      <WebsiteHeaderEditor v-model="form.header" :saving="saving" :getImageUrl="getImageUrl" />
    </div>

    <!-- Sections Editor -->
    <div v-show="activeTab === 'sections'" class="flex-1 overflow-hidden flex flex-col gap-4">
      <PageManager
        :pages="pages"
        :selectedId="selectedPageId"
        :useCustomTheme="useCustomTheme"
        :presets="presets"
        :appliedPresetId="appliedPresetId"
        @update:pages="pages = $event"
        @update:selectedId="selectPageById"
        @update:useCustomTheme="useCustomTheme = $event"
        @create="createPage"
        @delete="deletePage"
        @activate="activatePage"
        @save-preset="savePreset"
        @apply-preset="applyPreset"
        @delete-preset="deletePreset"
        @open-preset-modal="showPresetModal = true"
      />

      <div v-if="selectedPage && useCustomTheme" class="flex-1 overflow-hidden flex gap-4">
        <SectionPicker
          :sections="availableSections"
          :active="activeSectionIds"
          :category="sectionCategory"
          @update:category="sectionCategory = $event"
          @add="addSection"
          @preview="previewSection = $event"
        />

        <SectionList v-model="form.activeSections" @remove="removeSection">
          <template #editor="{ section }">
            <!-- Hero Sections -->
            <HeroSectionEditor
              v-if="section.type.startsWith('hero-')"
              v-model="form.hero"
              :saving="saving"
              :variant="section.type"
            />
            <!-- Destinations -->
            <LocationsSectionEditor
              v-else-if="section.type === 'destinations'"
              v-model="form.locationSection"
              :saving="saving"
            />
            <!-- Campaigns -->
            <CampaignsSectionEditor
              v-else-if="section.type === 'campaigns'"
              v-model="form.campaignSection"
              :saving="saving"
            />
            <!-- Hotels -->
            <HotelsSectionEditor
              v-else-if="section.type === 'hotels'"
              v-model="form.hotels"
              :saving="saving"
            />
            <!-- Tours -->
            <ToursSectionEditor
              v-else-if="section.type.includes('tours')"
              v-model="form.tours"
              :saving="saving"
              :variant="section.type"
            />
            <!-- Utility -->
            <UtilitySectionEditor
              v-else-if="['block-guide', 'block-guide-2', 'cta-newsletter'].includes(section.type)"
              v-model="form.utilitySections[section.type]"
              :saving="saving"
              :sectionType="section.type"
            />
            <!-- Bedbank Destinations -->
            <BedbankDestinationsSectionEditor
              v-else-if="section.type === 'bedbank-destinations'"
              v-model="form.bedbankDestinations"
              :saving="saving"
            />
            <!-- Bedbank Showcase -->
            <BedbankShowcaseSectionEditor
              v-else-if="section.type === 'bedbank-showcase'"
              v-model="form.bedbankShowcase"
              :saving="saving"
            />
            <!-- Bedbank Section -->
            <BedbankSectionEditor
              v-else-if="section.type === 'bedbank-section'"
              v-model="form.bedbankSections[section.instanceId || 0]"
              :saving="saving"
            />
            <!-- Generic fallback -->
            <GenericSectionEditor v-else :saving="saving" :sectionType="section.type" />
          </template>
        </SectionList>
      </div>
    </div>

    <!-- Footer Editor -->
    <div v-show="activeTab === 'footer'" class="flex-1 overflow-hidden">
      <WebsiteFooterEditor v-model="form.footer" :saving="saving" />
    </div>

    <!-- Bottom Publish Button -->
    <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-700 mt-4">
      <button class="btn-primary flex items-center gap-2" :disabled="saving" @click="handlePublish">
        <span v-if="saving" class="animate-spin material-icons text-base">sync</span>
        <span v-else class="material-icons text-base">publish</span>
        {{ $t('website.draft.publishToLive') }}
      </button>
    </div>

    <!-- Preview Modal -->
    <SectionPreviewModal v-model="previewSection" :sections="allSections" @add="addSectionById" />
    <PreviewModal
      v-model="showPreview"
      :url="previewUrl"
      :pages="useCustomTheme ? pages : []"
      :selectedPageId="previewPageId"
      @update:selectedPageId="previewPageId = $event"
    />
    <PresetModal v-model="showPresetModal" @save="confirmSavePreset" />

    <!-- Confirm Dialogs -->
    <ConfirmDialog
      v-model="showDeletePageConfirm"
      :title="$t('website.multiPage.deletePage')"
      :message="$t('website.multiPage.confirmDelete')"
      type="danger"
      :confirm-text="$t('common.delete')"
      :cancel-text="$t('common.cancel')"
      :loading="deleteLoading"
      @confirm="confirmDeletePage"
    />
    <ConfirmDialog
      v-model="showDeletePresetConfirm"
      :title="$t('website.presets.deletePreset')"
      :message="$t('website.presets.confirmDelete')"
      type="danger"
      :confirm-text="$t('common.delete')"
      :cancel-text="$t('common.cancel')"
      :loading="deleteLoading"
      @confirm="confirmDeletePreset"
    />
    <ConfirmDialog
      v-model="showApplyPresetConfirm"
      :title="$t('website.presets.applyPreset')"
      :message="$t('website.presets.confirmApply')"
      type="warning"
      :confirm-text="$t('common.apply')"
      :cancel-text="$t('common.cancel')"
      :loading="deleteLoading"
      @confirm="confirmApplyPreset"
    />
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { toCanonicalSectionType } from '@booking-engine/constants'
import websiteService from '@/services/websiteService'
import { getStorefrontImageUrl } from '@/utils/imageUrl'

// Components
import WebsiteHeaderEditor from './homepage/WebsiteHeaderEditor.vue'
import WebsiteFooterEditor from './homepage/WebsiteFooterEditor.vue'
import HeroSectionEditor from './sections/HeroSectionEditor.vue'
import LocationsSectionEditor from './sections/LocationsSectionEditor.vue'
import CampaignsSectionEditor from './sections/CampaignsSectionEditor.vue'
import HotelsSectionEditor from './sections/HotelsSectionEditor.vue'
import ToursSectionEditor from './sections/ToursSectionEditor.vue'
import GenericSectionEditor from './sections/GenericSectionEditor.vue'
import UtilitySectionEditor from './sections/UtilitySectionEditor.vue'
import BedbankDestinationsSectionEditor from './sections/BedbankDestinationsSectionEditor.vue'
import BedbankShowcaseSectionEditor from './sections/BedbankShowcaseSectionEditor.vue'
import BedbankSectionEditor from './sections/BedbankSectionEditor.vue'

// Sub-components (inline for simplicity)
import DraftStatus from './partials/DraftStatus.vue'
import PageManager from './partials/PageManager.vue'
import SectionPicker from './partials/SectionPicker.vue'
import SectionList from './partials/SectionList.vue'
import SectionPreviewModal from './partials/SectionPreviewModal.vue'
import PreviewModal from './partials/PreviewModal.vue'
import PresetModal from './partials/PresetModal.vue'
import { ConfirmDialog } from '@/components/ui'

const { t } = useI18n()
const toast = useToast()

const props = defineProps({ storefront: Object, saving: Boolean })
const emit = defineEmits(['save', 'preview', 'draft-save', 'publish', 'refresh'])

// ==================== STATE ====================

const activeTab = ref('header')
const sectionCategory = ref('all')
const previewSection = ref(null)
const showPreview = ref(false)
const showPresetModal = ref(false)
const previewUrl = ref('')
const previewPageId = ref(null)

// Draft state
const isDirty = ref(false)
const isSaving = ref(false)
const lastSave = ref(null)
const autoSaveTimer = ref(null)
const suppressAutoSave = ref(true)

// Multi-page state
const useCustomTheme = ref(false)
const pages = ref([])
const selectedPageId = ref(null)
const presets = ref([])
const appliedPresetId = ref(null)

// Confirm dialog state
const showDeletePageConfirm = ref(false)
const showDeletePresetConfirm = ref(false)
const showApplyPresetConfirm = ref(false)
const pendingDeletePageId = ref(null)
const pendingDeletePresetId = ref(null)
const pendingApplyPresetId = ref(null)
const deleteLoading = ref(false)

// Form data
const form = ref({
  header: { headerType: 'default', tabs: [] },
  footer: { items: [] },
  hero: {},
  locationSection: {},
  campaignSection: [],
  hotels: {},
  tours: {},
  activities: {},
  flights: {},
  cruiseDeals: {},
  transfers: {},
  bedbank: {},
  bedbankDestinations: { title: [], description: [], items: [] },
  bedbankShowcase: { title: [], description: [], ids: [] },
  bedbankSections: {},
  utilitySections: {},
  activeSections: []
})

// ==================== COMPUTED ====================

const tabs = computed(() => [
  { id: 'header', label: t('website.header.title'), icon: 'web_asset' },
  { id: 'sections', label: t('website.sections.title'), icon: 'view_agenda' },
  { id: 'footer', label: t('website.footer.title'), icon: 'call_to_action' }
])

const selectedPage = computed(() => pages.value.find(p => p.id === selectedPageId.value))

const allSections = computed(() => [
  { id: 'hero-1', name: t('website.sections.hero1'), icon: 'image', category: 'hero' },
  { id: 'hero-5', name: t('website.sections.heroSplit'), icon: 'vertical_split', category: 'hero' },
  { id: 'hero-6', name: t('website.sections.hero6'), icon: 'image', category: 'hero' },
  { id: 'hero-8', name: t('website.sections.hero8'), icon: 'image', category: 'hero' },
  { id: 'hero-9', name: t('website.sections.hero9'), icon: 'image', category: 'hero' },
  { id: 'hero-10', name: t('website.sections.hero10'), icon: 'image', category: 'hero' },
  { id: 'hero-bedbank', name: t('website.sections.heroBedbank'), icon: 'bed', category: 'hero' },
  {
    id: 'destinations',
    name: t('website.sections.destinations'),
    icon: 'location_on',
    category: 'content'
  },
  { id: 'campaigns', name: t('website.sections.campaigns'), icon: 'campaign', category: 'content' },
  { id: 'hotels', name: t('website.sections.hotels'), icon: 'hotel', category: 'content' },
  {
    id: 'tours-carousel',
    name: t('website.sections.toursCarousel'),
    icon: 'view_carousel',
    category: 'content'
  },
  {
    id: 'campaign-tours',
    name: t('website.sections.campaignTours'),
    icon: 'campaign',
    category: 'content'
  },
  {
    id: 'tours-grid',
    name: t('website.sections.toursGrid'),
    icon: 'grid_view',
    category: 'content'
  },
  {
    id: 'activity-campaigns',
    name: t('website.sections.activityCampaigns'),
    icon: 'local_activity',
    category: 'content'
  },
  {
    id: 'activities-grid',
    name: t('website.sections.activitiesGrid'),
    icon: 'grid_view',
    category: 'content'
  },
  { id: 'flights', name: t('website.sections.flights'), icon: 'flight', category: 'content' },
  {
    id: 'cruise-deals',
    name: t('website.sections.cruiseDeals'),
    icon: 'sailing',
    category: 'content'
  },
  {
    id: 'transfers',
    name: t('website.sections.transfers'),
    icon: 'airport_shuttle',
    category: 'content'
  },
  {
    id: 'bedbank-destinations',
    name: t('website.sections.bedbankDestinations'),
    icon: 'public',
    category: 'content'
  },
  {
    id: 'bedbank-showcase',
    name: t('website.sections.bedbankShowcase'),
    icon: 'hotel',
    category: 'content'
  },
  {
    id: 'bedbank-section',
    name: t('website.sections.bedbankSection'),
    icon: 'view_agenda',
    category: 'content'
  },
  {
    id: 'block-guide',
    name: t('website.sections.blockGuide'),
    icon: 'help_outline',
    category: 'utility'
  },
  {
    id: 'block-guide-2',
    name: t('website.sections.blockGuide2'),
    icon: 'support_agent',
    category: 'utility'
  },
  {
    id: 'cta-newsletter',
    name: t('website.sections.ctaNewsletter'),
    icon: 'ads_click',
    category: 'utility'
  },
  {
    id: 'footer-default',
    name: t('website.sections.footerDefault'),
    icon: 'call_to_action',
    category: 'footer'
  },
  {
    id: 'footer-minimal',
    name: t('website.sections.footerMinimal'),
    icon: 'minimize',
    category: 'footer'
  }
])

const availableSections = computed(() =>
  sectionCategory.value === 'all'
    ? allSections.value
    : allSections.value.filter(s => s.category === sectionCategory.value)
)

const activeSectionIds = computed(() =>
  form.value.activeSections.map(s => toCanonicalSectionType(s.type))
)

// ==================== METHODS ====================

const setActiveTab = async id => {
  if (activeTab.value === id) return
  if (isDirty.value) await saveDraft()
  activeTab.value = id
}

const getImageUrl = getStorefrontImageUrl

// ==================== DRAFT MANAGEMENT ====================

const generateLocalId = (prefix = 'id') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const clone = obj => {
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch {
    return Array.isArray(obj) ? [] : {}
  }
}

const getActivePresetId = () =>
  appliedPresetId.value || props.storefront?.customTheme?.activePresetId || null

const buildUpdatedPresetsForActive = nextPages => {
  const presets = clone(props.storefront?.savedThemePresets || [])

  let activePresetId = getActivePresetId() || presets[0]?.id || null
  if (!activePresetId) {
    activePresetId = generateLocalId('preset')
    presets.push({ id: activePresetId, name: 'Default', description: '', pages: [] })
  }

  let idx = presets.findIndex(p => p.id === activePresetId)
  if (idx === -1) {
    presets.push({ id: activePresetId, name: 'Default', description: '', pages: [] })
    idx = presets.length - 1
  }

  presets[idx] = { ...presets[idx], pages: nextPages }
  return { presets, activePresetId }
}

const triggerAutoSave = () => {
  if (suppressAutoSave.value) return
  isDirty.value = true
  clearTimeout(autoSaveTimer.value)
  autoSaveTimer.value = setTimeout(saveDraft, 2000)
}

const saveDraft = async () => {
  if (isSaving.value || !isDirty.value) return
  isSaving.value = true

  try {
    const payload = buildDraftPayload()

    // Sections are stored inside the active preset -> active page.
    if (activeTab.value === 'sections' && selectedPageId.value) {
      const idx = pages.value.findIndex(p => p.id === selectedPageId.value)
      if (idx !== -1) pages.value[idx] = { ...pages.value[idx], customization: payload }

      const { presets, activePresetId } = buildUpdatedPresetsForActive(pages.value)
      await websiteService.saveDraft({
        useCustomTheme: useCustomTheme.value,
        customTheme: { activePresetId },
        savedThemePresets: presets
      })
    } else {
      await websiteService.saveDraft(payload)
    }

    isDirty.value = false
    lastSave.value = new Date()
    emit('draft-save', payload)
  } catch (e) {
    console.error('Draft save failed:', e)
    toast.error(t('website.draft.saveError'))
  } finally {
    isSaving.value = false
  }
}

const buildDraftPayload = () => {
  if (activeTab.value === 'header') return { header: form.value.header }
  if (activeTab.value === 'footer') return { footer: form.value.footer }
  return {
    hero: form.value.hero,
    locationSection: form.value.locationSection,
    campaignSection: form.value.campaignSection,
    hotels: form.value.hotels,
    tours: form.value.tours,
    bedbankDestinations: form.value.bedbankDestinations,
    bedbankShowcase: form.value.bedbankShowcase,
    bedbankSections: form.value.bedbankSections,
    utilitySections: form.value.utilitySections,
    activeSections: form.value.activeSections.map((s, i) => ({
      sectionType: toCanonicalSectionType(s.type),
      order: i,
      enabled: true,
      // Preserve instanceId so site3 can match bedbank-section to its data in bedbankSections
      ...(s.instanceId ? { instanceId: s.instanceId } : {})
    }))
  }
}

// ==================== SECTION MANAGEMENT ====================

const SINGLETONS = { hero: /^hero-/, footer: /^footer-/ }

const addSection = section => {
  const canonical = toCanonicalSectionType(section.id)

  // Remove existing singleton of same category
  for (const [cat, pattern] of Object.entries(SINGLETONS)) {
    if (pattern.test(canonical)) {
      form.value.activeSections = form.value.activeSections.filter(
        s => !pattern.test(toCanonicalSectionType(s.type))
      )
      break
    }
  }

  // Don't add duplicate non-singletons (except for bedbank-section which allows multiple)
  if (activeSectionIds.value.includes(canonical) && canonical !== 'bedbank-section') return

  // For bedbank-section, check maxCount (3)
  if (canonical === 'bedbank-section') {
    const existingCount = form.value.activeSections.filter(
      s => toCanonicalSectionType(s.type) === 'bedbank-section'
    ).length
    if (existingCount >= 3) return
  }

  const instanceId = `${section.id}-${Date.now()}`
  form.value.activeSections.push({
    id: instanceId,
    type: section.id,
    instanceId: instanceId,
    expanded: true
  })

  // Initialize bedbankSections entry for new bedbank-section instance
  if (canonical === 'bedbank-section') {
    form.value.bedbankSections[instanceId] = {
      title: [],
      description: [],
      locationId: null,
      locationName: ''
    }
  }
}

const addSectionById = id => {
  const section = allSections.value.find(s => s.id === id)
  if (section) addSection(section)
}

const removeSection = index => form.value.activeSections.splice(index, 1)

// ==================== PAGE MANAGEMENT ====================

const loadPages = async () => {
  const sfPresets = props.storefront?.savedThemePresets || []
  // Use local appliedPresetId first (may have been updated by applyPreset before storefront refreshes)
  const activeId = appliedPresetId.value || getActivePresetId() || sfPresets[0]?.id || null
  const activePreset = sfPresets.find(p => p.id === activeId) || sfPresets[0] || null

  pages.value = clone(activePreset?.pages || [])

  if (selectedPageId.value && !pages.value.some(p => p.id === selectedPageId.value)) {
    selectedPageId.value = null
  }

  if (!selectedPageId.value && pages.value.length) {
    const active = pages.value.find(p => p.isActive) || pages.value[0]
    await selectPage(active)
  } else if (selectedPageId.value && pages.value.length) {
    // Re-select the current page to refresh form data from (potentially updated) customization
    const currentPage = pages.value.find(p => p.id === selectedPageId.value)
    if (currentPage) await selectPage(currentPage)
  }
}

const selectPage = async page => {
  if (!page?.id) return
  if (isDirty.value) await saveDraft()
  selectedPageId.value = page.id

  // Always load section data from the page customization (not only when on sections tab),
  // so data is ready when the user switches tabs.
  const src =
    page.customization && Object.keys(page.customization).length
      ? page.customization
      : props.storefront
  const wasSuppressed = suppressAutoSave.value
  suppressAutoSave.value = true
  Object.assign(form.value, {
    hero: src.hero || {},
    locationSection: src.locationSection || {},
    campaignSection: src.campaignSection || [],
    hotels: src.hotels || {},
    tours: src.tours || {},
    bedbankDestinations: src.bedbankDestinations || { title: [], description: [], items: [] },
    bedbankShowcase: src.bedbankShowcase || { title: [], description: [], ids: [] },
    bedbankSections: src.bedbankSections || {},
    utilitySections: src.utilitySections || {},
    activeSections: buildActiveSections(src)
  })
  isDirty.value = false
  await nextTick()
  if (!wasSuppressed) suppressAutoSave.value = false
}

const selectPageById = id => {
  const page = pages.value.find(p => p.id === id)
  if (page) selectPage(page)
}

const createPage = async data => {
  try {
    const url = data?.url || '/'
    const normalized = url.startsWith('/') ? url : `/${url}`
    if (pages.value.some(p => p.url === normalized)) {
      return toast.error(t('website.multiPage.urlExists') || t('common.error'))
    }

    const page = {
      id: generateLocalId('page'),
      url: normalized,
      name: data?.name || (normalized === '/' ? 'Home' : normalized.slice(1)),
      isActive: data?.isActive !== false,
      customization: {}
    }

    const nextPages = [...pages.value, page]
    pages.value = nextPages
    selectedPageId.value = page.id

    const { presets, activePresetId } = buildUpdatedPresetsForActive(nextPages)
    appliedPresetId.value = activePresetId
    await websiteService.saveDraft({
      useCustomTheme: useCustomTheme.value,
      customTheme: { activePresetId },
      savedThemePresets: presets
    })

    toast.success(t('website.multiPage.pageCreated'))
  } catch (e) {
    toast.error(e.response?.data?.message || t('common.error'))
  }
}

const deletePage = id => {
  pendingDeletePageId.value = id
  showDeletePageConfirm.value = true
}

const confirmDeletePage = async () => {
  const id = pendingDeletePageId.value
  if (!id) return
  deleteLoading.value = true
  try {
    const nextPages = pages.value.filter(p => p.id !== id)
    pages.value = nextPages
    if (selectedPageId.value === id) selectedPageId.value = null

    const { presets, activePresetId } = buildUpdatedPresetsForActive(nextPages)
    appliedPresetId.value = activePresetId
    await websiteService.saveDraft({
      useCustomTheme: useCustomTheme.value,
      customTheme: { activePresetId },
      savedThemePresets: presets
    })

    toast.success(t('website.multiPage.pageDeleted'))
    if (!selectedPageId.value && pages.value.length) {
      const active = pages.value.find(p => p.isActive) || pages.value[0]
      await selectPage(active)
    }
  } catch (e) {
    toast.error(t('common.error'))
  } finally {
    deleteLoading.value = false
    showDeletePageConfirm.value = false
    pendingDeletePageId.value = null
  }
}

const activatePage = async id => {
  try {
    const nextPages = pages.value.map(p => (p.id === id ? { ...p, isActive: true } : p))
    pages.value = nextPages

    const { presets, activePresetId } = buildUpdatedPresetsForActive(nextPages)
    appliedPresetId.value = activePresetId
    await websiteService.saveDraft({
      useCustomTheme: useCustomTheme.value,
      customTheme: { activePresetId },
      savedThemePresets: presets
    })

    toast.success(t('website.multiPage.pageActivated'))
  } catch (e) {
    toast.error(t('common.error'))
  }
}

// ==================== PRESETS ====================

const loadPresets = async () => {
  // Prefer dedicated endpoint so we don't rely on the full storefront payload shape.
  try {
    const res = await websiteService.getThemePresets()
    presets.value = res.data || []
    appliedPresetId.value =
      presets.value.find(p => p.isActive)?.id ||
      props.storefront?.customTheme?.activePresetId ||
      null
  } catch (e) {
    presets.value = props.storefront?.savedThemePresets || []
    appliedPresetId.value = props.storefront?.customTheme?.activePresetId || null
  }
}

const savePreset = async name => {
  try {
    // Ensure any pending changes are saved to draft before creating the preset
    clearTimeout(autoSaveTimer.value)
    if (isDirty.value) await saveDraft()

    await websiteService.saveThemePreset(name)
    await loadPresets()
    toast.success(t('website.presets.saved'))
    showPresetModal.value = false
    // Don't change tabs - stay on current tab
  } catch (e) {
    toast.error(t('website.presets.saveError'))
  }
}

const applyPreset = id => {
  pendingApplyPresetId.value = id
  showApplyPresetConfirm.value = true
}

const confirmApplyPreset = async () => {
  const id = pendingApplyPresetId.value
  if (!id) return
  deleteLoading.value = true
  try {
    await websiteService.applyThemePreset(id)
    appliedPresetId.value = id

    // Update local presets & pages from the newly applied preset immediately,
    // BEFORE refreshing the storefront (which triggers the watcher).
    await loadPresets()

    toast.success(t('website.presets.applied'))

    // Refresh storefront data; the watcher will call loadPages -> selectPage
    // which populates form from the correct preset page customization.
    const currentTab = activeTab.value
    emit('refresh')
    // Restore tab after refresh (emit may re-render)
    await nextTick()
    activeTab.value = currentTab
  } catch (e) {
    toast.error(t('website.presets.applyError'))
  } finally {
    deleteLoading.value = false
    showApplyPresetConfirm.value = false
    pendingApplyPresetId.value = null
  }
}

const deletePreset = id => {
  pendingDeletePresetId.value = id
  showDeletePresetConfirm.value = true
}

const confirmDeletePreset = async () => {
  const id = pendingDeletePresetId.value
  if (!id) return
  deleteLoading.value = true
  try {
    await websiteService.deleteThemePreset(id)
    await loadPresets()
    toast.success(t('website.presets.deleted'))
    emit('refresh')
  } catch (e) {
    toast.error(t('website.presets.deleteError'))
  } finally {
    deleteLoading.value = false
    showDeletePresetConfirm.value = false
    pendingDeletePresetId.value = null
  }
}

const confirmSavePreset = name => {
  if (name) savePreset(name)
}

// ==================== PREVIEW & PUBLISH ====================

const normalizePath = raw => {
  if (!raw) return '/'
  const s = String(raw).split('?')[0].split('#')[0].trim()
  if (!s) return '/'
  const withSlash = s.startsWith('/') ? s : `/${s}`
  const collapsed = withSlash.replace(/\/{2,}/g, '/')
  const noTrailing = collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : collapsed
  return noTrailing || '/'
}

const buildDraftLiveUrl = (domain, pageUrl = '/') => {
  const path = normalizePath(pageUrl || '/')
  const suffix = path === '/' ? '' : path
  // Always use lowercase route; site3 middleware will also canonicalize, but this avoids redirects.
  return `https://${domain}/draftlive${suffix}`
}

const computePreviewUrl = () => {
  const domain = props.storefront?.settings?.b2cDomain
  if (!domain) return ''

  if (!useCustomTheme.value) {
    return buildDraftLiveUrl(domain, '/')
  }

  const page = pages.value.find(p => p.id === previewPageId.value) || selectedPage.value
  return buildDraftLiveUrl(domain, page?.url || '/')
}

const handlePreview = async () => {
  // Force-save any pending changes (clear auto-save timer and mark dirty to ensure save runs)
  clearTimeout(autoSaveTimer.value)
  isDirty.value = true
  await saveDraft()
  const domain = props.storefront?.settings?.b2cDomain
  if (!domain) return toast.error(t('siteSettings.setup.enterDomainFirst'))
  // Default preview page selection to the currently edited page (or active page).
  if (useCustomTheme.value) {
    previewPageId.value =
      selectedPageId.value || pages.value.find(p => p.isActive)?.id || pages.value[0]?.id || null
  } else {
    previewPageId.value = null
  }

  previewUrl.value = computePreviewUrl()
  showPreview.value = true
}

watch(
  () => [showPreview.value, previewPageId.value],
  () => {
    if (!showPreview.value) return
    previewUrl.value = computePreviewUrl()
  }
)

const handlePublish = async () => {
  clearTimeout(autoSaveTimer.value)
  if (isDirty.value) await saveDraft()
  emit('publish')
}

// ==================== HELPERS ====================

const buildActiveSections = src => {
  if (src?.activeSections?.length) {
    return src.activeSections.map((s, i) => ({
      id: s.id || s.instanceId || `s-${i}`,
      type: s.type || s.sectionType,
      instanceId: s.instanceId || s.id || `s-${i}`,
      expanded: false
    }))
  }
  // Detect from legacy fields
  const sections = []
  if (src?.hero?.photo?.link) sections.push({ id: 'hero', type: 'hero-1', expanded: false })
  if (src?.locationSection?.items?.length)
    sections.push({ id: 'dest', type: 'destinations', expanded: false })
  if (src?.campaignSection?.length)
    sections.push({ id: 'camp', type: 'campaigns', expanded: false })
  if (src?.hotels?.ids?.length) sections.push({ id: 'hotels', type: 'hotels', expanded: false })
  if (src?.tours?.ids?.length)
    sections.push({ id: 'tours', type: 'tours-carousel', expanded: false })
  return sections
}

// ==================== WATCHERS ====================

watch(
  () => props.storefront,
  async sf => {
    if (!sf) return
    suppressAutoSave.value = true
    clearTimeout(autoSaveTimer.value)

    // Only set header/footer from root storefront - sections come from the active page customization.
    form.value = {
      header: { headerType: sf.header?.headerType || 'default', tabs: sf.header?.tabs || [] },
      footer: { items: sf.footer?.items || [] },
      hero: sf.hero || {},
      locationSection: sf.locationSection || {},
      campaignSection: sf.campaignSection || [],
      hotels: sf.hotels || {},
      tours: sf.tours || {},
      activities: sf.activities || {},
      flights: sf.flights || {},
      cruiseDeals: sf.cruiseDeals || {},
      transfers: sf.transfers || {},
      bedbank: sf.bedbank || {},
      bedbankDestinations: sf.bedbankDestinations || { title: [], description: [], items: [] },
      bedbankShowcase: sf.bedbankShowcase || { title: [], description: [], ids: [] },
      bedbankSections: sf.bedbankSections || {},
      utilitySections: sf.utilitySections || {},
      activeSections: buildActiveSections(sf)
    }

    useCustomTheme.value = Boolean(sf.useCustomTheme)
    // Load active preset ID from customTheme
    appliedPresetId.value = sf.customTheme?.activePresetId || null
    isDirty.value = false

    // Load pages BEFORE releasing auto-save so selectPage can populate form
    // from the active page customization (overriding the root-level defaults above).
    await loadPages()
    await loadPresets()

    await nextTick()
    suppressAutoSave.value = false
  },
  { immediate: true }
)

watch(() => form.value, triggerAutoSave, { deep: true })
watch(
  () => activeTab.value,
  async tab => {
    if (tab === 'sections' && selectedPage.value) await selectPage(selectedPage.value)
  }
)

// Auto-create Home page when useCustomTheme is enabled and no pages exist
watch(
  () => useCustomTheme.value,
  async enabled => {
    if (enabled && pages.value.length === 0) {
      await createPage({ name: 'Home', url: '/', isActive: true })
      return
    }
    // Persist toggle even if no form fields changed
    try {
      await websiteService.saveDraft({ useCustomTheme: enabled })
    } catch {}
  }
)
</script>
