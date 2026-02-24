<template>
  <div>
    <!-- Code -->
    <div class="mb-4">
      <label class="form-label"
        >{{ $t('planning.pricing.seasonCode') }} <span class="text-red-500">*</span></label
      >
      <input v-model="form.code" type="text" class="form-input uppercase" maxlength="10" />
    </div>

    <!-- Name (Multilingual) -->
    <div class="mb-4">
      <MultiLangInput
        v-model="form.name"
        :languages="ADMIN_LANGUAGES"
        :label="$t('planning.pricing.seasonName') + ' *'"
      />
    </div>

    <!-- Color & Priority -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label class="form-label">{{ $t('planning.pricing.color') }}</label>
        <div class="flex items-center gap-3">
          <input
            v-model="form.color"
            type="color"
            class="w-12 h-10 rounded border border-gray-300 cursor-pointer"
          />
          <input v-model="form.color" type="text" class="form-input flex-1" placeholder="#6366f1" />
        </div>
      </div>
      <div>
        <label class="form-label">{{ $t('planning.pricing.priority') }}</label>
        <input v-model.number="form.priority" type="number" min="0" max="100" class="form-input" />
        <p class="text-xs text-gray-500 mt-1">{{ $t('planning.pricing.priorityHint') }}</p>
      </div>
    </div>

    <!-- Date Ranges -->
    <div class="mb-4">
      <label class="form-label">{{ $t('planning.pricing.dateRanges') }}</label>
      <div class="space-y-3">
        <div
          v-for="(range, index) in form.dateRanges"
          :key="index"
          class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
        >
          <div class="flex-1 grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500 dark:text-slate-400 mb-1 block">{{
                $t('planning.pricing.startDate')
              }}</label>
              <DatePicker
                v-model="range.startDate"
                allow-past
                :max-date="range.endDate || null"
                :placeholder="$t('planning.pricing.startDate')"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-slate-400 mb-1 block">{{
                $t('planning.pricing.endDate')
              }}</label>
              <DatePicker
                v-model="range.endDate"
                allow-past
                :min-date="range.startDate || null"
                :placeholder="$t('planning.pricing.endDate')"
              />
            </div>
          </div>
          <button
            v-if="form.dateRanges.length > 1"
            type="button"
            class="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded self-end mb-1"
            @click="removeDateRange(index)"
          >
            <span class="material-icons">close</span>
          </button>
        </div>
        <button
          type="button"
          class="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          @click="addDateRange"
        >
          <span class="material-icons text-sm">add</span>
          {{ $t('planning.pricing.addDateRange') }}
        </button>
      </div>
    </div>

    <!-- Product Override Section -->
    <div
      v-if="filteredRoomTypes.length || filteredMealPlans.length"
      class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4 mb-4"
    >
      <div class="flex items-center gap-2">
        <span class="material-icons text-blue-500">inventory_2</span>
        <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
          $t('planning.seasons.productOverride')
        }}</label>
      </div>
      <p class="text-xs text-gray-500 dark:text-slate-400">
        {{ $t('planning.seasons.productOverrideHint') }}
      </p>

      <!-- Active Room Types Override -->
      <div
        v-if="filteredRoomTypes.length"
        class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="material-icons text-blue-500 text-sm">hotel</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
            $t('planning.seasons.activeRoomTypes')
          }}</label>
        </div>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="rt in filteredRoomTypes"
            :key="rt._id"
            class="relative flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm"
            :class="
              form.activeRoomTypes.includes(rt._id)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
            "
          >
            <input v-model="form.activeRoomTypes" type="checkbox" :value="rt._id" class="sr-only" />
            <span class="font-medium">{{ rt.code }}</span>
            <span class="text-xs text-gray-500 dark:text-slate-400">{{
              rt.name?.[locale] || rt.name?.tr
            }}</span>
          </label>
        </div>
        <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
          <span class="material-icons text-xs">info</span>
          {{ $t('planning.seasons.emptyInheritsMarket') }}
        </p>
      </div>

      <!-- Active Meal Plans Override -->
      <div
        v-if="filteredMealPlans.length"
        class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="material-icons text-green-500 text-sm">restaurant</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
            $t('planning.seasons.activeMealPlans')
          }}</label>
        </div>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="mp in filteredMealPlans"
            :key="mp._id"
            class="relative flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm"
            :class="
              form.activeMealPlans.includes(mp._id)
                ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
            "
          >
            <input v-model="form.activeMealPlans" type="checkbox" :value="mp._id" class="sr-only" />
            <span class="font-medium">{{ mp.code }}</span>
            <span class="text-xs text-gray-500 dark:text-slate-400">{{
              mp.name?.[locale] || mp.name?.tr
            }}</span>
          </label>
        </div>
        <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
          <span class="material-icons text-xs">info</span>
          {{ $t('planning.seasons.emptyInheritsMarket') }}
        </p>
      </div>
    </div>

    <!-- Child Age Override Section -->
    <div
      class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800 space-y-4 mb-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-icons text-pink-500">child_care</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
            $t('planning.seasons.childAgeOverride')
          }}</label>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-500 dark:text-slate-400">{{
            $t('planning.seasons.inheritFromMarket')
          }}</span>
          <button
            type="button"
            class="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none"
            :class="
              form.childAgeSettings.inheritFromMarket
                ? 'bg-pink-500'
                : 'bg-gray-300 dark:bg-slate-600'
            "
            @click="
              form.childAgeSettings.inheritFromMarket = !form.childAgeSettings.inheritFromMarket
            "
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
              :class="form.childAgeSettings.inheritFromMarket ? 'translate-x-6' : 'translate-x-0'"
            ></span>
          </button>
        </div>
      </div>

      <div
        v-if="form.childAgeSettings.inheritFromMarket"
        class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-600"
      >
        <p class="text-xs text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
          <span class="material-icons text-xs">link</span>
          {{ $t('planning.seasons.usingMarketSettings') }}
        </p>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="group in hotelChildAgeGroups"
            :key="group.code"
            class="px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 text-sm"
          >
            <span class="font-medium text-gray-700 dark:text-slate-300">{{
              getChildGroupName(group)
            }}</span>
            <span class="text-gray-500 dark:text-slate-400 ml-2"
              >{{ group.minAge }}-{{ group.maxAge }} {{ $t('planning.markets.years') }}</span
            >
          </div>
          <span v-if="hotelChildAgeGroups.length === 0" class="text-amber-600 text-sm">
            {{ $t('planning.seasons.noChildAgeGroups') }}
          </span>
        </div>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="group in form.childAgeSettings.childAgeGroups"
          :key="group.code"
          class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-icons text-sm" :class="getChildGroupIconClass(group.code)">
                {{ getChildGroupIcon(group.code) }}
              </span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">
                {{ getChildGroupLabel(group.code) }}
              </label>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model.number="group.minAge"
                type="number"
                min="0"
                max="17"
                class="form-input w-16 text-center text-sm"
                :placeholder="getHotelGroupAge(group.code, 'min')"
              />
              <span class="text-gray-500">-</span>
              <input
                v-model.number="group.maxAge"
                type="number"
                min="0"
                max="17"
                class="form-input w-16 text-center text-sm"
                :placeholder="getHotelGroupAge(group.code, 'max')"
              />
              <span class="text-xs text-gray-500">{{ $t('planning.markets.years') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Settings Override Section -->
    <div
      class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-4 mb-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-icons text-emerald-500">payments</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
            $t('planning.seasons.paymentSettings')
          }}</label>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-500 dark:text-slate-400">{{
            $t('planning.seasons.inheritFromMarket')
          }}</span>
          <button
            type="button"
            class="relative w-12 h-6 rounded-full transition-colors duration-300"
            :class="
              form.paymentSettings.inheritFromMarket
                ? 'bg-emerald-500'
                : 'bg-gray-300 dark:bg-slate-600'
            "
            @click="
              form.paymentSettings.inheritFromMarket = !form.paymentSettings.inheritFromMarket
            "
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
              :class="form.paymentSettings.inheritFromMarket ? 'translate-x-6' : 'translate-x-0'"
            ></span>
          </button>
        </div>
      </div>

      <div
        v-if="form.paymentSettings.inheritFromMarket"
        class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-600"
      >
        <p class="text-xs text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
          <span class="material-icons text-xs">link</span>
          {{ $t('planning.seasons.usingMarketSettings') }}
        </p>
        <div class="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-slate-400">
          <span class="flex items-center gap-1">
            <span
              class="material-icons text-sm"
              :class="
                market.paymentMethods?.creditCard?.enabled !== false
                  ? 'text-green-500'
                  : 'text-red-500'
              "
            >
              {{ market.paymentMethods?.creditCard?.enabled !== false ? 'check_circle' : 'cancel' }}
            </span>
            {{ $t('planning.markets.creditCard') }}
          </span>
          <span class="flex items-center gap-1">
            <span
              class="material-icons text-sm"
              :class="
                market.paymentMethods?.bankTransfer?.enabled !== false
                  ? 'text-green-500'
                  : 'text-red-500'
              "
            >
              {{
                market.paymentMethods?.bankTransfer?.enabled !== false ? 'check_circle' : 'cancel'
              }}
            </span>
            {{ $t('planning.markets.bankTransfer') }}
          </span>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-icons text-blue-500 text-sm">credit_card</span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
                $t('planning.markets.creditCard')
              }}</label>
            </div>
            <button
              type="button"
              class="relative w-10 h-5 rounded-full transition-colors duration-300"
              :class="
                form.paymentSettings.creditCard.enabled
                  ? 'bg-emerald-500'
                  : 'bg-gray-300 dark:bg-slate-600'
              "
              @click="
                form.paymentSettings.creditCard.enabled = !form.paymentSettings.creditCard.enabled
              "
            >
              <span
                class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300"
                :class="form.paymentSettings.creditCard.enabled ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>
        </div>
        <div
          class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-orange-500 text-sm">account_balance</span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
                $t('planning.markets.bankTransfer')
              }}</label>
            </div>
            <button
              type="button"
              class="relative w-10 h-5 rounded-full transition-colors duration-300"
              :class="
                form.paymentSettings.bankTransfer.enabled
                  ? 'bg-emerald-500'
                  : 'bg-gray-300 dark:bg-slate-600'
              "
              @click="
                form.paymentSettings.bankTransfer.enabled =
                  !form.paymentSettings.bankTransfer.enabled
              "
            >
              <span
                class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300"
                :class="
                  form.paymentSettings.bankTransfer.enabled ? 'translate-x-5' : 'translate-x-0'
                "
              ></span>
            </button>
          </div>
          <div
            v-if="form.paymentSettings.bankTransfer.enabled"
            class="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-700"
          >
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 dark:text-slate-400 w-24">{{
                $t('planning.markets.releaseDays')
              }}</label>
              <input
                v-model.number="form.paymentSettings.bankTransfer.releaseDays"
                type="number"
                min="0"
                max="60"
                class="form-input w-16 text-center text-sm py-1"
              />
              <span class="text-xs text-gray-400">{{ $t('common.days') }}</span>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 dark:text-slate-400 w-24">{{
                $t('planning.markets.discountRate')
              }}</label>
              <input
                v-model.number="form.paymentSettings.bankTransfer.discountRate"
                type="number"
                min="0"
                max="50"
                class="form-input w-16 text-center text-sm py-1"
              />
              <span class="text-xs text-gray-400">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Children Allowed Override Section -->
    <div
      class="p-4 mb-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-icons text-amber-500">family_restroom</span>
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
              $t('planning.markets.childrenAllowed')
            }}</label>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('planning.seasons.childrenAllowedHint') }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-500 dark:text-slate-400">{{
            $t('planning.seasons.inheritFromMarket')
          }}</span>
          <button
            type="button"
            class="relative w-12 h-6 rounded-full transition-colors duration-300"
            :class="
              form.childrenSettings.inheritFromMarket
                ? 'bg-amber-500'
                : 'bg-gray-300 dark:bg-slate-600'
            "
            @click="
              form.childrenSettings.inheritFromMarket = !form.childrenSettings.inheritFromMarket
            "
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
              :class="form.childrenSettings.inheritFromMarket ? 'translate-x-6' : 'translate-x-0'"
            ></span>
          </button>
        </div>
      </div>

      <div
        v-if="form.childrenSettings.inheritFromMarket"
        class="mt-3 p-2 bg-white/50 dark:bg-slate-800/50 rounded border border-gray-200 dark:border-slate-600"
      >
        <span class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
          <span class="material-icons text-xs">link</span>
          {{ $t('planning.seasons.usingMarketSettings') }}:
          <span
            class="font-medium"
            :class="market.childrenAllowed !== false ? 'text-green-600' : 'text-red-600'"
          >
            {{ market.childrenAllowed !== false ? $t('common.yes') : $t('common.no') }}
          </span>
        </span>
      </div>

      <div v-else class="mt-3 flex items-center gap-3">
        <span class="text-sm text-gray-600 dark:text-slate-400"
          >{{ $t('planning.seasons.allowChildren') }}:</span
        >
        <button
          type="button"
          class="relative w-12 h-6 rounded-full transition-colors duration-300"
          :class="form.childrenSettings.allowed ? 'bg-green-500' : 'bg-red-500'"
          @click="form.childrenSettings.allowed = !form.childrenSettings.allowed"
        >
          <span
            class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
            :class="form.childrenSettings.allowed ? 'translate-x-6' : 'translate-x-0'"
          ></span>
        </button>
        <span
          class="text-sm font-medium"
          :class="form.childrenSettings.allowed ? 'text-green-600' : 'text-red-600'"
        >
          {{ form.childrenSettings.allowed ? $t('common.yes') : $t('common.no') }}
        </span>
      </div>
    </div>

    <!-- Sales Settings Override Section -->
    <div
      class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 space-y-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-icons text-indigo-500">storefront</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
            $t('planning.seasons.salesSettingsOverride')
          }}</label>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-500 dark:text-slate-400">{{
            $t('planning.seasons.inheritFromMarket')
          }}</span>
          <button
            type="button"
            class="relative w-12 h-6 rounded-full transition-colors duration-300"
            :class="
              form.salesSettingsOverride.inheritFromMarket
                ? 'bg-indigo-500'
                : 'bg-gray-300 dark:bg-slate-600'
            "
            @click="
              form.salesSettingsOverride.inheritFromMarket =
                !form.salesSettingsOverride.inheritFromMarket
            "
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
              :class="
                form.salesSettingsOverride.inheritFromMarket ? 'translate-x-6' : 'translate-x-0'
              "
            ></span>
          </button>
        </div>
      </div>

      <!-- Show market settings when inheriting -->
      <div
        v-if="form.salesSettingsOverride.inheritFromMarket"
        class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-600"
      >
        <p class="text-xs text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
          <span class="material-icons text-xs">link</span>
          {{ $t('planning.seasons.usingMarketSettings') }}
        </p>
        <div class="flex flex-wrap gap-3 text-sm">
          <!-- Working Mode -->
          <span
            class="flex items-center gap-1 px-2 py-1 rounded"
            :class="
              market.workingMode === 'commission'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            "
          >
            {{
              market.workingMode === 'commission'
                ? $t('planning.markets.workingModes.commission')
                : $t('planning.markets.workingModes.net')
            }}
            <span v-if="market.workingMode === 'commission'" class="font-bold"
              >%{{ market.commissionRate || 10 }}</span
            >
          </span>
          <!-- Markups -->
          <span
            v-if="market.salesChannels?.b2c && market.markup?.b2c"
            class="flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          >
            B2C +{{ market.markup.b2c }}%
          </span>
          <span
            v-if="market.salesChannels?.b2b && market.markup?.b2b"
            class="flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          >
            B2B +{{ market.markup.b2b }}%
          </span>
          <!-- Agency Commission (only for commission mode with B2B - calculated from margin share) -->
          <span
            v-if="market.salesChannels?.b2b && market.workingMode === 'commission'"
            class="flex items-center gap-1 px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          >
            {{ $t('planning.markets.agencyCommissionShort') }} %{{
              Math.round(
                ((market.commissionRate || 10) / (100 + (market.commissionRate || 10))) *
                  (market.agencyMarginShare ?? 50) *
                  100
              ) / 100
            }}
          </span>
        </div>
      </div>

      <!-- Custom settings when override enabled -->
      <div v-else class="space-y-4">
        <!-- Working Mode Selection -->
        <div
          class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
        >
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3 block">{{
            $t('planning.markets.workingMode')
          }}</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              class="p-3 rounded-lg border-2 transition-all text-left"
              :class="
                form.salesSettingsOverride.workingMode === 'net'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
              "
              @click="form.salesSettingsOverride.workingMode = 'net'"
            >
              <div class="flex items-center gap-2">
                <span class="material-icons text-blue-500">account_balance</span>
                <span class="font-semibold text-gray-900 dark:text-white">{{
                  $t('planning.markets.workingModes.net')
                }}</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {{ $t('planning.markets.workingModes.netDesc') }}
              </p>
            </button>
            <button
              type="button"
              class="p-3 rounded-lg border-2 transition-all text-left"
              :class="
                form.salesSettingsOverride.workingMode === 'commission'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
              "
              @click="form.salesSettingsOverride.workingMode = 'commission'"
            >
              <div class="flex items-center gap-2">
                <span class="material-icons text-green-500">percent</span>
                <span class="font-semibold text-gray-900 dark:text-white">{{
                  $t('planning.markets.workingModes.commission')
                }}</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {{ $t('planning.markets.workingModes.commissionDesc') }}
              </p>
            </button>
          </div>

          <!-- Commission Rate (only for commission mode) -->
          <div
            v-if="form.salesSettingsOverride.workingMode === 'commission'"
            class="mt-3 flex items-center gap-3"
          >
            <label class="text-sm text-gray-600 dark:text-slate-400"
              >{{ $t('planning.markets.commissionRate') }}:</label
            >
            <div class="flex items-center gap-2">
              <input
                v-model.number="form.salesSettingsOverride.commissionRate"
                type="number"
                min="0"
                max="100"
                class="form-input w-20 text-center"
              />
              <span class="text-gray-500">%</span>
            </div>
          </div>
        </div>

        <!-- Markup Settings -->
        <div
          class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
        >
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3 block">{{
            $t('planning.markets.markupSettings')
          }}</label>
          <div class="grid grid-cols-2 gap-4">
            <!-- B2C Markup -->
            <div v-if="market.salesChannels?.b2c" class="flex items-center gap-3">
              <span class="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-1">
                <span class="material-icons text-sm text-green-500">person</span>
                B2C:
              </span>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="form.salesSettingsOverride.markup.b2c"
                  type="number"
                  min="0"
                  max="100"
                  class="form-input w-20 text-center"
                />
                <span class="text-gray-500">%</span>
              </div>
            </div>
            <!-- B2B Markup -->
            <div v-if="market.salesChannels?.b2b" class="flex items-center gap-3">
              <span class="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-1">
                <span class="material-icons text-sm text-blue-500">business</span>
                B2B:
              </span>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="form.salesSettingsOverride.markup.b2b"
                  type="number"
                  min="0"
                  max="100"
                  class="form-input w-20 text-center"
                />
                <span class="text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Agency Margin Share (only for B2B and commission mode) -->
        <div
          v-if="
            market.salesChannels?.b2b && form.salesSettingsOverride.workingMode === 'commission'
          "
          class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 space-y-3"
        >
          <!-- Gross Margin Info (calculated from commission rate) -->
          <div class="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <span class="text-sm text-blue-700 dark:text-blue-300">
              {{ $t('planning.markets.grossMargin') }}: %{{
                Math.round(
                  (form.salesSettingsOverride.commissionRate /
                    (100 + form.salesSettingsOverride.commissionRate)) *
                    10000
                ) / 100
              }}
            </span>
            <span class="text-xs text-blue-500 ml-2"
              >({{ form.salesSettingsOverride.commissionRate }}% komisyondan)</span
            >
          </div>

          <!-- Agency Margin Share Input -->
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
              {{ $t('planning.markets.agencyMarginShare') }}
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="form.salesSettingsOverride.agencyMarginShare"
                type="number"
                min="0"
                max="100"
                step="5"
                class="form-input w-20 text-center"
              />
              <span class="text-gray-500">%</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {{ $t('planning.markets.agencyMarginShareHint') }}
            </p>
          </div>

          <!-- Calculated Commission Display -->
          <div
            class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"
          >
            <span class="text-sm text-green-700 dark:text-green-300">
              {{ $t('planning.markets.calculatedAgencyCommission') }}:
            </span>
            <span class="font-bold text-green-700 dark:text-green-300">
              %{{
                Math.round(
                  (form.salesSettingsOverride.commissionRate /
                    (100 + form.salesSettingsOverride.commissionRate)) *
                    form.salesSettingsOverride.agencyMarginShare *
                    100
                ) / 100
              }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Non-Refundable Override Section -->
    <div
      class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 space-y-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-icons text-red-500">money_off</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
            $t('planning.seasons.nonRefundableOverride')
          }}</label>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-500 dark:text-slate-400">{{
            $t('planning.seasons.inheritFromMarket')
          }}</span>
          <button
            type="button"
            class="relative w-12 h-6 rounded-full transition-colors duration-300"
            :class="
              form.nonRefundableOverride.inheritFromMarket
                ? 'bg-red-500'
                : 'bg-gray-300 dark:bg-slate-600'
            "
            @click="
              form.nonRefundableOverride.inheritFromMarket =
                !form.nonRefundableOverride.inheritFromMarket
            "
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
              :class="
                form.nonRefundableOverride.inheritFromMarket ? 'translate-x-6' : 'translate-x-0'
              "
            ></span>
          </button>
        </div>
      </div>

      <!-- Show market settings when inheriting -->
      <div
        v-if="form.nonRefundableOverride.inheritFromMarket"
        class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-600"
      >
        <p class="text-xs text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
          <span class="material-icons text-xs">link</span>
          {{ $t('planning.seasons.usingMarketSettings') }}
        </p>
        <div class="flex flex-wrap gap-3 text-sm">
          <span
            v-if="market.nonRefundableEnabled"
            class="flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          >
            <span class="material-icons text-xs">block</span>
            {{ $t('planning.markets.nonRefundable') }} -%{{ market.nonRefundableDiscount || 10 }}
          </span>
          <span
            v-else
            class="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
          >
            <span class="material-icons text-xs">check_circle</span>
            {{ $t('planning.markets.refundable') }}
          </span>
        </div>
      </div>

      <!-- Custom settings when override enabled -->
      <div v-else class="space-y-4">
        <!-- Enable/Disable Toggle -->
        <div
          class="p-4 rounded-lg border-2 transition-all cursor-pointer"
          :class="
            form.nonRefundableOverride.enabled
              ? 'border-red-400 bg-red-100 dark:bg-red-900/30'
              : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'
          "
          @click="form.nonRefundableOverride.enabled = !form.nonRefundableOverride.enabled"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                :class="
                  form.nonRefundableOverride.enabled
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 dark:bg-slate-600 text-gray-500'
                "
              >
                <span class="material-icons text-xl">block</span>
              </div>
              <div>
                <h4 class="font-semibold text-gray-800 dark:text-white text-sm">
                  {{ $t('planning.markets.enableNonRefundable') }}
                </h4>
                <p class="text-xs text-gray-500 dark:text-slate-400">
                  {{ $t('planning.markets.nonRefundableHint') }}
                </p>
              </div>
            </div>
            <div class="relative">
              <div
                class="w-10 h-5 rounded-full transition-colors"
                :class="
                  form.nonRefundableOverride.enabled
                    ? 'bg-red-500'
                    : 'bg-gray-300 dark:bg-slate-600'
                "
              >
                <div
                  class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                  :class="{ 'translate-x-5': form.nonRefundableOverride.enabled }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Discount Setting (when enabled) -->
        <div
          v-if="form.nonRefundableOverride.enabled"
          class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
          @click.stop
        >
          <div class="flex flex-wrap items-center gap-4">
            <span class="material-icons text-green-500">discount</span>
            <label class="text-sm text-gray-700 dark:text-slate-300">{{
              $t('planning.markets.nonRefundableDiscount')
            }}</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="form.nonRefundableOverride.discount"
                type="number"
                min="0"
                max="50"
                class="form-input w-20 text-center text-lg font-bold"
                @click.stop
              />
              <span class="text-gray-500">%</span>
            </div>
            <div class="flex gap-2">
              <button
                v-for="pct in [5, 10, 15, 20]"
                :key="pct"
                type="button"
                class="px-3 py-1 text-sm rounded-lg border transition-colors"
                :class="
                  form.nonRefundableOverride.discount === pct
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                "
                @click.stop="form.nonRefundableOverride.discount = pct"
              >
                {{ pct }}%
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DatePicker from '@/components/common/DatePicker.vue'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import { ADMIN_LANGUAGES } from '@/constants/languages'

