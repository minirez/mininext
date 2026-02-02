<template>
  <div
    class="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col"
  >
    <div class="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
      <div class="flex items-center gap-2">
        <span class="material-icons text-purple-500">tune</span>
        <h4 class="font-semibold text-gray-800 dark:text-white">
          {{ $t('website.sections.sectionEditors') || 'Section Configuration' }}
        </h4>
        <span class="text-xs text-gray-500 ml-auto">{{ modelValue.length }} sections active</span>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <draggable
        v-if="modelValue.length"
        :modelValue="modelValue"
        @update:modelValue="$emit('update:modelValue', $event)"
        item-key="id"
        handle=".drag-handle"
        ghost-class="opacity-50"
        animation="200"
        class="divide-y divide-gray-200 dark:divide-slate-700"
      >
        <template #item="{ element: section, index }">
          <div class="bg-white dark:bg-slate-800">
            <!-- Hero singleton warning banner -->
            <div
              v-if="isHero(section.type) && hasMultipleHeroes"
              class="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800"
            >
              <div class="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 text-xs">
                <span class="material-icons text-sm">warning</span>
                <span
                  >{{ $t('website.sections.willReplace') || 'Only one hero section allowed' }} -
                  {{ $t('website.sections.willReplace') || 'will replace existing' }}</span
                >
              </div>
            </div>

            <div class="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
              <!-- Drag handle -->
              <span class="drag-handle cursor-move text-gray-400 hover:text-gray-600" @click.stop>
                <span class="material-icons">drag_indicator</span>
              </span>

              <!-- Section icon -->
              <span
                class="w-8 h-8 rounded-lg flex items-center justify-center"
                :class="
                  isHero(section.type)
                    ? 'bg-yellow-100 dark:bg-yellow-900/30'
                    : 'bg-purple-100 dark:bg-purple-900/30'
                "
              >
                <span
                  class="material-icons"
                  :class="
                    isHero(section.type)
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-purple-600 dark:text-purple-400'
                  "
                  >{{ getIcon(section.type) }}</span
                >
              </span>

              <!-- Section info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h5 class="font-medium text-gray-800 dark:text-white truncate">
                    {{ getName(section.type) }}
                  </h5>
                  <!-- Hero switchable indicator -->
                  <span
                    v-if="isHero(section.type)"
                    class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                  >
                    {{ $t('website.sections.singletonHero') || 'Only 1' }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 dark:text-slate-400">
                  {{ getCategory(section.type) }}
                </p>
              </div>

              <!-- Delete button -->
              <button
                class="p-1 text-gray-400 hover:text-red-600 transition-colors"
                @click.stop="$emit('remove', index)"
                :title="$t('common.delete')"
              >
                <span class="material-icons text-lg">delete</span>
              </button>

              <!-- Expand/collapse button (center-ish) -->
              <button
                class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                @click="toggle(index)"
                :title="section.expanded ? 'Collapse' : 'Expand'"
              >
                <span
                  class="material-icons text-gray-500 dark:text-slate-400 transition-transform"
                  :class="{ 'rotate-180': section.expanded }"
                  >expand_more</span
                >
              </button>

              <!-- Reorder buttons (rightmost) -->
              <div
                class="flex flex-col gap-0.5 border-l border-gray-200 dark:border-slate-700 pl-2 ml-1"
              >
                <button
                  class="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  :disabled="index === 0"
                  @click.stop="moveUp(index)"
                  :title="$t('common.moveUp') || 'Move up'"
                >
                  <span class="material-icons text-gray-500 dark:text-slate-400 text-lg"
                    >keyboard_arrow_up</span
                  >
                </button>
                <button
                  class="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  :disabled="index >= modelValue.length - 1"
                  @click.stop="moveDown(index)"
                  :title="$t('common.moveDown') || 'Move down'"
                >
                  <span class="material-icons text-gray-500 dark:text-slate-400 text-lg"
                    >keyboard_arrow_down</span
                  >
                </button>
              </div>
            </div>

            <Transition
              enter-active-class="transition-all duration-300"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-[2000px]"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 max-h-[2000px]"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-show="section.expanded" class="px-4 pb-4 overflow-hidden">
                <div class="p-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
                  <slot name="editor" :section="section" :index="index" />
                </div>
              </div>
            </Transition>
          </div>
        </template>
      </draggable>

      <div v-else class="h-full flex items-center justify-center p-8">
        <div
          class="text-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl p-8 w-full max-w-md"
        >
          <span class="material-icons text-5xl mb-3">add_box</span>
          <p class="font-medium mb-1">Drag sections here</p>
          <p class="text-sm">Or click + button on any section</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'
import {
  toCanonicalSectionType,
  SECTION_CONFIG,
  getSectionLabelKey,
  isHeroSection
} from '@booking-engine/constants'

const { t } = useI18n()
const props = defineProps({ modelValue: Array })
const emit = defineEmits(['update:modelValue', 'remove'])

// Check if there are multiple hero sections (shouldn't happen, but indicates conflict)
const hasMultipleHeroes = computed(() => {
  const heroCount = (props.modelValue || []).filter(s => isHeroSection(s.type)).length
  return heroCount > 1
})

const toggle = index => {
  const updated = [...props.modelValue]
  updated[index] = { ...updated[index], expanded: !updated[index].expanded }
  emit('update:modelValue', updated)
}

const moveUp = index => {
  if (index === 0) return
  const updated = [...props.modelValue]
  const temp = updated[index - 1]
  updated[index - 1] = updated[index]
  updated[index] = temp
  emit('update:modelValue', updated)
}

const moveDown = index => {
  if (index >= props.modelValue.length - 1) return
  const updated = [...props.modelValue]
  const temp = updated[index + 1]
  updated[index + 1] = updated[index]
  updated[index] = temp
  emit('update:modelValue', updated)
}

const getIcon = type => SECTION_CONFIG[toCanonicalSectionType(type)]?.icon || 'widgets'
const getName = type => {
  const key = getSectionLabelKey(type)
  return t(`website.sections.${key}`) || type
}
const getCategory = type => {
  const cat = SECTION_CONFIG[toCanonicalSectionType(type)]?.category
  return cat ? t(`website.sections.categories.${cat}`) : ''
}
const isHero = type => isHeroSection(type)
</script>
