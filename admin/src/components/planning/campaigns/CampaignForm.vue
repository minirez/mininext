<template>
  <div class="space-y-4">
    <!-- Status & Combinable Row -->
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- Status Toggle -->
      <div class="flex-1 flex items-center justify-between p-3 rounded-lg border"
           :class="form.status === 'active'
             ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
             : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'">
        <div class="flex items-center gap-2">
          <span class="material-icons text-sm" :class="form.status === 'active' ? 'text-green-500' : 'text-gray-400'">
            {{ form.status === 'active' ? 'check_circle' : 'pause_circle' }}
          </span>
          <span class="text-sm font-medium" :class="form.status === 'active' ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-slate-400'">
            {{ form.status === 'active' ? $t('planning.campaigns.statusActive') : $t('planning.campaigns.statusInactive') }}
          </span>
        </div>
        <button type="button" @click="toggleStatus"
                class="relative w-10 h-5 rounded-full transition-colors"
                :class="form.status === 'active' ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'">
          <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                :class="form.status === 'active' ? 'translate-x-5' : ''"></span>
        </button>
      </div>

      <!-- Combinable Toggle -->
      <div class="flex-1 flex items-center justify-between p-3 rounded-lg border"
           :class="form.combinable
             ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
             : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'">
        <div class="flex items-center gap-2">
          <span class="material-icons text-sm" :class="form.combinable ? 'text-purple-500' : 'text-gray-400'">link</span>
          <span class="text-sm font-medium" :class="form.combinable ? 'text-purple-700 dark:text-purple-400' : 'text-gray-600 dark:text-slate-400'">
            {{ $t('planning.campaigns.combinable') }}
          </span>
        </div>
        <button type="button" @click="form.combinable = !form.combinable"
                class="relative w-10 h-5 rounded-full transition-colors"
                :class="form.combinable ? 'bg-purple-500' : 'bg-gray-300 dark:bg-slate-600'">
          <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                :class="form.combinable ? 'translate-x-5' : ''"></span>
        </button>
      </div>
    </div>

    <!-- B2B & B2C Visibility Row -->
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- B2C Toggle -->
      <div class="flex-1 flex items-center justify-between p-3 rounded-lg border"
           :class="form.visibility.b2c
             ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
             : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'">
        <div class="flex items-center gap-2">
          <span class="material-icons text-sm" :class="form.visibility.b2c ? 'text-blue-500' : 'text-gray-400'">person</span>
          <span class="text-sm font-medium" :class="form.visibility.b2c ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400'">
            B2C
          </span>
        </div>
        <button type="button" @click="form.visibility.b2c = !form.visibility.b2c"
                class="relative w-10 h-5 rounded-full transition-colors"
                :class="form.visibility.b2c ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'">
          <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                :class="form.visibility.b2c ? 'translate-x-5' : ''"></span>
        </button>
      </div>

      <!-- B2B Toggle -->
      <div class="flex-1 flex items-center justify-between p-3 rounded-lg border"
           :class="form.visibility.b2b
             ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
             : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'">
        <div class="flex items-center gap-2">
          <span class="material-icons text-sm" :class="form.visibility.b2b ? 'text-orange-500' : 'text-gray-400'">business</span>
          <span class="text-sm font-medium" :class="form.visibility.b2b ? 'text-orange-700 dark:text-orange-400' : 'text-gray-600 dark:text-slate-400'">
            B2B
          </span>
        </div>
        <button type="button" @click="form.visibility.b2b = !form.visibility.b2b"
                class="relative w-10 h-5 rounded-full transition-colors"
                :class="form.visibility.b2b ? 'bg-orange-500' : 'bg-gray-300 dark:bg-slate-600'">
          <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                :class="form.visibility.b2b ? 'translate-x-5' : ''"></span>
        </button>
      </div>
    </div>

    <!-- Campaign Name (Multi-language) -->
    <div :class="{ 'has-validation-error': validationErrors.name }">
      <MultiLangInput
        v-model="form.name"
        :languages="SUPPORTED_LANGUAGES"
        :label="$t('planning.campaigns.name') + ' *'"
        :placeholder="$t('planning.campaigns.namePlaceholder')"
        @update:modelValue="validationErrors.name = false"
      />
      <p v-if="validationErrors.name" class="form-error mt-1">
        <span class="material-icons text-sm">error_outline</span>
        {{ $t('validation.required') }}
      </p>
    </div>

    <!-- Campaign Type -->
    <div>
      <label class="form-label">{{ $t('planning.campaigns.type') }} <span class="text-red-500">*</span></label>
      <select v-model="form.type"
              class="form-input w-full"
              :class="{ 'has-error': validationErrors.type }"
              @change="validationErrors.type = false">
        <option value="" disabled>{{ $t('planning.campaigns.selectType') }}</option>
        <option v-for="ctype in campaignTypes" :key="ctype" :value="ctype">
          {{ $t(`planning.campaigns.types.${ctype}`) }}
        </option>
      </select>
      <p v-if="validationErrors.type" class="form-error">
        <span class="material-icons text-sm">error_outline</span>
        {{ $t('validation.required') }}
      </p>
    </div>

    <!-- Discount Section -->
    <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
      <div class="flex items-center gap-2 mb-3">
        <span class="material-icons text-amber-500 text-sm">discount</span>
        <h4 class="font-medium text-sm text-gray-800 dark:text-white">{{ $t('planning.campaigns.discount') }}</h4>
      </div>

      <!-- Discount Type Toggle -->
      <div class="flex gap-2 mb-3">
        <button type="button" @click="form.freeNightsEnabled = false"
                class="flex-1 p-2 rounded-lg border text-center text-sm font-medium transition-all"
                :class="!form.freeNightsEnabled
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-amber-400'">
          <span class="material-icons text-base" :class="!form.freeNightsEnabled ? 'text-white' : 'text-amber-500'">percent</span>
          <span class="ml-1">{{ $t('planning.campaigns.discountTypes.percentage') }}</span>
        </button>
        <button type="button" @click="form.freeNightsEnabled = true"
                class="flex-1 p-2 rounded-lg border text-center text-sm font-medium transition-all"
                :class="form.freeNightsEnabled
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-indigo-400'">
          <span class="material-icons text-base" :class="form.freeNightsEnabled ? 'text-white' : 'text-indigo-500'">card_giftcard</span>
          <span class="ml-1">{{ $t('planning.campaigns.freeNightsFeature') }}</span>
        </button>
      </div>

      <!-- Percentage Discount Input -->
      <div v-if="!form.freeNightsEnabled" class="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-lg">
        <div class="flex items-center border border-amber-200 dark:border-amber-700 rounded-lg overflow-hidden">
          <span class="px-2 py-1.5 bg-amber-500 text-white font-bold text-sm">%</span>
          <input v-model.number="form.discount.value" type="number" min="0" max="100"
                 class="w-16 px-2 py-1.5 border-0 focus:ring-0 text-lg font-bold text-center bg-transparent text-amber-700 dark:text-amber-400" />
        </div>
        <span class="text-xs text-gray-500">{{ $t('planning.campaigns.discountHint') }}</span>
      </div>

      <!-- Free Nights Input -->
      <div v-else class="flex items-center justify-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-lg">
        <div class="text-center">
          <input v-model.number="form.discount.freeNights.stayNights" type="number" min="2"
                 class="w-14 px-2 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-center text-lg font-bold text-indigo-700 dark:text-indigo-400" />
          <p class="text-xs text-gray-500 mt-0.5">{{ $t('planning.campaigns.stayNights') }}</p>
        </div>
        <span class="text-xl font-bold text-indigo-500">=</span>
        <div class="text-center">
          <input v-model.number="form.discount.freeNights.freeNights" type="number" min="1"
                 class="w-14 px-2 py-1.5 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 text-center text-lg font-bold text-green-700 dark:text-green-400" />
          <p class="text-xs text-gray-500 mt-0.5">{{ $t('planning.campaigns.freeNights') }}</p>
        </div>
      </div>
    </div>

    <!-- Markets Selection -->
    <div class="p-3 rounded-lg border-2 transition-colors"
         :class="validationErrors.markets
           ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
           : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="material-icons text-sm" :class="validationErrors.markets ? 'text-red-500' : 'text-blue-500'">public</span>
          <span class="font-medium text-sm text-gray-800 dark:text-white">{{ $t('planning.campaigns.applicableMarkets') }} <span class="text-red-500">*</span></span>
          <span class="text-xs text-gray-500">({{ form.conditions.applicableMarkets.length }}/{{ markets.length }})</span>
        </div>
        <button type="button" @click="toggleAllMarkets" class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">
          {{ form.conditions.applicableMarkets.length === markets.length ? $t('planning.campaigns.deselectAll') : $t('planning.campaigns.selectAll') }}
        </button>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button v-for="market in markets" :key="market._id" type="button"
                @click="toggleMarket(market._id); validationErrors.markets = false"
                class="px-2 py-1 rounded text-xs font-medium transition-all"
                :class="form.conditions.applicableMarkets.includes(market._id)
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-blue-400'">
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
      <div class="p-3 rounded-lg border-2 transition-colors"
           :class="validationErrors.mealPlans
             ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
             : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="material-icons text-sm" :class="validationErrors.mealPlans ? 'text-red-500' : 'text-emerald-500'">restaurant</span>
            <span class="font-medium text-sm text-gray-800 dark:text-white">{{ $t('planning.campaigns.applicableMealPlans') }} <span class="text-red-500">*</span></span>
            <span class="text-xs text-gray-500">({{ form.conditions.applicableMealPlans.length }}/{{ mealPlans.length }})</span>
          </div>
          <button type="button" @click="toggleAllMealPlans" class="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
            {{ form.conditions.applicableMealPlans.length === mealPlans.length ? $t('planning.campaigns.deselectAll') : $t('planning.campaigns.selectAll') }}
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button v-for="mp in mealPlans" :key="mp._id" type="button"
                  @click="toggleMealPlan(mp._id); validationErrors.mealPlans = false"
                  class="px-2 py-1 rounded text-xs font-medium transition-all"
                  :class="form.conditions.applicableMealPlans.includes(mp._id)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-emerald-400'">
            {{ mp.code }}
          </button>
        </div>
        <p v-if="validationErrors.mealPlans" class="form-error mt-2">
          <span class="material-icons text-sm">error_outline</span>
          {{ $t('planning.campaigns.selectAtLeastOneMealPlan') }}
        </p>
      </div>

      <!-- Room Types -->
      <div class="p-3 rounded-lg border-2 transition-colors"
           :class="validationErrors.roomTypes
             ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
             : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="material-icons text-sm" :class="validationErrors.roomTypes ? 'text-red-500' : 'text-purple-500'">bed</span>
            <span class="font-medium text-sm text-gray-800 dark:text-white">{{ $t('planning.campaigns.applicableRoomTypes') }} <span class="text-red-500">*</span></span>
            <span class="text-xs text-gray-500">({{ form.conditions.applicableRoomTypes.length }}/{{ roomTypes.length }})</span>
          </div>
          <button type="button" @click="toggleAllRoomTypes" class="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400">
            {{ form.conditions.applicableRoomTypes.length === roomTypes.length ? $t('planning.campaigns.deselectAll') : $t('planning.campaigns.selectAll') }}
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button v-for="rt in roomTypes" :key="rt._id" type="button"
                  @click="toggleRoomType(rt._id); validationErrors.roomTypes = false"
                  class="px-2 py-1 rounded text-xs font-medium transition-all"
                  :class="form.conditions.applicableRoomTypes.includes(rt._id)
                    ? 'bg-purple-500 text-white'
                    : 'bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-purple-400'">
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
      <label class="text-sm text-gray-700 dark:text-slate-300">{{ $t('planning.campaigns.minNights') }}</label>
      <input v-model.number="form.conditions.minNights" type="number" min="1"
             class="w-16 px-2 py-1 rounded border border-gray-300 dark:border-slate-600 text-center text-sm font-bold" />
      <span class="text-xs text-gray-500">{{ $t('planning.campaigns.minNightsHint') }}</span>
    </div>

    <!-- Calculation Settings -->
    <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
      <div class="flex items-center gap-2 mb-3">
        <span class="material-icons text-purple-500 text-sm">functions</span>
        <h4 class="font-medium text-sm text-gray-800 dark:text-white">{{ $t('planning.campaigns.calculationSettings') }}</h4>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <!-- Calculation Type -->
        <div>
          <label class="text-xs text-gray-600 dark:text-slate-400 mb-2 block">{{ $t('planning.campaigns.calculationType') }}</label>
          <div class="flex gap-2">
            <button type="button" @click="form.calculationType = 'cumulative'"
                    class="flex-1 p-2 rounded-lg border text-center text-xs font-medium transition-all"
                    :class="form.calculationType === 'cumulative'
                      ? 'bg-purple-500 border-purple-500 text-white'
                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-purple-400'">
              <span class="material-icons text-base mb-0.5" :class="form.calculationType === 'cumulative' ? 'text-white' : 'text-purple-500'">stacked_bar_chart</span>
              <span class="block">{{ $t('planning.campaigns.calculationTypeCumulative') }}</span>
            </button>
            <button type="button" @click="form.calculationType = 'sequential'"
                    class="flex-1 p-2 rounded-lg border text-center text-xs font-medium transition-all"
                    :class="form.calculationType === 'sequential'
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-indigo-400'">
              <span class="material-icons text-base mb-0.5" :class="form.calculationType === 'sequential' ? 'text-white' : 'text-indigo-500'">trending_down</span>
              <span class="block">{{ $t('planning.campaigns.calculationTypeSequential') }}</span>
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            {{ form.calculationType === 'cumulative' ? $t('planning.campaigns.calculationTypeCumulativeHint') : $t('planning.campaigns.calculationTypeSequentialHint') }}
          </p>
        </div>

        <!-- Calculation Order -->
        <div>
          <label class="text-xs text-gray-600 dark:text-slate-400 mb-2 block">{{ $t('planning.campaigns.calculationOrder') }}</label>
          <div class="flex items-center gap-2">
            <input v-model.number="form.calculationOrder" type="number" min="0" max="99"
                   class="w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-center text-lg font-bold bg-white dark:bg-slate-800" />
            <span class="text-xs text-gray-500">{{ $t('planning.campaigns.calculationOrderHint') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Application Type Toggle -->
    <div class="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
      <div class="flex items-center gap-2 mb-3">
        <span class="material-icons text-indigo-500 text-sm">calculate</span>
        <h4 class="font-medium text-sm text-gray-800 dark:text-white">{{ $t('planning.campaigns.applicationType') }}</h4>
      </div>
      <div class="flex gap-2">
        <button type="button" @click="form.applicationType = 'stay'"
                class="flex-1 p-3 rounded-lg border-2 text-left transition-all"
                :class="form.applicationType === 'stay'
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-indigo-400'">
          <div class="flex items-center gap-2 mb-1">
            <span class="material-icons text-base" :class="form.applicationType === 'stay' ? 'text-white' : 'text-indigo-500'">nights_stay</span>
            <span class="font-medium text-sm">{{ $t('planning.campaigns.applicationTypeStay') }}</span>
          </div>
          <p class="text-xs" :class="form.applicationType === 'stay' ? 'text-indigo-100' : 'text-gray-500'">
            {{ $t('planning.campaigns.applicationTypeStayHint') }}
          </p>
        </button>
        <button type="button" @click="form.applicationType = 'checkin'"
                class="flex-1 p-3 rounded-lg border-2 text-left transition-all"
                :class="form.applicationType === 'checkin'
                  ? 'bg-teal-500 border-teal-500 text-white'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-teal-400'">
          <div class="flex items-center gap-2 mb-1">
            <span class="material-icons text-base" :class="form.applicationType === 'checkin' ? 'text-white' : 'text-teal-500'">login</span>
            <span class="font-medium text-sm">{{ $t('planning.campaigns.applicationTypeCheckin') }}</span>
          </div>
          <p class="text-xs" :class="form.applicationType === 'checkin' ? 'text-teal-100' : 'text-gray-500'">
            {{ $t('planning.campaigns.applicationTypeCheckinHint') }}
          </p>
        </button>
      </div>
    </div>

    <!-- Date Windows Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <!-- Stay Window -->
      <div class="p-3 rounded-lg border-2 transition-colors"
           :class="validationErrors.stayDates
             ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
             : 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'">
        <div class="flex items-center gap-2 mb-2">
          <span class="material-icons text-sm" :class="validationErrors.stayDates ? 'text-red-500' : 'text-teal-500'">date_range</span>
          <span class="font-medium text-sm text-gray-800 dark:text-white">{{ $t('planning.campaigns.stayWindow') }} <span class="text-red-500">*</span></span>
        </div>
        <DateRangePicker v-model="stayDateRange" :allow-past="true" @update:modelValue="validationErrors.stayDates = false" />
        <div class="mt-2 flex flex-wrap gap-1">
          <button v-for="(day, key) in weekdays" :key="key" type="button"
                  @click="toggleStayDay(key)"
                  class="px-2 py-0.5 text-xs rounded font-medium transition-all"
                  :class="form.stayDays.includes(key)
                    ? 'bg-teal-500 text-white'
                    : 'bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400'">
            {{ $t(`planning.campaigns.weekdays.${key}`) }}
          </button>
        </div>
        <p v-if="validationErrors.stayDates" class="form-error mt-2">
          <span class="material-icons text-sm">error_outline</span>
          {{ $t('planning.campaigns.selectStayDates') }}
        </p>
      </div>

      <!-- Booking Window -->
      <div class="p-3 rounded-lg border-2 transition-colors"
           :class="validationErrors.bookingDates
             ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
             : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'">
        <div class="flex items-center gap-2 mb-2">
          <span class="material-icons text-sm" :class="validationErrors.bookingDates ? 'text-red-500' : 'text-rose-500'">event_available</span>
          <span class="font-medium text-sm text-gray-800 dark:text-white">{{ $t('planning.campaigns.bookingWindow') }} <span class="text-red-500">*</span></span>
        </div>
        <DateRangePicker v-model="bookingDateRange" :allow-past="true" @update:modelValue="validationErrors.bookingDates = false" />
        <div class="mt-2 flex flex-wrap gap-1">
          <button v-for="(day, key) in weekdays" :key="key" type="button"
                  @click="toggleBookingDay(key)"
                  class="px-2 py-0.5 text-xs rounded font-medium transition-all"
                  :class="form.bookingDays.includes(key)
                    ? 'bg-rose-500 text-white'
                    : 'bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400'">
            {{ $t(`planning.campaigns.weekdays.${key}`) }}
          </button>
        </div>
        <p v-if="validationErrors.bookingDates" class="form-error mt-2">
          <span class="material-icons text-sm">error_outline</span>
          {{ $t('planning.campaigns.selectBookingDates') }}
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-slate-700">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">{{ $t('common.cancel') }}</button>
      <button type="button" @click="handleSave" class="btn-primary" :disabled="saving">
        {{ saving ? $t('common.loading') : $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import planningService from '@/services/planningService'

const props = defineProps({
  hotel: { type: Object, required: true },
  campaign: { type: Object, default: null },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  markets: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved', 'cancel'])

const { t, locale } = useI18n()
const toast = useToast()
const saving = ref(false)


const weekdays = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }

const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']
const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => { obj[lang] = '' })
  return obj
}

// Campaign types from model
const campaignTypes = [
  'early_bird', 'last_minute', 'long_stay', 'promotional', 'seasonal',
  'honeymoon', 'family', 'weekend', 'midweek', 'loyalty'
]

// Validation error states
const validationErrors = reactive({
  name: false,
  type: false,
  markets: false,
  mealPlans: false,
  roomTypes: false,
  stayDates: false,
  bookingDates: false
})

const form = reactive({
  code: '',
  name: createMultiLangObject(),
  type: '', // Campaign type - required
  status: 'active',
  visibility: { b2c: true, b2b: true },
  combinable: false,
  calculationType: 'cumulative', // 'cumulative' = all on original, 'sequential' = chained
  calculationOrder: 0, // Lower = calculated first when combined
  applicationType: 'stay', // 'stay' = day by day, 'checkin' = all nights if checkin matches
  freeNightsEnabled: false,
  discount: {
    type: 'percentage',
    value: 10,
    freeNights: { stayNights: 7, freeNights: 1 }
  },
  conditions: {
    minNights: 1,
    applicableMarkets: [],
    applicableMealPlans: [],
    applicableRoomTypes: []
  },
  stayDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  bookingDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
})

// Date range models
const stayDateRange = ref({ start: null, end: null })
const bookingDateRange = ref({ start: null, end: null })

// Helper functions
const getMealPlanLabel = (mp) => mp.name?.[locale.value] || mp.name?.tr || mp.name?.en || mp.code
const getRoomTypeLabel = (rt) => rt.name?.[locale.value] || rt.name?.tr || rt.name?.en || rt.code

// Toggle functions for card selection
const toggleMarket = (id) => {
  const idx = form.conditions.applicableMarkets.indexOf(id)
  if (idx > -1) {
    form.conditions.applicableMarkets.splice(idx, 1)
  } else {
    form.conditions.applicableMarkets.push(id)
  }
}
const toggleAllMarkets = () => {
  if (form.conditions.applicableMarkets.length === props.markets.length) {
    form.conditions.applicableMarkets = []
  } else {
    form.conditions.applicableMarkets = props.markets.map(m => m._id)
  }
}

const toggleMealPlan = (id) => {
  const idx = form.conditions.applicableMealPlans.indexOf(id)
  if (idx > -1) {
    form.conditions.applicableMealPlans.splice(idx, 1)
  } else {
    form.conditions.applicableMealPlans.push(id)
  }
}
const toggleAllMealPlans = () => {
  if (form.conditions.applicableMealPlans.length === props.mealPlans.length) {
    form.conditions.applicableMealPlans = []
  } else {
    form.conditions.applicableMealPlans = props.mealPlans.map(mp => mp._id)
  }
}

const toggleRoomType = (id) => {
  const idx = form.conditions.applicableRoomTypes.indexOf(id)
  if (idx > -1) {
    form.conditions.applicableRoomTypes.splice(idx, 1)
  } else {
    form.conditions.applicableRoomTypes.push(id)
  }
}
const toggleAllRoomTypes = () => {
  if (form.conditions.applicableRoomTypes.length === props.roomTypes.length) {
    form.conditions.applicableRoomTypes = []
  } else {
    form.conditions.applicableRoomTypes = props.roomTypes.map(rt => rt._id)
  }
}

// Day toggles
const toggleStayDay = (day) => {
  const idx = form.stayDays.indexOf(day)
  if (idx > -1) form.stayDays.splice(idx, 1)
  else form.stayDays.push(day)
}
const toggleBookingDay = (day) => {
  const idx = form.bookingDays.indexOf(day)
  if (idx > -1) form.bookingDays.splice(idx, 1)
  else form.bookingDays.push(day)
}

const toggleStatus = () => {
  form.status = form.status === 'active' ? 'inactive' : 'active'
}

// Validate all form fields
const validateForm = () => {
  let isValid = true

  // Reset validation errors
  Object.keys(validationErrors).forEach(key => {
    validationErrors[key] = false
  })

  // Validate name field (at least one language must be filled)
  const hasName = SUPPORTED_LANGUAGES.some(lang => form.name[lang]?.trim())
  if (!hasName) {
    validationErrors.name = true
    isValid = false
  }

  // Validate campaign type
  if (!form.type) {
    validationErrors.type = true
    isValid = false
  }

  // Validate markets selection
  if (!form.conditions.applicableMarkets.length) {
    validationErrors.markets = true
    isValid = false
  }

  // Validate meal plans selection
  if (!form.conditions.applicableMealPlans.length) {
    validationErrors.mealPlans = true
    isValid = false
  }

  // Validate room types selection
  if (!form.conditions.applicableRoomTypes.length) {
    validationErrors.roomTypes = true
    isValid = false
  }

  // Validate stay dates
  if (!stayDateRange.value.start || !stayDateRange.value.end) {
    validationErrors.stayDates = true
    isValid = false
  }

  // Validate booking dates
  if (!bookingDateRange.value.start || !bookingDateRange.value.end) {
    validationErrors.bookingDates = true
    isValid = false
  }

  return isValid
}

const handleSave = async () => {
  if (!validateForm()) {
    return
  }

  saving.value = true
  try {
    // Get first non-empty name for code generation
    const firstFilledName = SUPPORTED_LANGUAGES.map(l => form.name[l]).find(n => n?.trim()) || ''

    const data = {
      ...form,
      code: firstFilledName.substring(0, 10).toUpperCase().replace(/\s+/g, '_'),
      bookingWindow: {
        startDate: bookingDateRange.value.start,
        endDate: bookingDateRange.value.end
      },
      stayWindow: {
        startDate: stayDateRange.value.start,
        endDate: stayDateRange.value.end
      }
    }

    // If free nights not enabled, use percentage discount
    if (!form.freeNightsEnabled) {
      data.discount.type = 'percentage'
    } else {
      data.discount.type = 'free_nights'
    }

    if (props.campaign) {
      await planningService.updateCampaign(props.hotel._id, props.campaign._id, data)
      toast.success(t('planning.campaigns.updated'))
    } else {
      await planningService.createCampaign(props.hotel._id, data)
      toast.success(t('planning.campaigns.created'))
    }
    emit('saved')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

const formatDateForInput = (date) => {
  if (!date) return null
  return new Date(date).toISOString().split('T')[0]
}

onMounted(() => {
  if (props.campaign) {
    form.code = props.campaign.code || ''
    form.name = { ...createMultiLangObject(), ...props.campaign.name }
    form.type = props.campaign.type || ''
    form.status = props.campaign.status || 'active'
    form.visibility = { b2c: true, b2b: true, ...props.campaign.visibility }
    form.combinable = props.campaign.combinable || false
    form.calculationType = props.campaign.calculationType || 'cumulative'
    form.calculationOrder = props.campaign.calculationOrder || 0
    form.applicationType = props.campaign.applicationType || 'stay'
    form.freeNightsEnabled = props.campaign.discount?.type === 'free_nights'
    form.discount = { ...form.discount, ...props.campaign.discount }
    form.conditions = { ...form.conditions, ...props.campaign.conditions }
    form.stayDays = props.campaign.stayDays || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    form.bookingDays = props.campaign.bookingDays || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

    stayDateRange.value = {
      start: formatDateForInput(props.campaign.stayWindow?.startDate),
      end: formatDateForInput(props.campaign.stayWindow?.endDate)
    }
    bookingDateRange.value = {
      start: formatDateForInput(props.campaign.bookingWindow?.startDate),
      end: formatDateForInput(props.campaign.bookingWindow?.endDate)
    }
  }
})
</script>