const props = defineProps({
  form: { type: Object, required: true },
  market: { type: Object, required: true },
  hotel: { type: Object, required: true },
  filteredRoomTypes: { type: Array, default: () => [] },
  filteredMealPlans: { type: Array, default: () => [] }
})

const emit = defineEmits(['add-date-range', 'remove-date-range'])

const { t, locale } = useI18n()

// Hotel's child age groups
const hotelChildAgeGroups = computed(() => {
  return props.hotel?.childAgeGroups || []
})

// Helper functions for child age groups
const getChildGroupName = group => {
  return group.name?.[locale.value] || group.name?.tr || group.name?.en || group.code
}

const getChildGroupLabel = code => {
  const labels = {
    infant: t('planning.childGroups.infant'),
    first: t('planning.childGroups.first'),
    second: t('planning.childGroups.second')
  }
  return labels[code] || code
}

const getChildGroupIcon = code => {
  const icons = {
    infant: 'baby_changing_station',
    first: 'child_care',
    second: 'escalator_warning'
  }
  return icons[code] || 'child_care'
}

const getChildGroupIconClass = code => {
  const classes = { infant: 'text-purple-500', first: 'text-pink-500', second: 'text-orange-500' }
  return classes[code] || 'text-pink-500'
}

const getHotelGroupAge = (code, type) => {
  const group = hotelChildAgeGroups.value.find(g => g.code === code)
  if (!group) return ''
  return type === 'min' ? group.minAge : group.maxAge
}

const addDateRange = () => {
  emit('add-date-range')
}

const removeDateRange = index => {
  emit('remove-date-range', index)
}
</script>
