<template>
  <div class="monthly-calendar">
    <!-- Month Navigation Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div class="flex items-center gap-2 sm:gap-3">
        <button
          @click="previousMonth"
          class="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <span class="material-icons text-lg sm:text-2xl">chevron_left</span>
        </button>
        <h3 class="text-base sm:text-xl font-bold text-gray-800 dark:text-white min-w-[140px] sm:min-w-[200px] text-center">
          {{ monthYearLabel }}
        </h3>
        <button
          @click="nextMonth"
          class="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <span class="material-icons text-lg sm:text-2xl">chevron_right</span>
        </button>
        <button
          @click="goToToday"
          class="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
        >
          {{ $t('planning.pricing.today') }}
        </button>

        <!-- Current Month Seasons -->
        <template v-if="currentSeasons.length > 0">
          <span class="hidden sm:block w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1"></span>
          <div class="hidden sm:flex items-center gap-1">
            <span
              v-for="season in currentSeasons"
              :key="season._id"
              class="px-2 py-0.5 text-xs font-medium text-white rounded-full"
              :style="{ backgroundColor: season.color || '#6366f1' }"
              :title="getSeasonName(season)"
            >
              {{ season.code }}
            </span>
          </div>
        </template>
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
        <!-- Copy/Paste Buttons -->
        <button
          v-if="selectedCells.length > 0"
          @click="copyWeek"
          class="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1 whitespace-nowrap"
          :title="'Ctrl+C'"
        >
          <span class="material-icons text-sm">content_copy</span>
          <span class="hidden sm:inline">{{ $t('planning.pricing.copyWeek') }}</span>
        </button>
        <button
          v-if="copiedWeek"
          @click="pasteWeek"
          class="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1 whitespace-nowrap"
          :title="'Ctrl+V'"
        >
          <span class="material-icons text-sm">content_paste</span>
          <span class="hidden sm:inline">{{ $t('planning.pricing.pasteWeek') }}</span>
        </button>

        <div v-if="selectedCells.length > 0 || copiedWeek" class="w-px h-5 sm:h-6 bg-gray-300 dark:bg-slate-600 mx-0.5 sm:mx-1"></div>

        <button
          v-if="selectedCells.length > 0"
          @click="clearSelection"
          class="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
        >
          <span class="material-icons text-sm align-middle mr-0.5 sm:mr-1">close</span>
          <span class="hidden sm:inline">{{ $t('planning.pricing.clearSelection') }}</span> ({{ selectedCells.length }})
        </button>
        <button
          v-if="selectedCells.length > 0"
          @click="bulkEdit"
          class="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          <span class="material-icons text-sm">edit</span>
          <span class="hidden sm:inline">{{ $t('planning.pricing.bulkEdit') }}</span>
        </button>

        <div class="w-px h-5 sm:h-6 bg-gray-300 dark:bg-slate-600 mx-0.5 sm:mx-1"></div>

        <!-- Inline Edit Mode Toggle -->
        <button
          @click="toggleInlineEditMode"
          class="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
          :class="inlineEditMode
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200'"
        >
          <span class="material-icons text-sm">{{ inlineEditMode ? 'save' : 'edit_note' }}</span>
          <span class="hidden sm:inline">{{ inlineEditMode ? $t('planning.pricing.saveInlineEdit') : $t('planning.pricing.inlineEditMode') }}</span>
        </button>
        <button
          v-if="inlineEditMode"
          @click="cancelInlineEdit"
          class="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          <span class="material-icons text-sm">close</span>
          <span class="hidden sm:inline">{{ $t('common.cancel') }}</span>
        </button>
      </div>
    </div>

    <!-- Inline Edit Mode Banner -->
    <div v-if="inlineEditMode" class="mb-3 p-2 sm:p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div class="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs sm:text-sm">
          <span class="material-icons text-lg">edit_note</span>
          <span>{{ $t('planning.pricing.inlineEditHint') }}</span>
        </div>
        <!-- Relative Pricing Toggle -->
        <div v-if="hasBaseRoom" class="flex items-center gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              v-model="inlineRelativePricing"
              class="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
            />
            <span class="text-xs text-amber-700 dark:text-amber-300">
              {{ $t('planning.pricing.useRelativePricing') }}
            </span>
          </label>
          <label v-if="inlineRelativePricing" class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              v-model="inlineAllowEditCalculated"
              class="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
            />
            <span class="text-xs text-amber-700 dark:text-amber-300">
              {{ $t('planning.pricing.allowEditCalculated') }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Selection Summary -->
    <div v-if="selectedCells.length > 0" class="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4 text-sm">
          <span class="text-purple-700 dark:text-purple-300">
            <span class="font-semibold">{{ selectedCells.length }}</span> {{ $t('planning.pricing.cellsSelected') }}
          </span>
          <span class="text-gray-500 dark:text-slate-400">|</span>
          <span class="text-gray-600 dark:text-slate-400">
            {{ getSelectionDateRange }}
          </span>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button
            @click="quickAction('stopSale', true)"
            class="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 transition-colors"
          >
            <span class="material-icons text-xs align-middle">block</span>
            Stop Sale
          </button>
          <button
            @click="quickAction('stopSale', false)"
            class="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded hover:bg-green-200 transition-colors"
          >
            <span class="material-icons text-xs align-middle">check_circle</span>
            Open Sale
          </button>
          <button
            @click="quickAction('singleStop', true)"
            class="px-2 py-1 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded hover:bg-pink-200 transition-colors"
          >
            <span class="material-icons text-xs align-middle">person_off</span>
            1P Stop
          </button>
          <button
            @click="quickAction('singleStop', false)"
            class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 transition-colors"
          >
            <span class="material-icons text-xs align-middle">person</span>
            1P Open
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-12 text-center">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
      <p class="mt-4 text-gray-600 dark:text-slate-400">{{ $t('common.loading') }}</p>
    </div>

    <!-- Calendar Grid -->
    <div v-else class="calendar-grid-wrapper overflow-auto rounded-xl border border-gray-200 dark:border-slate-600 shadow-sm">
      <table class="calendar-table w-full" :style="{ minWidth: `${100 + (daysInMonth * 44)}px` }">
        <!-- Days Header -->
        <thead>
          <!-- Day Numbers -->
          <tr class="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <th class="sticky left-0 z-30 bg-gray-50 dark:bg-slate-800 px-2 sm:px-3 py-2 text-left min-w-[120px] sm:min-w-[180px] border-r border-gray-200 dark:border-slate-700">
              <span class="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                {{ $t('planning.pricing.roomType') }}
              </span>
            </th>
            <th
              v-for="day in calendarDays"
              :key="day.date"
              @click="selectDateColumn(day.date, $event)"
              class="px-0.5 sm:px-1 py-1.5 sm:py-2 text-center min-w-[36px] sm:min-w-[48px] border-r border-gray-100 dark:border-slate-700 last:border-r-0 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              :class="{
                'bg-blue-50 dark:bg-blue-900/20': day.isToday,
                'bg-amber-50/50 dark:bg-amber-900/10': day.isWeekend && !day.isToday,
                'bg-purple-100 dark:bg-purple-900/30': isDateColumnSelected(day.date)
              }"
              :title="$t('planning.pricing.clickToSelectDate')"
            >
              <div class="text-[10px] sm:text-xs font-medium" :class="day.isToday ? 'text-blue-600 dark:text-blue-400' : day.isWeekend ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-slate-400'">
                {{ day.weekday }}
              </div>
              <div
                class="text-xs sm:text-sm font-bold mt-0.5"
                :class="day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-white'"
              >
                {{ day.dayNumber }}
              </div>
            </th>
          </tr>
        </thead>

        <!-- Room Type Rows -->
        <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
          <template v-for="roomType in roomTypes" :key="roomType._id">
            <!-- Main Room Row (with meal plan if only one) -->
            <tr
              v-for="(mealPlan, mpIndex) in filteredMealPlans"
              :key="`${roomType._id}-${mealPlan._id}`"
            >
              <!-- Room Type / Meal Plan Label -->
              <td
                class="sticky left-0 z-20 bg-white dark:bg-slate-800 px-2 sm:px-3 py-1.5 sm:py-2 border-r border-gray-200 dark:border-slate-700 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                :class="{
                  'border-t border-gray-200 dark:border-slate-700': mpIndex === 0,
                  'bg-purple-50 dark:bg-purple-900/20': isRoomMealPlanSelected(roomType._id, mealPlan._id)
                }"
                @click="selectRoomRow(roomType._id, mealPlan._id, $event)"
                :title="$t('planning.pricing.clickToSelectRow')"
              >
                <div v-if="mpIndex === 0" class="font-semibold text-gray-800 dark:text-white text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[150px]">
                  {{ getRoomTypeName(roomType) }}
                  <span
                    v-if="roomType.status === 'inactive'"
                    class="ml-1 px-1 py-0.5 text-[9px] font-medium rounded bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400"
                  >
                    {{ $t('common.status.inactive') }}
                  </span>
                </div>
                <div class="flex items-center gap-1 sm:gap-2 mt-0.5">
                  <span
                    class="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium"
                    :class="getMealPlanColor(mealPlan.code)"
                  >
                    {{ mealPlan.code }}
                  </span>
                  <span class="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 hidden sm:inline truncate max-w-[80px]">
                    {{ getMealPlanName(mealPlan) }}
                  </span>
                </div>
              </td>

              <!-- Day Cells -->
              <td
                v-for="day in calendarDays"
                :key="`${roomType._id}-${mealPlan._id}-${day.date}`"
                class="relative border-r border-gray-100 dark:border-slate-700 last:border-r-0 p-0"
                :class="{
                  'bg-blue-50/30 dark:bg-blue-900/10': day.isToday,
                  'bg-amber-50/30 dark:bg-amber-900/5': day.isWeekend && !day.isToday
                }"
              >
                <RateCell
                  :ref="el => setCellRef(el, roomType._id, mealPlan._id, day.date)"
                  :rate="getRateForCell(roomType._id, mealPlan._id, day.date)"
                  :date="day.date"
                  :room-type-id="roomType._id"
                  :meal-plan-id="mealPlan._id"
                  :currency="currency"
                  :is-selected="isCellSelected(roomType._id, mealPlan._id, day.date)"
                  :is-past="day.isPast"
                  :inline-edit-mode="inlineEditMode"
                  :inline-edit-value="getInlineEditPrice(roomType._id, mealPlan._id, day.date)"
                  :is-base-cell="isBaseCellFn(roomType._id, mealPlan._id)"
                  :is-calculated="isCalculatedCell(roomType._id, mealPlan._id)"
                  :allow-edit-calculated="inlineAllowEditCalculated"
                  @click="handleCellClick($event, roomType._id, mealPlan._id, day.date)"
                  @dblclick="handleCellDblClick(roomType._id, mealPlan._id, day.date)"
                  @inline-change="handleInlineChange(roomType._id, mealPlan._id, day.date, $event)"
                  @inline-up="navigateCell(roomType._id, mealPlan._id, day.date, 'up')"
                  @inline-down="navigateCell(roomType._id, mealPlan._id, day.date, 'down')"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Legend & Keyboard Shortcuts -->
    <div class="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4">
      <!-- Legend -->
      <div class="flex flex-wrap items-center gap-3 sm:gap-6 text-[10px] sm:text-xs text-gray-600 dark:text-slate-400">
        <div class="flex items-center gap-1.5 sm:gap-2">
          <div class="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-green-500"></div>
          <span>{{ $t('planning.pricing.available') }}</span>
        </div>
        <div class="flex items-center gap-1.5 sm:gap-2">
          <div class="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-red-500"></div>
          <span>{{ $t('planning.pricing.stopSale') }}</span>
        </div>
        <div class="flex items-center gap-1.5 sm:gap-2">
          <div class="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-pink-500"></div>
          <span>{{ $t('planning.pricing.singleStop') }}</span>
        </div>
        <div class="flex items-center gap-1.5 sm:gap-2">
          <div class="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-amber-500"></div>
          <span>{{ $t('planning.pricing.lowAllotment') }}</span>
        </div>
        <div class="flex items-center gap-1.5 sm:gap-2">
          <div class="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded bg-gray-200 dark:bg-slate-600"></div>
          <span>{{ $t('planning.pricing.noRate') }}</span>
        </div>
      </div>

      <!-- Keyboard Shortcuts (hidden on mobile) -->
      <div class="hidden sm:flex items-center gap-4 text-xs text-gray-500 dark:text-slate-500">
        <div class="flex items-center gap-1">
          <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-[10px] font-mono">Shift</kbd>
          <span>+ Click: Range</span>
        </div>
        <div class="flex items-center gap-1">
          <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-[10px] font-mono">Ctrl</kbd>
          <span>+ C/V: Copy/Paste</span>
        </div>
        <div class="flex items-center gap-1">
          <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-[10px] font-mono">Delete</kbd>
          <span>: Stop Sale</span>
        </div>
      </div>
    </div>

    <!-- Clipboard Indicator -->
    <Transition name="fade">
      <div
        v-if="copiedWeek"
        class="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-lg"
      >
        <span class="material-icons text-lg">content_paste</span>
        <div>
          <div class="font-medium text-sm">{{ $t('planning.pricing.weekCopied') }}</div>
          <div class="text-xs opacity-80">{{ copiedWeek.duration }} {{ locale === 'tr' ? 'gün' : 'days' }}</div>
        </div>
        <button
          @click="copiedWeek = null"
          class="ml-2 p-1 hover:bg-blue-500 rounded transition-colors"
        >
          <span class="material-icons text-sm">close</span>
        </button>
      </div>
    </Transition>

    <!-- Inline Edit Popover -->
    <Teleport to="body">
      <div
        v-if="editingCell"
        ref="popoverRef"
        class="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 p-4 min-w-[280px] max-h-[calc(100vh-16px)] overflow-y-auto"
        :style="popoverStyle"
      >
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-semibold text-gray-800 dark:text-white text-sm">
            {{ $t('planning.pricing.quickEdit') }}
          </h4>
          <button @click="closeInlineEdit" class="text-gray-400 hover:text-gray-600">
            <span class="material-icons text-sm">close</span>
          </button>
        </div>

        <div class="space-y-3">
          <!-- Price -->
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.pricePerNight') }} ({{ currency }})</label>
            <input
              v-model.number="inlineForm.pricePerNight"
              type="number"
              min="0"
              step="1"
              class="form-input mt-1 text-lg font-bold text-green-600"
              @keyup.enter="saveInlineEdit"
            />
          </div>

          <!-- Extra Person Pricing -->
          <div class="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-2">
            <div class="text-xs font-medium text-gray-600 dark:text-slate-300 mb-2">{{ $t('planning.pricing.extraPrices') }}</div>

            <!-- Extra Adult -->
            <div class="flex items-center gap-2">
              <span class="material-icons text-amber-500 text-sm">person_add</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 w-20">{{ $t('planning.pricing.extraAdultShort') }}</span>
              <input
                v-model.number="inlineForm.extraAdult"
                type="number"
                min="0"
                class="form-input flex-1 text-sm py-1"
                placeholder="0"
              />
            </div>

            <!-- Child Order Pricing -->
            <div
              v-for="(price, index) in inlineForm.childOrderPricing"
              :key="index"
              class="flex items-center gap-2"
            >
              <span class="material-icons text-pink-500 text-sm">child_care</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 w-20">{{ index + 1 }}. {{ $t('planning.pricing.child') }}</span>
              <input
                v-model.number="inlineForm.childOrderPricing[index]"
                type="number"
                min="0"
                class="form-input flex-1 text-sm py-1"
                placeholder="0"
              />
            </div>

            <!-- Extra Infant -->
            <div class="flex items-center gap-2">
              <span class="material-icons text-purple-500 text-sm">baby_changing_station</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 w-20">{{ $t('planning.pricing.extraInfantShort') }}</span>
              <input
                v-model.number="inlineForm.extraInfant"
                type="number"
                min="0"
                class="form-input flex-1 text-sm py-1"
                placeholder="0"
              />
            </div>

            <!-- Single Occupancy Discount -->
            <div class="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-slate-600 mt-2">
              <span class="material-icons text-blue-500 text-sm">person</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 w-20">{{ $t('planning.pricing.singleOccupancy') }}</span>
              <div class="flex items-center gap-1">
                <span class="text-xs text-gray-400">-</span>
                <input
                  v-model.number="inlineForm.singleSupplement"
                  type="number"
                  min="0"
                  class="form-input flex-1 text-sm py-1"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <!-- Allotment -->
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.allotment') }}</label>
            <input
              v-model.number="inlineForm.allotment"
              type="number"
              min="0"
              class="form-input mt-1"
            />
          </div>

          <!-- Quick toggles -->
          <div class="flex flex-wrap gap-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="inlineForm.stopSale" class="rounded border-gray-300 text-red-600" />
              <span class="text-xs text-red-600">Stop Sale</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="inlineForm.singleStop" class="rounded border-gray-300 text-pink-600" />
              <span class="text-xs text-pink-600">1P Stop</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="inlineForm.closedToArrival" class="rounded border-gray-300 text-orange-600" />
              <span class="text-xs">CTA</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="inlineForm.closedToDeparture" class="rounded border-gray-300 text-orange-600" />
              <span class="text-xs">CTD</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
          <button @click="closeInlineEdit" class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">
            {{ $t('common.cancel') }}
          </button>
          <button
            @click="saveInlineEdit"
            class="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            :disabled="savingInline"
          >
            {{ savingInline ? '...' : $t('common.save') }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import RateCell from './RateCell.vue'
import planningService from '@/services/planningService'

const props = defineProps({
  hotelId: { type: String, required: true },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  market: { type: Object, default: null },
  rates: { type: Array, default: () => [] },
  overrides: { type: Array, default: () => [] }, // RateOverride records (daily exceptions)
  loading: { type: Boolean, default: false },
  initialMonth: { type: Object, default: null }, // { year, month }
  currentSeasons: { type: Array, default: () => [] } // Seasons in current month
})

const emit = defineEmits(['update', 'bulk-edit', 'refresh', 'selection-change'])

const { t, locale } = useI18n()
const toast = useToast()

// Current month/year - use initialMonth prop if provided
const getInitialDate = () => {
  if (props.initialMonth?.year && props.initialMonth?.month) {
    return new Date(props.initialMonth.year, props.initialMonth.month - 1, 1)
  }
  return new Date()
}
const currentDate = ref(getInitialDate())

// Selection state
const selectedCells = ref([])
const isSelecting = ref(false)
const selectionStart = ref(null)

// Copy/Paste state
const copiedWeek = ref(null)

// Inline edit mode
const inlineEditMode = ref(false)
const inlineEditPrices = reactive({}) // { `${roomTypeId}-${mealPlanId}-${date}`: price }
const inlineRelativePricing = ref(true) // Use relative pricing in inline edit mode
const inlineAllowEditCalculated = ref(false) // Allow editing calculated cells

// Base room/meal plan for relative pricing
const baseRoom = computed(() => props.roomTypes.find(rt => rt.isBaseRoom))
const baseMealPlan = computed(() => props.mealPlans.find(mp => mp.isBaseMealPlan) || props.mealPlans[0])
const hasBaseRoom = computed(() => !!baseRoom.value)

// Check if a cell is the base cell
const isBaseCellFn = (roomTypeId, mealPlanId) => {
  if (!hasBaseRoom.value || !inlineRelativePricing.value) return false
  return baseRoom.value._id === roomTypeId && baseMealPlan.value?._id === mealPlanId
}

// Check if a cell is calculated (not base, when relative pricing is active)
const isCalculatedCell = (roomTypeId, mealPlanId) => {
  if (!hasBaseRoom.value || !inlineRelativePricing.value) return false
  return !isBaseCellFn(roomTypeId, mealPlanId)
}

// Cell refs for keyboard navigation
const cellRefs = reactive({})

const setCellRef = (el, roomTypeId, mealPlanId, date) => {
  const key = `${roomTypeId}-${mealPlanId}-${date}`
  if (el) {
    cellRefs[key] = el
  } else {
    delete cellRefs[key]
  }
}

// Navigate between cells with arrow keys
const navigateCell = (currentRoomId, currentMealPlanId, currentDate, direction) => {
  const meals = filteredMealPlans.value
  const rooms = props.roomTypes

  // Get current indices
  const roomIndex = rooms.findIndex(r => r._id === currentRoomId)
  const mealIndex = meals.findIndex(m => m._id === currentMealPlanId)

  if (roomIndex === -1 || mealIndex === -1) return

  let newRoomIndex = roomIndex
  let newMealIndex = mealIndex

  if (direction === 'up') {
    // Move to previous meal plan row, or previous room's last meal plan
    if (mealIndex > 0) {
      newMealIndex = mealIndex - 1
    } else if (roomIndex > 0) {
      newRoomIndex = roomIndex - 1
      newMealIndex = meals.length - 1
    } else {
      return // Already at top
    }
  } else if (direction === 'down') {
    // Move to next meal plan row, or next room's first meal plan
    if (mealIndex < meals.length - 1) {
      newMealIndex = mealIndex + 1
    } else if (roomIndex < rooms.length - 1) {
      newRoomIndex = roomIndex + 1
      newMealIndex = 0
    } else {
      return // Already at bottom
    }
  }

  const newRoomId = rooms[newRoomIndex]._id
  const newMealPlanId = meals[newMealIndex]._id
  const key = `${newRoomId}-${newMealPlanId}-${currentDate}`

  // Focus the input in the target cell
  const targetCell = cellRefs[key]
  if (targetCell?.$el) {
    const input = targetCell.$el.querySelector('input')
    if (input) {
      nextTick(() => input.focus())
    }
  }
}

// Inline edit state
const editingCell = ref(null)
const popoverRef = ref(null)
const popoverStyle = ref({})
const savingInline = ref(false)
const inlineForm = reactive({
  pricePerNight: 0,
  allotment: 0,
  minStay: 1,
  stopSale: false,
  singleStop: false,
  closedToArrival: false,
  closedToDeparture: false,
  extraAdult: '',
  extraInfant: '',
  childOrderPricing: [],
  singleSupplement: ''
})

// Helper: Format date to YYYY-MM-DD without timezone issues
const formatDateToString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper: Parse YYYY-MM-DD string to local Date without timezone issues
const parseDateString = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Computed
const currency = computed(() => props.market?.currency || 'EUR')

const filteredMealPlans = computed(() => {
  return props.mealPlans.filter(mp => mp.status === 'active')
})

const monthYearLabel = computed(() => {
  const months = locale.value === 'tr'
    ? ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  return `${months[currentDate.value.getMonth()]} ${currentDate.value.getFullYear()}`
})

const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  return new Date(year, month + 1, 0).getDate()
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekdaysShort = locale.value === 'tr'
    ? ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  for (let i = 1; i <= daysInMonth.value; i++) {
    const date = new Date(year, month, i)
    const dayOfWeek = date.getDay()

    days.push({
      date: formatDateToString(date),
      dayNumber: i,
      weekday: weekdaysShort[dayOfWeek],
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isToday: date.getTime() === today.getTime(),
      isPast: date < today
    })
  }

  return days
})

