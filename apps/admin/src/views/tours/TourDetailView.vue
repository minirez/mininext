<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div
      class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4"
    >
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
              {{ form.code }} - {{ getLocalized(form.name) }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button v-if="!isNew" class="btn-outline" @click="duplicateTour">
            <span class="material-icons mr-2">content_copy</span>
            {{ $t('tour.duplicate') }}
          </button>
          <button class="btn-primary" :disabled="isSaving" @click="saveTour">
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
          :class="
            activeTab === tab.key
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
          "
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
        <span class="material-icons animate-spin text-4xl text-primary-500">refresh</span>
      </div>

      <template v-else>
        <!-- Basic -->
        <div v-show="activeTab === 'basic'" class="max-w-4xl space-y-6">
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
          >
            <h3 class="text-lg font-medium mb-4">{{ $t('tour.tabs.basic') }}</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">{{ $t('tour.fields.code') }} *</label>
                <div class="flex gap-2">
                  <input
                    v-model="form.code"
                    type="text"
                    class="form-input uppercase flex-1"
                    :placeholder="$t('tour.fields.code')"
                    maxlength="30"
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

              <div>
                <label class="form-label">{{ $t('tour.fields.status') }}</label>
                <select v-model="form.status" class="form-input">
                  <option value="draft">{{ $t('tour.statuses.draft') }}</option>
                  <option value="active">{{ $t('tour.statuses.active') }}</option>
                  <option value="inactive">{{ $t('tour.statuses.inactive') }}</option>
                  <option value="archived">{{ $t('tour.statuses.archived') }}</option>
                </select>
              </div>

              <div>
                <label class="form-label">{{ $t('tour.fields.tourType') }}</label>
                <select v-model="form.type" class="form-input">
                  <option v-for="opt in tourTypes" :key="opt.value" :value="opt.value">
                    {{ $t(opt.label) }}
                  </option>
                </select>
              </div>

              <div class="md:col-span-2">
                <label class="form-label">{{ $t('tour.fields.name') }} *</label>
                <MultiLangInput
                  v-model="form.name"
                  :languages="B2C_LANGUAGES"
                  :placeholder="$t('tour.fields.name')"
                />
              </div>

              <div>
                <label class="form-label">{{ $t('tour.fields.displayOrder') }}</label>
                <input v-model.number="form.displayOrder" type="number" class="form-input" />
              </div>

              <div class="flex items-center gap-6 pt-6">
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

          <!-- Base Pricing Card -->
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <span
                  class="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center"
                >
                  <span class="material-icons text-green-600 dark:text-green-400">payments</span>
                </span>
                <div>
                  <h3 class="text-lg font-medium">{{ $t('tour.basePricing.title') }}</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ $t('tour.basePricing.description') }}
                  </p>
                </div>
              </div>
              <label class="flex items-center gap-2 cursor-pointer">
                <span class="text-sm text-gray-600 dark:text-gray-400">{{
                  $t('tour.basePricing.detailedPricing')
                }}</span>
                <input v-model="showDetailedPricing" type="checkbox" class="form-checkbox" />
              </label>
            </div>

            <!-- Currency Selection - Compact Cards -->
            <div class="mb-4">
              <label class="form-label mb-2">{{ $t('common.currency') }}</label>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="curr in CURRENCIES"
                  :key="curr.code"
                  type="button"
                  class="relative py-2 px-3 rounded-lg border-2 transition-all text-center"
                  :class="
                    form.basePricing.currency === curr.code
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-slate-600 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  "
                  @click="form.basePricing.currency = curr.code"
                >
                  <div
                    v-if="form.basePricing.currency === curr.code"
                    class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center"
                  >
                    <span class="material-icons text-white text-xs">check</span>
                  </div>
                  <span
                    class="text-lg font-bold"
                    :class="
                      form.basePricing.currency === curr.code
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-400 dark:text-slate-500'
                    "
                  >
                    {{ curr.symbol }}
                  </span>
                  <span
                    class="text-xs font-medium ml-1"
                    :class="
                      form.basePricing.currency === curr.code
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-slate-400'
                    "
                  >
                    {{ curr.code }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Starting Price -->
            <div>
              <label class="form-label">{{ $t('tour.basePricing.startingPrice') }}</label>
              <div class="relative w-1/2">
                <span
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium"
                >
                  {{ getCurrencySymbol(form.basePricing.currency) }}
                </span>
                <input
                  v-model.number="form.basePricing.startingPrice"
                  type="number"
                  min="0"
                  class="form-input pl-8"
                  placeholder="0"
                />
              </div>
            </div>

            <!-- Detailed Accommodation Pricing (Optional) -->
            <div
              v-if="showDetailedPricing"
              class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700 space-y-4"
            >
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t('tour.basePricing.accommodationHint') }}
              </p>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label class="form-label text-xs">{{ $t('tour.basePricing.single') }}</label>
                  <input
                    v-model.number="form.basePricing.accommodationPricing.single"
                    type="number"
                    min="0"
                    class="form-input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label class="form-label text-xs">{{ $t('tour.basePricing.double') }}</label>
                  <input
                    v-model.number="form.basePricing.accommodationPricing.double"
                    type="number"
                    min="0"
                    class="form-input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label class="form-label text-xs">{{ $t('tour.basePricing.triple') }}</label>
                  <input
                    v-model.number="form.basePricing.accommodationPricing.triple"
                    type="number"
                    min="0"
                    class="form-input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label class="form-label text-xs">{{ $t('tour.basePricing.childWithBed') }}</label>
                  <input
                    v-model.number="form.basePricing.accommodationPricing.childWithBed"
                    type="number"
                    min="0"
                    class="form-input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label class="form-label text-xs">{{
                    $t('tour.basePricing.childWithoutBed')
                  }}</label>
                  <input
                    v-model.number="form.basePricing.accommodationPricing.childWithoutBed"
                    type="number"
                    min="0"
                    class="form-input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label class="form-label text-xs">{{ $t('tour.basePricing.infant') }}</label>
                  <input
                    v-model.number="form.basePricing.accommodationPricing.infant"
                    type="number"
                    min="0"
                    class="form-input"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Tags Card -->
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
          >
            <h3 class="text-lg font-medium mb-4">{{ $t('tour.fields.tags') }}</h3>

            <div class="flex gap-2">
              <input
                v-model="tagInput"
                type="text"
                class="form-input flex-1"
                :placeholder="$t('tour.fields.tagsPlaceholder')"
                @keydown.enter.prevent="addTag"
              />
              <button type="button" class="btn-outline" @click="addTag">
                <span class="material-icons mr-2">add</span>
                {{ $t('common.add') }}
              </button>
            </div>

            <div class="flex flex-wrap gap-2 mt-4">
              <span
                v-for="tag in form.tags"
                :key="tag"
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200"
              >
                {{ tag }}
                <button
                  type="button"
                  class="text-gray-400 hover:text-red-500"
                  @click="removeTag(tag)"
                >
                  <span class="material-icons text-sm">close</span>
                </button>
              </span>
              <span v-if="form.tags.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t('tour.fields.noTags') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Schedule -->
        <div v-show="activeTab === 'schedule'" class="max-w-6xl space-y-6">
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium">{{ $t('tour.tabs.schedule') }}</h3>
              <button v-if="!isNew" type="button" class="btn-outline" @click="goToDepartures">
                <span class="material-icons mr-2">calendar_month</span>
                {{ $t('departure.calendar') }}
              </button>
            </div>

            <TourScheduleBuilder
              :tour-id="isNew ? '' : String(route.params.id)"
              @created="onDeparturesCreated"
              @schedule-changed="onScheduleChanged"
            />
          </div>
        </div>

        <!-- Route -->
        <div v-show="activeTab === 'route'" class="max-w-4xl space-y-6">
          <TourRouteEditor
            v-model="form.routePlan"
            :tour-id="isNew ? '' : String(route.params.id)"
          />
        </div>

        <!-- Content -->
        <div v-show="activeTab === 'content'" class="max-w-4xl space-y-6">
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4"
          >
            <h3 class="text-lg font-medium">{{ $t('tour.tabs.content') }}</h3>

            <div>
              <label class="form-label">{{ $t('tour.content.shortDescription') }}</label>
              <MultiLangInput
                v-model="form.content.shortDescription"
                :languages="B2C_LANGUAGES"
                type="textarea"
                :rows="2"
              />
            </div>
            <div>
              <label class="form-label">{{ $t('tour.content.description') }}</label>
              <MultiLangInput
                v-model="form.content.description"
                :languages="B2C_LANGUAGES"
                type="textarea"
                :rows="5"
              />
            </div>
            <div>
              <label class="form-label">{{ $t('tour.content.importantInfo') }}</label>
              <MultiLangInput
                v-model="form.content.importantInfo"
                :languages="B2C_LANGUAGES"
                type="textarea"
                :rows="4"
              />
            </div>
          </div>

          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium">{{ $t('tour.content.included') }}</h3>
              <button type="button" class="btn-outline btn-sm" @click="addIncluded">
                <span class="material-icons mr-1">add</span>
                {{ $t('common.add') }}
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="(item, idx) in form.content.included"
                :key="idx"
                class="flex items-start gap-3"
              >
                <span class="material-icons text-green-500 mt-2">check_circle</span>
                <div class="flex-1">
                  <MultiLangInput v-model="form.content.included[idx]" :languages="B2C_LANGUAGES" />
                </div>
                <button
                  type="button"
                  class="text-red-500 hover:text-red-700 mt-2"
                  @click="removeIncluded(idx)"
                >
                  <span class="material-icons">close</span>
                </button>
              </div>
              <p
                v-if="form.content.included.length === 0"
                class="text-sm text-gray-500 dark:text-gray-400"
              >
                {{ $t('tour.content.noIncluded') }}
              </p>
            </div>
          </div>

          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium">{{ $t('tour.content.excluded') }}</h3>
              <button type="button" class="btn-outline btn-sm" @click="addExcluded">
                <span class="material-icons mr-1">add</span>
                {{ $t('common.add') }}
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="(item, idx) in form.content.excluded"
                :key="idx"
                class="flex items-start gap-3"
              >
                <span class="material-icons text-red-500 mt-2">cancel</span>
                <div class="flex-1">
                  <MultiLangInput v-model="form.content.excluded[idx]" :languages="B2C_LANGUAGES" />
                </div>
                <button
                  type="button"
                  class="text-red-500 hover:text-red-700 mt-2"
                  @click="removeExcluded(idx)"
                >
                  <span class="material-icons">close</span>
                </button>
              </div>
              <p
                v-if="form.content.excluded.length === 0"
                class="text-sm text-gray-500 dark:text-gray-400"
              >
                {{ $t('tour.content.noExcluded') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Gallery -->
        <div v-show="activeTab === 'gallery'" class="max-w-6xl space-y-6">
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
          >
            <TourGalleryUploader
              v-model="form.gallery"
              :tour-id="isNew ? '' : String(route.params.id)"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-4">
              {{ $t('tour.gallery.saveHint') }}
            </p>
          </div>
        </div>

        <!-- Extras -->
        <div v-show="activeTab === 'extras'" class="max-w-4xl space-y-6">
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
          >
            <h3 class="text-lg font-medium mb-2">{{ $t('tour.tabs.extras') }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ $t('tour.extras.manageHint') }}
            </p>
            <div class="mt-4">
              <button type="button" class="btn-outline" @click="goToExtras">
                <span class="material-icons mr-2">extension</span>
                {{ $t('extra.extras') }}
              </button>
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
import { useTourStore } from '@/stores/tour'
import * as tourService from '@/services/tourService'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import TourScheduleBuilder from '@/components/tour/TourScheduleBuilder.vue'
import TourRouteEditor from '@/components/tour/TourRouteEditor.vue'
import TourGalleryUploader from '@/components/tour/TourGalleryUploader.vue'
import { B2C_LANGUAGES } from '@/constants/languages'
import { CURRENCIES } from '@/data/countries'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const tourStore = useTourStore()

const isLoading = ref(false)
const isSaving = ref(false)
const activeTab = ref('basic')
const tagInput = ref('')
const tourTypes = ref([])
const showDetailedPricing = ref(false)
const pendingDepartures = ref([])

const isNew = computed(() => route.name === 'tour-new' || route.params.id === 'new')

const tabs = computed(() => {
  const baseTabs = [
    { key: 'basic', label: t('tour.tabs.basic'), icon: 'info' },
    { key: 'schedule', label: t('tour.tabs.schedule'), icon: 'event' },
    { key: 'route', label: t('tour.tabs.route'), icon: 'route' },
    { key: 'content', label: t('tour.tabs.content'), icon: 'subject' },
    { key: 'gallery', label: t('tour.tabs.gallery'), icon: 'photo_library' }
  ]
  // Only show Extras tab for existing tours, not new ones
  if (!isNew.value) {
    baseTabs.push({ key: 'extras', label: t('tour.tabs.extras'), icon: 'extension' })
  }
  return baseTabs
})

const form = ref(getEmptyForm())

function getEmptyForm() {
  return {
    code: '',
    name: { tr: '', en: '' },
    status: 'draft',
    type: 'other',
    visibility: { b2c: true, b2b: true },
    isFeatured: false,
    displayOrder: 0,
    tags: [],
    basePricing: {
      currency: 'TRY',
      startingPrice: 0,
      accommodationPricing: {
        single: null,
        double: null,
        triple: null,
        childWithBed: null,
        childWithoutBed: null,
        infant: null
      }
    },
    content: {
      shortDescription: { tr: '', en: '' },
      description: { tr: '', en: '' },
      importantInfo: { tr: '', en: '' },
      included: [],
      excluded: []
    },
    routePlan: { mode: 'sequence', stops: [] },
    gallery: []
  }
}

function getLocalized(obj) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj[locale.value] || obj.tr || obj.en || ''
}

