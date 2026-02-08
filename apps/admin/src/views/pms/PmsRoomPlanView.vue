<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-slate-900">
    <!-- No Hotel Selected Warning -->
    <div
      v-if="!hotelId"
      class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center m-4"
    >
      <span class="material-icons text-4xl text-amber-500 mb-2">domain_disabled</span>
      <p class="font-medium text-amber-800 dark:text-amber-200">{{ $t('pms.noHotelSelected') }}</p>
      <p class="text-sm text-amber-600 dark:text-amber-400 mt-1">
        {{ $t('pms.selectHotelDesc') }}
      </p>
    </div>

    <template v-else>
      <!-- Header -->
      <div
        class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3"
      >
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ t('roomPlan.title') }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ t('roomPlan.subtitle') }}
            </p>
          </div>

          <div class="flex items-center gap-4">
            <!-- Date Navigation -->
            <div class="flex items-center gap-2">
              <button
                class="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                :title="t('roomPlan.weekBack')"
                @click="navigateDays(-7)"
              >
                <span class="material-icons text-gray-600 dark:text-gray-400">chevron_left</span>
              </button>

              <button
                class="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                @click="goToToday"
              >
                {{ t('roomPlan.today') }}
              </button>

              <button
                class="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                :title="t('roomPlan.weekForward')"
                @click="navigateDays(7)"
              >
                <span class="material-icons text-gray-600 dark:text-gray-400">chevron_right</span>
              </button>
            </div>

            <!-- Current Date Range -->
            <div class="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {{ formatDateRange }}
            </div>

            <!-- Zoom Controls -->
            <div
              class="flex items-center border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden"
            >
              <button
                v-for="level in zoomLevels"
                :key="level.name"
                class="px-3 py-1.5 text-sm font-medium transition-colors"
                :class="
                  currentZoom.name === level.name
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                "
                @click="setZoomLevel(level)"
              >
                {{ level.label }}
              </button>
            </div>

            <!-- Refresh -->
            <button
              :disabled="loading"
              class="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              :title="t('common.refresh')"
              @click="fetchData"
            >
              <span
                class="material-icons text-gray-600 dark:text-gray-400"
                :class="{ 'animate-spin': loading }"
                >refresh</span
              >
            </button>
          </div>
        </div>
      </div>

      <!-- Statistics Bar -->
      <div
        class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-2"
      >
        <div class="flex items-center gap-6 text-sm">
          <!-- Group By Toggle -->
          <div
            class="flex items-center border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden"
          >
            <button
              class="px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1"
              :class="
                groupBy === 'type'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
              "
              @click="groupBy = 'type'"
            >
              <span class="material-icons text-sm">category</span>
              {{ t('roomPlan.groupBy.type') }}
            </button>
            <button
              class="px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1"
              :class="
                groupBy === 'floor'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
              "
              @click="groupBy = 'floor'"
            >
              <span class="material-icons text-sm">layers</span>
              {{ t('roomPlan.groupBy.floor') }}
            </button>
          </div>

          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-green-500"></div>
            <span class="text-gray-600 dark:text-gray-400"
              >{{ t('roomPlan.legend.active') }}: {{ statistics.activeStays }}</span
            >
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-blue-500"></div>
            <span class="text-gray-600 dark:text-gray-400"
              >{{ t('roomPlan.legend.reservation') }}: {{ statistics.pendingReservations }}</span
            >
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-amber-400 ring-2 ring-amber-300"></div>
            <span class="text-gray-600 dark:text-gray-400">{{ t('roomPlan.legend.vip') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-red-500"></div>
            <span class="text-gray-600 dark:text-gray-400">{{
              t('roomPlan.legend.paymentPending')
            }}</span>
          </div>
          <div class="ml-auto text-gray-500 dark:text-slate-400">
            {{ t('roomPlan.legend.totalRooms') }}: {{ statistics.totalRooms }}
          </div>
        </div>
      </div>

      <!-- Timeline Container -->
      <div class="flex-1 overflow-hidden flex">
        <!-- Room Labels (Fixed Left Column) -->
        <div
          class="w-48 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 z-10"
        >
          <!-- Header spacer -->
          <div
            class="h-16 border-b border-gray-200 dark:border-slate-700 flex items-center justify-center"
          >
            <span class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">{{
              t('roomPlan.rooms')
            }}</span>
          </div>

          <!-- Room labels -->
          <div ref="roomLabelsRef" class="overflow-y-auto" :style="{ height: 'calc(100% - 64px)' }">
            <div
              v-for="group in roomTypeGroups"
              :key="group.roomTypeId"
              class="border-b border-gray-100 dark:border-slate-700"
            >
              <!-- Room Type header (collapsible) -->
              <div
                class="px-3 py-2 bg-gray-50 dark:bg-slate-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 sticky top-0 z-10"
                @click="toggleGroup(group.roomTypeId)"
              >
                <span
                  class="material-icons text-gray-500 dark:text-slate-400 text-sm transition-transform"
                  :class="{ '-rotate-90': collapsedGroups.has(group.roomTypeId) }"
                >
                  expand_more
                </span>
                <span
                  class="text-xs font-semibold text-gray-600 dark:text-slate-300 truncate flex-1"
                >
                  {{ group.roomTypeName }}
                </span>
              </div>

              <!-- Room rows -->
              <template v-if="!collapsedGroups.has(group.roomTypeId)">
                <div
                  v-for="room in group.rooms"
                  :key="room._id"
                  class="h-10 px-3 flex items-center border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <!-- Room status indicator with tooltip -->
                    <span
                      class="w-4 h-4 rounded flex-shrink-0 cursor-help"
                      :class="getRoomStatusColor(room)"
                      :title="getRoomStatusTooltip(room)"
                    ></span>
                    <span class="font-medium text-gray-900 dark:text-white text-sm">{{
                      room.roomNumber
                    }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Timeline Grid (Scrollable) -->
        <div ref="timelineRef" class="flex-1 overflow-auto" @scroll="handleScroll">
          <!-- Date Header -->
          <div
            class="sticky top-0 bg-white dark:bg-slate-800 z-10 border-b border-gray-200 dark:border-slate-700"
          >
            <!-- Month row -->
            <div class="h-6 flex border-b border-gray-100 dark:border-slate-700/50">
              <div
                v-for="monthGroup in monthGroups"
                :key="`month-${monthGroup.month}-${monthGroup.year}`"
                class="flex-shrink-0 px-2 flex items-center text-xs font-medium text-gray-500 dark:text-slate-400"
                :style="{ width: `${monthGroup.days * currentZoom.cellWidth}px` }"
              >
                {{ getMonthName(monthGroup.month) }} {{ monthGroup.year }}
              </div>
            </div>

            <!-- Day row -->
            <div class="h-10 flex">
              <div
                v-for="(day, index) in dateHeaders"
                :key="index"
                class="flex-shrink-0 flex flex-col items-center justify-center text-xs border-r border-gray-100 dark:border-slate-700/50"
                :class="{
                  'bg-indigo-50 dark:bg-indigo-900/20': day.isToday,
                  'bg-gray-50 dark:bg-slate-700/30': day.isWeekend && !day.isToday
                }"
                :style="{ width: `${currentZoom.cellWidth}px` }"
              >
                <span
                  class="font-medium"
                  :class="
                    day.isToday
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300'
                  "
                >
                  {{ day.dayOfMonth }}
                </span>
                <span class="text-gray-400 dark:text-slate-500">{{
                  getDayName(day.dayOfWeek)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Room Type Groups with Rooms -->
          <div>
            <div v-for="group in roomTypeGroups" :key="group.roomTypeId">
              <!-- Room Type header row with availability counters -->
              <div
                class="h-8 flex bg-gray-50 dark:bg-slate-700/50"
                :style="{ width: `${dateHeaders.length * currentZoom.cellWidth}px` }"
              >
                <div
                  v-for="(day, dayIndex) in dateHeaders"
                  :key="dayIndex"
                  class="flex-shrink-0 flex items-center justify-center text-xs border-r border-gray-100 dark:border-slate-700/50"
                  :class="{
                    'bg-indigo-50/50 dark:bg-indigo-900/10': day.isToday
                  }"
                  :style="{ width: `${currentZoom.cellWidth}px` }"
                >
                  <span class="text-xs font-medium" :class="getAvailabilityColor(group, day.date)">
                    {{ getAvailabilityText(group, day.date) }}
                  </span>
                </div>
              </div>

              <!-- Room rows -->
              <template v-if="!collapsedGroups.has(group.roomTypeId)">
                <div
                  v-for="room in group.rooms"
                  :key="room._id"
                  class="h-10 relative border-b border-gray-100 dark:border-slate-700/50 transition-colors"
                  :class="{
                    'bg-indigo-100/50 dark:bg-indigo-900/30 ring-2 ring-inset ring-indigo-400':
                      dropTarget?.roomId === room._id,
                    'bg-red-100/50 dark:bg-red-900/30':
                      dropTarget?.roomId === room._id && !dropTarget?.isAvailable
                  }"
                  :style="{ width: `${dateHeaders.length * currentZoom.cellWidth}px` }"
                  @click="handleCellClick($event, room)"
                  @dragover="handleDragOver($event, room)"
                  @dragleave="handleDragLeave"
                  @drop="handleDrop($event, room)"
                >
                  <!-- Grid lines (for each day) -->
                  <div class="absolute inset-0 flex pointer-events-none">
                    <div
                      v-for="(day, index) in dateHeaders"
                      :key="index"
                      class="flex-shrink-0 border-r border-gray-100 dark:border-slate-700/30 h-full"
                      :class="{
                        'bg-indigo-50/50 dark:bg-indigo-900/10': day.isToday,
                        'bg-gray-50/50 dark:bg-slate-700/10': day.isWeekend && !day.isToday
                      }"
                      :style="{ width: `${currentZoom.cellWidth}px` }"
                    ></div>
                  </div>

                  <!-- Stay/Reservation bars (parallelogram style) -->
                  <div
                    v-for="stay in room.stays"
                    :key="stay._id"
                    class="absolute top-1 h-8 cursor-pointer transition-all hover:z-20 flex items-center overflow-hidden room-bar"
                    :class="[
                      getBarColorClass(stay),
                      { 'opacity-50': draggingStay && draggingStay._id !== stay._id }
                    ]"
                    :style="getBarStyle(stay)"
                    :title="`${stay.guestName} (${formatDate(stay.checkInDate)} - ${formatDate(stay.checkOutDate)})`"
                    :draggable="stay.type === 'stay'"
                    @dragstart="handleDragStart($event, stay, room)"
                    @dragend="handleDragEnd"
                    @click.stop="showStayDetails(stay)"
                  >
                    <!-- Guest name -->
                    <span class="text-xs font-medium text-white truncate px-2 relative z-10">
                      {{ stay.guestName }}
                    </span>

                    <!-- VIP indicator dot -->
                    <span
                      v-if="stay.isVip"
                      class="absolute top-0 right-1 w-2 h-2 bg-black rounded-full"
                    ></span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Stay Details Modal -->
      <div
        v-if="selectedStay"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="selectedStay = null"
      >
        <div class="flex items-center justify-center min-h-screen px-4">
          <div class="fixed inset-0 bg-black/30" @click="selectedStay = null"></div>
          <div class="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-5">
            <!-- Header -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center"
                  :class="
                    selectedStay.type === 'reservation'
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'bg-green-100 dark:bg-green-900/30'
                  "
                >
                  <span
                    class="material-icons text-xl"
                    :class="
                      selectedStay.type === 'reservation'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-green-600 dark:text-green-400'
                    "
                  >
                    {{ selectedStay.type === 'reservation' ? 'event' : 'hotel' }}
                  </span>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-semibold text-gray-900 dark:text-white text-lg">
                      {{ selectedStay.guestName }}
                    </h3>
                    <span
                      v-if="selectedStay.isVip"
                      class="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full flex items-center gap-1"
                    >
                      <span class="material-icons text-xs">star</span>
                      VIP{{ selectedStay.vipLevel ? ` ${selectedStay.vipLevel}` : '' }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-slate-400">
                    {{ selectedStay.stayNumber || selectedStay.bookingNumber }}
                  </p>
                </div>
              </div>
              <button
                class="p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                @click="selectedStay = null"
              >
                <span class="material-icons">close</span>
              </button>
            </div>

            <!-- Status Badge -->
            <div class="mb-4">
              <span
                class="px-3 py-1 rounded-full text-sm font-medium"
                :class="getStayStatusClasses(selectedStay)"
              >
                {{ getStayStatusLabel(selectedStay) }}
              </span>
            </div>

            <!-- Details Grid -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <!-- Check-in -->
              <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                <div class="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-xs mb-1">
                  <span class="material-icons text-sm">login</span>
                  {{ t('roomPlan.modal.checkIn') }}
                </div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ formatDate(selectedStay.checkInDate, 'long') }}
                </p>
                <p
                  v-if="selectedStay.actualCheckIn"
                  class="text-xs text-green-600 dark:text-green-400 mt-1"
                >
                  {{ t('roomPlan.modal.actual') }}: {{ formatTime(selectedStay.actualCheckIn) }}
                </p>
              </div>

              <!-- Check-out -->
              <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                <div class="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-xs mb-1">
                  <span class="material-icons text-sm">logout</span>
                  {{ t('roomPlan.modal.checkOut') }}
                </div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ formatDate(selectedStay.checkOutDate, 'long') }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {{ calculateStayNights(selectedStay) }} {{ t('roomPlan.nights') }}
                </p>
              </div>
            </div>

            <!-- Additional Info -->
            <div class="space-y-3 border-t border-gray-200 dark:border-slate-700 pt-4 mb-4">
              <!-- Payment Status -->
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-slate-400 flex items-center gap-2">
                  <span class="material-icons text-sm">payments</span>
                  {{ t('roomPlan.modal.paymentStatus') }}
                </span>
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="getPaymentStatusClasses(selectedStay.paymentStatus)"
                >
                  {{ getPaymentStatusLabel(selectedStay.paymentStatus) }}
                </span>
              </div>

              <!-- Room (if available) -->
              <div v-if="selectedStayRoom" class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-slate-400 flex items-center gap-2">
                  <span class="material-icons text-sm">meeting_room</span>
                  {{ t('roomPlan.modal.room') }}
                </span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ selectedStayRoom.roomNumber }}
                  <span v-if="selectedStayRoom.roomType" class="text-gray-500 dark:text-slate-400">
                    ({{ selectedStayRoom.roomType?.code || selectedStayRoom.roomType?.name }})
                  </span>
                </span>
              </div>

              <!-- Status -->
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-slate-400 flex items-center gap-2">
                  <span class="material-icons text-sm">info</span>
                  {{ t('roomPlan.modal.stayType') }}
                </span>
                <span class="text-gray-900 dark:text-white">
                  {{
                    selectedStay.type === 'reservation'
                      ? t('roomPlan.status.reservation')
                      : t('roomPlan.status.activeStay')
                  }}
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <button
                v-if="selectedStay.type === 'stay'"
                class="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                @click="navigateToStay(selectedStay)"
              >
                <span class="material-icons text-sm">open_in_new</span>
                {{ t('roomPlan.modal.goToDetails') }}
              </button>
              <button
                v-if="selectedStay.type === 'reservation'"
                class="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                @click="navigateToCheckIn(selectedStay)"
              >
                <span class="material-icons text-sm">login</span>
                {{ t('roomPlan.modal.doCheckIn') }}
              </button>
              <button
                class="px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                @click="selectedStay = null"
              >
                {{ t('common.close') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Move Confirmation Modal -->
      <div
        v-if="moveConfirmation"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="cancelMove"
      >
        <div class="flex items-center justify-center min-h-screen px-4">
          <div class="fixed inset-0 bg-black/30" @click="cancelMove"></div>
          <div class="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-5">
            <div class="flex items-center gap-3 mb-4">
              <div
                class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"
              >
                <span class="material-icons text-indigo-600 dark:text-indigo-400">swap_horiz</span>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  {{ t('roomPlan.move.title') }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ moveConfirmation.stay?.guestName }}
                </p>
              </div>
            </div>

            <div class="space-y-3 mb-4">
              <div class="flex items-center gap-3 text-sm">
                <div class="flex-1 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div class="text-gray-500 dark:text-slate-400 text-xs mb-1">
                    {{ t('roomPlan.move.currentRoom') }}
                  </div>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ moveConfirmation.sourceRoom?.roomNumber }}
                  </div>
                </div>
                <span class="material-icons text-gray-400">arrow_forward</span>
                <div class="flex-1 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div class="text-indigo-600 dark:text-indigo-400 text-xs mb-1">
                    {{ t('roomPlan.move.targetRoom') }}
                  </div>
                  <div class="font-medium text-indigo-700 dark:text-indigo-300">
                    {{ moveConfirmation.targetRoom?.roomNumber }}
                  </div>
                </div>
              </div>

              <div v-if="moveConfirmation.newCheckIn" class="flex items-center gap-3 text-sm">
                <div class="flex-1 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div class="text-gray-500 dark:text-slate-400 text-xs mb-1">
                    {{ t('roomPlan.move.currentDate') }}
                  </div>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ formatDate(moveConfirmation.stay.checkInDate, 'short') }} -
                    {{ formatDate(moveConfirmation.stay.checkOutDate, 'short') }}
                  </div>
                </div>
                <span class="material-icons text-gray-400">arrow_forward</span>
                <div class="flex-1 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div class="text-indigo-600 dark:text-indigo-400 text-xs mb-1">
                    {{ t('roomPlan.move.newDate') }}
                  </div>
                  <div class="font-medium text-indigo-700 dark:text-indigo-300">
                    {{ formatDate(moveConfirmation.newCheckIn, 'short') }} -
                    {{ formatDate(moveConfirmation.newCheckOut, 'short') }}
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
                t('roomPlan.move.reasonLabel')
              }}</label>
              <input
                v-model="moveReason"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                :placeholder="t('roomPlan.move.reasonPlaceholder')"
              />
            </div>

            <div class="flex gap-3">
              <button
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                @click="cancelMove"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                :disabled="moveLoading"
                class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                @click="confirmMove"
              >
                <span v-if="moveLoading" class="material-icons animate-spin text-sm">refresh</span>
                {{ moveLoading ? t('roomPlan.move.moving') : t('common.confirm') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- StayCard Modal -->
      <StayCard
        v-if="stayCardStayId"
        v-model="stayCardOpen"
        :stay-id="stayCardStayId"
        :hotel-id="hotelId"
        size="lg"
        @close="handleStayCardClose"
        @updated="handleStayCardUpdated"
        @check-out="handleStayCardCheckOut"
        @change-room="
          () => {
            handleStayCardClose()
            fetchData()
          }
        "
        @extend-stay="
          () => {
            handleStayCardClose()
            fetchData()
          }
        "
      />

      <!-- CheckOut Modal -->
      <CheckOutModal
        v-model="showCheckOutModal"
        :hotel-id="hotelId"
        :stay="checkOutStay"
        @completed="handleCheckOutCompleted"
      />

      <!-- Loading Overlay -->
      <div
        v-if="loading && !roomTypeGroups.length"
        class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80"
      >
        <div class="text-center">
          <span class="material-icons animate-spin text-4xl text-indigo-500">refresh</span>
          <p class="mt-2 text-gray-500 dark:text-slate-400">{{ t('common.loading') }}</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { usePmsStore } from '@/stores/pms'
import { usePmsSocket } from '@/composables/usePmsSocket'
import * as roomPlanService from '@/services/pms/roomPlanService'
import StayCard from '@/components/pms/stay/StayCard.vue'
import CheckOutModal from '@/components/pms/frontdesk/CheckOutModal.vue'

const router = useRouter()
const { t, locale } = useI18n()
const toast = useToast()
const pmsStore = usePmsStore()
const hotelId = computed(() => pmsStore.hotelId)

// Locale mapping for Intl API
const localeMap = { tr: 'tr-TR', en: 'en-US' }

// State
const loading = ref(false)
const floors = ref([])
const statistics = ref({ totalRooms: 0, activeStays: 0, pendingReservations: 0 })

// Group by state: 'type' or 'floor'
const groupBy = ref('type')

// Collapsed groups state
const collapsedGroups = ref(new Set())

// View state
const viewStartDate = ref(new Date())
const currentZoom = ref(roomPlanService.ZOOM_LEVELS.DAY)
const zoomLevels = Object.values(roomPlanService.ZOOM_LEVELS)

// Selection
const selectedStay = ref(null)

// StayCard modal
const stayCardOpen = ref(false)
const stayCardStayId = ref(null)

// CheckOut modal
const showCheckOutModal = ref(false)
const checkOutStay = ref(null)

// Drag state
const draggingStay = ref(null)
const dragSourceRoom = ref(null)
const dropTarget = ref(null)

// Move confirmation
const moveConfirmation = ref(null)
const moveReason = ref('')
const moveLoading = ref(false)

// Refs
const timelineRef = ref(null)
const roomLabelsRef = ref(null)

// Helper to get string from multilang field
const getLocalizedName = field => {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (typeof field === 'object') {
    // Try common locale keys
    return field.tr || field.en || field.default || Object.values(field)[0] || ''
  }
  return String(field)
}

// Transform floor-based data to groups (by type or floor)
const roomTypeGroups = computed(() => {
  const groupMap = new Map()

  if (groupBy.value === 'floor') {
    // Group by floor
    for (const floor of floors.value) {
      const floorNum = floor.floor
      const groupId = `floor-${floorNum}`

      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          roomTypeId: groupId,
          roomTypeName: t('roomPlan.floorLabel', { floor: floorNum }),
          roomTypeCode: `K${floorNum}`,
          floor: floorNum,
          rooms: []
        })
      }

      for (const room of floor.rooms) {
        groupMap.get(groupId).rooms.push(room)
      }
    }

    // Sort groups by floor number and rooms by roomNumber
    const groups = Array.from(groupMap.values())
    groups.sort((a, b) => a.floor - b.floor)
    groups.forEach(g =>
      g.rooms.sort((a, b) => String(a.roomNumber || '').localeCompare(String(b.roomNumber || '')))
    )

    return groups
  } else {
    // Group by room type (default)
    for (const floor of floors.value) {
      for (const room of floor.rooms) {
        const roomTypeId = room.roomType?._id || 'unknown'
        const roomTypeName = getLocalizedName(room.roomType?.name) || t('roomPlan.other')

        if (!groupMap.has(roomTypeId)) {
          groupMap.set(roomTypeId, {
            roomTypeId,
            roomTypeName,
            roomTypeCode: room.roomType?.code || '',
            rooms: []
          })
        }

        groupMap.get(roomTypeId).rooms.push(room)
      }
    }

    // Sort groups by name and rooms by roomNumber
    const groups = Array.from(groupMap.values())
    groups.sort((a, b) => String(a.roomTypeName).localeCompare(String(b.roomTypeName)))
    groups.forEach(g =>
      g.rooms.sort((a, b) => String(a.roomNumber || '').localeCompare(String(b.roomNumber || '')))
    )

    return groups
  }
})

