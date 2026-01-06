<template>
  <div class="p-4 border-b border-gray-200 dark:border-slate-700">
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <!-- Search & Filters -->
      <div class="flex flex-col sm:flex-row gap-3 flex-1">
        <!-- Search -->
        <div class="relative flex-1 max-w-md">
          <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            >search</span
          >
          <input
            :value="searchQuery"
            type="text"
            class="form-input pl-10 w-full"
            :placeholder="$t('agencies.searchPlaceholder')"
            @input="$emit('update:searchQuery', $event.target.value); $emit('search')"
          />
          <button
            v-if="searchQuery"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            @click="$emit('update:searchQuery', ''); $emit('filter')"
          >
            <span class="material-icons text-sm">close</span>
          </button>
        </div>

        <!-- Status Filter -->
        <select
          :value="statusFilter"
          class="form-input w-full sm:w-40"
          @change="$emit('update:statusFilter', $event.target.value); $emit('filter')"
        >
          <option value="">{{ $t('agencies.allStatuses') }}</option>
          <option value="active">{{ $t('common.active') }}</option>
          <option value="inactive">{{ $t('common.inactive') }}</option>
          <option value="pending">{{ $t('common.pending') }}</option>
          <option value="suspended">{{ $t('agencies.suspended') }}</option>
        </select>

        <!-- Credit Filter -->
        <select
          :value="creditFilter"
          class="form-input w-full sm:w-44"
          @change="$emit('update:creditFilter', $event.target.value); $emit('filter')"
        >
          <option value="">{{ $t('agencies.allCredits') }}</option>
          <option value="enabled">{{ $t('agencies.creditEnabled') }}</option>
          <option value="disabled">{{ $t('agencies.creditDisabled') }}</option>
          <option value="low">{{ $t('agencies.lowCredit') }}</option>
        </select>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <button
          class="p-2.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          :title="$t('common.refresh')"
          @click="$emit('refresh')"
        >
          <span class="material-icons" :class="{ 'animate-spin': loading }">refresh</span>
        </button>
        <button class="btn-primary flex items-center gap-2" @click="$emit('create')">
          <span class="material-icons text-lg">add</span>
          <span class="hidden sm:inline">{{ $t('agencies.addAgency') }}</span>
        </button>
      </div>
    </div>

    <!-- Active Filters -->
    <div
      v-if="hasActiveFilters"
      class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700"
    >
      <span class="text-sm text-gray-500 dark:text-slate-400"
        >{{ $t('common.activeFilters') }}:</span
      >
      <span
        v-if="searchQuery"
        class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm"
      >
        {{ $t('common.search') }}: "{{ searchQuery }}"
        <button
          class="hover:text-purple-900 dark:hover:text-purple-100"
          @click="$emit('update:searchQuery', ''); $emit('filter')"
        >
          <span class="material-icons text-sm">close</span>
        </button>
      </span>
      <span
        v-if="statusFilter"
        class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
      >
        {{ $t('common.status.label') }}: {{ getStatusLabel(statusFilter) }}
        <button
          class="hover:text-blue-900 dark:hover:text-blue-100"
          @click="$emit('update:statusFilter', ''); $emit('filter')"
        >
          <span class="material-icons text-sm">close</span>
        </button>
      </span>
      <span
        v-if="creditFilter"
        class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm"
      >
        {{ $t('agencies.creditLimit') }}: {{ getCreditFilterLabel(creditFilter) }}
        <button
          class="hover:text-green-900 dark:hover:text-green-100"
          @click="$emit('update:creditFilter', ''); $emit('filter')"
        >
          <span class="material-icons text-sm">close</span>
        </button>
      </span>
      <button
        class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
        @click="$emit('clear-filters')"
      >
        <span class="material-icons text-sm">clear_all</span>
        {{ $t('common.clearAll') }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  searchQuery: { type: String, default: '' },
  statusFilter: { type: String, default: '' },
  creditFilter: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  hasActiveFilters: { type: Boolean, default: false },
  getStatusLabel: { type: Function, required: true },
  getCreditFilterLabel: { type: Function, required: true }
})

defineEmits([
  'update:searchQuery',
  'update:statusFilter',
  'update:creditFilter',
  'search',
  'filter',
  'clear-filters',
  'refresh',
  'create'
])
</script>
