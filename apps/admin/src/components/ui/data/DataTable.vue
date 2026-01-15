<template>
  <div class="ui-data-table">
    <!-- Header: Title, Actions, Filters -->
    <div
      v-if="showHeader"
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4"
    >
      <div class="flex items-center gap-3">
        <h2 v-if="title" class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </h2>
        <span v-if="showCount && total > 0" class="text-sm text-gray-500 dark:text-gray-400">
          ({{ total }} {{ countLabel || $t('common.records', 'kayit') }})
        </span>
      </div>

      <div class="flex items-center gap-2">
        <!-- Search -->
        <div v-if="searchable" class="relative">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder || $t('common.search', 'Ara...')"
            class="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <span
            class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-xl"
          >
            search
          </span>
          <button
            v-if="searchQuery"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            @click="searchQuery = ''"
          >
            <span class="material-icons text-lg">close</span>
          </button>
        </div>

        <!-- Filter Toggle -->
        <button
          v-if="filterable && filters.length > 0"
          class="p-2 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700"
          :class="{ 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300': hasActiveFilters }"
          @click="showFilters = !showFilters"
        >
          <span class="material-icons text-gray-600 dark:text-gray-300">filter_list</span>
          <span
            v-if="activeFilterCount > 0"
            class="ml-1 px-1.5 py-0.5 text-xs font-medium bg-indigo-600 text-white rounded-full"
          >
            {{ activeFilterCount }}
          </span>
        </button>

        <!-- View Toggle (Table/Card) -->
        <div
          v-if="responsive"
          class="flex border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden"
        >
          <button
            class="p-2"
            :class="
              viewMode === 'table'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
            "
            :title="$t('common.tableView', 'Tablo Görünümü')"
            @click="viewMode = 'table'"
          >
            <span class="material-icons text-xl">table_rows</span>
          </button>
          <button
            class="p-2"
            :class="
              viewMode === 'cards'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
            "
            :title="$t('common.cardView', 'Kart Görünümü')"
            @click="viewMode = 'cards'"
          >
            <span class="material-icons text-xl">grid_view</span>
          </button>
        </div>

        <!-- Actions Slot -->
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- Filters Panel -->
    <Transition name="slide-down">
      <div
        v-if="showFilters && filters.length > 0"
        class="mb-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700"
      >
        <div class="flex flex-wrap gap-4">
          <div v-for="filter in filters" :key="filter.key" class="flex-1 min-w-[200px]">
            <!-- Select Filter -->
            <template v-if="filter.type === 'select'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ filter.label }}
              </label>
              <select
                :value="filterValues[filter.key]"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                @change="updateFilter(filter.key, $event.target.value)"
              >
                <option value="">{{ filter.placeholder || $t('common.all', 'Tumü') }}</option>
                <option v-for="opt in filter.options" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </template>

            <!-- Date Filter -->
            <template v-else-if="filter.type === 'date'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ filter.label }}
              </label>
              <input
                type="date"
                :value="filterValues[filter.key]"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                @change="updateFilter(filter.key, $event.target.value)"
              />
            </template>

            <!-- Text Filter -->
            <template v-else>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ filter.label }}
              </label>
              <input
                type="text"
                :value="filterValues[filter.key]"
                :placeholder="filter.placeholder"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                @input="updateFilter(filter.key, $event.target.value)"
              />
            </template>
          </div>
        </div>

        <!-- Filter Actions -->
        <div
          class="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700"
        >
          <button
            class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg"
            @click="clearAllFilters"
          >
            {{ $t('common.clearFilters', 'Temizle') }}
          </button>
          <button
            class="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg"
            @click="applyFilters"
          >
            {{ $t('common.apply', 'Uygula') }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Selection Bar -->
    <Transition name="slide-down">
      <div
        v-if="selectable && selectedCount > 0"
        class="mb-4 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center justify-between"
      >
        <span class="text-sm font-medium text-indigo-700 dark:text-indigo-300">
          {{ selectedCount }} {{ $t('common.selected', 'secili') }}
        </span>
        <div class="flex items-center gap-2">
          <slot name="bulk-actions" :selected="selected" :selected-items="selectedItems"></slot>
          <button
            class="px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded"
            @click="clearSelection"
          >
            {{ $t('common.clearSelection', 'Secimi Temizle') }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div
        class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"
      ></div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!data || data.length === 0"
      class="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-lg"
    >
      <slot name="empty">
        <span class="material-icons text-5xl text-gray-300 dark:text-slate-600 mb-3">
          {{ emptyIcon || 'inbox' }}
        </span>
        <p class="text-gray-500 dark:text-gray-400">
          {{ emptyText || $t('common.noData', 'Veri bulunamadi') }}
        </p>
        <slot name="empty-action"></slot>
      </slot>
    </div>

    <!-- Table View -->
    <div
      v-else-if="viewMode === 'table'"
      class="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700"
    >
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-slate-800">
          <tr>
            <!-- Select All Checkbox -->
            <th v-if="selectable" class="w-12 px-4 py-3">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                @change="toggleSelectAll"
              />
            </th>

            <!-- Column Headers -->
            <th
              v-for="col in visibleColumns"
              :key="col.key"
              class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
              :class="[
                col.class,
                col.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700' : ''
              ]"
              :style="col.width ? { width: col.width } : {}"
              @click="col.sortable && toggleSort(col.key)"
            >
              <div class="flex items-center gap-1">
                {{ col.label }}
                <span v-if="col.sortable" class="material-icons text-sm">
                  {{ getSortIcon(col.key) }}
                </span>
              </div>
            </th>

            <!-- Actions Column -->
            <th v-if="$slots['row-actions']" class="w-24 px-4 py-3 text-right">
              <span class="sr-only">{{ $t('common.actions', 'Islemler') }}</span>
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
          <tr
            v-for="(row, index) in data"
            :key="getRowKey(row, index)"
            class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            :class="[
              rowClass ? rowClass(row) : '',
              isRowSelected(row) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
            ]"
            @click="handleRowClick(row, $event)"
          >
            <!-- Row Checkbox -->
            <td v-if="selectable" class="w-12 px-4 py-3" @click.stop>
              <input
                type="checkbox"
                :checked="isRowSelected(row)"
                class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                @change="toggleRowSelect(row, $event)"
              />
            </td>

            <!-- Data Cells -->
            <td
              v-for="col in visibleColumns"
              :key="col.key"
              class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
              :class="col.cellClass"
            >
              <slot
                :name="`cell-${col.key}`"
                :row="row"
                :value="getCellValue(row, col.key)"
                :index="index"
              >
                <component
                  :is="col.component"
                  v-if="col.component"
                  :value="getCellValue(row, col.key)"
                  :row="row"
                  v-bind="col.componentProps"
                />
                <template v-else-if="col.format">
                  {{ col.format(getCellValue(row, col.key), row) }}
                </template>
                <template v-else>
                  {{ getCellValue(row, col.key) }}
                </template>
              </slot>
            </td>

            <!-- Row Actions -->
            <td v-if="$slots['row-actions']" class="px-4 py-3 text-right" @click.stop>
              <slot name="row-actions" :row="row" :index="index"></slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Card View -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="(row, index) in data"
        :key="getRowKey(row, index)"
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow"
        :class="isRowSelected(row) ? 'ring-2 ring-indigo-500' : ''"
        @click="handleRowClick(row, $event)"
      >
        <!-- Card Header -->
        <div
          class="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center gap-3">
            <input
              v-if="selectable"
              type="checkbox"
              :checked="isRowSelected(row)"
              class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              @change.stop="toggleRowSelect(row, $event)"
              @click.stop
            />
            <slot name="card-header" :row="row" :index="index">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ getCellValue(row, cardTitleKey) || `#${index + 1}` }}
              </span>
            </slot>
          </div>
          <div v-if="$slots['row-actions']" @click.stop>
            <slot name="row-actions" :row="row" :index="index"></slot>
          </div>
        </div>

        <!-- Card Body -->
        <div class="p-4 space-y-2">
          <slot name="card-body" :row="row" :index="index">
            <div
              v-for="col in cardColumns"
              :key="col.key"
              class="flex items-start justify-between text-sm"
            >
              <span class="text-gray-500 dark:text-gray-400">{{ col.label }}</span>
              <span class="text-gray-900 dark:text-white text-right">
                <slot
                  :name="`cell-${col.key}`"
                  :row="row"
                  :value="getCellValue(row, col.key)"
                  :index="index"
                >
                  <template v-if="col.format">
                    {{ col.format(getCellValue(row, col.key), row) }}
                  </template>
                  <template v-else>
                    {{ getCellValue(row, col.key) || '-' }}
                  </template>
                </slot>
              </span>
            </div>
          </slot>
        </div>

        <!-- Card Footer -->
        <div
          v-if="$slots['card-footer']"
          class="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700"
        >
          <slot name="card-footer" :row="row" :index="index"></slot>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="paginated && total > 0"
      class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-4 pt-4 border-t border-gray-200 dark:border-slate-700"
    >
      <!-- Info + View Toggle (for mobile when header is hidden) -->
      <div class="flex items-center gap-3">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          {{ from }}-{{ to }} / {{ total }} {{ countLabel || $t('common.records', 'kayit') }}
        </div>
        <!-- View Toggle in pagination (visible when header is hidden) -->
        <div
          v-if="responsive && !showHeader"
          class="flex border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden"
        >
          <button
            class="p-1.5"
            :class="
              viewMode === 'table'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
            "
            :title="$t('common.tableView', 'Tablo Görünümü')"
            @click="viewMode = 'table'"
          >
            <span class="material-icons text-lg">table_rows</span>
          </button>
          <button
            class="p-1.5"
            :class="
              viewMode === 'cards'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
            "
            :title="$t('common.cardView', 'Kart Görünümü')"
            @click="viewMode = 'cards'"
          >
            <span class="material-icons text-lg">grid_view</span>
          </button>
        </div>
      </div>

      <!-- Per Page -->
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600 dark:text-gray-400">
          {{ $t('common.perPage', 'Sayfa basina') }}:
        </label>
        <select
          :value="perPage"
          class="px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
          @change="handlePerPageChange($event.target.value)"
        >
          <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>

      <!-- Page Navigation -->
      <div class="flex items-center gap-1">
        <button
          :disabled="page === 1"
          class="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="goToPage(1)"
        >
          <span class="material-icons text-xl">first_page</span>
        </button>
        <button
          :disabled="page === 1"
          class="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="goToPage(page - 1)"
        >
          <span class="material-icons text-xl">chevron_left</span>
        </button>

        <div class="flex items-center gap-1 mx-2">
          <button
            v-for="p in pageRange"
            :key="p"
            class="w-8 h-8 rounded text-sm font-medium"
            :class="
              p === page
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
            "
            @click="goToPage(p)"
          >
            {{ p }}
          </button>
        </div>

        <button
          :disabled="page >= totalPages"
          class="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="goToPage(page + 1)"
        >
          <span class="material-icons text-xl">chevron_right</span>
        </button>
        <button
          :disabled="page >= totalPages"
          class="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="goToPage(totalPages)"
        >
          <span class="material-icons text-xl">last_page</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  // Data
  data: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    required: true
    // { key, label, sortable, width, class, cellClass, format, component, componentProps, hideOnCard }
  },
  rowKey: {
    type: [String, Function],
    default: '_id'
  },
  rowClass: {
    type: Function,
    default: null
  },

  // Header
  title: {
    type: String,
    default: ''
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  showCount: {
    type: Boolean,
    default: true
  },
  countLabel: {
    type: String,
    default: ''
  },

  // Loading & Empty
  loading: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: ''
  },
  emptyIcon: {
    type: String,
    default: 'inbox'
  },

  // Search
  searchable: {
    type: Boolean,
    default: false
  },
  searchPlaceholder: {
    type: String,
    default: ''
  },
  searchDebounce: {
    type: Number,
    default: 300
  },

  // Filters
  filterable: {
    type: Boolean,
    default: false
  },
  filters: {
    type: Array,
    default: () => []
    // { key, label, type: 'text'|'select'|'date', options, placeholder }
  },
  initialFilters: {
    type: Object,
    default: () => ({})
  },

  // Pagination
  paginated: {
    type: Boolean,
    default: true
  },
  page: {
    type: Number,
    default: 1
  },
  perPage: {
    type: Number,
    default: 10
  },
  total: {
    type: Number,
    default: 0
  },
  perPageOptions: {
    type: Array,
    default: () => [10, 25, 50, 100]
  },

  // Sorting
  sortKey: {
    type: String,
    default: ''
  },
  sortOrder: {
    type: String,
    default: 'asc'
  },

  // Selection
  selectable: {
    type: Boolean,
    default: false
  },
  selected: {
    type: Array,
    default: () => []
  },

  // Responsive
  responsive: {
    type: Boolean,
    default: true
  },
  defaultViewMode: {
    type: String,
    default: 'table'
  },
  cardTitleKey: {
    type: String,
    default: ''
  },
  mobileBreakpoint: {
    type: Number,
    default: 640
  },

  // Row Click
  clickable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:page',
  'update:perPage',
  'update:sortKey',
  'update:sortOrder',
  'update:selected',
  'search',
  'filter',
  'sort',
  'page-change',
  'row-click'
])

