<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ $t('wizard.title') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ getStepDescription() }}
        </p>
      </div>
      <button
        @click="$router.push('/tours/bookings')"
        class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <span class="material-icons">close</span>
      </button>
    </div>

    <!-- Step Progress -->
    <div
      class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4"
    >
      <div class="flex items-center justify-between">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="flex items-center"
          :class="{ 'flex-1': index < steps.length - 1 }"
        >
          <div
            class="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
            :class="{
              'bg-purple-600 text-white': currentStep > index,
              'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 ring-2 ring-purple-600':
                currentStep === index,
              'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-gray-500': currentStep < index
            }"
          >
            <span v-if="currentStep > index" class="material-icons">check</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span
            class="ml-3 text-sm font-medium hidden sm:block"
            :class="{
              'text-purple-600 dark:text-purple-400': currentStep >= index,
              'text-gray-400 dark:text-gray-500': currentStep < index
            }"
          >
            {{ step.label }}
          </span>
          <div
            v-if="index < steps.length - 1"
            class="flex-1 mx-4 h-0.5"
            :class="{
              'bg-purple-600': currentStep > index,
              'bg-gray-200 dark:bg-slate-600': currentStep <= index
            }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Step Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Step 1: Search Tours -->
        <div
          v-if="currentStep === 0"
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
        >
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ $t('wizard.searchTours') }}
          </h3>

          <!-- Search Form -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('wizard.destination') }}
              </label>
              <input
                type="text"
                v-model="searchForm.destination"
                :placeholder="$t('wizard.destination')"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('wizard.dateRange') }}
              </label>
              <input
                type="date"
                v-model="searchForm.departureDate"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('wizard.passengers') }}
              </label>
              <div class="flex items-center space-x-4">
                <div class="flex items-center">
                  <label class="text-sm text-gray-500 mr-2">{{
                    $t('tourBooking.passenger.adult')
                  }}</label>
                  <input
                    type="number"
                    v-model.number="searchForm.adults"
                    min="1"
                    max="20"
                    class="w-16 px-2 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-center"
                  />
                </div>
                <div class="flex items-center">
                  <label class="text-sm text-gray-500 mr-2">{{
                    $t('tourBooking.passenger.child')
                  }}</label>
                  <input
                    type="number"
                    v-model.number="searchForm.children"
                    min="0"
                    max="10"
                    class="w-16 px-2 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-center"
                  />
                </div>
              </div>
            </div>
            <div class="flex items-end">
              <BaseButton @click="searchTours" :loading="searching" class="w-full" iconLeft="search">
                {{ $t('common.search') }}
              </BaseButton>
            </div>
          </div>

          <!-- Search Results -->
          <div v-if="searchResults.length > 0" class="space-y-4">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('wizard.searchResults') }} ({{ searchResults.length }})
            </h4>
            <div
              v-for="tour in searchResults"
              :key="tour._id"
              @click="selectTour(tour)"
              class="border rounded-lg p-4 cursor-pointer transition-all"
              :class="{
                'border-purple-500 bg-purple-50 dark:bg-purple-900/20':
                  selectedTour?._id === tour._id,
                'border-gray-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-600':
                  selectedTour?._id !== tour._id
              }"
            >
              <div class="flex items-start gap-4">
                <div
                  class="w-24 h-16 bg-gray-200 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0"
                >
                  <img
                    v-if="getTourImage(tour)"
                    :src="getTourImage(tour)"
                    :alt="getLocalizedName(tour.name)"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <span class="material-icons text-gray-400">tour</span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <div>
                      <h5 class="font-medium text-gray-900 dark:text-white">
                        {{ getLocalizedName(tour.name) }}
                      </h5>
                      <p class="text-sm text-gray-500">{{ tour.code }}</p>
                    </div>
                    <div class="text-right">
                      <p class="font-medium text-purple-600 dark:text-purple-400">
                        <template v-if="getLowestPrice(tour)">
                          {{ $t('wizard.pricePerPerson') }}:
                          {{ formatCurrency(getLowestPrice(tour), tour.currency || 'TRY') }}
                        </template>
                        <template v-else>
                          <span class="text-gray-500">{{ $t('wizard.selectDeparture') }}</span>
                        </template>
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 mt-2">
                    <span
                      v-if="tour.primaryLocation?.name"
                      class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded"
                    >
                      {{ tour.primaryLocation.name }}
                    </span>
                    <span v-else class="text-xs text-gray-400">-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="searched && searchResults.length === 0" class="text-center py-8">
            <span class="material-icons text-4xl text-gray-300 dark:text-gray-600">search_off</span>
            <p class="text-gray-500 dark:text-gray-400 mt-2">{{ $t('wizard.noResults') }}</p>
          </div>
        </div>

        <!-- Step 2: Select Departure -->
        <div
          v-if="currentStep === 1"
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
        >
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ $t('wizard.selectDeparture') }}
          </h3>

          <div v-if="tourDepartures.length > 0" class="space-y-3">
            <div
              v-for="departure in tourDepartures"
              :key="departure._id"
              @click="selectDeparture(departure)"
              class="border rounded-lg p-4 cursor-pointer transition-all"
              :class="{
                'border-purple-500 bg-purple-50 dark:bg-purple-900/20':
                  selectedDeparture?._id === departure._id,
                'border-gray-200 dark:border-slate-600 hover:border-purple-300':
                  selectedDeparture?._id !== departure._id,
                'opacity-50 pointer-events-none':
                  departure.capacity?.available < getTotalPassengers()
              }"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-3">
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ formatDate(departure.departureDate) }} -
                      {{ formatDate(departure.returnDate) }}
                    </p>
                    <span
                      v-if="departure.guaranteedDeparture"
                      class="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded"
                    >
                      {{ $t('departure.labels.guaranteed') }}
                    </span>
                    <span
                      v-if="departure.capacity?.available <= 5 && departure.capacity?.available > 0"
                      class="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded"
                    >
                      {{
                        $t('departure.capacity.lastSeats', { count: departure.capacity.available })
                      }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ $t('departure.capacity.available') }}:
                    {{ departure.capacity?.available || 0 }} / {{ departure.capacity?.total || 0 }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-semibold text-purple-600 dark:text-purple-400">
                    {{
                      formatCurrency(
                        departure.pricing?.adult?.double || 0,
                        departure.currency || 'TRY'
                      )
                    }}
                  </p>
                  <p class="text-sm text-gray-500">{{ $t('wizard.pricePerPerson') }}</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <span class="material-icons text-4xl text-gray-300 dark:text-gray-600">event_busy</span>
            <p class="text-gray-500 dark:text-gray-400 mt-2">{{ $t('wizard.noDepartures') }}</p>
          </div>
        </div>

        <!-- Step 3: Passengers & Extras -->
        <div v-if="currentStep === 2" class="space-y-6">
          <!-- Passenger Information -->
          <div
            class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ $t('tourBooking.passenger.title') }}
              </h3>
              <BaseButton variant="secondary" size="sm" @click="addPassenger" iconLeft="add">
                {{ $t('tourBooking.passenger.add') }}
              </BaseButton>
            </div>

            <div class="space-y-4">
              <div
                v-for="(passenger, index) in bookingForm.passengers"
                :key="index"
                class="border border-gray-200 dark:border-slate-600 rounded-lg p-4"
              >
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {{ $t('tourBooking.passenger.title') }} {{ index + 1 }}
                    </span>
                    <span
                      v-if="passenger.isLead"
                      class="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded"
                    >
                      {{ $t('tourBooking.passenger.lead') }}
                    </span>
                  </div>
                  <button
                    v-if="bookingForm.passengers.length > 1"
                    @click="removePassenger(index)"
                    class="text-gray-400 hover:text-red-500"
                  >
                    <span class="material-icons text-sm">close</span>
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">{{
                      $t('tourBooking.passenger.type')
                    }}</label>
                    <select
                      v-model="passenger.type"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="adult">{{ $t('tourBooking.passenger.adult') }}</option>
                      <option value="child">{{ $t('tourBooking.passenger.child') }}</option>
                      <option value="infant">{{ $t('tourBooking.passenger.infant') }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">{{
                      $t('tourBooking.passenger.firstName')
                    }}</label>
                    <input
                      type="text"
                      v-model="passenger.firstName"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">{{
                      $t('tourBooking.passenger.lastName')
                    }}</label>
                    <input
                      type="text"
                      v-model="passenger.lastName"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">{{
                      $t('tourBooking.passenger.tcNumber')
                    }}</label>
                    <input
                      type="text"
                      v-model="passenger.tcNumber"
                      maxlength="11"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">{{
                      $t('tourBooking.passenger.dateOfBirth')
                    }}</label>
                    <input
                      type="date"
                      v-model="passenger.dateOfBirth"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">{{
                      $t('tourBooking.passenger.gender')
                    }}</label>
                    <select
                      v-model="passenger.gender"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="male">{{ $t('tourBooking.passenger.male') }}</option>
                      <option value="female">{{ $t('tourBooking.passenger.female') }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Information -->
          <div
            class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
          >
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ $t('tourBooking.contact.title') }}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ $t('tourBooking.contact.email') }} *
                </label>
                <input
                  type="email"
                  v-model="bookingForm.contact.email"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ $t('tourBooking.contact.phone') }} *
                </label>
                <input
                  type="tel"
                  v-model="bookingForm.contact.phone"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <!-- Optional Extras -->
          <div
            v-if="availableExtras.length > 0"
            class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
          >
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ $t('tourBooking.extras.title') }}
            </h3>
            <div class="space-y-3">
              <div
                v-for="extra in availableExtras"
                :key="extra._id"
                class="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-600 rounded-lg"
              >
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    :id="`extra-${extra._id}`"
                    :value="extra._id"
                    v-model="bookingForm.selectedExtras"
                    class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label :for="`extra-${extra._id}`" class="ml-3">
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ getLocalizedName(extra.name) }}
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ $t(`extra.priceTypes.${extra.priceType}`) }}
                    </p>
                  </label>
                </div>
                <span class="font-medium text-purple-600 dark:text-purple-400">
                  {{ formatCurrency(extra.price?.value || 0, extra.price?.currency || 'TRY') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Special Requests -->
          <div
            class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
          >
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ $t('tourBooking.notes.specialRequests') }}
            </h3>
            <textarea
              v-model="bookingForm.specialRequests"
              rows="3"
              :placeholder="$t('tourBooking.notes.placeholder')"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            ></textarea>
          </div>
        </div>

        <!-- Step 4: Confirm & Pay -->
        <div v-if="currentStep === 3" class="space-y-6">
          <!-- Booking Summary -->
          <div
            class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
          >
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ $t('tourBooking.bookingDetails') }}
            </h3>

            <!-- Tour Info -->
            <div class="border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
              <h4 class="font-medium text-gray-900 dark:text-white">{{ getLocalizedName(selectedTour?.name) }}</h4>
              <p class="text-sm text-gray-500">{{ selectedTour?.code }}</p>
              <div class="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span
                  >{{ formatDate(selectedDeparture?.departureDate) }} -
                  {{ formatDate(selectedDeparture?.returnDate) }}</span
                >
                <span>{{ selectedTour?.duration?.nights }} {{ $t('tour.fields.nights') }}</span>
              </div>
            </div>

            <!-- Passengers -->
            <div class="border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
              <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                {{ $t('tourBooking.fields.passengers') }}
              </h4>
              <div class="space-y-1">
                <div
                  v-for="(passenger, index) in bookingForm.passengers"
                  :key="index"
                  class="flex items-center justify-between text-sm"
                >
                  <span class="text-gray-600 dark:text-gray-400">
                    {{ passenger.firstName }} {{ passenger.lastName }}
                    <span class="text-gray-400"
                      >({{ $t(`tourBooking.passenger.${passenger.type}`) }})</span
                    >
                  </span>
                </div>
              </div>
            </div>

            <!-- Contact -->
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                {{ $t('tourBooking.contact.title') }}
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ bookingForm.contact.email }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ bookingForm.contact.phone }}
              </p>
            </div>
          </div>

          <!-- Payment Method -->
          <div
            class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
          >
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ $t('tourBooking.payment.method') }}
            </h3>
            <div class="space-y-3">
              <label
                v-for="method in paymentMethods"
                :key="method.value"
                class="flex items-center p-3 border rounded-lg cursor-pointer transition-colors"
                :class="{
                  'border-purple-500 bg-purple-50 dark:bg-purple-900/20':
                    bookingForm.paymentMethod === method.value,
                  'border-gray-200 dark:border-slate-600 hover:border-purple-300':
                    bookingForm.paymentMethod !== method.value
                }"
              >
                <input
                  type="radio"
                  :value="method.value"
                  v-model="bookingForm.paymentMethod"
                  class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                />
                <span class="material-icons ml-3 text-gray-400">{{ method.icon }}</span>
                <span class="ml-2 text-gray-900 dark:text-white">{{ method.label }}</span>
              </label>
            </div>
          </div>

          <!-- Terms -->
          <div
            class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
          >
            <div class="flex items-start">
              <input
                type="checkbox"
                id="acceptTerms"
                v-model="acceptTerms"
                class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-1"
              />
              <label for="acceptTerms" class="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Rezervasyon koşullarını ve iptal politikasını okudum, kabul ediyorum.
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Price Summary Sidebar -->
      <div class="lg:col-span-1">
        <div
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 sticky top-6"
        >
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ $t('tourBooking.pricing.title') }}
          </h3>

          <div v-if="selectedTour && selectedDeparture" class="space-y-3">
            <!-- Tour -->
            <div class="pb-3 border-b border-gray-200 dark:border-slate-700">
              <p class="font-medium text-gray-900 dark:text-white">{{ getLocalizedName(selectedTour.name) }}</p>
              <p class="text-sm text-gray-500">{{ formatDate(selectedDeparture.departureDate) }}</p>
            </div>

            <!-- Passengers Pricing -->
            <div class="space-y-2 text-sm">
              <div v-if="adultCount > 0" class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400"
                  >{{ $t('tourBooking.pricing.adults') }} x {{ adultCount }}</span
                >
                <span class="text-gray-900 dark:text-white">{{
                  formatCurrency(adultTotal, 'TRY')
                }}</span>
              </div>
              <div v-if="childCount > 0" class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400"
                  >{{ $t('tourBooking.pricing.children') }} x {{ childCount }}</span
                >
                <span class="text-gray-900 dark:text-white">{{
                  formatCurrency(childTotal, 'TRY')
                }}</span>
              </div>
              <div v-if="infantCount > 0" class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400"
                  >{{ $t('tourBooking.pricing.infants') }} x {{ infantCount }}</span
                >
                <span class="text-gray-900 dark:text-white">{{
                  formatCurrency(infantTotal, 'TRY')
                }}</span>
              </div>
            </div>

            <!-- Extras -->
            <div
              v-if="extrasTotal > 0"
              class="pt-3 border-t border-gray-200 dark:border-slate-700 space-y-2 text-sm"
            >
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">{{
                  $t('tourBooking.pricing.extras')
                }}</span>
                <span class="text-gray-900 dark:text-white">{{
                  formatCurrency(extrasTotal, 'TRY')
                }}</span>
              </div>
            </div>

            <!-- Total -->
            <div class="pt-3 border-t border-gray-200 dark:border-slate-700">
              <div class="flex justify-between">
                <span class="text-lg font-medium text-gray-900 dark:text-white">{{
                  $t('tourBooking.pricing.grandTotal')
                }}</span>
                <span class="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {{ formatCurrency(grandTotal, 'TRY') }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400">
            {{ $t('wizard.selectTour') }}
          </div>

          <!-- Navigation Buttons -->
          <div class="mt-6 space-y-3">
            <BaseButton
              v-if="currentStep < 3"
              @click="nextStep"
              :disabled="!canProceed"
              class="w-full"
              iconRight="arrow_forward"
            >
              {{ $t('common.continue') }}
            </BaseButton>
            <BaseButton
              v-if="currentStep === 3"
              @click="completeBooking"
              :disabled="!acceptTerms"
              :loading="submitting"
              class="w-full"
            >
              {{ $t('wizard.complete') }}
            </BaseButton>
            <BaseButton
              v-if="currentStep > 0"
              variant="secondary"
              @click="previousStep"
              class="w-full"
              iconLeft="arrow_back"
            >
              {{ $t('common.back') }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTourStore } from '@/stores/tour'
