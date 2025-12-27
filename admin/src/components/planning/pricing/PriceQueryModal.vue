<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="$emit('update:modelValue', false)"
    >
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <span class="material-icons text-white">travel_explore</span>
              </div>
              <div>
                <h2 class="text-xl font-bold text-white">{{ $t('planning.pricing.priceQuery') }}</h2>
                <p class="text-white/70 text-sm">{{ hotelName }}</p>
              </div>
            </div>
            <button
              @click="$emit('update:modelValue', false)"
              class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <span class="material-icons">close</span>
            </button>
          </div>
        </div>

        <!-- Search Form -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600">
          <div class="flex flex-wrap items-end gap-4">
            <!-- Date Range -->
            <div class="flex-1 min-w-[280px]">
              <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                <span class="material-icons text-xs align-middle">date_range</span>
                {{ $t('planning.pricing.checkIn') }} - {{ $t('planning.pricing.checkOut') }}
              </label>
              <DateRangePicker
                v-model="dateRange"
                :allow-past="false"
              />
            </div>

            <!-- Adults -->
            <div class="w-24">
              <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                <span class="material-icons text-xs align-middle">person</span>
                {{ $t('planning.pricing.adults') }}
              </label>
              <div class="flex items-center border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 overflow-hidden">
                <button @click="query.adults = Math.max(1, query.adults - 1)" class="px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700">
                  <span class="material-icons text-sm">remove</span>
                </button>
                <span class="flex-1 text-center font-bold text-gray-900 dark:text-white">{{ query.adults }}</span>
                <button @click="query.adults = Math.min(10, query.adults + 1)" class="px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700">
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
              <div class="flex items-center border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 overflow-hidden">
                <button @click="updateChildCount(query.childrenCount - 1)" class="px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700">
                  <span class="material-icons text-sm">remove</span>
                </button>
                <span class="flex-1 text-center font-bold text-gray-900 dark:text-white">{{ query.childrenCount }}</span>
                <button @click="updateChildCount(query.childrenCount + 1)" class="px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700">
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>

            <!-- Child Ages -->
            <div v-if="query.childrenCount > 0" class="flex items-center gap-2">
              <div
                v-for="i in query.childrenCount"
                :key="i"
                class="w-16"
              >
                <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">{{ i }}. yaş</label>
                <input
                  type="number"
                  v-model.number="query.childAges[i - 1]"
                  min="0"
                  max="17"
                  class="w-full px-2 py-2.5 text-center border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <!-- Search Button -->
            <button
              @click="searchAvailability"
              :disabled="!isQueryValid || loading"
              class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/30"
            >
              <span v-if="loading" class="material-icons animate-spin text-sm">refresh</span>
              <span v-else class="material-icons text-sm">search</span>
              {{ $t('planning.pricing.calculate') }}
            </button>
          </div>

          <!-- Search Summary -->
          <div v-if="searched" class="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
            <span class="flex items-center gap-1">
              <span class="material-icons text-sm">nights_stay</span>
              {{ nights }} {{ $t('planning.pricing.nights') }}
            </span>
            <span class="flex items-center gap-1">
              <span class="material-icons text-sm">group</span>
              {{ query.adults }} {{ $t('planning.pricing.adults') }}
              <span v-if="query.childrenCount > 0">, {{ query.childrenCount }} {{ $t('planning.pricing.children') }}</span>
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
            <div class="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p class="text-gray-500 dark:text-slate-400">{{ $t('common.loading') }}</p>
          </div>

          <!-- No Search Yet -->
          <div v-else-if="!searched" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
              <span class="material-icons text-5xl text-indigo-500">hotel_class</span>
            </div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2">Fiyat Sorgulama</h3>
            <p class="text-gray-500 dark:text-slate-400 max-w-md">
              Giriş-çıkış tarihi ve misafir sayısını seçerek tüm oda tipleri için fiyat ve müsaitlik durumunu görüntüleyin.
            </p>
          </div>

          <!-- Results Table -->
          <div v-else>
            <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <!-- Header: Meal Plans -->
                  <thead>
                    <tr class="bg-gray-50 dark:bg-slate-700/50">
                      <th class="px-4 py-3 text-left font-medium text-gray-600 dark:text-slate-400 sticky left-0 bg-gray-50 dark:bg-slate-700/50 min-w-[180px]">
                        {{ $t('planning.pricing.roomType') }}
                      </th>
                      <th
                        v-for="mp in mealPlans"
                        :key="mp._id"
                        class="px-3 py-3 text-center min-w-[120px]"
                      >
                        <span
                          class="inline-block px-2 py-1 rounded text-xs font-bold"
                          :class="getMealPlanBadgeClass(mp.code)"
                        >
                          {{ mp.code }}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="roomResult in results"
                      :key="roomResult.roomType._id"
                      class="border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30"
                    >
                      <!-- Room Type -->
                      <td class="px-4 py-3 sticky left-0 bg-white dark:bg-slate-800">
                        <div class="flex items-center gap-2">
                          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span class="text-xs font-bold text-white">{{ roomResult.roomType.code }}</span>
                          </div>
                          <div>
                            <div class="font-medium text-gray-800 dark:text-white text-sm">
                              {{ getRoomTypeName(roomResult.roomType) }}
                            </div>
                            <div class="text-xs text-gray-400 dark:text-slate-500">
                              {{ roomResult.roomType.occupancy?.maxAdults || 2 }}A + {{ roomResult.roomType.occupancy?.maxChildren || 2 }}C
                            </div>
                          </div>
                        </div>
                      </td>

                      <!-- Meal Plan Prices -->
                      <td
                        v-for="mpResult in roomResult.mealPlans"
                        :key="mpResult.mealPlan._id"
                        class="px-3 py-2 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600/30 transition-colors"
                        @click="showDetails(roomResult, mpResult)"
                      >
                        <div v-if="mpResult.hasRates">
                          <!-- Campaign Applied -->
                          <template v-if="mpResult.campaign">
                            <!-- Original Price (strikethrough) -->
                            <div class="text-xs text-gray-400 dark:text-slate-500 line-through">
                              {{ formatPrice(mpResult.originalPrice) }}
                            </div>
                            <!-- Discounted Price -->
                            <div
                              class="font-bold text-base"
                              :class="mpResult.available ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500 line-through'"
                            >
                              {{ formatPrice(mpResult.totalPrice) }}
                            </div>
                            <!-- Campaign Badge -->
                            <div class="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1 py-0.5 rounded mt-0.5 inline-block">
                              {{ mpResult.discountText }}
                            </div>
                          </template>
                          <!-- No Campaign -->
                          <template v-else>
                            <!-- Price -->
                            <div
                              class="font-bold text-base"
                              :class="mpResult.available ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500 line-through'"
                            >
                              {{ formatPrice(mpResult.totalPrice) }}
                            </div>
                          </template>
                          <!-- Per Night -->
                          <div class="text-xs text-gray-400 dark:text-slate-500">
                            {{ formatPrice(mpResult.avgPerNight) }}/g
                          </div>
                          <!-- Status Badges -->
                          <div v-if="!mpResult.available" class="flex flex-wrap justify-center gap-0.5 mt-1">
                            <span
                              v-for="(issue, idx) in getUniqueIssueTypes(mpResult.issues).slice(0, 3)"
                              :key="idx"
                              class="px-1 py-0.5 rounded text-[10px] font-medium"
                              :class="getIssueBadgeClass(issue)"
                            >
                              {{ getIssueShortLabel(issue) }}
                            </span>
                          </div>
                          <!-- Available Badge -->
                          <div v-else class="mt-1">
                            <span class="material-icons text-green-500 text-sm">check_circle</span>
                          </div>
                        </div>
                        <div v-else class="text-gray-300 dark:text-slate-600">
                          <span class="material-icons text-lg">remove</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Legend -->
            <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
              <span class="flex items-center gap-1">
                <span class="material-icons text-green-500 text-sm">check_circle</span>
                Müsait
              </span>
              <span class="flex items-center gap-1">
                <span class="px-1 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-[10px]">STOP</span>
                Satış Kapalı
              </span>
              <span class="flex items-center gap-1">
                <span class="px-1 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded text-[10px]">CTA</span>
                Girişe Kapalı
              </span>
              <span class="flex items-center gap-1">
                <span class="px-1 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded text-[10px]">CTD</span>
                Çıkışa Kapalı
              </span>
              <span class="flex items-center gap-1">
                <span class="px-1 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-[10px]">MIN</span>
                Min. Konaklama
              </span>
              <span class="flex items-center gap-1">
                <span class="px-1 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded text-[10px]">1P</span>
                Tek Kişi Kapalı
              </span>
            </div>

            <!-- No Results -->
            <div v-if="results.length === 0" class="text-center py-16">
              <span class="material-icons text-6xl text-gray-300 dark:text-slate-600">search_off</span>
              <p class="mt-4 text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.noRatesFound') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div
      v-if="detailModal.show"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="detailModal.show = false"
    >
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Detail Header -->
        <div class="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold">
                {{ detailModal.roomType?.code }}
              </div>
              <div>
                <h3 class="text-lg font-bold text-white">{{ getRoomTypeName(detailModal.roomType) }}</h3>
                <div class="flex items-center gap-2">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-bold"
                    :class="getMealPlanBadgeClass(detailModal.mealPlan?.code)"
                  >
                    {{ detailModal.mealPlan?.code }}
                  </span>
                  <span class="text-white/70 text-sm">{{ getMealPlanName(detailModal.mealPlan) }}</span>
                </div>
              </div>
            </div>
            <button
              @click="detailModal.show = false"
              class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            >
              <span class="material-icons">close</span>
            </button>
          </div>
        </div>

        <!-- Detail Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Summary Cards -->
          <div class="grid grid-cols-3 gap-4 mb-6">
            <!-- Total Price -->
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 text-center">
              <div class="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Toplam Fiyat</div>
              <!-- Show original price if campaign applied -->
              <div v-if="detailModal.data?.campaign" class="text-sm text-gray-400 line-through mb-0.5">
                {{ formatPrice(detailModal.data?.originalPrice || 0) }} {{ currency }}
              </div>
              <div class="text-2xl font-bold text-green-700 dark:text-green-300">
                {{ formatPrice(detailModal.data?.totalPrice || 0) }}
                <span class="text-sm font-normal">{{ currency }}</span>
              </div>
            </div>

            <!-- Per Night -->
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 text-center">
              <div class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Gecelik Ortalama</div>
              <div class="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {{ formatPrice(detailModal.data?.avgPerNight || 0) }}
                <span class="text-sm font-normal">{{ currency }}</span>
              </div>
            </div>

            <!-- Availability -->
            <div
              class="rounded-xl p-4 text-center"
              :class="detailModal.data?.available
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20'
                : 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20'"
            >
              <div class="text-xs font-medium mb-1" :class="detailModal.data?.available ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                Durum
              </div>
              <div class="flex items-center justify-center gap-2">
                <span
                  class="material-icons text-2xl"
                  :class="detailModal.data?.available ? 'text-emerald-600' : 'text-red-600'"
                >
                  {{ detailModal.data?.available ? 'check_circle' : 'cancel' }}
                </span>
                <span class="font-bold" :class="detailModal.data?.available ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'">
                  {{ detailModal.data?.available ? 'Müsait' : 'Müsait Değil' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Campaign Info -->
          <div v-if="detailModal.data?.campaign" class="mb-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <span class="material-icons text-white">campaign</span>
                </div>
                <div>
                  <div class="font-medium text-purple-800 dark:text-purple-200">
                    {{ getCampaignName(detailModal.data.campaign) }}
                  </div>
                  <div class="text-sm text-purple-600 dark:text-purple-400">
                    {{ $t(`planning.campaigns.types.${detailModal.data.campaign.type}`) }}
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {{ detailModal.data.discountText }}
                </div>
                <div class="text-sm text-purple-500 dark:text-purple-400">
                  -{{ formatPrice(detailModal.data.discountAmount || 0) }} {{ currency }}
                </div>
              </div>
            </div>
          </div>

          <!-- Issues Alert -->
          <div v-if="detailModal.data?.issues?.length > 0" class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div class="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium mb-2">
              <span class="material-icons">warning</span>
              Müsaitlik Sorunları
            </div>
            <div class="space-y-2">
              <div
                v-for="(issue, idx) in detailModal.data.issues"
                :key="idx"
                class="flex items-center gap-2 text-sm"
                :class="getIssueClass(issue.type)"
              >
                <span class="material-icons text-sm">{{ getIssueIcon(issue.type) }}</span>
                <span class="font-medium">{{ formatDate(issue.date) }}:</span>
                {{ issue.message }}
              </div>
            </div>
          </div>

          <!-- Daily Breakdown Table -->
          <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl overflow-hidden">
            <div class="px-4 py-3 bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              <h4 class="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <span class="material-icons text-sm">calendar_month</span>
                Günlük Fiyat Detayı
              </h4>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400">
                    <th class="px-4 py-2 text-left font-medium">Tarih</th>
                    <th class="px-3 py-2 text-center font-medium">Baz Fiyat</th>
                    <th v-if="hasExtraAdults" class="px-3 py-2 text-center font-medium">Ek Yetişkin</th>
                    <th v-if="query.childrenCount > 0" class="px-3 py-2 text-center font-medium">Çocuklar</th>
                    <th v-if="hasSingleSupplement" class="px-3 py-2 text-center font-medium">Tek Kişi</th>
                    <th class="px-3 py-2 text-center font-medium">Toplam</th>
                    <th class="px-3 py-2 text-center font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(day, idx) in detailModal.data?.dailyBreakdown || []"
                    :key="idx"
                    class="border-b border-gray-200 dark:border-slate-600"
                    :class="day.hasIssue ? 'bg-red-50 dark:bg-red-900/10' : ''"
                  >
                    <td class="px-4 py-3">
                      <div class="font-medium text-gray-900 dark:text-white">{{ formatDate(day.date) }}</div>
                      <div class="text-xs text-gray-500 dark:text-slate-400">{{ getDayName(day.date) }}</div>
                    </td>
                    <td class="px-3 py-3 text-center">
                      <span v-if="day.rate" class="font-semibold text-gray-900 dark:text-white">{{ day.basePrice }}</span>
                      <span v-else class="text-red-500">-</span>
                    </td>
                    <td v-if="hasExtraAdults" class="px-3 py-3 text-center">
                      <span v-if="day.extraAdultPrice > 0" class="text-amber-600 dark:text-amber-400">+{{ day.extraAdultPrice }}</span>
                      <span v-else class="text-gray-400">-</span>
                    </td>
                    <td v-if="query.childrenCount > 0" class="px-3 py-3 text-center">
                      <span v-if="day.childrenPrice > 0" class="text-pink-600 dark:text-pink-400">+{{ day.childrenPrice }}</span>
                      <span v-else-if="day.childrenPrice === 0 && day.rate" class="text-green-600 dark:text-green-400">Ücretsiz</span>
                      <span v-else class="text-gray-400">-</span>
                    </td>
                    <td v-if="hasSingleSupplement" class="px-3 py-3 text-center">
                      <span v-if="day.singleSupplementPrice" class="text-blue-600 dark:text-blue-400">{{ day.singleSupplementPrice }}</span>
                      <span v-else class="text-gray-400">-</span>
                    </td>
                    <td class="px-3 py-3 text-center">
                      <template v-if="day.rate">
                        <!-- Campaign applied - show original strikethrough -->
                        <template v-if="day.campaignApplied && day.originalDailyTotal">
                          <div class="text-xs text-gray-400 line-through">{{ Math.round(day.originalDailyTotal) }}</div>
                          <div class="font-bold" :class="day.isFreeNight ? 'text-purple-600 dark:text-purple-400' : 'text-green-600 dark:text-green-400'">
                            {{ day.isFreeNight ? 'ÜCRETSİZ' : Math.round(day.dailyTotal) }}
                          </div>
                        </template>
                        <!-- No campaign -->
                        <span v-else class="font-bold text-green-600 dark:text-green-400">{{ Math.round(day.dailyTotal) }}</span>
                      </template>
                      <span v-else class="text-red-500 font-bold">-</span>
                    </td>
                    <td class="px-3 py-3 text-center">
                      <div v-if="!day.rate" class="flex items-center justify-center">
                        <span class="px-2 py-0.5 bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-400 rounded text-xs">Fiyat yok</span>
                      </div>
                      <div v-else-if="day.hasIssue" class="flex flex-wrap justify-center gap-1">
                        <span v-if="day.rate?.stopSale" class="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-medium">STOP</span>
                        <span v-if="day.rate?.singleStop && query.adults === 1" class="px-1.5 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded text-xs font-medium">1P</span>
                        <span v-if="day.rate?.closedToArrival && day.isCheckIn" class="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs font-medium">CTA</span>
                        <span v-if="day.rate?.closedToDeparture && day.isCheckOut" class="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs font-medium">CTD</span>
                        <span v-if="day.minStayIssue" class="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs font-medium">Min {{ day.rate?.minStay }}</span>
                      </div>
                      <div v-else class="flex items-center justify-center">
                        <span class="material-icons text-green-500 text-lg">check_circle</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 font-bold">
                    <td class="px-4 py-3 text-gray-900 dark:text-white">
                      TOPLAM ({{ nights }} gece)
                    </td>
                    <td class="px-3 py-3 text-center text-gray-900 dark:text-white">{{ detailModal.data?.totals?.basePrice || 0 }}</td>
                    <td v-if="hasExtraAdults" class="px-3 py-3 text-center text-amber-600 dark:text-amber-400">+{{ detailModal.data?.totals?.extraAdult || 0 }}</td>
                    <td v-if="query.childrenCount > 0" class="px-3 py-3 text-center text-pink-600 dark:text-pink-400">+{{ detailModal.data?.totals?.children || 0 }}</td>
                    <td v-if="hasSingleSupplement" class="px-3 py-3 text-center text-blue-600 dark:text-blue-400">{{ detailModal.data?.totals?.singleSupplement || 0 }}</td>
                    <td class="px-3 py-3 text-center text-xl text-green-700 dark:text-green-300">{{ detailModal.data?.totalPrice || 0 }} {{ currency }}</td>
                    <td class="px-3 py-3"></td>
                  </tr>
                </tfoot>
              </table>
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

const { t, locale } = useI18n()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  hotelId: { type: String, required: true },
  hotelName: { type: String, default: '' },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  markets: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue'])

const loading = ref(false)
const searched = ref(false)
const results = ref([])

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

// Set default dates
const setDefaultDates = () => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfter = new Date(today)
  dayAfter.setDate(dayAfter.getDate() + 3)

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  dateRange.value = {
    start: formatDate(tomorrow),
    end: formatDate(dayAfter)
  }
}

// Detail modal
const detailModal = ref({
  show: false,
  roomType: null,
  mealPlan: null,
  data: null
})

// Computed
const isQueryValid = computed(() => {
  return dateRange.value.start &&
    dateRange.value.end &&
    dateRange.value.start < dateRange.value.end &&
    query.value.adults > 0
})

const nights = computed(() => {
  if (!dateRange.value.start || !dateRange.value.end) return 0
  const start = new Date(dateRange.value.start)
  const end = new Date(dateRange.value.end)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
})

const hasExtraAdults = computed(() => {
  // Check if any room has extra adults
  return query.value.adults > 2
})

const hasSingleSupplement = computed(() => {
  return query.value.adults === 1
})

// Methods
const updateChildCount = (count) => {
  const newCount = Math.max(0, Math.min(6, count))
  query.value.childrenCount = newCount

  // Adjust ages array
  while (query.value.childAges.length < newCount) {
    query.value.childAges.push(5)
  }
  query.value.childAges = query.value.childAges.slice(0, newCount)
}

const getRoomTypeName = (roomType) => {
  if (!roomType) return ''
  return roomType.name?.[locale.value] || roomType.name?.tr || roomType.name?.en || roomType.code
}

const getMealPlanName = (mealPlan) => {
  if (!mealPlan) return ''
  return mealPlan.name?.[locale.value] || mealPlan.name?.tr || mealPlan.name?.en || mealPlan.code
}

const getCampaignName = (campaign) => {
  if (!campaign) return ''
  return campaign.name?.[locale.value] || campaign.name?.tr || campaign.name?.en || campaign.code
}

const formatPrice = (price) => {
  return Math.round(price).toLocaleString('tr-TR')
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}

const getDayName = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('tr-TR', { weekday: 'short' })
}

