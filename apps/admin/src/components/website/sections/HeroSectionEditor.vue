<template>
  <div class="space-y-4">
    <!-- Hero Image -->
    <div>
      <label class="form-label">{{ $t('website.hero.image') }}</label>
      <div class="flex items-start gap-4">
        <div class="w-48 h-28 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
          <img
            v-if="modelValue?.photo?.link"
            :src="getImageUrl(modelValue.photo.link)"
            alt="Hero"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <span class="material-icons text-4xl text-gray-300 dark:text-slate-600">image</span>
          </div>
        </div>
        <div class="flex-1">
          <label
            class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors"
          >
            <span class="material-icons text-sm mr-2">upload</span>
            {{ $t('common.upload') }}
            <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
          </label>
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-2">
            {{ $t('website.hero.imageHint') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Hero Title -->
    <div>
      <label class="form-label">{{
        $t('website.hero.title') || $t('website.themeEditor.heroTitle')
      }}</label>
      <LanguageInput
        :model-value="modelValue?.title || []"
        :placeholder="$t('website.hero.titlePlaceholder')"
        @update:model-value="setTitle($event)"
      />
    </div>

    <!-- Hero Description -->
    <div>
      <label class="form-label">{{
        $t('website.hero.description') || $t('website.themeEditor.heroDescription')
      }}</label>
      <LanguageInput
        :model-value="modelValue?.description || []"
        type="textarea"
        :rows="2"
        :placeholder="$t('website.hero.descriptionPlaceholder')"
        @update:model-value="setDescription($event)"
      />
    </div>

    <!-- Search Options -->
    <div>
      <label class="form-label">{{ $t('website.hero.searchOptions') }}</label>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="option in searchOptionsList"
          :key="option.id"
          class="flex items-center px-3 py-2 rounded-lg cursor-pointer border transition-all"
          :class="
            isSearchOptionActive(option.id)
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
          "
        >
          <input
            type="checkbox"
            :checked="isSearchOptionActive(option.id)"
            class="sr-only"
            @change="toggleSearchOption(option.id)"
          />
          <span
            class="material-icons text-lg mr-2"
            :class="isSearchOptionActive(option.id) ? 'text-purple-600' : 'text-gray-400'"
          >
            {{ option.icon }}
          </span>
          <span
            :class="
              isSearchOptionActive(option.id)
                ? 'text-purple-700 dark:text-purple-300'
                : 'text-gray-600 dark:text-slate-400'
            "
          >
            {{ option.label }}
          </span>
        </label>
      </div>
    </div>

    <!-- Backdrop Filter -->
    <div>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          :checked="modelValue?.backdropFilter"
          class="form-checkbox"
          @change="updateField('backdropFilter', $event.target.checked)"
        />
        <span class="text-gray-700 dark:text-slate-300">{{
          $t('website.hero.backdropFilter')
        }}</span>
      </label>
      <p class="text-xs text-gray-500 dark:text-slate-400 ml-6">
        {{ $t('website.hero.backdropFilterHint') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getStorefrontImageUrl } from '@/utils/imageUrl'
import websiteService from '@/services/websiteService'
import LanguageInput from '@/components/common/LanguageInput.vue'

const { t } = useI18n()

const props = defineProps({
  modelValue: Object,
  saving: Boolean
})

const emit = defineEmits(['update:modelValue'])

const getImageUrl = getStorefrontImageUrl

const searchOptionsList = computed(() => [
  { id: 'hotel', icon: 'hotel', label: t('website.hero.options.hotel') },
  { id: 'flight', icon: 'flight', label: t('website.hero.options.flight') },
  { id: 'tour', icon: 'tour', label: t('website.hero.options.tour') },
  { id: 'transfer', icon: 'airport_shuttle', label: t('website.hero.options.transfer') }
])

const setTitle = title => {
  emit('update:modelValue', { ...props.modelValue, title })
}

const setDescription = description => {
  emit('update:modelValue', { ...props.modelValue, description })
}

const isSearchOptionActive = optionId => {
  return props.modelValue?.searchOptions?.includes(optionId)
}

const toggleSearchOption = optionId => {
  const options = [...(props.modelValue?.searchOptions || [])]
  const idx = options.indexOf(optionId)
  if (idx >= 0) {
    options.splice(idx, 1)
  } else {
    options.push(optionId)
  }
  emit('update:modelValue', { ...props.modelValue, searchOptions: options })
}

const updateField = (field, value) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

const handleImageUpload = async event => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const response = await websiteService.uploadSectionImage(file, 'hero')
    if (response.success) {
      emit('update:modelValue', {
        ...props.modelValue,
        photo: response.data
      })
    }
  } catch (error) {
    console.error('Upload failed:', error)
  }
  event.target.value = ''
}
</script>