const getSelectionDateRange = computed(() => {
  if (selectedCells.value.length === 0) return ''

  const dates = selectedCells.value.map(c => c.date).sort()
  const first = dates[0]
  const last = dates[dates.length - 1]

  // Parse date without timezone issues (YYYY-MM-DD format)
  const formatDateStr = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month is 0-indexed
    return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US')
  }

  if (first === last) {
    return formatDateStr(first)
  }

  return `${formatDateStr(first)} - ${formatDateStr(last)}`
})

// Methods
const previousMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentDate.value = newDate
  emit('refresh', { year: newDate.getFullYear(), month: newDate.getMonth() + 1 })
}

const nextMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentDate.value = newDate
  emit('refresh', { year: newDate.getFullYear(), month: newDate.getMonth() + 1 })
}

const goToToday = () => {
  currentDate.value = new Date()
  emit('refresh', { year: currentDate.value.getFullYear(), month: currentDate.value.getMonth() + 1 })
}

const getRoomTypeName = (roomType) => {
  return roomType.name?.[locale.value] || roomType.name?.tr || roomType.name?.en || roomType.code
}

const getMealPlanName = (mealPlan) => {
  return mealPlan.name?.[locale.value] || mealPlan.name?.tr || mealPlan.name?.en || ''
}

const getSeasonName = (season) => {
  return season.name?.[locale.value] || season.name?.tr || season.name?.en || season.code
}

