<template>
  <div class="h-full flex flex-col">
    <!-- Navigation -->
    <ModuleNavigation :items="navItems" color="primary">
      <template #actions>
        <BaseButton size="sm" @click="openExtraModal()">
          <span class="material-icons mr-1 text-sm">add</span>
          {{ $t('extra.newExtra') }}
        </BaseButton>
      </template>
    </ModuleNavigation>

    <div class="flex-1 overflow-y-auto py-6 space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <span class="material-icons text-purple-600 dark:text-purple-400">extension</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ $t('common.total') }}
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ extras.length }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <span class="material-icons text-green-600 dark:text-green-400">check_circle</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ $t('common.active') }}
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ activeCount }}</p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <span class="material-icons text-blue-600 dark:text-blue-400">local_activity</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ $t('extra.extraCategories.activity') }}
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ categoryCount('activity') }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
              <span class="material-icons text-orange-600 dark:text-orange-400">restaurant</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ $t('extra.extraCategories.meal') }}
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ categoryCount('meal') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4"
      >
        <div class="flex flex-col md:flex-row md:items-center gap-4">
          <div class="flex-1">
            <input
              type="text"
              v-model="searchQuery"
              :placeholder="$t('extra.search')"
              class="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            />
          </div>
          <div class="flex items-center gap-3">
            <select
              v-model="filters.category"
              class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              <option value="">{{ $t('extra.fields.category') }}</option>
              <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
            <select
              v-model="filters.status"
              class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              <option value="">{{ $t('filters.allStatuses') }}</option>
              <option value="active">{{ $t('common.active') }}</option>
              <option value="inactive">{{ $t('common.inactive') }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Extras Grid -->
      <div v-if="loading" class="flex justify-center py-12">
        <Spinner />
      </div>
      <div
        v-else-if="filteredExtras.length === 0"
        class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center"
      >
        <span class="material-icons text-6xl text-gray-300 dark:text-gray-600 mb-4"
          >extension_off</span
        >
        <p class="text-gray-500 dark:text-gray-400 mb-4">{{ $t('extra.noExtras') }}</p>
        <BaseButton @click="openExtraModal()">
          {{ $t('extra.createFirst') }}
        </BaseButton>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="extra in filteredExtras"
          :key="extra._id"
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow"
        >
          <!-- Extra Header -->
          <div class="p-4 border-b border-gray-200 dark:border-slate-700">
            <div class="flex items-start justify-between">
              <div class="flex items-center">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                  :class="getCategoryColor(extra.category)"
                >
                  <span class="material-icons text-white">{{
                    getCategoryIcon(extra.category)
                  }}</span>
                </div>
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    {{ getLocalizedName(extra.name) }}
                  </h3>
                  <p class="text-sm text-gray-500">{{ extra.code }}</p>
                </div>
              </div>
              <StatusBadge :status="extra.status" :statusMap="extraStatusMap" />
            </div>
          </div>

          <!-- Extra Body -->
          <div class="p-4">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {{ getLocalizedName(extra.description) || '-' }}
            </p>

            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">{{
                  $t('extra.fields.category')
                }}</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ $t(`extra.extraCategories.${extra.category}`) }}
                </span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">{{
                  $t('extra.fields.priceType')
                }}</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ $t(`extra.priceTypes.${extra.priceType}`) }}
                </span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">{{ $t('extra.fields.price') }}</span>
                <span class="font-medium text-purple-600 dark:text-purple-400">
                  {{ formatCurrency(extra.defaultPrice, extra.currency || 'TRY') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Extra Actions -->
          <div
            class="p-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ extra.applicableTours?.length || 0 }} {{ $t('tour.tours').toLowerCase() }}
              </span>
              <div class="flex items-center space-x-2">
                <button
                  @click="openExtraModal(extra)"
                  class="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600"
                  :title="$t('common.edit')"
                >
                  <span class="material-icons text-sm">edit</span>
                </button>
                <button
                  @click="confirmDeleteExtra(extra)"
                  class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600"
                  :title="$t('common.delete')"
                >
                  <span class="material-icons text-sm">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Extra Modal -->
      <Modal
        v-model="showModal"
        :title="editingExtra ? $t('extra.editExtra') : $t('extra.newExtra')"
        size="lg"
      >
        <form @submit.prevent="saveExtra" class="space-y-6">
          <!-- Code -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('extra.fields.code') }} *
            </label>
            <input
              type="text"
              v-model="extraForm.code"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              placeholder="EXT001"
            />
          </div>

          <!-- Name (Multi-lang) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('extra.fields.name') }} *
            </label>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500 w-8">TR</span>
                <input
                  type="text"
                  v-model="extraForm.name.tr"
                  required
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500 w-8">EN</span>
                <input
                  type="text"
                  v-model="extraForm.name.en"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <!-- Description (Multi-lang) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('extra.fields.description') }}
            </label>
            <div class="space-y-2">
              <div class="flex items-start gap-2">
                <span class="text-xs text-gray-500 w-8 pt-2">TR</span>
                <textarea
                  v-model="extraForm.description.tr"
                  rows="2"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                ></textarea>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-xs text-gray-500 w-8 pt-2">EN</span>
                <textarea
                  v-model="extraForm.description.en"
                  rows="2"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Category & Price Type -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('extra.fields.category') }} *
              </label>
              <select
                v-model="extraForm.category"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              >
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                  {{ cat.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('extra.fields.priceType') }} *
              </label>
              <select
                v-model="extraForm.priceType"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              >
                <option value="per_person">{{ $t('extra.priceTypes.per_person') }}</option>
                <option value="per_group">{{ $t('extra.priceTypes.per_group') }}</option>
                <option value="per_unit">{{ $t('extra.priceTypes.per_unit') }}</option>
                <option value="per_night">{{ $t('extra.priceTypes.per_night') }}</option>
              </select>
            </div>
          </div>

          <!-- Price & Currency -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('extra.fields.price') }} *
              </label>
              <input
                type="number"
                v-model.number="extraForm.defaultPrice"
                min="0"
                step="0.01"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('extra.fields.currency') }}
              </label>
              <select
                v-model="extraForm.currency"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <!-- Applicable Tours -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('extra.applicableTours.title') }}
            </label>
            <div class="flex items-center mb-2">
              <input
                type="checkbox"
                id="allTours"
                v-model="applyToAllTours"
                class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label for="allTours" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {{ $t('extra.applicableTours.all') }}
              </label>
            </div>
            <div
              v-if="!applyToAllTours"
              class="border border-gray-200 dark:border-slate-600 rounded-lg max-h-40 overflow-y-auto"
            >
              <div
                v-for="tour in tours"
                :key="tour._id"
                class="px-3 py-2 flex items-center hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                <input
                  type="checkbox"
                  :id="`tour-${tour._id}`"
                  :value="tour._id"
                  v-model="extraForm.applicableTours"
                  class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label
                  :for="`tour-${tour._id}`"
                  class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  {{ tour.name }} ({{ tour.code }})
                </label>
              </div>
            </div>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('extra.fields.status') }}
            </label>
            <select
              v-model="extraForm.status"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              <option value="active">{{ $t('common.active') }}</option>
              <option value="inactive">{{ $t('common.inactive') }}</option>
            </select>
          </div>

          <!-- Actions -->
          <div
            class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700"
          >
            <BaseButton variant="secondary" @click="showModal = false">
              {{ $t('common.cancel') }}
            </BaseButton>
            <BaseButton type="submit" :loading="saving">
              {{ $t('common.save') }}
            </BaseButton>
          </div>
        </form>
      </Modal>

      <!-- Delete Confirmation -->
      <ConfirmDialog
        v-model="showDeleteConfirm"
        :title="$t('common.delete')"
        :message="$t('tour.deleteConfirm')"
        variant="danger"
        @confirm="deleteExtra"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTourStore } from '@/stores/tour'
