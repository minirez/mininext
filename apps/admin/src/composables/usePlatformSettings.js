import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useAsyncAction } from '@/composables/useAsyncAction'
import platformSettingsService from '@/services/platformSettingsService'

export function usePlatformSettings() {
  const { t } = useI18n()
  const toast = useToast()

  // Dirty tracking
  const isDirty = ref(false)
  const lastSaveTime = ref(null)
  let watchStarted = false

  // Async actions
  const { isLoading: loading, execute: executeLoad } = useAsyncAction({
    showSuccessToast: false,
    showErrorToast: false
  })
  const { isLoading: saving, execute: executeSave } = useAsyncAction({ showErrorToast: false })
  const { isLoading: testingEmail, execute: executeTestEmail } = useAsyncAction({
    showErrorToast: false
  })
  const { isLoading: testingSMS, execute: executeTestSMS } = useAsyncAction({
    showErrorToast: false
  })
  const { isLoading: testingPaximum, execute: executeTestPaximum } = useAsyncAction({
    showErrorToast: false
  })
  const { isLoading: generatingVAPID, execute: executeGenerateVAPID } = useAsyncAction({
    showErrorToast: false
  })

  // State
  const testEmailAddress = ref('')
  const testPhoneNumber = ref('')

  const settings = ref({
    aws: {
      ses: {
        enabled: false,
        region: 'eu-west-1',
        accessKeyId: '',
        secretAccessKey: '',
        fromEmail: '',
        fromName: ''
      }
    },
    netgsm: {
      enabled: false,
      usercode: '',
      password: '',
      msgheader: ''
    },
    gemini: {
      enabled: false,
      apiKey: ''
    },
    firecrawl: {
      enabled: false,
      apiKey: ''
    },
    paximum: {
      enabled: false,
      endpoint: 'https://service.paximum.com/v2',
      agency: '',
      user: '',
      password: '',
      defaultMarkup: 10
    },
    webPush: {
      enabled: false,
      publicKey: '',
      privateKey: '',
      contactEmail: ''
    },
    billing: {
      companyName: '',
      taxNumber: '',
      taxOffice: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        country: '',
        postalCode: ''
      },
      invoicePrefix: 'INV',
      defaultTaxRate: 0,
      invoiceNotes: '',
      bankAccounts: [],
      bankTransferDescription: {},
      bankTransferEnabled: false
    }
  })

  // Load settings
  const loadSettings = async () => {
    await executeLoad(() => platformSettingsService.getSettings(), {
      onSuccess: data => {
        // Merge with defaults - will reset isDirty after nextTick
        settings.value = {
          aws: {
            ses: {
              enabled: data.aws?.ses?.enabled || false,
              region: data.aws?.ses?.region || 'eu-west-1',
              accessKeyId: '', // Don't show masked value
              secretAccessKey: '', // Don't show masked value
              fromEmail: data.aws?.ses?.fromEmail || '',
              fromName: data.aws?.ses?.fromName || ''
            }
          },
          netgsm: {
            enabled: data.netgsm?.enabled || false,
            usercode: '', // Don't show masked value
            password: '', // Don't show masked value
            msgheader: data.netgsm?.msgheader || ''
          },
          gemini: {
            enabled: data.gemini?.enabled || false,
            apiKey: '' // Don't show masked value
          },
          firecrawl: {
            enabled: data.firecrawl?.enabled || false,
            apiKey: '' // Don't show masked value
          },
          paximum: {
            enabled: data.paximum?.enabled || false,
            endpoint: data.paximum?.endpoint || 'https://service.paximum.com/v2',
            agency: '', // Don't show masked value
            user: '', // Don't show masked value
            password: '', // Don't show masked value
            defaultMarkup: data.paximum?.defaultMarkup ?? 10
          },
          webPush: {
            enabled: data.webPush?.enabled || false,
            publicKey: data.webPush?.publicKey || '',
            privateKey: '', // Don't show masked value
            contactEmail: data.webPush?.contactEmail || ''
          },
          billing: {
            companyName: data.billing?.companyName || '',
            taxNumber: data.billing?.taxNumber || '',
            taxOffice: data.billing?.taxOffice || '',
            email: data.billing?.email || '',
            phone: data.billing?.phone || '',
            address: {
              street: data.billing?.address?.street || '',
              city: data.billing?.address?.city || '',
              country: data.billing?.address?.country || '',
              postalCode: data.billing?.address?.postalCode || ''
            },
            invoicePrefix: data.billing?.invoicePrefix || 'INV',
            defaultTaxRate: data.billing?.defaultTaxRate ?? 0,
            invoiceNotes: data.billing?.invoiceNotes || '',
            bankAccounts: data.billing?.bankAccounts || [],
            bankTransferDescription: data.billing?.bankTransferDescription || {},
            bankTransferEnabled: data.billing?.bankTransferEnabled || false
          }
        }

        // Start dirty tracking after initial load
        nextTick(() => {
          isDirty.value = false
          if (!watchStarted) {
            watchStarted = true
            watch(
              settings,
              () => {
                isDirty.value = true
              },
              { deep: true }
            )
          }
        })
      },
      onError: error => {
        toast.error(t('common.error') + ': ' + error.message)
      }
    })
  }

  // Save settings
  const saveSettings = async () => {
    // Build update object - only include non-empty credential fields
    const update = {
      aws: {
        ses: {
          enabled: settings.value.aws.ses.enabled,
          region: settings.value.aws.ses.region,
          fromEmail: settings.value.aws.ses.fromEmail,
          fromName: settings.value.aws.ses.fromName
        }
      },
      netgsm: {
        enabled: settings.value.netgsm.enabled,
        msgheader: settings.value.netgsm.msgheader
      },
      gemini: {
        enabled: settings.value.gemini.enabled
      },
      firecrawl: {
        enabled: settings.value.firecrawl.enabled
      },
      paximum: {
        enabled: settings.value.paximum.enabled,
        endpoint: settings.value.paximum.endpoint,
        defaultMarkup: settings.value.paximum.defaultMarkup
      },
      webPush: {
        enabled: settings.value.webPush.enabled,
        publicKey: settings.value.webPush.publicKey,
        contactEmail: settings.value.webPush.contactEmail
      },
      billing: {
        companyName: settings.value.billing.companyName,
        taxNumber: settings.value.billing.taxNumber,
        taxOffice: settings.value.billing.taxOffice,
        email: settings.value.billing.email,
        phone: settings.value.billing.phone,
        address: settings.value.billing.address,
        invoicePrefix: settings.value.billing.invoicePrefix,
        defaultTaxRate: settings.value.billing.defaultTaxRate,
        invoiceNotes: settings.value.billing.invoiceNotes,
        bankAccounts: settings.value.billing.bankAccounts,
        bankTransferDescription: settings.value.billing.bankTransferDescription,
        bankTransferEnabled: settings.value.billing.bankTransferEnabled
      }
    }

    // Only include credentials if they were changed
    if (settings.value.aws.ses.accessKeyId) {
      update.aws.ses.accessKeyId = settings.value.aws.ses.accessKeyId
    }
    if (settings.value.aws.ses.secretAccessKey) {
      update.aws.ses.secretAccessKey = settings.value.aws.ses.secretAccessKey
    }
    if (settings.value.netgsm.usercode) {
      update.netgsm.usercode = settings.value.netgsm.usercode
    }
    if (settings.value.netgsm.password) {
      update.netgsm.password = settings.value.netgsm.password
    }
    if (settings.value.gemini.apiKey) {
      update.gemini.apiKey = settings.value.gemini.apiKey
    }
    if (settings.value.firecrawl.apiKey) {
      update.firecrawl.apiKey = settings.value.firecrawl.apiKey
    }
    if (settings.value.paximum.agency) {
      update.paximum.agency = settings.value.paximum.agency
    }
    if (settings.value.paximum.user) {
      update.paximum.user = settings.value.paximum.user
    }
    if (settings.value.paximum.password) {
      update.paximum.password = settings.value.paximum.password
    }
    if (settings.value.webPush.privateKey) {
      update.webPush.privateKey = settings.value.webPush.privateKey
    }

    await executeSave(() => platformSettingsService.updateSettings(update), {
      successMessage: 'platformSettings.savedToast',
      onSuccess: async () => {
        isDirty.value = false
        lastSaveTime.value = new Date()
        // Reload to get updated values
        await loadSettings()
      },
      onError: error => {
        toast.error(t('common.error') + ': ' + error.message)
      }
    })
  }

  // Send test email
  const sendTestEmail = async () => {
    await executeTestEmail(() => platformSettingsService.testEmail(testEmailAddress.value), {
      successMessage: 'platformSettings.email.testSent',
      onError: error => {
        toast.error(error.response?.data?.error || error.message)
      }
    })
  }

  // Send test SMS
  const sendTestSMS = async () => {
    await executeTestSMS(() => platformSettingsService.testSMS(testPhoneNumber.value), {
      successMessage: 'platformSettings.sms.testSent',
      onError: error => {
        toast.error(error.response?.data?.error || error.message)
      }
    })
  }

  // Test Paximum connection with values from input boxes
  const testPaximumConnection = async () => {
    // Validate required fields before sending
    const paximumSettings = settings.value.paximum
    if (!paximumSettings.endpoint) {
      toast.error(t('platformSettings.paximum.endpointRequired'))
      return
    }
    if (!paximumSettings.agency || !paximumSettings.user || !paximumSettings.password) {
      toast.error(t('platformSettings.paximum.credentialsRequired'))
      return
    }

    await executeTestPaximum(
      () =>
        platformSettingsService.testPaximum({
          endpoint: paximumSettings.endpoint,
          agency: paximumSettings.agency,
          user: paximumSettings.user,
          password: paximumSettings.password,
          defaultMarkup: paximumSettings.defaultMarkup
        }),
      {
        onSuccess: async result => {
          toast.success(result.message || t('platformSettings.paximum.testSuccess'))
          // Reload settings to reflect saved values
          await loadSettings()
        },
        onError: error => {
          toast.error(error.response?.data?.error || error.message)
        }
      }
    )
  }

  // Generate VAPID keys
  const generateVAPID = async () => {
    await executeGenerateVAPID(() => platformSettingsService.generateVAPIDKeys(), {
      successMessage: 'platformSettings.push.keysGenerated',
      onSuccess: keys => {
        settings.value.webPush.publicKey = keys.publicKey
        settings.value.webPush.privateKey = keys.privateKey
      },
      onError: error => {
        toast.error(error.response?.data?.error || error.message)
      }
    })
  }

  // Copy to clipboard
  const copyToClipboard = async text => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('common.copied'))
    } catch {
      toast.error(t('common.copyFailed'))
    }
  }

  // Add bank account
  const addBankAccount = () => {
    settings.value.billing.bankAccounts.push({
      bankCode: '',
      bankName: '',
      accountName: '',
      iban: '',
      swift: '',
      currency: 'TRY',
      isActive: true
    })
  }

  // Remove bank account
  const removeBankAccount = index => {
    settings.value.billing.bankAccounts.splice(index, 1)
  }

  return {
    // State
    settings,
    isDirty,
    lastSaveTime,
    testEmailAddress,
    testPhoneNumber,
    loading,
    saving,
    testingEmail,
    testingSMS,
    testingPaximum,
    generatingVAPID,

    // Actions
    loadSettings,
    saveSettings,
    sendTestEmail,
    sendTestSMS,
    testPaximumConnection,
    generateVAPID,
    copyToClipboard,
    addBankAccount,
    removeBankAccount
  }
}

export default usePlatformSettings
