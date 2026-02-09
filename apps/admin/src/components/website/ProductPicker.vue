<template>
  <div class="space-y-3">
    <!-- Search Input -->
    <div ref="containerRef" class="relative">
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        :placeholder="placeholder"
        class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-10"
        @input="handleSearch"
        @focus="openDropdown"
      />
      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <span v-if="loading" class="material-icons animate-spin text-sm">refresh</span>
        <span v-else class="material-icons text-sm">{{ icon }}</span>
      </span>

      <!-- Suggestions Dropdown -->
      <Teleport to="body">
        <div
          v-if="showSuggestions && filteredSuggestions.length > 0"
          ref="dropdownRef"
          :style="dropdownStyle"
          class="fixed z-[9999] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          <button
            v-for="item in filteredSuggestions"
            :key="item._id"
            class="w-full px-3 py-2.5 text-left hover:bg-purple-50 dark:hover:bg-slate-700 text-sm flex items-center gap-3 transition-colors"
            @click="selectItem(item)"
          >
            <!-- Thumbnail -->
            <div
              class="w-8 h-8 rounded-md bg-gray-100 dark:bg-slate-600 flex-shrink-0 overflow-hidden flex items-center justify-center"
            >
              <img
                v-if="getItemImage(item)"
                :src="getItemImage(item)"
                :alt="getItemName(item)"
                class="w-full h-full object-cover"
              />
              <span v-else class="material-icons text-gray-400 text-sm">{{ icon }}</span>
            </div>
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="text-gray-900 dark:text-white font-medium truncate">
                {{ getItemName(item) }}
              </div>
              <div class="text-xs text-gray-400 dark:text-slate-500 truncate">
                {{ getItemSubtitle(item) }}
              </div>
            </div>
            <!-- Already added badge -->
            <span
              v-if="isAlreadySelected(item._id)"
              class="text-xs text-green-600 dark:text-green-400 flex-shrink-0"
            >
              <span class="material-icons text-xs">check_circle</span>
            </span>
          </button>
        </div>
      </Teleport>
    </div>

    <!-- Selected Items List -->
    <TransitionGroup v-if="modelValue.length > 0" name="product-list" tag="div" class="space-y-1.5">
      <div
        v-for="(item, index) in modelValue"
        :key="item.id || item._id"
        class="flex items-center gap-2.5 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg group hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors"
      >
        <span class="text-xs text-gray-400 dark:text-slate-500 w-5 text-center font-mono">
          {{ index + 1 }}
        </span>
        <span class="material-icons text-purple-500 text-sm">{{ icon }}</span>
        <span class="flex-1 text-sm font-medium text-gray-700 dark:text-slate-200 truncate">
          {{ item.name || item.title || `ID: ${item.id || item._id}` }}
        </span>
        <span
          v-if="item.location"
          class="text-xs text-gray-400 dark:text-slate-500 hidden sm:inline"
        >
          {{ item.location }}
        </span>
        <button
          class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          :title="$t('common.delete')"
          @click="removeItem(index)"
        >
          <span class="material-icons text-sm">close</span>
        </button>
      </div>
    </TransitionGroup>

    <!-- Empty state -->
    <div
      v-else
      class="text-center py-6 text-gray-400 dark:text-slate-500 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg"
    >
      <span class="material-icons text-3xl mb-1">{{ icon }}</span>
      <p class="text-sm">{{ emptyText }}</p>
    </div>

    <!-- Legacy ID toggle (deprecated, hidden by default) -->
    <div class="flex items-center gap-2">
      <button
        class="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1"
        @click="showLegacyInput = !showLegacyInput"
      >
        <span class="material-icons text-xs">{{ showLegacyInput ? 'expand_less' : 'code' }}</span>
        {{ $t('website.themeEditor.productPicker.manualIdEntry') }}
      </button>
    </div>
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="showLegacyInput"
        class="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/30"
      >
        <span class="material-icons text-amber-500 text-sm">warning</span>
        <input
          v-model="legacyId"
          type="text"
          class="form-input text-sm flex-1"
          :placeholder="$t('website.themeEditor.productPicker.enterNumericId')"
          @keydown.enter.prevent="addLegacyId"
        />
        <button class="btn-outline text-sm" @click="addLegacyId">
          <span class="material-icons text-sm">add</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getImageUrl as getCdnImageUrl } from '@/utils/imageUrl'

const { t } = useI18n()

