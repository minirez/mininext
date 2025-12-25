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

      <!-- Date Range -->
      <div>
        <label class="form-label flex items-center gap-2 mb-3">
          <span class="material-icons text-blue-600">date_range</span>
          {{ $t('planning.pricing.period') }} <span class="text-red-500">*</span>
        </label>
        <DateRangePickerInline
          v-model="dateRange"
          :allow-past="true"
          :min-date="seasonMinDate"
          :max-date="seasonMaxDate"
        />
      </div>

      <!-- Season (Optional) -->
      <div v-if="seasons.length > 0">
        <label class="form-label">{{ $t('planning.pricing.season') }} <span class="text-gray-400">({{ $t('common.optional') }})</span></label>
        <div class="flex flex-wrap gap-2 mt-2">
          <button
            type="button"
            @click="form.season = ''"
            class="px-3 py-1.5 rounded-lg border-2 text-sm transition-all"
            :class="!form.season
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-slate-600'"
          >
            {{ $t('common.none') }}
          </button>
          <button
            v-for="s in seasons"
            :key="s._id"
            type="button"
            @click="form.season = s._id"
            class="px-3 py-1.5 rounded-lg border-2 text-sm transition-all flex items-center gap-2"
            :class="form.season === s._id
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-slate-600'"
          >
            <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: s.color }"></div>
            {{ s.code }}
          </button>
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

      <!-- Room Type Tabs -->
      <div class="border-b border-gray-200 dark:border-slate-700">
        <div class="flex gap-1 overflow-x-auto pb-px">
          <button
            v-for="rt in roomTypes"
            :key="rt._id"
            type="button"
            @click="selectedRoomTab = rt._id"
            class="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px"
            :class="[
              selectedRoomTab === rt._id
                ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 hover:border-gray-300',
              !hasRoomPrices(rt._id) ? 'ring-2 ring-red-300 dark:ring-red-700 ring-offset-1' : ''
            ]"
          >
            <div class="flex items-center gap-2">
              <span class="font-bold">{{ rt.code }}</span>
              <span v-if="hasRoomPrices(rt._id)" class="w-2 h-2 rounded-full bg-green-500"></span>
              <span v-else class="material-icons text-red-500 text-sm">error</span>
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
      <div v-if="selectedRoomTab" class="space-y-4">
        <!-- Room Info -->
        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold">
            {{ currentRoomType?.code }}
          </div>
          <div>
            <div class="font-medium text-gray-800 dark:text-white">{{ getRoomTypeName(currentRoomType) }}</div>
            <div class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
              <span class="material-icons text-xs">person</span>
              {{ currentRoomType?.occupancy?.baseOccupancy || 2 }} {{ $t('planning.pricing.standardOccupancy') }}
            </div>
          </div>
        </div>

        <!-- Meal Plan Pricing Cards -->
        <div class="space-y-4">
          <div
            v-for="mp in mealPlans"
            :key="mp._id"
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
          >
            <!-- Meal Plan Header -->
            <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600">
              <span
                class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                :class="getMealPlanBg(mp.code)"
              >
                {{ mp.code }}
              </span>
              <div class="font-medium text-gray-800 dark:text-white">{{ getMealPlanName(mp) }}</div>
            </div>

            <!-- Pricing Fields -->
            <div class="p-4 space-y-3">
              <!-- Base Price -->
              <div class="flex items-center gap-4">
                <label class="text-sm text-gray-600 dark:text-slate-400 w-32">{{ $t('planning.pricing.basePrice') }}</label>
                <div class="flex items-center gap-2">
                  <input
                    v-if="roomPrices[selectedRoomTab]?.[mp._id]"
                    v-model.number="roomPrices[selectedRoomTab][mp._id].pricePerNight"
                    type="number"
                    min="0"
                    step="1"
                    class="w-28 text-center text-lg font-bold border-2 rounded-lg px-2 py-1.5 transition-colors"
                    :class="roomPrices[selectedRoomTab][mp._id]?.pricePerNight > 0
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'"
                    placeholder="0"
                  />
                  <span class="text-sm text-gray-500">{{ currency }}</span>
                </div>
              </div>

              <!-- Extra Person Prices -->
              <div class="pt-3 border-t border-gray-100 dark:border-slate-700 space-y-2">
                <div class="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">{{ $t('planning.pricing.extraPrices') }}</div>

                <!-- Extra Adult -->
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2 w-32">
                    <span class="material-icons text-amber-500 text-sm">person_add</span>
                    <span class="text-xs text-gray-600 dark:text-slate-400">{{ $t('planning.pricing.extraAdultShort') }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="text-xs text-gray-400">+</span>
                    <input
                      v-if="roomPrices[selectedRoomTab]?.[mp._id]"
                      v-model.number="roomPrices[selectedRoomTab][mp._id].extraAdult"
                      type="number"
                      min="0"
                      class="w-20 text-center text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-800"
                      placeholder="0"
                    />
                  </div>
                </div>

                <!-- Child Order Pricing -->
                <div
                  v-for="(childPrice, childIndex) in roomPrices[selectedRoomTab]?.[mp._id]?.childOrderPricing || []"
                  :key="childIndex"
                  class="flex items-center gap-4"
                >
                  <div class="flex items-center gap-2 w-32">
                    <span class="material-icons text-pink-500 text-sm">child_care</span>
                    <span class="text-xs text-gray-600 dark:text-slate-400">{{ childIndex + 1 }}. {{ $t('planning.pricing.child') }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="text-xs text-gray-400">+</span>
                    <input
                      v-model.number="roomPrices[selectedRoomTab][mp._id].childOrderPricing[childIndex]"
                      type="number"
                      min="0"
                      class="w-20 text-center text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-800"
                      placeholder="0"
                    />
                  </div>
                </div>

                <!-- Extra Infant -->
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2 w-32">
                    <span class="material-icons text-purple-500 text-sm">baby_changing_station</span>
                    <span class="text-xs text-gray-600 dark:text-slate-400">{{ $t('planning.pricing.extraInfantShort') }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="text-xs text-gray-400">+</span>
                    <input
                      v-if="roomPrices[selectedRoomTab]?.[mp._id]"
                      v-model.number="roomPrices[selectedRoomTab][mp._id].extraInfant"
                      type="number"
                      min="0"
                      class="w-20 text-center text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-800"
                      placeholder="0"
                    />
                  </div>
                </div>

                <!-- Single Occupancy Discount -->
                <div class="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-slate-700 mt-2">
                  <div class="flex items-center gap-2 w-32">
                    <span class="material-icons text-blue-500 text-sm">person</span>
                    <span class="text-xs text-gray-600 dark:text-slate-400">{{ $t('planning.pricing.singleOccupancy') }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="text-xs text-gray-400">-</span>
                    <input
                      v-if="roomPrices[selectedRoomTab]?.[mp._id]"
                      v-model.number="roomPrices[selectedRoomTab][mp._id].singleSupplement"
                      type="number"
                      min="0"
                      class="w-20 text-center text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-800"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
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

    <!-- Step 3: Inventory & Restrictions -->
    <div v-show="currentStep === 2" class="space-y-5">
      <div class="text-center mb-6">
        <h3 class="text-lg font-bold text-gray-800 dark:text-white">{{ $t('planning.pricing.step3Title') }}</h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.step3Desc') }}</p>
      </div>

      <!-- Room Tabs for Restrictions -->
      <div class="border-b border-gray-200 dark:border-slate-700">
        <div class="flex gap-1 overflow-x-auto pb-px">
          <button
            v-for="rt in roomTypes"
            :key="rt._id"
            type="button"
            @click="selectedRoomTab = rt._id"
            class="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px"
            :class="selectedRoomTab === rt._id
              ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 hover:border-gray-300'"
          >
            {{ rt.code }}
          </button>
        </div>
      </div>

      <!-- Restrictions for Selected Room -->
      <div v-if="selectedRoomTab && roomRestrictions[selectedRoomTab]" class="space-y-4">
        <!-- Allotment -->
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                <span class="material-icons text-blue-600">inventory_2</span>
                {{ $t('planning.pricing.allotment') }}
              </label>
              <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">{{ $t('planning.pricing.allotmentHint') }}</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="roomRestrictions[selectedRoomTab].allotment = Math.max(0, roomRestrictions[selectedRoomTab].allotment - 1)"
                class="w-10 h-10 rounded-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-100"
              >
                <span class="material-icons">remove</span>
              </button>
              <input
                v-model.number="roomRestrictions[selectedRoomTab].allotment"
                type="number"
                min="0"
                class="w-20 text-center text-2xl font-bold border-2 border-blue-300 dark:border-blue-700 rounded-lg py-2 bg-white dark:bg-slate-800"
              />
              <button
                type="button"
                @click="roomRestrictions[selectedRoomTab].allotment++"
                class="w-10 h-10 rounded-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-100"
              >
                <span class="material-icons">add</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Stay Restrictions -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
              <span class="material-icons text-purple-600 text-lg">nights_stay</span>
              {{ $t('planning.pricing.minStay') }}
            </label>
            <div class="flex items-center gap-2 mt-2">
              <input
                v-model.number="roomRestrictions[selectedRoomTab].minStay"
                type="number"
                min="1"
                max="30"
                class="form-input"
              />
              <span class="text-sm text-gray-500">{{ $t('planning.pricing.nights') }}</span>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
              <span class="material-icons text-purple-600 text-lg">date_range</span>
              {{ $t('planning.pricing.maxStay') }}
            </label>
            <div class="flex items-center gap-2 mt-2">
              <input
                v-model.number="roomRestrictions[selectedRoomTab].maxStay"
                type="number"
                min="1"
                max="365"
                class="form-input"
              />
              <span class="text-sm text-gray-500">{{ $t('planning.pricing.nights') }}</span>
            </div>
          </div>
        </div>

        <!-- Release Days -->
        <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
            <span class="material-icons text-orange-600 text-lg">schedule</span>
            {{ $t('planning.pricing.releaseDays') }}
          </label>
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">{{ $t('planning.pricing.releaseDaysHint') }}</p>
          <div class="flex items-center gap-2 mt-2">
            <input
              v-model.number="roomRestrictions[selectedRoomTab].releaseDays"
              type="number"
              min="0"
              class="w-24 form-input"
            />
            <span class="text-sm text-gray-500">{{ $t('planning.pricing.daysBeforeArrival') }}</span>
          </div>
        </div>

        <!-- Booking Restrictions -->
        <div class="space-y-3">
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.pricing.bookingRestrictions') }}</label>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- Stop Sale -->
            <label
              class="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
              :class="roomRestrictions[selectedRoomTab].stopSale
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
            >
              <input type="checkbox" v-model="roomRestrictions[selectedRoomTab].stopSale" class="sr-only" />
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center"
                :class="roomRestrictions[selectedRoomTab].stopSale ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-500'"
              >
                <span class="material-icons">block</span>
              </div>
              <div>
                <div class="font-medium" :class="roomRestrictions[selectedRoomTab].stopSale ? 'text-red-600' : 'text-gray-700 dark:text-slate-300'">
                  {{ $t('planning.pricing.stopSale') }}
                </div>
                <div class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.stopSaleHint') }}</div>
              </div>
            </label>

            <!-- CTA -->
            <label
              class="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
              :class="roomRestrictions[selectedRoomTab].closedToArrival
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
            >
              <input type="checkbox" v-model="roomRestrictions[selectedRoomTab].closedToArrival" class="sr-only" />
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center"
                :class="roomRestrictions[selectedRoomTab].closedToArrival ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-500'"
              >
                <span class="material-icons">no_meeting_room</span>
              </div>
              <div>
                <div class="font-medium" :class="roomRestrictions[selectedRoomTab].closedToArrival ? 'text-orange-600' : 'text-gray-700 dark:text-slate-300'">
                  CTA
                </div>
                <div class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.closedToArrival') }}</div>
              </div>
            </label>

            <!-- CTD -->
            <label
              class="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
              :class="roomRestrictions[selectedRoomTab].closedToDeparture
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
            >
              <input type="checkbox" v-model="roomRestrictions[selectedRoomTab].closedToDeparture" class="sr-only" />
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center"
                :class="roomRestrictions[selectedRoomTab].closedToDeparture ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-500'"
              >
                <span class="material-icons">logout</span>
              </div>
              <div>
                <div class="font-medium" :class="roomRestrictions[selectedRoomTab].closedToDeparture ? 'text-orange-600' : 'text-gray-700 dark:text-slate-300'">
                  CTD
                </div>
                <div class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.closedToDeparture') }}</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Copy restrictions to all rooms -->
        <div class="flex justify-end">
          <button
            type="button"
            @click="copyRestrictionsToAllRooms"
            class="text-sm px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 transition-colors"
          >
            {{ $t('planning.pricing.copyRestrictionsToAll') }}
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
  { key: 'pricing', label: 'Pricing' },
  { key: 'inventory', label: 'Inventory' }
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

// Currency from selected market
const currency = computed(() => props.market?.currency || 'EUR')

// Current room type
const currentRoomType = computed(() => props.roomTypes.find(rt => rt._id === selectedRoomTab.value))

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

// Check if ALL rooms have at least one meal plan price (required)
const allRoomsHavePrices = computed(() => {
  return props.roomTypes.every(rt => hasRoomPrices(rt._id))
})

// Get rooms that are missing prices
const roomsMissingPrices = computed(() => {
  return props.roomTypes.filter(rt => !hasRoomPrices(rt._id))
})

const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return dateRange.value.start && dateRange.value.end
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

// Initialize prices and restrictions for all room types
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
        closedToArrival: false,
        closedToDeparture: false,
        singleSupplement: 0
      }
    }
  })

  // Set first room as selected if not set
  if (!selectedRoomTab.value && props.roomTypes.length > 0) {
    selectedRoomTab.value = props.roomTypes[0]._id
  }
}

