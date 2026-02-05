<template>
  <div class="h-full overflow-y-auto pr-2 space-y-6">
    <!-- Header Type Selection -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700"
    >
      <h4 class="text-sm font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-purple-500">palette</span>
        {{ $t('website.header.types.title') || 'Header Style' }}
      </h4>
      <div class="grid grid-cols-2 gap-4">
        <label
          v-for="type in headerTypes"
          :key="type.id"
          class="relative flex items-center p-4 rounded-lg cursor-pointer border-2 transition-all duration-200"
          :class="
            header.headerType === type.id
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-sm'
              : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
          "
        >
          <input v-model="header.headerType" type="radio" :value="type.id" class="sr-only" />
          <span
            class="material-icons text-2xl mr-3 transition-colors"
            :class="header.headerType === type.id ? 'text-purple-600' : 'text-gray-400'"
            >{{ type.icon }}</span
          >
          <div>
            <span
              class="font-medium"
              :class="
                header.headerType === type.id
                  ? 'text-purple-700 dark:text-purple-300'
                  : 'text-gray-700 dark:text-slate-300'
              "
            >
              {{ type.name }}
            </span>
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{{ type.description }}</p>
          </div>
          <span
            v-if="header.headerType === type.id"
            class="absolute top-2 right-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center"
          >
            <span class="material-icons text-white text-xs">check</span>
          </span>
        </label>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700"
    >
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-500">menu</span>
          {{ $t('website.header.navigationTabs') }}
        </h4>
        <button class="btn-secondary text-sm" @click="addHeaderTab">
          <span class="material-icons text-sm mr-1">add</span>
          {{ $t('website.header.addTab') }}
        </button>
      </div>

      <!-- Tab Cards Grid (Draggable) -->
      <draggable
        v-model="header.tabs"
        item-key="id"
        ghost-class="opacity-50"
        animation="200"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
      >
        <template #item="{ element, index }">
          <div
            class="relative group cursor-pointer"
            @click="toggleTabExpanded(index)"
          >
            <!-- Card -->
            <div
              class="aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              :class="
                selectedTabIndex === index
                  ? 'border-purple-500 ring-2 ring-purple-300 dark:ring-purple-700'
                  : 'border-gray-200 dark:border-slate-600 hover:border-purple-400'
              "
            >
              <!-- Background Image or Gradient -->
              <div class="absolute inset-0">
                <img
                  v-if="element.photo?.link"
                  :src="getImageUrl(element.photo.link)"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center"
                >
                  <span class="material-icons text-3xl text-gray-300 dark:text-slate-600">menu</span>
                </div>
              </div>

              <!-- Overlay with Content -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2.5">
                <!-- Tab Title -->
                <h5 class="text-white font-medium text-xs truncate">
                  {{ getLocalizedTitle(element.title) || $t('website.header.untitledTab') }}
                </h5>
                <!-- Tab Link -->
                <p class="text-white/70 text-[10px] truncate mt-0.5 flex items-center gap-0.5">
                  <span class="material-icons text-[8px]">link</span>
                  {{ element.link || $t('website.header.noLink') }}
                </p>
              </div>

              <!-- Selected Indicator -->
              <div
                v-if="selectedTabIndex === index"
                class="absolute top-1.5 left-1.5 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center shadow-md"
              >
                <span class="material-icons text-white text-xs">check</span>
              </div>

              <!-- Delete Button -->
              <button
                class="absolute top-1.5 right-1.5 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                @click.stop="removeHeaderTab(index)"
              >
                <span class="material-icons text-xs">close</span>
              </button>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Empty State -->
      <div v-if="!header.tabs?.length" class="text-center py-10 text-gray-400 dark:text-slate-500">
        <div class="w-14 h-14 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
          <span class="material-icons text-2xl">menu</span>
        </div>
        <p class="text-sm font-medium">{{ $t('website.header.noTabs') || 'No navigation tabs yet' }}</p>
        <p class="text-xs mt-1">{{ $t('website.header.addTabHelp') }}</p>
      </div>

      <!-- Inline Tab Editor (expands below when a tab is selected) -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 max-h-0"
        enter-to-class="opacity-100 max-h-[2000px]"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 max-h-[2000px]"
        leave-to-class="opacity-0 max-h-0"
      >
        <div
          v-if="selectedTabIndex !== null && selectedTab"
          class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <!-- Tab Editor Content -->
          <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
            <!-- Header with close button -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-600 flex-shrink-0"
                >
                  <img
                    v-if="selectedTab.photo?.link"
                    :src="getImageUrl(selectedTab.photo.link)"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <span class="material-icons text-gray-400">menu</span>
                  </div>
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-gray-800 dark:text-white">
                    {{ $t('website.header.editTab') }}
                  </h4>
                  <p class="text-xs text-gray-500 dark:text-slate-400">
                    {{ getLocalizedTitle(selectedTab.title) || $t('website.header.untitledTab') }}
                  </p>
                </div>
              </div>
              <button
                class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                @click="closeTabEditor"
              >
                <span class="material-icons text-sm">close</span>
              </button>
            </div>

            <!-- Basic Info Grid -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
              <!-- Photo Upload -->
              <div
                class="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-600 relative group cursor-pointer border-2 border-dashed border-gray-300 dark:border-slate-500 hover:border-purple-400 transition-colors"
                @click="triggerTabPhotoUpload(selectedTabIndex)"
              >
                <img
                  v-if="selectedTab.photo?.link"
                  :src="getImageUrl(selectedTab.photo.link)"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-400">
                  <span class="material-icons text-2xl mb-1">add_photo_alternate</span>
                  <span class="text-[10px]">{{ $t('website.header.uploadPhoto') }}</span>
                </div>
                <div
                  class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span class="material-icons text-white text-xl">photo_camera</span>
                </div>
                <input
                  :ref="el => (tabPhotoInputs[selectedTabIndex] = el)"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleTabPhotoUpload($event, selectedTabIndex)"
                />
              </div>

              <!-- Title & Link -->
              <div class="md:col-span-3 space-y-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                    {{ $t('website.header.tabTitle') }}
                  </label>
                  <LanguageInput
                    v-model="selectedTab.title"
                    size="sm"
                    :placeholder="$t('website.header.tabTitle')"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                    {{ $t('website.header.tabLink') }}
                  </label>
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-gray-400 text-sm">link</span>
                    <input
                      v-model="selectedTab.link"
                      type="text"
                      class="form-input text-sm flex-1"
                      :placeholder="$t('website.header.tabLinkPlaceholder')"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Menu Items Section -->
            <div class="border-t border-gray-200 dark:border-slate-600 pt-4">
              <div class="flex items-center justify-between mb-3">
                <h5 class="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                  <span class="material-icons text-purple-500 text-sm">list</span>
                  {{ $t('website.header.menuItems') }}
                  <span class="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-400 text-[10px] rounded-full">
                    {{ selectedTab.items?.length || 0 }}
                  </span>
                </h5>
                <button
                  class="text-xs text-purple-600 hover:text-purple-700 flex items-center font-medium"
                  @click="addTabItem(selectedTabIndex)"
                >
                  <span class="material-icons text-xs mr-0.5">add</span>
                  {{ $t('website.header.addItem') }}
                </button>
              </div>

              <TransitionGroup name="list" tag="div" class="space-y-2">
                <div
                  v-for="(item, itemIndex) in selectedTab.items"
                  :key="`item-${selectedTabIndex}-${itemIndex}`"
                  class="bg-white dark:bg-slate-600 rounded-lg p-3 border border-gray-200 dark:border-slate-500"
                >
                  <div class="flex items-start gap-2">
                    <div class="flex-1 space-y-2">
                      <LanguageInput
                        v-model="item.title"
                        size="sm"
                        :placeholder="$t('website.header.itemTitle')"
                      />
                      <div class="flex items-center gap-2">
                        <span class="material-icons text-gray-400 text-xs">link</span>
                        <input
                          v-model="item.link"
                          type="text"
                          class="form-input text-xs flex-1"
                          :placeholder="$t('website.header.itemLink')"
                        />
                      </div>
                    </div>
                    <div class="flex items-center gap-0.5">
                      <button
                        class="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                        @click="addSubItem(selectedTabIndex, itemIndex)"
                        :title="$t('website.header.addSubItem')"
                      >
                        <span class="material-icons text-sm">add</span>
                      </button>
                      <button
                        class="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        @click="removeTabItem(selectedTabIndex, itemIndex)"
                      >
                        <span class="material-icons text-sm">delete</span>
                      </button>
                    </div>
                  </div>

                  <!-- SubItems -->
                  <TransitionGroup
                    v-if="item.subItems?.length"
                    name="list"
                    tag="div"
                    class="pl-3 mt-2 space-y-1.5 border-l-2 border-purple-200 dark:border-purple-700"
                  >
                    <div
                      v-for="(subItem, subIndex) in item.subItems"
                      :key="`sub-${selectedTabIndex}-${itemIndex}-${subIndex}`"
                      class="flex items-start gap-2 bg-gray-50 dark:bg-slate-700 rounded-lg p-2"
                    >
                      <div class="flex-1 space-y-1.5">
                        <LanguageInput
                          v-model="subItem.title"
                          size="sm"
                          :placeholder="$t('website.header.subItemTitle')"
                        />
                        <div class="flex items-center gap-2">
                          <span class="material-icons text-gray-400 text-[10px]">link</span>
                          <input
                            v-model="subItem.link"
                            type="text"
                            class="form-input text-xs flex-1"
                            :placeholder="$t('website.header.subItemLink')"
                          />
                        </div>
                      </div>
                      <button
                        class="p-0.5 text-gray-400 hover:text-red-600 transition-colors"
                        @click="removeSubItem(selectedTabIndex, itemIndex, subIndex)"
                      >
                        <span class="material-icons text-xs">close</span>
                      </button>
                    </div>
                  </TransitionGroup>
                </div>
              </TransitionGroup>

              <div
                v-if="!selectedTab.items?.length"
                class="text-center py-6 text-gray-400 dark:text-slate-500"
              >
                <span class="material-icons text-2xl mb-1">list</span>
                <p class="text-xs">{{ $t('website.header.noItems') }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'
import websiteService from '@/services/websiteService'
import LanguageInput from '@/components/common/LanguageInput.vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  saving: { type: Boolean, default: false },
  getImageUrl: { type: Function, required: true }
})