// Computed
const dateHeaders = computed(() => {
  return roomPlanService.generateDateArray(viewStartDate.value, currentZoom.value.daysVisible)
})

const monthGroups = computed(() => {
  const groups = []
  let currentMonth = null

  for (const day of dateHeaders.value) {
    if (!currentMonth || currentMonth.month !== day.month || currentMonth.year !== day.year) {
      currentMonth = { month: day.month, year: day.year, days: 1 }
      groups.push(currentMonth)
    } else {
      currentMonth.days++
    }
  }

  return groups
})

const formatDateRange = computed(() => {
  const start = viewStartDate.value
  const end = new Date(start)
  end.setDate(end.getDate() + currentZoom.value.daysVisible - 1)

  return `${roomPlanService.formatDate(start, 'short')} - ${roomPlanService.formatDate(end, 'short')}`
})

// Methods
const fetchData = async () => {
  if (!hotelId.value) return

  loading.value = true
  try {
    const endDate = new Date(viewStartDate.value)
    endDate.setDate(endDate.getDate() + currentZoom.value.daysVisible)

    const response = await roomPlanService.getRoomsWithOccupancy(hotelId.value, {
      start: viewStartDate.value.toISOString(),
      end: endDate.toISOString()
    })

    floors.value = response.data?.floors || []
    statistics.value = response.data?.statistics || {
      totalRooms: 0,
      activeStays: 0,
      pendingReservations: 0
    }
  } catch (error) {
    console.error('Failed to fetch room plan:', error)
    toast.error(t('roomPlan.errors.loadFailed'))
  } finally {
    loading.value = false
  }
}

