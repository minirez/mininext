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

    <!-- Location Selection with Paximum Picker -->
    <div>
      <label class="form-label">{{
        $t('website.themeEditor.selectLocation') || 'Lokasyon Seç'
      }}</label>
      <p class="text-xs text-gray-500 dark:text-slate-400 mb-3">
        {{
          $t('website.sections.bedbankSectionHint') ||
          'Bu bölümde gösterilecek otellerin bulunduğu lokasyonu seçin'
        }}
      </p>

      <!-- Selected Location or Picker -->
      <div v-if="modelValue?.locationId" class="mt-1">
        <div
          class="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg"
        >
          <span class="material-icons text-sm">location_city</span>
          <span class="flex-1 text-sm font-medium">{{ modelValue.locationName }}</span>
          <span class="text-xs text-purple-400">ID: {{ modelValue.locationId }}</span>
          <button class="hover:text-red-600" @click="clearLocation">
            <span class="material-icons text-sm">close</span>
          </button>
        </div>
      </div>
      <PaximumLocationPicker
        v-else
        :type-filter="1"
        :placeholder="$t('website.themeEditor.searchLocation') || 'Lokasyon ara...'"
        @select="handleLocationSelect"
      />
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
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

const handleLocationSelect = loc => {
  if (!loc) return
  emit('update:modelValue', {
    ...props.modelValue,
    locationId: parseInt(loc.id),
    locationName: loc.city
      ? `${loc.name}, ${loc.country}`
      : `${loc.name}${loc.country ? ', ' + loc.country : ''}`
  })
}

const clearLocation = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    locationId: null,
    locationName: ''
  })
}
</script>
