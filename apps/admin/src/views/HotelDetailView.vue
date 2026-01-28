<template>
  <div>
    <!-- Source Selection Modal (for new hotels) -->
    <HotelSourceSelector
      :show="showSourceSelector"
      @close="handleSourceSelectorClose"
      @select="handleSourceSelect"
    />

    <!-- Base Hotel Selection Modal -->
    <HotelBaseSelector
      :show="showBaseSelector"
      @close="showBaseSelector = false"
      @linked="handleBaseLinked"
    />

    <!-- Header with back button and save button -->
    <div class="mb-6 flex items-center justify-between">
      <router-link
        to="/hotels"
        class="inline-flex items-center text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
      >
        <span class="material-icons mr-1">arrow_back</span>
        {{ $t('common.back') }}
      </router-link>

      <div class="flex items-center gap-3">
        <!-- Unlink button for linked hotels -->
        <button
          v-if="isLinkedHotel && !isNew"
          type="button"
          :disabled="unlinking"
          class="px-4 py-2 border border-orange-500 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-2"
          @click="handleUnlink"
        >
          <span v-if="unlinking" class="animate-spin material-icons text-lg">refresh</span>
          <span v-else class="material-icons text-lg">link_off</span>
          {{ $t('hotels.hotelBase.unlinkFromBase') }}
        </button>

        <!-- Save button -->
        <button class="btn-primary" :disabled="saving" @click="handleSave">
          <span v-if="saving" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{ $t('common.loading') }}
          </span>
          <span v-else>{{ $t('common.save') }}</span>
        </button>
      </div>
    </div>

    <!-- Linked Hotel Info Banner -->
    <div
      v-if="isLinkedHotel && !loading"
      class="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
    >
      <div class="flex items-start gap-3">
        <span class="material-icons text-purple-600 dark:text-purple-400 mt-0.5">link</span>
        <div>
          <h4 class="font-medium text-purple-800 dark:text-purple-300">
            {{ $t('hotels.linkedHotel.notice') }}
          </h4>
          <p class="text-sm text-purple-600 dark:text-purple-400 mt-1">
            {{ $t('hotels.linkedHotel.settingsEditable') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      <p class="mt-4 text-gray-600 dark:text-slate-400">{{ $t('common.loading') }}</p>
    </div>

    <template v-else>
      <!-- Status & Display Order Section (Top) -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow mb-6">
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <!-- Status -->
            <div>
              <label class="form-label">{{ $t('common.status.label') }}</label>
              <select v-model="form.status" class="form-input">
                <option value="draft">{{ $t('hotels.statuses.draft') }}</option>
                <option value="active">{{ $t('hotels.statuses.active') }}</option>
                <option value="inactive">{{ $t('hotels.statuses.inactive') }}</option>
              </select>
            </div>

            <!-- Featured -->
            <div class="flex items-center">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.featured"
                  type="checkbox"
                  class="w-5 h-5 text-amber-500 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                />
                <span class="ml-3 text-sm text-gray-700 dark:text-slate-300">
                  <span class="font-medium flex items-center gap-1">
                    <span class="material-icons text-amber-500 text-lg">star</span>
                    {{ $t('hotels.basic.featured') }}
                  </span>
                </span>
              </label>
            </div>

            <!-- Display Order -->
            <div>
              <label class="form-label">{{ $t('hotels.displayOrder') }}</label>
              <input v-model.number="form.displayOrder" type="number" min="0" class="form-input" />
            </div>

            <!-- Spacer -->
            <div></div>
          </div>
        </div>
      </div>

      <!-- For linked hotels: Show display-only component -->
      <div v-if="isLinkedHotel" class="bg-white dark:bg-slate-800 rounded-lg shadow">
        <div class="p-6">
          <HotelDataDisplay :hotel="hotel" />
        </div>
      </div>

      <!-- For partner/own hotels: Show editable forms -->
      <div v-else class="bg-white dark:bg-slate-800 rounded-lg shadow">
        <!-- Sub Tabs with Error Badges -->
        <FormTabs
          v-model="activeTab"
          :tabs="tabsWithDisabled"
          :errors="allErrors"
          :tab-fields="tabFields"
          @tab-change="handleTabChange"
        />

        <!-- Validation Error Banner -->
        <div
          v-if="hasErrors"
          class="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2"
        >
          <span class="material-icons text-red-500">error</span>
          <span class="text-sm text-red-700 dark:text-red-400">
            {{ $t('validation.fixErrors') }}
          </span>
        </div>

        <!-- Tab Content -->
        <form class="p-6" @submit.prevent="handleSave">
          <!-- Basic Info Tab -->
          <div v-show="activeTab === 'basic'">
            <HotelBasicForm
              ref="basicFormRef"
              :hotel="hotel"
              :saving="saving"
              :is-new="isNew"
              :external-errors="tabErrors.basic"
              @validation-change="errors => updateTabErrors('basic', errors)"
            />
          </div>

          <!-- Contact Tab -->
          <div v-show="activeTab === 'contact'">
            <HotelContactForm
              ref="contactFormRef"
              :hotel="hotel"
              :saving="saving"
              :external-errors="tabErrors.contact"
              @validation-change="errors => updateTabErrors('contact', errors)"
            />
          </div>

          <!-- Address Tab -->
          <div v-show="activeTab === 'address'">
            <HotelAddressForm
              ref="addressFormRef"
              :hotel="hotel"
              :saving="saving"
              :external-errors="tabErrors.address"
              @validation-change="errors => updateTabErrors('address', errors)"
            />
          </div>

          <!-- Profile Tab -->
          <div v-show="activeTab === 'profile'">
            <HotelProfile ref="profileFormRef" :hotel="hotel" :saving="saving" />
          </div>

          <!-- Gallery Tab -->
          <div v-show="activeTab === 'gallery'">
            <HotelGallery
              :hotel="hotel"
              @image-uploaded="handleImageUploaded"
              @image-deleted="handleImageDeleted"
              @images-reordered="handleImagesReordered"
              @main-image-set="handleMainImageSet"
            />
          </div>

          <!-- Amenities Tab -->
          <div v-show="activeTab === 'amenities'">
            <HotelAmenities ref="amenitiesFormRef" :hotel="hotel" :saving="saving" />
          </div>

          <!-- Policies Tab -->
          <div v-show="activeTab === 'policies'">
            <HotelPolicies ref="policiesFormRef" :hotel="hotel" :saving="saving" />
          </div>

          <!-- SEO Tab -->
          <div v-show="activeTab === 'seo'">
            <HotelSeoForm ref="seoFormRef" :hotel="hotel" :saving="saving" />
          </div>
        </form>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, reactive, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import { useAsyncAction } from '@/composables/useAsyncAction'
import hotelService from '@/services/hotelService'
import FormTabs from '@/components/common/FormTabs.vue'
import HotelBasicForm from '@/components/hotels/HotelBasicForm.vue'
import HotelContactForm from '@/components/hotels/HotelContactForm.vue'
import HotelAddressForm from '@/components/hotels/HotelAddressForm.vue'
import HotelGallery from '@/components/hotels/HotelGallery.vue'
import HotelAmenities from '@/components/hotels/HotelAmenities.vue'
import HotelPolicies from '@/components/hotels/HotelPolicies.vue'
import HotelProfile from '@/components/hotels/HotelProfile.vue'
import HotelSeoForm from '@/components/hotels/HotelSeoForm.vue'
import HotelSourceSelector from '@/components/hotels/HotelSourceSelector.vue'
import HotelBaseSelector from '@/components/hotels/HotelBaseSelector.vue'
import HotelDataDisplay from '@/components/hotels/HotelDataDisplay.vue'
import { useUIStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t } = useI18n()
const uiStore = useUIStore()

// All supported languages for multilingual fields
const SUPPORTED_LANGUAGES = [
  'tr',
  'en',
  'ru',
  'el',
  'de',
  'es',
  'it',
  'fr',
  'ro',
  'bg',
  'pt',
  'da',
  'zh',
  'ar',
  'fa',
  'he',
  'sq',
  'uk',
  'pl',
  'az'
]

// Helper to create empty multilingual object
const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => {
    obj[lang] = ''
  })
  return obj
}

