<template>
  <div
    class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4 mb-4"
  >
    <div class="flex items-center gap-2 mb-1">
      <span class="material-icons text-blue-500">inventory_2</span>
      <label class="form-label mb-0">{{ $t('planning.markets.activeProducts') }}</label>
    </div>
    <p class="text-xs text-gray-500 dark:text-slate-400">
      {{ $t('planning.markets.activeProductsHint') }}
    </p>

    <!-- Active Room Types -->
    <div
      v-if="roomTypes.length"
      class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
    >
      <div class="flex items-center gap-2 mb-3">
        <span class="material-icons text-blue-500 text-sm">hotel</span>
        <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
          $t('planning.markets.activeRoomTypes')
        }}</label>
      </div>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="rt in roomTypes"
          :key="rt._id"
          class="relative flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm"
          :class="
            activeRoomTypes.includes(rt._id)
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
          "
        >
          <input
            type="checkbox"
            :checked="activeRoomTypes.includes(rt._id)"
            class="sr-only"
            @change="toggleRoomType(rt._id)"
          />
          <span>{{ rt.code }}</span>
          <span class="text-xs text-gray-500 dark:text-slate-400">{{
            rt.name?.[locale] || rt.name?.tr
          }}</span>
        </label>
      </div>
      <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
        <span class="material-icons text-xs">info</span>
        {{ $t('planning.markets.emptyMeansAll') }}
      </p>
    </div>

    <!-- Active Meal Plans -->
    <div
      v-if="mealPlans.length"
      class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
    >
      <div class="flex items-center gap-2 mb-3">
        <span class="material-icons text-green-500 text-sm">restaurant</span>
        <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
          $t('planning.markets.activeMealPlans')
        }}</label>
      </div>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="mp in mealPlans"
          :key="mp._id"
          class="relative flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm"
          :class="
            activeMealPlans.includes(mp._id)
              ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
          "
        >
          <input
            type="checkbox"
            :checked="activeMealPlans.includes(mp._id)"
            class="sr-only"
            @change="toggleMealPlan(mp._id)"
          />
          <span>{{ mp.code }}</span>
          <span class="text-xs text-gray-500 dark:text-slate-400">{{
            mp.name?.[locale] || mp.name?.tr
          }}</span>
        </label>
      </div>
      <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
        <span class="material-icons text-xs">info</span>
        {{ $t('planning.markets.emptyMeansAll') }}
      </p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  activeRoomTypes: { type: Array, default: () => [] },
  activeMealPlans: { type: Array, default: () => [] },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  locale: { type: String, default: 'tr' }
})

const emit = defineEmits(['update:activeRoomTypes', 'update:activeMealPlans'])

const toggleRoomType = id => {
  const newList = props.activeRoomTypes.includes(id)
    ? props.activeRoomTypes.filter(x => x !== id)
    : [...props.activeRoomTypes, id]
  emit('update:activeRoomTypes', newList)
}

const toggleMealPlan = id => {
  const newList = props.activeMealPlans.includes(id)
    ? props.activeMealPlans.filter(x => x !== id)
    : [...props.activeMealPlans, id]
  emit('update:activeMealPlans', newList)
}
</script>
