<template>
  <div>
    <!-- Header with back button and save button -->
    <div class="mb-6 flex items-center justify-between">
      <router-link to="/hotels" class="inline-flex items-center text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400">
        <span class="material-icons mr-1">arrow_back</span>
        {{ $t('common.back') }}
      </router-link>
      <button @click="handleSave" class="btn-primary" :disabled="saving">
        <span v-if="saving" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ $t('common.loading') }}
        </span>
        <span v-else>{{ $t('common.save') }}</span>
      </button>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">

      <!-- Tabs with Error Badges -->
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

      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 dark:text-slate-400">{{ $t('common.loading') }}</p>
      </div>

      <!-- Tab Content -->
      <form v-else @submit.prevent="handleSave" class="p-6">
        <!-- Basic Info Tab -->
        <div v-show="activeTab === 'basic'">
          <HotelBasicForm
            ref="basicFormRef"
            :hotel="hotel"
            :saving="saving"
            :is-new="isNew"
            :external-errors="tabErrors.basic"
            @validation-change="(errors) => updateTabErrors('basic', errors)"
          />
        </div>

        <!-- Contact Tab -->
        <div v-show="activeTab === 'contact'">
          <HotelContactForm
            ref="contactFormRef"
            :hotel="hotel"
            :saving="saving"
            :external-errors="tabErrors.contact"
            @validation-change="(errors) => updateTabErrors('contact', errors)"
          />
        </div>

        <!-- Address Tab -->
        <div v-show="activeTab === 'address'">
          <HotelAddressForm
            ref="addressFormRef"
            :hotel="hotel"
            :saving="saving"
            :external-errors="tabErrors.address"
            @validation-change="(errors) => updateTabErrors('address', errors)"
          />
        </div>

        <!-- Profile Tab -->
        <div v-show="activeTab === 'profile'">
          <HotelProfile
            ref="profileFormRef"
            :hotel="hotel"
            :saving="saving"
          />
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
          <HotelAmenities
            ref="amenitiesFormRef"
            :hotel="hotel"
            :saving="saving"
          />
        </div>

        <!-- Policies Tab -->
        <div v-show="activeTab === 'policies'">
          <HotelPolicies
            ref="policiesFormRef"
            :hotel="hotel"
            :saving="saving"
          />
        </div>

        <!-- Pricing Tab -->
        <div v-show="activeTab === 'pricing'">
          <HotelPricingForm
            ref="pricingFormRef"
            :hotel="hotel"
            :saving="saving"
          />
        </div>

        <!-- SEO Tab -->
        <div v-show="activeTab === 'seo'">
          <HotelSeoForm
            ref="seoFormRef"
            :hotel="hotel"
            :saving="saving"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, reactive, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import hotelService from '@/services/hotelService'
import FormTabs from '@/components/common/FormTabs.vue'
import HotelBasicForm from '@/components/hotels/HotelBasicForm.vue'
import HotelContactForm from '@/components/hotels/HotelContactForm.vue'
import HotelAddressForm from '@/components/hotels/HotelAddressForm.vue'
import HotelGallery from '@/components/hotels/HotelGallery.vue'
import HotelAmenities from '@/components/hotels/HotelAmenities.vue'
import HotelPolicies from '@/components/hotels/HotelPolicies.vue'
import HotelSeoForm from '@/components/hotels/HotelSeoForm.vue'
import HotelProfile from '@/components/hotels/HotelProfile.vue'
import HotelPricingForm from '@/components/hotels/HotelPricingForm.vue'
import { useUIStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t, locale } = useI18n()
const uiStore = useUIStore()

// All supported languages for multilingual fields
const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']

// Helper to create empty multilingual object
const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => { obj[lang] = '' })
  return obj
}

function getEmptyHotel() {
  return {
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
      overview: { content: createMultiLangObject(), establishedYear: null, renovationYear: null, chainBrand: '', officialRating: '' },
      facilities: { content: createMultiLangObject(), features: [] },
      dining: { content: createMultiLangObject(), features: [] },
      sportsEntertainment: { content: createMultiLangObject(), features: [] },
      spaWellness: { content: createMultiLangObject(), features: [], spaDetails: { area: null } },
      familyKids: { content: createMultiLangObject(), features: [], kidsClubAges: { min: null, max: null } },
      beachPool: { content: createMultiLangObject(), features: [], beachDetails: { distance: null, type: '', length: null } },
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
    featured: false
  }
}

