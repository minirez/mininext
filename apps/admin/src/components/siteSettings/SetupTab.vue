<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <!-- B2C Domain -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <span class="material-icons text-purple-600 mr-2">language</span>
          {{ $t('siteSettings.setup.b2cDomain') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          {{ $t('siteSettings.setup.b2cDescription') }}
        </p>

        <div class="space-y-4">
          <div>
            <label class="form-label">{{ $t('siteSettings.setup.domain') }}</label>
            <input
              v-model="form.b2cDomain"
              type="text"
              class="form-input"
              placeholder="www.example.com"
            />
          </div>

          <!-- SSL Status & Actions -->
          <div class="border-t border-gray-200 dark:border-slate-600 pt-4 mt-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-gray-600 dark:text-slate-400">SSL:</span>
              <span
                class="badge"
                :class="getSslBadgeClass(settings?.b2cSslStatus)"
              >
                {{ getSslStatusText(settings?.b2cSslStatus) }}
              </span>
            </div>

            <!-- SSL Expiry Date -->
            <div v-if="settings?.b2cSslStatus === 'active' && settings?.b2cSslExpiresAt" class="text-xs text-gray-500 dark:text-slate-400 mb-3">
              {{ $t('siteSettings.setup.sslExpires') }}: {{ formatDate(settings.b2cSslExpiresAt) }}
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap gap-2">
              <!-- Verify DNS Button -->
              <button
                v-if="form.b2cDomain && settings?.b2cSslStatus !== 'active'"
                @click="handleVerifyDns('b2c')"
                class="btn-secondary text-sm flex-1"
                :disabled="verifying.b2c || saving"
              >
                <span v-if="verifying.b2c" class="flex items-center justify-center">
                  <svg class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ $t('siteSettings.setup.verifying') }}
                </span>
                <span v-else class="flex items-center justify-center">
                  <span class="material-icons text-sm mr-1">dns</span>
                  {{ $t('siteSettings.setup.verifyDns') }}
                </span>
              </button>

              <!-- Setup SSL Button (shown after DNS verified) -->
              <button
                v-if="form.b2cDomain && dnsVerified.b2c && settings?.b2cSslStatus !== 'active'"
                @click="handleSetupSsl('b2c')"
                class="btn-primary text-sm flex-1"
                :disabled="settingUpSsl.b2c || saving"
              >
                <span v-if="settingUpSsl.b2c" class="flex items-center justify-center">
                  <svg class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ $t('siteSettings.setup.settingUpSsl') }}
                </span>
                <span v-else class="flex items-center justify-center">
                  <span class="material-icons text-sm mr-1">security</span>
                  {{ $t('siteSettings.setup.setupSsl') }}
                </span>
              </button>
            </div>

            <!-- DNS Verification Result -->
            <div v-if="dnsResult.b2c" class="mt-3 p-3 rounded-lg text-sm" :class="dnsResult.b2c.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'">
              <div class="flex items-center">
                <span class="material-icons text-sm mr-2">{{ dnsResult.b2c.success ? 'check_circle' : 'error' }}</span>
                {{ dnsResult.b2c.message }}
              </div>
              <div v-if="!dnsResult.b2c.success && dnsResult.b2c.serverIP" class="mt-2 text-xs">
                {{ $t('siteSettings.setup.pointDomainTo') }}: <code class="bg-gray-200 dark:bg-slate-700 px-1 rounded">{{ dnsResult.b2c.serverIP }}</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- B2B Domain -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <span class="material-icons text-blue-600 mr-2">business</span>
          {{ $t('siteSettings.setup.b2bDomain') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          {{ $t('siteSettings.setup.b2bDescription') }}
        </p>

        <div class="space-y-4">
          <div>
            <label class="form-label">{{ $t('siteSettings.setup.domain') }}</label>
            <input
              v-model="form.b2bDomain"
              type="text"
              class="form-input"
              placeholder="extranet.example.com"
            />
          </div>

          <!-- SSL Status & Actions -->
          <div class="border-t border-gray-200 dark:border-slate-600 pt-4 mt-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-gray-600 dark:text-slate-400">SSL:</span>
              <span
                class="badge"
                :class="getSslBadgeClass(settings?.b2bSslStatus)"
              >
                {{ getSslStatusText(settings?.b2bSslStatus) }}
              </span>
            </div>

            <!-- SSL Expiry Date -->
            <div v-if="settings?.b2bSslStatus === 'active' && settings?.b2bSslExpiresAt" class="text-xs text-gray-500 dark:text-slate-400 mb-3">
              {{ $t('siteSettings.setup.sslExpires') }}: {{ formatDate(settings.b2bSslExpiresAt) }}
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap gap-2">
              <button
                v-if="form.b2bDomain && settings?.b2bSslStatus !== 'active'"
                @click="handleVerifyDns('b2b')"
                class="btn-secondary text-sm flex-1"
                :disabled="verifying.b2b || saving"
              >
                <span v-if="verifying.b2b" class="flex items-center justify-center">
                  <svg class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ $t('siteSettings.setup.verifying') }}
                </span>
                <span v-else class="flex items-center justify-center">
                  <span class="material-icons text-sm mr-1">dns</span>
                  {{ $t('siteSettings.setup.verifyDns') }}
                </span>
              </button>

              <button
                v-if="form.b2bDomain && dnsVerified.b2b && settings?.b2bSslStatus !== 'active'"
                @click="handleSetupSsl('b2b')"
                class="btn-primary text-sm flex-1"
                :disabled="settingUpSsl.b2b || saving"
              >
                <span v-if="settingUpSsl.b2b" class="flex items-center justify-center">
                  <svg class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ $t('siteSettings.setup.settingUpSsl') }}
                </span>
                <span v-else class="flex items-center justify-center">
                  <span class="material-icons text-sm mr-1">security</span>
                  {{ $t('siteSettings.setup.setupSsl') }}
                </span>
              </button>
            </div>

            <!-- DNS Verification Result -->
            <div v-if="dnsResult.b2b" class="mt-3 p-3 rounded-lg text-sm" :class="dnsResult.b2b.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'">
              <div class="flex items-center">
                <span class="material-icons text-sm mr-2">{{ dnsResult.b2b.success ? 'check_circle' : 'error' }}</span>
                {{ dnsResult.b2b.message }}
              </div>
              <div v-if="!dnsResult.b2b.success && dnsResult.b2b.serverIP" class="mt-2 text-xs">
                {{ $t('siteSettings.setup.pointDomainTo') }}: <code class="bg-gray-200 dark:bg-slate-700 px-1 rounded">{{ dnsResult.b2b.serverIP }}</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PMS Domain -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <span class="material-icons text-indigo-600 mr-2">hotel</span>
          {{ $t('siteSettings.setup.pmsDomain') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          {{ $t('siteSettings.setup.pmsDescription') }}
        </p>

        <div class="space-y-4">
          <div>
            <label class="form-label">{{ $t('siteSettings.setup.domain') }}</label>
            <input
              v-model="form.pmsDomain"
              type="text"
              class="form-input"
              placeholder="pms.example.com"
            />
          </div>

          <!-- SSL Status & Actions -->
          <div class="border-t border-gray-200 dark:border-slate-600 pt-4 mt-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-gray-600 dark:text-slate-400">SSL:</span>
              <span
                class="badge"
                :class="getSslBadgeClass(settings?.pmsSslStatus)"
              >
                {{ getSslStatusText(settings?.pmsSslStatus) }}
              </span>
            </div>

            <!-- SSL Expiry Date -->
            <div v-if="settings?.pmsSslStatus === 'active' && settings?.pmsSslExpiresAt" class="text-xs text-gray-500 dark:text-slate-400 mb-3">
              {{ $t('siteSettings.setup.sslExpires') }}: {{ formatDate(settings.pmsSslExpiresAt) }}
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap gap-2">
              <button
                v-if="form.pmsDomain && settings?.pmsSslStatus !== 'active'"
                @click="handleVerifyDns('pms')"
                class="btn-secondary text-sm flex-1"
                :disabled="verifying.pms || saving"
              >
                <span v-if="verifying.pms" class="flex items-center justify-center">
                  <svg class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ $t('siteSettings.setup.verifying') }}
                </span>
                <span v-else class="flex items-center justify-center">
                  <span class="material-icons text-sm mr-1">dns</span>
                  {{ $t('siteSettings.setup.verifyDns') }}
                </span>
              </button>

              <button
                v-if="form.pmsDomain && dnsVerified.pms && settings?.pmsSslStatus !== 'active'"
                @click="handleSetupSsl('pms')"
                class="btn-primary text-sm flex-1"
                :disabled="settingUpSsl.pms || saving"
              >
                <span v-if="settingUpSsl.pms" class="flex items-center justify-center">
                  <svg class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ $t('siteSettings.setup.settingUpSsl') }}
                </span>
                <span v-else class="flex items-center justify-center">
                  <span class="material-icons text-sm mr-1">security</span>
                  {{ $t('siteSettings.setup.setupSsl') }}
                </span>
              </button>
            </div>

            <!-- DNS Verification Result -->
            <div v-if="dnsResult.pms" class="mt-3 p-3 rounded-lg text-sm" :class="dnsResult.pms.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'">
              <div class="flex items-center">
                <span class="material-icons text-sm mr-2">{{ dnsResult.pms.success ? 'check_circle' : 'error' }}</span>
                {{ dnsResult.pms.message }}
              </div>
              <div v-if="!dnsResult.pms.success && dnsResult.pms.serverIP" class="mt-2 text-xs">
                {{ $t('siteSettings.setup.pointDomainTo') }}: <code class="bg-gray-200 dark:bg-slate-700 px-1 rounded">{{ dnsResult.pms.serverIP }}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DNS Instructions -->
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h4 class="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
        <span class="material-icons text-sm mr-2">info</span>
        {{ $t('siteSettings.setup.dnsInstructions') }}
      </h4>
      <p class="text-sm text-blue-700 dark:text-blue-400">
        {{ $t('siteSettings.setup.dnsDescription') }}
      </p>
      <div class="mt-2 p-2 bg-blue-100 dark:bg-blue-900/40 rounded text-xs text-blue-800 dark:text-blue-300 font-mono">
        <div>{{ $t('siteSettings.setup.dnsRecordType') }}: A</div>
        <div>{{ $t('siteSettings.setup.dnsRecordValue') }}: {{ serverIP || '...' }}</div>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end">
      <button
        @click="handleSave"
        class="btn-primary"
        :disabled="saving"
      >
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
  </div>