import { formatCurrency } from '@booking-engine/utils'
import { BaseButton, StatusBadge, Modal, ConfirmDialog, Spinner } from '@/components/ui'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'

const { t, locale } = useI18n()
const tourStore = useTourStore()

// State
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editingExtra = ref(null)
const deletingExtra = ref(null)
const searchQuery = ref('')
const applyToAllTours = ref(true)

// Filters
const filters = ref({
  category: '',
  status: ''
})

// Form
const extraForm = ref(getEmptyForm())

function getEmptyForm() {
  return {
    code: '',
    name: { tr: '', en: '' },
    description: { tr: '', en: '' },
    category: 'activity',
    priceType: 'per_person',
    defaultPrice: 0,
    currency: 'TRY',
    applicableTours: [],
    status: 'active'
  }
}

// Computed
const extras = computed(() => tourStore.extras)
const tours = computed(() => tourStore.tours)

const navItems = computed(() => [
  { label: t('tour.tourList'), icon: 'tour', to: '/tours' },
  { label: t('departure.calendar'), icon: 'calendar_month', to: '/tours/departures' },
  { label: t('extra.extras'), icon: 'add_circle', to: '/tours/extras' },
  { label: t('tourBooking.bookings'), icon: 'book_online', to: '/tours/bookings' }
])