import { formatCurrency } from '@booking-engine/utils'
import { BaseButton } from '@/components/ui'
import { getFileUrl } from '@/utils/imageUrl'

const router = useRouter()
const { t, locale } = useI18n()
const tourStore = useTourStore()

// State
const currentStep = ref(0)
const searching = ref(false)
const searched = ref(false)
const submitting = ref(false)
const acceptTerms = ref(false)

const searchResults = ref([])
const selectedTour = ref(null)
const tourDepartures = ref([])
const selectedDeparture = ref(null)
const availableExtras = ref([])

// Search form
const searchForm = ref({
  destination: '',
  departureDate: '',
  adults: 2,
  children: 0
})

// Booking form
const bookingForm = ref({
  passengers: [createPassenger(true)],
  contact: { email: '', phone: '' },
  selectedExtras: [],
  specialRequests: '',
  paymentMethod: 'credit_card'
})

// Steps
const steps = computed(() => [
  { label: t('wizard.step1') },
  { label: t('wizard.step2') },
  { label: t('wizard.step3') },
  { label: t('wizard.step4') }
])

const paymentMethods = computed(() => [
  { value: 'credit_card', label: t('agencies.paymentMethods.creditCard'), icon: 'credit_card' },
  {
    value: 'bank_transfer',
    label: t('agencies.paymentMethods.bankTransfer'),
    icon: 'account_balance'
  }
])