const getMealPlanBadgeClass = (code) => {
  const colors = {
    'RO': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    'BB': 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    'HB': 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
    'FB': 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    'AI': 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    'UAI': 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
  }
  return colors[code] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const getMealPlanCardClass = (mpResult) => {
  if (!mpResult.hasRates) {
    return 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/30'
  }
  if (!mpResult.available) {
    return 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
  }
  return 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10 hover:border-green-400 hover:shadow-md'
}

const getIssueClass = (type) => {
  const classes = {
    'stop_sale': 'text-red-600 dark:text-red-400',
    'single_stop': 'text-pink-600 dark:text-pink-400',
    'cta': 'text-orange-600 dark:text-orange-400',
    'ctd': 'text-orange-600 dark:text-orange-400',
    'min_stay': 'text-purple-600 dark:text-purple-400',
    'no_rate': 'text-gray-600 dark:text-gray-400'
  }
  return classes[type] || 'text-gray-600 dark:text-gray-400'
}

const getIssueIcon = (type) => {
  const icons = {
    'stop_sale': 'block',
    'single_stop': 'person_off',
    'cta': 'no_meeting_room',
    'ctd': 'logout',
    'min_stay': 'nights_stay',
    'no_rate': 'money_off'
  }
  return icons[type] || 'error'
}

// Get unique issue types from issues array
const getUniqueIssueTypes = (issues) => {
  const types = new Set()
  issues.forEach(issue => types.add(issue.type))
  return Array.from(types)
}

// Get badge class for issue type
const getIssueBadgeClass = (type) => {
  const classes = {
    'stop_sale': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    'single_stop': 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    'cta': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    'ctd': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    'min_stay': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    'no_rate': 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
  }
  return classes[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
}

// Get short label for issue type
const getIssueShortLabel = (type) => {
  const labels = {
    'stop_sale': 'STOP',
    'single_stop': '1P',
    'cta': 'CTA',
    'ctd': 'CTD',
    'min_stay': 'MIN',
    'no_rate': '-'
  }
  return labels[type] || '?'
}

const searchAvailability = async () => {
  if (!isQueryValid.value) return

  loading.value = true
  searched.value = true
  results.value = []

  try {
    // Fetch all rates and campaigns for the date range
    const [ratesResponse, campaignsResponse] = await Promise.all([
      planningService.getRatesCalendar(props.hotelId, {
        startDate: dateRange.value.start,
        endDate: dateRange.value.end,
        market: defaultMarket.value?._id
      }),
      planningService.getCampaigns(props.hotelId, { status: 'active' })
    ])

    const rates = ratesResponse.data?.rates || []
    const allCampaigns = campaignsResponse.data || []

    // Filter applicable campaigns
    const today = new Date()
    const checkInDate = new Date(dateRange.value.start)
    const checkOutDate = new Date(dateRange.value.end)

    const applicableCampaigns = allCampaigns.filter(campaign => {
      // Check booking window (today must be within booking window)
      const bookingStart = new Date(campaign.bookingWindow?.startDate)
      const bookingEnd = new Date(campaign.bookingWindow?.endDate)
      if (today < bookingStart || today > bookingEnd) return false

      // Check stay window (stay dates must overlap with stay window)
      const stayStart = new Date(campaign.stayWindow?.startDate)
      const stayEnd = new Date(campaign.stayWindow?.endDate)
      if (checkOutDate < stayStart || checkInDate > stayEnd) return false

      // Check minimum nights
      if (campaign.conditions?.minNights && nights.value < campaign.conditions.minNights) return false
      if (campaign.conditions?.maxNights && nights.value > campaign.conditions.maxNights) return false

      // Check market
      if (campaign.conditions?.applicableMarkets?.length > 0) {
        const marketIds = campaign.conditions.applicableMarkets.map(m => m._id || m)
        if (!marketIds.includes(defaultMarket.value?._id)) return false
      }

      return true
    })

    // Generate date array (check-in to check-out - 1)
    const dates = []
    const current = new Date(dateRange.value.start)
    const end = new Date(dateRange.value.end)
    while (current < end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    // Process each room type
    for (const roomType of props.roomTypes) {
      const roomResult = {
        roomType,
        mealPlans: []
      }

      const baseOccupancy = roomType.occupancy?.baseOccupancy || 2

      // Process each meal plan
      for (const mealPlan of props.mealPlans) {
        const mpResult = {
          mealPlan,
          hasRates: false,
          available: true,
          totalPrice: 0,
          avgPerNight: 0,
          issues: [],
          dailyBreakdown: []
        }

        let totalBase = 0
        let totalExtraAdult = 0
        let totalChildren = 0
        let totalSingleSupplement = 0
        let hasAnyRate = false

        // Calculate for each night
        for (let i = 0; i < dates.length; i++) {
          const dateStr = dates[i]
          const isCheckIn = i === 0
          const isCheckOut = i === dates.length - 1

          const rate = rates.find(r => {
            const rtId = r.roomType?._id || r.roomType
            const mpId = r.mealPlan?._id || r.mealPlan
            const rateDateStr = r.date?.substring?.(0, 10) || ''
            return rtId === roomType._id && mpId === mealPlan._id && rateDateStr === dateStr
          })

          const dayData = {
            date: dateStr,
            rate: rate,
            basePrice: 0,
            extraAdultPrice: 0,
            childrenPrice: 0,
            singleSupplementPrice: 0,
            dailyTotal: 0,
            hasIssue: false,
            isCheckIn,
            isCheckOut,
            minStayIssue: false
          }

          if (rate) {
            hasAnyRate = true
            dayData.basePrice = rate.pricePerNight || 0
            totalBase += dayData.basePrice

            // Extra adults
            const extraAdults = Math.max(0, query.value.adults - baseOccupancy)
            if (extraAdults > 0 && rate.extraAdult) {
              dayData.extraAdultPrice = extraAdults * rate.extraAdult
              totalExtraAdult += dayData.extraAdultPrice
            }

            // Children
            if (query.value.childrenCount > 0) {
              let childTotal = 0
              for (let c = 0; c < query.value.childrenCount; c++) {
                if (rate.childOrderPricing && rate.childOrderPricing[c] !== undefined) {
                  childTotal += rate.childOrderPricing[c]
                } else if (rate.extraChild) {
                  childTotal += rate.extraChild
                }
              }
              dayData.childrenPrice = childTotal
              totalChildren += childTotal
            }

            // Single supplement
            if (query.value.adults === 1 && rate.singleSupplement) {
              dayData.singleSupplementPrice = -Math.abs(rate.singleSupplement)
              totalSingleSupplement += dayData.singleSupplementPrice
            }

            dayData.dailyTotal = dayData.basePrice + dayData.extraAdultPrice + dayData.childrenPrice + dayData.singleSupplementPrice

            // Check issues
            if (rate.stopSale) {
              dayData.hasIssue = true
              mpResult.available = false
              mpResult.issues.push({ type: 'stop_sale', date: dateStr, message: 'Satış kapalı' })
            }
            if (rate.singleStop && query.value.adults === 1) {
              dayData.hasIssue = true
              mpResult.available = false
              mpResult.issues.push({ type: 'single_stop', date: dateStr, message: 'Tek kişi satışı kapalı' })
            }
            if (rate.closedToArrival && isCheckIn) {
              dayData.hasIssue = true
              mpResult.available = false
              mpResult.issues.push({ type: 'cta', date: dateStr, message: 'Bu tarihte giriş yapılamaz' })
            }
            if (rate.closedToDeparture && isCheckOut) {
              dayData.hasIssue = true
              mpResult.available = false
              mpResult.issues.push({ type: 'ctd', date: dateStr, message: 'Bu tarihte çıkış yapılamaz' })
            }
            if (rate.minStay && nights.value < rate.minStay) {
              dayData.hasIssue = true
              dayData.minStayIssue = true
              mpResult.available = false
              if (!mpResult.issues.find(i => i.type === 'min_stay')) {
                mpResult.issues.push({ type: 'min_stay', date: dateStr, message: `Minimum ${rate.minStay} gece konaklama gerekli` })
              }
            }
          } else {
            dayData.hasIssue = true
            mpResult.available = false
            mpResult.issues.push({ type: 'no_rate', date: dateStr, message: 'Fiyat tanımlı değil' })
          }

          mpResult.dailyBreakdown.push(dayData)
        }

        mpResult.hasRates = hasAnyRate
        const originalPrice = totalBase + totalExtraAdult + totalChildren + totalSingleSupplement
        mpResult.originalPrice = originalPrice
        mpResult.totalPrice = originalPrice
        mpResult.avgPerNight = nights.value > 0 ? mpResult.totalPrice / nights.value : 0
        mpResult.totals = {
          basePrice: totalBase,
          extraAdult: totalExtraAdult,
          children: totalChildren,
          singleSupplement: totalSingleSupplement
        }

        // Find applicable campaign for this room type and meal plan
        const roomCampaigns = applicableCampaigns.filter(campaign => {
          // Check room type
          if (campaign.conditions?.applicableRoomTypes?.length > 0) {
            const rtIds = campaign.conditions.applicableRoomTypes.map(rt => rt._id || rt)
            if (!rtIds.includes(roomType._id)) return false
          }
          // Check meal plan
          if (campaign.conditions?.applicableMealPlans?.length > 0) {
            const mpIds = campaign.conditions.applicableMealPlans.map(mp => mp._id || mp)
            if (!mpIds.includes(mealPlan._id)) return false
          }
          return true
        })

        // Apply campaigns - support for multiple combinable campaigns
        if (roomCampaigns.length > 0 && hasAnyRate && mpResult.originalPrice > 0) {
          // Separate combinable and non-combinable campaigns
          const nonCombinableCampaigns = roomCampaigns.filter(c => !c.combinable)
          const combinableCampaigns = roomCampaigns.filter(c => c.combinable)

          // Build final list of campaigns to apply
          let campaignsToApply = []

          // If there's a non-combinable campaign, use only the best one (highest priority)
          if (nonCombinableCampaigns.length > 0) {
            campaignsToApply = [nonCombinableCampaigns[0]]
          } else if (combinableCampaigns.length > 0) {
            // All are combinable - sort by calculationOrder (lower first)
            campaignsToApply = [...combinableCampaigns].sort((a, b) =>
              (a.calculationOrder || 0) - (b.calculationOrder || 0)
            )
          }

          if (campaignsToApply.length > 0) {
            // Store original daily totals before any campaign
            mpResult.dailyBreakdown.forEach(day => {
              day.originalDailyTotal = day.dailyTotal
              day.appliedCampaigns = []
            })

            mpResult.campaigns = []
            mpResult.totalDiscountAmount = 0
            let currentTotalPrice = mpResult.originalPrice

            // Apply each campaign
            for (const campaign of campaignsToApply) {
              const applicationType = campaign.applicationType || 'stay'
              const calculationType = campaign.calculationType || 'cumulative'
              const stayStart = new Date(campaign.stayWindow?.startDate)
              const stayEnd = new Date(campaign.stayWindow?.endDate)
              stayStart.setHours(0, 0, 0, 0)
              stayEnd.setHours(23, 59, 59, 999)

              // Determine which nights this campaign applies to
              let eligibleNights = 0
              let eligibleTotal = 0
              const eligibleDayIndices = []

              if (applicationType === 'checkin') {
                const checkIn = new Date(dateRange.value.start)
                checkIn.setHours(0, 0, 0, 0)
                if (checkIn >= stayStart && checkIn <= stayEnd) {
                  mpResult.dailyBreakdown.forEach((day, idx) => {
                    if (day.rate) {
                      eligibleNights++
                      // For cumulative: use original price, for sequential: use current price
                      eligibleTotal += calculationType === 'cumulative' ? day.originalDailyTotal : day.dailyTotal
                      eligibleDayIndices.push(idx)
                    }
                  })
                }
              } else {
                mpResult.dailyBreakdown.forEach((day, idx) => {
                  const dayDate = new Date(day.date)
                  dayDate.setHours(0, 0, 0, 0)
                  if (dayDate >= stayStart && dayDate <= stayEnd && day.rate) {
                    eligibleNights++
                    eligibleTotal += calculationType === 'cumulative' ? day.originalDailyTotal : day.dailyTotal
                    eligibleDayIndices.push(idx)
                  }
                })
              }

              if (eligibleNights > 0) {
                let campaignDiscount = 0
                let discountText = ''

                if (campaign.discount?.type === 'percentage') {
                  const discountPercent = campaign.discount.value / 100
                  campaignDiscount = eligibleTotal * discountPercent

                  // Update daily breakdown
                  eligibleDayIndices.forEach(idx => {
                    const day = mpResult.dailyBreakdown[idx]
                    const dayBase = calculationType === 'cumulative' ? day.originalDailyTotal : day.dailyTotal
                    const dayDiscount = dayBase * discountPercent
                    day.dailyTotal = Math.max(0, day.dailyTotal - dayDiscount)
                    day.discountAmount = (day.discountAmount || 0) + dayDiscount
                    day.campaignApplied = true
                    day.appliedCampaigns.push({
                      name: campaign.name,
                      discount: `-${campaign.discount.value}%`,
                      amount: dayDiscount
                    })
                  })

                  discountText = eligibleNights < nights.value
                    ? `-${campaign.discount.value}% (${eligibleNights}/${nights.value})`
                    : `-${campaign.discount.value}%`

                } else if (campaign.discount?.type === 'fixed') {
                  const discountPerNight = campaign.discount.value
                  campaignDiscount = Math.min(discountPerNight * eligibleNights, eligibleTotal)

                  eligibleDayIndices.forEach(idx => {
                    const day = mpResult.dailyBreakdown[idx]
                    const dayDiscount = Math.min(discountPerNight, day.dailyTotal)
                    day.dailyTotal = Math.max(0, day.dailyTotal - dayDiscount)
                    day.discountAmount = (day.discountAmount || 0) + dayDiscount
                    day.campaignApplied = true
                    day.appliedCampaigns.push({
                      name: campaign.name,
                      discount: `-${campaign.discount.value}`,
                      amount: dayDiscount
                    })
                  })

                  discountText = `-${campaign.discount.value} ${currency.value}/gece`

                } else if (campaign.discount?.type === 'free_nights') {
                  const stayN = campaign.discount.freeNights?.stayNights || 0
                  const freeN = campaign.discount.freeNights?.freeNights || 0
                  if (eligibleNights >= stayN && freeN > 0) {
                    // Sort eligible days by current price and mark cheapest as free
                    const eligibleDays = eligibleDayIndices
                      .map(idx => ({ idx, price: mpResult.dailyBreakdown[idx].dailyTotal }))
                      .sort((a, b) => a.price - b.price)

                    eligibleDays.slice(0, freeN).forEach(({ idx }) => {
                      const day = mpResult.dailyBreakdown[idx]
                      const dayDiscount = day.dailyTotal
                      campaignDiscount += dayDiscount
                      day.discountAmount = (day.discountAmount || 0) + dayDiscount
                      day.dailyTotal = 0
                      day.isFreeNight = true
                      day.campaignApplied = true
                      day.appliedCampaigns.push({
                        name: campaign.name,
                        discount: 'Ücretsiz',
                        amount: dayDiscount
                      })
                    })

                    discountText = `${stayN}=${freeN} Gece`
                  }
                }

                if (campaignDiscount > 0) {
                  mpResult.totalDiscountAmount += campaignDiscount
                  currentTotalPrice -= campaignDiscount

                  mpResult.campaigns.push({
                    ...campaign,
                    discountAmount: campaignDiscount,
                    discountText,
                    eligibleNights
                  })
                }
              }
            }

            // Set final values
            mpResult.totalPrice = Math.max(0, currentTotalPrice)
            mpResult.discountAmount = mpResult.totalDiscountAmount

            // For backward compatibility - single campaign reference
            if (mpResult.campaigns.length === 1) {
              mpResult.campaign = mpResult.campaigns[0]
              mpResult.discountText = mpResult.campaigns[0].discountText
              mpResult.campaignAppliedNights = mpResult.campaigns[0].eligibleNights
            } else if (mpResult.campaigns.length > 1) {
              // Multiple campaigns - create combined text
              mpResult.campaign = mpResult.campaigns[0] // Primary campaign
              mpResult.discountText = mpResult.campaigns.map(c => c.discountText).join(' + ')
              mpResult.campaignAppliedNights = Math.max(...mpResult.campaigns.map(c => c.eligibleNights))
            }

            mpResult.avgPerNight = nights.value > 0 ? mpResult.totalPrice / nights.value : 0
          }
        }

        roomResult.mealPlans.push(mpResult)
      }

      results.value.push(roomResult)
    }

  } catch (error) {
    console.error('Search error:', error)
  } finally {
    loading.value = false
  }
}

const showDetails = (roomResult, mpResult) => {
  detailModal.value = {
    show: true,
    roomType: roomResult.roomType,
    mealPlan: mpResult.mealPlan,
    data: mpResult
  }
}

// Reset on modal open
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    setDefaultDates()
    searched.value = false
    results.value = []
  }
})

// Initial setup
setDefaultDates()
</script>
