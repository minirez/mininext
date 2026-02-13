<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <!-- B2C Domain -->
      <DomainCard
        type="b2c"
        icon="language"
        icon-color="text-purple-600"
        :title="$t('siteSettings.setup.b2cDomain')"
        :description="$t('siteSettings.setup.b2cDescription')"
        placeholder="www.example.com"
        v-model:domain="form.b2cDomain"
        :ssl-status="settings?.b2cSslStatus"
        :ssl-expires="settings?.b2cSslExpiresAt"
        :verifying="verifying.b2c"
        :setting-up-ssl="settingUpSsl.b2c"
        :dns-verified="dnsVerified.b2c"
        :dns-result="dnsResult.b2c"
        :saving="saving"
        @verify-dns="handleVerifyDns('b2c')"
        @setup-ssl="handleSetupSsl('b2c')"
        @remove-domain="handleRemoveDomain('b2c')"
      />

      <!-- B2B Domain -->
      <DomainCard
        type="b2b"
        icon="business"
        icon-color="text-blue-600"
        :title="$t('siteSettings.setup.b2bDomain')"
        :description="$t('siteSettings.setup.b2bDescription')"
        placeholder="extranet.example.com"
        v-model:domain="form.b2bDomain"
        :ssl-status="settings?.b2bSslStatus"
        :ssl-expires="settings?.b2bSslExpiresAt"
        :verifying="verifying.b2b"
        :setting-up-ssl="settingUpSsl.b2b"
        :dns-verified="dnsVerified.b2b"
        :dns-result="dnsResult.b2b"
        :saving="saving"
        @verify-dns="handleVerifyDns('b2b')"
        @setup-ssl="handleSetupSsl('b2b')"
        @remove-domain="handleRemoveDomain('b2b')"
      />

      <!-- PMS Domain moved to PMS Settings per-hotel -->
    </div>

    <!-- DNS Instructions -->
    <div
      class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
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

    <!-- Save Button -->
    <div class="flex justify-end">
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
</template>

<script setup>
import { ref, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import siteSettingsService from '@/services/siteSettingsService'
import DomainCard from '@/components/siteSettings/DomainCard.vue'

const { t } = useI18n()
const toast = useToast()

const props = defineProps({
  settings: Object,
  saving: Boolean,
  partnerType: String
})

const emit = defineEmits(['save', 'request-ssl', 'update:settings'])

const form = ref({
  b2cDomain: '',
  b2bDomain: ''
})

// DNS verification state
const verifying = reactive({ b2c: false, b2b: false })
const dnsVerified = reactive({ b2c: false, b2b: false })
const dnsResult = reactive({ b2c: null, b2b: null })
const settingUpSsl = reactive({ b2c: false, b2b: false })
const cnameTarget = ref('app.maxirez.com')
const serverIP = ref(null)

watch(
  () => props.settings,
  newSettings => {
    if (newSettings) {
      form.value = {
        b2cDomain: newSettings.b2cDomain || '',
        b2bDomain: newSettings.b2bDomain || ''
      }
    }
  },
  { immediate: true }
)

const handleVerifyDns = async type => {
  const domainMap = { b2c: 'b2cDomain', b2b: 'b2bDomain' }
  const domain = form.value[domainMap[type]]

  if (!domain) {
    toast.warning(t('siteSettings.setup.enterDomainFirst'))
    return
  }

  verifying[type] = true
  dnsResult[type] = null

  try {
    // First save only the relevant domain
    await siteSettingsService.updateSetup({ [domainMap[type]]: domain })

    // Then verify DNS
    const result = await siteSettingsService.verifyDns(type, domain)

    dnsVerified[type] = result.success
    dnsResult[type] = {
      success: result.success,
      message: result.message,
      cnameTarget: result.data?.cnameTarget,
      serverIP: result.data?.serverIP,
      domainIP: result.data?.domainIP
    }

    // Save CNAME target and server IP for display
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
    dnsResult[type] = {
      success: false,
      message: error.response?.data?.message || t('siteSettings.setup.dnsVerificationFailed')
    }
    toast.error(error.response?.data?.message || t('siteSettings.setup.dnsVerificationFailed'))
  } finally {
    verifying[type] = false
  }
}

const handleSetupSsl = async type => {
  settingUpSsl[type] = true

  try {
    const result = await siteSettingsService.setupSsl(type)

    if (result.success) {
      toast.success(t('siteSettings.setup.sslSetupComplete'))

      // Update settings
      emit('update:settings', result.data.setup)
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
    settingUpSsl[type] = false
  }
}

const handleRemoveDomain = async type => {
  if (!confirm(t('siteSettings.setup.deleteIdentityConfirm'))) return

  const domainMap = { b2c: 'b2cDomain', b2b: 'b2bDomain' }
  const field = domainMap[type]
  if (!field) return

  try {
    await siteSettingsService.updateSetup({ [field]: '' })
    form.value[field] = ''
    dnsVerified[type] = false
    dnsResult[type] = null

    // Reset SSL status in parent
    const sslStatusMap = { b2c: 'b2cSslStatus', b2b: 'b2bSslStatus' }
    const sslExpiryMap = { b2c: 'b2cSslExpiresAt', b2b: 'b2bSslExpiresAt' }
    if (props.settings) {
      emit('update:settings', {
        ...props.settings,
        [sslStatusMap[type]]: 'none',
        [sslExpiryMap[type]]: null,
        [field]: ''
      })
    }

    toast.success(t('siteSettings.setup.deleteIdentity'))
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.error'))
  }
}

const handleSave = () => {
  emit('save', form.value)
}
</script>