const getMealPlanColor = (code) => {
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

const getRateForCell = (roomTypeId, mealPlanId, dateStr) => {
  // Daily rate model - find the rate that matches this exact date
  return props.rates.find(rate => {
    const rtId = rate.roomType?._id || rate.roomType
    const mpId = rate.mealPlan?._id || rate.mealPlan

    if (rtId !== roomTypeId || mpId !== mealPlanId) return false

    // Compare date string directly (YYYY-MM-DD format)
    const rateDateStr = rate.date?.substring?.(0, 10) || ''
    return rateDateStr === dateStr
  }) || null
}

const isCellSelected = (roomTypeId, mealPlanId, date) => {
  return selectedCells.value.some(c =>
    c.roomTypeId === roomTypeId && c.mealPlanId === mealPlanId && c.date === date
  )
}

const handleCellClick = (event, roomTypeId, mealPlanId, date) => {
  // Get rate ID if exists
  const rate = getRateForCell(roomTypeId, mealPlanId, date)
  const cellKey = { roomTypeId, mealPlanId, date, rateId: rate?._id || null }

  if (event.shiftKey && selectedCells.value.length > 0) {
    // Range select
    const lastSelected = selectedCells.value[selectedCells.value.length - 1]
    selectRange(lastSelected, cellKey)
  } else if (event.ctrlKey || event.metaKey) {
    // Toggle single cell
    const idx = selectedCells.value.findIndex(c =>
      c.roomTypeId === roomTypeId && c.mealPlanId === mealPlanId && c.date === date
    )
    if (idx > -1) {
      selectedCells.value.splice(idx, 1)
    } else {
      selectedCells.value.push(cellKey)
    }
  } else {
    // Single select
    selectedCells.value = [cellKey]
  }
}

const handleCellDblClick = (roomTypeId, mealPlanId, date) => {
  const rate = getRateForCell(roomTypeId, mealPlanId, date)
  openInlineEdit(roomTypeId, mealPlanId, date, rate)
}

const selectRange = (start, end) => {
  const startDate = parseDateString(start.date)
  const endDate = parseDateString(end.date)
  const minDate = startDate < endDate ? startDate : endDate
  const maxDate = startDate > endDate ? startDate : endDate

  const newSelection = []

  // Select all cells between start and end for same room/meal combo
  if (start.roomTypeId === end.roomTypeId && start.mealPlanId === end.mealPlanId) {
    const current = new Date(minDate)
    while (current <= maxDate) {
      const dateStr = formatDateToString(current)
      const rate = getRateForCell(start.roomTypeId, start.mealPlanId, dateStr)
      newSelection.push({
        roomTypeId: start.roomTypeId,
        mealPlanId: start.mealPlanId,
        date: dateStr,
        rateId: rate?._id || null
      })
      current.setDate(current.getDate() + 1)
    }
  }

  selectedCells.value = newSelection
}

const clearSelection = () => {
  selectedCells.value = []
}

const bulkEdit = () => {
  if (selectedCells.value.length > 0) {
    emit('bulk-edit', selectedCells.value)
  }
}

// Select all cells in a date column (all rooms and meal plans for that date)
const selectDateColumn = (date, event) => {
  const newCells = []

  for (const roomType of props.roomTypes) {
    for (const mealPlan of filteredMealPlans.value) {
      const rate = getRateForCell(roomType._id, mealPlan._id, date)
      newCells.push({
        roomTypeId: roomType._id,
        mealPlanId: mealPlan._id,
        date,
        rateId: rate?._id || null
      })
    }
  }

  if (event.shiftKey && selectedCells.value.length > 0) {
    // Range select dates
    const existingDates = [...new Set(selectedCells.value.map(c => c.date))].sort()
    const lastDate = existingDates[existingDates.length - 1]
    const startDateObj = parseDateString(lastDate < date ? lastDate : date)
    const endDateObj = parseDateString(lastDate > date ? lastDate : date)

    const rangeCells = []
    const current = new Date(startDateObj)
    while (current <= endDateObj) {
      const dateStr = formatDateToString(current)
      for (const roomType of props.roomTypes) {
        for (const mealPlan of filteredMealPlans.value) {
          const rate = getRateForCell(roomType._id, mealPlan._id, dateStr)
          rangeCells.push({
            roomTypeId: roomType._id,
            mealPlanId: mealPlan._id,
            date: dateStr,
            rateId: rate?._id || null
          })
        }
      }
      current.setDate(current.getDate() + 1)
    }
    selectedCells.value = rangeCells
  } else if (event.ctrlKey || event.metaKey) {
    // Toggle date column
    const dateSelected = selectedCells.value.some(c => c.date === date)
    if (dateSelected) {
      selectedCells.value = selectedCells.value.filter(c => c.date !== date)
    } else {
      selectedCells.value = [...selectedCells.value, ...newCells]
    }
  } else {
    selectedCells.value = newCells
  }
}

// Check if a date column is fully selected
const isDateColumnSelected = (date) => {
  const totalCells = props.roomTypes.length * filteredMealPlans.value.length
  const selectedCount = selectedCells.value.filter(c => c.date === date).length
  return selectedCount === totalCells && totalCells > 0
}

// Select all cells in a room row (all dates for that room/meal plan)
const selectRoomRow = (roomTypeId, mealPlanId, event) => {
  const newCells = calendarDays.value.map(day => {
    const rate = getRateForCell(roomTypeId, mealPlanId, day.date)
    return {
      roomTypeId,
      mealPlanId,
      date: day.date,
      rateId: rate?._id || null
    }
  })

  if (event.ctrlKey || event.metaKey) {
    // Toggle row
    const rowSelected = selectedCells.value.some(c => c.roomTypeId === roomTypeId && c.mealPlanId === mealPlanId)
    if (rowSelected) {
      selectedCells.value = selectedCells.value.filter(c => !(c.roomTypeId === roomTypeId && c.mealPlanId === mealPlanId))
    } else {
      selectedCells.value = [...selectedCells.value, ...newCells]
    }
  } else {
    selectedCells.value = newCells
  }
}

// Check if a room/meal plan row is fully selected
const isRoomMealPlanSelected = (roomTypeId, mealPlanId) => {
  const totalCells = calendarDays.value.length
  const selectedCount = selectedCells.value.filter(c => c.roomTypeId === roomTypeId && c.mealPlanId === mealPlanId).length
  return selectedCount === totalCells && totalCells > 0
}

// Inline edit mode functions
const toggleInlineEditMode = () => {
  if (inlineEditMode.value) {
    // Exiting edit mode - save changes
    saveInlineEditPrices()
  } else {
    // Entering edit mode - populate prices from existing rates
    populateInlineEditPrices()
  }
  inlineEditMode.value = !inlineEditMode.value
}

const populateInlineEditPrices = () => {
  // Clear existing
  Object.keys(inlineEditPrices).forEach(key => delete inlineEditPrices[key])

  // Populate from rates
  for (const roomType of props.roomTypes) {
    for (const mealPlan of filteredMealPlans.value) {
      for (const day of calendarDays.value) {
        const rate = getRateForCell(roomType._id, mealPlan._id, day.date)
        const key = `${roomType._id}-${mealPlan._id}-${day.date}`
        inlineEditPrices[key] = rate?.pricePerNight || ''
      }
    }
  }
}

const getInlineEditPrice = (roomTypeId, mealPlanId, date) => {
  const key = `${roomTypeId}-${mealPlanId}-${date}`
  return inlineEditPrices[key]
}

const setInlineEditPrice = (roomTypeId, mealPlanId, date, value) => {
  const key = `${roomTypeId}-${mealPlanId}-${date}`
  inlineEditPrices[key] = value
}

// Handle inline change with relative pricing calculation
const handleInlineChange = (roomTypeId, mealPlanId, date, value) => {
  setInlineEditPrice(roomTypeId, mealPlanId, date, value)

  // If this is the base cell and relative pricing is enabled, calculate others
  if (inlineRelativePricing.value && hasBaseRoom.value && isBaseCellFn(roomTypeId, mealPlanId)) {
    const basePrice = parseFloat(value) || 0
    if (basePrice <= 0) return

    // Calculate for all other room/meal plan combinations for this date
    props.roomTypes.forEach(room => {
      props.mealPlans.forEach(meal => {
        // Skip base cell
        if (isBaseCellFn(room._id, meal._id)) return

        const roomAdj = room.priceAdjustment || 0
        const mealAdj = meal.priceAdjustment || 0

        // Apply adjustments: first room, then meal plan
        const afterRoom = basePrice * (1 + roomAdj / 100)
        const afterMeal = afterRoom * (1 + mealAdj / 100)
        const calculatedPrice = Math.round(afterMeal * 100) / 100

        const key = `${room._id}-${meal._id}-${date}`
        inlineEditPrices[key] = calculatedPrice
      })
    })
  }
}

const saveInlineEditPrices = async () => {
  const updates = []

  for (const [key, price] of Object.entries(inlineEditPrices)) {
    if (price === '' || price === null || price === undefined) continue

    // Key format: roomTypeId-mealPlanId-YYYY-MM-DD
    // MongoDB ObjectIds are 24 character hex strings (no hyphens)
    // So we can safely split: first 24 chars = roomTypeId, next 24 chars (after hyphen) = mealPlanId, rest = date
    const parts = key.split('-')
    const rtId = parts[0] // 24 char ObjectId
    const mpId = parts[1] // 24 char ObjectId
    const dateStr = parts.slice(2).join('-') // YYYY-MM-DD

    const existingRate = getRateForCell(rtId, mpId, dateStr)
    const numPrice = Number(price)

    if (isNaN(numPrice) || numPrice < 0) continue

    if (existingRate) {
      // Only update if price changed
      if (existingRate.pricePerNight !== numPrice) {
        updates.push({
          type: 'update',
          rateId: existingRate._id,
          data: { pricePerNight: numPrice }
        })
      }
    } else if (numPrice > 0) {
      // Create new rate
      updates.push({
        type: 'create',
        data: {
          roomType: rtId,
          mealPlan: mpId,
          market: props.market?._id,
          startDate: dateStr,
          endDate: dateStr,
          pricePerNight: numPrice,
          currency: currency.value
        }
      })
    }
  }

  if (updates.length === 0) {
    return
  }

  try {
    for (const update of updates) {
      if (update.type === 'update') {
        await planningService.quickUpdateRate(props.hotelId, update.rateId, update.data)
      } else {
        await planningService.createRate(props.hotelId, update.data)
      }
    }
    toast.success(t('planning.pricing.inlineEditSaved', { count: updates.length }))
    emit('refresh')
  } catch (error) {
    toast.error(t('common.operationFailed'))
  }
}

const cancelInlineEdit = () => {
  inlineEditMode.value = false
  Object.keys(inlineEditPrices).forEach(key => delete inlineEditPrices[key])
}

const quickAction = async (field, value) => {
  if (selectedCells.value.length === 0) return

  try {
    // Group by rate to minimize API calls
    for (const cell of selectedCells.value) {
      const rate = getRateForCell(cell.roomTypeId, cell.mealPlanId, cell.date)
      if (rate) {
        await planningService.quickUpdateRate(props.hotelId, rate._id, { [field]: value })
      }
    }

    toast.success(t('planning.pricing.quickUpdateSuccess'))
    emit('refresh')
    clearSelection()
  } catch (error) {
    toast.error(t('common.operationFailed'))
  }
}

// Copy/Paste Week Functions
const copyWeek = () => {
  if (selectedCells.value.length === 0) {
    toast.warning(t('planning.pricing.selectCellsToCopy'))
    return
  }

  // Get unique dates and sort them
  const dates = [...new Set(selectedCells.value.map(c => c.date))].sort()

  // Get unique room type / meal plan combinations
  const combinations = []
  const seen = new Set()

  for (const cell of selectedCells.value) {
    const key = `${cell.roomTypeId}-${cell.mealPlanId}`
    if (!seen.has(key)) {
      seen.add(key)
      combinations.push({ roomTypeId: cell.roomTypeId, mealPlanId: cell.mealPlanId })
    }
  }

  // Collect rate data for the selected cells
  const rateData = []
  for (const combo of combinations) {
    for (const date of dates) {
      const rate = getRateForCell(combo.roomTypeId, combo.mealPlanId, date)
      if (rate) {
        rateData.push({
          dayOffset: dates.indexOf(date),
          roomTypeId: combo.roomTypeId,
          mealPlanId: combo.mealPlanId,
          pricePerNight: rate.pricePerNight,
          allotment: rate.allotment,
          minStay: rate.minStay,
          stopSale: rate.stopSale,
          singleStop: rate.singleStop,
          closedToArrival: rate.closedToArrival,
          closedToDeparture: rate.closedToDeparture
        })
      }
    }
  }

  copiedWeek.value = {
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    duration: dates.length,
    combinations,
    rateData
  }

  toast.success(t('planning.pricing.weekCopied'))
}

const pasteWeek = async () => {
  if (!copiedWeek.value) {
    toast.warning(t('planning.pricing.noWeekToPaste'))
    return
  }

  if (selectedCells.value.length === 0) {
    toast.warning(t('planning.pricing.selectTargetCell'))
    return
  }

  // Get the first selected cell as the starting point
  const targetCells = [...selectedCells.value].sort((a, b) => a.date.localeCompare(b.date))
  const targetStartDate = parseDateString(targetCells[0].date)

  try {
    for (const rateInfo of copiedWeek.value.rateData) {
      // Calculate target date based on day offset
      const targetDate = new Date(targetStartDate)
      targetDate.setDate(targetDate.getDate() + rateInfo.dayOffset)
      const targetDateStr = formatDateToString(targetDate)

      // Find if there's an existing rate for this cell
      const existingRate = getRateForCell(rateInfo.roomTypeId, rateInfo.mealPlanId, targetDateStr)

      const rateData = {
        pricePerNight: rateInfo.pricePerNight,
        allotment: rateInfo.allotment,
        minStay: rateInfo.minStay,
        stopSale: rateInfo.stopSale,
        singleStop: rateInfo.singleStop,
        closedToArrival: rateInfo.closedToArrival,
        closedToDeparture: rateInfo.closedToDeparture
      }

      if (existingRate?._id) {
        await planningService.quickUpdateRate(props.hotelId, existingRate._id, rateData)
      } else {
        await planningService.createRate(props.hotelId, {
          ...rateData,
          roomType: rateInfo.roomTypeId,
          mealPlan: rateInfo.mealPlanId,
          market: props.market?._id,
          startDate: targetDateStr,
          endDate: targetDateStr,
          currency: currency.value
        })
      }
    }

    toast.success(t('planning.pricing.weekPasted'))
    emit('refresh')
    clearSelection()
  } catch (error) {
    console.error('Paste week error:', error)
    toast.error(t('common.operationFailed'))
  }
}

// Keyboard shortcuts
const handleKeyDown = (e) => {
  // Ctrl+C or Cmd+C - Copy
  if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !editingCell.value) {
    e.preventDefault()
    copyWeek()
  }

  // Ctrl+V or Cmd+V - Paste
  if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !editingCell.value) {
    e.preventDefault()
    pasteWeek()
  }

  // Escape - Clear selection or close inline edit
  if (e.key === 'Escape') {
    if (editingCell.value) {
      closeInlineEdit()
    } else {
      clearSelection()
    }
  }

  // Delete - Quick stop sale
  if (e.key === 'Delete' && selectedCells.value.length > 0 && !editingCell.value) {
    e.preventDefault()
    quickAction('stopSale', true)
  }
}

