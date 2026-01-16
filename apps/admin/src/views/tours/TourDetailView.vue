<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <button
            class="mr-4 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
            @click="goBack"
          >
            <span class="material-icons">arrow_back</span>
          </button>
          <div>
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ isNew ? $t('tour.newTour') : $t('tour.editTour') }}
            </h1>
            <p v-if="!isNew && form.code" class="text-sm text-gray-500 dark:text-slate-400">
              {{ form.code }} - {{ getLocalizedName(form.name) }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button
            v-if="!isNew"
            class="btn-outline"
            @click="duplicateTour"
          >
            <span class="material-icons mr-2">content_copy</span>
            {{ $t('tour.duplicate') }}
          </button>
          <button
            class="btn-primary bg-teal-600 hover:bg-teal-700"
            :disabled="isSaving"
            @click="saveTour"
          >
            <span v-if="isSaving" class="material-icons animate-spin mr-2">refresh</span>
            <span v-else class="material-icons mr-2">save</span>
            {{ $t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
      <div class="flex overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
          :class="activeTab === tab.key
            ? 'border-teal-500 text-teal-600 dark:text-teal-400'
            : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'"
          @click="activeTab = tab.key"
        >
          <span class="material-icons text-lg align-middle mr-2">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <div v-if="isLoading" class="flex items-center justify-center h-64">
        <span class="material-icons animate-spin text-4xl text-teal-500">refresh</span>
      </div>

      <template v-else>
        <!-- Basic Info Tab -->
        <div v-show="activeTab === 'basic'" class="max-w-4xl space-y-6">
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <h3 class="text-lg font-medium mb-4">{{ $t('tour.tabs.basic') }}</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Tour Code -->
              <div>
                <label class="form-label">{{ $t('tour.fields.code') }} *</label>
                <div class="flex gap-2">
                  <input
                    v-model="form.code"
                    type="text"
                    class="form-input uppercase flex-1"
                    :placeholder="$t('tour.fields.code')"
                    maxlength="20"
                  />
                  <button
                    v-if="isNew"
                    type="button"
                    class="px-3 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    @click="generateTourCode"
                    :title="$t('tour.generateCode')"
                  >
                    <span class="material-icons text-sm">auto_awesome</span>
                  </button>
                </div>
              </div>

              <!-- Tour Type -->
              <div>
                <label class="form-label">{{ $t('tour.fields.tourType') }} *</label>
                <select v-model="form.tourType" class="form-input">
                  <option v-for="type in tourTypes" :key="type.value" :value="type.value">
                    {{ $t(type.label) }}
                  </option>
                </select>
              </div>

              <!-- Tour Name (Multi-lang) -->
              <div class="md:col-span-2">
                <label class="form-label">{{ $t('tour.fields.name') }} *</label>
                <MultiLangInput
                  v-model="form.name"
                  :languages="B2C_LANGUAGES"
                  :placeholder="$t('tour.fields.name')"
                />
              </div>

              <!-- Short Description (Multi-lang) -->
              <div class="md:col-span-2">
                <label class="form-label">{{ $t('tour.fields.shortDescription') }}</label>
                <MultiLangInput
                  v-model="form.shortDescription"
                  :languages="B2C_LANGUAGES"
                  type="textarea"
                  :rows="2"
                />
              </div>

              <!-- Description (Multi-lang) -->
              <div class="md:col-span-2">
                <label class="form-label">{{ $t('tour.fields.description') }}</label>
                <MultiLangInput
                  v-model="form.description"
                  :languages="B2C_LANGUAGES"
                  type="textarea"
                  :rows="4"
                />
              </div>
            </div>
          </div>

          <!-- Destination -->
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <h3 class="text-lg font-medium mb-4">{{ $t('tour.fields.destination') }}</h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="form-label">{{ $t('tour.fields.country') }}</label>
                <input v-model="form.destination.country" type="text" class="form-input" />
              </div>
              <div>
                <label class="form-label">{{ $t('tour.fields.city') }}</label>
                <input v-model="form.destination.city" type="text" class="form-input" />
              </div>
              <div>
                <label class="form-label">{{ $t('tour.fields.region') }}</label>
                <input v-model="form.destination.region" type="text" class="form-input" />
              </div>
            </div>
          </div>

          <!-- Duration -->
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <h3 class="text-lg font-medium mb-4">{{ $t('tour.fields.duration') }}</h3>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label class="form-label">{{ $t('tour.fields.nights') }}</label>
                <input
                  v-model.number="form.duration.nights"
                  type="number"
                  min="0"
                  class="form-input"
                  @input="onNightsChange"
                />
              </div>
              <div>
                <label class="form-label">{{ $t('tour.fields.days') }}</label>
                <input
                  v-model.number="form.duration.days"
                  type="number"
                  min="1"
                  class="form-input"
                  :class="{ 'ring-2 ring-amber-400': form.duration.days !== form.duration.nights + 1 }"
                />
                <p v-if="form.duration.days !== form.duration.nights + 1" class="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {{ $t('tour.durationMismatch') || 'Genellikle gün = gece + 1 olmalıdır' }}
                </p>
              </div>
              <div class="md:col-span-2 flex items-end pb-2">
                <span class="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
                  <span class="material-icons text-sm align-middle mr-1">info</span>
                  {{ form.duration.nights }} {{ $t('tour.fields.nights') }}, {{ form.duration.days }} {{ $t('tour.fields.days') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Status & Visibility -->
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <h3 class="text-lg font-medium mb-4">{{ $t('tour.tabs.settings') }}</h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="form-label">{{ $t('tour.fields.status') }}</label>
                <select v-model="form.status" class="form-input">
                  <option value="draft">{{ $t('tour.statuses.draft') }}</option>
                  <option value="active">{{ $t('tour.statuses.active') }}</option>
                  <option value="inactive">{{ $t('tour.statuses.inactive') }}</option>
                </select>
              </div>
              <div>
                <label class="form-label">{{ $t('tour.fields.displayOrder') }}</label>
                <input v-model.number="form.displayOrder" type="number" class="form-input" />
              </div>
              <div class="flex items-center pt-6 gap-6">
                <label class="flex items-center cursor-pointer">
                  <input v-model="form.isFeatured" type="checkbox" class="form-checkbox mr-2" />
                  <span>{{ $t('tour.fields.featured') }}</span>
                </label>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <h4 class="font-medium mb-3">{{ $t('tour.visibility.title') }}</h4>
              <div class="flex gap-6">
                <label class="flex items-center cursor-pointer">
                  <input v-model="form.visibility.b2c" type="checkbox" class="form-checkbox mr-2" />
                  <span>{{ $t('tour.visibility.b2c') }}</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input v-model="form.visibility.b2b" type="checkbox" class="form-checkbox mr-2" />
                  <span>{{ $t('tour.visibility.b2b') }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Itinerary Tab -->
        <div v-show="activeTab === 'itinerary'" class="max-w-4xl">
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium">{{ $t('tour.itinerary.title') }}</h3>
              <button class="btn-outline btn-sm" @click="addItineraryDay">
                <span class="material-icons mr-1">add</span>
                {{ $t('tour.itinerary.addDay') }}
              </button>
            </div>

            <div v-if="form.itinerary.length === 0" class="text-center py-12 text-gray-500">
              <span class="material-icons text-4xl mb-2">route</span>
              <p>{{ $t('tour.itinerary.title') }}</p>
              <button class="btn-primary mt-4" @click="addItineraryDay">
                {{ $t('tour.itinerary.addDay') }}
              </button>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="(day, index) in form.itinerary"
                :key="index"
                class="border border-gray-200 dark:border-slate-700 rounded-lg p-4"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                    {{ $t('tour.itinerary.day') }} {{ day.day }}
                  </span>
                  <button
                    class="text-red-500 hover:text-red-700"
                    @click="removeItineraryDay(index)"
                  >
                    <span class="material-icons">delete</span>
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="md:col-span-2">
                    <label class="form-label">{{ $t('tour.itinerary.dayTitle') }}</label>
                    <MultiLangInput v-model="day.title" :languages="B2C_LANGUAGES" />
                  </div>
                  <div class="md:col-span-2">
                    <label class="form-label">{{ $t('tour.itinerary.dayDescription') }}</label>
                    <MultiLangInput v-model="day.description" :languages="B2C_LANGUAGES" type="textarea" :rows="3" />
                  </div>
                  <div>
                    <label class="form-label">{{ $t('tour.itinerary.meals') }}</label>
                    <div class="flex gap-4">
                      <label class="flex items-center">
                        <input v-model="day.meals.breakfast" type="checkbox" class="form-checkbox mr-2" />
                        {{ $t('tour.itinerary.breakfast') }}
                      </label>
                      <label class="flex items-center">
                        <input v-model="day.meals.lunch" type="checkbox" class="form-checkbox mr-2" />
                        {{ $t('tour.itinerary.lunch') }}
                      </label>
                      <label class="flex items-center">
                        <input v-model="day.meals.dinner" type="checkbox" class="form-checkbox mr-2" />
                        {{ $t('tour.itinerary.dinner') }}
                      </label>
                    </div>
                  </div>
                  <div>
                    <label class="form-label">{{ $t('tour.itinerary.overnight') }}</label>
                    <input v-model="day.overnight" type="text" class="form-input" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Transportation Tab -->
        <div v-show="activeTab === 'transportation'" class="max-w-4xl">
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium">{{ $t('tour.transportation.title') }}</h3>
              <button class="btn-outline btn-sm" @click="addTransportation">
                <span class="material-icons mr-1">add</span>
                {{ $t('tour.transportation.add') }}
              </button>
            </div>

            <div v-if="form.transportation.length === 0" class="text-center py-12 text-gray-500">
              <span class="material-icons text-4xl mb-2">commute</span>
              <p>{{ $t('tour.transportation.title') }}</p>
              <button class="btn-primary mt-4" @click="addTransportation">
                {{ $t('tour.transportation.add') }}
              </button>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="(transport, index) in form.transportation"
                :key="index"
                class="border border-gray-200 dark:border-slate-700 rounded-lg p-4"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="material-icons text-2xl" :class="getTransportIcon(transport.type).class">
                    {{ getTransportIcon(transport.type).icon }}
                  </span>
                  <button class="text-red-500 hover:text-red-700" @click="removeTransportation(index)">
                    <span class="material-icons">delete</span>
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label class="form-label">{{ $t('tour.transportation.type') }}</label>
                    <select v-model="transport.type" class="form-input">
                      <option v-for="type in transportTypes" :key="type.value" :value="type.value">
                        {{ $t(type.label) }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="form-label">{{ $t('tour.transportation.direction') }}</label>
                    <select v-model="transport.direction" class="form-input">
                      <option value="outbound">{{ $t('tour.transportation.outbound') }}</option>
                      <option value="return">{{ $t('tour.transportation.return') }}</option>
                      <option value="internal">{{ $t('tour.transportation.internal') }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="form-label">{{ $t('tour.transportation.carrier') }}</label>
                    <input v-model="transport.carrier" type="text" class="form-input" />
                  </div>
                  <div>
                    <label class="form-label">{{ $t('tour.transportation.class') }}</label>
                    <select v-model="transport.class" class="form-input">
                      <option value="economy">{{ $t('tour.transportClass.economy') }}</option>
                      <option value="business">{{ $t('tour.transportClass.business') }}</option>
                      <option value="standard">{{ $t('tour.transportClass.standard') }}</option>
                      <option value="vip">{{ $t('tour.transportClass.vip') }}</option>
                    </select>
                  </div>
                  <div class="md:col-span-4 flex items-center">
                    <label class="flex items-center cursor-pointer">
                      <input v-model="transport.isIncluded" type="checkbox" class="form-checkbox mr-2" />
                      {{ $t('tour.transportation.included') }}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Accommodations Tab -->
        <div v-show="activeTab === 'accommodations'" class="max-w-4xl">
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium">{{ $t('tour.accommodation.title') }}</h3>
              <button class="btn-outline btn-sm" @click="addAccommodation">
                <span class="material-icons mr-1">add</span>
                {{ $t('tour.accommodation.add') }}
              </button>
            </div>

            <div v-if="form.accommodations.length === 0" class="text-center py-12 text-gray-500">
              <span class="material-icons text-4xl mb-2">hotel</span>
              <p>{{ $t('tour.accommodation.title') }}</p>
              <button class="btn-primary mt-4" @click="addAccommodation">
                {{ $t('tour.accommodation.add') }}
              </button>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="(acc, index) in form.accommodations"
                :key="index"
                class="border border-gray-200 dark:border-slate-700 rounded-lg p-4"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="text-sm font-medium text-gray-500">
                    {{ $t('tour.accommodation.title') }} {{ index + 1 }}
                  </span>
                  <button class="text-red-500 hover:text-red-700" @click="removeAccommodation(index)">
                    <span class="material-icons">delete</span>
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="md:col-span-2">
                    <label class="form-label">{{ $t('tour.accommodation.hotelName') }}</label>
                    <input v-model="acc.hotelName" type="text" class="form-input" />
                  </div>
                  <div>
                    <label class="form-label">{{ $t('tour.accommodation.starRating') }}</label>
                    <select v-model.number="acc.starRating" class="form-input">
                      <option :value="3">3 Star</option>
                      <option :value="4">4 Star</option>
                      <option :value="5">5 Star</option>
                    </select>
                  </div>
                  <div>
                    <label class="form-label">{{ $t('tour.accommodation.nights') }}</label>
                    <input v-model.number="acc.nights" type="number" min="1" class="form-input" />
                  </div>
                  <div>
                    <label class="form-label">{{ $t('tour.accommodation.mealPlan') }}</label>
                    <select v-model="acc.mealPlan" class="form-input">
                      <option v-for="plan in mealPlans" :key="plan.value" :value="plan.value">
                        {{ $t(plan.label) }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="form-label">{{ $t('tour.accommodation.roomType') }}</label>
                    <input v-model="acc.roomType" type="text" class="form-input" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Inclusions/Exclusions Tab -->
        <div v-show="activeTab === 'extras'" class="max-w-4xl space-y-6">
          <!-- Inclusions -->
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium">{{ $t('tour.inclusions.title') }}</h3>
              <button class="btn-outline btn-sm" @click="addInclusion">
                <span class="material-icons mr-1">add</span>
                {{ $t('tour.inclusions.add') }}
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(item, index) in form.inclusions"
                :key="index"
                class="flex items-start gap-3"
              >
                <span class="material-icons text-green-500 mt-2">check_circle</span>
                <div class="flex-1">
                  <MultiLangInput v-model="form.inclusions[index]" :languages="B2C_LANGUAGES" />
                </div>
                <button class="text-red-500 hover:text-red-700 mt-2" @click="removeInclusion(index)">
                  <span class="material-icons">close</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Exclusions -->
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium">{{ $t('tour.exclusions.title') }}</h3>
              <button class="btn-outline btn-sm" @click="addExclusion">
                <span class="material-icons mr-1">add</span>
                {{ $t('tour.exclusions.add') }}
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(item, index) in form.exclusions"
                :key="index"
                class="flex items-start gap-3"
              >
                <span class="material-icons text-red-500 mt-2">cancel</span>
                <div class="flex-1">
                  <MultiLangInput v-model="form.exclusions[index]" :languages="B2C_LANGUAGES" />
                </div>
                <button class="text-red-500 hover:text-red-700 mt-2" @click="removeExclusion(index)">
                  <span class="material-icons">close</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Departures Tab (only for existing tours) -->
        <div v-show="activeTab === 'departures'" class="max-w-6xl">
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium">{{ $t('departure.title') }}</h3>
              <button v-if="!isNew" class="btn-primary" @click="goToDepartures">
                <span class="material-icons mr-2">calendar_month</span>
                {{ $t('departure.calendar') }}
              </button>
            </div>

            <div v-if="isNew" class="text-center py-12 text-gray-500">
              <span class="material-icons text-4xl mb-2">info</span>
              <p>{{ $t('common.saveFirst') || 'Save the tour first to manage departures' }}</p>
            </div>

            <div v-else-if="departures.length === 0" class="text-center py-12 text-gray-500">
              <span class="material-icons text-4xl mb-2">event</span>
              <p>{{ $t('departure.noDepartures') }}</p>
              <button class="btn-primary mt-4" @click="goToDepartures">
                {{ $t('departure.createFirst') }}
              </button>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-slate-700">
                    <th class="text-left py-3 px-4 font-medium text-gray-500">{{ $t('departure.fields.departureDate') }}</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-500">{{ $t('departure.fields.returnDate') }}</th>
                    <th class="text-center py-3 px-4 font-medium text-gray-500">{{ $t('departure.capacity.available') }}</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-500">{{ $t('departure.fields.status') }}</th>
                    <th class="text-right py-3 px-4 font-medium text-gray-500">{{ $t('departure.fields.price') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="dep in departures"
                    :key="dep._id"
                    class="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                  >
                    <td class="py-3 px-4">{{ formatDate(dep.departureDate) }}</td>
                    <td class="py-3 px-4">{{ formatDate(dep.returnDate) }}</td>
                    <td class="py-3 px-4 text-center">
                      <span class="font-medium">{{ dep.capacity?.available || 0 }}</span>
                      <span class="text-gray-500"> / {{ dep.capacity?.total || 0 }}</span>
                    </td>
                    <td class="py-3 px-4">
                      <span class="px-2 py-1 rounded-full text-xs font-medium" :class="getDepartureStatusClass(dep.status)">
                        {{ $t(`departure.departureStatuses.${dep.status}`) }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right font-medium">
                      {{ formatCurrency(dep.pricing?.adult?.double, dep.currency) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useTourStore } from '@/stores/tour'
import { getTourTypes, getTransportationTypes, getMealPlans } from '@/services/tourService'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import { formatCurrency } from '@booking-engine/utils'
import { B2C_LANGUAGES } from '@/constants/languages'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const toast = useToast()
const tourStore = useTourStore()

// State
const isLoading = ref(false)
const isSaving = ref(false)
const activeTab = ref('basic')

// Data
const tourTypes = getTourTypes()
const transportTypes = getTransportationTypes()
const mealPlans = getMealPlans()

// Computed
const isNew = computed(() => route.name === 'tour-new' || route.params.id === 'new')
const departures = computed(() => tourStore.departures)

// Form
const form = ref({
  code: '',
  name: { tr: '', en: '' },
  shortDescription: { tr: '', en: '' },
  description: { tr: '', en: '' },
  tourType: 'package',
  destination: {
    country: '',
    city: '',
    region: ''
  },
  duration: {
    nights: 0,
    days: 1
  },
  transportation: [],
  accommodations: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  images: [],
  isFeatured: false,
  displayOrder: 0,
  status: 'draft',
  visibility: {
    b2c: true,
    b2b: true
  }
})

// Tabs
const tabs = computed(() => {
  const baseTabs = [
    { key: 'basic', label: t('tour.tabs.basic'), icon: 'info' },
    { key: 'itinerary', label: t('tour.tabs.itinerary'), icon: 'route' },
    { key: 'transportation', label: t('tour.tabs.transportation'), icon: 'commute' },
    { key: 'accommodations', label: t('tour.tabs.accommodations'), icon: 'hotel' },
    { key: 'extras', label: t('tour.tabs.extras'), icon: 'playlist_add' }
  ]

  if (!isNew.value) {
    baseTabs.push({ key: 'departures', label: t('departure.departures'), icon: 'event' })
  }

  return baseTabs
})

// Methods
const getLocalizedName = (name) => {
  if (!name) return ''
  return name[locale.value] || name.tr || name.en || ''
}

// Generate tour code automatically
const generateTourCode = () => {
  const prefix = 'TUR'
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  form.value.code = `${prefix}${timestamp}${random}`
}

// Auto-sync days when nights change
const onNightsChange = () => {
  if (form.value.duration.nights >= 0) {
    form.value.duration.days = form.value.duration.nights + 1
  }
}

const getTransportIcon = (type) => {
  const icons = {
    flight: { icon: 'flight', class: 'text-blue-500' },
    bus: { icon: 'directions_bus', class: 'text-orange-500' },
    ferry: { icon: 'directions_boat', class: 'text-cyan-500' },
    car: { icon: 'directions_car', class: 'text-purple-500' },
    train: { icon: 'train', class: 'text-green-500' },
    combined: { icon: 'multiple_stop', class: 'text-gray-500' }
  }
  return icons[type] || { icon: 'help', class: 'text-gray-400' }
}

const getDepartureStatusClass = (status) => {
  const classes = {
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    completed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    sold_out: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  }
  return classes[status] || classes.scheduled
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value, { day: '2-digit', month: 'short', year: 'numeric' })
}

// Itinerary Methods
const addItineraryDay = () => {
  form.value.itinerary.push({
    day: form.value.itinerary.length + 1,
    title: { tr: '', en: '' },
    description: { tr: '', en: '' },
    meals: { breakfast: false, lunch: false, dinner: false },
    activities: [],
    overnight: ''
  })
}

const removeItineraryDay = (index) => {
  form.value.itinerary.splice(index, 1)
  // Renumber days
  form.value.itinerary.forEach((day, i) => {
    day.day = i + 1
  })
}

// Transportation Methods
const addTransportation = () => {
  form.value.transportation.push({
    type: 'flight',
    direction: 'outbound',
    carrier: '',
    class: 'economy',
    isIncluded: true,
    sequence: form.value.transportation.length + 1
  })
}

const removeTransportation = (index) => {
  form.value.transportation.splice(index, 1)
}

// Accommodation Methods
const addAccommodation = () => {
  form.value.accommodations.push({
    hotelName: '',
    nights: 1,
    mealPlan: 'bed_breakfast',
    starRating: 4,
    roomType: ''
  })
}

const removeAccommodation = (index) => {
  form.value.accommodations.splice(index, 1)
}

// Inclusion/Exclusion Methods
const addInclusion = () => {
  form.value.inclusions.push({ tr: '', en: '' })
}

const removeInclusion = (index) => {
  form.value.inclusions.splice(index, 1)
}

const addExclusion = () => {
  form.value.exclusions.push({ tr: '', en: '' })
}

const removeExclusion = (index) => {
  form.value.exclusions.splice(index, 1)
}

// Navigation
const goBack = () => {
  router.push('/tours')
}

const goToDepartures = () => {
  router.push(`/tours/${route.params.id}/departures`)
}

// Save
const saveTour = async () => {
  isSaving.value = true
  try {
    if (isNew.value) {
      const newTour = await tourStore.createTour(form.value)
      router.replace(`/tours/${newTour._id}`)
    } else {
      await tourStore.updateTour(route.params.id, form.value)
    }
  } catch (error) {
    console.error('Save error:', error)
  } finally {
    isSaving.value = false
  }
}

// Duplicate
const duplicateTour = async () => {
  try {
    const newTour = await tourStore.duplicateTour(route.params.id)
    router.push(`/tours/${newTour._id}`)
  } catch (error) {
    console.error('Duplicate error:', error)
  }
}

// Load Tour
const loadTour = async () => {
  if (isNew.value) return

  isLoading.value = true
  try {
    const tour = await tourStore.fetchTour(route.params.id)
    if (tour) {
      // Map tour data to form
      Object.keys(form.value).forEach(key => {
        if (tour[key] !== undefined) {
          form.value[key] = tour[key]
        }
      })

      // Load departures
      await tourStore.fetchDepartures(route.params.id)
    }
  } catch (error) {
    console.error('Load error:', error)
  } finally {
    isLoading.value = false
  }
}

// Watch for route changes
watch(() => route.params.id, () => {
  loadTour()
})

// Apply AI imported data to form
const applyAIData = (data) => {
  if (!data) return

  // Basic fields
  if (data.code) form.value.code = data.code
  if (data.name) form.value.name = data.name
  if (data.shortDescription) form.value.shortDescription = data.shortDescription
  if (data.description) form.value.description = data.description
  if (data.tourType) form.value.tourType = data.tourType

  // Destination
  if (data.destination) {
    form.value.destination = {
      country: data.destination.country || '',
      city: data.destination.city || '',
      region: data.destination.region || ''
    }
  }

  // Duration
  if (data.duration) {
    form.value.duration = {
      nights: data.duration.nights || 0,
      days: data.duration.days || 1
    }
  }

  // Transportation
  if (data.transportation?.length) {
    form.value.transportation = data.transportation.map((t, idx) => ({
      type: t.type || 'flight',
      direction: 'outbound',
      carrier: t.carrier || '',
      class: t.class || 'economy',
      isIncluded: t.isIncluded !== false,
      sequence: idx + 1
    }))
  }

  // Accommodations
  if (data.accommodations?.length) {
    form.value.accommodations = data.accommodations.map((a, idx) => ({
      hotelName: a.hotelName || '',
      nights: a.nights || 1,
      mealPlan: a.mealPlanCode?.toLowerCase().replace(/-/g, '_') || 'bed_breakfast',
      starRating: a.starRating || 4,
      isMain: idx === 0
    }))
  }

  // Itinerary
  if (data.itinerary?.length) {
    form.value.itinerary = data.itinerary.map(day => ({
      day: day.day || 1,
      title: day.title || { tr: '', en: '' },
      description: day.description || { tr: '', en: '' },
      meals: {
        breakfast: day.meals?.includes('breakfast') || false,
        lunch: day.meals?.includes('lunch') || false,
        dinner: day.meals?.includes('dinner') || false
      },
      activities: day.activities || [],
      overnight: day.accommodation || ''
    }))
  }

  // Inclusions
  if (data.inclusions?.length) {
    form.value.inclusions = data.inclusions.map(item => {
      if (typeof item === 'object' && item.tr !== undefined) {
        return item
      }
      return { tr: String(item), en: '' }
    })
  }

  // Exclusions
  if (data.exclusions?.length) {
    form.value.exclusions = data.exclusions.map(item => {
      if (typeof item === 'object' && item.tr !== undefined) {
        return item
      }
      return { tr: String(item), en: '' }
    })
  }
}

// Lifecycle
onMounted(() => {
  loadTour()

  // Check for AI imported data
  if (route.query.ai === 'true') {
    const aiData = sessionStorage.getItem('aiTourData')
    if (aiData) {
      try {
        const parsedData = JSON.parse(aiData)
        applyAIData(parsedData)
        sessionStorage.removeItem('aiTourData')
        toast.success(t('tour.aiImport.success'))
      } catch (error) {
        console.error('Failed to parse AI data:', error)
      }
    }
  }
})
</script>