function getCurrencySymbol(code) {
  const curr = CURRENCIES.find(c => c.code === code)
  return curr?.symbol || code
}

function generateTourCode() {
  const prefix = 'TOUR'
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  form.value.code = `${prefix}${timestamp}${random}`
}

function addTag() {
  const v = String(tagInput.value || '').trim()
  if (!v) return
  if (!form.value.tags.includes(v)) {
    form.value.tags.push(v)
  }
  tagInput.value = ''
}

function removeTag(tag) {
  form.value.tags = form.value.tags.filter(t => t !== tag)
}

function addIncluded() {
  form.value.content.included.push({ tr: '', en: '' })
}
function removeIncluded(idx) {
  form.value.content.included.splice(idx, 1)
}
function addExcluded() {
  form.value.content.excluded.push({ tr: '', en: '' })
}
function removeExcluded(idx) {
  form.value.content.excluded.splice(idx, 1)
}

function sanitizePayload(data) {
  const payload = JSON.parse(JSON.stringify(data || {}))

  // Remove UI-only fields from route stops
  if (payload.routePlan?.stops?.length) {
    payload.routePlan.stops = payload.routePlan.stops.map(s => {
      const { location, ...rest } = s
      return rest
    })
  }

  // Auto primaryLocation from first stop if not set
  const firstStop = payload.routePlan?.stops?.[0]
  if (firstStop?.locationRef?.refId && firstStop?.locationSnapshot?.name) {
    payload.primaryLocation = {
      type: firstStop.locationRef.type,
      refId: firstStop.locationRef.refId,
      name: firstStop.locationSnapshot.name
    }
  }

  // Normalize gallery orders
  if (Array.isArray(payload.gallery)) {
    payload.gallery = payload.gallery.map((g, idx) => ({ ...g, order: idx + 1 }))
  }

  return payload
}

