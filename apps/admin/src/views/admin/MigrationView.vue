<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ $t('migration.title') }}</h1>
    </div>

    <!-- Stepper -->
    <Stepper
      v-model="currentStep"
      :steps="steps"
      :clickable="false"
      :linear="true"
      :show-navigation="false"
      color="purple"
      class="mb-8"
    />

    <!-- Step 1: Account & Partner Selection -->
    <div v-if="currentStep === 0" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left: Legacy Accounts -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
        >
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ $t('migration.accounts.title') }}
          </h2>

          <!-- Search -->
          <input
            v-model="accountSearch"
            type="text"
            class="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            :placeholder="$t('migration.accounts.search')"
            @input="debouncedFetchAccounts"
          />

          <!-- Account List -->
          <div v-if="loadingAccounts" class="flex justify-center py-8">
            <span class="material-icons animate-spin text-purple-600">refresh</span>
          </div>
          <div v-else-if="!accounts.length" class="text-center py-8 text-gray-500">
            {{ $t('migration.accounts.noAccounts') }}
          </div>
          <div v-else class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="account in accounts"
              :key="account.id"
              class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors"
              :class="
                selectedAccount?.id === account.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
              "
              @click="selectAccount(account)"
            >
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ account.companyName }}</p>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ account.type }} &middot; {{ account.email }}
                </p>
              </div>
              <span class="text-sm text-gray-500 dark:text-slate-400 whitespace-nowrap ml-2">
                {{ account.hotelCount }} {{ $t('migration.accounts.hotels') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right: Partner Selection -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
        >
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ $t('migration.accounts.selectPartner') }}
          </h2>

          <!-- Selected account info -->
          <div
            v-if="selectedAccount"
            class="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
          >
            <p class="text-sm text-gray-600 dark:text-slate-400">
              {{ $t('migration.accounts.selected') }}:
            </p>
            <p class="font-semibold text-gray-900 dark:text-white">
              {{ selectedAccount.companyName }}
            </p>
          </div>

          <!-- Partner dropdown -->
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Partner
          </label>
          <select
            v-model="selectedPartnerId"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            <option value="">-- Partner seciniz --</option>
            <option v-for="p in partners" :key="p._id" :value="p._id">
              {{ p.companyName }} ({{ p.partnerType }})
            </option>
          </select>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex justify-end">
        <button
          class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          :disabled="!selectedAccount || !selectedPartnerId"
          @click="goToStep(1)"
        >
          {{ $t('common.next') }} &rarr;
        </button>
      </div>

      <!-- Migration History -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ $t('migration.history.title') }}
        </h2>

        <div v-if="loadingHistory" class="flex justify-center py-4">
          <span class="material-icons animate-spin text-purple-600">refresh</span>
        </div>
        <div v-else-if="!history.length" class="text-center py-4 text-gray-500">
          {{ $t('migration.history.noHistory') }}
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="item in history"
            :key="item._id"
            class="p-4 rounded-lg border border-gray-200 dark:border-slate-600"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ item.legacyAccountName }} &rarr; {{ item.partner?.companyName || '-' }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ item.summary?.migratedHotels || 0 }}/{{ item.summary?.totalHotels || 0 }}
                  {{ $t('migration.accounts.hotels') }} &middot;
                  {{ $t('migration.history.performedBy') }}:
                  {{ item.performedBy?.name || item.performedBy?.email || '-' }}
                </p>
              </div>
              <div class="text-right">
                <span
                  class="inline-block px-2 py-1 rounded text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400':
                      item.status === 'completed',
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400':
                      item.status === 'failed',
                    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400':
                      item.status === 'partial',
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400':
                      item.status === 'in_progress'
                  }"
                >
                  {{ $t(`migration.migrate.${item.status}`) }}
                </span>
                <p class="text-xs text-gray-500 mt-1">{{ formatDate(item.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: Hotel Selection -->
    <div v-if="currentStep === 1" class="space-y-6">
      <div
        class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ $t('migration.hotels.title') }}
          </h2>
          <div class="flex gap-2">
            <button class="text-sm text-purple-600 hover:text-purple-700" @click="toggleSelectAll">
              {{
                allHotelsSelected
                  ? $t('migration.hotels.deselectAll')
                  : $t('migration.hotels.selectAll')
              }}
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loadingHotels" class="flex justify-center py-8">
          <span class="material-icons animate-spin text-purple-600">refresh</span>
        </div>

        <!-- Hotel list -->
        <div v-else-if="!accountHotels.length" class="text-center py-8 text-gray-500">
          {{ $t('migration.hotels.noHotels') }}
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="hotel in accountHotels"
            :key="hotel.id"
            class="flex items-start gap-4 p-4 rounded-lg border transition-colors"
            :class="
              isHotelSelected(hotel.id)
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-slate-600'
            "
          >
            <!-- Checkbox -->
            <input
              type="checkbox"
              :checked="isHotelSelected(hotel.id)"
              class="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
              @change="toggleHotel(hotel)"
            />

            <!-- Hotel info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-medium text-gray-900 dark:text-white">{{ hotel.name }}</p>
                <span v-if="hotel.stars" class="text-yellow-500 text-sm">
                  {{ '\u2605'.repeat(hotel.stars) }}
                </span>
              </div>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ hotel.city }} &middot; {{ hotel.code || '-' }}
              </p>
              <div class="flex gap-4 mt-1 text-xs text-gray-500 dark:text-slate-400">
                <span>{{ hotel.roomCount }} {{ $t('migration.hotels.rooms') }}</span>
                <span>{{ hotel.mealPlanCount }} {{ $t('migration.hotels.mealPlans') }}</span>
                <span>{{ hotel.photoCount }} {{ $t('migration.hotels.photos') }}</span>
              </div>
            </div>

            <!-- Preview -->
            <div class="flex items-center gap-2">
              <button
                class="text-sm text-purple-600 hover:text-purple-700 px-2 py-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                @click="openPreview(hotel)"
              >
                {{ $t('migration.hotels.preview') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Migration options -->
        <div
          v-if="selectedHotels.length"
          class="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700"
        >
          <p class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
            {{ selectedHotels.length }} {{ $t('migration.hotels.selected') }}
          </p>
          <div class="flex flex-wrap gap-4">
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
              <input
                v-model="migrationOptions.includePhotos"
                type="checkbox"
                class="w-4 h-4 text-purple-600 rounded"
              />
              {{ $t('migration.hotels.includePhotos') }}
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
              <input
                v-model="migrationOptions.includeRooms"
                type="checkbox"
                class="w-4 h-4 text-purple-600 rounded"
              />
              {{ $t('migration.hotels.includeRooms') }}
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
              <input
                v-model="migrationOptions.includeMealPlans"
                type="checkbox"
                class="w-4 h-4 text-purple-600 rounded"
              />
              {{ $t('migration.hotels.includeMealPlans') }}
            </label>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex justify-between">
        <button
          class="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          @click="goToStep(0)"
        >
          &larr; {{ $t('common.back') }}
        </button>
        <button
          class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          :disabled="!selectedHotels.length"
          @click="goToStep(2)"
        >
          {{ $t('common.next') }} &rarr;
        </button>
      </div>
    </div>

    <!-- Step 3: Migration & Results -->
    <div v-if="currentStep === 2" class="space-y-6">
      <!-- Summary before migration -->
      <div
        v-if="!migrationStarted"
        class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ $t('migration.migrate.summary') }}
        </h2>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div class="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p class="text-2xl font-bold text-purple-600">{{ selectedHotels.length }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('migration.migrate.totalHotels') }}
            </p>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p class="text-2xl font-bold text-blue-600">{{ totalRoomCount }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('migration.hotels.rooms') }}
            </p>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p class="text-2xl font-bold text-green-600">{{ totalMealPlanCount }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('migration.hotels.mealPlans') }}
            </p>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p class="text-2xl font-bold text-amber-600">{{ totalPhotoCount }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('migration.hotels.photos') }}
            </p>
          </div>
        </div>

        <!-- Hotel list -->
        <div class="space-y-2 mb-6">
          <div
            v-for="hotel in selectedHotelDetails"
            :key="hotel.id"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
          >
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ hotel.name }}</p>
              <p class="text-sm text-gray-500">{{ hotel.city }}</p>
            </div>
            <div class="text-sm text-gray-500">
              {{ hotel.roomCount }}R / {{ hotel.mealPlanCount }}M / {{ hotel.photoCount }}P
            </div>
          </div>
        </div>

        <div class="flex gap-4">
          <button
            class="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            @click="goToStep(1)"
          >
            &larr; {{ $t('common.back') }}
          </button>
          <button
            class="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
            :disabled="migrating"
            @click="startMigration"
          >
            <span v-if="migrating" class="flex items-center justify-center gap-2">
              <span class="material-icons animate-spin text-sm">refresh</span>
              {{ $t('migration.migrate.inProgress') }}
            </span>
            <span v-else>{{ $t('migration.migrate.start') }}</span>
          </button>
        </div>
      </div>

      <!-- Real-time Progress UI -->
      <div
        v-if="migrationStarted && !migrationResult"
        class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ $t('migration.migrate.progress.title') }}
        </h2>

        <!-- Overall progress bar -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700 dark:text-slate-300">
              {{ progress.completedHotels }}/{{ progress.totalHotels }}
              {{ $t('migration.migrate.progress.hotel') }}
            </span>
            <span class="text-sm text-gray-500">{{ overallPercent }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
            <div
              class="bg-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
              :style="{ width: overallPercent + '%' }"
            ></div>
          </div>
        </div>

        <!-- Current hotel detail -->
        <div
          v-if="progress.currentHotel"
          class="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
        >
          <p class="font-medium text-purple-800 dark:text-purple-300 mb-3">
            <span class="material-icons text-base align-middle mr-1">hotel</span>
            {{ $t('migration.migrate.progress.currentHotel') }}: {{ progress.currentHotel.name }}
          </p>

          <!-- Photo progress -->
          <div v-if="progress.currentHotel.photo" class="flex items-center gap-3 mb-2">
            <span class="material-icons text-sm text-blue-600 dark:text-blue-400"
              >photo_camera</span
            >
            <div class="flex-1">
              <div
                class="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400 mb-1"
              >
                <span>{{ $t('migration.migrate.progress.downloadingPhotos') }}</span>
                <span
                  >{{ progress.currentHotel.photo.current }}/{{
                    progress.currentHotel.photo.total
                  }}</span
                >
              </div>
              <div class="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-1.5">
                <div
                  class="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  :style="{ width: photoPercent + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Room progress -->
          <div v-if="progress.currentHotel.room" class="flex items-center gap-3 mb-2">
            <span class="material-icons text-sm text-green-600 dark:text-green-400">bed</span>
            <div class="flex-1">
              <div
                class="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400 mb-1"
              >
                <span
                  >{{ $t('migration.migrate.progress.addingRooms') }}:
                  {{ progress.currentHotel.room.name }}</span
                >
                <span
                  >{{ progress.currentHotel.room.current }}/{{
                    progress.currentHotel.room.total
                  }}</span
                >
              </div>
              <div class="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-1.5">
                <div
                  class="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                  :style="{ width: roomPercent + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Meal plan progress -->
          <div v-if="progress.currentHotel.mealplan" class="flex items-center gap-3 mb-2">
            <span class="material-icons text-sm text-amber-600 dark:text-amber-400"
              >restaurant</span
            >
            <div class="flex-1">
              <div
                class="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400 mb-1"
              >
                <span
                  >{{ $t('migration.migrate.progress.addingMealPlans') }}:
                  {{ progress.currentHotel.mealplan.code }}</span
                >
                <span
                  >{{ progress.currentHotel.mealplan.current }}/{{
                    progress.currentHotel.mealplan.total
                  }}</span
                >
              </div>
              <div class="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-1.5">
                <div
                  class="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                  :style="{ width: mealplanPercent + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Market progress -->
          <div v-if="progress.currentHotel.market" class="flex items-center gap-3">
            <span class="material-icons text-sm text-indigo-600 dark:text-indigo-400">public</span>
            <div class="flex-1">
              <div
                class="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400 mb-1"
              >
                <span
                  >{{ $t('migration.migrate.progress.addingMarkets') }}:
                  {{ progress.currentHotel.market.name }}</span
                >
                <span
                  >{{ progress.currentHotel.market.current }}/{{
                    progress.currentHotel.market.total
                  }}</span
                >
              </div>
              <div class="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-1.5">
                <div
                  class="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                  :style="{ width: marketPercent + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hotel list with status -->
        <div ref="hotelListRef" class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="(hotel, idx) in progress.hotels"
            :key="idx"
            class="flex items-center gap-3 p-3 rounded-lg text-sm"
            :class="{
              'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800':
                hotel.status === 'success',
              'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800':
                hotel.status === 'failed',
              'bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800':
                hotel.status === 'processing',
              'bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600':
                hotel.status === 'waiting'
            }"
          >
            <span
              class="material-icons text-base"
              :class="{
                'text-green-600': hotel.status === 'success',
                'text-red-600': hotel.status === 'failed',
                'text-blue-600 animate-spin': hotel.status === 'processing',
                'text-gray-400': hotel.status === 'waiting'
              }"
            >
              {{
                hotel.status === 'success'
                  ? 'check_circle'
                  : hotel.status === 'failed'
                    ? 'error'
                    : hotel.status === 'processing'
                      ? 'refresh'
                      : 'radio_button_unchecked'
              }}
            </span>
            <span class="flex-1 text-gray-900 dark:text-white">
              {{ hotel.name || `${$t('migration.migrate.progress.hotel')} ${idx + 1}` }}
            </span>
            <span class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t(`migration.migrate.progress.${hotel.status}`) }}
            </span>
          </div>
        </div>

        <!-- Back button - allows starting another migration while this one runs -->
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <button
            class="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            @click="goBackForNewMigration"
          >
            &larr; {{ $t('migration.migrate.progress.selectMore') }}
          </button>
        </div>
      </div>

      <!-- Migration Results -->
      <div
        v-if="migrationResult"
        class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
      >
        <!-- Status banner -->
        <div
          class="p-4 rounded-lg mb-6"
          :class="{
            'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300':
              migrationResult.status === 'completed',
            'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300':
              migrationResult.status === 'failed',
            'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300':
              migrationResult.status === 'partial'
          }"
        >
          <div class="flex items-center gap-2">
            <span class="material-icons">
              {{
                migrationResult.status === 'completed'
                  ? 'check_circle'
                  : migrationResult.status === 'failed'
                    ? 'error'
                    : 'warning'
              }}
            </span>
            <span class="font-semibold">{{
              $t(`migration.migrate.${migrationResult.status}`)
            }}</span>
          </div>
        </div>

        <!-- Summary stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div class="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p class="text-xl font-bold text-green-600">
              {{ migrationResult.summary?.migratedHotels || 0 }}
            </p>
            <p class="text-xs text-gray-500">{{ $t('migration.migrate.migratedHotels') }}</p>
          </div>
          <div class="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p class="text-xl font-bold text-red-600">
              {{ migrationResult.summary?.failedHotels || 0 }}
            </p>
            <p class="text-xs text-gray-500">{{ $t('migration.migrate.failedHotels') }}</p>
          </div>
          <div class="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p class="text-xl font-bold text-blue-600">
              {{ migrationResult.summary?.downloadedPhotos || 0 }}
            </p>
            <p class="text-xs text-gray-500">{{ $t('migration.migrate.downloadedPhotos') }}</p>
          </div>
          <div class="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p class="text-xl font-bold text-gray-600">
              {{ migrationResult.summary?.totalPhotos || 0 }}
            </p>
            <p class="text-xs text-gray-500">{{ $t('migration.migrate.totalPhotos') }}</p>
          </div>
        </div>

        <!-- Per-hotel results -->
        <div class="space-y-3">
          <div
            v-for="hotel in migrationResult.hotels"
            :key="hotel.legacyHotelId"
            class="p-4 rounded-lg border"
            :class="
              hotel.status === 'success'
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
            "
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ hotel.legacyHotelName || `Hotel #${hotel.legacyHotelId}` }}
                </p>
                <p class="text-sm text-gray-500 mt-1">
                  {{ $t('migration.hotels.rooms') }}: {{ hotel.roomTypes?.migrated || 0 }}/{{
                    hotel.roomTypes?.total || 0
                  }}
                  &middot; {{ $t('migration.hotels.mealPlans') }}:
                  {{ hotel.mealPlans?.migrated || 0 }}/{{ hotel.mealPlans?.total || 0 }} &middot;
                  {{ $t('migration.hotels.markets') }}: {{ hotel.markets?.migrated || 0 }}/{{
                    hotel.markets?.total || 0
                  }}
                  &middot; {{ $t('migration.hotels.photos') }}:
                  {{ hotel.photos?.downloaded || 0 }}/{{ hotel.photos?.total || 0 }}
                </p>
              </div>
              <span
                class="material-icons"
                :class="hotel.status === 'success' ? 'text-green-600' : 'text-red-600'"
              >
                {{ hotel.status === 'success' ? 'check_circle' : 'error' }}
              </span>
            </div>
            <!-- Errors -->
            <div v-if="hotel.errors?.length" class="mt-2">
              <p class="text-sm font-medium text-red-700 dark:text-red-400">
                {{ $t('migration.migrate.errors') }}:
              </p>
              <ul class="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                <li v-for="(err, i) in hotel.errors" :key="i">{{ err }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="mt-6 flex gap-3">
          <button
            class="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            @click="goBackForNewMigration"
          >
            &larr; {{ $t('migration.migrate.progress.selectMore') }}
          </button>
          <button
            class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            @click="resetWizard"
          >
            {{ $t('migration.migrate.newMigration') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Migration Confirm Dialog -->
    <ConfirmDialog
      v-model="showConfirm"
      type="info"
      icon="rocket_launch"
      :title="$t('migration.migrate.confirmTitle')"
      :message="$t('migration.migrate.confirm')"
      :confirm-text="$t('migration.migrate.start')"
      :cancel-text="$t('common.cancel')"
      @confirm="doStartMigration"
    />

    <!-- Preview Modal -->
    <Modal v-model="showPreview" :title="$t('migration.preview.title')" size="lg">
      <div v-if="previewData" class="space-y-6">
        <!-- Hotel info -->
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
            {{ $t('migration.preview.hotelInfo') }}
          </h3>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-gray-500">{{ $t('common.name') }}:</span>
              {{ previewData.hotel.name }}
            </div>
            <div>
              <span class="text-gray-500">{{ $t('migration.preview.code') }}:</span>
              {{ previewData.hotel.code || '-' }}
            </div>
            <div>
              <span class="text-gray-500">{{ $t('migration.preview.city') }}:</span>
              {{ previewData.hotel.city }}
            </div>
            <div>
              <span class="text-gray-500">{{ $t('migration.preview.country') }}:</span>
              {{ previewData.hotel.country }}
            </div>
            <div>
              <span class="text-gray-500">{{ $t('migration.preview.type') }}:</span>
              {{ previewData.hotel.type }}
            </div>
            <div>
              <span class="text-gray-500">{{ $t('common.currency') }}:</span>
              {{ previewData.hotel.currency }}
            </div>
          </div>
          <!-- Preview photos -->
          <div v-if="previewData.hotel.photos?.length" class="flex gap-2 mt-3 overflow-x-auto">
            <img
              v-for="(photo, i) in previewData.hotel.photos"
              :key="i"
              :src="photo"
              class="w-24 h-16 object-cover rounded"
              @error="$event.target.style.display = 'none'"
            />
          </div>
        </div>

        <!-- Room types -->
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
            {{ $t('migration.preview.roomTypes') }} ({{ previewData.rooms.length }})
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th class="text-left p-2">{{ $t('common.name') }}</th>
                  <th class="text-left p-2">{{ $t('migration.preview.code') }}</th>
                  <th class="text-center p-2">{{ $t('migration.preview.maxAdult') }}</th>
                  <th class="text-center p-2">{{ $t('migration.preview.maxOccupant') }}</th>
                  <th class="text-center p-2">{{ $t('migration.preview.isBase') }}</th>
                  <th class="text-center p-2">{{ $t('migration.hotels.photos') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="room in previewData.rooms"
                  :key="room.id"
                  class="border-b border-gray-100 dark:border-slate-700"
                >
                  <td class="p-2">{{ room.name.tr || room.name.en || '-' }}</td>
                  <td class="p-2">{{ room.code || '-' }}</td>
                  <td class="p-2 text-center">{{ room.maxAdult }}</td>
                  <td class="p-2 text-center">{{ room.maxOccupant }}</td>
                  <td class="p-2 text-center">
                    <span v-if="room.isBase" class="text-green-600 material-icons text-sm"
                      >check</span
                    >
                  </td>
                  <td class="p-2 text-center">{{ room.photoCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Meal plans -->
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
            {{ $t('migration.preview.mealPlans') }} ({{ previewData.mealPlans.length }})
          </h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="plan in previewData.mealPlans"
              :key="plan.id"
              class="px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-sm"
            >
              {{ plan.code }} - {{ plan.name.tr || plan.name.en || '-' }}
              <span v-if="plan.isBase" class="text-purple-600 font-medium">(baz)</span>
            </span>
          </div>
        </div>
      </div>
      <div v-else class="flex justify-center py-8">
        <span class="material-icons animate-spin text-purple-600">refresh</span>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import Stepper from '@/components/ui/navigation/Stepper.vue'
import Modal from '@/components/ui/overlay/Modal.vue'
import ConfirmDialog from '@/components/ui/feedback/ConfirmDialog.vue'
import migrationService from '@/services/migrationService'
import partnerService from '@/services/partnerService'
import { useSocket } from '@/composables/useSocket'

const { t } = useI18n()
const { join, leave, on, off } = useSocket()

// Stepper - 3 steps (connection is automatic)
const currentStep = ref(0)
const steps = computed(() => [
  { label: t('migration.steps.account'), icon: 'people' },
  { label: t('migration.steps.hotels'), icon: 'hotel' },
  { label: t('migration.steps.migrate'), icon: 'rocket_launch' }
])

// Step 1: Accounts & Partners
const accounts = ref([])
const loadingAccounts = ref(false)
const accountSearch = ref('')
const selectedAccount = ref(null)
const partners = ref([])
const selectedPartnerId = ref('')

// Step 2: Hotels
const accountHotels = ref([])
const loadingHotels = ref(false)
const selectedHotels = ref([])
const migrationOptions = ref({
  includePhotos: true,
  includeRooms: true,
  includeMealPlans: true
})

// Step 3: Migration
const migrating = ref(false)
const migrationStarted = ref(false)
const migrationResult = ref(null)

// Socket progress state
const operationId = ref(null)
const progress = ref({
  totalHotels: 0,
  completedHotels: 0,
  currentHotel: null,
  hotels: []
})

// Ref for auto-scroll
const hotelListRef = ref(null)

// Preview
const showPreview = ref(false)
const showConfirm = ref(false)
const previewData = ref(null)

// History
const history = ref([])
const loadingHistory = ref(false)

// Debounce timer
let searchTimer = null

// Socket event handlers (kept as refs for cleanup)
const socketHandlers = ref({})

// Computed
const allHotelsSelected = computed(
  () => accountHotels.value.length > 0 && selectedHotels.value.length === accountHotels.value.length
)

const selectedHotelDetails = computed(() =>
  accountHotels.value.filter(h => selectedHotels.value.includes(h.id))
)

const totalRoomCount = computed(() =>
  selectedHotelDetails.value.reduce((sum, h) => sum + (h.roomCount || 0), 0)
)

const totalMealPlanCount = computed(() =>
  selectedHotelDetails.value.reduce((sum, h) => sum + (h.mealPlanCount || 0), 0)
)

const totalPhotoCount = computed(() =>
  selectedHotelDetails.value.reduce((sum, h) => sum + (h.photoCount || 0), 0)
)

const overallPercent = computed(() => {
  if (!progress.value.totalHotels) return 0
  return Math.round((progress.value.completedHotels / progress.value.totalHotels) * 100)
})

const photoPercent = computed(() => {
  const p = progress.value.currentHotel?.photo
  if (!p || !p.total) return 0
  return Math.round((p.current / p.total) * 100)
})

const roomPercent = computed(() => {
  const r = progress.value.currentHotel?.room
  if (!r || !r.total) return 0
  return Math.round((r.current / r.total) * 100)
})

const mealplanPercent = computed(() => {
  const m = progress.value.currentHotel?.mealplan
  if (!m || !m.total) return 0
  return Math.round((m.current / m.total) * 100)
})

const marketPercent = computed(() => {
  const m = progress.value.currentHotel?.market
  if (!m || !m.total) return 0
  return Math.round((m.current / m.total) * 100)
})

// Methods
function goToStep(step) {
  currentStep.value = step
}

async function fetchAccounts() {
  loadingAccounts.value = true
  try {
    const params = {}
    if (accountSearch.value) params.search = accountSearch.value
    const res = await migrationService.getAccounts(params)
    accounts.value = res.data
  } catch {
    accounts.value = []
  } finally {
    loadingAccounts.value = false
  }
}

function debouncedFetchAccounts() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchAccounts, 300)
}

async function fetchPartners() {
  try {
    const res = await partnerService.getPartners({ limit: 1000 })
    partners.value = res.data?.partners || []
  } catch {
    partners.value = []
  }
}

function selectAccount(account) {
  selectedAccount.value = account
}

async function fetchAccountHotels() {
  if (!selectedAccount.value) return
  loadingHotels.value = true
  try {
    const res = await migrationService.getAccountHotels(selectedAccount.value.id)
    accountHotels.value = res.data
    selectedHotels.value = []
  } catch {
    accountHotels.value = []
  } finally {
    loadingHotels.value = false
  }
}

function isHotelSelected(hotelId) {
  return selectedHotels.value.includes(hotelId)
}

function toggleHotel(hotel) {
  const idx = selectedHotels.value.indexOf(hotel.id)
  if (idx >= 0) {
    selectedHotels.value.splice(idx, 1)
  } else {
    selectedHotels.value.push(hotel.id)
  }
}

function toggleSelectAll() {
  if (allHotelsSelected.value) {
    selectedHotels.value = []
  } else {
    selectedHotels.value = accountHotels.value.map(h => h.id)
  }
}

async function openPreview(hotel) {
  showPreview.value = true
  previewData.value = null
  try {
    const res = await migrationService.previewHotel(selectedAccount.value.id, hotel.id)
    previewData.value = res.data
  } catch {
    showPreview.value = false
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (hotelListRef.value) {
      hotelListRef.value.scrollTop = hotelListRef.value.scrollHeight
    }
  })
}

function setupSocketListeners(opId) {
  const handlers = {}

  handlers.started = on(`migration:started`, data => {
    if (data.operationId !== opId) return
    progress.value.totalHotels = data.totalHotels
    progress.value.completedHotels = 0
    progress.value.hotels = selectedHotelDetails.value.map(h => ({
      name: h.name,
      status: 'waiting'
    }))
  })

  handlers.hotelStart = on(`migration:hotel:start`, data => {
    if (data.operationId !== opId) return
    const idx = data.hotelIndex
    if (progress.value.hotels[idx]) {
      progress.value.hotels[idx].status = 'processing'
      if (data.hotelName) progress.value.hotels[idx].name = data.hotelName
    }
    progress.value.currentHotel = {
      name: data.hotelName || progress.value.hotels[idx]?.name || `Hotel ${idx + 1}`,
      photo: null,
      room: null,
      mealplan: null,
      market: null
    }
    scrollToBottom()
  })

  handlers.hotelPhoto = on(`migration:hotel:photo`, data => {
    if (data.operationId !== opId) return
    if (progress.value.currentHotel) {
      progress.value.currentHotel.photo = { current: data.current, total: data.total }
    }
  })

  handlers.hotelRoom = on(`migration:hotel:room`, data => {
    if (data.operationId !== opId) return
    if (progress.value.currentHotel) {
      progress.value.currentHotel.room = {
        current: data.current,
        total: data.total,
        name: data.roomName
      }
    }
  })

  handlers.hotelMealplan = on(`migration:hotel:mealplan`, data => {
    if (data.operationId !== opId) return
    if (progress.value.currentHotel) {
      progress.value.currentHotel.mealplan = {
        current: data.current,
        total: data.total,
        code: data.planCode
      }
    }
  })

  handlers.hotelMarket = on(`migration:hotel:market`, data => {
    if (data.operationId !== opId) return
    if (progress.value.currentHotel) {
      progress.value.currentHotel.market = {
        current: data.current,
        total: data.total,
        name: data.marketName
      }
    }
  })

  handlers.hotelComplete = on(`migration:hotel:complete`, data => {
    if (data.operationId !== opId) return
    const idx = data.hotelIndex
    if (progress.value.hotels[idx]) {
      progress.value.hotels[idx].status = data.status
      if (data.hotelName) progress.value.hotels[idx].name = data.hotelName
    }
    progress.value.completedHotels++
    progress.value.currentHotel = null
    scrollToBottom()
  })

  handlers.complete = on(`migration:complete`, async data => {
    if (data.operationId !== opId) return
    progress.value.currentHotel = null
    migrating.value = false

    // Fetch full history record for the result view
    try {
      const res = await migrationService.getHistory()
      const historyItem = res.data?.find(h => h._id === data.historyId)
      if (historyItem) {
        migrationResult.value = historyItem
      } else {
        migrationResult.value = { status: data.status, summary: data.summary, hotels: [] }
      }
    } catch {
      migrationResult.value = { status: data.status, summary: data.summary, hotels: [] }
    }

    cleanupSocket()
  })

  socketHandlers.value = handlers
}

function cleanupSocket() {
  if (operationId.value) {
    leave(operationId.value)
  }
  // Unsubscribe handlers (each `on` returns an unsubscribe function)
  Object.values(socketHandlers.value).forEach(unsub => {
    if (typeof unsub === 'function') unsub()
  })
  socketHandlers.value = {}
}

function startMigration() {
  showConfirm.value = true
}

async function doStartMigration() {
  migrating.value = true
  migrationStarted.value = true

  try {
    const payload = {
      partnerId: selectedPartnerId.value,
      accountId: selectedAccount.value.id,
      hotels: selectedHotels.value.map(hotelId => ({
        oldHotelId: hotelId,
        includePhotos: migrationOptions.value.includePhotos,
        includeRooms: migrationOptions.value.includeRooms,
        includeMealPlans: migrationOptions.value.includeMealPlans
      }))
    }

    const res = await migrationService.migrate(payload)
    operationId.value = res.data.operationId

    // Initialize progress with hotel names from selected list
    progress.value = {
      totalHotels: selectedHotels.value.length,
      completedHotels: 0,
      currentHotel: null,
      hotels: selectedHotelDetails.value.map(h => ({
        name: h.name,
        status: 'waiting'
      }))
    }

    // Join socket room and listen for events
    join(operationId.value)
    setupSocketListeners(operationId.value)
  } catch {
    migrating.value = false
    migrationResult.value = {
      status: 'failed',
      summary: {
        totalHotels: selectedHotels.value.length,
        migratedHotels: 0,
        failedHotels: selectedHotels.value.length
      },
      hotels: []
    }
  }
}

function goBackForNewMigration() {
  // Current migration continues in background (socket cleanup happens naturally when complete event fires)
  // Reset UI state so user can start a new migration
  cleanupSocket()
  migrationStarted.value = false
  migrating.value = false
  migrationResult.value = null
  operationId.value = null
  progress.value = { totalHotels: 0, completedHotels: 0, currentHotel: null, hotels: [] }
  selectedHotels.value = []
  currentStep.value = 1
}

function resetWizard() {
  cleanupSocket()
  currentStep.value = 0
  selectedAccount.value = null
  selectedPartnerId.value = ''
  accountHotels.value = []
  selectedHotels.value = []
  migrationStarted.value = false
  migrationResult.value = null
  operationId.value = null
  progress.value = { totalHotels: 0, completedHotels: 0, currentHotel: null, hotels: [] }
  fetchHistory()
}

async function fetchHistory() {
  loadingHistory.value = true
  try {
    const res = await migrationService.getHistory()
    history.value = res.data
  } catch {
    history.value = []
  } finally {
    loadingHistory.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Watch step changes for data loading
watch(currentStep, step => {
  if (step === 1) {
    fetchAccountHotels()
  }
})

// Init - load accounts, partners, and history on mount
onMounted(() => {
  fetchAccounts()
  fetchPartners()
  fetchHistory()
})

// Cleanup on unmount
onUnmounted(() => {
  cleanupSocket()
})
</script>
