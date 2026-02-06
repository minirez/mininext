<template>
  <div class="space-y-4">
    <!-- Campaigns Grid -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <label class="form-label mb-0">{{ $t('website.campaigns.items') }}</label>
        <button
          class="btn-secondary text-sm"
          :disabled="(modelValue?.length || 0) >= 4"
          @click="addCampaign"
        >
          <span class="material-icons text-sm mr-1">add</span>
          {{ $t('website.campaigns.addCampaign') }}
        </button>
      </div>

      <draggable
        :model-value="modelValue || []"
        item-key="index"
        handle=".drag-handle"
        ghost-class="opacity-50"
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
        @update:model-value="updateCampaigns"
      >
        <template #item="{ element, index }">
          <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
            <div class="flex items-start gap-3">
              <!-- Campaign Image -->
              <div
                class="w-24 h-20 bg-gray-200 dark:bg-slate-600 rounded-lg overflow-hidden flex-shrink-0 relative group"
              >
                <img
                  v-if="element.photo?.link"
                  :src="getImageUrl(element.photo.link)"
                  alt="Campaign"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <span class="material-icons text-2xl text-gray-400">campaign</span>
                </div>
                <label
                  class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <span class="material-icons text-white">photo_camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleCampaignImageUpload($event, index)"
                  />
                </label>
              </div>

              <!-- Campaign Info -->
              <div class="flex-1 space-y-2">
                <div class="flex items-center gap-2">
                  <span class="drag-handle cursor-move text-gray-400">
                    <span class="material-icons">drag_indicator</span>
                  </span>
                  <div class="flex-1">
                    <LanguageInput
                      :model-value="element.title || []"
                      size="sm"
                      :placeholder="
                        $t('website.campaigns.title') || $t('website.campaigns.titlePlaceholder')
                      "
                      @update:model-value="setCampaignTitle(index, $event)"
                    />
                  </div>
                </div>
              </div>

              <!-- Delete Button -->
              <button
                class="text-gray-400 hover:text-red-600 transition-colors"
                @click="removeCampaign(index)"
              >
                <span class="material-icons">delete</span>
              </button>
            </div>

            <!-- Description & URL -->
            <div class="mb-2">
              <LanguageInput
                :model-value="element.description || []"
                size="sm"
                :placeholder="
                  $t('website.campaigns.description') ||
                  $t('website.campaigns.descriptionPlaceholder')
                "
                @update:model-value="setCampaignDesc(index, $event)"
              />
            </div>
            <input
              v-model="element.url"
              type="text"
              class="form-input text-sm"
              :placeholder="$t('website.campaigns.url')"
              @input="updateCampaignField(index, 'url', $event.target.value)"
            />
          </div>
        </template>
      </draggable>

      <div
        v-if="!modelValue?.length"
        class="text-center py-8 bg-gray-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600"
      >
        <span class="material-icons text-4xl text-gray-400">campaign</span>
        <p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('website.campaigns.empty') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'
import { getStorefrontImageUrl as getImageUrl } from '@/utils/imageUrl'
import websiteService from '@/services/websiteService'
import LanguageInput from '@/components/common/LanguageInput.vue'

const { t } = useI18n()

const props = defineProps({
  modelValue: Array,
  saving: Boolean
})

const emit = defineEmits(['update:modelValue'])

const setCampaignTitle = (index, title) => {
  const campaigns = [...(props.modelValue || [])]
  campaigns[index] = { ...campaigns[index], title }
  emit('update:modelValue', campaigns)
}

const setCampaignDesc = (index, description) => {
  const campaigns = [...(props.modelValue || [])]
  campaigns[index] = { ...campaigns[index], description }
  emit('update:modelValue', campaigns)
}

const updateCampaigns = campaigns => {
  emit('update:modelValue', campaigns)
}

const addCampaign = () => {
  const campaigns = [...(props.modelValue || [])]
  campaigns.push({
    photo: {},
    title: [
      { lang: 'en', value: '' },
      { lang: 'tr', value: '' }
    ],
    description: [
      { lang: 'en', value: '' },
      { lang: 'tr', value: '' }
    ],
    url: ''
  })
  emit('update:modelValue', campaigns)
}

const removeCampaign = index => {
  const campaigns = [...(props.modelValue || [])]
  campaigns.splice(index, 1)
  emit('update:modelValue', campaigns)
}

const updateCampaignField = (index, field, value) => {
  const campaigns = [...(props.modelValue || [])]
  campaigns[index] = { ...campaigns[index], [field]: value }
  emit('update:modelValue', campaigns)
}

const handleCampaignImageUpload = async (event, index) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const response = await websiteService.uploadSectionImage(file, 'campaign', index)
    if (response.success) {
      const campaigns = [...(props.modelValue || [])]
      campaigns[index] = { ...campaigns[index], photo: response.data }
      emit('update:modelValue', campaigns)
    }
  } catch (error) {
    console.error('Upload failed:', error)
  }
  event.target.value = ''
}
</script>
