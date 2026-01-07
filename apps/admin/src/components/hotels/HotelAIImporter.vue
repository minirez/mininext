<template>
  <Modal :model-value="show" :title="$t('hotels.aiImport.title')" size="xl" @close="$emit('close')">
    <!-- Step 1: Input Source -->
    <div v-if="step === 'input'" class="space-y-6">
      <!-- Input Type Tabs -->
      <div class="flex border-b border-gray-200 dark:border-slate-700">
        <button
          v-for="tab in inputTabs"
          :key="tab.id"
          type="button"
          class="px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors"
          :class="
            inputType === tab.id
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
          "
          @click="inputType = tab.id"
        >
          <span class="material-icons text-lg mr-2 align-middle">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>

      <!-- Text Input -->
      <div v-if="inputType === 'text'" class="space-y-4">
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('hotels.aiImport.textDesc') }}
        </p>
        <textarea
          v-model="textContent"
          rows="12"
          class="form-input w-full font-mono text-sm"
          :placeholder="$t('hotels.aiImport.textPlaceholder')"
        ></textarea>
      </div>

      <!-- URL Input -->
      <div v-if="inputType === 'url'" class="space-y-4">
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('hotels.aiImport.urlDesc') }}
        </p>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <span class="material-icons text-xl">link</span>
          </span>
          <input
            v-model="urlInput"
            type="url"
            class="form-input pl-10 w-full"
            :placeholder="$t('hotels.aiImport.urlPlaceholder')"
          />
        </div>
        <p class="text-xs text-gray-400 dark:text-slate-500">
          {{ $t('hotels.aiImport.urlHint') }}
        </p>
      </div>

      <!-- PDF Upload -->
      <div v-if="inputType === 'pdf'" class="space-y-4">
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('hotels.aiImport.pdfDesc') }}
        </p>
        <div
          class="border-2 border-dashed rounded-xl p-8 text-center transition-colors"
          :class="
            isDragging
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-300 dark:border-slate-600 hover:border-purple-400'
          "
          @drop.prevent="handleFileDrop"
          @dragover.prevent
          @dragenter.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".pdf"
            class="hidden"
            @change="handleFileSelect"
          />

          <div v-if="!pdfFile" class="space-y-3">
            <span class="material-icons text-4xl text-gray-400">picture_as_pdf</span>
            <p class="text-gray-600 dark:text-slate-400">
              {{ $t('hotels.aiImport.dropPdf') }}
            </p>
            <button type="button" class="btn-secondary" @click="$refs.fileInput.click()">
              {{ $t('hotels.aiImport.selectFile') }}
            </button>
          </div>

          <div v-else class="flex items-center justify-center gap-3">
            <span class="material-icons text-2xl text-red-500">picture_as_pdf</span>
            <span class="text-gray-700 dark:text-slate-300">{{ pdfFile.name }}</span>
            <button
              type="button"
              class="p-1 text-gray-400 hover:text-red-500"
              @click="pdfFile = null"
            >
              <span class="material-icons text-lg">close</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: Loading with Progress -->
    <ExtractionProgress
      v-else-if="step === 'loading'"
      :progress="progress"
      :elapsed-time="elapsedTime"
    />

    <!-- Step 3: Preview Results -->
    <div v-else-if="step === 'preview'" class="space-y-6">
      <!-- Success Header -->
      <div class="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
        <span class="material-icons text-2xl text-green-600 dark:text-green-400">check_circle</span>
        <div>
          <h4 class="font-semibold text-green-800 dark:text-green-300">
            {{ $t('hotels.aiImport.extractionComplete') }}
          </h4>
          <p class="text-sm text-green-600 dark:text-green-400">
            {{ $t('hotels.aiImport.reviewBeforeSave') }}
          </p>
        </div>
      </div>

      <!-- Extracted Data Preview -->
      <div class="max-h-[400px] overflow-y-auto space-y-4">
        <!-- Hotel Name -->
        <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">
              {{ $t('hotels.name') }}
            </label>
            <ConfidenceBadge :score="extractedData?.confidence?.name" />
          </div>
          <input v-model="extractedData.name" type="text" class="form-input w-full" />
        </div>

        <!-- Stars & Category -->
        <div class="grid grid-cols-2 gap-4">
          <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">
                {{ $t('hotels.stars') }}
              </label>
              <ConfidenceBadge :score="extractedData?.confidence?.stars" />
            </div>
            <select v-model="extractedData.stars" class="form-input w-full">
              <option v-for="n in 5" :key="n" :value="n">{{ n }} {{ $t('hotels.stars') }}</option>
            </select>
          </div>
          <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">
                {{ $t('hotels.category') }}
              </label>
            </div>
            <select v-model="extractedData.category" class="form-input w-full">
              <option value="economy">{{ $t('hotels.categories.economy') }}</option>
              <option value="standard">{{ $t('hotels.categories.standard') }}</option>
              <option value="superior">{{ $t('hotels.categories.superior') }}</option>
              <option value="deluxe">{{ $t('hotels.categories.deluxe') }}</option>
              <option value="luxury">{{ $t('hotels.categories.luxury') }}</option>
              <option value="ultra-luxury">{{ $t('hotels.categories.ultra-luxury') }}</option>
            </select>
          </div>
        </div>

        <!-- Address -->
        <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">
              {{ $t('hotels.address.title') }}
            </label>
            <ConfidenceBadge :score="extractedData?.confidence?.address" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <input
              v-model="extractedData.address.city"
              type="text"
              class="form-input"
              :placeholder="$t('hotels.address.city')"
            />
            <input
              v-model="extractedData.address.country"
              type="text"
              class="form-input"
              :placeholder="$t('hotels.address.country')"
            />
            <input
              v-model="extractedData.address.district"
              type="text"
              class="form-input"
              :placeholder="$t('hotels.address.district')"
            />
            <input
              v-model="extractedData.address.street"
              type="text"
              class="form-input"
              :placeholder="$t('hotels.address.street')"
            />
          </div>
        </div>

        <!-- Contact -->
        <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">
              {{ $t('hotels.contact.title') }}
            </label>
            <ConfidenceBadge :score="extractedData?.confidence?.contact" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <input
              v-model="extractedData.contact.phone"
              type="text"
              class="form-input"
              :placeholder="$t('hotels.contact.phone')"
            />
            <input
              v-model="extractedData.contact.email"
              type="email"
              class="form-input"
              :placeholder="$t('hotels.contact.email')"
            />
            <input
              v-model="extractedData.contact.website"
              type="url"
              class="form-input col-span-2"
              :placeholder="$t('hotels.contact.website')"
            />
          </div>
        </div>

        <!-- Description -->
        <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">
              {{ $t('hotels.description') }} (TR)
            </label>
            <ConfidenceBadge :score="extractedData?.confidence?.description" />
          </div>
          <textarea
            v-model="extractedData.description.tr"
            rows="3"
            class="form-input w-full"
          ></textarea>
        </div>

        <!-- Coordinates -->
        <div
          v-if="extractedData.address?.coordinates?.lat"
          class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
        >
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">
              {{ $t('hotels.address.coordinates') }}
            </label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">Lat:</span>
              <input
                v-model="extractedData.address.coordinates.lat"
                type="number"
                step="any"
                class="form-input flex-1"
              />
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">Lng:</span>
              <input
                v-model="extractedData.address.coordinates.lng"
                type="number"
                step="any"
                class="form-input flex-1"
              />
            </div>
          </div>
        </div>

        <!-- Room Config -->
        <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">
              {{ $t('hotels.basic.roomConfig') }}
            </label>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="text-xs text-gray-500">{{ $t('hotels.basic.totalRooms') }}</label>
              <input
                v-model="extractedData.roomConfig.totalRooms"
                type="number"
                class="form-input w-full"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500">{{ $t('hotels.basic.floors') }}</label>
              <input
                v-model="extractedData.roomConfig.floors"
                type="number"
                class="form-input w-full"
              />
            </div>
            <div class="flex items-end">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="extractedData.roomConfig.hasElevator"
                  type="checkbox"
                  class="mr-2"
                />
                <span class="text-sm">{{ $t('hotels.basic.hasElevator') }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Amenities -->
        <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">
              {{ $t('hotels.amenities.title') }} ({{ extractedData.amenities?.length || 0 }})
            </label>
            <ConfidenceBadge :score="extractedData?.confidence?.amenities" />
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="amenity in extractedData.amenities"
              :key="amenity"
              class="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
            >
              {{ $t(`hotels.amenities.${amenity}`) }}
            </span>
            <span v-if="!extractedData.amenities?.length" class="text-gray-400 text-sm">
              {{ $t('hotels.aiImport.noAmenities') }}
            </span>
          </div>
        </div>

        <!-- Extracted Images -->
        <div
          v-if="extractedData.images?.length || extractedData.logo"
          class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
        >
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">
              {{ $t('hotels.aiImport.extractedImages') }} ({{ extractedData.images?.length || 0 }})
            </label>
            <ConfidenceBadge :score="extractedData?.confidence?.images" />
          </div>

          <!-- Logo -->
          <div v-if="extractedData.logo" class="mb-4">
            <p class="text-xs text-gray-500 mb-2">{{ $t('hotels.basic.logo') }}</p>
            <div class="flex items-center gap-3">
              <img
                :src="extractedData.logo"
                alt="Hotel Logo"
                class="h-12 max-w-[150px] object-contain bg-white rounded border p-1"
                @error="handleImageError($event, 'logo')"
              />
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input v-model="importLogo" type="checkbox" class="rounded" />
                <span>{{ $t('hotels.aiImport.importLogo') }}</span>
              </label>
            </div>
          </div>

          <!-- Image Grid -->
          <div v-if="extractedData.images?.length" class="grid grid-cols-4 gap-2">
            <div
              v-for="(img, idx) in extractedData.images.slice(0, 12)"
              :key="idx"
              class="relative aspect-video bg-gray-200 dark:bg-slate-600 rounded overflow-hidden group"
            >
              <img
                :src="img.url"
                :alt="img.alt || `Image ${idx + 1}`"
                class="w-full h-full object-cover"
                @error="handleImageError($event, idx)"
              />
              <div
                class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <span class="text-white text-xs px-2 py-1 bg-black/50 rounded">
                  {{ img.category || 'other' }}
                </span>
              </div>
              <button
                type="button"
                class="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                @click="removeImage(idx)"
              >
                <span class="material-icons text-xs">close</span>
              </button>
            </div>
          </div>
          <p v-if="extractedData.images?.length > 12" class="text-xs text-gray-500 mt-2">
            +{{ extractedData.images.length - 12 }} {{ $t('hotels.aiImport.moreImages') }}
          </p>

          <!-- Import Images Checkbox -->
          <label class="flex items-center gap-2 mt-3 text-sm cursor-pointer">
            <input v-model="importImages" type="checkbox" class="rounded" />
            <span
              >{{ $t('hotels.aiImport.importImages') }} ({{
                extractedData.images?.length || 0
              }})</span
            >
          </label>
        </div>

        <!-- Room Templates -->
        <div
          v-if="extractedData.roomTemplates?.length"
          class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl"
        >
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              {{ $t('hotels.aiImport.roomTemplates') }} ({{
                extractedData.roomTemplates?.length || 0
              }})
            </label>
            <ConfidenceBadge :score="extractedData?.confidence?.roomTemplates" />
          </div>

          <div class="space-y-2 max-h-60 overflow-y-auto">
            <div
              v-for="room in extractedData.roomTemplates"
              :key="room.code"
              class="flex items-center gap-3 p-3 bg-white dark:bg-slate-700 rounded-lg"
            >
              <!-- Room Image Thumbnail -->
              <div
                class="w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-slate-600"
              >
                <img
                  v-if="room.images?.[0]?.url"
                  :src="room.images[0].url"
                  :alt="room.name?.tr || room.code"
                  class="w-full h-full object-cover"
                  @error="$event.target.style.display = 'none'"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <span class="material-icons text-gray-400 dark:text-slate-500"
                    >bedroom_parent</span
                  >
                </div>
              </div>

              <!-- Room Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span
                    class="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-800/30 px-1.5 py-0.5 rounded"
                  >
                    {{ room.code }}
                  </span>
                  <h5 class="font-medium text-sm text-gray-800 dark:text-white truncate">
                    {{ room.name?.tr || room.name?.en || room.code }}
                  </h5>
                </div>
                <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  <span v-if="room.size">{{ room.size }}m²</span>
                  <span v-if="room.size && room.occupancy"> • </span>
                  <span v-if="room.occupancy">
                    {{ room.occupancy.maxAdults }}+{{ room.occupancy.maxChildren }}
                    {{ $t('hotels.roomTemplates.guests') }}
                  </span>
                  <span v-if="room.amenities?.length">
                    • {{ room.amenities.length }} {{ $t('hotels.roomTemplates.amenities') }}</span
                  >
                </p>
              </div>

              <!-- Room Images Count -->
              <div
                v-if="room.images?.length"
                class="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400"
              >
                <span class="material-icons text-sm">photo_library</span>
                {{ room.images.length }}
              </div>
            </div>
          </div>

          <!-- Import Room Templates Checkbox -->
          <label class="flex items-center gap-2 mt-3 text-sm cursor-pointer">
            <input v-model="importRoomTemplates" type="checkbox" class="rounded" />
            <span
              >{{ $t('hotels.aiImport.importRoomTemplates') }} ({{
                extractedData.roomTemplates?.length || 0
              }})</span
            >
          </label>
        </div>

        <!-- Profile Sections Summary -->
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-blue-700 dark:text-blue-300">
              {{ $t('hotels.aiImport.profileSections') }}
            </label>
            <ConfidenceBadge :score="extractedData?.confidence?.profile" />
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              v-if="extractedData.profile?.overview?.content?.tr"
              class="px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded text-xs"
            >
              {{ $t('hotels.profile.sections.overview') }}
            </span>
            <span
              v-if="extractedData.profile?.facilities?.features?.length"
              class="px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded text-xs"
            >
              {{ $t('hotels.profile.sections.facilities') }} ({{
                extractedData.profile.facilities.features.length
              }})
            </span>
            <span
              v-if="extractedData.profile?.dining?.features?.length"
              class="px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded text-xs"
            >
              {{ $t('hotels.profile.sections.dining') }} ({{
                extractedData.profile.dining.features.length
              }})
            </span>
            <span
              v-if="extractedData.profile?.spaWellness?.features?.length"
              class="px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded text-xs"
            >
              {{ $t('hotels.profile.sections.spaWellness') }} ({{
                extractedData.profile.spaWellness.features.length
              }})
            </span>
            <span
              v-if="extractedData.profile?.beachPool?.features?.length"
              class="px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded text-xs"
            >
              {{ $t('hotels.profile.sections.beachPool') }} ({{
                extractedData.profile.beachPool.features.length
              }})
            </span>
            <span
              v-if="extractedData.profile?.familyKids?.features?.length"
              class="px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded text-xs"
            >
              {{ $t('hotels.profile.sections.familyKids') }} ({{
                extractedData.profile.familyKids.features.length
              }})
            </span>
            <span
              v-if="extractedData.profile?.sportsEntertainment?.features?.length"
              class="px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded text-xs"
            >
              {{ $t('hotels.profile.sections.sportsEntertainment') }} ({{
                extractedData.profile.sportsEntertainment.features.length
              }})
            </span>
            <span
              v-if="extractedData.profile?.location?.distances?.length"
              class="px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded text-xs"
            >
              {{ $t('hotels.profile.sections.location') }} ({{
                extractedData.profile.location.distances.length
              }})
            </span>
          </div>
          <p class="text-xs text-blue-600 dark:text-blue-400 mt-2">
            {{ $t('hotels.aiImport.allDataWillBeSaved') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="step === 'error'" class="py-12 text-center">
      <span class="material-icons text-5xl text-red-500 mb-4">error_outline</span>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        {{ $t('hotels.aiImport.extractionFailed') }}
      </h3>
      <p class="text-gray-500 dark:text-slate-400 mb-4">
        {{ errorMessage }}
      </p>
      <button type="button" class="btn-secondary" @click="resetToInput">
        {{ $t('common.tryAgain') }}
      </button>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          @click="$emit('close')"
        >
          {{ $t('common.cancel') }}
        </button>

        <!-- Extract Button (Step 1) -->
        <button
          v-if="step === 'input'"
          type="button"
          :disabled="!canExtract"
          class="btn-primary flex items-center gap-2"
          @click="extractData"
        >
          <span class="material-icons text-lg">auto_awesome</span>
          {{ $t('hotels.aiImport.extract') }}
        </button>

        <!-- Save Button (Step 3) -->
        <button
          v-if="step === 'preview'"
          type="button"
          :disabled="saving"
          class="btn-primary flex items-center gap-2"
          @click="saveHotel"
        >
          <span v-if="saving" class="animate-spin material-icons text-lg">refresh</span>
          <span v-else class="material-icons text-lg">save</span>
          {{ $t('hotels.aiImport.createHotel') }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import ConfidenceBadge from './ConfidenceBadge.vue'
import ExtractionProgress from './ExtractionProgress.vue'
import hotelService from '@/services/hotelService'
import { useExtractionProgress } from '@/composables/useExtractionProgress'
import { initializeExtractedData, prepareHotelDataForSave } from '@/utils/hotelDataInitializer'
import { createLogger } from '@/utils/logger'

const logger = createLogger('HotelAIImporter')

defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'imported'])

const toast = useToast()
const { t } = useI18n()

// Use extraction progress composable
const {
  operationId,
  progress,
  elapsedTime,
  isSocketConnected,
  startElapsedTimer,
  stopElapsedTimer,
  resetProgress,
  startExtraction,
  pollForResult,
  cleanupSocketListeners
} = useExtractionProgress()

// State
const step = ref('input') // input, loading, preview, error
const inputType = ref('text')
const textContent = ref('')
const urlInput = ref('')
const pdfFile = ref(null)
const isDragging = ref(false)
const extractedData = ref(null)
const errorMessage = ref('')
const saving = ref(false)
const importImages = ref(true)
const importLogo = ref(true)
const importRoomTemplates = ref(true)

const inputTabs = [
  { id: 'text', label: t('hotels.aiImport.tabText'), icon: 'notes' },
  { id: 'url', label: t('hotels.aiImport.tabUrl'), icon: 'link' },
  { id: 'pdf', label: t('hotels.aiImport.tabPdf'), icon: 'picture_as_pdf' }
]

const canExtract = computed(() => {
  if (inputType.value === 'text') return textContent.value.trim().length > 50
  if (inputType.value === 'url') return urlInput.value.trim().startsWith('http')
  if (inputType.value === 'pdf') return pdfFile.value !== null
  return false
})

// File handling
const handleFileDrop = e => {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type === 'application/pdf') {
    pdfFile.value = file
  } else {
    toast.error(t('hotels.aiImport.invalidFile'))
  }
}

const handleFileSelect = e => {
  const file = e.target.files[0]
  if (file) {
    pdfFile.value = file
  }
}

// Extract data using AI
const extractData = async () => {
  step.value = 'loading'
  errorMessage.value = ''

  // Reset and start progress tracking
  resetProgress()
  startElapsedTimer()

  try {
    // For URL extraction, use async endpoint with socket progress
    if (inputType.value === 'url') {
      const callbacks = {
        onComplete: async () => {
          try {
            const result = await hotelService.getExtractionResult(operationId.value)
            if (result.success && result.data) {
              extractedData.value = initializeExtractedData(result.data)
              step.value = 'preview'
            } else {
              throw new Error('No extraction data')
            }
          } catch {
            errorMessage.value = t('hotels.aiImport.fetchResultFailed')
            step.value = 'error'
          }
        },
        onFail: data => {
          errorMessage.value = data.error || t('hotels.aiImport.extractionFailed')
          step.value = 'error'
        }
      }

      const result = await startExtraction(urlInput.value, callbacks)

      // If socket is not connected, fall back to polling
      if (!result.isSocketConnected) {
        logger.warn('Socket not connected, falling back to polling')
        const data = await pollForResult(result.operationId, callbacks)
        if (data) {
          extractedData.value = initializeExtractedData(data)
          step.value = 'preview'
        }
      }
      // Otherwise, socket listeners will handle the rest
      return
    }

    // For text and PDF, use synchronous endpoint
    let params = {}

    if (inputType.value === 'text') {
      params = { content: textContent.value, contentType: 'text' }
    } else if (inputType.value === 'pdf') {
      const text = await readFileAsText(pdfFile.value)
      params = { content: text, contentType: 'pdf' }
    }

    const response = await hotelService.aiExtractHotelData(params)

    stopElapsedTimer()
    if (response.success) {
      extractedData.value = initializeExtractedData(response.data)
      step.value = 'preview'
    } else {
      throw new Error(response.error || 'Extraction failed')
    }
  } catch (error) {
    stopElapsedTimer()
    logger.error('AI extraction error:', error)
    errorMessage.value =
      error.response?.data?.message || error.message || t('common.operationFailed')
    step.value = 'error'
  }
}

// Read file as text
const readFileAsText = file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = e => reject(e)
    reader.readAsText(file)
  })
}

