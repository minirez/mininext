<template>
  <div class="space-y-4">
    <!-- Section Title -->
    <div>
      <label class="form-label">{{
        $t('website.tours.title') || $t('website.themeEditor.sectionTitle')
      }}</label>
      <LanguageInput
        :model-value="modelValue?.title || []"
        :placeholder="$t('website.tours.titlePlaceholder')"
        @update:model-value="setTitle($event)"
      />
    </div>

    <!-- Section Description -->
    <div>
      <label class="form-label">{{
        $t('website.tours.description') || $t('website.themeEditor.sectionDescription')
      }}</label>
      <LanguageInput
        :model-value="modelValue?.description || []"
        :placeholder="$t('website.tours.descriptionPlaceholder')"
        @update:model-value="setDescription($event)"
      />
    </div>

    <!-- Tour IDs -->
    <div>
      <label class="form-label">{{ $t('website.tours.tourIds') }}</label>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-2">
        {{ $t('website.tours.tourIdsHint') }}
      </p>

      <div class="flex flex-wrap gap-2 mb-3">
        <div
          v-for="(id, index) in modelValue?.ids || []"
          :key="index"
          class="flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full"
        >
          <span class="text-sm font-medium">{{ id }}</span>
          <span v-if="getTourName(index)" class="text-xs opacity-75">
            ({{ getTourName(index) }})
          </span>
          <button class="ml-1 hover:text-red-600" @click="removeTourId(index)">
            <span class="material-icons text-sm">close</span>
          </button>
        </div>
      </div>

      <div class="flex gap-2">
        <input
          v-model="newTourId"
          type="number"
          class="form-input flex-1"
          :placeholder="$t('website.tours.enterTourId')"
          @keyup.enter="addTourId"
        />
        <button class="btn-secondary" :disabled="!newTourId" @click="addTourId">
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

const newTourId = ref('')

const setTitle = title => {
  emit('update:modelValue', { ...props.modelValue, title })
}

const setDescription = description => {
  emit('update:modelValue', { ...props.modelValue, description })
}

const getTourName = index => {
  const names = props.modelValue?.names || []
  if (Array.isArray(names) && names[index]) {
    // Handle both string and langSchema format
    if (typeof names[index] === 'string') {
      return names[index]
    }
    if (typeof names[index] === 'object' && names[index].value) {
      return names[index].value
    }
  }
  return ''
}

const addTourId = () => {
  if (!newTourId.value) return
  const ids = [...(props.modelValue?.ids || [])]
  const names = [...(props.modelValue?.names || [])]
  const id = parseInt(newTourId.value)
  if (!ids.includes(id)) {
    ids.push(id)
    names.push({ lang: 'tr', value: '' }) // Name will be fetched from server
    emit('update:modelValue', { ...props.modelValue, ids, names })
  }
  newTourId.value = ''
}

const removeTourId = index => {
  const ids = [...(props.modelValue?.ids || [])]
  const names = [...(props.modelValue?.names || [])]
  ids.splice(index, 1)
  names.splice(index, 1)
  emit('update:modelValue', { ...props.modelValue, ids, names })
}
</script>