const toggleGroup = groupId => {
  if (collapsedGroups.value.has(groupId)) {
    collapsedGroups.value.delete(groupId)
  } else {
    collapsedGroups.value.add(groupId)
  }
  // Trigger reactivity
  collapsedGroups.value = new Set(collapsedGroups.value)
}

const navigateDays = days => {
  const newDate = new Date(viewStartDate.value)
  newDate.setDate(newDate.getDate() + days)
  viewStartDate.value = newDate
}

const goToToday = () => {
  const today = new Date()
  today.setDate(today.getDate() - 3) // Start 3 days before today for context
  viewStartDate.value = today
}

const setZoomLevel = level => {
  currentZoom.value = level
}

const handleScroll = () => {
  // Sync room labels scroll with timeline scroll
  if (timelineRef.value && roomLabelsRef.value) {
    roomLabelsRef.value.scrollTop = timelineRef.value.scrollTop
  }
}

const getBarColorClass = item => {
  // Color logic for stay bars:
  // 1. Blue = Reservation (not checked in yet)
  // 2. Red = Payment pending/unpaid (priority warning)
  // 3. Amber = VIP guest (special attention)
  // 4. Green = Normal active stay (all OK)

  if (item.type === 'reservation') {
    return 'bar-blue' // Blue for reservations
  }

  // Payment status takes priority as a warning indicator
  if (item.paymentStatus === 'pending' || item.paymentStatus === 'unpaid') {
    return 'bar-red' // Red for payment issues
  }

  if (item.paymentStatus === 'partial') {
    return 'bar-amber' // Amber for partial payment
  }

  // VIP shown with amber only if payment is OK
  if (item.isVip) {
    return 'bar-vip' // Special VIP style (gold)
  }

  return 'bar-green' // Green for normal active stays
}

