<template>
  <div class="rate-form">
    <!-- Step Indicator -->
    <div class="flex items-center justify-center mb-6">
      <div class="flex items-center gap-2">
        <div
          v-for="(step, idx) in steps"
          :key="idx"
          class="flex items-center"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
            :class="currentStep >= idx
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400'"
          >
            {{ idx + 1 }}
          </div>
          <div v-if="idx < steps.length - 1" class="w-12 h-0.5 mx-1" :class="currentStep > idx ? 'bg-purple-600' : 'bg-gray-200 dark:bg-slate-600'"></div>
        </div>
      </div>
    </div>

    <!-- Step 1: Period Selection -->
    <div v-show="currentStep === 0" class="space-y-5">
      <div class="text-center mb-6">
        <h3 class="text-lg font-bold text-gray-800 dark:text-white">{{ $t('planning.pricing.step1Title') }}</h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.step1Desc') }}</p>
      </div>

      <!-- Selected Market Info -->
      <div class="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
        <span class="material-icons text-green-600">payments</span>
        <div>
          <div class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.market') }}</div>
          <div class="font-semibold text-gray-800 dark:text-white">
            {{ market?.code }} <span class="text-green-600">({{ currency }})</span>
          </div>
        </div>
      </div>

      <!-- No meal plans warning -->
      <div v-if="mealPlans.length === 0" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
        <div class="flex items-start gap-3">
          <span class="material-icons text-red-500">error</span>
          <div>
            <div class="font-medium text-red-700 dark:text-red-400">{{ $t('planning.pricing.noMealPlansWarning') }}</div>
            <p class="text-sm text-red-600 dark:text-red-300 mt-1">{{ $t('planning.pricing.noMealPlansHint') }}</p>
          </div>
        </div>
      </div>

      <!-- No seasons warning -->
      <div v-else-if="seasons.length === 0" class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
        <div class="flex items-start gap-3">
          <span class="material-icons text-amber-500">warning</span>
          <div>
            <div class="font-medium text-amber-700 dark:text-amber-400">{{ $t('planning.pricing.noSeasonsWarning') }}</div>
            <p class="text-sm text-amber-600 dark:text-amber-300 mt-1">{{ $t('planning.pricing.noSeasonsHint') }}</p>
          </div>
        </div>
      </div>

      <!-- Date Range with Season Info -->
      <div v-else>
        <label class="form-label flex items-center gap-2 mb-3">
          <span class="material-icons text-blue-600">date_range</span>
          {{ $t('planning.pricing.period') }} <span class="text-red-500">*</span>
        </label>

        <!-- Available Seasons Legend -->
        <div class="mb-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <div class="text-xs text-gray-500 dark:text-slate-400 mb-2">{{ $t('planning.pricing.availableSeasons') }}:</div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="s in seasons"
              :key="s._id"
              class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
              :class="detectedSeason?._id === s._id
                ? 'bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-500'
                : 'bg-white dark:bg-slate-600'"
            >
              <div class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: s.color }"></div>
              <span class="font-medium">{{ s.code }}</span>
              <span class="text-gray-400 dark:text-slate-400">{{ formatSeasonDates(s) }}</span>
            </div>
          </div>
        </div>

        <DateRangePickerInline
          v-model="dateRange"
          :allow-past="true"
          :min-date="allSeasonsMinDate"
          :max-date="allSeasonsMaxDate"
          :disabled-dates="disabledDates"
        />

        <!-- Detected Season Info -->
        <div v-if="detectedSeason" class="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div class="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
            <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: detectedSeason.color }"></div>
            <span class="font-medium">{{ detectedSeason.code }}</span>
            <span class="text-purple-500">{{ $t('planning.pricing.seasonAutoDetected') }}</span>
          </div>
        </div>

        <!-- No season for selected dates -->
        <div v-else-if="dateRange.start && dateRange.end && !detectedSeason" class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div class="flex items-start gap-2">
            <span class="material-icons text-red-500 text-sm">error</span>
            <div class="text-sm text-red-700 dark:text-red-300">{{ $t('planning.pricing.noSeasonForDates') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: Pricing by Room Type Tabs -->
    <div v-show="currentStep === 1" class="space-y-4">
      <div class="text-center mb-4">
        <h3 class="text-lg font-bold text-gray-800 dark:text-white">{{ $t('planning.pricing.step2Title') }}</h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.step2Desc') }}</p>
      </div>

      <!-- Period Summary -->
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="material-icons text-blue-600 text-sm">date_range</span>
            <span class="text-sm font-medium text-gray-800 dark:text-white">
              {{ formatDisplayDate(dateRange.start) }} - {{ formatDisplayDate(dateRange.end) }}
            </span>
          </div>
          <div class="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 rounded-full text-xs font-bold text-blue-800 dark:text-blue-200">
            {{ calculateNights }} {{ $t('planning.pricing.nights') }}
          </div>
          <div class="flex items-center gap-1">
            <span class="material-icons text-green-600 text-sm">payments</span>
            <span class="text-sm font-bold text-green-600">{{ currency }}</span>
          </div>
        </div>
        <button @click="currentStep = 0" class="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1">
          <span class="material-icons text-sm">edit</span>
          {{ $t('common.edit') }}
        </button>
      </div>

      <!-- Room Type Tabs (Sticky) -->
      <div class="sticky -top-6 z-10 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm pt-6 pb-0">
        <div class="flex gap-1 overflow-x-auto pb-px">
          <button
            v-for="rt in filteredRoomTypes"
            :key="rt._id"
            type="button"
            @click="selectedRoomTab = rt._id"
            class="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px"
            :class="[
              selectedRoomTab === rt._id
                ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 hover:border-gray-300',
              rt.isBaseRoom ? 'ring-2 ring-yellow-400 ring-offset-1' : '',
              !hasExplicitBaseRoom && !hasRoomPrices(rt._id) ? 'ring-2 ring-red-300 dark:ring-red-700 ring-offset-1' : ''
            ]"
          >
            <div class="flex items-center gap-1.5">
              <!-- Base room star -->
              <span v-if="rt.isBaseRoom" class="material-icons text-yellow-500 text-sm">star</span>
              <!-- Calculated icon for non-base rooms -->
              <span v-else-if="hasExplicitBaseRoom" class="text-green-500 text-xs font-bold italic">fx</span>
              <span class="font-bold">{{ rt.code }}</span>
              <!-- Price indicator (only show when NOT using base room pricing) -->
              <template v-if="!hasExplicitBaseRoom">
                <span v-if="hasRoomPrices(rt._id)" class="w-2 h-2 rounded-full bg-green-500"></span>
                <span v-else class="material-icons text-red-500 text-sm">error</span>
              </template>
            </div>
          </button>
        </div>
      </div>

      <!-- Missing Prices Warning -->
      <div v-if="roomsMissingPrices.length > 0" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-3">
        <span class="material-icons text-red-500">warning</span>
        <div>
          <div class="font-medium text-red-700 dark:text-red-400">{{ $t('planning.pricing.allRoomsPriceRequired') }}</div>
          <div class="text-sm text-red-600 dark:text-red-300 mt-1">
            {{ $t('planning.pricing.missingPricesFor') }}:
            <span class="font-bold">{{ roomsMissingPrices.map(r => r.code).join(', ') }}</span>
          </div>
        </div>
      </div>

      <!-- Selected Room Tab Content -->
      <div v-if="selectedRoomTab && roomRestrictions[selectedRoomTab]" class="space-y-4">
        <!-- Room Info with Allotment, MinStay, Release -->
        <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <!-- Room Info -->
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                {{ currentRoomType?.code }}
              </div>
              <div>
                <div class="font-medium text-gray-800 dark:text-white text-sm">{{ getRoomTypeName(currentRoomType) }}</div>
                <div class="text-xs text-gray-500 dark:text-slate-400">
                  {{ currentRoomType?.occupancy?.maxAdults || 2 }}+{{ currentRoomType?.occupancy?.maxChildren || 2 }}
                </div>
              </div>
            </div>

            <!-- Allotment, MinStay, Release Inputs -->
            <div class="flex items-center gap-6">
              <!-- Allotment -->
              <div class="flex flex-col items-center">
                <span class="text-[10px] text-gray-400 dark:text-slate-500 uppercase mb-1">{{ $t('planning.pricing.allotment') }}</span>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    @click="roomRestrictions[selectedRoomTab].allotment = Math.max(0, roomRestrictions[selectedRoomTab].allotment - 1)"
                    class="w-7 h-7 rounded bg-gray-200 dark:bg-slate-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                  >
                    <span class="material-icons text-sm">remove</span>
                  </button>
                  <input
                    v-model.number="roomRestrictions[selectedRoomTab].allotment"
                    type="number"
                    min="0"
                    class="w-14 text-center text-sm font-bold border-2 border-blue-300 dark:border-blue-700 rounded-lg py-1.5 bg-white dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    @click="roomRestrictions[selectedRoomTab].allotment++"
                    class="w-7 h-7 rounded bg-gray-200 dark:bg-slate-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                  >
                    <span class="material-icons text-sm">add</span>
                  </button>
                </div>
              </div>

              <!-- MinStay -->
              <div class="flex flex-col items-center">
                <span class="text-[10px] text-gray-400 dark:text-slate-500 uppercase mb-1">{{ $t('planning.pricing.minStay') }}</span>
                <div class="flex items-center gap-1">
                  <input
                    v-model.number="roomRestrictions[selectedRoomTab].minStay"
                    type="number"
                    min="1"
                    max="30"
                    class="w-14 text-center text-sm font-bold border-2 border-purple-300 dark:border-purple-700 rounded-lg py-1.5 bg-white dark:bg-slate-800"
                  />
                  <span class="text-xs text-gray-400">{{ $t('planning.pricing.nightsShort') }}</span>
                </div>
              </div>

              <!-- Release Days -->
              <div class="flex flex-col items-center">
                <span class="text-[10px] text-gray-400 dark:text-slate-500 uppercase mb-1">Release</span>
                <div class="flex items-center gap-1">
                  <input
                    v-model.number="roomRestrictions[selectedRoomTab].releaseDays"
                    type="number"
                    min="0"
                    class="w-14 text-center text-sm font-bold border-2 border-amber-300 dark:border-amber-700 rounded-lg py-1.5 bg-white dark:bg-slate-800"
                  />
                  <span class="text-xs text-gray-400">{{ $t('planning.pricing.daysShort') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Base Room Pricing Info (when base room is explicitly set) -->
        <div v-if="hasExplicitBaseRoom" class="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 mb-4">
          <div class="flex items-start gap-3">
            <span class="material-icons text-yellow-600 text-2xl">auto_fix_high</span>
            <div class="flex-1">
              <div class="font-medium text-yellow-800 dark:text-yellow-300 mb-1">{{ $t('planning.pricing.baseRoomPricingActive') }}</div>
              <p class="text-sm text-yellow-700 dark:text-yellow-400">
                {{ $t('planning.pricing.baseRoomPricingInfo') }}
              </p>
              <!-- Show which room is base -->
              <div class="mt-2 flex items-center gap-2 flex-wrap">
                <span class="text-xs text-yellow-600 dark:text-yellow-400">{{ $t('planning.pricing.baseRoom') }}:</span>
                <span class="px-2 py-0.5 bg-yellow-200 dark:bg-yellow-800 rounded text-sm font-bold text-yellow-800 dark:text-yellow-200">
                  {{ baseRoom?.code }}
                </span>
                <span v-if="baseMealPlan" class="text-xs text-yellow-600 dark:text-yellow-400 ml-2">{{ $t('planning.pricing.baseMealPlan') }}:</span>
                <span v-if="baseMealPlan" class="px-2 py-0.5 bg-yellow-200 dark:bg-yellow-800 rounded text-sm font-bold text-yellow-800 dark:text-yellow-200">
                  {{ baseMealPlan?.code }}
                </span>
              </div>
              <!-- Current room indicator -->
              <div v-if="!isCurrentRoomBase" class="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <span class="material-icons text-sm">info</span>
                {{ $t('planning.pricing.viewingCalculatedRoom', { room: currentRoomType?.code }) }}
              </div>
              <!-- Allow edit calculated checkbox -->
              <label class="mt-3 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="allowEditCalculated"
                  class="w-4 h-4 rounded border-yellow-400 text-yellow-600 focus:ring-yellow-500"
                />
                <span class="text-sm text-yellow-700 dark:text-yellow-400">
                  {{ $t('planning.pricing.allowEditCalculated') }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Meal Plan Pricing Table -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <!-- Header: Meal Plan Codes -->
              <thead>
                <tr class="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600">
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 w-60 min-w-[240px]">
                    {{ currency }}
                  </th>
                  <th
                    v-for="mp in filteredMealPlans"
                    :key="mp._id"
                    class="px-2 py-3 text-center"
                  >
                    <div
                      class="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold"
                      :class="[
                        getMealPlanBg(mp.code),
                        mp.isBaseMealPlan || (baseMealPlan && baseMealPlan._id === mp._id) ? 'ring-2 ring-yellow-400' : ''
                      ]"
                    >
                      <span v-if="mp.isBaseMealPlan || (baseMealPlan && baseMealPlan._id === mp._id)" class="material-icons text-yellow-500 text-sm">star</span>
                      {{ mp.code }}
                      <span v-if="mp.priceAdjustment && mp.priceAdjustment !== 0" class="text-xs opacity-70">
                        {{ mp.priceAdjustment > 0 ? '+' : '' }}{{ mp.priceAdjustment }}%
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- Base Price Row -->
                <tr class="border-b border-gray-100 dark:border-slate-700 bg-green-50/50 dark:bg-green-900/10">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span class="material-icons text-green-600 text-lg">hotel</span>
                      <span class="font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.pricing.basePrice') }}</span>
                      <!-- Show base room indicator if this is the base room -->
                      <span
                        v-if="currentRoomType?.isBaseRoom || (baseRoom && baseRoom._id === selectedRoomTab)"
                        class="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded"
                      >
                        <span class="material-icons text-xs">star</span>
                        {{ $t('planning.pricing.baseRoom') }}
                      </span>
                      <!-- Show adjustment if not base room -->
                      <span
                        v-else-if="currentRoomType?.priceAdjustment && currentRoomType.priceAdjustment !== 0"
                        class="text-xs px-1.5 py-0.5 rounded"
                        :class="currentRoomType.priceAdjustment > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
                      >
                        {{ currentRoomType.priceAdjustment > 0 ? '+' : '' }}{{ currentRoomType.priceAdjustment }}%
                      </span>
                    </div>
                  </td>
                  <td
                    v-for="mp in filteredMealPlans"
                    :key="mp._id"
                    class="px-2 py-3 text-center"
                  >
                    <div class="relative">
                      <input
                        v-if="roomPrices[selectedRoomTab]?.[mp._id]"
                        v-model.number="roomPrices[selectedRoomTab][mp._id].pricePerNight"
                        type="number"
                        min="0"
                        step="1"
                        class="w-24 text-center text-lg font-bold border-2 rounded-lg px-2 py-1.5 transition-colors"
                        :class="[
                          isBaseCell(selectedRoomTab, mp._id) ? 'border-yellow-400 dark:border-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 ring-2 ring-yellow-400 shadow-lg' :
                          isCalculatedCell(selectedRoomTab, mp._id) && !allowEditCalculated ? 'border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500' :
                          roomPrices[selectedRoomTab][mp._id]?.pricePerNight > 0 ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' :
                          'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'
                        ]"
                        :readonly="isCalculatedCell(selectedRoomTab, mp._id) && !allowEditCalculated"
                        placeholder="0"
                      />
                      <!-- Star icon for base cell -->
                      <span
                        v-if="isBaseCell(selectedRoomTab, mp._id)"
                        class="absolute -top-2 -left-2 text-yellow-500"
                        :title="$t('planning.pricing.baseCell')"
                      >
                        <span class="material-icons text-lg">star</span>
                      </span>
                      <!-- Lock icon for calculated cells -->
                      <span
                        v-else-if="isCalculatedCell(selectedRoomTab, mp._id) && !allowEditCalculated"
                        class="absolute -top-1 -right-1 text-amber-500"
                        :title="$t('planning.pricing.autoCalculated')"
                      >
                        <span class="material-icons text-sm">lock</span>
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Extra Adult Row -->
                <tr class="border-b border-gray-100 dark:border-slate-700">
                  <td class="px-4 py-2">
                    <div class="flex items-center gap-2">
                      <span class="material-icons text-amber-500 text-sm">person_add</span>
                      <span class="text-gray-600 dark:text-slate-400">{{ $t('planning.pricing.extraAdultShort') }}</span>
                    </div>
                  </td>
                  <td
                    v-for="mp in filteredMealPlans"
                    :key="mp._id"
                    class="px-2 py-2 text-center"
                  >
                    <div class="flex items-center justify-center gap-1">
                      <span class="text-xs text-gray-400">+</span>
                      <input
                        v-if="roomPrices[selectedRoomTab]?.[mp._id]"
                        v-model.number="roomPrices[selectedRoomTab][mp._id].extraAdult"
                        type="number"
                        min="0"
                        class="w-20 text-center text-sm border rounded-lg px-2 py-1"
                        :class="isCalculatedCell(selectedRoomTab, mp._id) && !allowEditCalculated
                          ? 'border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500'
                          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'"
                        :readonly="isCalculatedCell(selectedRoomTab, mp._id) && !allowEditCalculated"
                        placeholder="0"
                      />
                    </div>
                  </td>
                </tr>

                <!-- Child Order Pricing Rows -->
                <tr
                  v-for="childIndex in maxChildrenForCurrentRoom"
                  :key="'child-' + childIndex"
                  class="border-b border-gray-100 dark:border-slate-700"
                >
                  <td class="px-4 py-2">
                    <div class="flex flex-col gap-0.5">
                      <div class="flex items-center gap-2">
                        <span class="material-icons text-pink-500 text-sm">child_care</span>
                        <span class="text-gray-600 dark:text-slate-400">{{ childIndex }}. {{ $t('planning.pricing.child') }}</span>
                      </div>
                      <!-- Age source indicator - only show on first child row, on new line -->
                      <span
                        v-if="childIndex === 1"
                        class="text-xs px-1.5 py-0.5 rounded w-fit ml-6"
                        :class="{
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': ageSettings.childSource === 'hotel',
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': ageSettings.childSource === 'market',
                          'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': ageSettings.childSource === 'season'
                        }"
                        :title="$t('planning.pricing.ageSourceTooltip.' + ageSettings.childSource)"
                      >
                        0-{{ ageSettings.childMaxAge }} {{ $t('planning.pricing.age') }}
                        <span class="opacity-70">({{ $t('planning.pricing.ageSource.' + ageSettings.childSource) }})</span>
                      </span>
                    </div>
                  </td>
                  <td
                    v-for="mp in filteredMealPlans"
                    :key="mp._id"
                    class="px-2 py-2 text-center"
                  >
                    <div class="flex items-center justify-center gap-1">
                      <span class="text-xs text-gray-400">+</span>
                      <input
                        v-if="roomPrices[selectedRoomTab]?.[mp._id]?.childOrderPricing"
                        v-model.number="roomPrices[selectedRoomTab][mp._id].childOrderPricing[childIndex - 1]"
                        type="number"
                        min="0"
                        class="w-20 text-center text-sm border rounded-lg px-2 py-1"
                        :class="isCalculatedCell(selectedRoomTab, mp._id) && !allowEditCalculated
                          ? 'border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500'
                          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'"
                        :readonly="isCalculatedCell(selectedRoomTab, mp._id) && !allowEditCalculated"
                        placeholder="0"
                      />
                    </div>
                  </td>
                </tr>

                <!-- Extra Infant Row -->
                <tr class="border-b border-gray-100 dark:border-slate-700">
                  <td class="px-4 py-2">
                    <div class="flex flex-col gap-0.5">
                      <div class="flex items-center gap-2">
                        <span class="material-icons text-purple-500 text-sm">baby_changing_station</span>
                        <span class="text-gray-600 dark:text-slate-400">{{ $t('planning.pricing.extraInfantShort') }}</span>
                      </div>
                      <!-- Age source indicator on new line -->
                      <span
                        class="text-xs px-1.5 py-0.5 rounded w-fit ml-6"
                        :class="{
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': ageSettings.infantSource === 'hotel',
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': ageSettings.infantSource === 'market',
                          'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': ageSettings.infantSource === 'season'
                        }"
                        :title="$t('planning.pricing.ageSourceTooltip.' + ageSettings.infantSource)"
                      >
                        0-{{ ageSettings.infantMaxAge }} {{ $t('planning.pricing.age') }}
                        <span class="opacity-70">({{ $t('planning.pricing.ageSource.' + ageSettings.infantSource) }})</span>
                      </span>
                    </div>
                  </td>
                  <td
                    v-for="mp in filteredMealPlans"
                    :key="mp._id"
                    class="px-2 py-2 text-center"
                  >
                    <div class="flex items-center justify-center gap-1">
                      <span class="text-xs text-gray-400">+</span>
                      <input
                        v-if="roomPrices[selectedRoomTab]?.[mp._id]"
                        v-model.number="roomPrices[selectedRoomTab][mp._id].extraInfant"
                        type="number"
                        min="0"
                        class="w-20 text-center text-sm border rounded-lg px-2 py-1"
                        :class="isCalculatedCell(selectedRoomTab, mp._id) && !allowEditCalculated
                          ? 'border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500'
                          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'"
                        :readonly="isCalculatedCell(selectedRoomTab, mp._id) && !allowEditCalculated"
                        placeholder="0"
                      />
                    </div>
                  </td>
                </tr>

                <!-- Single Occupancy Discount Row -->
                <tr class="bg-blue-50/50 dark:bg-blue-900/10">
                  <td class="px-4 py-2">
                    <div class="flex items-center gap-2">
                      <span class="material-icons text-blue-500 text-sm">person</span>
                      <span class="text-gray-600 dark:text-slate-400">{{ $t('planning.pricing.singleOccupancy') }}</span>
                    </div>
                  </td>
                  <td
                    v-for="mp in filteredMealPlans"
                    :key="mp._id"
                    class="px-2 py-2 text-center"
                  >
                    <div class="flex items-center justify-center gap-1">
                      <span class="text-xs text-gray-400">−</span>
                      <input
                        v-if="roomPrices[selectedRoomTab]?.[mp._id]"
                        v-model.number="roomPrices[selectedRoomTab][mp._id].singleSupplement"
                        type="number"
                        min="0"
                        class="w-20 text-center text-sm border rounded-lg px-2 py-1"
                        :class="isCalculatedCell(selectedRoomTab, mp._id) && !allowEditCalculated
                          ? 'border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500'
                          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'"
                        :readonly="isCalculatedCell(selectedRoomTab, mp._id) && !allowEditCalculated"
                        placeholder="0"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Quick Actions for Current Room -->
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.quickFill') }}:</span>
          <button
            type="button"
            @click="copyFirstPriceToAllMealPlans"
            class="text-sm px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 transition-colors"
          >
            {{ $t('planning.pricing.copyToAllMealPlans') }}
          </button>
          <button
            type="button"
            @click="copyCurrentRoomToAll"
            class="text-sm px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 transition-colors"
          >
            {{ $t('planning.pricing.copyToAllRooms') }}
          </button>
        </div>

      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="flex items-center justify-between pt-6 mt-6 border-t border-gray-200 dark:border-slate-700">
      <button
        v-if="currentStep > 0"
        type="button"
        @click="currentStep--"
        class="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white transition-colors"
      >
        <span class="material-icons">arrow_back</span>
        {{ $t('common.back') }}
      </button>
      <div v-else></div>

      <div class="flex gap-3">
        <button
          type="button"
          @click="$emit('cancel')"
          class="btn-secondary"
        >
          {{ $t('common.cancel') }}
        </button>

        <button
          v-if="currentStep < steps.length - 1"
          type="button"
          @click="nextStep"
          class="btn-primary flex items-center gap-2"
          :disabled="!canProceed"
        >
          {{ $t('common.next') }}
          <span class="material-icons">arrow_forward</span>
        </button>

        <button
          v-else
          type="button"
          @click="handleSave"
          class="btn-primary flex items-center gap-2"
          :disabled="saving"
        >
          <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
          <span class="material-icons" v-else>check</span>
          {{ saving ? $t('common.saving') : $t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'
import DateRangePickerInline from '@/components/common/DateRangePickerInline.vue'
import { useRelativePricing } from '@/composables/useRelativePricing'

const props = defineProps({
  hotel: { type: Object, required: true },
  rate: { type: Object, default: null },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  market: { type: Object, default: null },
  seasons: { type: Array, default: () => [] },
  selectedCells: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved', 'cancel'])

const { t, locale } = useI18n()
const toast = useToast()

const saving = ref(false)
const currentStep = ref(0)
const selectedRoomTab = ref('')

const steps = [
  { key: 'period', label: 'Period' },
  { key: 'pricing', label: 'Pricing' }
]

// Date range ref object
const dateRange = ref({ start: '', end: '' })

// Form data (global settings)
const form = reactive({
  season: ''
})

// Room prices: { roomTypeId: { mealPlanId: { pricePerNight, extraAdult, childOrderPricing[], extraInfant } } }
const roomPrices = reactive({})

// Room restrictions: { roomTypeId: { allotment, minStay, maxStay, releaseDays, stopSale, closedToArrival, closedToDeparture, singleSupplement } }
const roomRestrictions = reactive({})

// Relative pricing settings
const enableRelativeCalculation = ref(true)
const allowEditCalculated = ref(false)

// Currency from selected market
const currency = computed(() => props.market?.currency || 'EUR')

// Filtered room types and meal plans based on selected season
const filteredRoomTypes = computed(() => {
  if (!form.season) return props.roomTypes

  const season = props.seasons.find(s => s._id === form.season)
  if (!season) return props.roomTypes

  // If season has activeRoomTypes defined, filter by them
  if (season.activeRoomTypes?.length > 0) {
    const activeIds = season.activeRoomTypes.map(rt => typeof rt === 'object' ? rt._id : rt)
    return props.roomTypes.filter(rt => activeIds.includes(rt._id))
  }

  // Otherwise, check market's activeRoomTypes
  if (props.market?.activeRoomTypes?.length > 0) {
    const activeIds = props.market.activeRoomTypes.map(rt => typeof rt === 'object' ? rt._id : rt)
    return props.roomTypes.filter(rt => activeIds.includes(rt._id))
  }

  return props.roomTypes
})

const filteredMealPlans = computed(() => {
  if (!form.season) return props.mealPlans

  const season = props.seasons.find(s => s._id === form.season)
  if (!season) return props.mealPlans

  // If season has activeMealPlans defined, filter by them
  if (season.activeMealPlans?.length > 0) {
    const activeIds = season.activeMealPlans.map(mp => typeof mp === 'object' ? mp._id : mp)
    return props.mealPlans.filter(mp => activeIds.includes(mp._id))
  }

  // Otherwise, check market's activeMealPlans
  if (props.market?.activeMealPlans?.length > 0) {
    const activeIds = props.market.activeMealPlans.map(mp => typeof mp === 'object' ? mp._id : mp)
    return props.mealPlans.filter(mp => activeIds.includes(mp._id))
  }

  return props.mealPlans
})

// Relative pricing composable
const roomTypesRef = computed(() => props.roomTypes)
const mealPlansRef = computed(() => props.mealPlans)
const {
  baseRoom,
  baseMealPlan,
  isBaseCell,
  isBaseRoom: isBaseRoomFn,
  calculatePrice: calcRelativePrice,
  isRelativePricingEnabled
} = useRelativePricing(roomTypesRef, mealPlansRef)

// Check if explicit base room is set (user clicked the star)
const hasExplicitBaseRoom = computed(() => props.roomTypes.some(rt => rt.isBaseRoom === true))
const hasExplicitBaseMealPlan = computed(() => props.mealPlans.some(mp => mp.isBaseMealPlan === true))

// Is current tab the base room?
const isCurrentRoomBase = computed(() => {
  if (!hasExplicitBaseRoom.value) return false
  return baseRoom.value?._id === selectedRoomTab.value
})

// Check if a cell is calculated (not the base cell, when relative pricing is active)
const isCalculatedCell = (roomId, mealPlanId) => {
  if (!hasExplicitBaseRoom.value) return false
  // If it's the base cell, it's not calculated
  if (isBaseCell(roomId, mealPlanId)) return false
  return true
}

// Calculate relative prices when base room prices change
const calculateRelativePrices = () => {
  // Only calculate if base room is explicitly set
  if (!hasExplicitBaseRoom.value) return
  if (!baseRoom.value) return

  const baseRoomId = baseRoom.value._id
  const baseMealPlanId = baseMealPlan.value?._id

  // Get the base cell price (base room + base meal plan)
  const baseCellData = roomPrices[baseRoomId]?.[baseMealPlanId]
  if (!baseCellData?.pricePerNight || baseCellData.pricePerNight <= 0) return

  const baseCellPrice = baseCellData.pricePerNight

  // Helper function to calculate price with adjustments
  const applyAdjustments = (price, roomAdj, mealAdj) => {
    // First apply room adjustment, then meal plan adjustment
    const afterRoom = price * (1 + (roomAdj || 0) / 100)
    const afterMeal = afterRoom * (1 + (mealAdj || 0) / 100)
    return Math.round(afterMeal * 100) / 100
  }

  // Calculate for all combinations
  props.roomTypes.forEach(room => {
    props.mealPlans.forEach(meal => {
      // Skip the base cell (base room + base meal plan)
      if (room._id === baseRoomId && meal._id === baseMealPlanId) return

      // Ensure the structure exists
      if (!roomPrices[room._id]) roomPrices[room._id] = {}
      if (!roomPrices[room._id][meal._id]) {
        const maxChildren = room.occupancy?.maxChildren ?? 2
        roomPrices[room._id][meal._id] = {
          pricePerNight: 0,
          extraAdult: 0,
          childOrderPricing: Array(maxChildren).fill(0),
          extraInfant: 0,
          singleSupplement: 0
        }
      }

      // Get adjustments
      const roomAdj = room.priceAdjustment || 0
      const mealAdj = meal.priceAdjustment || 0

      // Calculate relative price
      roomPrices[room._id][meal._id].pricePerNight = applyAdjustments(baseCellPrice, roomAdj, mealAdj)

      // Also calculate extra adult if base has it
      if (baseCellData.extraAdult > 0) {
        roomPrices[room._id][meal._id].extraAdult = applyAdjustments(baseCellData.extraAdult, roomAdj, mealAdj)
      }

      // Calculate child prices
      if (baseCellData.childOrderPricing?.length > 0) {
        baseCellData.childOrderPricing.forEach((childPrice, idx) => {
          if (childPrice > 0 && roomPrices[room._id][meal._id].childOrderPricing) {
            roomPrices[room._id][meal._id].childOrderPricing[idx] = applyAdjustments(childPrice, roomAdj, mealAdj)
          }
        })
      }

      // Calculate infant price
      if (baseCellData.extraInfant > 0) {
        roomPrices[room._id][meal._id].extraInfant = applyAdjustments(baseCellData.extraInfant, roomAdj, mealAdj)
      }

      // Calculate single supplement
      if (baseCellData.singleSupplement > 0) {
        roomPrices[room._id][meal._id].singleSupplement = applyAdjustments(baseCellData.singleSupplement, roomAdj, mealAdj)
      }
    })
  })
}

// Current room type
const currentRoomType = computed(() => filteredRoomTypes.value.find(rt => rt._id === selectedRoomTab.value))

// Age settings with source (Season > Market > Hotel)
const ageSettings = computed(() => {
  const hotel = props.hotel
  const market = props.market
  const selectedSeasonId = form.season
  const season = selectedSeasonId ? props.seasons.find(s => s._id === selectedSeasonId) : null

  // Default from hotel
  let childMaxAge = hotel?.policies?.maxChildAge ?? 12
  let infantMaxAge = hotel?.policies?.maxBabyAge ?? 2
  let childSource = 'hotel'
  let infantSource = 'hotel'

  // Override from market if set
  if (market?.childAgeRange?.max != null) {
    childMaxAge = market.childAgeRange.max
    childSource = 'market'
  }
  if (market?.infantAgeRange?.max != null) {
    infantMaxAge = market.infantAgeRange.max
    infantSource = 'market'
  }

  // Future: Override from season if set
  if (season?.childAgeRange?.max != null) {
    childMaxAge = season.childAgeRange.max
    childSource = 'season'
  }
  if (season?.infantAgeRange?.max != null) {
    infantMaxAge = season.infantAgeRange.max
    infantSource = 'season'
  }

  return {
    childMaxAge,
    infantMaxAge,
    childSource,
    infantSource
  }
})

// Max children for current room (for table rows)
const maxChildrenForCurrentRoom = computed(() => {
  return currentRoomType.value?.occupancy?.maxChildren ?? 2
})

const calculateNights = computed(() => {
  if (!dateRange.value.start || !dateRange.value.end) return 0
  const [sy, sm, sd] = dateRange.value.start.split('-').map(Number)
  const [ey, em, ed] = dateRange.value.end.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  return diff > 0 ? diff : 0
})

// Check if a room has any prices set
const hasRoomPrices = (roomTypeId) => {
  const prices = roomPrices[roomTypeId]
  if (!prices) return false
  return Object.values(prices).some(mp => mp.pricePerNight > 0)
}

// Check if ALL filtered rooms have at least one meal plan price (required)
// When base room pricing is active, only base room needs prices (others are calculated)
const allRoomsHavePrices = computed(() => {
  if (hasExplicitBaseRoom.value) {
    // Only base room needs to have prices
    return baseRoom.value ? hasRoomPrices(baseRoom.value._id) : false
  }
  return filteredRoomTypes.value.every(rt => hasRoomPrices(rt._id))
})

// Get filtered rooms that are missing prices
// When base room pricing is active, only check base room
const roomsMissingPrices = computed(() => {
  if (hasExplicitBaseRoom.value) {
    // Only base room matters
    if (baseRoom.value && !hasRoomPrices(baseRoom.value._id)) {
      return [baseRoom.value]
    }
    return []
  }
  return filteredRoomTypes.value.filter(rt => !hasRoomPrices(rt._id))
})

const canProceed = computed(() => {
  if (currentStep.value === 0) {
    // Must have dates
    if (!dateRange.value.start || !dateRange.value.end) return false
    // Must have a detected season (dates within a season)
    if (!detectedSeason.value) return false
    return true
  }
  if (currentStep.value === 1) {
    return allRoomsHavePrices.value
  }
  return true
})

// Methods
const getRoomTypeName = (roomType) => {
  if (!roomType) return ''
  return roomType.name?.[locale.value] || roomType.name?.tr || roomType.name?.en || ''
}

const getMealPlanName = (mealPlan) => {
  return mealPlan.name?.[locale.value] || mealPlan.name?.tr || mealPlan.name?.en || ''
}

const getMealPlanBg = (code) => {
  const colors = {
    'RO': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    'BB': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    'HB': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    'FB': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    'AI': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    'UAI': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
  }
  return colors[code] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}.${month}.${year}`
}

// Get max children for a room type
const getMaxChildrenForRoom = (roomTypeId) => {
  const roomType = props.roomTypes.find(rt => rt._id === roomTypeId)
  return roomType?.occupancy?.maxChildren ?? 2
}

// Initialize prices and restrictions for all room types (use all props, not filtered)
const initializeRoomData = () => {
  props.roomTypes.forEach(rt => {
    const maxChildren = getMaxChildrenForRoom(rt._id)

    // Initialize prices
    if (!roomPrices[rt._id]) {
      roomPrices[rt._id] = {}
    }
    props.mealPlans.forEach(mp => {
      if (!roomPrices[rt._id][mp._id]) {
        roomPrices[rt._id][mp._id] = {
          pricePerNight: 0,
          extraAdult: 0,
          childOrderPricing: Array(maxChildren).fill(0),
          extraInfant: 0,
          singleSupplement: 0
        }
      } else {
        // Add missing fields
        if (!roomPrices[rt._id][mp._id].childOrderPricing) {
          roomPrices[rt._id][mp._id].childOrderPricing = Array(maxChildren).fill(0)
        }
        if (roomPrices[rt._id][mp._id].singleSupplement === undefined) {
          roomPrices[rt._id][mp._id].singleSupplement = 0
        }
      }
    })

    // Initialize restrictions
    if (!roomRestrictions[rt._id]) {
      roomRestrictions[rt._id] = {
        allotment: 10,
        minStay: 1,
        maxStay: 30,
        releaseDays: 0,
        stopSale: false,
        singleStop: false,
        closedToArrival: false,
        closedToDeparture: false,
        singleSupplement: 0
      }
    }
  })

  // Set first filtered room as selected if not set or current selection is not in filtered list
  updateSelectedRoomTab()
}

// Update selected room tab when filter changes
const updateSelectedRoomTab = () => {
  const filtered = filteredRoomTypes.value
  if (filtered.length === 0) {
    selectedRoomTab.value = ''
    return
  }

  // If current selection is not in filtered list, select first one
  if (!selectedRoomTab.value || !filtered.find(rt => rt._id === selectedRoomTab.value)) {
    selectedRoomTab.value = filtered[0]._id
  }
}

// Watch for data changes
watch([() => props.roomTypes, () => props.mealPlans], () => {
  initializeRoomData()
}, { immediate: true, deep: true })

// Watch base cell (base room + base meal plan) prices and trigger relative calculation
watch(
  () => {
    if (!baseRoom.value || !baseMealPlan.value) return null
    // Watch the base cell specifically
    const baseCell = roomPrices[baseRoom.value._id]?.[baseMealPlan.value._id]
    return JSON.stringify(baseCell)
  },
  () => {
    // Trigger calculation whenever base cell price changes
    calculateRelativePrices()
  },
  { deep: true }
)

// Watch for season change to update filtered room types
watch(() => form.season, () => {
  updateSelectedRoomTab()
})

// Selected season info
const selectedSeasonInfo = computed(() => {
  if (!form.season) return null
  const season = props.seasons.find(s => s._id === form.season)
  if (!season?.dateRanges?.length) return null

  // Find the overall min start and max end from all date ranges
  let minStart = null
  let maxEnd = null

  season.dateRanges.forEach(range => {
    const start = new Date(range.startDate)
    const end = new Date(range.endDate)
    if (!minStart || start < minStart) minStart = start
    if (!maxEnd || end > maxEnd) maxEnd = end
  })

  return {
    startDate: minStart?.toISOString().split('T')[0],
    endDate: maxEnd?.toISOString().split('T')[0],
    dateRanges: season.dateRanges
  }
})

// Get all seasons' combined min/max dates for DateRangePicker bounds
const allSeasonsMinDate = computed(() => {
  let minDate = null
  props.seasons.forEach(season => {
    season.dateRanges?.forEach(range => {
      const start = new Date(range.startDate)
      if (!minDate || start < minDate) minDate = start
    })
  })
  return minDate
})

const allSeasonsMaxDate = computed(() => {
  let maxDate = null
  props.seasons.forEach(season => {
    season.dateRanges?.forEach(range => {
      const end = new Date(range.endDate)
      if (!maxDate || end > maxDate) maxDate = end
    })
  })
  return maxDate
})

// Build array of all valid season date ranges for checking
const allSeasonDateRanges = computed(() => {
  const ranges = []
  props.seasons.forEach(season => {
    season.dateRanges?.forEach(range => {
      ranges.push({
        seasonId: season._id,
        season: season,
        start: new Date(range.startDate),
        end: new Date(range.endDate)
      })
    })
  })
  return ranges
})

// Disabled dates (dates outside any season) - for DateRangePickerInline
const disabledDates = computed(() => {
  // We'll pass the season ranges to the picker component
  // For now, return null as the picker doesn't support this yet
  return null
})

// Auto-detect season based on selected date range
const detectedSeason = computed(() => {
  if (!dateRange.value.start || !dateRange.value.end) return null

  const selectedStart = new Date(dateRange.value.start)
  const selectedEnd = new Date(dateRange.value.end)
  selectedStart.setHours(0, 0, 0, 0)
  selectedEnd.setHours(0, 0, 0, 0)

  // Find season that contains the entire selected range
  for (const season of props.seasons) {
    const matchingRange = season.dateRanges?.some(range => {
      const rangeStart = new Date(range.startDate)
      const rangeEnd = new Date(range.endDate)
      rangeStart.setHours(0, 0, 0, 0)
      rangeEnd.setHours(0, 0, 0, 0)
      return selectedStart >= rangeStart && selectedEnd <= rangeEnd
    })
    if (matchingRange) return season
  }
  return null
})

// Auto-update form.season when detectedSeason changes
watch(detectedSeason, (newSeason) => {
  if (newSeason) {
    form.season = newSeason._id
  } else {
    form.season = ''
  }
})

// Format season dates for display in legend
const formatSeasonDates = (season) => {
  if (!season?.dateRanges?.length) return ''
  const range = season.dateRanges[0]
  const start = new Date(range.startDate)
  const end = new Date(range.endDate)
  return `${start.getDate()}.${start.getMonth() + 1} - ${end.getDate()}.${end.getMonth() + 1}`
}

// Copy first meal plan price to all meal plans (current room) - uses filtered
const copyFirstPriceToAllMealPlans = () => {
  const firstMealPlan = filteredMealPlans.value[0]
  if (!firstMealPlan || !roomPrices[selectedRoomTab.value]?.[firstMealPlan._id]) return

  const source = roomPrices[selectedRoomTab.value][firstMealPlan._id]
  filteredMealPlans.value.forEach(mp => {
    if (mp._id !== firstMealPlan._id) {
      roomPrices[selectedRoomTab.value][mp._id] = { ...source }
    }
  })
  toast.success(t('planning.pricing.copiedToMealPlans'))
}

// Copy current room's prices to all rooms - uses filtered
const copyCurrentRoomToAll = () => {
  const source = roomPrices[selectedRoomTab.value]
  if (!source) return

  filteredRoomTypes.value.forEach(rt => {
    if (rt._id !== selectedRoomTab.value) {
      roomPrices[rt._id] = {}
      filteredMealPlans.value.forEach(mp => {
        roomPrices[rt._id][mp._id] = { ...source[mp._id] }
      })
    }
  })
  toast.success(t('planning.pricing.copiedToRooms'))
}


const nextStep = () => {
  if (canProceed.value && currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const handleSave = async () => {
  if (!canProceed.value) {
    toast.error(t('validation.required'))
    return
  }

  if (!props.market?._id) {
    toast.error(t('planning.pricing.selectMarket'))
    return
  }

  saving.value = true
  try {
    const promises = []

    // Create rates for each filtered room type that has prices
    filteredRoomTypes.value.forEach(rt => {
      const prices = roomPrices[rt._id]
      const restrictions = roomRestrictions[rt._id]

      // For each filtered meal plan that has a price > 0
      filteredMealPlans.value.forEach(mp => {
        const mealPlanPrice = prices?.[mp._id]
        if (mealPlanPrice?.pricePerNight > 0) {
          const data = {
            roomType: rt._id,
            mealPlan: mp._id,
            market: props.market._id,
            startDate: dateRange.value.start,
            endDate: dateRange.value.end,
            season: form.season || undefined,
            pricePerNight: mealPlanPrice.pricePerNight,
            singleSupplement: mealPlanPrice.singleSupplement || 0,
            extraAdult: mealPlanPrice.extraAdult || 0,
            childOrderPricing: mealPlanPrice.childOrderPricing || [],
            extraInfant: mealPlanPrice.extraInfant || 0,
            currency: currency.value,
            allotment: restrictions?.allotment ?? 10,
            minStay: restrictions?.minStay || 1,
            maxStay: restrictions?.maxStay || 30,
            releaseDays: restrictions?.releaseDays || 0,
            stopSale: restrictions?.stopSale || false,
            singleStop: restrictions?.singleStop || false,
            closedToArrival: restrictions?.closedToArrival || false,
            closedToDeparture: restrictions?.closedToDeparture || false
          }

          if (!data.season) delete data.season

          promises.push(planningService.createRate(props.hotel._id, data))
        }
      })
    })

    if (promises.length === 0) {
      toast.error(t('planning.pricing.atLeastOnePrice'))
      return
    }

    await Promise.all(promises)
    toast.success(t('planning.pricing.ratesCreated', { count: promises.length }))
    emit('saved')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

// Fetch last rate for this market and set suggested next period
const fetchLastRateAndSetDates = async () => {
  if (!props.market?._id || !props.hotel?._id) return

  try {
    const response = await planningService.getRates(props.hotel._id, {
      market: props.market._id
    })

    // Handle response format
    let rates = []
    if (response.success) {
      if (Array.isArray(response.data)) {
        rates = response.data
      } else if (response.data?.rates) {
        rates = response.data.rates
      }
    }

    if (rates.length > 0) {
      // Daily rate model: each rate has a single 'date' field
      // Find the rate with the latest date
      const sortedRates = [...rates].sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateB - dateA // Sort descending
      })

      const lastRate = sortedRates[0]
      const lastDate = new Date(lastRate.date)

      // Set start date to day after last rate
      const nextStartDate = new Date(lastDate)
      nextStartDate.setDate(nextStartDate.getDate() + 1)

      // Set end date to 30 days later (default duration)
      const nextEndDate = new Date(nextStartDate)
      nextEndDate.setDate(nextEndDate.getDate() + 29)

      // Format dates as YYYY-MM-DD
      const formatDate = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      dateRange.value.start = formatDate(nextStartDate)
      dateRange.value.end = formatDate(nextEndDate)

      console.log('Last rate date:', formatDate(lastDate))
      console.log('Suggested next period:', dateRange.value.start, '-', dateRange.value.end)
    } else {
      // No existing rates - start from first day of last season
      const formatDate = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      // Find the last season (by end date)
      let lastSeason = null
      let lastSeasonEndDate = null

      props.seasons.forEach(season => {
        season.dateRanges?.forEach(range => {
          const endDate = new Date(range.endDate)
          if (!lastSeasonEndDate || endDate > lastSeasonEndDate) {
            lastSeasonEndDate = endDate
            lastSeason = { season, range }
          }
        })
      })

      if (lastSeason) {
        // Start from the first day of the last season's range
        const startDate = new Date(lastSeason.range.startDate)
        const endDate = new Date(lastSeason.range.endDate)

        dateRange.value.start = formatDate(startDate)
        dateRange.value.end = formatDate(endDate)

        console.log('No rates found - starting from last season:', lastSeason.season.code)
      } else {
        // No seasons either - default to today + 30 days
        const today = new Date()
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + 30)

        dateRange.value.start = formatDate(today)
        dateRange.value.end = formatDate(endDate)
      }
    }
  } catch (error) {
    console.error('Error fetching last rate:', error)
    // Set default dates on error
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 30)

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    dateRange.value.start = formatDate(today)
    dateRange.value.end = formatDate(endDate)
  }
}

// Initialize
onMounted(async () => {
  initializeRoomData()

  // If bulk creating from selected cells
  if (props.selectedCells?.length > 0) {
    const dates = props.selectedCells.map(c => c.date).sort()
    dateRange.value.start = dates[0]
    dateRange.value.end = dates[dates.length - 1]

    // Get room type from first cell
    const firstCell = props.selectedCells[0]
    if (firstCell.roomTypeId) {
      selectedRoomTab.value = firstCell.roomTypeId
    }
  } else {
    // Fetch last rate and set suggested dates
    await fetchLastRateAndSetDates()
  }
})
</script>

<style scoped>
/* Modal handles scrolling */
</style>