// Passenger counts
const adultCount = computed(
  () => bookingForm.value.passengers.filter(p => p.type === 'adult').length
)
const childCount = computed(
  () => bookingForm.value.passengers.filter(p => p.type === 'child').length
)
const infantCount = computed(
  () => bookingForm.value.passengers.filter(p => p.type === 'infant').length
)

// Pricing calculations
const adultTotal = computed(() => {
  if (!selectedDeparture.value) return 0
  return adultCount.value * (selectedDeparture.value.pricing?.adult?.double || 0)
})

const childTotal = computed(() => {
  if (!selectedDeparture.value) return 0
  return childCount.value * (selectedDeparture.value.pricing?.child?.withBed || 0)
})

const infantTotal = computed(() => {
  if (!selectedDeparture.value) return 0
  return infantCount.value * (selectedDeparture.value.pricing?.infant?.price || 0)
})

const extrasTotal = computed(() => {
  return bookingForm.value.selectedExtras.reduce((sum, extraId) => {
    const extra = availableExtras.value.find(e => e._id === extraId)
    if (extra) {
      if (extra.priceType === 'per_person') {
        return sum + (extra.price?.value || 0) * bookingForm.value.passengers.length
      }
      return sum + (extra.price?.value || 0)
    }
    return sum
  }, 0)
})