function getEmptyHotel() {
  return {
    hotelType: 'partner',
    hotelBase: null,
    name: '',
    description: createMultiLangObject(),
    slug: '',
    logo: '',
    stars: 3,
    type: 'hotel',
    category: 'standard',
    visibility: {
      b2c: true,
      b2b: true
    },
    address: {
      street: '',
      city: '',
      district: '',
      country: 'Türkiye',
      postalCode: '',
      coordinates: { lat: null, lng: null },
      formattedAddress: '',
      placeId: ''
    },
    contact: {
      phone: '',
      email: '',
      website: '',
      callCenter: '',
      fax: '',
      authorizedPerson: '',
      authorizedEmail: '',
      authorizedPhone: '',
      socialMedia: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: ''
      }
    },
    images: [],
    amenities: [],
    policies: {
      useBaseDefaults: true,
      checkIn: '14:00',
      checkOut: '12:00',
      maxBabyAge: 2,
      maxChildAge: 12,
      childPolicy: createMultiLangObject(),
      petPolicy: createMultiLangObject(),
      additionalInfo: createMultiLangObject(),
      cancellationRules: [],
      freeCancellation: {
        enabled: false,
        daysBeforeCheckIn: 1
      }
    },
    seo: {
      title: createMultiLangObject(),
      description: createMultiLangObject(),
      keywords: createMultiLangObject()
    },
    roomConfig: {
      totalRooms: 0,
      floors: 1,
      hasElevator: false
    },
    profile: {
      overview: {
        content: createMultiLangObject(),
        establishedYear: null,
        renovationYear: null,
        chainBrand: '',
        officialRating: ''
      },
      facilities: { content: createMultiLangObject(), features: [] },
      dining: { content: createMultiLangObject(), features: [] },
      sportsEntertainment: { content: createMultiLangObject(), features: [] },
      spaWellness: { content: createMultiLangObject(), features: [], spaDetails: { area: null } },
      familyKids: {
        content: createMultiLangObject(),
        features: [],
        kidsClubAges: { min: null, max: null }
      },
      beachPool: {
        content: createMultiLangObject(),
        features: [],
        beachDetails: { distance: null, type: '', length: null }
      },
      honeymoon: { content: createMultiLangObject(), features: [], available: false },
      importantInfo: { content: createMultiLangObject() },
      location: { content: createMultiLangObject(), distances: [] }
    },
    pricingSettings: {
      model: 'net',
      defaultMarkup: 20,
      defaultCommission: 15,
      currency: 'EUR',
      taxIncluded: true,
      taxRate: 10
    },
    status: 'draft',
    featured: false,
    displayOrder: 0
  }
}

