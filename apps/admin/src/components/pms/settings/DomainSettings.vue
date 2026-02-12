<template>
  <div class="space-y-6">
    <div class="max-w-xl">
      <DomainCard
        type="pms"
        icon="hotel"
        icon-color="text-indigo-600"
        :title="$t('settings.domain.title')"
        :description="$t('settings.domain.description')"
        placeholder="pms.example.com"
        v-model:domain="domainValue"
        :ssl-status="domainData.pmsSslStatus"
        :ssl-expires="domainData.pmsSslExpiresAt"
        :verifying="verifying"
        :setting-up-ssl="settingUpSsl"
        :dns-verified="dnsVerified"
        :dns-result="dnsResult"
        :saving="saving"
        @verify-dns="handleVerifyDns"
        @setup-ssl="handleSetupSsl"
      />
    </div>

    <!-- DNS Instructions -->
    <div
      class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-xl"
    >
      <h4 class="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
        <span class="material-icons text-sm mr-2">info</span>
        {{ $t('siteSettings.setup.dnsInstructions') }}
      </h4>
      <p class="text-sm text-blue-700 dark:text-blue-400">
        {{ $t('siteSettings.setup.dnsDescription') }}
      </p>
      <div
        class="mt-2 p-2 bg-blue-100 dark:bg-blue-900/40 rounded text-xs text-blue-800 dark:text-blue-300 font-mono"
      >
        <div>{{ $t('siteSettings.setup.dnsRecordType') }}: CNAME</div>
        <div>{{ $t('siteSettings.setup.dnsRecordValue') }}: {{ cnameTarget || '...' }}</div>
      </div>
    </div>

    <!-- Save Domain Button -->
    <div class="max-w-xl">
      <button
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        :disabled="saving || !domainChanged"
        @click="saveDomain"
      >
        <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
        <span v-else class="material-icons text-sm">save</span>
        {{ $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import * as settingsService from '@/services/pms/settingsService'
import DomainCard from '@/components/siteSettings/DomainCard.vue'

const { t } = useI18n()
const toast = useToast()

const props = defineProps({
  hotelId: { type: String, required: true }
})

// State
const loading = ref(false)
const saving = ref(false)
const verifying = ref(false)
const settingUpSsl = ref(false)
const dnsVerified = ref(false)
const dnsResult = ref(null)
const cnameTarget = ref(null)
const serverIP = ref(null)

const domainData = ref({
  pmsDomain: '',
  pmsSslStatus: 'none',
  pmsSslExpiresAt: null
})

const domainValue = ref('')
const originalDomain = ref('')

const domainChanged = computed(() => domainValue.value !== originalDomain.value)

// Load domain data
const loadDomain = async () => {
  if (!props.hotelId) return
  loading.value = true
  try {
    const res = await settingsService.getHotelDomain(props.hotelId)
    if (res.success) {
      domainData.value = res.data
      domainValue.value = res.data.pmsDomain || ''
      originalDomain.value = res.data.pmsDomain || ''
    }
  } catch (error) {
    console.error('Failed to load hotel domain:', error)
  } finally {
    loading.value = false
  }
}

// Save domain
const saveDomain = async () => {
  saving.value = true
  try {
    const res = await settingsService.updateHotelDomain(props.hotelId, domainValue.value)
    if (res.success) {
      domainData.value = res.data
      originalDomain.value = res.data.pmsDomain || ''
      toast.success(t('settings.domain.saved'))
      // Reset DNS state
      dnsVerified.value = false
      dnsResult.value = null
    }
  } catch (error) {
    const msg = error.response?.data?.message || t('settings.domain.saveError')
    toast.error(msg)
  } finally {
    saving.value = false
  }
}

// Verify DNS
const handleVerifyDns = async () => {
  if (!domainValue.value) {
    toast.warning(t('siteSettings.setup.enterDomainFirst'))
    return
  }

  // Save domain first if changed
  if (domainChanged.value) {
    await saveDomain()
  }

  verifying.value = true
  dnsResult.value = null

  try {
    const result = await settingsService.verifyHotelDomainDns(props.hotelId)

    dnsVerified.value = result.success
    dnsResult.value = {
      success: result.success,
      message: result.message,
      cnameTarget: result.data?.cnameTarget,
      serverIP: result.data?.serverIP,
      domainIP: result.data?.domainIP
    }

    if (result.data?.cnameTarget) {
      cnameTarget.value = result.data.cnameTarget
    }
    if (result.data?.serverIP) {
      serverIP.value = result.data.serverIP
    }

    if (result.success) {
      toast.success(t('siteSettings.setup.dnsVerified'))
    } else {
      toast.error(result.message || t('siteSettings.setup.dnsNotVerified'))
    }
  } catch (error) {
    dnsResult.value = {
      success: false,
      message: error.response?.data?.message || t('siteSettings.setup.dnsVerificationFailed')
    }
    toast.error(error.response?.data?.message || t('siteSettings.setup.dnsVerificationFailed'))
  } finally {
    verifying.value = false
  }
}

// Setup SSL
const handleSetupSsl = async () => {
  settingUpSsl.value = true

  try {
    const result = await settingsService.setupHotelDomainSsl(props.hotelId)

    if (result.success) {
      toast.success(t('siteSettings.setup.sslSetupComplete'))
      domainData.value = {
        pmsDomain: result.data.pmsDomain,
        pmsSslStatus: result.data.pmsSslStatus,
        pmsSslExpiresAt: result.data.pmsSslExpiresAt
      }
    } else {
      toast.error(result.message || t('siteSettings.setup.sslSetupFailed'))
    }
  } catch (error) {
    const errorData = error.response?.data
    let errorMessage = t('siteSettings.setup.sslSetupFailed')

    if (errorData?.data?.step === 'dns') {
      errorMessage = t('siteSettings.setup.sslDnsFailed')
    } else if (errorData?.data?.step === 'certificate') {
      errorMessage = t('siteSettings.setup.sslCertFailed')
    } else if (errorData?.data?.step === 'nginx') {
      errorMessage = t('siteSettings.setup.sslNginxFailed')
    }

    toast.error(errorData?.message || errorMessage)
  } finally {
    settingUpSsl.value = false
  }
}

// Watch hotel change
watch(() => props.hotelId, loadDomain)

onMounted(loadDomain)
</script>