// State
const searchQuery = ref('')
const showFilters = ref(false)
const filterValues = ref({ ...props.initialFilters })
const viewMode = ref(props.defaultViewMode)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

// Debounce timeout
let searchTimeout = null

// Computed
const visibleColumns = computed(() => {
  return props.columns.filter(col => !col.hidden)
})

const cardColumns = computed(() => {
  return props.columns.filter(col => !col.hideOnCard && !col.hidden)
})

const totalPages = computed(() => {
  if (props.total === 0) return 1
  return Math.ceil(props.total / props.perPage)
})

const from = computed(() => {
  if (props.total === 0) return 0
  return (props.page - 1) * props.perPage + 1
})

const to = computed(() => {
  const end = props.page * props.perPage
  return Math.min(end, props.total)
})

const pageRange = computed(() => {
  const range = []
  const maxVisible = 5
  const half = Math.floor(maxVisible / 2)

  let start = Math.max(1, props.page - half)
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    range.push(i)
  }

  return range
})

const hasActiveFilters = computed(() => {
  return Object.values(filterValues.value).some(v => v !== '' && v !== null && v !== undefined)
})

const activeFilterCount = computed(() => {
  return Object.values(filterValues.value).filter(v => v !== '' && v !== null && v !== undefined)
    .length
})

