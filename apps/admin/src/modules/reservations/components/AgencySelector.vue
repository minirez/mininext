<template>
  <div class="agency-selector" ref="containerRef">
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Selected Agency Display / Trigger -->
    <div class="relative">
      <button
        type="button"
        @click="toggleDropdown"
        :disabled="disabled"
        class="w-full flex items-center gap-2 px-3 py-2 border rounded-lg text-left transition-all"
        :class="triggerClasses"
      >
        <span class="material-icons text-gray-400 dark:text-slate-500">business</span>

        <template v-if="selectedAgency">
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white truncate">
              {{ selectedAgency.companyName || selectedAgency.tradeName }}
            </div>
            <div v-if="selectedAgency.tradeName && selectedAgency.tradeName !== selectedAgency.companyName" class="text-xs text-gray-500 dark:text-slate-400 truncate">
              {{ selectedAgency.tradeName }}
            </div>
          </div>
          <button
            type="button"
            @click.stop="clearSelection"
            class="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
          >
            <span class="material-icons text-gray-400 text-sm">close</span>
          </button>
        </template>

        <span v-else class="flex-1 text-gray-400 dark:text-slate-500">
          {{ placeholder || $t('pms.reservation.selectAgency') }}
        </span>

        <span class="material-icons text-gray-400 transition-transform" :class="showDropdown ? 'rotate-180' : ''">
          expand_more
        </span>
      </button>
    </div>

    <!-- Dropdown -->
    <Teleport to="body">
      <div
        v-if="showDropdown"
        ref="dropdownRef"
        :style="dropdownStyle"
        class="fixed z-[9999] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
      >
        <!-- Search Input -->
        <div class="p-3 border-b border-gray-200 dark:border-slate-700">
          <div class="relative">
            <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="$t('common.search')"
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              @keydown.enter.prevent="handleEnter"
              @keydown.esc="showDropdown = false"
            />
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-8">
          <span class="material-icons animate-spin text-indigo-500">refresh</span>
        </div>

        <!-- Agency List -->
        <div v-else class="max-h-60 overflow-y-auto">
          <!-- Create New Option -->
          <button
            v-if="searchQuery && !exactMatch"
            type="button"
            @click="showCreateForm = true"
            class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border-b border-gray-100 dark:border-slate-700"
          >
            <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <span class="material-icons text-indigo-600 dark:text-indigo-400 text-lg">add</span>
            </div>
            <div>
              <div class="font-medium text-indigo-600 dark:text-indigo-400">
                {{ $t('pms.reservation.createAgency') }}
              </div>
              <div class="text-xs text-gray-500 dark:text-slate-400">
                "{{ searchQuery }}"
              </div>
            </div>
          </button>

          <!-- Agency Items -->
          <button
            v-for="agency in filteredAgencies"
            :key="agency._id"
            type="button"
            @click="selectAgency(agency)"
            class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            :class="modelValue === agency._id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''"
          >
            <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
              <span class="material-icons text-gray-500 dark:text-slate-400 text-lg">business</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white truncate">
                {{ agency.companyName }}
              </div>
              <div class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
                <span v-if="agency.tradeName && agency.tradeName !== agency.companyName">{{ agency.tradeName }}</span>
                <span v-if="agency.email">{{ agency.email }}</span>
              </div>
            </div>
            <span
              v-if="modelValue === agency._id"
              class="material-icons text-indigo-600 dark:text-indigo-400"
            >
              check_circle
            </span>
          </button>

          <!-- No Results -->
          <div v-if="filteredAgencies.length === 0 && !searchQuery" class="py-8 text-center">
            <span class="material-icons text-4xl text-gray-300 dark:text-slate-600">business</span>
            <p class="mt-2 text-sm text-gray-500 dark:text-slate-400">{{ $t('pms.reservation.noAgencies') }}</p>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Create Agency Form Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateForm"
        class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50"
        @click.self="showCreateForm = false"
      >
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t('pms.reservation.newAgency') }}
            </h3>
            <button
              type="button"
              @click="showCreateForm = false"
              class="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <span class="material-icons text-gray-500">close</span>
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="createAgency" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('pms.reservation.companyName') }} *
              </label>
              <input
                v-model="newAgency.companyName"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                :placeholder="$t('pms.reservation.companyNamePlaceholder')"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('pms.reservation.tradeName') }}
              </label>
              <input
                v-model="newAgency.tradeName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                :placeholder="$t('pms.reservation.tradeNamePlaceholder')"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('common.email') }} *
              </label>
              <input
                v-model="newAgency.email"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                :placeholder="$t('pms.reservation.emailPlaceholder')"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('common.phone') }}
              </label>
              <input
                v-model="newAgency.phone"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <!-- Error Message -->
            <div v-if="createError" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p class="text-sm text-red-600 dark:text-red-400">{{ createError }}</p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-3 pt-2">
              <button
                type="button"
                @click="showCreateForm = false"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="creating"
                class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span v-if="creating" class="material-icons animate-spin text-sm">refresh</span>
                <span class="material-icons text-sm" v-else>add</span>
                {{ $t('common.create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Error Message -->
    <p v-if="error" class="mt-1 text-sm text-red-500 flex items-center gap-1">
      <span class="material-icons text-sm">error</span>
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import agencyService from '@/services/agencyService'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'select', 'created'])

const { t } = useI18n()
const toast = useToast()

// Refs
const containerRef = ref(null)
const dropdownRef = ref(null)
const searchInputRef = ref(null)

// State
const showDropdown = ref(false)
const showCreateForm = ref(false)
const searchQuery = ref('')
const loading = ref(false)
const creating = ref(false)
const createError = ref('')
const agencies = ref([])
const dropdownPosition = ref({ top: 0, left: 0, width: 0 })

// New agency form
const newAgency = ref({
  companyName: '',
  tradeName: '',
  email: '',
  phone: ''
})

// Computed
const selectedAgency = computed(() => {
  if (!props.modelValue) return null
  const list = Array.isArray(agencies.value) ? agencies.value : []
  return list.find(a => a._id === props.modelValue)
})

const filteredAgencies = computed(() => {
  const list = Array.isArray(agencies.value) ? agencies.value : []
  if (!searchQuery.value) return list.filter(a => a.status === 'active')

  const query = searchQuery.value.toLowerCase()
  return list.filter(a => {
    if (a.status !== 'active') return false
    return (
      a.companyName?.toLowerCase().includes(query) ||
      a.tradeName?.toLowerCase().includes(query) ||
      a.email?.toLowerCase().includes(query)
    )
  })
})

const exactMatch = computed(() => {
  if (!searchQuery.value) return true
  const list = Array.isArray(agencies.value) ? agencies.value : []
  const query = searchQuery.value.toLowerCase()
  return list.some(a =>
    a.companyName?.toLowerCase() === query ||
    a.tradeName?.toLowerCase() === query
  )
})

const triggerClasses = computed(() => {
  if (props.disabled) {
    return 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 cursor-not-allowed opacity-60'
  }
  if (props.error) {
    return 'border-red-500 bg-red-50 dark:bg-red-900/10'
  }
  if (selectedAgency.value) {
    return 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20'
  }
  return 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600'
})

const dropdownStyle = computed(() => ({
  top: `${dropdownPosition.value.top}px`,
  left: `${dropdownPosition.value.left}px`,
  width: `${dropdownPosition.value.width}px`,
  minWidth: '320px'
}))

// Methods
const updateDropdownPosition = () => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  dropdownPosition.value = {
    top: rect.bottom + 4,
    left: rect.left,
    width: Math.max(rect.width, 320)
  }
}

