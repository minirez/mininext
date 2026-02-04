<template>
  <div class="space-y-4">
    <!-- Section Title -->
    <div>
      <label class="form-label">{{ $t('website.themeEditor.sectionTitle') }}</label>
      <LanguageInput
        :model-value="modelValue?.title || []"
        @update:model-value="setTitle($event)"
      />
    </div>

    <!-- Section Description -->
    <div>
      <label class="form-label">{{ $t('website.themeEditor.sectionDescription') }}</label>
      <LanguageInput
        :model-value="modelValue?.description || []"
        type="textarea"
        @update:model-value="setDescription($event)"
      />
    </div>

    <!-- Hotel Selection with Paximum Picker -->
    <div>
      <label class="form-label">{{
        $t('website.themeEditor.showcaseHotels') || 'Vitrin Otelleri'
      }}</label>
      <p class="text-xs text-gray-500 dark:text-slate-400 mb-3">
        {{
          $t('website.themeEditor.showcaseHotelsHint') ||
          'Vitrinde gösterilecek otelleri Paximum veritabanından arayarak seçin'
        }}
      </p>

      <!-- Hotel Search -->
      <PaximumLocationPicker
        :type-filter="2"
        :placeholder="$t('website.themeEditor.searchHotel') || 'Otel ara...'"
        @select="handleHotelSelect"
      />

      <!-- Selected Hotels List -->
      <div v-if="(modelValue?.ids?.length || 0) > 0" class="mt-4 space-y-2">
        <draggable
          :model-value="modelValue?.ids || []"
          item-key="id"
          handle=".drag-handle"
          ghost-class="opacity-50"
          @update:model-value="updateIds"
        >
          <template #item="{ element, index }">
            <div
              class="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg"
            >
              <span class="drag-handle cursor-move">
                <span class="material-icons text-sm text-purple-400">drag_indicator</span>
              </span>
              <span class="material-icons text-sm">hotel</span>
              <span class="flex-1 text-sm font-medium">{{ element.name || element }}</span>
              <span class="text-xs text-purple-400">ID: {{ element.id || element }}</span>
              <button class="hover:text-red-600" @click="removeHotel(index)">
                <span class="material-icons text-sm">close</span>
              </button>
            </div>
          </template>
        </draggable>
      </div>

      <div
        v-else
        class="mt-4 text-center py-6 text-gray-400 dark:text-slate-500 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg"
      >
        <span class="material-icons text-3xl mb-2">hotel</span>
        <p class="text-sm">
          {{ $t('website.themeEditor.noShowcaseHotels') || 'Henüz otel seçilmedi' }}
        </p>
        <p class="text-xs mt-1">
          {{
            $t('website.sections.bedbankShowcaseHint') ||
            'Yukarıdan Paximum otelleri arayarak ekleyin'
          }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'
import LanguageInput from '@/components/common/LanguageInput.vue'
import PaximumLocationPicker from '../PaximumLocationPicker.vue'

const { t } = useI18n()

const props = defineProps({
  modelValue: Object,
  saving: Boolean
})

const emit = defineEmits(['update:modelValue'])

const setTitle = title => {
  emit('update:modelValue', { ...props.modelValue, title })
}

const setDescription = description => {
  emit('update:modelValue', { ...props.modelValue, description })
}

const updateIds = ids => {
  emit('update:modelValue', { ...props.modelValue, ids })
}

const handleHotelSelect = loc => {
  if (!loc) return
  const ids = [...(props.modelValue?.ids || [])]
  // Check if already exists
  const exists = ids.some(h => (h.id || h) === parseInt(loc.id))
  if (!exists) {
    ids.push({
      id: parseInt(loc.id),
      name: loc.name
    })
    emit('update:modelValue', { ...props.modelValue, ids })
  }
}

const removeHotel = index => {
  const ids = [...(props.modelValue?.ids || [])]
  ids.splice(index, 1)
  emit('update:modelValue', { ...props.modelValue, ids })
}
</script>