// Get bar style with half-day positioning and parallelogram shape
const getBarStyle = stay => {
  const checkIn = new Date(stay.checkInDate)
  const checkOut = new Date(stay.checkOutDate)
  const startDate = new Date(viewStartDate.value)
  startDate.setHours(0, 0, 0, 0)

  // Calculate days from view start
  const checkInDays = Math.floor((checkIn - startDate) / (1000 * 60 * 60 * 24))
  const checkOutDays = Math.floor((checkOut - startDate) / (1000 * 60 * 60 * 24))

  const cellWidth = currentZoom.value.cellWidth

  // Half-day positioning: start at 50% of check-in cell, end at 50% of check-out cell
  const left = checkInDays * cellWidth + cellWidth / 2
  const right = checkOutDays * cellWidth + cellWidth / 2
  const width = right - left

  return {
    left: `${left}px`,
    width: `${Math.max(width, 20)}px`
  }
}

const getRoomStatusColor = room => {
  // Room status colors matching Housekeeping module (roomService.js)
  // Priority: room status first, then housekeeping status

  // Room status based colors (matching ROOM_STATUS_INFO)
  if (room.status === 'occupied') {
    return 'bg-blue-500' // Blue for occupied (matches Housekeeping)
  }
  if (room.status === 'checkout') {
    return 'bg-orange-500' // Orange for checkout
  }
  if (room.status === 'maintenance') {
    return 'bg-purple-500' // Purple for maintenance (matches Housekeeping)
  }
  if (room.status === 'out_of_order') {
    return 'bg-red-500' // Red for out of order
  }
  if (room.status === 'inspected') {
    return 'bg-teal-500' // Teal for inspected
  }

  // For vacant rooms, check housekeeping status (matching HOUSEKEEPING_STATUS_INFO)
  if (room.housekeepingStatus === 'dirty') {
    return 'bg-amber-500' // Amber/yellow for dirty
  }
  if (room.housekeepingStatus === 'cleaning') {
    return 'bg-blue-400' // Light blue for cleaning in progress
  }
  if (room.housekeepingStatus === 'inspected') {
    return 'bg-teal-400' // Teal for inspected
  }

  // Default: clean/available = green (matches Housekeeping's vacant_clean)
  return 'bg-green-500'
}