const toggleDropdown = () => {
  if (props.disabled) return
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    updateDropdownPosition()
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
}

const selectAgency = (agency) => {
  emit('update:modelValue', agency._id)
  emit('select', agency)
  showDropdown.value = false
  searchQuery.value = ''
}

const clearSelection = () => {
  emit('update:modelValue', '')
  emit('select', null)
}

const handleEnter = () => {
  if (filteredAgencies.value.length === 1) {
    selectAgency(filteredAgencies.value[0])
  } else if (searchQuery.value && !exactMatch.value) {
    showCreateForm.value = true
  }
}

const createAgency = async () => {
  if (!newAgency.value.companyName || !newAgency.value.email) return

  creating.value = true
  createError.value = ''

  try {
    const response = await agencyService.createAgency({
      companyName: newAgency.value.companyName,
      tradeName: newAgency.value.tradeName || newAgency.value.companyName,
      email: newAgency.value.email,
      phone: newAgency.value.phone,
      status: 'active'
    })

    const createdAgency = response.data || response

    // Add to list and select
    agencies.value.push(createdAgency)
    selectAgency(createdAgency)
    emit('created', createdAgency)

    // Reset form
    newAgency.value = { companyName: '', tradeName: '', email: '', phone: '' }
    showCreateForm.value = false
    toast.success(t('pms.reservation.agencyCreated'))
  } catch (err) {
    createError.value = err.response?.data?.message || t('common.error')
  } finally {
    creating.value = false
  }
}

const fetchAgencies = async () => {
  loading.value = true
  try {
    const response = await agencyService.getAgencies({ limit: 500 })
    agencies.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch agencies:', error)
  } finally {
    loading.value = false
  }
}

// Click outside handler
const handleClickOutside = (event) => {
  const clickedContainer = containerRef.value?.contains(event.target)
  const clickedDropdown = dropdownRef.value?.contains(event.target)

  if (!clickedContainer && !clickedDropdown) {
    showDropdown.value = false
  }
}

// Watch for opening create form with search query
watch(showCreateForm, (val) => {
  if (val && searchQuery.value) {
    newAgency.value.companyName = searchQuery.value
  }
})

onMounted(() => {
  fetchAgencies()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Expose for parent
defineExpose({
  refresh: fetchAgencies
})
</script>

<style scoped>
.agency-selector button:focus {
  outline: none;
}
</style>