const props = defineProps({
  /** Array of selected items: [{ id, _id, name, location? }] */
  modelValue: {
    type: Array,
    default: () => []
  },
  /** 'hotel' | 'tour' - determines search source and display */
  productType: {
    type: String,
    required: true,
    validator: v => ['hotel', 'tour'].includes(v)
  },
  /** Service function: (params) => Promise<{ data: { items } }> */
  fetchFn: {
    type: Function,
    required: true
  },
  placeholder: {
    type: String,
    default: ''
  },
  emptyText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const inputRef = ref(null)
const dropdownRef = ref(null)
const query = ref('')
const suggestions = ref([])
const loading = ref(false)
const showSuggestions = ref(false)
const showLegacyInput = ref(false)
const legacyId = ref('')
const dropdownPosition = ref({ top: 0, left: 0, width: 0 })

const icon = computed(() => (props.productType === 'hotel' ? 'hotel' : 'tour'))

const dropdownStyle = computed(() => ({
  top: `${dropdownPosition.value.top}px`,
  left: `${dropdownPosition.value.left}px`,
  width: `${dropdownPosition.value.width}px`
}))

/** Filter out already-selected items, but still show them with a check mark */
const filteredSuggestions = computed(() => suggestions.value)

const isAlreadySelected = id => {
  return props.modelValue.some(item => String(item.id || item._id) === String(id))
}

// ==================== ITEM HELPERS ====================

const getItemName = item => {
  if (props.productType === 'hotel') {
    // Hotel names are multi-lang objects: { tr, en, ... }
    const name = item.name
    if (typeof name === 'object' && name !== null) {
      return name.tr || name.en || Object.values(name).find(v => v) || '-'
    }
    return name || '-'
  }
  // Tour names are also multi-lang
  const name = item.name
  if (typeof name === 'object' && name !== null) {
    return name.tr || name.en || Object.values(name).find(v => v) || '-'
  }
  return name || '-'
}

const getItemSubtitle = item => {
  if (props.productType === 'hotel') {
    const parts = []
    if (item.location?.city) parts.push(item.location.city)
    if (item.location?.country) parts.push(item.location.country)
    if (item.starRating) parts.push(`${'★'.repeat(item.starRating)}`)
    return parts.join(' · ') || ''
  }
  // Tour
  const parts = []
  if (item.tourType) parts.push(t(`tour.tourTypes.${item.tourType}`, item.tourType))
  const dest = item.destination
  if (dest && typeof dest === 'object') {
    if (dest.tr) parts.push(dest.tr)
  } else if (dest) {
    parts.push(dest)
  }
  return parts.join(' · ') || ''
}

const getItemImage = item => {
  if (props.productType === 'hotel') {
    const img = item.images?.[0]
    if (img?.url) return getCdnImageUrl(img.url)
    return null
  }
  const img = item.gallery?.[0]
  if (img?.url) return getCdnImageUrl(img.url)
  return null
}

// ==================== SEARCH ====================

const updateDropdownPosition = () => {
  if (!inputRef.value) return
  const rect = inputRef.value.getBoundingClientRect()
  dropdownPosition.value = {
    top: rect.bottom + 4,
    left: rect.left,
    width: rect.width
  }
}

const openDropdown = () => {
  showSuggestions.value = true
  nextTick(updateDropdownPosition)
}

let searchTimeout = null
const handleSearch = () => {
  clearTimeout(searchTimeout)
  if (query.value.length < 2) {
    suggestions.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    loading.value = true
    try {
      const result = await props.fetchFn({ search: query.value, limit: 15, status: 'active' })
      suggestions.value = result?.data?.items || result?.data || []
      nextTick(updateDropdownPosition)
    } catch (err) {
      console.error(`ProductPicker: ${props.productType} search error`, err)
      suggestions.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

// ==================== SELECTION ====================

const selectItem = item => {
  if (isAlreadySelected(item._id)) return

  const entry = {
    id: item._id,
    _id: item._id,
    name: getItemName(item),
    location: getItemSubtitle(item)
  }

  emit('update:modelValue', [...props.modelValue, entry])
  query.value = ''
  suggestions.value = []
  showSuggestions.value = false
}

const removeItem = index => {
  const updated = [...props.modelValue]
  updated.splice(index, 1)
  emit('update:modelValue', updated)
}

// ==================== LEGACY ID ====================

const addLegacyId = () => {
  const raw = legacyId.value.trim()
  if (!raw) return

  // Support numeric IDs (backward compat)
  const id = raw
  if (isAlreadySelected(id)) {
    legacyId.value = ''
    return
  }

  const entry = { id, _id: id, name: `#${id}` }
  emit('update:modelValue', [...props.modelValue, entry])
  legacyId.value = ''
}

// ==================== CLICK OUTSIDE ====================

const handleClickOutside = event => {
  const isInside =
    containerRef.value?.contains(event.target) || dropdownRef.value?.contains(event.target)
  if (!isInside) {
    showSuggestions.value = false
  }
}

const handleScrollResize = () => {
  if (showSuggestions.value) updateDropdownPosition()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScrollResize, true)
  window.addEventListener('resize', handleScrollResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScrollResize, true)
  window.removeEventListener('resize', handleScrollResize)
})
</script>

<style scoped>
.product-list-enter-active {
  transition: all 0.2s ease-out;
}
.product-list-leave-active {
  transition: all 0.15s ease-in;
}
.product-list-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}
.product-list-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
.product-list-move {
  transition: transform 0.2s ease;
}
</style>