const grandTotal = computed(() => {
  return adultTotal.value + childTotal.value + infantTotal.value + extrasTotal.value
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return selectedTour.value !== null
    case 1:
      return selectedDeparture.value !== null
    case 2:
      return (
        bookingForm.value.passengers.every(p => p.firstName && p.lastName) &&
        bookingForm.value.contact.email &&
        bookingForm.value.contact.phone
      )
    default:
      return true
  }
})

// Methods
function getStepDescription() {
  const descriptions = [
    t('wizard.searchTours'),
    t('wizard.selectDeparture'),
    t('wizard.enterPassengers'),
    t('wizard.confirmAndPay')
  ]
  return descriptions[currentStep.value]
}

function createPassenger(isLead = false) {
  return {
    type: 'adult',
    title: '',
    firstName: '',
    lastName: '',
    tcNumber: '',
    passportNumber: '',
    dateOfBirth: '',
    gender: 'male',
    isLead
  }
}

function addPassenger() {
  bookingForm.value.passengers.push(createPassenger())
}

function removePassenger(index) {
  bookingForm.value.passengers.splice(index, 1)
  // Ensure at least one lead passenger
  if (!bookingForm.value.passengers.some(p => p.isLead)) {
    bookingForm.value.passengers[0].isLead = true
  }
}