const hotel = ref(getEmptyHotel())
const loading = ref(false)
const saving = ref(false)
const activeTab = ref('basic')

// Form refs
const basicFormRef = ref(null)
const contactFormRef = ref(null)
const addressFormRef = ref(null)
const amenitiesFormRef = ref(null)
const policiesFormRef = ref(null)
const seoFormRef = ref(null)
const profileFormRef = ref(null)
const pricingFormRef = ref(null)

// Tab errors tracking
const tabErrors = reactive({
  basic: {},
  contact: {},
  address: {},
  profile: {},
  gallery: {},
  amenities: {},
  policies: {},
  pricing: {},
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
  pricing: [],
  seo: []
}

// Combine all errors for FormTabs
const allErrors = computed(() => {
  const errors = {}
  Object.entries(tabErrors).forEach(([tab, tabErrs]) => {
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
  const validationResults = {
    basic: basicFormRef.value?.validateAll?.() ?? true,
    contact: contactFormRef.value?.validateAll?.() ?? true,
    address: addressFormRef.value?.validateAll?.() ?? true
  }

  // Find first tab with errors
  const firstErrorTab = Object.entries(validationResults).find(([_, isValid]) => !isValid)?.[0]

  return {
    isValid: Object.values(validationResults).every(v => v),
    firstErrorTab
  }
}

// Collect all form data
const collectFormData = () => {
  const basicData = basicFormRef.value?.getFormData?.() || {}
  const contactData = contactFormRef.value?.getFormData?.() || {}
  const addressData = addressFormRef.value?.getFormData?.() || {}
  const amenitiesData = amenitiesFormRef.value?.getFormData?.() || {}
  const policiesData = policiesFormRef.value?.getFormData?.() || {}
  const seoData = seoFormRef.value?.getFormData?.() || {}
  const profileData = profileFormRef.value?.getFormData?.() || {}
  const pricingData = pricingFormRef.value?.getFormData?.() || {}

  // Merge all form data
  return {
    ...basicData,
    ...contactData,
    ...addressData,
    ...amenitiesData,
    ...policiesData,
    ...seoData,
    ...profileData,
    ...pricingData
  }
}

const isNew = computed(() => route.params.id === undefined || route.name === 'hotel-new')

const tabs = computed(() => [
  { id: 'basic', label: t('hotels.tabs.basic'), icon: 'info', requiresSave: false },
  { id: 'contact', label: t('hotels.tabs.contact'), icon: 'contacts', requiresSave: false },
  { id: 'address', label: t('hotels.tabs.address'), icon: 'location_on', requiresSave: false },
  { id: 'profile', label: t('hotels.tabs.profile'), icon: 'description', requiresSave: false },
  { id: 'gallery', label: t('hotels.tabs.gallery'), icon: 'photo_library', requiresSave: true },
  { id: 'amenities', label: t('hotels.tabs.amenities'), icon: 'wifi', requiresSave: false },
  { id: 'policies', label: t('hotels.tabs.policies'), icon: 'policy', requiresSave: false },
  { id: 'pricing', label: t('hotels.tabs.pricing'), icon: 'sell', requiresSave: false },
  { id: 'seo', label: t('hotels.tabs.seo'), icon: 'search', requiresSave: false }
])

// Add disabled flag for new hotels
const tabsWithDisabled = computed(() => {
  return tabs.value.map(tab => ({
    ...tab,
    disabled: isNew.value && tab.requiresSave
  }))
})

const handleTabChange = (tab) => {
  // When switching to address tab, invalidate map size
  if (tab.id === 'address' && addressFormRef.value?.invalidateMapSize) {
    // Use nextTick to ensure the tab content is visible
    nextTick(() => {
      addressFormRef.value.invalidateMapSize()
    })
  }
}

const fetchHotel = async () => {
  if (isNew.value) return

  loading.value = true
  try {
    const response = await hotelService.getHotel(route.params.id)
    if (response.success) {
      const emptyHotel = getEmptyHotel()
      const data = response.data

      hotel.value = {
        ...emptyHotel,
        ...data,
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
          childPolicy: { ...emptyHotel.policies.childPolicy, ...data.policies?.childPolicy },
          petPolicy: { ...emptyHotel.policies.petPolicy, ...data.policies?.petPolicy },
          additionalInfo: { ...emptyHotel.policies.additionalInfo, ...data.policies?.additionalInfo },
          cancellationRules: data.policies?.cancellationRules || [],
          freeCancellation: { ...emptyHotel.policies.freeCancellation, ...data.policies?.freeCancellation }
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
            content: { ...emptyHotel.profile.facilities.content, ...data.profile?.facilities?.content }
          },
          dining: {
            ...emptyHotel.profile.dining,
            ...data.profile?.dining,
            content: { ...emptyHotel.profile.dining.content, ...data.profile?.dining?.content }
          },
          sportsEntertainment: {
            ...emptyHotel.profile.sportsEntertainment,
            ...data.profile?.sportsEntertainment,
            content: { ...emptyHotel.profile.sportsEntertainment.content, ...data.profile?.sportsEntertainment?.content }
          },
          spaWellness: {
            ...emptyHotel.profile.spaWellness,
            ...data.profile?.spaWellness,
            content: { ...emptyHotel.profile.spaWellness.content, ...data.profile?.spaWellness?.content },
            spaDetails: { ...emptyHotel.profile.spaWellness.spaDetails, ...data.profile?.spaWellness?.spaDetails }
          },
          familyKids: {
            ...emptyHotel.profile.familyKids,
            ...data.profile?.familyKids,
            content: { ...emptyHotel.profile.familyKids.content, ...data.profile?.familyKids?.content },
            kidsClubAges: { ...emptyHotel.profile.familyKids.kidsClubAges, ...data.profile?.familyKids?.kidsClubAges }
          },
          beachPool: {
            ...emptyHotel.profile.beachPool,
            ...data.profile?.beachPool,
            content: { ...emptyHotel.profile.beachPool.content, ...data.profile?.beachPool?.content },
            beachDetails: { ...emptyHotel.profile.beachPool.beachDetails, ...data.profile?.beachPool?.beachDetails }
          },
          honeymoon: {
            ...emptyHotel.profile.honeymoon,
            ...data.profile?.honeymoon,
            content: { ...emptyHotel.profile.honeymoon.content, ...data.profile?.honeymoon?.content }
          },
          importantInfo: {
            ...emptyHotel.profile.importantInfo,
            ...data.profile?.importantInfo,
            content: { ...emptyHotel.profile.importantInfo.content, ...data.profile?.importantInfo?.content }
          },
          location: {
            ...emptyHotel.profile.location,
            ...data.profile?.location,
            content: { ...emptyHotel.profile.location.content, ...data.profile?.location?.content },
            distances: data.profile?.location?.distances || []
          }
        }
      }

      // Clear all validation errors when data is loaded
      clearAllTabErrors()

      // Set page title with hotel name
      uiStore.setPageTitleSuffix(hotel.value.name)
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('hotels.fetchError'))
    router.push('/hotels')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  // Validate ALL forms first
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

  saving.value = true
  try {
    let response
    if (isNew.value) {
      response = await hotelService.createHotel(data)
      if (response.success) {
        toast.success(t('hotels.createSuccess'))
        router.push(`/hotels/${response.data._id}`)
      }
    } else {
      response = await hotelService.updateHotel(route.params.id, data)
      if (response.success) {
        hotel.value = {
          ...hotel.value,
          ...response.data,
          name: response.data.name || '',
          description: { ...hotel.value.description, ...response.data.description },
          address: { ...hotel.value.address, ...response.data.address },
          contact: { ...hotel.value.contact, ...response.data.contact }
        }
        toast.success(t('hotels.updateSuccess'))
      }
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

const handleImageUploaded = (newImage) => {
  hotel.value.images.push(newImage)
}

const handleImageDeleted = (imageId) => {
  hotel.value.images = hotel.value.images.filter(img => img._id !== imageId)
}

const handleImagesReordered = (images) => {
  hotel.value.images = images
}

const handleMainImageSet = (imageId) => {
  hotel.value.images = hotel.value.images.map(img => ({
    ...img,
    isMain: img._id === imageId
  }))
}

// Watch for route changes
watch(() => route.params.id, (newId) => {
  // Clear all errors when route changes
  clearAllTabErrors()

  if (newId) {
    fetchHotel()
  } else {
    hotel.value = getEmptyHotel()
    activeTab.value = 'basic'
  }
}, { immediate: true })

onMounted(() => {
  if (!isNew.value) {
    fetchHotel()
  } else {
    // Set title for new hotel
    uiStore.setPageTitleSuffix(t('hotels.newHotel'))
  }
})

onUnmounted(() => {
  // Clear custom title when leaving the page
  uiStore.clearPageTitle()
})
</script>