// Get room status tooltip text
const getRoomStatusTooltip = room => {
  // Build tooltip
  let tooltip = `${t('roomPlan.modal.room')} ${room.roomNumber}\n`

  // Room status
  if (room.status) {
    tooltip += `${t('roomPlan.tooltip.status')}: ${t(`roomPlan.roomStatus.${room.status}`)}\n`
  }

  // Housekeeping status
  if (room.housekeepingStatus) {
    tooltip += `${t('roomPlan.tooltip.housekeeping')}: ${t(`roomPlan.housekeepingStatus.${room.housekeepingStatus}`)}`
  }

  return tooltip.trim()
}

// Calculate availability for a room type on a specific date
const getAvailability = (group, date) => {
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  let occupied = 0
  const total = group.rooms.length

  for (const room of group.rooms) {
    for (const stay of room.stays || []) {
      const checkIn = new Date(stay.checkInDate)
      const checkOut = new Date(stay.checkOutDate)
      checkIn.setHours(0, 0, 0, 0)
      checkOut.setHours(0, 0, 0, 0)

      // Room is occupied if date is between check-in (inclusive) and check-out (exclusive)
      if (targetDate >= checkIn && targetDate < checkOut) {
        occupied++
        break
      }
    }
  }

  return { occupied, total, available: total - occupied }
}

