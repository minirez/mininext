<template>
  <div ref="rootRef" class="relative">
    <label v-if="label" class="form-label">{{ label }}</label>

    <div ref="inputRef" class="relative">
      <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        place
      </span>
      <input
        v-model="query"
        type="text"
        class="form-input w-full pl-10"
        :placeholder="placeholder"
        @focus="open = true"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="selectHighlighted()"
        @keydown.esc="open = false"
      />

      <button
        v-if="modelValue"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        :title="$t('common.clear')"
        @click="clear"
      >
        <span class="material-icons text-sm">close</span>
      </button>
    </div>

    <!-- Dropdown rendered with fixed positioning to escape overflow:hidden containers -->
    <Teleport to="body">
      <div
        v-if="open"
        ref="dropdownRef"
        class="fixed z-[9999] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden flex flex-col"
        :style="dropdownStyle"
      >
        <div
          v-if="loading"
          class="p-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"
        >
          <span class="material-icons animate-spin text-base">refresh</span>
          {{ $t('common.loading') }}
        </div>

        <template v-else>
          <div
            v-if="!hasAnyResults && query.length < 2"
            class="p-3 text-sm text-gray-500 dark:text-gray-400"
          >
            {{ $t('common.typeToSearch') }}
          </div>

          <template v-else>
            <!-- Tree structure with type groups - height is dynamic based on viewport -->
            <div class="flex-1 overflow-y-auto min-h-0">
              <!-- Cities Group -->
              <div v-if="groupedResults.cities.length > 0">
                <div
                  class="sticky top-0 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2"
                >
                  <span class="material-icons text-sm text-purple-500">location_city</span>
                  {{ $t('locations.cities') }}
                  <span class="ml-auto text-gray-400">({{ groupedResults.cities.length }})</span>
                </div>
                <div class="max-h-[140px] overflow-y-auto">
                  <button
                    v-for="item in groupedResults.cities"
                    :key="`city-${item._id}`"
                    type="button"
                    class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    :class="
                      flatResults.indexOf(item) === highlighted ? 'bg-gray-100 dark:bg-slate-600' : ''
                    "
                    @click="select(item)"
                  >
                    <span class="material-icons text-sm text-purple-500">location_city</span>
                    <span class="flex-1 truncate">{{ item.name }}</span>
                  </button>
                </div>
              </div>

              <!-- Districts Group -->
              <div v-if="groupedResults.districts.length > 0">
                <div
                  class="sticky top-0 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2"
                >
                  <span class="material-icons text-sm text-blue-500">map</span>
                  {{ $t('locations.districts') }}
                  <span class="ml-auto text-gray-400">({{ groupedResults.districts.length }})</span>
                </div>
                <div class="max-h-[140px] overflow-y-auto">
                  <button
                    v-for="item in groupedResults.districts"
                    :key="`district-${item._id}`"
                    type="button"
                    class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    :class="
                      flatResults.indexOf(item) === highlighted ? 'bg-gray-100 dark:bg-slate-600' : ''
                    "
                    @click="select(item)"
                  >
                    <span class="material-icons text-sm text-blue-500">map</span>
                    <span class="flex-1 truncate">{{ item.name }}</span>
                  </button>
                </div>
              </div>

              <!-- Regions Group -->
              <div v-if="groupedResults.regions.length > 0">
                <div
                  class="sticky top-0 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2"
                >
                  <span class="material-icons text-sm text-green-500">terrain</span>
                  {{ $t('locations.regions') }}
                  <span class="ml-auto text-gray-400">({{ groupedResults.regions.length }})</span>
                </div>
                <div class="max-h-[140px] overflow-y-auto">
                  <button
                    v-for="item in groupedResults.regions"
                    :key="`region-${item._id}`"
                    type="button"
                    class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    :class="
                      flatResults.indexOf(item) === highlighted ? 'bg-gray-100 dark:bg-slate-600' : ''
                    "
                    @click="select(item)"
                  >
                    <span class="material-icons text-sm text-green-500">terrain</span>
                    <span class="flex-1 truncate">{{ item.name }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Create new option - fixed at bottom -->
            <div
              v-if="allowCreate && query.length >= 2"
              class="flex-shrink-0 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <button
                type="button"
                class="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors"
                @click="openCreateModal"
              >
                <span class="material-icons text-base">add_circle</span>
                <span>{{ $t('locations.createNew') }}: "{{ query }}"</span>
              </button>
            </div>
          </template>
        </template>
      </div>
    </Teleport>

    <!-- Create Location Modal -->
    <Modal v-model="showCreateModal" :title="$t('locations.createNew')" size="md">
      <div class="space-y-4">
        <div>
          <label class="form-label">{{ $t('locations.name') }}</label>
          <input
            v-model="createForm.name"
            type="text"
            class="form-input w-full"
            :placeholder="$t('locations.name')"
          />
        </div>

        <div>
          <label class="form-label">{{ $t('locations.type') }}</label>
          <select v-model="createForm.type" class="form-input w-full">
            <option value="city">{{ $t('locations.city') }}</option>
            <option value="region">{{ $t('locations.tourismRegion') }}</option>
          </select>
        </div>

        <div v-if="createForm.type === 'city'">
          <label class="form-label">{{ $t('locations.countryCode') }}</label>
          <input
            v-model="createForm.countryCode"
            type="text"
            class="form-input w-full uppercase"
            placeholder="TR"
            maxlength="2"
          />
        </div>

        <div v-if="createForm.type === 'region'">
          <label class="form-label">{{ $t('locations.selectCity') }}</label>
          <select v-model="createForm.cityId" class="form-input w-full">
            <option value="">-- {{ $t('locations.selectCity') }} --</option>
            <option v-for="city in availableCities" :key="city._id" :value="city._id">
              {{ city.name }}
            </option>
          </select>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn-secondary" @click="showCreateModal = false">
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          class="btn-primary"
          :disabled="!canCreate || isCreating"
          @click="createLocation"
        >
          <span v-if="isCreating" class="material-icons animate-spin mr-1 text-sm">refresh</span>
          {{ $t('common.create') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import debounce from 'lodash/debounce'
import { searchLocations, getCities, createCity, createRegion } from '@/services/locationService'
import Modal from '@/components/common/Modal.vue'

const { t } = useI18n()
const toast = useToast()

const props = defineProps({
  modelValue: { type: Object, default: null },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  country: { type: String, default: 'TR' },
  types: { type: Array, default: () => ['all'] },
  allowCreate: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'select'])

const rootRef = ref(null)
const inputRef = ref(null)
const dropdownRef = ref(null)
const open = ref(false)
const query = ref('')
const loading = ref(false)
const rawResults = ref({ cities: [], districts: [], regions: [] })
const highlighted = ref(0)
const dropdownPosition = ref({ top: 0, left: 0, width: 0, maxHeight: 300, openAbove: false })

// Compute dropdown style based on input position
const dropdownStyle = computed(() => ({
  top: dropdownPosition.value.openAbove ? 'auto' : `${dropdownPosition.value.top}px`,
  bottom: dropdownPosition.value.openAbove ? `${dropdownPosition.value.bottom}px` : 'auto',
  left: `${dropdownPosition.value.left}px`,
  width: `${dropdownPosition.value.width}px`,
  maxWidth: '490px',
  maxHeight: `${dropdownPosition.value.maxHeight}px`
}))

// Update dropdown position when open
function updateDropdownPosition() {
  if (!inputRef.value) return
  const rect = inputRef.value.getBoundingClientRect()
  const gap = 4
  const preferredMaxHeight = 490
  
  const spaceBelow = window.innerHeight - rect.bottom - gap
  const spaceAbove = rect.top - gap
  
  // Open above if not enough space below for preferred height, and more space above
  const openAbove = spaceBelow < preferredMaxHeight && spaceAbove > spaceBelow
  const availableSpace = openAbove ? spaceAbove : spaceBelow
  
  // Use preferred height unless constrained by viewport
  const maxHeight = Math.min(preferredMaxHeight, availableSpace)
  
  dropdownPosition.value = {
    top: rect.bottom + gap,
    bottom: window.innerHeight - rect.top + gap,
    left: rect.left,
    width: rect.width,
    maxHeight,
    openAbove
  }
}

watch(open, async val => {
  if (val) {
    await nextTick()
    updateDropdownPosition()
  }
})

// Create modal state
const showCreateModal = ref(false)
const isCreating = ref(false)
const availableCities = ref([])
const createForm = ref({
  name: '',
  type: 'city',
  countryCode: 'TR',
  cityId: ''
})

const canCreate = computed(() => {
  if (!createForm.value.name) return false
  if (createForm.value.type === 'city' && !createForm.value.countryCode) return false
  if (createForm.value.type === 'region' && !createForm.value.cityId) return false
  return true
})

// Grouped results for tree view
const groupedResults = computed(() => {
  const data = rawResults.value || {}

  const allowAll = props.types.includes('all')
  const allowCities = allowAll || props.types.includes('cities') || props.types.includes('city')
  const allowDistricts =
    allowAll || props.types.includes('districts') || props.types.includes('district')
  const allowRegions = allowAll || props.types.includes('regions') || props.types.includes('region')

  const cities = []
  const districts = []
  const regions = []

  if (allowCities) {
    for (const c of (data.cities || []).slice(0, 15)) {
      cities.push({
        type: 'city',
        _id: c._id,
        name: c.name,
        countryCode: c.countryCode,
        coordinates: c.coordinates,
        zoom: c.zoom
      })
    }
  }
  if (allowDistricts) {
    for (const d of (data.districts || []).slice(0, 15)) {
      districts.push({
        type: 'district',
        _id: d._id,
        name: d.name,
        countryCode: d.city?.countryCode,
        coordinates: d.coordinates,
        zoom: d.zoom
      })
    }
  }
  if (allowRegions) {
    for (const r of (data.regions || []).slice(0, 15)) {
      regions.push({
        type: 'region',
        _id: r._id,
        name: r.name,
        countryCode: r.city?.countryCode,
        coordinates: r.coordinates,
        zoom: r.zoom
      })
    }
  }

  return { cities, districts, regions }
})

// Flat results for keyboard navigation
const flatResults = computed(() => [
  ...groupedResults.value.cities,
  ...groupedResults.value.districts,
  ...groupedResults.value.regions
])

// Check if there are any results
const hasAnyResults = computed(() => flatResults.value.length > 0)

// Keep old results computed for backward compatibility with move/selectHighlighted
const results = computed(() => flatResults.value)

const doSearch = debounce(async () => {
  const q = query.value?.trim() || ''
  if (q.length < 2) {
    rawResults.value = { cities: [], districts: [], regions: [] }
    return
  }

  loading.value = true
  try {
    const resp = await searchLocations(q, { country: props.country, type: 'all' })
    rawResults.value = resp.data || { cities: [], districts: [], regions: [] }
    highlighted.value = 0
  } finally {
    loading.value = false
  }
}, 250)

watch(query, () => {
  open.value = true
  doSearch()
})

watch(
  () => props.modelValue,
  val => {
    if (val?.locationSnapshot?.name) {
      query.value = val.locationSnapshot.name
    } else if (val?.name) {
      query.value = val.name
    }
  },
  { immediate: true }
)

function select(item) {
  const selected = {
    locationRef: { type: item.type, refId: item._id },
    locationSnapshot: {
      name: item.name,
      countryCode: item.countryCode,
      coordinates: item.coordinates,
      zoom: item.zoom
    }
  }
  emit('update:modelValue', selected)
  emit('select', selected)
  open.value = false
}

function clear() {
  emit('update:modelValue', null)
  query.value = ''
  rawResults.value = { cities: [], districts: [], regions: [] }
  open.value = false
}

function move(dir) {
  const len = results.value.length
  if (!len) return
  highlighted.value = (highlighted.value + dir + len) % len
}

function selectHighlighted() {
  const item = results.value[highlighted.value]
  if (item) select(item)
}

function getTypeIcon(type) {
  if (type === 'city') return 'location_city'
  if (type === 'district') return 'map'
  return 'terrain'
}

function getTypeColor(type) {
  if (type === 'city') return 'text-purple-500'
  if (type === 'district') return 'text-blue-500'
  return 'text-green-500'
}

async function openCreateModal() {
  createForm.value = {
    name: query.value,
    type: 'city',
    countryCode: props.country || 'TR',
    cityId: ''
  }

  // Load cities for region creation
  try {
    const resp = await getCities(props.country || 'TR')
    availableCities.value = resp.data || []
  } catch (e) {
    availableCities.value = []
  }

  showCreateModal.value = true
  open.value = false
}

async function createLocation() {
  if (!canCreate.value) return

  isCreating.value = true
  try {
    let created
    if (createForm.value.type === 'city') {
      const resp = await createCity({
        name: createForm.value.name,
        countryCode: createForm.value.countryCode.toUpperCase()
      })
      created = { ...resp.data, type: 'city' }
    } else {
      const resp = await createRegion({
        name: createForm.value.name,
        city: createForm.value.cityId
      })
      created = { ...resp.data, type: 'region' }
    }

    toast.success(t('locations.created'))
    showCreateModal.value = false

    // Auto-select the created location
    select({
      type: created.type,
      _id: created._id,
      name: created.name,
      countryCode: created.countryCode || created.city?.countryCode,
      coordinates: created.coordinates,
      zoom: created.zoom
    })
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    isCreating.value = false
  }
}

function onClickOutside(e) {
  if (!rootRef.value) return
  // Don't close if clicking inside modal
  if (showCreateModal.value) return
  // Don't close if clicking inside dropdown (which is teleported to body)
  if (dropdownRef.value?.contains(e.target)) return
  if (!rootRef.value.contains(e.target)) {
    open.value = false
  }
}

function onScrollOrResize() {
  if (open.value) {
    updateDropdownPosition()
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})
</script>
