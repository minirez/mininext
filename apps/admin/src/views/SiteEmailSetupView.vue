<template>
  <div class="space-y-6">
    <!-- Use Own SES Toggle -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ $t('emailSetup.useOwnSES') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">
            {{ $t('emailSetup.useOwnSESDesc') }}
          </p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            v-model="form.useOwnSES"
            type="checkbox"
            class="sr-only peer"
            @change="handleToggleChange"
          />
          <div
            class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-purple-600"
          ></div>
        </label>
      </div>
    </div>

    <!-- AWS Credentials Section -->
    <transition name="fade">
      <div v-if="form.useOwnSES" class="space-y-6">
        <!-- AWS Credentials Card -->
        <div
          class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
        >
          <div class="p-4 border-b border-gray-200 dark:border-slate-700">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
              <span class="material-icons text-orange-500 mr-2">cloud</span>
              {{ $t('emailSetup.awsCredentials') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <!-- Region -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('emailSetup.region') }}
              </label>
              <select
                v-model="form.aws.region"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                <option value="eu-west-1">EU (Ireland) - eu-west-1</option>
                <option value="eu-central-1">EU (Frankfurt) - eu-central-1</option>
                <option value="us-east-1">US East (N. Virginia) - us-east-1</option>
                <option value="us-west-2">US West (Oregon) - us-west-2</option>
                <option value="ap-southeast-1">Asia Pacific (Singapore) - ap-southeast-1</option>
              </select>
            </div>

            <!-- Access Key ID -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('emailSetup.accessKeyId') }}
              </label>
              <input
                v-model="form.aws.accessKeyId"
                type="text"
                :placeholder="$t('emailSetup.accessKeyIdPlaceholder')"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
            </div>

            <!-- Secret Access Key -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('emailSetup.secretAccessKey') }}
              </label>
              <div class="relative">
                <input
                  v-model="form.aws.secretAccessKey"
                  :type="showSecretKey ? 'text' : 'password'"
                  :placeholder="$t('emailSetup.secretAccessKeyPlaceholder')"
                  class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
                  @click="showSecretKey = !showSecretKey"
                >
                  <span class="material-icons text-xl">{{
                    showSecretKey ? 'visibility_off' : 'visibility'
                  }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Domain Verification Card -->
        <div
          class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
        >
          <div class="p-4 border-b border-gray-200 dark:border-slate-700">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
              <span class="material-icons text-blue-500 mr-2">verified</span>
              {{ $t('emailSetup.domainVerification') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <!-- Domain Input -->
            <div class="flex space-x-2">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('emailSetup.domain') }}
                </label>
                <input
                  v-model="form.domain"
                  type="text"
                  :placeholder="$t('emailSetup.domainPlaceholder')"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div class="flex items-end">
                <button
                  :disabled="!form.domain || verifyingDomain"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  @click="verifyDomain"
                >
                  <span v-if="verifyingDomain" class="material-icons animate-spin mr-2"
                    >refresh</span
                  >
                  {{ $t('emailSetup.verifyDomain') }}
                </button>
              </div>
            </div>

            <!-- Domain Status -->
            <div v-if="form.domainVerification?.status" class="mt-4">
              <div class="flex items-center space-x-2 mb-3">
                <span class="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {{ $t('emailSetup.status') }}:
                </span>
                <span
                  :class="{
                    'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400':
                      form.domainVerification.status === 'pending',
                    'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400':
                      form.domainVerification.status === 'verified',
                    'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400':
                      form.domainVerification.status === 'failed'
                  }"
                  class="px-2 py-1 rounded-full text-xs font-medium"
                >
                  {{ $t(`emailSetup.domainStatus.${form.domainVerification.status}`) }}
                </span>
              </div>

              <!-- DKIM Records -->
              <div
                v-if="form.domainVerification.dkimTokens?.length"
                class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4"
              >
                <p class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                  {{ $t('emailSetup.dkimRecords') }}
                </p>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="text-left border-b border-gray-200 dark:border-slate-600">
                        <th class="pb-2 text-gray-600 dark:text-slate-400">
                          {{ $t('emailSetup.recordType') }}
                        </th>
                        <th class="pb-2 text-gray-600 dark:text-slate-400">
                          {{ $t('emailSetup.recordName') }}
                        </th>
                        <th class="pb-2 text-gray-600 dark:text-slate-400">
                          {{ $t('emailSetup.recordValue') }}
                        </th>
                        <th class="pb-2 text-gray-600 dark:text-slate-400 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(token, index) in form.domainVerification.dkimTokens"
                        :key="index"
                        class="border-b border-gray-100 dark:border-slate-600/50"
                      >
                        <td class="py-2 font-mono text-gray-800 dark:text-white">CNAME</td>
                        <td class="py-2 font-mono text-xs text-gray-800 dark:text-white break-all">
                          {{ token }}._domainkey.{{ form.domainVerification.domain }}
                        </td>
                        <td class="py-2 font-mono text-xs text-gray-800 dark:text-white break-all">
                          {{ token }}.dkim.amazonses.com
                        </td>
                        <td class="py-2">
                          <button
                            class="p-1 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
                            :title="$t('common.copy')"
                            @click="copyToClipboard(`${token}.dkim.amazonses.com`)"
                          >
                            <span class="material-icons text-lg">content_copy</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <button
                  :disabled="checkingStatus"
                  class="mt-4 px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 flex items-center"
                  @click="checkDomainStatus"
                >
                  <span v-if="checkingStatus" class="material-icons animate-spin mr-2"
                    >refresh</span
                  >
                  <span v-else class="material-icons mr-2">sync</span>
                  {{ $t('emailSetup.checkStatus') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sender Settings Card -->
        <div
          class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
        >
          <div class="p-4 border-b border-gray-200 dark:border-slate-700">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
              <span class="material-icons text-green-500 mr-2">mail_outline</span>
              {{ $t('emailSetup.senderSettings') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <!-- From Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('emailSetup.fromEmail') }}
              </label>
              <input
                v-model="form.aws.fromEmail"
                type="email"
                :placeholder="$t('emailSetup.fromEmailPlaceholder')"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
            </div>

            <!-- From Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('emailSetup.fromName') }}
              </label>
              <input
                v-model="form.aws.fromName"
                type="text"
                :placeholder="$t('emailSetup.fromNamePlaceholder')"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        <!-- Test Email Section -->
        <div
          class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
        >
          <div class="p-4 border-b border-gray-200 dark:border-slate-700">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
              <span class="material-icons text-purple-500 mr-2">send</span>
              {{ $t('emailSetup.testEmail') }}
            </h3>
          </div>
          <div class="p-6">
            <div class="flex space-x-2">
              <input
                v-model="testEmail"
                type="email"
                :placeholder="$t('emailSetup.testEmailPlaceholder')"
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
              <button
                :disabled="!testEmail || sendingTest"
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                @click="sendTestEmail"
              >
                <span v-if="sendingTest" class="material-icons animate-spin mr-2">refresh</span>
                <span v-else class="material-icons mr-2">send</span>
                {{ $t('emailSetup.sendTest') }}
              </button>
            </div>
            <p class="mt-2 text-xs text-gray-500 dark:text-slate-400">
              {{ $t('emailSetup.testEmailHint') }}
            </p>
          </div>
        </div>
      </div>
    </transition>

    <!-- Platform Default Info -->
    <div
      v-if="!form.useOwnSES"
      class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6"
    >
      <div class="flex items-start">
        <span class="material-icons text-blue-500 mr-3">info</span>
        <div>
          <h4 class="font-medium text-blue-800 dark:text-blue-300">
            {{ $t('emailSetup.usingPlatformDefault') }}
          </h4>
          <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">
            {{ $t('emailSetup.usingPlatformDefaultDesc') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
      <button
        :disabled="saving"
        class="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
        @click="saveSettings"
      >
        <span v-if="saving" class="material-icons animate-spin mr-2">refresh</span>
        <span v-else class="material-icons mr-2">save</span>
        {{ $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { usePartnerContext } from '@/composables/usePartnerContext'
import { useAsyncAction } from '@/composables/useAsyncAction'
import * as partnerEmailService from '@/services/partnerEmailService'

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()

// Async action composables
const { execute: executeLoad } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })
const { isLoading: saving, execute: executeSave } = useAsyncAction({ showErrorToast: false })
const { isLoading: verifyingDomain, execute: executeVerifyDomain } = useAsyncAction({ showErrorToast: false })
const { isLoading: checkingStatus, execute: executeCheckStatus } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })
const { isLoading: sendingTest, execute: executeSendTest } = useAsyncAction({ showErrorToast: false })

