<template>
  <div>
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-slate-700">
        <nav class="flex -mb-px">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="px-6 py-4 text-sm font-medium transition-colors border-b-2"
            :class="
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-300'
            "
            @click="activeTab = tab.id"
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
            :partner-type="currentPartner?.partnerType"
            :saving="saving"
            @save="handleSetupSave"
            @request-ssl="handleSslRequest"
            @update:settings="
              val => {
                if (settings) settings.setup = val
              }
            "
          />
        </div>

        <!-- General Tab -->
        <div v-show="activeTab === 'general'">
          <GeneralTab :settings="settings?.general" :saving="saving" @save="handleGeneralSave" />
        </div>

        <!-- Homepage Tab -->
        <div v-show="activeTab === 'homepage'">
          <HomepageTab
            :settings="settings?.homepage"
            :saving="saving"
            @save="handleHomepageSave"
            @add-slider="handleAddSlider"
            @update-slider="handleUpdateSlider"
            @delete-slider="handleDeleteSlider"
          />
        </div>

        <!-- Contact Tab -->
        <div v-show="activeTab === 'contact'">
          <ContactTab :settings="settings?.contact" :saving="saving" @save="handleContactSave" />
        </div>

        <!-- Tracking Tab -->
        <div v-show="activeTab === 'tracking'">
          <TrackingTab :settings="settings?.tracking" :saving="saving" @save="handleTrackingSave" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import siteSettingsService from '@/services/siteSettingsService'
import SetupTab from '@/components/siteSettings/SetupTab.vue'
import GeneralTab from '@/components/siteSettings/GeneralTab.vue'
import HomepageTab from '@/components/siteSettings/HomepageTab.vue'
import ContactTab from '@/components/siteSettings/ContactTab.vue'
import TrackingTab from '@/components/siteSettings/TrackingTab.vue'
import { usePartnerContext } from '@/composables/usePartnerContext'
import { useAsyncAction } from '@/composables/useAsyncAction'

const { t } = useI18n()

// Async action composables
const { isLoading: loading, execute: executeFetch } = useAsyncAction({ showSuccessToast: false })
const { isLoading: saving, execute: executeSave } = useAsyncAction()

const settings = ref(null)
const activeTab = ref('setup')

const tabs = computed(() => [
  { id: 'setup', label: t('siteSettings.tabs.setup'), icon: 'dns' },
  { id: 'general', label: t('siteSettings.tabs.general'), icon: 'settings' },
  { id: 'homepage', label: t('siteSettings.tabs.homepage'), icon: 'home' },
  { id: 'contact', label: t('siteSettings.tabs.contact'), icon: 'contact_phone' },
  { id: 'tracking', label: t('siteSettings.tabs.tracking'), icon: 'analytics' }
])

const fetchSettings = async () => {
  await executeFetch(() => siteSettingsService.getSiteSettings(), {
    errorMessage: 'siteSettings.fetchError',
    onSuccess: response => {
      settings.value = response.data
    }
  })
}

// React to partner changes - reload settings when partner is switched
const { currentPartner } = usePartnerContext({
  onPartnerChange: partner => {
    if (partner) {
      fetchSettings()
    }
  },
  immediate: true
})

// Setup handlers
const handleSetupSave = async data => {
  await executeSave(() => siteSettingsService.updateSetup(data), {
    successMessage: 'siteSettings.setupSaved',
    onSuccess: response => {
      settings.value.setup = response.data
    }
  })
}

const handleSslRequest = async ({ type, formData }) => {
  await executeSave(
    async () => {
      // First save the domain settings
      const saveResponse = await siteSettingsService.updateSetup(formData)
      if (saveResponse.success) {
        settings.value.setup = saveResponse.data
      }
      // Then request SSL
      return siteSettingsService.requestSsl(type)
    },
    {
      successMessage: 'siteSettings.sslRequested',
      onSuccess: response => {
        settings.value.setup = response.data
      }
    }
  )
}

// General handlers
const handleGeneralSave = async data => {
  await executeSave(() => siteSettingsService.updateGeneral(data), {
    successMessage: 'siteSettings.generalSaved',
    onSuccess: response => {
      settings.value.general = response.data
    }
  })
}

// Homepage handlers
const handleHomepageSave = async data => {
  await executeSave(() => siteSettingsService.updateHomepage(data), {
    successMessage: 'siteSettings.homepageSaved',
    onSuccess: response => {
      settings.value.homepage = response.data
    }
  })
}

const handleAddSlider = async data => {
  await executeSave(() => siteSettingsService.addSliderItem(data), {
    successMessage: 'siteSettings.sliderAdded',
    onSuccess: response => {
      settings.value.homepage.slider = response.data
    }
  })
}

const handleUpdateSlider = async ({ sliderId, data }) => {
  await executeSave(() => siteSettingsService.updateSliderItem(sliderId, data), {
    successMessage: 'siteSettings.sliderUpdated',
    onSuccess: response => {
      settings.value.homepage.slider = response.data
    }
  })
}

const handleDeleteSlider = async sliderId => {
  await executeSave(() => siteSettingsService.deleteSliderItem(sliderId), {
    successMessage: 'siteSettings.sliderDeleted',
    onSuccess: response => {
      settings.value.homepage.slider = response.data
    }
  })
}

// Contact handlers
const handleContactSave = async data => {
  await executeSave(() => siteSettingsService.updateContact(data), {
    successMessage: 'siteSettings.contactSaved',
    onSuccess: response => {
      settings.value.contact = response.data
    }
  })
}

// Tracking handlers
const handleTrackingSave = async data => {
  await executeSave(() => siteSettingsService.updateTracking(data), {
    successMessage: 'siteSettings.trackingSaved',
    onSuccess: response => {
      settings.value.tracking = response.data
    }
  })
}
</script>