function getTotalPassengers() {
  return searchForm.value.adults + searchForm.value.children
}

function getLowestPrice(tour) {
  // Price hint may come from backend search endpoint or be missing
  // If not available, show a dash instead of 0 to avoid confusion
  if (tour.priceFrom && tour.priceFrom > 0) {
    return tour.priceFrom
  }
  return null // Will trigger "price varies" message
}

function getLocalizedName(obj) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj[locale.value] || obj.tr || obj.en || ''
}

function getTourImage(tour) {
  const main = tour?.mainImage || tour?.gallery?.find(i => i.isMain)?.url || tour?.gallery?.[0]?.url
  return main ? getFileUrl(main) : ''
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

async function searchTours() {
  searching.value = true
  searched.value = false
  try {
    // Search tours with filters - destination searches in names, locations, and tags
    const params = { status: 'active' }
    if (searchForm.value.destination?.trim()) {
      params.search = searchForm.value.destination.trim()
    }
    await tourStore.fetchTours(params)
    searchResults.value = tourStore.tours
    searched.value = true
  } finally {
    searching.value = false
  }
}

function selectTour(tour) {
  selectedTour.value = tour
}

async function loadTourDepartures() {
  if (!selectedTour.value) return

  // Fetch departures for selected tour
  await tourStore.fetchDepartures(selectedTour.value._id)
  tourDepartures.value = (tourStore.departures || []).filter(
    d =>
      d.status !== 'cancelled' &&
      d.status !== 'completed' &&
      new Date(d.departureDate) >= new Date()
  )
}

function selectDeparture(departure) {
  selectedDeparture.value = departure
}

async function loadExtras() {
  if (!selectedTour.value) return

  await tourStore.fetchExtras()
  availableExtras.value = tourStore.extras.filter(e => e.isActive !== false)
}

function nextStep() {
  if (currentStep.value === 0) {
    loadTourDepartures()
  } else if (currentStep.value === 1) {
    loadExtras()
    // Initialize passengers based on search
    const passengers = []
    for (let i = 0; i < searchForm.value.adults; i++) {
      passengers.push(createPassenger(i === 0))
    }
    for (let i = 0; i < searchForm.value.children; i++) {
      const p = createPassenger()
      p.type = 'child'
      passengers.push(p)
    }
    bookingForm.value.passengers = passengers
  }

  if (currentStep.value < 3) {
    currentStep.value++
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

async function completeBooking() {
  if (!acceptTerms.value) return

  submitting.value = true
  try {
    const bookingData = {
      tour: selectedTour.value._id,
      departure: selectedDeparture.value._id,
      passengers: bookingForm.value.passengers,
      contact: bookingForm.value.contact,
      extras: bookingForm.value.selectedExtras.map(extraId => {
        const extra = availableExtras.value.find(e => e._id === extraId)
        return {
          code: extra.code,
          name: extra.name,
          quantity: extra.priceType === 'per_person' ? bookingForm.value.passengers.length : 1,
          unitPrice: extra.price?.value || 0,
          totalPrice:
            extra.priceType === 'per_person'
              ? (extra.price?.value || 0) * bookingForm.value.passengers.length
              : extra.price?.value || 0
        }
      }),
      pricing: {
        currency: selectedDeparture.value.currency || 'TRY',
        adults: adultTotal.value,
        children: childTotal.value,
        infants: infantTotal.value,
        extras: extrasTotal.value,
        grandTotal: grandTotal.value
      },
      payment: {
        method: bookingForm.value.paymentMethod,
        status: 'pending',
        paidAmount: 0,
        dueAmount: grandTotal.value
      },
      specialRequests: bookingForm.value.specialRequests,
      salesChannel: 'b2c',
      status: 'pending'
    }

    const result = await tourStore.createBooking(bookingData)

    // Redirect to booking detail
    router.push(`/tours/bookings/${result._id}`)
  } finally {
    submitting.value = false
  }
}

// Lifecycle
onMounted(async () => {
  // Load tours for initial search
  await tourStore.fetchTours({ status: 'active' })
  searchResults.value = tourStore.tours
  searched.value = true
})
</script>
