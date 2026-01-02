<template>
  <div class="space-y-6">
    <!-- Email Provider Selection -->
    <div class="space-y-4">
      <!-- Platform Email Option -->
      <label
        class="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all"
        :class="!useOwnDomain
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
          : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
      >
        <input
          type="radio"
          v-model="useOwnDomain"
          :value="false"
          class="mt-1 text-purple-600 focus:ring-purple-500"
        />
        <div class="ml-3">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ $t('siteSettings.notifications.email.usePlatformEmail') }}
          </span>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('siteSettings.notifications.email.usePlatformEmailDesc') }}
          </p>
        </div>
      </label>

      <!-- Own Domain Option -->
      <label
        class="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all"
        :class="useOwnDomain
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
          : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
      >
        <input
          type="radio"
          v-model="useOwnDomain"
          :value="true"
          class="mt-1 text-purple-600 focus:ring-purple-500"
        />
        <div class="ml-3">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ $t('siteSettings.notifications.email.useOwnDomain') }}
          </span>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('siteSettings.notifications.email.useOwnDomainDesc') }}
          </p>
        </div>
      </label>
    </div>

    <!-- Own Domain Configuration -->
    <div v-if="useOwnDomain" class="space-y-6">
      <!-- Step 1: Domain & Sender Info -->
      <div v-if="!domainVerification" class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-6">
        <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span class="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 text-sm flex items-center justify-center mr-2">1</span>
          {{ $t('siteSettings.notifications.email.domainAndSender') }}
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">{{ $t('siteSettings.notifications.email.domain') }} *</label>
            <input
              v-model="form.domain"
              type="text"
              class="form-input"
              :placeholder="$t('siteSettings.notifications.email.domainPlaceholder')"
            />
          </div>
          <div>
            <label class="form-label">{{ $t('siteSettings.notifications.email.fromEmail') }}</label>
            <input
              v-model="form.fromEmail"
              type="email"
              class="form-input"
              :placeholder="$t('siteSettings.notifications.email.fromEmailPlaceholder')"
            />
          </div>
          <div class="md:col-span-2">
            <label class="form-label">{{ $t('siteSettings.notifications.email.fromName') }}</label>
            <input
              v-model="form.fromName"
              type="text"
              class="form-input"
              :placeholder="$t('siteSettings.notifications.email.fromNamePlaceholder')"
            />
          </div>
        </div>

        <div class="mt-6">
          <button
            @click="handleCreateIdentity"
            :disabled="!form.domain || creatingIdentity"
            class="btn-primary"
          >
            <span v-if="creatingIdentity" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ $t('siteSettings.notifications.email.creatingIdentity') }}
            </span>
            <span v-else class="flex items-center">
              <span class="material-icons text-sm mr-1">add_circle</span>
              {{ $t('siteSettings.notifications.email.createIdentity') }}
            </span>
          </button>
        </div>
      </div>

      <!-- Step 2: DNS Records (after domain created) -->
      <div v-if="domainVerification" class="space-y-4">
        <!-- Domain Info Header -->
        <div class="flex items-center justify-between bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-4">
          <div class="flex items-center">
            <span class="material-icons text-purple-500 mr-2">domain</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ domainVerification.domain }}</span>
            <span
              class="ml-3 px-2 py-1 text-xs font-medium rounded-full"
              :class="{
                'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300': domainVerification.status === 'verified',
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300': domainVerification.status === 'pending',
                'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300': domainVerification.status === 'failed',
                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300': !['verified', 'pending', 'failed'].includes(domainVerification.status)
              }"
            >
              {{ $t('siteSettings.notifications.email.' + domainVerification.status) }}
            </span>
          </div>
          <button
            @click="handleDeleteIdentity"
            :disabled="deletingIdentity"
            class="text-red-500 hover:text-red-600 flex items-center text-sm"
          >
            <span v-if="deletingIdentity" class="material-icons animate-spin text-sm mr-1">refresh</span>
            <span v-else class="material-icons text-sm mr-1">delete</span>
            {{ $t('siteSettings.notifications.email.deleteIdentity') }}
          </button>
        </div>

        <!-- DNS Records -->
        <div class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-6">
          <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <span class="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 text-sm flex items-center justify-center mr-2">2</span>
            {{ $t('siteSettings.notifications.email.dnsRecords') }}
          </h4>
          <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
            {{ $t('siteSettings.notifications.email.dnsRecordsHelp') }}
          </p>

          <!-- DNS Records Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">
                    {{ $t('siteSettings.notifications.email.recordType') }}
                  </th>
                  <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">
                    {{ $t('siteSettings.notifications.email.recordName') }}
                  </th>
                  <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">
                    {{ $t('siteSettings.notifications.email.recordValue') }}
                  </th>
                  <th class="px-3 py-2 w-20"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-slate-600">
                <tr v-for="(record, index) in dnsRecords" :key="index" class="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td class="px-3 py-3">
                    <span class="px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                      {{ record.type }}
                    </span>
                  </td>
                  <td class="px-3 py-3 font-mono text-xs break-all max-w-xs">
                    {{ record.name }}
                  </td>
                  <td class="px-3 py-3 font-mono text-xs break-all max-w-xs">
                    {{ record.value }}
                  </td>
                  <td class="px-3 py-3">
                    <button
                      @click="copyToClipboard(record)"
                      class="text-purple-600 hover:text-purple-700 flex items-center text-xs"
                    >
                      <span class="material-icons text-sm">content_copy</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Step 3: Verification -->
        <div class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-6">
          <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span class="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 text-sm flex items-center justify-center mr-2">3</span>
            {{ $t('siteSettings.notifications.email.verificationStatus') }}
          </h4>

          <div class="flex items-center gap-4">
            <button
              @click="handleCheckVerification"
              :disabled="checkingVerification"
              class="btn-secondary"
            >
              <span v-if="checkingVerification" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ $t('siteSettings.notifications.email.checking') }}
              </span>
              <span v-else class="flex items-center">
                <span class="material-icons text-sm mr-1">refresh</span>
                {{ $t('siteSettings.notifications.email.checkVerification') }}
              </span>
            </button>

            <div v-if="domainVerification.status === 'verified'" class="flex items-center text-green-600">
              <span class="material-icons mr-1">check_circle</span>
              {{ $t('siteSettings.notifications.email.verified') }}
            </div>
            <div v-else-if="domainVerification.status === 'pending'" class="flex items-center text-yellow-600">
              <span class="material-icons mr-1">schedule</span>
              {{ $t('siteSettings.notifications.email.pending') }}
            </div>
            <div v-else-if="domainVerification.status === 'failed'" class="flex items-center text-red-600">
              <span class="material-icons mr-1">error</span>
              {{ $t('siteSettings.notifications.email.failed') }}
            </div>
          </div>
        </div>

        <!-- Step 4: Test Email (only if verified) -->
        <div v-if="domainVerification.status === 'verified'" class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-6">
          <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span class="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 text-sm flex items-center justify-center mr-2">4</span>
            {{ $t('siteSettings.notifications.email.sendTestEmail') }}
          </h4>

          <div class="flex items-center gap-3">
            <div class="flex-1">
              <input
                v-model="testEmailAddress"
                type="email"
                class="form-input"
                :placeholder="$t('siteSettings.notifications.email.testEmailAddress')"
              />
            </div>
            <button
              @click="handleTestEmail"
              :disabled="!testEmailAddress || sendingTest"
              class="btn-primary"
            >
              <span v-if="sendingTest" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ $t('common.loading') }}
              </span>
              <span v-else class="flex items-center">
                <span class="material-icons text-sm mr-1">send</span>
                {{ $t('siteSettings.notifications.email.sendTestEmail') }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import partnerEmailService from '@/services/partnerEmailService'

const { t } = useI18n()
const toast = useToast()

const props = defineProps({
  partnerId: {
    type: String,
    required: true
  },
  emailSettings: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update', 'saved'])

// State
const useOwnDomain = ref(false)
const creatingIdentity = ref(false)
const deletingIdentity = ref(false)
const checkingVerification = ref(false)
const sendingTest = ref(false)
const testEmailAddress = ref('')

const form = ref({
  domain: '',
  fromEmail: '',
  fromName: ''
})

const domainVerification = ref(null)
const dnsRecords = ref([])

// Initialize from props
watch(() => props.emailSettings, (settings) => {
  if (settings) {
    useOwnDomain.value = settings.useOwnSES || false
    if (settings.domainVerification) {
      domainVerification.value = settings.domainVerification
      // Generate DNS records from tokens
      if (settings.domainVerification.dkimTokens) {
        dnsRecords.value = generateDnsRecords(
          settings.domainVerification.domain,
          settings.domainVerification.dkimTokens
        )
      }
    }
    if (settings.aws) {
      form.value.fromEmail = settings.aws.fromEmail || ''
      form.value.fromName = settings.aws.fromName || ''
    }
  }
}, { immediate: true })

// Watch useOwnDomain changes
watch(useOwnDomain, async (value) => {
  if (!value && domainVerification.value) {
    // Switching to platform email, update settings
    try {
      await partnerEmailService.updateEmailSettings(props.partnerId, {
        useOwnSES: false
      })
      emit('saved')
    } catch (error) {
      console.error('Failed to update email settings:', error)
    }
  }
})

// Generate DNS records
function generateDnsRecords(domain, dkimTokens) {
  const records = []

  // DKIM CNAME records
  if (dkimTokens) {
    dkimTokens.forEach((token, i) => {
      records.push({
        type: 'CNAME',
        name: `${token}._domainkey.${domain}`,
        value: `${token}.dkim.amazonses.com`,
        purpose: `DKIM Key ${i + 1}`
      })
    })
  }

  // SPF record
  records.push({
    type: 'TXT',
    name: domain,
    value: 'v=spf1 include:amazonses.com ~all',
    purpose: 'SPF Record'
  })

  return records
}

// Create domain identity
async function handleCreateIdentity() {
  if (!form.value.domain) return

  creatingIdentity.value = true
  try {
    const result = await partnerEmailService.createIdentity(props.partnerId, {
      domain: form.value.domain,
      fromEmail: form.value.fromEmail,
      fromName: form.value.fromName
    })

    domainVerification.value = {
      domain: result.domain,
      status: result.dkimStatus || 'pending',
      dkimTokens: result.dkimTokens
    }

    dnsRecords.value = result.dnsRecords || generateDnsRecords(result.domain, result.dkimTokens)

    toast.success(t('siteSettings.notifications.email.identityCreated'))
    emit('saved')
  } catch (error) {
    toast.error(error.response?.data?.error || t('common.operationFailed'))
  } finally {
    creatingIdentity.value = false
  }
}

// Check verification status
async function handleCheckVerification() {
  checkingVerification.value = true
  try {
    const result = await partnerEmailService.getVerificationStatus(props.partnerId)

    domainVerification.value = {
      ...domainVerification.value,
      status: result.status,
      verified: result.verified
    }

    if (result.dnsRecords) {
      dnsRecords.value = result.dnsRecords
    }

    if (result.verified) {
      toast.success(t('siteSettings.notifications.email.verified'))
    } else {
      toast.info(t('siteSettings.notifications.email.' + result.status))
    }

    emit('saved')
  } catch (error) {
    toast.error(error.response?.data?.error || t('common.operationFailed'))
  } finally {
    checkingVerification.value = false
  }
}

// Delete domain identity
async function handleDeleteIdentity() {
  if (!confirm(t('siteSettings.notifications.email.deleteIdentityConfirm'))) return

  deletingIdentity.value = true
  try {
    await partnerEmailService.deleteIdentity(props.partnerId)

    domainVerification.value = null
    dnsRecords.value = []
    form.value = { domain: '', fromEmail: '', fromName: '' }

    toast.success(t('siteSettings.notifications.email.identityDeleted'))
    emit('saved')
  } catch (error) {
    toast.error(error.response?.data?.error || t('common.operationFailed'))
  } finally {
    deletingIdentity.value = false
  }
}

// Send test email
async function handleTestEmail() {
  if (!testEmailAddress.value) return

  sendingTest.value = true
  try {
    await partnerEmailService.testEmail(props.partnerId, testEmailAddress.value)
    toast.success(t('siteSettings.notifications.email.testEmailSent'))
  } catch (error) {
    toast.error(error.response?.data?.error || t('common.operationFailed'))
  } finally {
    sendingTest.value = false
  }
}

// Copy to clipboard
function copyToClipboard(record) {
  const text = `${record.name}\t${record.value}`
  navigator.clipboard.writeText(text).then(() => {
    toast.success(t('siteSettings.notifications.email.copied'))
  })
}
</script>