const getAvailabilityText = (group, date) => {
  const { occupied, total } = getAvailability(group, date)
  return `${occupied}/${total}`
}

const getAvailabilityColor = (group, date) => {
  const { occupied, total } = getAvailability(group, date)
  const ratio = occupied / total

  if (ratio >= 1) return 'text-red-600 dark:text-red-400' // Full
  if (ratio >= 0.8) return 'text-amber-600 dark:text-amber-400' // Almost full
  if (ratio >= 0.5) return 'text-yellow-600 dark:text-yellow-400' // Half full
  return 'text-green-600 dark:text-green-400' // Mostly available
}

const getMonthName = month => {
  return roomPlanService.getMonthName(month)
}

const getDayName = dayOfWeek => {
  return roomPlanService.getDayName(dayOfWeek)
}

const formatDate = (date, format = 'short') => {
  return roomPlanService.formatDate(date, format)
}

const showStayDetails = stay => {
  if (stay.type === 'stay' && stay._id) {
    // Open StayCard modal for active stays
    stayCardStayId.value = stay._id
    stayCardOpen.value = true
  } else {
    // Show basic modal for reservations
    selectedStay.value = stay
  }
}

// StayCard event handlers
const handleStayCardClose = () => {
  stayCardOpen.value = false
  stayCardStayId.value = null
}

const handleStayCardUpdated = updatedStay => {
  // Refresh room plan data to reflect changes
  fetchData()
}