// Save as base hotel
const saveHotel = async () => {
  if (!extractedData.value?.name) {
    toast.error(t('hotels.validation.nameRequired'))
    return
  }

  saving.value = true

  try {
    // Prepare data using utility function
    const hotelData = prepareHotelDataForSave(extractedData.value, {
      importImages: importImages.value,
      importLogo: importLogo.value,
      importRoomTemplates: importRoomTemplates.value
    })

    const response = await hotelService.createBaseHotel(hotelData)

    if (response.success) {
      toast.success(t('hotels.aiImport.importSuccess'))
      emit('imported', response.data)
      emit('close')
    }
  } catch (error) {
    logger.error('Save hotel error:', error)
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

// Reset to input step
const resetToInput = () => {
  step.value = 'input'
  errorMessage.value = ''
}

// Handle broken images
const handleImageError = (event, index) => {
  event.target.style.display = 'none'
  if (index === 'logo') {
    extractedData.value.logo = null
  } else if (typeof index === 'number') {
    // Mark image as broken but don't remove from array to preserve indices
    if (extractedData.value.images[index]) {
      extractedData.value.images[index].broken = true
    }
  }
}

// Remove image from list
const removeImage = index => {
  if (extractedData.value?.images) {
    extractedData.value.images.splice(index, 1)
  }
}
</script>