// Async action composables
const { isLoading: loading, execute: executeFetch } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })
const { isLoading: saving, execute: executeSave } = useAsyncAction({ showErrorToast: false })
const { isLoading: unlinking, execute: executeUnlink } = useAsyncAction({ showErrorToast: false })

const hotel = ref(getEmptyHotel())
const activeTab = ref('basic')

// Top form fields (status, featured, displayOrder)
const form = ref({
  status: 'draft',
  featured: false,
  displayOrder: 0
})

// Source/Base selector states
const showSourceSelector = ref(false)
const showBaseSelector = ref(false)

// Form refs
const basicFormRef = ref(null)
const contactFormRef = ref(null)
const addressFormRef = ref(null)
const amenitiesFormRef = ref(null)
const policiesFormRef = ref(null)
const profileFormRef = ref(null)
const seoFormRef = ref(null)

// Tab errors tracking
const tabErrors = reactive({
  basic: {},
  contact: {},
  address: {},
  profile: {},
  gallery: {},
  amenities: {},
  policies: {},
  seo: {}
})

// Map of fields to tabs for error badge display
const tabFields = {
  basic: ['name', 'slug', 'stars', 'type'],
  contact: ['contact.phone', 'contact.email'],
  address: ['address.city', 'address.country'],
  profile: [],
  gallery: [],
  amenities: [],
  policies: [],
  seo: []
}

// Combine all errors for FormTabs
const allErrors = computed(() => {
  const errors = {}
  Object.entries(tabErrors).forEach(([, tabErrs]) => {
    Object.entries(tabErrs).forEach(([field, error]) => {
      errors[field] = error
    })
  })
  return errors
})

// Check if any errors exist
const hasErrors = computed(() => Object.keys(allErrors.value).length > 0)

// Update errors for a specific tab
const updateTabErrors = (tabId, errors) => {
  tabErrors[tabId] = errors
}