const handleStayCardCheckOut = stay => {
  // Open CheckOutModal (keep StayCard open)
  checkOutStay.value = stay
  showCheckOutModal.value = true
}

const handleCheckOutCompleted = () => {
  handleStayCardClose()
  fetchData()
}

const navigateToStay = stay => {
  // Navigate to front desk or reservation detail
  if (stay.type === 'stay') {
    router.push({ name: 'pms-front-desk' })
  } else {
    router.push({ name: 'pms-reservations' })
  }
  selectedStay.value = null
}

const navigateToCheckIn = stay => {
  // Navigate to front desk for check-in
  router.push({ name: 'pms-front-desk' })
  selectedStay.value = null
}

// Calculate nights for stay
const calculateStayNights = stay => {
  if (!stay?.checkInDate || !stay?.checkOutDate) return 0
  const checkIn = new Date(stay.checkInDate)
  const checkOut = new Date(stay.checkOutDate)
  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
}

// Format time
const formatTime = dateStr => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString(localeMap[locale.value] || 'tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get stay status classes
const getStayStatusClasses = stay => {
  if (!stay) return 'bg-gray-100 text-gray-700'

  if (stay.type === 'reservation') {
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
  }

  switch (stay.status) {
    case 'checked_in':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    case 'checked_out':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    case 'cancelled':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    default:
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
  }
}

// Get stay status label
const getStayStatusLabel = stay => {
  if (!stay) return '-'

  if (stay.type === 'reservation') {
    return t('roomPlan.status.reservation')
  }

  switch (stay.status) {
    case 'checked_in':
      return t('roomPlan.status.activeStay')
    case 'checked_out':
      return t('roomPlan.status.checkedOut')
    case 'cancelled':
      return t('roomPlan.status.cancelled')
    case 'pending':
      return t('roomPlan.status.pending')
    default:
      return stay.status || t('roomPlan.status.unknown')
  }
}

// Get payment status classes
const getPaymentStatusClasses = status => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    case 'partial':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
    case 'pending':
    case 'unpaid':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
  }
}

// Get payment status label
const getPaymentStatusLabel = status => {
  switch (status) {
    case 'paid':
      return t('roomPlan.paymentStatus.paid')
    case 'partial':
      return t('roomPlan.paymentStatus.partial')
    case 'pending':
      return t('roomPlan.paymentStatus.pending')
    case 'unpaid':
      return t('roomPlan.paymentStatus.unpaid')
    default:
      return status || t('roomPlan.paymentStatus.unknown')
  }
}

// Get room for selected stay
const selectedStayRoom = computed(() => {
  if (!selectedStay.value) return null

  // Find the room that contains this stay
  for (const floor of floors.value) {
    const room = floor.rooms.find(r => r.stays?.some(s => s._id === selectedStay.value._id))
    if (room) return room
  }
  return null
})

const handleCellClick = (event, room) => {
  // Calculate clicked date from x position
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left + (timelineRef.value?.scrollLeft || 0)
  const clickedDate = roomPlanService.pixelToDate(
    x,
    viewStartDate.value,
    currentZoom.value.cellWidth
  )

  console.log('Clicked:', room.roomNumber, 'Date:', clickedDate)
  // TODO: Open new reservation modal with pre-filled room and date
}

// Drag handlers
const handleDragStart = (event, stay, room) => {
  if (stay.type !== 'stay') {
    event.preventDefault()
    return
  }

  draggingStay.value = stay
  dragSourceRoom.value = room
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', stay._id)

  // Set drag image
  event.dataTransfer.setDragImage(event.target, 10, 10)
}

const handleDragEnd = () => {
  draggingStay.value = null
  dragSourceRoom.value = null
  dropTarget.value = null
}

const handleDragOver = async (event, room) => {
  if (!draggingStay.value) return

  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'

  // Calculate the date from mouse position
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const dropDate = roomPlanService.pixelToDate(x, viewStartDate.value, currentZoom.value.cellWidth)

  // Check if target room is different or date is different
  const isSameRoom = room._id === dragSourceRoom.value?._id
  const stay = draggingStay.value
  const originalCheckIn = new Date(stay.checkInDate)
  originalCheckIn.setHours(0, 0, 0, 0)
  dropDate.setHours(0, 0, 0, 0)
  const isSameDate = dropDate.getTime() === originalCheckIn.getTime()

  if (isSameRoom && isSameDate) {
    dropTarget.value = null
    return
  }

  // Calculate new checkout based on original stay duration
  const stayDuration = Math.ceil(
    (new Date(stay.checkOutDate) - new Date(stay.checkInDate)) / (1000 * 60 * 60 * 24)
  )
  const newCheckOut = new Date(dropDate)
  newCheckOut.setDate(newCheckOut.getDate() + stayDuration)

  // Check availability (debounced)
  let isAvailable = true
  if (!isSameRoom) {
    // Quick client-side check for conflicts
    const conflicts = room.stays?.filter(s => {
      if (s._id === stay._id) return false
      const existingIn = new Date(s.checkInDate)
      const existingOut = new Date(s.checkOutDate)
      return dropDate < existingOut && newCheckOut > existingIn
    })
    isAvailable = !conflicts?.length
  }

  dropTarget.value = {
    roomId: room._id,
    room,
    date: dropDate,
    newCheckOut,
    isAvailable
  }
}

const handleDragLeave = event => {
  // Only clear if leaving the room row entirely
  if (!event.currentTarget.contains(event.relatedTarget)) {
    dropTarget.value = null
  }
}