// Watch for data changes
watch([() => props.roomTypes, () => props.mealPlans], () => {
  initializeRoomData()
}, { immediate: true, deep: true })

// Computed min/max dates based on selected season
const seasonMinDate = computed(() => {
  if (!form.season) return null
  const season = props.seasons.find(s => s._id === form.season)
  if (season?.dateRanges?.length > 0) {
    return new Date(season.dateRanges[0].startDate)
  }
  return null
})

const seasonMaxDate = computed(() => {
  if (!form.season) return null
  const season = props.seasons.find(s => s._id === form.season)
  if (season?.dateRanges?.length > 0) {
    return new Date(season.dateRanges[0].endDate)
  }
  return null
})

// Reset date range when season changes if dates are outside new season bounds
watch(() => form.season, () => {
  if (form.season && dateRange.value.start && dateRange.value.end) {
    // Clear dates if they're outside season bounds
    const start = new Date(dateRange.value.start)
    const end = new Date(dateRange.value.end)
    if (seasonMinDate.value && start < seasonMinDate.value) {
      dateRange.value = { start: '', end: '' }
    }
    if (seasonMaxDate.value && end > seasonMaxDate.value) {
      dateRange.value = { start: '', end: '' }
    }
  }
})

// Copy first meal plan price to all meal plans (current room)
const copyFirstPriceToAllMealPlans = () => {
  const firstMealPlan = props.mealPlans[0]
  if (!firstMealPlan || !roomPrices[selectedRoomTab.value]?.[firstMealPlan._id]) return

  const source = roomPrices[selectedRoomTab.value][firstMealPlan._id]
  props.mealPlans.forEach(mp => {
    if (mp._id !== firstMealPlan._id) {
      roomPrices[selectedRoomTab.value][mp._id] = { ...source }
    }
  })
  toast.success(t('planning.pricing.copiedToMealPlans'))
}