// Get max children for a room type
const getMaxChildrenForRoom = (roomTypeId) => {
  const roomType = props.roomTypes.find(rt => rt._id === roomTypeId)
  return roomType?.occupancy?.maxChildren ?? 2
}

const openInlineEdit = async (roomTypeId, mealPlanId, date, rate) => {
  editingCell.value = { roomTypeId, mealPlanId, date, rate }

  const maxChildren = getMaxChildrenForRoom(roomTypeId)

  inlineForm.pricePerNight = rate?.pricePerNight || 0
  inlineForm.allotment = rate?.allotment || 0
  inlineForm.minStay = rate?.minStay || 1
  inlineForm.stopSale = rate?.stopSale || false
  inlineForm.singleStop = rate?.singleStop || false
  inlineForm.closedToArrival = rate?.closedToArrival || false
  inlineForm.closedToDeparture = rate?.closedToDeparture || false
  inlineForm.extraAdult = rate?.extraAdult ?? ''
  inlineForm.extraInfant = rate?.extraInfant ?? ''
  inlineForm.singleSupplement = rate?.singleSupplement ?? ''
  // Pre-populate child pricing array
  inlineForm.childOrderPricing = Array(maxChildren).fill('').map((_, i) => {
    const existing = rate?.childOrderPricing?.[i]
    return typeof existing === 'number' ? existing : ''
  })

  // Position popover near the click - smart positioning to avoid going off-screen
  await nextTick()
  const cellEl = document.querySelector(`[data-cell="${roomTypeId}-${mealPlanId}-${date}"]`)
  if (cellEl) {
    const rect = cellEl.getBoundingClientRect()
    const popoverHeight = 480 // Approximate height of the popover
    const popoverWidth = 300 // Width of the popover
    const margin = 8 // Margin from cell and viewport edges

    // Calculate available space above and below the cell
    const spaceBelow = window.innerHeight - rect.bottom - margin
    const spaceAbove = rect.top - margin

    // Decide whether to show above or below
    let top
    if (spaceBelow >= popoverHeight) {
      // Enough space below - show below the cell
      top = rect.bottom + margin
    } else if (spaceAbove >= popoverHeight) {
      // Not enough space below but enough above - show above the cell
      top = rect.top - popoverHeight - margin
    } else {
      // Not enough space either way - position at top with some offset
      top = Math.max(margin, Math.min(rect.top, window.innerHeight - popoverHeight - margin))
    }

    // Calculate left position - ensure popover stays within viewport
    let left = rect.left
    if (left + popoverWidth > window.innerWidth - margin) {
      left = window.innerWidth - popoverWidth - margin
    }
    if (left < margin) {
      left = margin
    }

    popoverStyle.value = {
      top: `${top}px`,
      left: `${left}px`
    }
  } else {
    popoverStyle.value = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  }
}