const selectedCount = computed(() => props.selected.length)

const isAllSelected = computed(() => {
  if (!props.data || props.data.length === 0) return false
  return props.data.every(row => props.selected.includes(getRowKey(row)))
})

const isIndeterminate = computed(() => {
  if (!props.data || props.data.length === 0) return false
  const selectedInData = props.data.filter(row => props.selected.includes(getRowKey(row))).length
  return selectedInData > 0 && selectedInData < props.data.length
})

const selectedItems = computed(() => {
  return props.data.filter(row => props.selected.includes(getRowKey(row)))
})

// Methods
const getRowKey = (row, index) => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  return row[props.rowKey] || index
}

const getCellValue = (row, key) => {
  if (key.includes('.')) {
    return key.split('.').reduce((obj, k) => obj?.[k], row)
  }
  return row[key]
}

const getSortIcon = key => {
  if (props.sortKey !== key) return 'unfold_more'
  return props.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'
}

const toggleSort = key => {
  if (props.sortKey === key) {
    const newOrder = props.sortOrder === 'asc' ? 'desc' : 'asc'
    emit('update:sortOrder', newOrder)
    emit('sort', { key, order: newOrder })
  } else {
    emit('update:sortKey', key)
    emit('update:sortOrder', 'asc')
    emit('sort', { key, order: 'asc' })
  }
}