const showSecretKey = ref(false)
const testEmail = ref('')

const form = reactive({
  useOwnSES: false,
  aws: {
    region: 'eu-west-1',
    accessKeyId: '',
    secretAccessKey: '',
    fromEmail: '',
    fromName: ''
  },
  domain: '',
  domainVerification: null
})

// Get partner context
const { currentPartnerId } = usePartnerContext({
  onPartnerChange: partner => {
    if (partner) {
      loadSettings()
    }
  },
  immediate: true
})

const loadSettings = async () => {
  const partnerId = currentPartnerId.value || authStore.user?.partner
  if (!partnerId) return

  await executeLoad(
    () => partnerEmailService.getEmailSettings(partnerId),
    {
      onSuccess: settings => {
        if (settings) {
          form.useOwnSES = settings.useOwnSES || false
          form.aws = {
            region: settings.aws?.region || 'eu-west-1',
            accessKeyId: settings.aws?.accessKeyId || '',
            secretAccessKey: '', // Never load secret key
            fromEmail: settings.aws?.fromEmail || '',
            fromName: settings.aws?.fromName || ''
          }
          form.domain = settings.domainVerification?.domain || ''
          form.domainVerification = settings.domainVerification || null
        }
      },
      onError: error => {
        console.error('Failed to load email settings:', error)
        toast.error(t('emailSetup.loadError'))
      }
    }
  )
}

