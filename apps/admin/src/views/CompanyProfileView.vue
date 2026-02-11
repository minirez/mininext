<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ $t('companyProfile.title') }}
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ $t('companyProfile.description') }}
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <Spinner size="lg" />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
    >
      <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <!-- Content -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="[
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors'
            ]"
          >
            <span class="material-icons text-lg align-middle mr-2">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Company Info Tab -->
        <CompanyTab
          v-if="activeTab === 'company'"
          v-model="formData"
          :saving="saving"
          @save="handleSave"
        />

        <!-- Tax Info Tab -->
        <TaxTab
          v-else-if="activeTab === 'tax'"
          v-model="formData"
          :saving="saving"
          @save="handleSave"
        />

        <!-- Address Tab -->
        <AddressTab
          v-else-if="activeTab === 'address'"
          v-model="formData"
          :saving="saving"
          @save="handleSave"
        />

        <!-- Branding Tab -->
        <BrandingTab
          v-else-if="activeTab === 'branding'"
          v-model:logo="formData.branding.logo"
          v-model:favicon="formData.branding.favicon"
          :saving="saving"
          @upload-logo="handleUploadLogo"
          @delete-logo="handleDeleteLogo"
          @upload-favicon="handleUploadFavicon"
          @delete-favicon="handleDeleteFavicon"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import partnerService from '@/services/partnerService'
import Spinner from '@/components/ui/feedback/Spinner.vue'
import CompanyTab from '@/components/companyProfile/CompanyTab.vue'
import TaxTab from '@/components/companyProfile/TaxTab.vue'
import AddressTab from '@/components/companyProfile/AddressTab.vue'
import BrandingTab from '@/components/companyProfile/BrandingTab.vue'

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()

const isPartnerUser = computed(() => authStore.accountType === 'partner')

// State
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const activeTab = ref('company')

const formData = ref({
  companyName: '',
  tradeName: '',
  phone: '',
  taxOffice: '',
  taxNumber: '',
  address: {
    street: '',
    city: '',
    country: '',
    postalCode: ''
  },
  branding: {
    logo: null,
    favicon: null
  }
})

// Tabs configuration
const tabs = computed(() => [
  {
    key: 'company',
    label: t('companyProfile.tabs.company'),
    icon: 'business'
  },
  {
    key: 'tax',
    label: t('companyProfile.tabs.tax'),
    icon: 'receipt_long'
  },
  {
    key: 'address',
    label: t('companyProfile.tabs.address'),
    icon: 'location_on'
  },
  {
    key: 'branding',
    label: t('companyProfile.tabs.branding'),
    icon: 'palette'
  }
])

// Fetch profile data
const fetchProfile = async () => {
  if (!isPartnerUser.value) {
    loading.value = false
    error.value = t(
      'companyProfile.messages.adminNotAllowed',
      'Bu sayfa sadece partner kullanıcıları içindir. Partner ayarlarını yönetmek için Partnerler sayfasını kullanın.'
    )
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await partnerService.getMyProfile()
    if (response.success && response.data) {
      const data = response.data
      formData.value = {
        companyName: data.companyName || '',
        tradeName: data.tradeName || '',
        phone: data.phone || '',
        taxOffice: data.taxOffice || '',
        taxNumber: data.taxNumber || '',
        address: {
          street: data.address?.street || '',
          city: data.address?.city || '',
          country: data.address?.country || '',
          postalCode: data.address?.postalCode || ''
        },
        branding: {
          logo: data.branding?.logo || null,
          favicon: data.branding?.favicon || null
        }
      }
    }
  } catch (err) {
    error.value = t('companyProfile.messages.fetchError')
    console.error('Failed to fetch profile:', err)
  } finally {
    loading.value = false
  }
}

// Save profile
const handleSave = async () => {
  saving.value = true

  try {
    const response = await partnerService.updateMyProfile({
      companyName: formData.value.companyName,
      tradeName: formData.value.tradeName,
      phone: formData.value.phone,
      taxOffice: formData.value.taxOffice,
      taxNumber: formData.value.taxNumber,
      address: formData.value.address
    })

    if (response.success) {
      toast.success(t('companyProfile.messages.saved'))
    }
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
    console.error('Failed to save profile:', err)
  } finally {
    saving.value = false
  }
}

// Logo handlers
const handleUploadLogo = async file => {
  saving.value = true

  try {
    const response = await partnerService.uploadMyLogo(file)
    if (response.success) {
      formData.value.branding.logo = response.data.logo
      toast.success(t('companyProfile.messages.logoUploaded'))
    }
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
    console.error('Failed to upload logo:', err)
  } finally {
    saving.value = false
  }
}

const handleDeleteLogo = async () => {
  saving.value = true

  try {
    const response = await partnerService.deleteMyLogo()
    if (response.success) {
      formData.value.branding.logo = null
      toast.success(t('companyProfile.messages.logoDeleted'))
    }
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
    console.error('Failed to delete logo:', err)
  } finally {
    saving.value = false
  }
}

// Favicon handlers
const handleUploadFavicon = async file => {
  saving.value = true

  try {
    const response = await partnerService.uploadMyFavicon(file)
    if (response.success) {
      formData.value.branding.favicon = response.data.favicon
      toast.success(t('companyProfile.messages.faviconUploaded'))
    }
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
    console.error('Failed to upload favicon:', err)
  } finally {
    saving.value = false
  }
}

const handleDeleteFavicon = async () => {
  saving.value = true

  try {
    const response = await partnerService.deleteMyFavicon()
    if (response.success) {
      formData.value.branding.favicon = null
      toast.success(t('companyProfile.messages.faviconDeleted'))
    }
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
    console.error('Failed to delete favicon:', err)
  } finally {
    saving.value = false
  }
}

// Initialize
onMounted(() => {
  fetchProfile()
})
</script>