const closeInlineEdit = () => {
  editingCell.value = null
}

const saveInlineEdit = async () => {
  if (!editingCell.value) return

  savingInline.value = true
  try {
    const { roomTypeId, mealPlanId, date, rate } = editingCell.value

    const data = {
      roomType: roomTypeId,
      mealPlan: mealPlanId,
      market: props.market?._id,
      startDate: date,
      endDate: date,
      pricePerNight: inlineForm.pricePerNight,
      allotment: inlineForm.allotment,
      minStay: inlineForm.minStay,
      stopSale: inlineForm.stopSale,
      singleStop: inlineForm.singleStop,
      closedToArrival: inlineForm.closedToArrival,
      closedToDeparture: inlineForm.closedToDeparture,
      currency: currency.value
    }

    // Add extra person pricing if set
    if (inlineForm.extraAdult !== '' && inlineForm.extraAdult !== null) {
      data.extraAdult = Number(inlineForm.extraAdult)
    }
    if (inlineForm.extraInfant !== '' && inlineForm.extraInfant !== null) {
      data.extraInfant = Number(inlineForm.extraInfant)
    }
    // Add child pricing - convert empty strings to null
    if (inlineForm.childOrderPricing?.length > 0) {
      data.childOrderPricing = inlineForm.childOrderPricing.map(p =>
        p !== '' && p !== null ? Number(p) : null
      )
    }
    // Add single supplement if set
    if (inlineForm.singleSupplement !== '' && inlineForm.singleSupplement !== null) {
      data.singleSupplement = Number(inlineForm.singleSupplement)
    }

    if (rate?._id) {
      await planningService.updateRate(props.hotelId, rate._id, data)
    } else {
      await planningService.createRate(props.hotelId, data)
    }

    toast.success(t('planning.pricing.rateSaved'))
    closeInlineEdit()
    emit('refresh')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    savingInline.value = false
  }
}

// Click outside to close inline edit
const handleClickOutside = (e) => {
  if (popoverRef.value && !popoverRef.value.contains(e.target)) {
    closeInlineEdit()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})

// Watch for month changes
watch(currentDate, () => {
  clearSelection()
})

// Emit selection change for AI assistant
watch(() => [...selectedCells.value], (newVal) => {
  emit('selection-change', newVal)
})

// Expose clearSelection for parent component (AI assistant)
defineExpose({
  clearSelection
})
</script>

<style scoped>
.calendar-grid-wrapper {
  max-height: calc(100vh - 350px);
}

.calendar-table {
  border-collapse: separate;
  border-spacing: 0;
}

.calendar-table th,
.calendar-table td {
  white-space: nowrap;
}

.calendar-table tbody tr:hover td:not(.sticky) {
  background-color: rgba(147, 51, 234, 0.05);
}

/* Fade transition for clipboard indicator */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
