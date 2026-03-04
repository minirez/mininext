<script setup lang="ts">
import { nationalities, getFlagUrl } from '~/data/nationalities'
import type { Nationality } from '~/data/nationalities'

const props = defineProps<{
  modelValue?: string
  error?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { locale } = useI18n()
const { t: $t } = useI18n()

const wrapperRef = ref<HTMLDivElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)
const showDropdown = ref(false)
const searchQuery = ref('')

function getName(c: Nationality): string {
  const lang = locale.value as 'en' | 'tr'
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

const selected = computed((): Nationality | null => {
  if (!props.modelValue) return null
  return nationalities.find(c => c.code === props.modelValue) ?? null
})

function toggle() {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    searchQuery.value = ''
    nextTick(() => searchRef.value?.focus())
  }
}

function select(c: Nationality) {
  emit('update:modelValue', c.code)
  showDropdown.value = false
  searchQuery.value = ''
}

function selectFirst() {
  if (filtered.value.length > 0) select(filtered.value[0])
}

function handleClickOutside(event: MouseEvent) {
  if (!wrapperRef.value) return
  if (!wrapperRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="wrapperRef" class="relative">
    <button
      type="button"
      class="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-left text-sm transition-colors hover:border-gray-400"
      :class="{
        'border-red-300': error,
        'border-site-primary ring-2 ring-site-primary/20': showDropdown
      }"
      @click.stop="toggle"
    >
      <template v-if="selected">
        <img class="w-5 h-auto rounded-sm" :src="getFlagUrl(selected.code)" :alt="selected.code" />
        <span class="flex-1 text-gray-700 truncate">{{ getName(selected) }}</span>
      </template>
      <span v-else class="flex-1 text-gray-400">
        {{ placeholder || $t('booking.nationalityPlaceholder') }}
      </span>
      <svg
        class="w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform"
        :class="{ 'rotate-180': showDropdown }"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <!-- Dropdown -->
    <div
      v-if="showDropdown"
      class="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
      @click.stop
    >
      <div class="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <svg
          class="w-3.5 h-3.5 text-gray-400 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref="searchRef"
          v-model="searchQuery"
          type="text"
          class="flex-1 text-sm outline-none bg-transparent"
          autocomplete="off"
          @keydown.enter.prevent="selectFirst"
          @keydown.esc="showDropdown = false"
        />
      </div>
      <div class="max-h-48 overflow-y-auto">
        <button
          v-for="c in filtered"
          :key="c.code"
          type="button"
          class="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
          :class="{ 'bg-site-primary/5': c.code === modelValue }"
          @click="select(c)"
        >
          <img class="w-5 h-auto rounded-sm" :src="getFlagUrl(c.code)" :alt="c.code" />
          <span class="flex-1 text-sm text-gray-700 truncate">{{ getName(c) }}</span>
          <svg
            v-if="c.code === modelValue"
            class="w-3.5 h-3.5 text-site-primary shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
        <div v-if="filtered.length === 0" class="px-3 py-4 text-center text-sm text-gray-400">
          -
        </div>
      </div>
    </div>

    <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
  </div>
</template>