const goToPage = newPage => {
  if (newPage < 1 || newPage > totalPages.value) return
  emit('update:page', newPage)
  emit('page-change', { page: newPage, perPage: props.perPage })
}

const handlePerPageChange = newPerPage => {
  const perPage = parseInt(newPerPage)
  emit('update:perPage', perPage)
  emit('update:page', 1)
  emit('page-change', { page: 1, perPage })
}

const updateFilter = (key, value) => {
  filterValues.value[key] = value
}

const applyFilters = () => {
  emit('filter', { ...filterValues.value })
  emit('update:page', 1)
}

const clearAllFilters = () => {
  filterValues.value = {}
  emit('filter', {})
  emit('update:page', 1)
}

const isRowSelected = row => {
  return props.selected.includes(getRowKey(row))
}

const toggleRowSelect = row => {
  const key = getRowKey(row)
  const newSelected = [...props.selected]
  const index = newSelected.indexOf(key)

  if (index === -1) {
    newSelected.push(key)
  } else {
    newSelected.splice(index, 1)
  }

  emit('update:selected', newSelected)
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // Deselect all in current page
    const currentKeys = props.data.map(row => getRowKey(row))
    const newSelected = props.selected.filter(key => !currentKeys.includes(key))
    emit('update:selected', newSelected)
  } else {
    // Select all in current page
    const currentKeys = props.data.map(row => getRowKey(row))
    const newSelected = [...new Set([...props.selected, ...currentKeys])]
    emit('update:selected', newSelected)
  }
}

const clearSelection = () => {
  emit('update:selected', [])
}

const handleRowClick = row => {
  if (props.clickable) {
    emit('row-click', row)
  }
}

// Search debounce
watch(searchQuery, newValue => {
  if (searchTimeout) clearTimeout(searchTimeout)

  searchTimeout = setTimeout(() => {
    emit('search', newValue)
    emit('update:page', 1)
  }, props.searchDebounce)
})

// Responsive view mode
const handleResize = () => {
  windowWidth.value = window.innerWidth
  if (props.responsive && windowWidth.value < props.mobileBreakpoint) {
    viewMode.value = 'cards'
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
    handleResize()
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
  if (searchTimeout) clearTimeout(searchTimeout)
})

// Expose
defineExpose({
  viewMode,
  clearSelection,
  clearAllFilters,
  applyFilters
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Checkbox indeterminate state */
input[type='checkbox']:indeterminate {
  background-color: #6366f1;
  border-color: #6366f1;
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3crect x='3' y='7' width='10' height='2' rx='1'/%3e%3c/svg%3e");
}
</style>
