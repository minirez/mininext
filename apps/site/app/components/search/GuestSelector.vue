<template>
  <div class="dropdown-panel p-4 min-w-[280px]">
    <!-- Adults -->
    <div class="flex items-center justify-between py-3">
      <div>
        <span class="text-sm font-medium text-gray-800">{{ $t('search.adults') }}</span>
        <span class="block text-xs text-gray-400">{{ $t('search.adultsHint') }}</span>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="searchStore.adults = Math.max(1, searchStore.adults - 1)"
          :disabled="searchStore.adults <= 1"
          class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-site-primary hover:text-site-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2.5"
          >
            <path stroke-linecap="round" d="M5 12h14" />
          </svg>
        </button>
        <span class="w-6 text-center text-sm font-semibold text-gray-800">{{
          searchStore.adults
        }}</span>
        <button
          type="button"
          @click="searchStore.adults = Math.min(10, searchStore.adults + 1)"
          :disabled="searchStore.adults >= 10"
          class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-site-primary hover:text-site-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2.5"
          >
            <path stroke-linecap="round" d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Children -->
    <div class="flex items-center justify-between py-3 border-t border-gray-100">
      <div>
        <span class="text-sm font-medium text-gray-800">{{ $t('search.children') }}</span>
        <span class="block text-xs text-gray-400">{{ $t('search.childrenHint') }}</span>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="searchStore.removeChild(searchStore.children.length - 1)"
          :disabled="searchStore.children.length === 0"
          class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-site-primary hover:text-site-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2.5"
          >
            <path stroke-linecap="round" d="M5 12h14" />
          </svg>
        </button>
        <span class="w-6 text-center text-sm font-semibold text-gray-800">{{
          searchStore.children.length
        }}</span>
        <button
          type="button"
          @click="searchStore.addChild(5)"
          :disabled="searchStore.children.length >= 6"
          class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-site-primary hover:text-site-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2.5"
          >
            <path stroke-linecap="round" d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Child ages -->
    <div v-if="searchStore.children.length" class="pt-3 border-t border-gray-100 space-y-2">
      <div v-for="(age, idx) in searchStore.children" :key="idx" class="flex items-center gap-3">
        <label class="text-xs text-gray-500 flex-1"
          >{{ $t('search.childAge') }} {{ idx + 1 }}</label
        >
        <select
          :value="age"
          @change="searchStore.setChildAge(idx, Number(($event.target as HTMLSelectElement).value))"
          class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-site-primary transition-colors bg-white"
        >
          <option v-for="a in 18" :key="a - 1" :value="a - 1">{{ a - 1 }}</option>
        </select>
      </div>
    </div>

    <!-- Done button -->
    <button
      type="button"
      @click="$emit('close')"
      class="w-full mt-4 py-2.5 text-sm font-semibold text-white bg-site-primary hover:bg-site-primary-dark rounded-xl transition-colors"
    >
      {{ $t('common.confirm') }}
    </button>
  </div>
</template>

<script setup lang="ts">
const searchStore = useSearchStore()
defineEmits<{ close: [] }>()
</script>
