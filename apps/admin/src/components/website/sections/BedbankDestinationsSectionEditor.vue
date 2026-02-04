<template>
  <div class="space-y-4">
    <!-- Section Title -->
    <div>
      <label class="form-label">{{ $t('website.themeEditor.sectionTitle') }}</label>
      <LanguageInput
        :model-value="modelValue?.title || []"
        :placeholder="$t('website.locations.titlePlaceholder')"
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

    <!-- Locations Grid with Paximum Picker -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <label class="form-label mb-0">{{
          $t('website.sections.bedbankDestinations') || 'Lokasyonlar'
        }}</label>
        <button
          class="btn-secondary text-sm"
          :disabled="(modelValue?.items?.length || 0) >= 8"
          @click="addLocation"
        >
          <span class="material-icons text-sm mr-1">add</span>
          {{ $t('website.locations.addLocation') }}
        </button>
      </div>

      <draggable
        :model-value="modelValue?.items || []"
        item-key="index"
        handle=".drag-handle"
        ghost-class="opacity-50"
        class="grid grid-cols-2 md:grid-cols-4 gap-4"
        @update:model-value="updateItems"
      >
        <template #item="{ element, index }">
          <div class="relative group">
            <div class="aspect-[4/5] bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
              <img
                v-if="element.photo?.link"
                :src="getImageUrl(element.photo.link)"
                :alt="element.bbLocationName"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="material-icons text-4xl text-gray-300 dark:text-slate-600"
                  >location_on</span
                >
              </div>

              <!-- Overlay -->
              <div
                class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
              >
                <label class="p-2 bg-white rounded-lg cursor-pointer hover:bg-gray-100">
                  <span class="material-icons text-gray-700">photo_camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleLocationImageUpload($event, index)"
                  />
                </label>
                <button
                  class="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  @click="removeLocation(index)"
                >
                  <span class="material-icons">delete</span>
                </button>
              </div>

              <!-- Drag Handle -->
              <div class="absolute top-2 left-2 drag-handle cursor-move">
                <span class="material-icons text-white drop-shadow">drag_indicator</span>
              </div>
            </div>

            <!-- Location Info with Paximum Picker -->
            <div class="mt-2">
              <div
                v-if="element.bbLocationId"
                class="flex items-center gap-1 px-2 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs"
              >
                <span class="material-icons text-xs">location_city</span>
                <span class="font-medium truncate flex-1">{{ element.bbLocationName }}</span>
                <button class="ml-1 hover:text-red-500 flex-shrink-0" @click="clearLocation(index)">
                  <span class="material-icons text-xs">close</span>
                </button>
              </div>
              <PaximumLocationPicker
                v-else
                :type-filter="1"
                :placeholder="$t('website.themeEditor.searchLocation') || 'Lokasyon ara...'"
                @select="loc => handleLocationSelect(loc, index)"
              />
            </div>
          </div>
        </template>
      </draggable>

      <div
        v-if="!modelValue?.items?.length"
        class="text-center py-8 bg-gray-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600"
      >
        <span class="material-icons text-4xl text-gray-400">location_on</span>
        <p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('website.locations.empty') }}</p>
        <p class="text-xs text-gray-400 dark:text-slate-500 mt-1">
          {{
            $t('website.sections.bedbankDestinationsHint') ||
            'Paximum lokasyonlarından destinasyon ekleyin'
          }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'
import { getImageUrl } from '@/utils/imageUrl'
import websiteService from '@/services/websiteService'
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

const updateItems = items => {
  emit('update:modelValue', {
    ...props.modelValue,
    items: items.map((item, i) => ({ ...item, index: i }))
  })
}

const addLocation = () => {
  const items = [...(props.modelValue?.items || [])]
  items.push({
    bbLocationId: null,
    bbLocationName: '',
    photo: {},
    index: items.length
  })
  emit('update:modelValue', { ...props.modelValue, items })
}

const removeLocation = index => {
  const items = [...(props.modelValue?.items || [])]
  items.splice(index, 1)
  emit('update:modelValue', {
    ...props.modelValue,
    items: items.map((item, i) => ({ ...item, index: i }))
  })
}

const handleLocationSelect = (loc, index) => {
  if (!loc) return
  const items = [...(props.modelValue?.items || [])]
  items[index] = {
    ...items[index],
    bbLocationId: parseInt(loc.id),
    bbLocationName: loc.city
      ? `${loc.name}, ${loc.country}`
      : `${loc.name}${loc.country ? ', ' + loc.country : ''}`
  }
  emit('update:modelValue', { ...props.modelValue, items })
}

const clearLocation = index => {
  const items = [...(props.modelValue?.items || [])]
  items[index] = { ...items[index], bbLocationId: null, bbLocationName: '' }
  emit('update:modelValue', { ...props.modelValue, items })
}

const handleLocationImageUpload = async (event, index) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const response = await websiteService.uploadSectionImage(file, 'bedbank-location', index)
    if (response.success) {
      const items = [...(props.modelValue?.items || [])]
      items[index] = { ...items[index], photo: response.data }
      emit('update:modelValue', { ...props.modelValue, items })
    }
  } catch (error) {
    console.error('Upload failed:', error)
  }
  event.target.value = ''
}
</script>