const handleDrop = async event => {
  event.preventDefault()

  if (!draggingStay.value || !dropTarget.value) {
    handleDragEnd()
    return
  }

  if (!dropTarget.value.isAvailable) {
    toast.warning(t('roomPlan.errors.roomNotAvailable'))
    handleDragEnd()
    return
  }

  const stay = draggingStay.value
  const sourceRoom = dragSourceRoom.value
  const targetRoom = dropTarget.value.room
  const newCheckIn = dropTarget.value.date
  const newCheckOut = dropTarget.value.newCheckOut

  // Check if anything changed
  const isSameRoom = sourceRoom._id === targetRoom._id
  const originalCheckIn = new Date(stay.checkInDate)
  originalCheckIn.setHours(0, 0, 0, 0)
  newCheckIn.setHours(0, 0, 0, 0)
  const isSameDate = originalCheckIn.getTime() === newCheckIn.getTime()

  if (isSameRoom && isSameDate) {
    handleDragEnd()
    return
  }

  // Show confirmation modal
  moveConfirmation.value = {
    stay,
    sourceRoom,
    targetRoom,
    newCheckIn: !isSameDate ? newCheckIn : null,
    newCheckOut: !isSameDate ? newCheckOut : null,
    isSameRoom
  }
  moveReason.value = ''

  handleDragEnd()
}

const cancelMove = () => {
  moveConfirmation.value = null
  moveReason.value = ''
}

const confirmMove = async () => {
  if (!moveConfirmation.value) return

  moveLoading.value = true

  try {
    const { stay, targetRoom, newCheckIn, newCheckOut, isSameRoom } = moveConfirmation.value

    if (isSameRoom && newCheckIn) {
      // Only date change - use changeStayDates
      await roomPlanService.changeStayDates(hotelId.value, stay._id, {
        newCheckIn: newCheckIn.toISOString(),
        newCheckOut: newCheckOut.toISOString(),
        reason: moveReason.value || t('roomPlan.move.defaultDateReason')
      })
      toast.success(t('roomPlan.messages.datesUpdated'))
    } else {
      // Room change (with optional date change) - use moveStayToRoom
      const data = {
        newRoomId: targetRoom._id,
        reason: moveReason.value || t('roomPlan.move.defaultMoveReason')
      }

      if (newCheckIn) {
        data.newCheckIn = newCheckIn.toISOString()
        data.newCheckOut = newCheckOut.toISOString()
      }

      await roomPlanService.moveStayToRoom(hotelId.value, stay._id, data)
      toast.success(t('roomPlan.messages.movedToRoom', { room: targetRoom.roomNumber }))
    }

    // Refresh data
    await fetchData()

    cancelMove()
  } catch (error) {
    console.error('Move failed:', error)
    const message = error.response?.data?.message || t('roomPlan.errors.moveFailed')
    toast.error(message)

    // Show conflict details if available
    if (error.response?.data?.conflict) {
      const conflict = error.response.data.conflict
      toast.warning(t('roomPlan.errors.conflictingStay', { stayNumber: conflict.stayNumber }))
    }
  } finally {
    moveLoading.value = false
  }
}

// Real-time socket updates
usePmsSocket(hotelId, {
  onCheckIn: () => fetchData(),
  onCheckOut: () => fetchData(),
  onRoomStatus: data => updateRoomStatus(data),
  onReservation: () => fetchData(),
  onStayUpdated: () => fetchData(),
  onHousekeeping: data => updateHousekeepingStatus(data)
})

// Update room status locally (optimistic update)
const updateRoomStatus = data => {
  if (!data.roomId) return

  for (const floor of floors.value) {
    const room = floor.rooms.find(r => r._id === data.roomId)
    if (room) {
      if (data.newStatus) room.status = data.newStatus
      if (data.housekeepingStatus) room.housekeepingStatus = data.housekeepingStatus
      break
    }
  }
}

// Update housekeeping status locally
const updateHousekeepingStatus = data => {
  if (!data.roomId) return

  for (const floor of floors.value) {
    const room = floor.rooms.find(r => r._id === data.roomId)
    if (room) {
      if (data.status) room.housekeepingStatus = data.status
      break
    }
  }
}

// Watch for view changes
watch([viewStartDate, currentZoom], () => {
  fetchData()
})

watch(hotelId, newVal => {
  if (newVal) {
    goToToday()
    fetchData()
  }
})

// Lifecycle
onMounted(() => {
  goToToday()
  if (hotelId.value) {
    fetchData()
  }
})
</script>

<style scoped>
/* Custom scrollbar for timeline */
.overflow-auto::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.dark .overflow-auto::-webkit-scrollbar-thumb {
  background: #475569;
}

/* Parallelogram bar styles */
.room-bar {
  /* Skew for parallelogram effect */
  transform: skewX(-15deg);
  border-radius: 2px;
}

.room-bar > * {
  /* Counter-skew text so it remains readable */
  transform: skewX(15deg);
}

/* Color classes for bars */
.bar-green {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.bar-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.bar-amber {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.bar-yellow {
  background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
}

.bar-red {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.bar-vip {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  box-shadow:
    0 0 0 2px #fcd34d,
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

/* Hover effect for bars */
.room-bar:hover {
  filter: brightness(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 20;
}
</style>