const handleToggleChange = () => {
  if (!form.useOwnSES) {
    // Reset form when disabling
    form.aws = {
      region: 'eu-west-1',
      accessKeyId: '',
      secretAccessKey: '',
      fromEmail: '',
      fromName: ''
    }
    form.domain = ''
    form.domainVerification = null
  }
}

const verifyDomain = async () => {
  const partnerId = currentPartnerId.value || authStore.user?.partner

  await executeVerifyDomain(
    () => partnerEmailService.verifyDomain(partnerId, form.domain),
    {
      successMessage: 'emailSetup.domainVerificationStarted',
      onSuccess: result => {
        form.domainVerification = result.domainVerification
      },
      onError: error => {
        console.error('Domain verification failed:', error)
        toast.error(error.response?.data?.message || t('emailSetup.domainVerificationError'))
      }
    }
  )
}

const checkDomainStatus = async () => {
  const partnerId = currentPartnerId.value || authStore.user?.partner

  await executeCheckStatus(
    () => partnerEmailService.getDomainStatus(partnerId),
    {
      onSuccess: result => {
        form.domainVerification = result.domainVerification
        if (result.domainVerification?.status === 'verified') {
          toast.success(t('emailSetup.domainVerified'))
        } else {
          toast.info(t('emailSetup.domainStillPending'))
        }
      },
      onError: error => {
        console.error('Status check failed:', error)
        toast.error(t('emailSetup.statusCheckError'))
      }
    }
  )
}

const sendTestEmail = async () => {
  const partnerId = currentPartnerId.value || authStore.user?.partner

  await executeSendTest(
    () => partnerEmailService.testEmail(partnerId, testEmail.value),
    {
      successMessage: 'emailSetup.testEmailSent',
      onError: error => {
        console.error('Test email failed:', error)
        toast.error(error.response?.data?.message || t('emailSetup.testEmailError'))
      }
    }
  )
}

const saveSettings = async () => {
  const partnerId = currentPartnerId.value || authStore.user?.partner

  await executeSave(
    () => partnerEmailService.updateEmailSettings(partnerId, {
      useOwnSES: form.useOwnSES,
      aws: form.useOwnSES ? form.aws : null
    }),
    {
      successMessage: 'emailSetup.settingsSaved',
      onError: error => {
        console.error('Save failed:', error)
        toast.error(error.response?.data?.message || t('emailSetup.saveError'))
      }
    }
  )
}

const copyToClipboard = async text => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(t('common.copied'))
  } catch {
    toast.error(t('common.copyError'))
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
