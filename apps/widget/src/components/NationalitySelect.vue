<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useTranslation } from '../composables/useTranslation'
import { nationalities, codeToFlag } from '../data/nationalities'

const props = defineProps({
  modelValue: { type: String, default: '' },
  error: { type: String, default: '' },
  placeholder: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])
const { t, locale } = useTranslation()

const wrapperRef = ref(null)
const searchRef = ref(null)
const showDropdown = ref(false)
const searchQuery = ref('')

function getName(c) {
  const lang = locale.value
  return c[lang] || c.en || c.tr || c.code
}

const sortedList = computed(() => {
  return [...nationalities].sort((a, b) => getName(a).localeCompare(getName(b), locale.value))
})

const filtered = computed(() => {
  if (!searchQuery.value) return sortedList.value
  const q = searchQuery.value.toLowerCase()
  return sortedList.value.filter(
    c => getName(c).toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
  )
})

const selected = computed(() => {
  if (!props.modelValue) return null
  return nationalities.find(c => c.code === props.modelValue)
})

function toggle() {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    searchQuery.value = ''
    nextTick(() => searchRef.value?.focus())
  }
}

function select(c) {
  emit('update:modelValue', c.code)
  showDropdown.value = false
  searchQuery.value = ''
}

function selectFirst() {
  if (filtered.value.length > 0) select(filtered.value[0])
}

function handleClickOutside(event) {
  if (!wrapperRef.value) return
  if (!wrapperRef.value.contains(event.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  const root = wrapperRef.value?.getRootNode?.() || document
  root.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  const root = wrapperRef.value?.getRootNode?.() || document
  root.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="wrapperRef" class="nat-select-wrapper">
    <button
      type="button"
      class="form-input nat-select-trigger"
      :class="{ error: error, 'has-value': selected }"
      @click.stop="toggle"
    >
      <template v-if="selected">
        <span class="nat-flag">{{ codeToFlag(selected.code) }}</span>
        <span class="nat-name">{{ getName(selected) }}</span>
      </template>
      <span v-else class="nat-placeholder">{{
        placeholder || t('booking.form.nationalityPlaceholder')
      }}</span>
      <svg
        class="nat-chevron"
        :class="{ open: showDropdown }"
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <div v-if="showDropdown" class="nat-dropdown" @click.stop>
      <div class="nat-search-box">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          ref="searchRef"
          v-model="searchQuery"
          type="text"
          class="nat-search-input"
          autocomplete="off"
          @keydown.enter.prevent="selectFirst"
          @keydown.esc="showDropdown = false"
        />
      </div>
      <div class="nat-list">
        <button
          v-for="c in filtered"
          :key="c.code"
          type="button"
          class="nat-option"
          :class="{ active: c.code === modelValue }"
          @click="select(c)"
        >
          <span class="nat-flag">{{ codeToFlag(c.code) }}</span>
          <span class="nat-option-name">{{ getName(c) }}</span>
          <svg
            v-if="c.code === modelValue"
            class="nat-check"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
        <div v-if="filtered.length === 0" class="nat-empty">-</div>
      </div>
    </div>
  </div>
</template>
