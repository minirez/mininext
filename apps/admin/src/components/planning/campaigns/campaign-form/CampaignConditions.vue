<template>
  <div class="space-y-3">
    <!-- Markets Selection -->
    <div
      class="p-3 rounded-lg border-2 transition-colors"
      :class="
        validationErrors.markets
          ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      "
    >
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span
            class="material-icons text-sm"
            :class="validationErrors.markets ? 'text-red-500' : 'text-blue-500'"
            >public</span
          >
          <span class="font-medium text-sm text-gray-800 dark:text-white"
            >{{ $t('planning.campaigns.applicableMarkets') }}
            <span class="text-red-500">*</span></span
          >
          <span class="text-xs text-gray-500"
            >({{ form.conditions.applicableMarkets.length }}/{{ markets.length }})</span
          >
        </div>
        <button
          type="button"
          class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
          @click="$emit('toggle-all-markets')"
        >
          {{
            form.conditions.applicableMarkets.length === markets.length
              ? $t('planning.campaigns.deselectAll')
              : $t('planning.campaigns.selectAll')
          }}
        </button>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="market in markets"
          :key="market._id"
          type="button"
          class="px-2 py-1 rounded text-xs font-medium transition-all"
          :class="
            form.conditions.applicableMarkets.includes(market._id)
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-blue-400'
          "
          @click="$emit('toggle-market', market._id); validationErrors.markets = false"
        >
          {{ market.code }}
        </button>
      </div>
      <p v-if="validationErrors.markets" class="form-error mt-2">
        <span class="material-icons text-sm">error_outline</span>
        {{ $t('planning.campaigns.selectAtLeastOneMarket') }}
      </p>
    </div>

    <!-- Meal Plans & Room Types Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <!-- Meal Plans -->
      <div
        class="p-3 rounded-lg border-2 transition-colors"
        :class="
          validationErrors.mealPlans
            ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
        "
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span
              class="material-icons text-sm"
              :class="validationErrors.mealPlans ? 'text-red-500' : 'text-emerald-500'"
              >restaurant</span
            >
            <span class="font-medium text-sm text-gray-800 dark:text-white"
              >{{ $t('planning.campaigns.applicableMealPlans') }}
              <span class="text-red-500">*</span></span
            >
            <span class="text-xs text-gray-500"
              >({{ form.conditions.applicableMealPlans.length }}/{{ mealPlans.length }})</span
            >
          </div>
          <button
            type="button"
            class="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            @click="$emit('toggle-all-meal-plans')"
          >
            {{
              form.conditions.applicableMealPlans.length === mealPlans.length
                ? $t('planning.campaigns.deselectAll')
                : $t('planning.campaigns.selectAll')
            }}
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="mp in mealPlans"
            :key="mp._id"
            type="button"
            class="px-2 py-1 rounded text-xs font-medium transition-all"
            :class="
              form.conditions.applicableMealPlans.includes(mp._id)
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-emerald-400'
            "
            @click="$emit('toggle-meal-plan', mp._id); validationErrors.mealPlans = false"
          >
            {{ mp.code }}
          </button>
        </div>
        <p v-if="validationErrors.mealPlans" class="form-error mt-2">
          <span class="material-icons text-sm">error_outline</span>
          {{ $t('planning.campaigns.selectAtLeastOneMealPlan') }}
        </p>
      </div>

      <!-- Room Types -->
      <div
        class="p-3 rounded-lg border-2 transition-colors"
        :class="
          validationErrors.roomTypes
            ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
            : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
        "
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span
              class="material-icons text-sm"
              :class="validationErrors.roomTypes ? 'text-red-500' : 'text-purple-500'"
              >bed</span
            >
            <span class="font-medium text-sm text-gray-800 dark:text-white"
              >{{ $t('planning.campaigns.applicableRoomTypes') }}
              <span class="text-red-500">*</span></span
            >
            <span class="text-xs text-gray-500"
              >({{ form.conditions.applicableRoomTypes.length }}/{{ roomTypes.length }})</span
            >
          </div>
          <button
            type="button"
            class="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
            @click="$emit('toggle-all-room-types')"
          >
            {{
              form.conditions.applicableRoomTypes.length === roomTypes.length
                ? $t('planning.campaigns.deselectAll')
                : $t('planning.campaigns.selectAll')
            }}
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="rt in roomTypes"
            :key="rt._id"
            type="button"
            class="px-2 py-1 rounded text-xs font-medium transition-all"
            :class="
              form.conditions.applicableRoomTypes.includes(rt._id)
                ? 'bg-purple-500 text-white'
                : 'bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-purple-400'
            "
            @click="$emit('toggle-room-type', rt._id); validationErrors.roomTypes = false"
          >
            {{ rt.code }}
          </button>
        </div>
        <p v-if="validationErrors.roomTypes" class="form-error mt-2">
          <span class="material-icons text-sm">error_outline</span>
          {{ $t('planning.campaigns.selectAtLeastOneRoomType') }}
        </p>
      </div>
    </div>

    <!-- Minimum Stay -->
    <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      <span class="material-icons text-gray-500 text-sm">hotel</span>
      <label class="text-sm text-gray-700 dark:text-slate-300">{{
        $t('planning.campaigns.minNights')
      }}</label>
      <input
        v-model.number="form.conditions.minNights"
        type="number"
        min="1"
        class="w-16 px-2 py-1 rounded border border-gray-300 dark:border-slate-600 text-center text-sm font-bold"
      />
      <span class="text-xs text-gray-500">{{ $t('planning.campaigns.minNightsHint') }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  form: { type: Object, required: true },
  validationErrors: { type: Object, required: true },
  markets: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  roomTypes: { type: Array, default: () => [] }
})

defineEmits([
  'toggle-market',
  'toggle-all-markets',
  'toggle-meal-plan',
  'toggle-all-meal-plans',
  'toggle-room-type',
  'toggle-all-room-types'
])
</script>
