<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700"
  >
    <div class="flex items-center justify-between gap-4 mb-3">
      <div class="flex items-center gap-3">
        <span class="material-icons text-purple-500">auto_stories</span>
        <h4 class="text-sm font-semibold text-gray-800 dark:text-white">
          {{ $t('website.multiPage.title') || 'Custom Homepage Pages' }}
        </h4>
      </div>
      <label class="flex items-center gap-2 select-none">
        <input
          type="checkbox"
          :checked="useCustomTheme"
          @change="$emit('update:useCustomTheme', $event.target.checked)"
          class="form-checkbox h-4 w-4 text-purple-600 rounded"
        />
        <span class="text-sm text-gray-700 dark:text-slate-300">{{
          $t('website.customHomepages.enable') || 'Enable Custom Theme'
        }}</span>
      </label>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2">
      <!-- Page Cards -->
      <div
        v-for="page in pages"
        :key="page.id"
        class="flex-shrink-0 w-44 p-2.5 rounded-lg border-2 cursor-pointer transition-all group relative"
        :class="
          selectedId === page.id
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-200 hover:border-purple-300'
        "
        @click="$emit('update:selectedId', page.id)"
      >
        <div class="flex items-center justify-between mb-1.5">
          <span
            :class="page.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
            class="text-xs px-1.5 py-0.5 rounded-full"
          >
            {{ page.isActive ? $t('common.active') : $t('common.draft') }}
          </span>
          <div class="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              v-if="!page.isActive"
              class="p-0.5 text-green-600 hover:bg-green-50 rounded"
              @click.stop="$emit('activate', page.id)"
            >
              <span class="material-icons text-sm">check_circle</span>
            </button>
            <button
              class="p-0.5 text-red-500 hover:bg-red-50 rounded"
              @click.stop="$emit('delete', page.id)"
            >
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>
        <div class="text-sm font-medium text-gray-800 dark:text-white truncate">
          {{ page.name || 'Unnamed' }}
        </div>
        <div class="text-xs text-gray-500 truncate flex items-center gap-1">
          <span class="material-icons text-xs">link</span>{{ page.url || '/' }}
        </div>
      </div>

      <!-- New Page Form -->
      <div
        v-if="showForm"
        class="flex-shrink-0 w-56 p-2.5 rounded-lg border-2 border-purple-400 bg-purple-50 dark:bg-purple-900/20"
      >
        <input
          v-model="newPage.name"
          type="text"
          class="form-input w-full text-sm py-1 mb-2"
          placeholder="Page name"
          @keyup.enter="savePage"
          @keyup.esc="showForm = false"
          ref="nameInput"
        />
        <div class="flex items-center gap-1 mb-2">
          <span class="text-gray-500 text-xs">/</span>
          <input
            v-model="newPage.url"
            type="text"
            class="form-input w-full text-sm py-1"
            placeholder="url path"
            @keyup.enter="savePage"
            @keyup.esc="showForm = false"
          />
        </div>
        <div class="flex justify-end gap-1">
          <button class="p-1 text-gray-500 hover:text-gray-700 rounded" @click="showForm = false">
            <span class="material-icons text-sm">close</span>
          </button>
          <button class="p-1 text-purple-600 hover:text-purple-700 rounded" @click="savePage">
            <span class="material-icons text-sm">check</span>
          </button>
        </div>
      </div>

      <!-- Add Button -->
      <div
        v-else
        class="flex-shrink-0 w-44 p-2.5 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all flex flex-col items-center justify-center text-gray-400 min-h-[80px]"
        @click="startNewPage"
      >
        <span class="material-icons text-xl mb-0.5">add_circle_outline</span>
        <span class="text-xs">{{ $t('website.multiPage.addPage') || 'Add Page' }}</span>
      </div>
    </div>

    <!-- Presets Dropdown -->
    <div
      v-if="selectedPage"
      class="mt-2 pt-2 border-t border-gray-200 dark:border-slate-600 flex items-center justify-between"
    >
      <div class="flex items-center gap-2 text-sm">
        <span class="material-icons text-purple-500 text-sm">edit</span>
        <span class="text-gray-500">{{ $t('website.multiPage.editing') || 'Editing' }}:</span>
        <span class="font-medium text-gray-800 dark:text-white">{{
          selectedPage.name || 'Homepage'
        }}</span>
        <span class="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{{
          selectedPage.url || '/'
        }}</span>
      </div>
      <div class="relative">
        <button
          class="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-purple-50"
          @click="showPresets = !showPresets"
        >
          <span class="material-icons text-sm">bookmark</span
          >{{ $t('website.presets.title') || 'Presets' }}
          <span class="material-icons text-sm">{{
            showPresets ? 'expand_less' : 'expand_more'
          }}</span>
        </button>
        <div
          v-if="showPresets"
          class="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-50"
        >
          <div class="p-2 border-b border-gray-200 dark:border-slate-700">
            <button
              class="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded flex items-center gap-2"
              @click="openSavePresetModal"
            >
              <span class="material-icons text-sm">add</span
              >{{ $t('website.presets.saveCurrent') || 'Save Current as Preset' }}
            </button>
          </div>
          <div class="max-h-48 overflow-y-auto p-1">
            <div
              v-for="preset in presets"
              :key="preset.id"
              class="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded group"
              :class="
                appliedPresetId === preset.id
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-l-2 border-purple-500'
                  : ''
              "
            >
              <button
                class="flex-1 text-left text-sm truncate flex items-center gap-2"
                :class="
                  appliedPresetId === preset.id
                    ? 'text-purple-700 dark:text-purple-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300'
                "
                @click="$emit('apply-preset', preset.id)"
              >
                {{ preset.name }}
                <span
                  v-if="appliedPresetId === preset.id"
                  class="text-xs bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded"
                >
                  {{ $t('common.active') || 'Active' }}
                </span>
              </button>
              <button
                class="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop="$emit('delete-preset', preset.id)"
              >
                <span class="material-icons text-sm">delete</span>
              </button>
            </div>
            <div v-if="!presets.length" class="px-3 py-4 text-center text-sm text-gray-400">
              {{ $t('website.presets.noPresets') || 'No saved presets' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  pages: Array,
  selectedId: String,
  useCustomTheme: Boolean,
  presets: Array,
  appliedPresetId: String
})

const emit = defineEmits([
  'update:pages',
  'update:selectedId',
  'update:useCustomTheme',
  'create',
  'delete',
  'activate',
  'save-preset',
  'apply-preset',
  'delete-preset',
  'open-preset-modal'
])

const showForm = ref(false)
const showPresets = ref(false)
const newPage = ref({ name: '', url: '' })
const nameInput = ref(null)

const selectedPage = computed(() => props.pages?.find(p => p.id === props.selectedId))

const startNewPage = () => {
  newPage.value = { name: '', url: '' }
  showForm.value = true
  nextTick(() => nameInput.value?.focus())
}

const savePage = () => {
  const url = newPage.value.url ? `/${newPage.value.url.replace(/^\//, '')}` : '/'
  emit('create', {
    name: newPage.value.name || (url === '/' ? 'Homepage' : url.slice(1)),
    url,
    isActive: true
  })
  showForm.value = false
}

const openSavePresetModal = () => {
  showPresets.value = false
  emit('open-preset-modal')
}
</script>
