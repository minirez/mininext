<template>
  <div class="space-y-4">
    <!-- Section Title -->
    <div>
      <label class="form-label">{{
        $t('website.hotels.title') || $t('website.themeEditor.sectionTitle')
      }}</label>
      <LanguageInput
        :model-value="modelValue?.title || []"
        :placeholder="$t('website.hotels.titlePlaceholder')"
        @update:model-value="setTitle($event)"
      />
    </div>

    <!-- Section Description -->
    <div>
      <label class="form-label">{{
        $t('website.hotels.description') || $t('website.themeEditor.sectionDescription')
      }}</label>
      <LanguageInput
        :model-value="modelValue?.description || []"
        :placeholder="$t('website.hotels.descriptionPlaceholder')"
        @update:model-value="setDescription($event)"
      />
    </div>

    <!-- Hotel IDs -->
    <div>
      <label class="form-label">{{ $t('website.hotels.hotelIds') }}</label>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-2">
        {{ $t('website.hotels.hotelIdsHint') }}
      </p>

      <div class="flex flex-wrap gap-2 mb-3">
        <div
          v-for="(id, index) in modelValue?.ids || []"
          :key="index"
          class="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full"
        >
          <span class="text-sm font-medium">{{ id }}</span>
          <span v-if="modelValue?.names?.[index]" class="text-xs opacity-75">
            ({{ modelValue.names[index] }})
          </span>
          <button class="ml-1 hover:text-red-600" @click="removeHotelId(index)">
            <span class="material-icons text-sm">close</span>
          </button>
        </div>
      </div>

      <div class="flex gap-2">
        <input
          v-model="newHotelId"
          type="number"
          class="form-input flex-1"
          :placeholder="$t('website.hotels.enterHotelId')"
          @keyup.enter="addHotelId"
        />
        <button class="btn-secondary" :disabled="!newHotelId" @click="addHotelId">
          <span class="material-icons text-sm mr-1">add</span>
          {{ $t('common.add') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageInput from '@/components/common/LanguageInput.vue'

const { t } = useI18n()

const props = defineProps({
  modelValue: Object,
  saving: Boolean
})

const emit = defineEmits(['update:modelValue'])

const newHotelId = ref('')

const setTitle = title => {
  emit('update:modelValue', { ...props.modelValue, title })
}

const setDescription = description => {
  emit('update:modelValue', { ...props.modelValue, description })
}

const addHotelId = () => {
  if (!newHotelId.value) return
  const ids = [...(props.modelValue?.ids || [])]
  const names = [...(props.modelValue?.names || [])]
  const id = parseInt(newHotelId.value)
  if (!ids.includes(id)) {
    ids.push(id)
    names.push('') // Name will be fetched from server
    emit('update:modelValue', { ...props.modelValue, ids, names })
  }
  newHotelId.value = ''
}

const removeHotelId = index => {
  const ids = [...(props.modelValue?.ids || [])]
  const names = [...(props.modelValue?.names || [])]
  ids.splice(index, 1)
  names.splice(index, 1)
  emit('update:modelValue', { ...props.modelValue, ids, names })
}
</script>