const emit = defineEmits(['update:modelValue'])

const { t, locale } = useI18n()

// We intentionally mutate the passed object to keep behavior identical
// to the previous inlined implementation (parent uses a deep watch for autosave).
const header = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const tabPhotoInputs = ref({})
const selectedTabIndex = ref(null)

// Get the currently selected tab
const selectedTab = computed(() => {
  if (selectedTabIndex.value === null) return null
  return header.value.tabs?.[selectedTabIndex.value]
})

// Helper to get localized title from multilang array
const getLocalizedTitle = titleArray => {
  if (!titleArray || !Array.isArray(titleArray)) return ''
  const currentLang = locale.value || 'en'
  const found = titleArray.find(t => t.lang === currentLang)
  if (found?.value) return found.value
  // Fallback to first non-empty value
  const fallback = titleArray.find(t => t.value)
  return fallback?.value || ''
}

// Toggle tab expanded (click to select/deselect)
const toggleTabExpanded = index => {
  if (selectedTabIndex.value === index) {
    selectedTabIndex.value = null
  } else {
    selectedTabIndex.value = index
  }
}

// Close tab editor
const closeTabEditor = () => {
  selectedTabIndex.value = null
}

const headerTypes = computed(() => [
  {
    id: 'default',
    name: t('website.header.types.default'),
    description: t('website.header.types.defaultDesc'),
    icon: 'web_asset'
  },
  {
    id: 'white',
    name: t('website.header.types.white'),
    description: t('website.header.types.whiteDesc'),
    icon: 'light_mode'
  }
])

