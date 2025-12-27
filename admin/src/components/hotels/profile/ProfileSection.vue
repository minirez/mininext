<template>
  <div class="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
    <!-- Accordion Header -->
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
    >
      <div class="flex items-center gap-3">
        <span v-if="icon" class="material-icons text-purple-600 dark:text-purple-400">{{ icon }}</span>
        <span class="font-medium text-gray-800 dark:text-slate-200">{{ title }}</span>
        <span v-if="featureCount > 0" class="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
          {{ selectedFeatures.length }}/{{ featureCount }}
        </span>
        <span v-if="hasContent" class="w-2 h-2 bg-green-500 rounded-full" :title="$t('hotels.profile.hasContent')"></span>
      </div>
      <span class="material-icons text-gray-500 transition-transform" :class="{ 'rotate-180': isOpen }">
        expand_more
      </span>
    </button>

    <!-- Accordion Content -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[2000px] opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="max-h-[2000px] opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-show="isOpen" class="overflow-hidden">
        <div class="p-4 space-y-6 border-t border-gray-200 dark:border-slate-600">
          <!-- Features Checkbox Grid -->
          <div v-if="features.length > 0">
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
              {{ $t('hotels.profile.featuresLabel') }}
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              <label
                v-for="feature in features"
                :key="feature.value"
                class="flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors"
                :class="[
                  isFeatureSelected(feature.value)
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-500'
                ]"
              >
                <input
                  type="checkbox"
                  :checked="isFeatureSelected(feature.value)"
                  @change="toggleFeature(feature.value)"
                  class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span class="text-sm text-gray-700 dark:text-slate-300 truncate" :title="feature.label">
                  {{ feature.label }}
                </span>
              </label>
            </div>
          </div>

          <!-- Custom Fields Slot -->
          <slot name="fields"></slot>

          <!-- Rich Text Editor -->
          <div v-if="showEditor">
            <RichTextEditor
              v-model="localContent"
              :languages="languages"
              :label="editorLabel || $t('hotels.profile.description')"
              :show-translate="true"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import RichTextEditor from '@/components/common/RichTextEditor.vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: ''
  },
  features: {
    type: Array,
    default: () => []
  },
  selectedFeatures: {
    type: Array,
    default: () => []
  },
  content: {
    type: Object,
    default: () => ({})
  },
  languages: {
    type: Array,
    default: () => ['tr', 'en', 'de', 'ru', 'es']
  },
  showEditor: {
    type: Boolean,
    default: true
  },
  defaultOpen: {
    type: Boolean,
    default: false
  },
  editorLabel: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:selectedFeatures', 'update:content'])

const isOpen = ref(props.defaultOpen)

// Local content for v-model binding
const localContent = computed({
  get: () => props.content,
  set: (value) => emit('update:content', value)
})

// Feature count
const featureCount = computed(() => props.features.length)

// Check if content has any value
const hasContent = computed(() => {
  return Object.values(props.content || {}).some(val => val && val.trim && val.trim() !== '' && val !== '<p></p>')
})

// Check if a feature is selected
const isFeatureSelected = (value) => {
  return props.selectedFeatures.includes(value)
}

// Toggle feature selection
const toggleFeature = (value) => {
  const newFeatures = [...props.selectedFeatures]
  const index = newFeatures.indexOf(value)

  if (index === -1) {
    newFeatures.push(value)
  } else {
    newFeatures.splice(index, 1)
  }

  emit('update:selectedFeatures', newFeatures)
}
</script>
