<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
      {{ label }}
    </label>

    <div class="relative">
      <!-- Selected Tags -->
      <div
        class="flex flex-wrap gap-2 p-2 min-h-[42px] border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 cursor-text"
        @click="focusInput"
      >
        <!-- Tag Chips -->
        <span
          v-for="tag in selectedTags"
          :key="tag._id"
          class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm text-white"
          :style="{ backgroundColor: tag.color || '#6366f1' }"
        >
          {{ getTagLabel(tag) }}
          <button
            type="button"
            @click.stop="removeTag(tag)"
            class="hover:bg-white/20 rounded-full p-0.5 transition-colors"
          >
            <span class="material-icons text-xs">close</span>
          </button>
        </span>

        <!-- Input for new tags -->
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          :placeholder="selectedTags.length === 0 ? placeholder : ''"
          @input="handleSearch"
          @keydown.enter.prevent="handleEnter"
          @keydown.backspace="handleBackspace"
          @focus="showDropdown = true"
          @blur="handleBlur"
          class="flex-1 min-w-[120px] border-0 bg-transparent p-1 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-0"
        />

        <!-- Loading indicator -->
        <span v-if="creating" class="flex items-center text-purple-600 dark:text-purple-400">
          <span class="material-icons text-sm animate-spin">sync</span>
        </span>
      </div>

      <!-- Dropdown -->
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="showDropdown && (filteredTags.length > 0 || searchQuery.length >= 2)"
          class="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          <!-- Existing tags -->
          <button
            v-for="tag in filteredTags"
            :key="tag._id"
            type="button"
            @mousedown.prevent="selectTag(tag)"
            class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <span
              class="w-3 h-3 rounded-full"
              :style="{ backgroundColor: tag.color || '#6366f1' }"
            ></span>
            {{ getTagLabel(tag) }}
          </button>

          <!-- Create new tag option -->
          <button
            v-if="searchQuery.length >= 2 && canCreateNew"
            type="button"
            @mousedown.prevent="createNewTag"
            class="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center gap-2 border-t border-gray-100 dark:border-slate-700"
          >
            <span class="material-icons text-sm">add</span>
            {{ $t('tags.createNew', { name: searchQuery }) }}
          </button>
        </div>
      </Transition>
    </div>

    <!-- Helper text -->
    <p v-if="help" class="mt-1 text-xs text-gray-500 dark:text-slate-400">{{ help }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { getTags, createTag } from '@/services/tagService'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  help: {
    type: String,
    default: ''
  },
  lang: {
    type: String,
    default: 'tr'
  },
  allowCreate: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const { t, locale } = useI18n()
const toast = useToast()

const inputRef = ref(null)
const searchQuery = ref('')
const showDropdown = ref(false)
const allTags = ref([])
const loading = ref(false)
const creating = ref(false)

// Selected tags (full objects)
const selectedTags = computed(() => {
  return props.modelValue.map(tagId => {
    const tag = allTags.value.find(t => t._id === tagId)
    return tag || { _id: tagId, name: { [props.lang]: tagId } }
  })
})

// Filter tags based on search and exclude already selected
const filteredTags = computed(() => {
  const selectedIds = props.modelValue
  let filtered = allTags.value.filter(tag => !selectedIds.includes(tag._id))

  if (searchQuery.value.length >= 2) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(tag => {
      const label = getTagLabel(tag).toLowerCase()
      return label.includes(query)
    })
  }

  return filtered.slice(0, 10)
})

// Check if can create new tag
const canCreateNew = computed(() => {
  if (!props.allowCreate) return false
  if (searchQuery.value.length < 2) return false

  // Check if exact match already exists
  const query = searchQuery.value.toLowerCase()
  const exactMatch = allTags.value.some(tag => {
    const label = getTagLabel(tag).toLowerCase()
    return label === query
  })

  return !exactMatch
})

// Get display label for a tag
const getTagLabel = (tag) => {
  if (!tag || !tag.name) return ''
  return tag.name[props.lang] || tag.name.tr || tag.name.en || Object.values(tag.name)[0] || ''
}

// Focus input
const focusInput = () => {
  inputRef.value?.focus()
}

// Handle search input
const handleSearch = () => {
  // Dropdown is already shown when focused
}

// Handle enter key
const handleEnter = () => {
  if (filteredTags.value.length > 0) {
    selectTag(filteredTags.value[0])
  } else if (canCreateNew.value) {
    createNewTag()
  }
}

// Handle backspace on empty input
const handleBackspace = () => {
  if (searchQuery.value === '' && props.modelValue.length > 0) {
    const newValue = [...props.modelValue]
    newValue.pop()
    emit('update:modelValue', newValue)
  }
}

// Handle blur
const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

// Select a tag
const selectTag = (tag) => {
  if (!props.modelValue.includes(tag._id)) {
    emit('update:modelValue', [...props.modelValue, tag._id])
  }
  searchQuery.value = ''
  inputRef.value?.focus()
}

// Remove a tag
const removeTag = (tag) => {
  const newValue = props.modelValue.filter(id => id !== tag._id)
  emit('update:modelValue', newValue)
}

// Create new tag with auto-translation
const createNewTag = async () => {
  if (creating.value) return

  creating.value = true

  try {
    const result = await createTag({
      name: { [props.lang]: searchQuery.value },
      sourceLang: props.lang
    })

    if (result.success) {
      // Add to local tags list
      allTags.value.push(result.data)
      // Select the new tag
      selectTag(result.data)
      toast.success(t('tags.created'))
    }
  } catch (error) {
    console.error('Failed to create tag:', error)
    toast.error(t('tags.createError'))
  } finally {
    creating.value = false
  }
}

// Load all tags
const loadTags = async () => {
  loading.value = true
  try {
    const result = await getTags()
    if (result.success) {
      allTags.value = result.data
    }
  } catch (error) {
    console.error('Failed to load tags:', error)
  } finally {
    loading.value = false
  }
}

// Load tags on mount
onMounted(() => {
  loadTags()
})
</script>
