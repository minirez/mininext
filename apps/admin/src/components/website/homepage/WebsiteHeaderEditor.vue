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

      <draggable
        v-model="header.tabs"
        item-key="id"
        handle=".drag-handle"
        ghost-class="opacity-50"
        animation="200"
        class="space-y-3"
      >
        <template #item="{ element, index }">
          <div
            class="bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden transition-all duration-200 hover:shadow-sm"
          >
            <!-- Tab Header -->
            <div class="flex items-center gap-3 p-3">
              <span
                class="drag-handle cursor-move text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span class="material-icons">drag_indicator</span>
              </span>

              <!-- Photo Upload for Tab -->
              <div
                class="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-600 flex-shrink-0 relative group cursor-pointer"
                @click="triggerTabPhotoUpload(index)"
              >
                <img
                  v-if="element.photo?.link"
                  :src="getImageUrl(element.photo.link)"
                  class="w-full h-full object-cover"
                />
                <div
                  class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span class="material-icons text-white text-sm">photo_camera</span>
                </div>
                <input
                  :ref="el => (tabPhotoInputs[index] = el)"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleTabPhotoUpload($event, index)"
                />
              </div>

              <div class="flex-1 space-y-2">
                <LanguageInput
                  v-model="element.title"
                  size="sm"
                  :placeholder="$t('website.header.tabTitle')"
                />
                <div class="flex items-center gap-2">
                  <span class="material-icons text-gray-400 text-sm">link</span>
                  <input
                    v-model="element.link"
                    type="text"
                    class="form-input text-sm flex-1"
                    :placeholder="$t('website.header.tabLink')"
                  />
                </div>
              </div>
              <button
                class="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                @click="toggleTabExpanded(index)"
              >
                <span
                  class="material-icons transition-transform duration-200"
                  :class="{ 'rotate-180': element.expanded }"
                >
                  expand_more
                </span>
              </button>
              <button
                class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                @click="removeHeaderTab(index)"
              >
                <span class="material-icons">delete</span>
              </button>
            </div>

            <!-- Tab Items (Expanded) -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-96"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 max-h-96"
              leave-to-class="opacity-0 max-h-0"
            >
              <div
                v-show="element.expanded"
                class="border-t border-gray-200 dark:border-slate-600 p-3 space-y-3 overflow-hidden"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-gray-500 dark:text-slate-400">
                    {{ $t('website.header.menuItems') }} ({{ element.items?.length || 0 }})
                  </span>
                  <button
                    class="text-xs text-purple-600 hover:text-purple-700 flex items-center"
                    @click="addTabItem(index)"
                  >
                    <span class="material-icons text-xs mr-0.5">add</span>
                    {{ $t('website.header.addItem') }}
                  </button>
                </div>

                <TransitionGroup name="list" tag="div" class="space-y-2">
                  <div
                    v-for="(item, itemIndex) in element.items"
                    :key="`item-${index}-${itemIndex}`"
                    class="bg-white dark:bg-slate-600 rounded-lg p-3 border border-gray-200 dark:border-slate-500"
                  >
                    <div class="flex items-center gap-2 mb-2">
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
                      <button
                        class="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                        @click="addSubItem(index, itemIndex)"
                        :title="$t('website.header.addSubItem')"
                      >
                        <span class="material-icons text-sm">add</span>
                      </button>
                      <button
                        class="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        @click="removeTabItem(index, itemIndex)"
                      >
                        <span class="material-icons text-sm">close</span>
                      </button>
                    </div>

                    <!-- SubItems -->
                    <TransitionGroup
                      v-if="item.subItems?.length"
                      name="list"
                      tag="div"
                      class="pl-4 mt-2 space-y-1 border-l-2 border-purple-200 dark:border-purple-800"
                    >
                      <div
                        v-for="(subItem, subIndex) in item.subItems"
                        :key="`sub-${index}-${itemIndex}-${subIndex}`"
                        class="flex items-center gap-2"
                      >
                        <div class="flex-1 space-y-2">
                          <LanguageInput
                            v-model="subItem.title"
                            size="sm"
                            :placeholder="$t('website.header.subItemTitle')"
                          />
                          <div class="flex items-center gap-2">
                            <span class="material-icons text-gray-400 text-xs">link</span>
                            <input
                              v-model="subItem.link"
                              type="text"
                              class="form-input text-xs flex-1"
                              :placeholder="$t('website.header.subItemLink')"
                            />
                          </div>
                        </div>
                        <button
                          class="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          @click="removeSubItem(index, itemIndex, subIndex)"
                        >
                          <span class="material-icons text-sm">close</span>
                        </button>
                      </div>
                    </TransitionGroup>
                  </div>
                </TransitionGroup>

                <div
                  v-if="!element.items?.length"
                  class="text-center py-4 text-gray-400 dark:text-slate-500 text-xs"
                >
                  {{ $t('website.header.noItems') }}
                </div>
              </div>
            </Transition>
          </div>
        </template>
      </draggable>

      <div v-if="!header.tabs?.length" class="text-center py-8 text-gray-400 dark:text-slate-500">
        <span class="material-icons text-3xl mb-2">menu</span>
        <p class="text-sm">{{ $t('website.header.noTabs') || 'No navigation tabs yet' }}</p>
      </div>
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

const { t } = useI18n()

// We intentionally mutate the passed object to keep behavior identical
// to the previous inlined implementation (parent uses a deep watch for autosave).
const header = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const tabPhotoInputs = ref({})

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
}

const removeHeaderTab = index => {
  header.value.tabs.splice(index, 1)
}

const toggleTabExpanded = index => {
  header.value.tabs[index].expanded = !header.value.tabs[index].expanded
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