async function saveTour() {
  isSaving.value = true
  try {
    const payload = sanitizePayload(form.value)
    if (isNew.value) {
      const created = await tourStore.createTour(payload)
      
      // Auto-create departures in background if schedule was defined
      if (pendingDepartures.value.length > 0) {
        try {
          await tourStore.bulkCreateDepartures(created._id, { departures: pendingDepartures.value })
          pendingDepartures.value = []
        } catch (depError) {
          console.error('Failed to create departures:', depError)
          // Don't block tour creation if departures fail
        }
      }
      
      router.replace(`/tours/${created._id}`)
    } else {
      await tourStore.updateTour(route.params.id, payload)
    }
  } finally {
    isSaving.value = false
  }
}

async function duplicateTour() {
  const created = await tourStore.duplicateTour(route.params.id)
  router.push(`/tours/${created._id}`)
}

function goBack() {
  router.push('/tours')
}

function goToDepartures() {
  router.push(`/tours/${route.params.id}/departures`)
}

function goToExtras() {
  router.push('/tours/extras')
}

function onDeparturesCreated() {
  // no-op for now; could show toast via store
}

function onScheduleChanged(departures) {
  pendingDepartures.value = departures || []
}

async function loadTour() {
  if (isNew.value) {
    form.value = getEmptyForm()
    return
  }
  isLoading.value = true
  try {
    const tour = await tourStore.fetchTour(route.params.id)
    const emptyForm = getEmptyForm()
    form.value = {
      ...emptyForm,
      ...tour,
      basePricing: {
        ...emptyForm.basePricing,
        ...(tour?.basePricing || {}),
        accommodationPricing: {
          ...emptyForm.basePricing.accommodationPricing,
          ...(tour?.basePricing?.accommodationPricing || {})
        }
      },
      content: { ...emptyForm.content, ...(tour?.content || {}) },
      routePlan: { ...emptyForm.routePlan, ...(tour?.routePlan || {}) },
      gallery: tour?.gallery || []
    }
    // Show detailed pricing if any accommodation pricing exists
    const accPricing = form.value.basePricing.accommodationPricing
    showDetailedPricing.value = !!(
      accPricing?.single ||
      accPricing?.double ||
      accPricing?.triple ||
      accPricing?.childWithBed ||
      accPricing?.childWithoutBed ||
      accPricing?.infant
    )
  } finally {
    isLoading.value = false
  }
}