const ensureHeader = () => {
  if (!header.value.tabs) header.value.tabs = []
  if (!header.value.headerType) header.value.headerType = 'default'
}

const addHeaderTab = () => {
  ensureHeader()
  header.value.tabs.push({
    id: `tab-${Date.now()}`,
    title: [
      { lang: 'en', value: '' },
      { lang: 'tr', value: '' }
    ],
    link: '',
    photo: {},
    items: [],
    expanded: false
  })
  // Auto-select the new tab
  selectedTabIndex.value = header.value.tabs.length - 1
}

const removeHeaderTab = index => {
  header.value.tabs.splice(index, 1)
  // Close editor if the deleted tab was being edited
  if (selectedTabIndex.value === index) {
    selectedTabIndex.value = null
  } else if (selectedTabIndex.value !== null && selectedTabIndex.value > index) {
    // Adjust index if a tab before the selected one was deleted
    selectedTabIndex.value--
  }
}

const triggerTabPhotoUpload = index => {
  tabPhotoInputs.value[index]?.click()
}

const handleTabPhotoUpload = async (event, index) => {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    // Keep legacy uploadType; API normalizes it.
    const response = await websiteService.uploadSectionImage(file, 'header-tab', index)
    if (response?.success) {
      header.value.tabs[index].photo = response.data
    }
  } catch (error) {
    console.error('Header tab photo upload failed:', error)
  }
  event.target.value = ''
}

const addTabItem = tabIndex => {
  const tab = header.value.tabs[tabIndex]
  if (!tab.items) tab.items = []
  tab.items.push({
    title: [
      { lang: 'en', value: '' },
      { lang: 'tr', value: '' }
    ],
    link: '',
    subItems: []
  })
}

const removeTabItem = (tabIndex, itemIndex) => {
  header.value.tabs[tabIndex].items.splice(itemIndex, 1)
}

const addSubItem = (tabIndex, itemIndex) => {
  const item = header.value.tabs[tabIndex].items[itemIndex]
  if (!item.subItems) item.subItems = []
  item.subItems.push({
    title: [
      { lang: 'en', value: '' },
      { lang: 'tr', value: '' }
    ],
    link: ''
  })
}

const removeSubItem = (tabIndex, itemIndex, subIndex) => {
  header.value.tabs[tabIndex].items[itemIndex].subItems.splice(subIndex, 1)
}
</script>