// Clear all tab errors
const clearAllTabErrors = () => {
  Object.keys(tabErrors).forEach(key => {
    tabErrors[key] = {}
  })
}

// Validate all forms and return first tab with errors
const validateAllForms = () => {
  // Skip validation for linked hotels on data tab
  if (isLinkedHotel.value) {
    return { isValid: true, firstErrorTab: null }
  }

  const validationResults = {
    basic: basicFormRef.value?.validateAll?.() ?? true,
    contact: contactFormRef.value?.validateAll?.() ?? true,
    address: addressFormRef.value?.validateAll?.() ?? true
  }

  // Find first tab with errors
  const firstErrorTab = Object.entries(validationResults).find(([, isValid]) => !isValid)?.[0]

  return {
    isValid: Object.values(validationResults).every(v => v),
    firstErrorTab
  }
}

// Collect all form data
const collectFormData = () => {
  // For linked hotels, only collect status/featured/displayOrder
  if (isLinkedHotel.value) {
    return {
      status: form.value.status,
      featured: form.value.featured,
      displayOrder: form.value.displayOrder
    }
  }

  const basicData = basicFormRef.value?.getFormData?.() || {}
  const contactData = contactFormRef.value?.getFormData?.() || {}
  const addressData = addressFormRef.value?.getFormData?.() || {}
  const amenitiesData = amenitiesFormRef.value?.getFormData?.() || {}
  const policiesData = policiesFormRef.value?.getFormData?.() || {}
  const profileData = profileFormRef.value?.getFormData?.() || {}
  const seoData = seoFormRef.value?.getFormData?.() || {}

  // Merge all form data including top form
  return {
    ...basicData,
    ...contactData,
    ...addressData,
    ...amenitiesData,
    ...policiesData,
    ...profileData,
    ...seoData,
    status: form.value.status,
    featured: form.value.featured,
    displayOrder: form.value.displayOrder
  }
}

const isNew = computed(() => route.params.id === undefined || route.name === 'hotel-new')
const isLinkedHotel = computed(() => hotel.value.hotelType === 'linked')

// Sub-tabs for hotel data
const tabs = computed(() => [
  { id: 'basic', label: t('hotels.tabs.basic'), icon: 'info', requiresSave: false },
  { id: 'contact', label: t('hotels.tabs.contact'), icon: 'contacts', requiresSave: false },
  { id: 'address', label: t('hotels.tabs.address'), icon: 'location_on', requiresSave: false },
  { id: 'profile', label: t('hotels.tabs.profile'), icon: 'description', requiresSave: false },
  { id: 'gallery', label: t('hotels.tabs.gallery'), icon: 'photo_library', requiresSave: true },
  { id: 'amenities', label: t('hotels.tabs.amenities'), icon: 'wifi', requiresSave: false },
  { id: 'policies', label: t('hotels.tabs.policies'), icon: 'policy', requiresSave: false },
  { id: 'seo', label: t('hotels.tabs.seo'), icon: 'search', requiresSave: false }
])

// Add disabled flag for new hotels
const tabsWithDisabled = computed(() => {
  return tabs.value.map(tab => ({
    ...tab,
    disabled: isNew.value && tab.requiresSave
  }))
})

const handleTabChange = tab => {
  // When switching to address tab, invalidate map size
  if (tab.id === 'address' && addressFormRef.value?.invalidateMapSize) {
    // Use nextTick to ensure the tab content is visible
    nextTick(() => {
      addressFormRef.value.invalidateMapSize()
    })
  }
}

// Source selector handlers
const handleSourceSelectorClose = () => {
  showSourceSelector.value = false
  // If user cancels source selection for new hotel, go back to list
  if (isNew.value && !hotel.value.hotelType) {
    router.push('/hotels')
  }
}

const handleSourceSelect = source => {
  showSourceSelector.value = false

  if (source === 'base') {
    // Show base hotel selector
    showBaseSelector.value = true
  } else {
    // Create own hotel - already set as 'partner' type
    hotel.value.hotelType = 'partner'
  }
}

const handleBaseLinked = linkedHotel => {
  showBaseSelector.value = false
  toast.success(t('hotels.hotelBase.linkSuccess'))
  // Navigate to the newly created linked hotel
  router.push(`/hotels/${linkedHotel._id}`)
}

