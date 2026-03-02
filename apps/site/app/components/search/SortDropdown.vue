<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="open = !open"
      class="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm hover:border-gray-300 transition-all shadow-sm"
    >
      <svg
        class="w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        stroke-width="1.5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-4.5L16.5 16.5m0 0L12 12m4.5 4.5V7.5"
        />
      </svg>
      {{ $t(`sort.${modelValue || 'default'}`) }}
      <svg
        class="w-3.5 h-3.5 text-gray-400 transition-transform"
        :class="open ? 'rotate-180' : ''"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition name="dropdown">
      <div
        v-if="open"
        class="absolute right-0 top-full mt-2 dropdown-panel py-1 min-w-[200px] z-40"
      >
        <button
          v-for="option in sortOptions"
          :key="option.value"
          @click="select(option.value)"
          class="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
          :class="{
            'font-semibold text-site-primary bg-site-primary/5': modelValue === option.value
          }"
        >
          {{ $t(`sort.${option.value}`) }}
          <svg
            v-if="modelValue === option.value"
            class="w-4 h-4 text-site-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const dropdownRef = ref<HTMLElement>()

const sortOptions = [
  { value: 'default' },
  { value: 'priceLow' },
  { value: 'priceHigh' },
  { value: 'rating' },
  { value: 'name' },
  { value: 'stars' }
]

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
}

onMounted(() => {
  const handler = (e: Event) => {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
      open.value = false
    }
  }
  document.addEventListener('click', handler)
  onUnmounted(() => document.removeEventListener('click', handler))
})
</script>
