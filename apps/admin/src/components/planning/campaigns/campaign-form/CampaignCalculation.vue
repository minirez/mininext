<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="space-y-3">
    <!-- Calculation Settings -->
    <div
      class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
    >
      <div class="flex items-center gap-2 mb-3">
        <span class="material-icons text-purple-500 text-sm">functions</span>
        <h4 class="font-medium text-sm text-gray-800 dark:text-white">
          {{ $t('planning.campaigns.calculationSettings') }}
        </h4>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <!-- Calculation Type -->
        <div>
          <label class="text-xs text-gray-600 dark:text-slate-400 mb-2 block">{{
            $t('planning.campaigns.calculationType')
          }}</label>
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 p-2 rounded-lg border text-center text-xs font-medium transition-all"
              :class="
                form.calculationType === 'cumulative'
                  ? 'bg-purple-500 border-purple-500 text-white'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-purple-400'
              "
              @click="form.calculationType = 'cumulative'"
            >
              <span
                class="material-icons text-base mb-0.5"
                :class="form.calculationType === 'cumulative' ? 'text-white' : 'text-purple-500'"
                >stacked_bar_chart</span
              >
              <span class="block">{{ $t('planning.campaigns.calculationTypeCumulative') }}</span>
            </button>
            <button
              type="button"
              class="flex-1 p-2 rounded-lg border text-center text-xs font-medium transition-all"
              :class="
                form.calculationType === 'sequential'
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-indigo-400'
              "
              @click="form.calculationType = 'sequential'"
            >
              <span
                class="material-icons text-base mb-0.5"
                :class="form.calculationType === 'sequential' ? 'text-white' : 'text-indigo-500'"
                >trending_down</span
              >
              <span class="block">{{ $t('planning.campaigns.calculationTypeSequential') }}</span>
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            {{
              form.calculationType === 'cumulative'
                ? $t('planning.campaigns.calculationTypeCumulativeHint')
                : $t('planning.campaigns.calculationTypeSequentialHint')
            }}
          </p>
        </div>

        <!-- Calculation Order -->
        <div>
          <label class="text-xs text-gray-600 dark:text-slate-400 mb-2 block">{{
            $t('planning.campaigns.calculationOrder')
          }}</label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="form.calculationOrder"
              type="number"
              min="0"
              max="99"
              class="w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-center text-lg font-bold bg-white dark:bg-slate-800"
            />
            <span class="text-xs text-gray-500">{{
              $t('planning.campaigns.calculationOrderHint')
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Application Type Toggle -->
    <div
      class="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800"
    >
      <div class="flex items-center gap-2 mb-3">
        <span class="material-icons text-indigo-500 text-sm">calculate</span>
        <h4 class="font-medium text-sm text-gray-800 dark:text-white">
          {{ $t('planning.campaigns.applicationType') }}
        </h4>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 p-3 rounded-lg border-2 text-left transition-all"
          :class="
            form.applicationType === 'stay'
              ? 'bg-indigo-500 border-indigo-500 text-white'
              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-indigo-400'
          "
          @click="form.applicationType = 'stay'"
        >
          <div class="flex items-center gap-2 mb-1">
            <span
              class="material-icons text-base"
              :class="form.applicationType === 'stay' ? 'text-white' : 'text-indigo-500'"
              >nights_stay</span
            >
            <span class="font-medium text-sm">{{
              $t('planning.campaigns.applicationTypeStay')
            }}</span>
          </div>
          <p
            class="text-xs"
            :class="form.applicationType === 'stay' ? 'text-indigo-100' : 'text-gray-500'"
          >
            {{ $t('planning.campaigns.applicationTypeStayHint') }}
          </p>
        </button>
        <button
          type="button"
          class="flex-1 p-3 rounded-lg border-2 text-left transition-all"
          :class="
            form.applicationType === 'checkin'
              ? 'bg-teal-500 border-teal-500 text-white'
              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-teal-400'
          "
          @click="form.applicationType = 'checkin'"
        >
          <div class="flex items-center gap-2 mb-1">
            <span
              class="material-icons text-base"
              :class="form.applicationType === 'checkin' ? 'text-white' : 'text-teal-500'"
              >login</span
            >
            <span class="font-medium text-sm">{{
              $t('planning.campaigns.applicationTypeCheckin')
            }}</span>
          </div>
          <p
            class="text-xs"
            :class="form.applicationType === 'checkin' ? 'text-teal-100' : 'text-gray-500'"
          >
            {{ $t('planning.campaigns.applicationTypeCheckinHint') }}
          </p>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  form: { type: Object, required: true }
})
</script>