const activeCount = computed(() => extras.value.filter(e => e.status === 'active').length)

const categories = computed(() => [
  { value: 'activity', label: t('extra.extraCategories.activity') },
  { value: 'meal', label: t('extra.extraCategories.meal') },
  { value: 'transfer', label: t('extra.extraCategories.transfer') },
  { value: 'upgrade', label: t('extra.extraCategories.upgrade') },
  { value: 'visa', label: t('extra.extraCategories.visa') },
  { value: 'insurance', label: t('extra.extraCategories.insurance') },
  { value: 'equipment', label: t('extra.extraCategories.equipment') },
  { value: 'other', label: t('extra.extraCategories.other') }
])

const filteredExtras = computed(() => {
  let result = [...extras.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(e => {
      const name = getLocalizedName(e.name).toLowerCase()
      const code = (e.code || '').toLowerCase()
      return name.includes(query) || code.includes(query)
    })
  }

  if (filters.value.category) {
    result = result.filter(e => e.category === filters.value.category)
  }

  if (filters.value.status) {
    result = result.filter(e => e.status === filters.value.status)
  }

  return result
})

const extraStatusMap = {
  active: { label: t('common.active'), color: 'green' },
  inactive: { label: t('common.inactive'), color: 'gray' }
}

// Methods
function categoryCount(category) {
  return extras.value.filter(e => e.category === category).length
}

function getLocalizedName(obj) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj[locale.value] || obj.tr || obj.en || ''
}

function getCategoryIcon(category) {
  const icons = {
    activity: 'local_activity',
    meal: 'restaurant',
    transfer: 'airport_shuttle',
    upgrade: 'upgrade',
    visa: 'article',
    insurance: 'health_and_safety',
    equipment: 'backpack',
    other: 'extension'
  }
  return icons[category] || 'extension'
}

function getCategoryColor(category) {
  const colors = {
    activity: 'bg-blue-500',
    meal: 'bg-orange-500',
    transfer: 'bg-green-500',
    upgrade: 'bg-purple-500',
    visa: 'bg-red-500',
    insurance: 'bg-teal-500',
    equipment: 'bg-yellow-500',
    other: 'bg-gray-500'
  }
  return colors[category] || 'bg-gray-500'
}

function openExtraModal(extra = null) {
  if (extra) {
    editingExtra.value = extra
    extraForm.value = {
      code: extra.code || '',
      name: { tr: extra.name?.tr || '', en: extra.name?.en || '' },
      description: { tr: extra.description?.tr || '', en: extra.description?.en || '' },
      category: extra.category || 'activity',
      priceType: extra.priceType || 'per_person',
      defaultPrice: extra.defaultPrice || 0,
      currency: extra.currency || 'TRY',
      applicableTours: extra.applicableTours?.map(t => t._id || t) || [],
      status: extra.status || 'active'
    }
    applyToAllTours.value = !extra.applicableTours || extra.applicableTours.length === 0
  } else {
    editingExtra.value = null
    extraForm.value = getEmptyForm()
    applyToAllTours.value = true
  }
  showModal.value = true
}

async function saveExtra() {
  saving.value = true
  try {
    const data = {
      ...extraForm.value,
      applicableTours: applyToAllTours.value ? [] : extraForm.value.applicableTours
    }

    if (editingExtra.value) {
      await tourStore.updateExtra(editingExtra.value._id, data)
    } else {
      await tourStore.createExtra(data)
    }
    showModal.value = false
  } finally {
    saving.value = false
  }
}

function confirmDeleteExtra(extra) {
  deletingExtra.value = extra
  showDeleteConfirm.value = true
}

async function deleteExtra() {
  if (deletingExtra.value) {
    await tourStore.deleteExtra(deletingExtra.value._id)
    deletingExtra.value = null
  }
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([tourStore.fetchTours(), tourStore.fetchExtras()])
  } finally {
    loading.value = false
  }
})
</script>