// Unlink from base
const handleUnlink = async () => {
  if (!confirm(t('hotels.hotelBase.unlinkConfirm'))) {
    return
  }

  await executeUnlink(
    () => hotelService.unlinkFromBase(hotel.value._id),
    {
      successMessage: 'hotels.hotelBase.unlinkSuccess',
      onSuccess: async () => {
        await fetchHotel()
      },
      onError: () => {
        toast.error(t('common.operationFailed'))
      }
    }
  )
}

const fetchHotel = async () => {
  if (isNew.value) return

  await executeFetch(
    () => hotelService.getHotel(route.params.id),
    {
      onSuccess: response => {
        if (response.success) {
          const emptyHotel = getEmptyHotel()
          const data = response.data

          hotel.value = {
            ...emptyHotel,
            ...data,
            hotelType: data.hotelType || 'partner',
            hotelBase: data.hotelBase || null,
            name: data.name || '',
            description: { ...emptyHotel.description, ...data.description },
            visibility: { ...emptyHotel.visibility, ...data.visibility },
            address: {
              ...emptyHotel.address,
              ...data.address,
              coordinates: { ...emptyHotel.address.coordinates, ...data.address?.coordinates }
            },
            contact: {
              ...emptyHotel.contact,
              ...data.contact,
              socialMedia: { ...emptyHotel.contact.socialMedia, ...data.contact?.socialMedia }
            },
            policies: {
              ...emptyHotel.policies,
              ...data.policies,
              useBaseDefaults: data.policies?.useBaseDefaults ?? true,
              childPolicy: { ...emptyHotel.policies.childPolicy, ...data.policies?.childPolicy },
              petPolicy: { ...emptyHotel.policies.petPolicy, ...data.policies?.petPolicy },
              additionalInfo: {
                ...emptyHotel.policies.additionalInfo,
                ...data.policies?.additionalInfo
              },
              cancellationRules: data.policies?.cancellationRules || [],
              freeCancellation: {
                ...emptyHotel.policies.freeCancellation,
                ...data.policies?.freeCancellation
              }
            },
            seo: {
              title: { ...emptyHotel.seo.title, ...data.seo?.title },
              description: { ...emptyHotel.seo.description, ...data.seo?.description },
              keywords: { ...emptyHotel.seo.keywords, ...data.seo?.keywords }
            },
            roomConfig: { ...emptyHotel.roomConfig, ...data.roomConfig },
            pricingSettings: { ...emptyHotel.pricingSettings, ...data.pricingSettings },
            profile: {
              overview: {
                ...emptyHotel.profile.overview,
                ...data.profile?.overview,
                content: { ...emptyHotel.profile.overview.content, ...data.profile?.overview?.content }
              },
              facilities: {
                ...emptyHotel.profile.facilities,
                ...data.profile?.facilities,
                content: {
                  ...emptyHotel.profile.facilities.content,
                  ...data.profile?.facilities?.content
                }
              },
              dining: {
                ...emptyHotel.profile.dining,
                ...data.profile?.dining,
                content: { ...emptyHotel.profile.dining.content, ...data.profile?.dining?.content }
              },
              sportsEntertainment: {
                ...emptyHotel.profile.sportsEntertainment,
                ...data.profile?.sportsEntertainment,
                content: {
                  ...emptyHotel.profile.sportsEntertainment.content,
                  ...data.profile?.sportsEntertainment?.content
                }
              },
              spaWellness: {
                ...emptyHotel.profile.spaWellness,
                ...data.profile?.spaWellness,
                content: {
                  ...emptyHotel.profile.spaWellness.content,
                  ...data.profile?.spaWellness?.content
                },
                spaDetails: {
                  ...emptyHotel.profile.spaWellness.spaDetails,
                  ...data.profile?.spaWellness?.spaDetails
                }
              },
              familyKids: {
                ...emptyHotel.profile.familyKids,
                ...data.profile?.familyKids,
                content: {
                  ...emptyHotel.profile.familyKids.content,
                  ...data.profile?.familyKids?.content
                },
                kidsClubAges: {
                  ...emptyHotel.profile.familyKids.kidsClubAges,
                  ...data.profile?.familyKids?.kidsClubAges
                }
              },
              beachPool: {
                ...emptyHotel.profile.beachPool,
                ...data.profile?.beachPool,
                content: {
                  ...emptyHotel.profile.beachPool.content,
                  ...data.profile?.beachPool?.content
                },
                beachDetails: {
                  ...emptyHotel.profile.beachPool.beachDetails,
                  ...data.profile?.beachPool?.beachDetails
                }
              },
              honeymoon: {
                ...emptyHotel.profile.honeymoon,
                ...data.profile?.honeymoon,
                content: {
                  ...emptyHotel.profile.honeymoon.content,
                  ...data.profile?.honeymoon?.content
                }
              },
              importantInfo: {
                ...emptyHotel.profile.importantInfo,
                ...data.profile?.importantInfo,
                content: {
                  ...emptyHotel.profile.importantInfo.content,
                  ...data.profile?.importantInfo?.content
                }
              },
              location: {
                ...emptyHotel.profile.location,
                ...data.profile?.location,
                content: { ...emptyHotel.profile.location.content, ...data.profile?.location?.content },
                distances: data.profile?.location?.distances || []
              }
            }
          }

          // Update top form with hotel data
          form.value = {
            status: data.status || 'draft',
            featured: data.featured || false,
            displayOrder: data.displayOrder || 0
          }

          // Clear all validation errors when data is loaded
          clearAllTabErrors()

          // Set page title with hotel name
          uiStore.setPageTitleSuffix(hotel.value.name)
        }
      },
      onError: error => {
        toast.error(error.response?.data?.message || t('hotels.fetchError'))
        router.push('/hotels')
      }
    }
  )
}