watch(
  () => route.params.id,
  () => loadTour()
)

function applyAIData(aiData) {
  if (!aiData) return

  // Map AI extracted data to form structure
  if (aiData.code) form.value.code = aiData.code
  if (aiData.name) form.value.name = { tr: aiData.name?.tr || '', en: aiData.name?.en || '' }
  if (aiData.tourType) form.value.type = aiData.tourType

  // Base Pricing - extract starting price from double occupancy (most common)
  if (aiData.basePricing) {
    const startingPrice =
      aiData.basePricing.startingPrice ||
      aiData.basePricing.adult?.double ||
      aiData.basePricing.adult?.single ||
      0

    // Check if detailed pricing was extracted
    const hasDetailedPricing =
      aiData.basePricing.adult?.single ||
      aiData.basePricing.adult?.double ||
      aiData.basePricing.adult?.triple

    form.value.basePricing = {
      currency: aiData.basePricing.currency || 'TRY',
      startingPrice,
      accommodationPricing: hasDetailedPricing
        ? {
            single: aiData.basePricing.adult?.single || null,
            double: aiData.basePricing.adult?.double || null,
            triple: aiData.basePricing.adult?.triple || null,
            childWithBed: aiData.basePricing.child?.withBed || null,
            childWithoutBed: aiData.basePricing.child?.withoutBed || null,
            infant: aiData.basePricing.infant?.price || null
          }
        : getEmptyForm().basePricing.accommodationPricing
    }

    // Show detailed pricing toggle if AI extracted detailed prices
    if (hasDetailedPricing) {
      showDetailedPricing.value = true
    }
  }

  // Content
  if (aiData.shortDescription) {
    form.value.content.shortDescription = {
      tr: aiData.shortDescription?.tr || '',
      en: aiData.shortDescription?.en || ''
    }
  }
  if (aiData.description) {
    form.value.content.description = {
      tr: aiData.description?.tr || '',
      en: aiData.description?.en || ''
    }
  }

  // Inclusions
  if (Array.isArray(aiData.inclusions) && aiData.inclusions.length > 0) {
    form.value.content.included = aiData.inclusions.map(item => ({
      tr: item?.tr || (typeof item === 'string' ? item : ''),
      en: item?.en || ''
    }))
  }

  // Exclusions
  if (Array.isArray(aiData.exclusions) && aiData.exclusions.length > 0) {
    form.value.content.excluded = aiData.exclusions.map(item => ({
      tr: item?.tr || (typeof item === 'string' ? item : ''),
      en: item?.en || ''
    }))
  }

  // Tags from highlights
  if (Array.isArray(aiData.highlights)) {
    form.value.tags = aiData.highlights
      .map(h => h?.tr || (typeof h === 'string' ? h : ''))
      .filter(Boolean)
      .slice(0, 10)
  }

  // Route stops from itinerary
  if (Array.isArray(aiData.itinerary) && aiData.itinerary.length > 0) {
    form.value.routePlan.stops = aiData.itinerary.map((day, idx) => ({
      sequence: idx + 1,
      locationRef: { type: 'city', refId: null },
      locationSnapshot: {
        name: day.overnight?.tr || day.accommodation || '',
        countryCode: 'TR'
      },
      stay: { unit: 'days', value: 1 },
      title: { tr: day.title?.tr || `Gün ${day.day}`, en: day.title?.en || `Day ${day.day}` },
      description: { tr: day.description?.tr || '', en: day.description?.en || '' },
      tags: day.meals || []
    }))
  }
}

onMounted(() => {
  loadTour()
  tourTypes.value = tourService.getTourTypes()

  // Check for AI imported data
  if (route.query.ai === 'true') {
    const aiDataStr = sessionStorage.getItem('aiTourData')
    if (aiDataStr) {
      try {
        const aiData = JSON.parse(aiDataStr)
        applyAIData(aiData)
        sessionStorage.removeItem('aiTourData')
      } catch (e) {
        console.error('Failed to parse AI data:', e)
      }
    }
  }
})
</script>
