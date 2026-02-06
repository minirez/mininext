<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 pointer-events-none">
      <!-- Semi-transparent overlay (no blur, no click to close) -->
      <div class="absolute inset-0 bg-black/30 pointer-events-auto"></div>

      <!-- Draggable Modal -->
      <div
        ref="modalRef"
        class="absolute bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-[95vw] max-w-6xl h-[85vh] overflow-hidden flex flex-col pointer-events-auto"
        :style="modalStyle"
      >
        <!-- Header (Drag Handle) -->
        <div
          class="px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 cursor-move select-none"
          @mousedown="startDrag"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <span class="material-icons text-white">travel_explore</span>
              </div>
              <div>
                <h2 class="text-xl font-bold text-white">
                  {{ $t('planning.pricing.priceQuery') }}
                </h2>
                <p class="text-white/70 text-sm">{{ hotelName }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- Drag indicator -->
              <span class="material-icons text-white/50 text-sm">drag_indicator</span>
              <button
                class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                @click="$emit('update:modelValue', false)"
              >
                <span class="material-icons">close</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Search Form -->
        <div
          class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600"
        >
          <div class="flex flex-wrap items-end gap-4">
            <!-- Date Range -->
            <div class="flex-1 min-w-[280px]">
              <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                <span class="material-icons text-xs align-middle">date_range</span>
                {{ $t('planning.pricing.checkIn') }} - {{ $t('planning.pricing.checkOut') }}
              </label>
              <DateRangePicker v-model="dateRange" :allow-past="false" />
            </div>

            <!-- Adults -->
            <div class="w-24">
              <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                <span class="material-icons text-xs align-middle">person</span>
                {{ $t('planning.pricing.adults') }}
              </label>
              <div
                class="flex items-center border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 overflow-hidden"
              >
                <button
                  class="px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700"
                  @click="query.adults = Math.max(1, query.adults - 1)"
                >
                  <span class="material-icons text-sm">remove</span>
                </button>
                <span class="flex-1 text-center font-bold text-gray-900 dark:text-white">{{
                  query.adults
                }}</span>
                <button
                  class="px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700"
                  @click="query.adults = Math.min(10, query.adults + 1)"
                >
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>

            <!-- Children -->
            <div class="w-24">
              <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                <span class="material-icons text-xs align-middle">child_care</span>
                {{ $t('planning.pricing.children') }}
              </label>
              <div
                class="flex items-center border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 overflow-hidden"
              >
                <button
                  class="px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700"
                  @click="updateChildCount(query.childrenCount - 1)"
                >
                  <span class="material-icons text-sm">remove</span>
                </button>
                <span class="flex-1 text-center font-bold text-gray-900 dark:text-white">{{
                  query.childrenCount
                }}</span>
                <button
                  class="px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700"
                  @click="updateChildCount(query.childrenCount + 1)"
                >
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>

            <!-- Child Ages -->
            <div v-if="query.childrenCount > 0" class="flex items-center gap-2">
              <div v-for="i in query.childrenCount" :key="i" class="w-16">
                <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1"
                  >{{ i }}. yaş</label
                >
                <input
                  v-model.number="query.childAges[i - 1]"
                  type="number"
                  min="0"
                  max="17"
                  class="w-full px-2 py-2.5 text-center border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <!-- Search Button -->
            <button
              :disabled="!isQueryValid || loading"
              class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/30"
              @click="searchAvailability"
            >
              <span v-if="loading" class="material-icons animate-spin text-sm">refresh</span>
              <span v-else class="material-icons text-sm">search</span>
              {{ $t('planning.pricing.calculate') }}
            </button>
          </div>

          <!-- Search Summary -->
          <div
            v-if="searched"
            class="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400"
          >
            <span class="flex items-center gap-1">
              <span class="material-icons text-sm">nights_stay</span>
              {{ nights }} {{ $t('planning.pricing.nights') }}
            </span>
            <span class="flex items-center gap-1">
              <span class="material-icons text-sm">group</span>
              {{ query.adults }} {{ $t('planning.pricing.adults') }}
              <span v-if="query.childrenCount > 0"
                >, {{ query.childrenCount }} {{ $t('planning.pricing.children') }}</span
              >
            </span>
            <span class="flex items-center gap-1">
              <span class="material-icons text-sm">payments</span>
              {{ currency }}
            </span>
          </div>
        </div>

        <!-- Results -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Loading State -->
          <div v-if="loading" class="flex flex-col items-center justify-center py-16">
            <div
              class="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"
            ></div>
            <p class="text-gray-500 dark:text-slate-400">{{ $t('common.loading') }}</p>
          </div>

          <!-- No Search Yet -->
          <div
            v-else-if="!searched"
            class="flex flex-col items-center justify-center py-16 text-center"
          >
            <div
              class="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4"
            >
              <span class="material-icons text-5xl text-indigo-500">hotel_class</span>
            </div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2">Fiyat Sorgulama</h3>
            <p class="text-gray-500 dark:text-slate-400 max-w-md">
              Giriş-çıkış tarihi ve misafir sayısını seçerek tüm oda tipleri için fiyat ve müsaitlik
              durumunu görüntüleyin.
            </p>
          </div>

          <!-- Results - Card Based Design -->
          <div v-else class="space-y-3">
            <!-- Room Cards -->
            <div
              v-for="roomResult in results"
              :key="roomResult.roomType._id"
              class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              <!-- Room Header -->
              <div
                class="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-slate-700"
              >
                <div class="flex items-center gap-3">
                  <!-- Room Image -->
                  <div
                    class="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 flex-shrink-0"
                  >
                    <img
                      v-if="getRoomImage(roomResult.roomType)"
                      :src="getRoomImage(roomResult.roomType)"
                      :alt="getRoomTypeName(roomResult.roomType)"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <span class="material-icons text-gray-400 text-xl">hotel</span>
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        class="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-bold whitespace-nowrap"
                      >
                        {{ roomResult.roomType.code }}
                      </span>
                      <span class="font-semibold text-gray-800 dark:text-white">
                        {{ getRoomTypeName(roomResult.roomType) }}
                      </span>
                    </div>
                    <div
                      class="text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1"
                    >
                      <span class="material-icons text-xs">person</span>
                      <span>
                        {{
                          roomResult.roomType.occupancy?.minAdults > 1
                            ? roomResult.roomType.occupancy.minAdults + '-'
                            : ''
                        }}{{ roomResult.roomType.occupancy?.maxAdults || 2 }} yetişkin,
                        {{ roomResult.roomType.occupancy?.totalMaxGuests || 4 }} kişi
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Meal Plan Prices Grid -->
              <div class="flex flex-wrap gap-2 p-3">
                <div
                  v-for="mpResult in roomResult.mealPlans"
                  :key="mpResult.mealPlan._id"
                  class="relative p-3 rounded-xl cursor-pointer transition-all hover:shadow-md min-w-[130px] max-w-[160px] flex-1"
                  :class="[
                    mpResult.capacityExceeded
                      ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'
                      : !mpResult.hasRates
                        ? 'bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600'
                        : mpResult.available
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                  ]"
                  @click="toggleDetails(roomResult.roomType._id, mpResult.mealPlan._id)"
                >
                  <!-- Meal Plan Badge -->
                  <div class="text-center mb-2">
                    <span
                      class="inline-block px-2 py-0.5 rounded-lg text-xs font-bold"
                      :class="getMealPlanBadgeClass(mpResult.mealPlan.code)"
                    >
                      {{ mpResult.mealPlan.code }}
                    </span>
                  </div>

                  <!-- Capacity Exceeded -->
                  <div v-if="mpResult.capacityExceeded" class="text-center py-2">
                    <span class="material-icons text-rose-500 text-2xl">group_off</span>
                    <div class="text-xs text-rose-600 font-medium mt-1">Kapasite Aşımı</div>
                  </div>

                  <!-- No Rates -->
                  <div v-else-if="!mpResult.hasRates" class="text-center py-2">
                    <span class="text-gray-400 dark:text-slate-500 text-lg">—</span>
                    <div class="text-xs text-gray-400 mt-1">Fiyat yok</div>
                  </div>

                  <!-- Has Rates -->
                  <div v-else>
                    <!-- Campaign Discount Badge -->
                    <div v-if="mpResult.campaign" class="absolute -top-2 -right-2 z-10">
                      <span
                        class="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full shadow-lg"
                      >
                        {{ mpResult.discountText }}
                      </span>
                    </div>

                    <!-- 3-Tier Pricing Mini Table -->
                    <table class="w-full text-[11px]">
                      <tbody>
                        <tr class="border-b border-gray-100 dark:border-slate-600">
                          <td class="py-1 text-gray-500 dark:text-slate-400">Maliyet</td>
                          <td class="py-1 text-right font-medium text-gray-700 dark:text-gray-300">
                            {{ formatPrice(getTierPricing(mpResult).hotelCost) }}
                          </td>
                        </tr>
                        <tr
                          class="border-b border-gray-100 dark:border-slate-600 bg-blue-50/50 dark:bg-blue-900/10"
                        >
                          <td class="py-1 text-blue-600 dark:text-blue-400 font-medium">B2B</td>
                          <td class="py-1 text-right font-bold text-blue-700 dark:text-blue-300">
                            {{ formatPrice(getTierPricing(mpResult).b2bPrice) }}
                          </td>
                        </tr>
                        <tr class="bg-green-50/50 dark:bg-green-900/10">
                          <td class="py-1 text-green-600 dark:text-green-400 font-medium">B2C</td>
                          <td class="py-1 text-right font-bold text-green-700 dark:text-green-300">
                            {{ formatPrice(getTierPricing(mpResult).b2cPrice) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Non-Refundable Pricing -->
                    <div
                      v-if="mpResult.nonRefundable?.enabled"
                      class="mt-2 pt-2 border-t border-dashed border-red-200 dark:border-red-800"
                    >
                      <div class="flex items-center gap-1 mb-1">
                        <span class="material-icons text-red-500 text-[10px]">block</span>
                        <span class="text-[9px] font-bold text-red-600 dark:text-red-400"
                          >İADE EDİLMEZ -%{{ mpResult.nonRefundable.discountPercent }}</span
                        >
                      </div>
                      <div class="flex justify-between text-[10px]">
                        <span class="text-blue-600">B2B</span>
                        <span class="font-bold text-blue-700">{{
                          formatPrice(mpResult.nonRefundable.pricing?.b2bPrice || 0)
                        }}</span>
                      </div>
                      <div class="flex justify-between text-[10px]">
                        <span class="text-green-600">B2C</span>
                        <span class="font-bold text-green-700">{{
                          formatPrice(mpResult.nonRefundable.pricing?.b2cPrice || 0)
                        }}</span>
                      </div>
                    </div>

                    <!-- Footer info -->
                    <div class="flex items-center justify-between mt-2 text-[10px]">
                      <span class="text-gray-400"
                        >{{ formatPrice(mpResult.avgPerNight) }}/gece</span
                      >
                      <span
                        class="flex items-center gap-0.5"
                        :class="mpResult.available ? 'text-green-600' : 'text-amber-600'"
                      >
                        <span class="material-icons text-[10px]">{{
                          mpResult.available ? 'check_circle' : 'warning'
                        }}</span>
                        {{ mpResult.available ? 'Müsait' : 'Kısıtlı' }}
                      </span>
                    </div>

                    <!-- OBP Badge -->
                    <div v-if="mpResult.isOBP" class="text-center mt-1">
                      <span
                        class="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[9px] font-bold rounded"
                      >
                        Kişi Bazlı
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Expanded Detail Section -->
              <div
                v-if="getExpandedMealPlan(roomResult.roomType._id)"
                class="border-t border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 p-4"
              >
                <!-- Detail Header -->
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-gray-800 dark:text-white">
                      {{ roomResult.roomType.code }} - {{ getRoomTypeName(roomResult.roomType) }}
                    </span>
                    <span
                      class="px-2 py-0.5 rounded text-xs font-bold"
                      :class="
                        getMealPlanBadgeClass(getExpandedMealPlanData(roomResult)?.mealPlan?.code)
                      "
                    >
                      {{ getExpandedMealPlanData(roomResult)?.mealPlan?.code }}
                    </span>
                  </div>
                  <button
                    class="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    @click="expandedRow = null"
                  >
                    <span class="material-icons text-gray-500">close</span>
                  </button>
                </div>

                <!-- Summary Pricing Table -->
                <div
                  class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 mb-4"
                >
                  <table class="w-full text-sm">
                    <thead>
                      <tr
                        class="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600"
                      >
                        <th
                          class="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300"
                        >
                          {{ nights }} Gece Toplam
                        </th>
                        <th
                          class="px-3 py-2 text-right font-medium text-gray-500 dark:text-slate-400"
                        >
                          Maliyet
                        </th>
                        <th
                          class="px-3 py-2 text-right font-medium text-blue-600 dark:text-blue-400"
                        >
                          B2B
                        </th>
                        <th
                          class="px-3 py-2 text-right font-medium text-green-600 dark:text-green-400"
                        >
                          B2C
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                          <div class="flex items-center gap-2">
                            <span
                              class="material-icons text-sm"
                              :class="
                                getExpandedMealPlanData(roomResult)?.available
                                  ? 'text-green-500'
                                  : 'text-red-500'
                              "
                              >{{
                                getExpandedMealPlanData(roomResult)?.available
                                  ? 'check_circle'
                                  : 'cancel'
                              }}</span
                            >
                            <span>{{
                              getExpandedMealPlanData(roomResult)?.salesSettings?.workingMode ===
                              'commission'
                                ? 'Komisyonlu'
                                : 'Net'
                            }}</span>
                            <span
                              v-if="getExpandedMealPlanData(roomResult)?.campaign"
                              class="px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded"
                            >
                              {{ getExpandedMealPlanData(roomResult).discountText }}
                            </span>
                          </div>
                        </td>
                        <td
                          class="px-3 py-2.5 text-right font-semibold text-gray-700 dark:text-gray-200"
                        >
                          {{
                            formatPrice(
                              getTierPricing(getExpandedMealPlanData(roomResult)).hotelCost
                            )
                          }}
                        </td>
                        <td
                          class="px-3 py-2.5 text-right font-bold text-blue-700 dark:text-blue-300 text-base"
                        >
                          {{
                            formatPrice(
                              getTierPricing(getExpandedMealPlanData(roomResult)).b2bPrice
                            )
                          }}
                        </td>
                        <td
                          class="px-3 py-2.5 text-right font-bold text-green-700 dark:text-green-300 text-base"
                        >
                          {{
                            formatPrice(
                              getTierPricing(getExpandedMealPlanData(roomResult)).b2cPrice
                            )
                          }}
                        </td>
                      </tr>
                      <tr
                        class="bg-gray-50/50 dark:bg-slate-700/50 text-xs text-gray-500 dark:text-slate-400"
                      >
                        <td class="px-3 py-1.5">Gecelik ortalama</td>
                        <td class="px-3 py-1.5 text-right">
                          {{
                            formatPrice(
                              (getTierPricing(getExpandedMealPlanData(roomResult)).hotelCost || 0) /
                                nights
                            )
                          }}
                        </td>
                        <td class="px-3 py-1.5 text-right text-blue-600">
                          {{
                            formatPrice(
                              (getTierPricing(getExpandedMealPlanData(roomResult)).b2bPrice || 0) /
                                nights
                            )
                          }}
                        </td>
                        <td class="px-3 py-1.5 text-right text-green-600">
                          {{
                            formatPrice(
                              (getTierPricing(getExpandedMealPlanData(roomResult)).b2cPrice || 0) /
                                nights
                            )
                          }}
                        </td>
                      </tr>
                      <!-- Non-Refundable Row -->
                      <tr
                        v-if="getExpandedMealPlanData(roomResult)?.nonRefundable?.enabled"
                        class="bg-red-50 dark:bg-red-900/20 text-xs border-t-2 border-red-200 dark:border-red-800"
                      >
                        <td class="px-3 py-2">
                          <div class="flex items-center gap-1">
                            <span class="material-icons text-red-500 text-sm">block</span>
                            <span class="font-bold text-red-600 dark:text-red-400"
                              >İade Edilmez</span
                            >
                            <span class="text-red-500 text-[10px]"
                              >(-{{
                                getExpandedMealPlanData(roomResult).nonRefundable.discountPercent
                              }}%)</span
                            >
                          </div>
                        </td>
                        <td
                          class="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-300"
                        >
                          {{
                            formatPrice(
                              getExpandedMealPlanData(roomResult).nonRefundable.pricing
                                ?.hotelCost || 0
                            )
                          }}
                        </td>
                        <td class="px-3 py-2 text-right font-bold text-blue-700 dark:text-blue-300">
                          {{
                            formatPrice(
                              getExpandedMealPlanData(roomResult).nonRefundable.pricing?.b2bPrice ||
                                0
                            )
                          }}
                        </td>
                        <td
                          class="px-3 py-2 text-right font-bold text-green-700 dark:text-green-300"
                        >
                          {{
                            formatPrice(
                              getExpandedMealPlanData(roomResult).nonRefundable.pricing?.b2cPrice ||
                                0
                            )
                          }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Issues -->
                <div
                  v-if="getExpandedMealPlanData(roomResult)?.issues?.length > 0"
                  class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl"
                >
                  <div class="flex items-center gap-2 text-red-600 font-medium text-sm mb-2">
                    <span class="material-icons text-sm">warning</span>
                    Müsaitlik Sorunları
                  </div>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="(issue, idx) in getExpandedMealPlanData(roomResult).issues"
                      :key="idx"
                      class="px-2 py-0.5 rounded-lg text-xs font-medium"
                      :class="getIssueBadgeClass(issue.type)"
                    >
                      {{ issue.date ? formatDate(issue.date) : '' }}
                      {{ getIssueShortLabel(issue.type) }}
                    </span>
                  </div>
                </div>

                <!-- Daily Breakdown Table with Cost/B2B/B2C -->
                <div
                  class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600"
                >
                  <div class="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table class="w-full text-xs">
                      <thead class="sticky top-0 z-10">
                        <tr
                          class="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-400 border-b border-gray-200 dark:border-slate-600"
                        >
                          <th class="px-3 py-2 text-left font-medium">Tarih</th>
                          <th class="px-3 py-2 text-right font-medium text-gray-500">Maliyet</th>
                          <th class="px-3 py-2 text-right font-medium text-blue-600">B2B</th>
                          <th class="px-3 py-2 text-right font-medium text-green-600">B2C</th>
                          <th class="px-3 py-2 text-center font-medium w-14">Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(day, idx) in getExpandedMealPlanData(roomResult)
                            ?.dailyBreakdown || []"
                          :key="idx"
                          class="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                          :class="day.hasIssue ? 'bg-red-50/50 dark:bg-red-900/10' : ''"
                        >
                          <td class="px-3 py-2">
                            <div class="flex items-center gap-1.5">
                              <span class="font-medium text-gray-800 dark:text-white">{{
                                formatDate(day.date)
                              }}</span>
                              <span
                                v-if="day.isFreeNight"
                                class="px-1 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-[9px] font-bold rounded"
                                >FREE</span
                              >
                              <span
                                v-else-if="day.campaignApplied"
                                class="px-1 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 text-[9px] font-bold rounded"
                                >-%</span
                              >
                            </div>
                          </td>
                          <td class="px-3 py-2 text-right">
                            <span
                              v-if="day.rate"
                              class="font-medium text-gray-600 dark:text-gray-300"
                              >{{ formatPrice(day.hotelCost || 0) }}</span
                            >
                            <span v-else class="text-red-400">-</span>
                          </td>
                          <td class="px-3 py-2 text-right">
                            <span
                              v-if="day.rate"
                              class="font-semibold text-blue-700 dark:text-blue-300"
                              >{{ formatPrice(day.b2bPrice || 0) }}</span
                            >
                            <span v-else class="text-red-400">-</span>
                          </td>
                          <td class="px-3 py-2 text-right">
                            <span
                              v-if="day.rate"
                              class="font-semibold text-green-700 dark:text-green-300"
                              >{{ formatPrice(day.b2cPrice || 0) }}</span
                            >
                            <span v-else class="text-red-400">-</span>
                          </td>
                          <td class="px-3 py-2 text-center">
                            <span
                              v-if="!day.rate"
                              class="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-slate-600 text-gray-500 rounded"
                              >YOK</span
                            >
                            <span
                              v-else-if="day.hasIssue"
                              class="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 font-medium rounded"
                            >
                              {{
                                day.rate?.stopSale
                                  ? 'STOP'
                                  : day.rate?.closedToArrival && day.isCheckIn
                                    ? 'CTA'
                                    : day.minStayIssue
                                      ? 'MIN'
                                      : '!'
                              }}
                            </span>
                            <span v-else class="material-icons text-green-500 text-sm"
                              >check_circle</span
                            >
                          </td>
                        </tr>
                      </tbody>
                      <tfoot class="sticky bottom-0">
                        <tr
                          class="bg-gray-100 dark:bg-slate-700 font-bold border-t-2 border-gray-300 dark:border-slate-500"
                        >
                          <td class="px-3 py-2 text-gray-800 dark:text-white">TOPLAM</td>
                          <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-200">
                            {{
                              formatPrice(
                                getTierPricing(getExpandedMealPlanData(roomResult)).hotelCost
                              )
                            }}
                          </td>
                          <td class="px-3 py-2 text-right text-blue-700 dark:text-blue-300">
                            {{
                              formatPrice(
                                getTierPricing(getExpandedMealPlanData(roomResult)).b2bPrice
                              )
                            }}
                          </td>
                          <td class="px-3 py-2 text-right text-green-700 dark:text-green-300">
                            {{
                              formatPrice(
                                getTierPricing(getExpandedMealPlanData(roomResult)).b2cPrice
                              )
                            }}
                          </td>
                          <td class="px-3 py-2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Legend - only show when there are results -->
            <div
              v-if="results.length > 0"
              class="mt-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl"
            >
              <div
                class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 dark:text-slate-400"
              >
                <span class="flex items-center gap-1">
                  <span class="material-icons text-green-500 text-sm">check_circle</span>
                  Müsait
                </span>
                <span class="flex items-center gap-1">
                  <span class="material-icons text-amber-500 text-sm">warning</span>
                  Kısıtlı
                </span>
                <span class="flex items-center gap-1">
                  <span
                    class="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-bold"
                    >OBP</span
                  >
                  Kişi Bazlı
                </span>
                <span class="flex items-center gap-1">
                  <span
                    class="px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded text-[10px] font-bold"
                    >-%</span
                  >
                  Kampanya
                </span>
              </div>
            </div>

            <!-- No Results -->
            <div
              v-if="results.length === 0"
              class="flex flex-col items-center justify-center py-16"
            >
              <div
                class="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-4"
              >
                <span class="material-icons text-4xl text-gray-400 dark:text-slate-500"
                  >search_off</span
                >
              </div>
              <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Sonuç Bulunamadı
              </h3>
              <p class="text-gray-500 dark:text-slate-400 text-center max-w-sm">
                Seçilen tarih aralığında uygun oda veya fiyat bulunamadı. Farklı tarihler deneyin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import planningService from '@/services/planningService'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import { useDraggableModal } from '@/composables/useDraggableModal'
import {
  formatPrice,
  formatDate,
  getRoomTypeName as getRoomTypeNameUtil,
  getRoomImage as getRoomImageUtil,
  getMealPlanBadgeClass,
  getIssueBadgeClass,
  getIssueShortLabel,
  getTierPricing,
  calculateDefaultDates,
  calculateNights
} from '@/utils/priceQueryHelpers'
import { transformApiResultToMpResult, groupResultsByRoomType } from '@/utils/priceResultTransformer'

const { locale } = useI18n()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  hotelId: { type: String, required: true },
  hotelName: { type: String, default: '' },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  markets: { type: Array, default: () => [] },
  initialMonth: { type: Object, default: null } // { year: 2025, month: 6 }
})

defineEmits(['update:modelValue'])

const loading = ref(false)
const searched = ref(false)
const results = ref([])

// Draggable modal composable
const { modalRef, modalStyle, startDrag, resetPosition } = useDraggableModal()

// Expanded row tracking (roomTypeId + mealPlanId)
const expandedRow = ref(null)

const toggleDetails = (roomTypeId, mealPlanId) => {
  const key = `${roomTypeId}-${mealPlanId}`
  if (expandedRow.value === key) {
    expandedRow.value = null
  } else {
    expandedRow.value = key
  }
}

const getExpandedMealPlan = roomTypeId => {
  if (!expandedRow.value) return null
  const [rtId] = expandedRow.value.split('-')
  if (rtId !== roomTypeId) return null
  return expandedRow.value
}

const getExpandedMealPlanData = roomResult => {
  if (!expandedRow.value) return null
  const [rtId, mpId] = expandedRow.value.split('-')
  if (rtId !== roomResult.roomType._id) return null
  return roomResult.mealPlans.find(mp => mp.mealPlan._id === mpId)
}

// Default market (first one or with isDefault)
const defaultMarket = computed(() => {
  return props.markets.find(m => m.isDefault) || props.markets[0]
})

const currency = computed(() => defaultMarket.value?.currency || 'EUR')

// Date range for DateRangePicker
const dateRange = ref({ start: '', end: '' })

// Query state
const query = ref({
  adults: 2,
  childrenCount: 0,
  childAges: []
})

// Set default dates based on initialMonth or current date
const setDefaultDates = () => {
  dateRange.value = calculateDefaultDates(props.initialMonth)
}

// Computed
const isQueryValid = computed(() => {
  return (
    dateRange.value.start &&
    dateRange.value.end &&
    dateRange.value.start < dateRange.value.end &&
    query.value.adults > 0
  )
})

const nights = computed(() => calculateNights(dateRange.value.start, dateRange.value.end))

// Methods
const updateChildCount = count => {
  const newCount = Math.max(0, Math.min(6, count))
  query.value.childrenCount = newCount

  while (query.value.childAges.length < newCount) {
    query.value.childAges.push(5)
  }
  query.value.childAges = query.value.childAges.slice(0, newCount)
}

// Wrapper for getRoomTypeName to use locale
const getRoomTypeName = roomType => getRoomTypeNameUtil(roomType, locale.value)

// API base URL for images
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.maxirez.com/api'
const imageBaseUrl = apiBaseUrl.replace('/api', '')

// Wrapper for getRoomImage to include base URL
const getRoomImage = roomType => getRoomImageUtil(roomType, imageBaseUrl)

const searchAvailability = async () => {
  if (!isQueryValid.value) return

  loading.value = true
  searched.value = true
  results.value = []
  expandedRow.value = null

  try {
    // Build list of all room type + meal plan combinations to query
    const queries = []
    for (const roomType of props.roomTypes) {
      for (const mealPlan of props.mealPlans) {
        queries.push({
          roomTypeId: roomType._id,
          mealPlanId: mealPlan._id,
          roomType,
          mealPlan
        })
      }
    }

    // Prepare children data for API
    const childrenData = query.value.childAges
      .slice(0, query.value.childrenCount)
      .map((age, index) => ({
        age,
        order: index + 1
      }))

    // Call API for each combination in parallel
    const apiPromises = queries.map(q =>
      planningService
        .calculatePriceWithCampaigns(props.hotelId, {
          roomTypeId: q.roomTypeId,
          mealPlanId: q.mealPlanId,
          marketId: defaultMarket.value?._id,
          checkInDate: dateRange.value.start,
          checkOutDate: dateRange.value.end,
          adults: query.value.adults,
          children: childrenData,
          includeCampaigns: true
        })
        .then(response => {
          const result = response.data?.data || response.data || response
          return { ...q, result }
        })
        .catch(error => ({
          ...q,
          error: error.response?.data?.message || error.message
        }))
    )

    const apiResults = await Promise.all(apiPromises)

    // Use utility to group results by room type
    results.value = groupResultsByRoomType(apiResults, props.roomTypes)
  } catch (error) {
    console.error('Search error:', error)
  } finally {
    loading.value = false
  }
}

// Reset on modal open
watch(
  () => props.modelValue,
  newVal => {
    if (newVal) {
      setDefaultDates()
      searched.value = false
      results.value = []
      expandedRow.value = null
      // Reset position
      resetPosition()
    }
  }
)

// Initial setup
setDefaultDates()
</script>
