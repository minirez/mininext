<template>
  <div>
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-slate-700">
        <nav class="flex -mb-px">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="px-6 py-4 text-sm font-medium transition-colors border-b-2"
            :class="activeTab === tab.id
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-300'"
          >
            <span class="flex items-center">
              <span class="material-icons text-lg mr-2">{{ tab.icon }}</span>
              {{ tab.label }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 dark:text-slate-400">{{ $t('common.loading') }}</p>
      </div>

      <!-- Tab Content -->
      <div v-else class="p-6">
        <!-- Setup Tab -->
        <div v-show="activeTab === 'setup'">
          <SetupTab
            :settings="settings?.setup"
            @save="handleSetupSave"
            @request-ssl="handleSslRequest"
            :saving="saving"
          />
        </div>

        <!-- General Tab -->
        <div v-show="activeTab === 'general'">
          <GeneralTab
            :settings="settings?.general"
            @save="handleGeneralSave"
            :saving="saving"
          />
        </div>

        <!-- Homepage Tab -->
        <div v-show="activeTab === 'homepage'">
          <HomepageTab
            :settings="settings?.homepage"
            @save="handleHomepageSave"
            @add-slider="handleAddSlider"
            @update-slider="handleUpdateSlider"
            @delete-slider="handleDeleteSlider"
            :saving="saving"
          />
        </div>

        <!-- Contact Tab -->
        <div v-show="activeTab === 'contact'">
          <ContactTab
            :settings="settings?.contact"
            @save="handleContactSave"
            :saving="saving"
          />
        </div>

        <!-- Tracking Tab -->
        <div v-show="activeTab === 'tracking'">
          <TrackingTab
            :settings="settings?.tracking"
            @save="handleTrackingSave"
            :saving="saving"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import siteSettingsService from '@/services/siteSettingsService'
import SetupTab from '@/components/siteSettings/SetupTab.vue'
import GeneralTab from '@/components/siteSettings/GeneralTab.vue'
import HomepageTab from '@/components/siteSettings/HomepageTab.vue'
import ContactTab from '@/components/siteSettings/ContactTab.vue'
import TrackingTab from '@/components/siteSettings/TrackingTab.vue'
import { usePartnerContext } from '@/composables/usePartnerContext'

const { t } = useI18n()
const toast = useToast()

const settings = ref(null)
const loading = ref(true)
const saving = ref(false)
const activeTab = ref('setup')

const tabs = computed(() => [
  { id: 'setup', label: t('siteSettings.tabs.setup'), icon: 'dns' },
  { id: 'general', label: t('siteSettings.tabs.general'), icon: 'settings' },
  { id: 'homepage', label: t('siteSettings.tabs.homepage'), icon: 'home' },
  { id: 'contact', label: t('siteSettings.tabs.contact'), icon: 'contact_phone' },
  { id: 'tracking', label: t('siteSettings.tabs.tracking'), icon: 'analytics' }
])

const fetchSettings = async () => {
  loading.value = true
  try {
    const response = await siteSettingsService.getSiteSettings()
    if (response.success) {
      settings.value = response.data
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('siteSettings.fetchError'))
  } finally {
    loading.value = false
  }
}

// React to partner changes - reload settings when partner is switched
const { currentPartner, hasPartner } = usePartnerContext({
  onPartnerChange: (partner) => {
    if (partner) {
      fetchSettings()
    }
  },
  immediate: true
})

// Setup handlers
const handleSetupSave = async (data) => {
  saving.value = true
  try {
    const response = await siteSettingsService.updateSetup(data)
    if (response.success) {
      settings.value.setup = response.data
      toast.success(t('siteSettings.setupSaved'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

const handleSslRequest = async (type) => {
  saving.value = true
  try {
    const response = await siteSettingsService.requestSsl(type)
    if (response.success) {
      settings.value.setup = response.data
      toast.success(t('siteSettings.sslRequested'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

// General handlers
const handleGeneralSave = async (data) => {
  saving.value = true
  try {
    const response = await siteSettingsService.updateGeneral(data)
    if (response.success) {
      settings.value.general = response.data
      toast.success(t('siteSettings.generalSaved'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

// Homepage handlers
const handleHomepageSave = async (data) => {
  saving.value = true
  try {
    const response = await siteSettingsService.updateHomepage(data)
    if (response.success) {
      settings.value.homepage = response.data
      toast.success(t('siteSettings.homepageSaved'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

const handleAddSlider = async (data) => {
  saving.value = true
  try {
    const response = await siteSettingsService.addSliderItem(data)
    if (response.success) {
      settings.value.homepage.slider = response.data
      toast.success(t('siteSettings.sliderAdded'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

const handleUpdateSlider = async ({ sliderId, data }) => {
  saving.value = true
  try {
    const response = await siteSettingsService.updateSliderItem(sliderId, data)
    if (response.success) {
      settings.value.homepage.slider = response.data
      toast.success(t('siteSettings.sliderUpdated'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

const handleDeleteSlider = async (sliderId) => {
  saving.value = true
  try {
    const response = await siteSettingsService.deleteSliderItem(sliderId)
    if (response.success) {
      settings.value.homepage.slider = response.data
      toast.success(t('siteSettings.sliderDeleted'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

// Contact handlers
const handleContactSave = async (data) => {
  saving.value = true
  try {
    const response = await siteSettingsService.updateContact(data)
    if (response.success) {
      settings.value.contact = response.data
      toast.success(t('siteSettings.contactSaved'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

// Tracking handlers
const handleTrackingSave = async (data) => {
  saving.value = true
  try {
    const response = await siteSettingsService.updateTracking(data)
    if (response.success) {
      settings.value.tracking = response.data
      toast.success(t('siteSettings.trackingSaved'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

</script>