</template>

<script setup>
import { ref, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import siteSettingsService from '@/services/siteSettingsService'

const { t } = useI18n()
const toast = useToast()

const props = defineProps({
  settings: Object,
  saving: Boolean
})

const emit = defineEmits(['save', 'request-ssl', 'update:settings'])

const form = ref({
  b2cDomain: '',
  b2bDomain: '',
  pmsDomain: ''
})

// DNS verification state
const verifying = reactive({ b2c: false, b2b: false, pms: false })
const dnsVerified = reactive({ b2c: false, b2b: false, pms: false })
const dnsResult = reactive({ b2c: null, b2b: null, pms: null })
const settingUpSsl = reactive({ b2c: false, b2b: false, pms: false })
const serverIP = ref(null)

watch(() => props.settings, (newSettings) => {
  if (newSettings) {
    form.value = {
      b2cDomain: newSettings.b2cDomain || '',
      b2bDomain: newSettings.b2bDomain || '',
      pmsDomain: newSettings.pmsDomain || ''
    }
  }
}, { immediate: true })

const getSslBadgeClass = (status) => {
  return {
    'badge-success': status === 'active',
    'badge-warning': status === 'pending',
    'badge-danger': status === 'failed',
    'badge-secondary': !status || status === 'none'
  }
}

const getSslStatusText = (status) => {
  const statusMap = {
    active: t('siteSettings.setup.sslActive'),
    pending: t('siteSettings.setup.sslPending'),
    failed: t('siteSettings.setup.sslFailed'),
    none: t('siteSettings.setup.sslNone')
  }
  return statusMap[status] || statusMap.none
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

const handleVerifyDns = async (type) => {
  const domainMap = { b2c: 'b2cDomain', b2b: 'b2bDomain', pms: 'pmsDomain' }
  const domain = form.value[domainMap[type]]

  if (!domain) {
    toast.warning(t('siteSettings.setup.enterDomainFirst'))
    return
  }

  verifying[type] = true
  dnsResult[type] = null

  try {
    // First save the domain
    await siteSettingsService.updateSetup(form.value)

    // Then verify DNS
    const result = await siteSettingsService.verifyDns(type, domain)

    dnsVerified[type] = result.success
    dnsResult[type] = {
      success: result.success,
      message: result.message,
      serverIP: result.data?.serverIP,
      domainIP: result.data?.domainIP
    }

    // Save server IP for display
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

const handleSetupSsl = async (type) => {
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

const handleSave = () => {
  emit('save', form.value)
}
</script>