// Copy current room's prices to all rooms
const copyCurrentRoomToAll = () => {
  const source = roomPrices[selectedRoomTab.value]
  if (!source) return

  props.roomTypes.forEach(rt => {
    if (rt._id !== selectedRoomTab.value) {
      roomPrices[rt._id] = {}
      props.mealPlans.forEach(mp => {
        roomPrices[rt._id][mp._id] = { ...source[mp._id] }
      })
    }
  })
  toast.success(t('planning.pricing.copiedToRooms'))
}

// Copy current room's restrictions to all rooms
const copyRestrictionsToAllRooms = () => {
  const source = roomRestrictions[selectedRoomTab.value]
  if (!source) return

  props.roomTypes.forEach(rt => {
    if (rt._id !== selectedRoomTab.value) {
      roomRestrictions[rt._id] = { ...source }
    }
  })
  toast.success(t('planning.pricing.copiedRestrictionsToRooms'))
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

    // Create rates for each room type that has prices
    props.roomTypes.forEach(rt => {
      const prices = roomPrices[rt._id]
      const restrictions = roomRestrictions[rt._id]

      // For each meal plan that has a price > 0
      props.mealPlans.forEach(mp => {
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

    // Handle both old format (array) and new format ({ rates, overrides })
    let rates = []
    if (response.success) {
      if (Array.isArray(response.data)) {
        rates = response.data
      } else if (response.data?.rates) {
        rates = response.data.rates
      }
    }

    if (rates.length > 0) {
      // Find the rate with the latest end date
      const sortedRates = [...rates].sort((a, b) => {
        const endA = new Date(a.endDate)
        const endB = new Date(b.endDate)
        return endB - endA // Sort descending
      })

      const lastRate = sortedRates[0]
      const lastEndDate = new Date(lastRate.endDate)
      const lastStartDate = new Date(lastRate.startDate)

      // Calculate duration of last rate
      const lastDuration = Math.ceil((lastEndDate - lastStartDate) / (1000 * 60 * 60 * 24)) + 1

      // Set start date to day after last rate ends
      const nextStartDate = new Date(lastEndDate)
      nextStartDate.setDate(nextStartDate.getDate() + 1)

      // Set end date with same duration
      const nextEndDate = new Date(nextStartDate)
      nextEndDate.setDate(nextEndDate.getDate() + lastDuration - 1)

      // Format dates as YYYY-MM-DD
      const formatDate = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      dateRange.value.start = formatDate(nextStartDate)
      dateRange.value.end = formatDate(nextEndDate)

      console.log('Last rate period:', formatDate(lastStartDate), '-', formatDate(lastEndDate), `(${lastDuration} days)`)
      console.log('Suggested next period:', dateRange.value.start, '-', dateRange.value.end)
    }
  } catch (error) {
    console.error('Error fetching last rate:', error)
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
