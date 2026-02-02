<template>
  <div class="space-y-4">
    <!-- Section Title & Description -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="form-label">{{ $t('website.sections.sectionTitle') }}</label>
        <LanguageInput v-model="localData.title" />
      </div>
      <div>
        <label class="form-label">{{ $t('website.sections.sectionDescription') }}</label>
        <LanguageInput v-model="localData.description" />
      </div>
    </div>

    <!-- IDs Input (for products/items) -->
    <div>
      <label class="form-label">{{ $t('website.sections.itemIds') }}</label>
      <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">
        {{ $t('website.sections.itemIdsHint') }}
      </p>
      <div class="flex flex-wrap gap-2 mb-2">
        <div
          v-for="(id, index) in localData.ids || []"
          :key="index"
          class="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
        >
          <span>{{ id }}</span>
          <button class="hover:text-red-600" @click="removeId(index)">
            <span class="material-icons text-sm">close</span>
          </button>
        </div>
      </div>
      <div class="flex gap-2">
        <input
          v-model="newId"
          type="number"
          class="form-input text-sm w-32"
          :placeholder="$t('website.sections.addId')"
          @keydown.enter.prevent="addId"
        />
        <button class="btn-outline text-sm" @click="addId">
          <span class="material-icons text-sm mr-1">add</span>
          {{ $t('common.add') }}
        </button>
      </div>
    </div>

    <!-- Type-specific fields based on sectionType -->
    <div v-if="sectionType === 'flights'" class="space-y-4">
      <!-- Routes for flights -->
      <div>
        <label class="form-label">{{ $t('website.sections.routes') }}</label>
        <div class="space-y-2">
          <div
            v-for="(route, index) in localData.routes || []"
            :key="index"
            class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
          >
            <input
              v-model="route.departure"
              type="text"
              class="form-input text-sm flex-1"
              :placeholder="$t('website.sections.departure')"
            />
            <span class="material-icons text-gray-400">arrow_forward</span>
            <input
              v-model="route.arrival"
              type="text"
              class="form-input text-sm flex-1"
              :placeholder="$t('website.sections.arrival')"
            />
            <button class="text-red-500 hover:text-red-700" @click="removeRoute(index)">
              <span class="material-icons text-sm">close</span>
            </button>
          </div>
        </div>
        <button class="btn-outline text-sm mt-2" @click="addRoute">
          <span class="material-icons text-sm mr-1">add</span>
          {{ $t('website.sections.addRoute') }}
        </button>
      </div>
    </div>

    <div v-if="sectionType.startsWith('bedbank-')" class="space-y-4">
      <!-- Location ID for bedbank -->
      <div v-if="sectionType === 'bedbank-destinations'">
        <label class="form-label">{{ $t('website.sections.locationIds') }}</label>
        <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">
          {{ $t('website.sections.bedbankLocationHint') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageInput from '@/components/common/LanguageInput.vue'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  saving: Boolean,
  sectionType: {
    type: String,
    required: true
  },
  title: String
})

const emit = defineEmits(['update:modelValue'])

const newId = ref('')

const localData = ref({
  title: [{ lang: 'en', value: '' }],
  description: [{ lang: 'en', value: '' }],
  ids: [],
  routes: []
})

// Watch for modelValue changes
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      localData.value = {
        title: newValue.title || [{ lang: 'en', value: '' }],
        description: newValue.description || [{ lang: 'en', value: '' }],
        ids: newValue.ids || [],
        routes: newValue.routes || []
      }
    }
  },
  { immediate: true, deep: true }
)

// Watch for local changes
watch(
  localData,
  newValue => {
    emit('update:modelValue', newValue)
  },
  { deep: true }
)

const addId = () => {
  const id = parseInt(newId.value)
  if (!id) return
  if (!localData.value.ids) localData.value.ids = []
  if (!localData.value.ids.includes(id)) {
    localData.value.ids.push(id)
  }
  newId.value = ''
}

const removeId = index => {
  localData.value.ids.splice(index, 1)
}

const addRoute = () => {
  if (!localData.value.routes) localData.value.routes = []
  localData.value.routes.push({
    departure: '',
    arrival: '',
    departureDate: null,
    arrivalDate: null
  })
}

const removeRoute = index => {
  localData.value.routes.splice(index, 1)
}
</script>