const handleSave = async () => {
  // Validate ALL forms first (skip for linked hotels on data fields)
  const { isValid, firstErrorTab } = validateAllForms()

  if (!isValid) {
    // Switch to first tab with errors
    if (firstErrorTab && activeTab.value !== firstErrorTab) {
      activeTab.value = firstErrorTab
    }
    toast.error(t('validation.fixErrors'))
    return
  }

  // Collect all form data
  const data = collectFormData()

  const actionFn = isNew.value
    ? () => hotelService.createHotel(data)
    : () => hotelService.updateHotel(route.params.id, data)

  await executeSave(actionFn, {
    successMessage: isNew.value ? 'hotels.createSuccess' : 'hotels.updateSuccess',
    onSuccess: response => {
      if (response.success) {
        if (isNew.value) {
          router.push(`/hotels/${response.data._id}`)
        } else {
          hotel.value = {
            ...hotel.value,
            ...response.data,
            name: response.data.name || '',
            description: { ...hotel.value.description, ...response.data.description },
            address: { ...hotel.value.address, ...response.data.address },
            contact: { ...hotel.value.contact, ...response.data.contact }
          }
          form.value = {
            status: response.data.status || 'draft',
            featured: response.data.featured || false,
            displayOrder: response.data.displayOrder || 0
          }
        }
      }
    },
    onError: error => {
      toast.error(error.response?.data?.message || t('common.operationFailed'))
    }
  })
}

const handleImageUploaded = newImage => {
  hotel.value.images.push(newImage)
}

const handleImageDeleted = imageId => {
  hotel.value.images = hotel.value.images.filter(img => img._id !== imageId)
}

const handleImagesReordered = images => {
  hotel.value.images = images
}

const handleMainImageSet = imageId => {
  hotel.value.images = hotel.value.images.map(img => ({
    ...img,
    isMain: img._id === imageId
  }))
}

// Watch for route changes
watch(
  () => route.params.id,
  newId => {
    // Clear all errors when route changes
    clearAllTabErrors()

    if (newId) {
      // Existing hotel - fetch data
      showSourceSelector.value = false
      showBaseSelector.value = false
      fetchHotel()
    } else {
      // New hotel - show source selector
      hotel.value = getEmptyHotel()
      form.value = {
        status: 'draft',
        featured: false,
        displayOrder: 0
      }
      activeTab.value = 'basic'
      showSourceSelector.value = true
      uiStore.setPageTitleSuffix(t('hotels.newHotel'))
    }
  },
  { immediate: true }
)

onMounted(() => {
  // Initial setup is handled by the watch with immediate: true
})

onUnmounted(() => {
  // Clear custom title when leaving the page
  uiStore.clearPageTitle()
})
</script>
