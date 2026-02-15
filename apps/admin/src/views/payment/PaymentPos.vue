<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { usePaymentStore } from '@/stores/payment'
import { useAuthStore } from '@/stores/auth'
import { usePartnerStore } from '@/stores/partner'
import { getServerInfo } from '@/services/virtualPosService'
import partnerService from '@/services/partnerService'
import {
  getBankLogo,
  getCardLogo,
  getAssociationLogo,
  secureModels,
  paymentModels,
  currencies,
  defaultBanks,
  providerCredentials,
  ipAddressTips,
  bankCardFamilies,
  modalTabs
} from './posConfig'

const store = usePaymentStore()
const authStore = useAuthStore()
const partnerStore = usePartnerStore()

// Platform view mi Partner view mi? (Partner seçilmemişse platform view)
const isPlatformView = computed(() => authStore.isPlatformAdmin && !partnerStore.hasSelectedPartner)

// Partner view: Platformu kullan toggle (default: true)
const usePlatformPos = ref(true)

// Partner view: Aktif POS tab'ı
const activePosTab = ref(null)

// UI State
const showModal = ref(false)
const editingPos = ref(null)
const activeTab = ref('general')
const saving = ref(false)
const createType = ref('bank') // 'bank' or 'aggregator'

// Server info (IP, callback URL, etc.)
const serverIp = ref('...')

// POS listesi - scope-aware
const filteredPosList = computed(() => {
  return store.posList.filter(pos => {
    if (isPlatformView.value || usePlatformPos.value) {
      // Platform POS'ları göster
      const isPlatform = pos.partnerId === null || pos.isPlatformPos === true
      if (!isPlatform) return false
      // Partner view: sadece aktif POS'ları göster
      if (!isPlatformView.value) return pos.status === true
      return true
    } else {
      // Partner'ın kendi POS'ları
      return pos.partnerId !== null && !pos.isPlatformPos
    }
  })
})

// Partner view'da seçili POS
const selectedPlatformPos = computed(() => {
  if (!activePosTab.value) return null
  return filteredPosList.value.find(pos => pos._id === activePosTab.value)
})

// Partner view: Seçili POS'un aktif komisyon dönemi
const activeCommissionPeriod = computed(() => {
  if (!selectedPlatformPos.value?.commissionRates?.length) return null
  // En güncel tarihe sahip dönemi bul
  const sorted = [...selectedPlatformPos.value.commissionRates].sort(
    (a, b) => new Date(b.startDate) - new Date(a.startDate)
  )
  return sorted[0]
})

// Partner view: Komisyon oranlarını hesapla (1-12 taksit)
const commissionRatesForDisplay = computed(() => {
  const period = activeCommissionPeriod.value
  const rates = []
  for (let i = 1; i <= 12; i++) {
    const existingRate = period?.rates?.find(r => r.count === i)
    const bankRate = existingRate?.rate || 0
    const platformMargin = existingRate?.platformMargin || 0
    rates.push({
      count: i,
      bankRate,
      platformMargin,
      total: bankRate + platformMargin
    })
  }
  return rates
})

// Form
const form = ref(getEmptyForm())

function getEmptyForm() {
  return {
    bankCode: '',
    currencies: ['try'], // Multi-select: array of currencies
    testMode: false,
    status: true,
    priority: 0,
    paymentModel: '3d', // 3D model: 3d, 3d_pay, 3d_host
    allowDirectPayment: false, // 3D'siz odeme izni
    credentials: {
      merchantId: '',
      terminalId: '',
      username: '',
      password: '',
      secretKey: '',
      posnetId: ''
    },
    threeDSecure: {
      enabled: true,
      required: false
    },
    installment: {
      enabled: true,
      minCount: 2,
      maxCount: 12,
      minAmount: 100,
      rates: generateDefaultRates()
    },
    commissionRates: [],
    plusInstallment: 0
  }
}

// secureModels, paymentModels -> imported from posConfig

// Get supported 3D models for selected bank (excludes 'regular')
const supported3DModels = computed(() => {
  if (!form.value.bankCode) return []
  const bank = banks.value.find(b => b.code === form.value.bankCode)
  const supported = bank?.supportedPaymentModels || ['3d']
  // Only return 3D models, not 'regular'
  return supported
    .filter(code => code !== 'regular')
    .map(code => secureModels[code])
    .filter(Boolean)
})

// Check if bank supports direct (non-3D) payment
const supportsDirectPayment = computed(() => {
  if (!form.value.bankCode) return false
  const bank = banks.value.find(b => b.code === form.value.bankCode)
  const supported = bank?.supportedPaymentModels || ['3d']
  return supported.includes('regular')
})

// Keep for backward compatibility
const supportedPaymentModels = computed(() => {
  if (!form.value.bankCode) return []
  const bank = banks.value.find(b => b.code === form.value.bankCode)
  const supported = bank?.supportedPaymentModels || ['3d']
  return supported.map(code => paymentModels[code]).filter(Boolean)
})

// Generate default commission rates for a period
function generateDefaultCommissionRates() {
  const rates = []
  // Pesin (1 taksit) + 2-12 taksit
  for (let i = 1; i <= 12; i++) {
    rates.push({
      count: i,
      rate: 0
    })
  }
  return rates
}

// Add new commission period
function addCommissionPeriod() {
  const today = new Date().toISOString().split('T')[0]
  form.value.commissionRates.push({
    startDate: today,
    foreignCardRate: 0,
    foreignBankRate: 0,
    rates: generateDefaultCommissionRates()
  })
}

// Remove commission period
function removeCommissionPeriod(index) {
  form.value.commissionRates.splice(index, 1)
}

// Format date for display
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('tr-TR')
}

function generateDefaultRates() {
  const rates = []
  for (let i = 2; i <= 12; i++) {
    rates.push({
      count: i,
      enabled: true,
      bankRate: 0
    })
  }
  return rates
}

// tabs -> imported as modalTabs from posConfig
const tabs = modalTabs

// Selected bank info
const selectedBank = computed(() => {
  if (!form.value.bankCode) return null
  return banks.value.find(b => b.code === form.value.bankCode)
})

// Auto-generated POS name (for display with first selected currency)
const generatedPosName = computed(() => {
  if (!selectedBank.value) return ''
  const currencies = form.value.currencies || []
  const currencyLabel =
    currencies.length > 0 ? currencies.map(c => c.toUpperCase()).join(', ') : 'TRY'
  return `${selectedBank.value.name} ${currencyLabel} POS`
})

// Toggle currency selection
function toggleCurrency(currencyCode) {
  const idx = form.value.currencies.indexOf(currencyCode)
  if (idx >= 0) {
    // Don't allow removing last currency
    if (form.value.currencies.length > 1) {
      form.value.currencies.splice(idx, 1)
    }
  } else {
    form.value.currencies.push(currencyCode)
  }
}

// currencies -> imported from posConfig

// defaultBanks -> imported from posConfig

// Banks list - use store.banks if available, otherwise fallback
const banks = computed(() => {
  return store.banks?.length > 0 ? store.banks : defaultBanks
})

// Only bank POS (not aggregators)
const bankPosList = computed(() => {
  return banks.value.filter(b => !b.isAggregator)
})

// Only aggregators (iyzico, paytr, sigmapay)
const aggregatorList = computed(() => {
  return banks.value.filter(b => b.isAggregator)
})

// Check if a bank/aggregator code is an aggregator
function isAggregator(bankCode) {
  const bank = banks.value.find(b => b.code === bankCode)
  return bank?.isAggregator || false
}

// Filtered POS list - only bank POS (not aggregators)
const filteredBankPosList = computed(() => {
  return filteredPosList.value.filter(pos => !isAggregator(pos.bankCode))
})

// Filtered POS list - only aggregators
const filteredAggregatorList = computed(() => {
  return filteredPosList.value.filter(pos => isAggregator(pos.bankCode))
})

// Check for currencies without a default POS
const currenciesWithoutDefault = computed(() => {
  if (filteredPosList.value.length === 0) return []

  // Collect all unique currencies from all POS terminals
  const allCurrencies = new Set()
  filteredPosList.value.forEach(pos => {
    ;(pos.currencies || []).forEach(c => allCurrencies.add(c))
  })

  // Collect currencies that have a default POS
  const currenciesWithDefault = new Set()
  filteredPosList.value.forEach(pos => {
    ;(pos.defaultForCurrencies || []).forEach(c => currenciesWithDefault.add(c))
  })

  // Find currencies without default
  const missing = []
  allCurrencies.forEach(currency => {
    if (!currenciesWithDefault.has(currency)) {
      missing.push(currency.toUpperCase())
    }
  })

  return missing
})

// Available banks for new POS (exclude banks already added for platform)
const availableBanks = computed(() => {
  // Get bank codes already used by platform
  const usedBankCodes = filteredPosList.value.map(pos => pos.bankCode)

  // Filter out used banks (only from bank POS, not aggregators)
  return bankPosList.value.filter(bank => !usedBankCodes.includes(bank.code))
})

// Available aggregators for new integration
const availableAggregators = computed(() => {
  const usedCodes = filteredPosList.value.map(pos => pos.bankCode)
  return aggregatorList.value.filter(agg => !usedCodes.includes(agg.code))
})

// providerCredentials -> imported from posConfig

// Get provider for selected bank
const selectedProvider = computed(() => {
  if (!form.value.bankCode) return null
  const bank = banks.value.find(b => b.code === form.value.bankCode)
  return bank?.provider || form.value.bankCode
})

// Get credential fields config for selected provider
const credentialFields = computed(() => {
  const provider = selectedProvider.value
  return providerCredentials[provider] || providerCredentials.payten
})

// ipAddressTips -> imported from posConfig

// Get IP tip for selected bank
const selectedIpTip = computed(() => {
  if (!form.value.bankCode) return null
  return ipAddressTips[form.value.bankCode] || null
})

// bankCardFamilies -> imported from posConfig

// Get card family for selected bank
const selectedCardFamily = computed(() => {
  if (!form.value.bankCode) return null
  return bankCardFamilies[form.value.bankCode] || null
})

// Partner view: POS tercih toggle
const posSettingsLoading = ref(false)

async function togglePosPreference(newValue) {
  const oldValue = usePlatformPos.value
  usePlatformPos.value = newValue
  posSettingsLoading.value = true
  try {
    await partnerService.updatePosSettings({ useOwnPos: !newValue })
    // POS listesini yeniden yükle (scope değiştiği için)
    await store.fetchPosList()
    if (filteredPosList.value.length > 0) {
      activePosTab.value = filteredPosList.value[0]._id
    } else {
      activePosTab.value = null
    }
  } catch (e) {
    usePlatformPos.value = oldValue // revert
    console.error('POS settings update failed:', e)
  } finally {
    posSettingsLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([store.fetchPosList(), store.fetchBanks()])

  // Fetch server info for IP display
  try {
    const info = await getServerInfo()
    serverIp.value = info.serverIp || 'unknown'
  } catch (e) {
    console.warn('Could not fetch server info:', e.message)
  }

  // Partner view: preference'ı API'den yükle
  if (!isPlatformView.value) {
    try {
      const profile = await partnerService.getMyProfile()
      usePlatformPos.value = !profile.data?.paymentSettings?.useOwnPos
    } catch (e) {
      console.warn('Could not fetch POS settings:', e.message)
    }
  }

  // İlk POS'u seç
  if (!isPlatformView.value && filteredPosList.value.length > 0) {
    activePosTab.value = filteredPosList.value[0]._id
  }
})

function openCreate(type = 'bank') {
  editingPos.value = null
  createType.value = type
  form.value = getEmptyForm()
  activeTab.value = 'general'
  showModal.value = true
}

// Get list of options for bank/aggregator selection based on createType
const modalBankOptions = computed(() => {
  if (editingPos.value) {
    // When editing, show all banks
    return banks.value
  }
  // When creating, filter based on type
  return createType.value === 'aggregator' ? availableAggregators.value : availableBanks.value
})

function openEdit(pos) {
  editingPos.value = pos
  createType.value = isAggregator(pos.bankCode) ? 'aggregator' : 'bank'

  // Get plusInstallment from first campaign if exists
  const firstCampaign = pos.installment?.campaigns?.[0]
  form.value = {
    bankCode: pos.bankCode,
    currencies: pos.currencies || ['try'], // Use currencies array from POS
    testMode: pos.testMode || false,
    status: pos.status,
    priority: pos.priority || 0,
    paymentModel: pos.paymentModel === 'regular' ? '3d' : pos.paymentModel || '3d', // 3D model (never 'regular')
    allowDirectPayment: pos.allowDirectPayment || pos.paymentModel === 'regular' || false, // 3D'siz odeme izni
    credentials: {
      merchantId: pos.credentials?.merchantId || '',
      terminalId: pos.credentials?.terminalId || '',
      username: pos.credentials?.username || '',
      password: '',
      secretKey: '',
      posnetId: pos.credentials?.posnetId || ''
    },
    threeDSecure: {
      enabled: pos.threeDSecure?.enabled ?? true,
      required: pos.threeDSecure?.required ?? false
    },
    installment: {
      enabled: pos.installment?.enabled ?? true,
      minCount: pos.installment?.minCount || 2,
      maxCount: pos.installment?.maxCount || 12,
      minAmount: pos.installment?.minAmount || 100,
      rates: pos.installment?.rates?.length
        ? pos.installment.rates.map(r => ({
            count: r.count,
            enabled: r.enabled,
            bankRate: r.bankRate || 0
          }))
        : generateDefaultRates()
    },
    commissionRates: pos.commissionRates?.length
      ? pos.commissionRates.map(period => ({
          startDate: period.startDate ? new Date(period.startDate).toISOString().split('T')[0] : '',
          foreignCardRate: period.foreignCardRate || 0,
          foreignBankRate: period.foreignBankRate || 0,
          rates:
            period.rates?.map(r => ({
              count: r.count,
              rate: r.rate || 0
            })) || generateDefaultCommissionRates()
        }))
      : [],
    plusInstallment: firstCampaign?.plusInstallment || 0
  }
  activeTab.value = 'general'
  showModal.value = true
}

async function handleSubmit() {
  if (!form.value.bankCode) {
    alert('Lütfen bir banka seçin')
    return
  }
  if (!form.value.currencies || form.value.currencies.length === 0) {
    alert('Lütfen en az bir para birimi seçin')
    return
  }

  saving.value = true
  try {
    // Build campaigns array from plusInstallment
    const campaigns = []
    if (form.value.plusInstallment > 0 && selectedCardFamily.value) {
      campaigns.push({
        name: `${selectedCardFamily.value.name} +${form.value.plusInstallment}`,
        cardFamily: selectedCardFamily.value.code,
        plusInstallment: form.value.plusInstallment,
        enabled: true
      })
    }

    // Remove empty credential fields
    const credentials = { ...form.value.credentials }
    Object.keys(credentials).forEach(key => {
      if (!credentials[key]) {
        delete credentials[key]
      }
    })

    const data = {
      ...form.value,
      name: generatedPosName.value,
      credentials,
      installment: {
        ...form.value.installment,
        campaigns
      }
    }
    delete data.plusInstallment

    // Set partnerId and sharedWithPartners based on view
    if (isPlatformView.value) {
      data.partnerId = null
      data.sharedWithPartners = true
    } else {
      // Partner view: partnerId ekleme, interceptor inject edecek
      data.sharedWithPartners = false
    }

    console.log('Saving POS data:', data)

    if (editingPos.value) {
      await store.updatePos(editingPos.value._id, data)
    } else {
      await store.createPos(data)
    }
    showModal.value = false
  } catch (e) {
    console.error('Save failed:', e)
    alert('Kaydetme hatası: ' + (e.response?.data?.error || e.message))
  } finally {
    saving.value = false
  }
}

async function handleDelete(pos) {
  if (!confirm('Bu POS terminalini silmek istediginize emin misiniz?')) return
  try {
    await store.deletePos(pos._id)
  } catch (e) {
    console.error('Delete failed:', e)
  }
}

function getBankStyle(bankCode) {
  const bank = banks.value.find(b => b.code === bankCode)
  return bank ? { borderLeftColor: bank.color } : {}
}

function getStatusBadge(pos) {
  if (!pos.status)
    return {
      class: 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400',
      text: 'Pasif'
    }
  if (pos.testMode)
    return {
      class: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400',
      text: 'Test'
    }
  return {
    class: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400',
    text: 'Aktif'
  }
}

// Check if POS is default for a specific currency
function isDefaultForCurrency(pos, currency) {
  return (pos.defaultForCurrencies || []).includes(currency.toLowerCase())
}

// Toggle default status for a currency
async function toggleDefault(pos, currency) {
  try {
    if (isDefaultForCurrency(pos, currency)) {
      await store.unsetDefaultPos(pos._id, currency)
    } else {
      await store.setDefaultPos(pos._id, currency)
    }
  } catch (e) {
    console.error('Toggle default failed:', e)
    alert('Varsayilan ayarlanamadi: ' + (e.response?.data?.error || e.message))
  }
}
</script>

<template>
  <div>
    <!-- ============================================ -->
    <!-- PARTNER VIEW - Platformu Kullan -->
    <!-- ============================================ -->
    <div v-if="!isPlatformView">
      <!-- Header with Toggle -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-white">POS Ayarları</h2>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Ödeme işlemlerinde kullanılacak POS terminallerini yönetin
          </p>
        </div>
      </div>

      <!-- Platform POS Toggle -->
      <div
        class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 mb-6"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg"
            >
              <span class="material-icons text-white text-xl">share</span>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                Platform POS'larını Kullan
              </h3>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                Platformun sunduğu ortak POS terminallerini kullanarak ödeme alın
              </p>
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              :checked="usePlatformPos"
              type="checkbox"
              class="sr-only peer"
              :disabled="posSettingsLoading"
              @change="togglePosPreference($event.target.checked)"
            />
            <div
              class="w-14 h-7 bg-gray-200 dark:bg-slate-600 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-500 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"
              :class="{ 'opacity-50': posSettingsLoading }"
            ></div>
          </label>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="flex justify-center py-12">
        <span class="material-icons animate-spin text-4xl text-gray-400 dark:text-slate-500"
          >refresh</span
        >
      </div>

      <!-- Platform POS'ları Tab olarak göster -->
      <div
        v-else-if="usePlatformPos"
        class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden"
      >
        <!-- POS Tabs -->
        <div class="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
          <nav class="flex overflow-x-auto px-4 gap-1 -mb-px">
            <button
              v-for="pos in filteredPosList"
              :key="pos._id"
              @click="activePosTab = pos._id"
              :class="[
                'flex items-center gap-3 px-4 py-3 border-b-2 transition-all whitespace-nowrap',
                activePosTab === pos._id
                  ? 'border-primary-500 bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              ]"
            >
              <img
                :src="getBankLogo(pos.bankCode)"
                :alt="pos.name"
                class="w-6 h-6 object-contain"
              />
              <span class="font-medium text-sm">{{ pos.name }}</span>
            </button>
          </nav>
        </div>

        <!-- Seçili POS Detayları -->
        <div v-if="selectedPlatformPos" class="p-6">
          <!-- POS Info Card -->
          <div class="flex items-start gap-6 mb-6">
            <div
              class="w-20 h-20 bg-white dark:bg-slate-700 rounded-2xl shadow-md flex items-center justify-center p-3 border border-gray-100 dark:border-slate-600"
            >
              <img
                :src="getBankLogo(selectedPlatformPos.bankCode)"
                :alt="selectedPlatformPos.name"
                class="w-full h-full object-contain"
              />
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-800 dark:text-white">
                {{ selectedPlatformPos.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Platform tarafından sağlanan POS terminali
              </p>
              <div class="flex items-center gap-3 mt-3">
                <span
                  :class="[
                    'px-3 py-1 text-xs rounded-full font-medium',
                    selectedPlatformPos.status
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                  ]"
                >
                  {{ selectedPlatformPos.status ? 'Aktif' : 'Pasif' }}
                </span>
                <span
                  v-if="selectedPlatformPos.testMode"
                  class="px-3 py-1 text-xs rounded-full font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400"
                >
                  Test Modu
                </span>
              </div>
            </div>
          </div>

          <!-- Desteklenen Para Birimleri -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 dark:bg-slate-900 rounded-xl p-4">
              <h4 class="text-sm font-medium text-gray-600 dark:text-slate-400 mb-3">
                Desteklenen Para Birimleri
              </h4>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="curr in selectedPlatformPos.currencies || []"
                  :key="curr"
                  class="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-slate-300"
                >
                  {{ curr.toUpperCase() }}
                </span>
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-900 rounded-xl p-4">
              <h4 class="text-sm font-medium text-gray-600 dark:text-slate-400 mb-3">
                Taksit Seçenekleri
              </h4>
              <p
                v-if="selectedPlatformPos.installment?.enabled"
                class="text-sm text-gray-700 dark:text-slate-300"
              >
                {{ selectedPlatformPos.installment.minCount }} -
                {{ selectedPlatformPos.installment.maxCount }} taksit
              </p>
              <p v-else class="text-sm text-gray-500 dark:text-slate-400">Taksit kapalı</p>
            </div>
          </div>

          <!-- 3D Secure Bilgisi -->
          <div
            class="mt-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-800 flex items-center gap-3"
          >
            <span class="material-icons text-green-600 dark:text-green-400">verified_user</span>
            <div>
              <p class="text-sm font-medium text-green-800 dark:text-green-300">3D Secure Aktif</p>
              <p class="text-xs text-green-700 dark:text-green-400">
                Tüm ödemeler 3D Secure ile güvenli şekilde alınır
              </p>
            </div>
          </div>

          <!-- Komisyon Oranları Tablosu -->
          <div class="mt-6">
            <h4
              class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2"
            >
              <span class="material-icons text-lg text-primary-600 dark:text-primary-400"
                >percent</span
              >
              Komisyon Oranları
            </h4>
            <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-slate-900">
                  <tr>
                    <th
                      class="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-slate-400"
                    >
                      Taksit
                    </th>
                    <th
                      class="px-4 py-2.5 text-right font-semibold text-gray-600 dark:text-slate-400"
                    >
                      Komisyon Oranı
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
                  <!-- Yurtdışı Kartlar -->
                  <tr class="bg-blue-50/50 dark:bg-blue-900/20">
                    <td class="px-4 py-2.5 font-medium text-gray-700 dark:text-slate-300">
                      <span class="flex items-center gap-2">
                        <span class="material-icons text-blue-600 dark:text-blue-400 text-base"
                          >language</span
                        >
                        Yurtdışı Kart
                      </span>
                    </td>
                    <td
                      class="px-4 py-2.5 text-right font-semibold text-gray-800 dark:text-white font-mono"
                    >
                      %{{
                        (
                          (activeCommissionPeriod?.foreignCardRate || 0) +
                          (activeCommissionPeriod?.foreignCardMargin || 0)
                        ).toFixed(2)
                      }}
                    </td>
                  </tr>
                  <!-- Taksit Oranları -->
                  <tr
                    v-for="rate in commissionRatesForDisplay"
                    :key="rate.count"
                    :class="rate.count === 1 ? 'bg-green-50/50 dark:bg-green-900/20' : ''"
                  >
                    <td class="px-4 py-2.5 font-medium text-gray-700 dark:text-slate-300">
                      {{ rate.count === 1 ? 'Peşin' : rate.count + ' Taksit' }}
                    </td>
                    <td
                      class="px-4 py-2.5 text-right font-semibold text-gray-800 dark:text-white font-mono"
                    >
                      %{{ rate.total.toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- No POS Selected -->
        <div v-else class="p-12 text-center">
          <span class="material-icons text-5xl text-gray-300 dark:text-slate-600">credit_card</span>
          <p class="text-gray-500 dark:text-slate-400 mt-4">Detayları görmek için bir POS seçin</p>
        </div>
      </div>

      <!-- Kendi POS'unu Kullan (usePlatformPos = false) -->
      <div v-else class="space-y-6">
        <!-- Uyarı Banner -->
        <div
          class="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3"
        >
          <span class="material-icons text-amber-500 dark:text-amber-400 text-xl mt-0.5"
            >warning</span
          >
          <div>
            <p class="text-sm font-medium text-amber-800 dark:text-amber-300">
              Kendi POS'unuzu kullandığınızda platform POS'ları yedek olarak kullanılmaz
            </p>
            <p class="text-xs text-amber-600 dark:text-amber-500 mt-1">
              Ödeme alabilmek için en az bir aktif POS tanımlanmış olmalıdır.
            </p>
          </div>
        </div>

        <!-- Banka POS Terminalleri -->
        <div>
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg"
              >
                <span class="material-icons text-white">account_balance</span>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">
                  Banka POS Terminalleri
                </h3>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ filteredBankPosList.length }} terminal
                </p>
              </div>
            </div>
            <button
              @click="openCreate('bank')"
              class="px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 flex items-center gap-2 shadow-lg shadow-primary-500/30 transition-all hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5"
            >
              <span class="material-icons">add</span>
              Banka POS Ekle
            </button>
          </div>

          <!-- POS Kartları Grid -->
          <div v-if="filteredBankPosList.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              v-for="pos in filteredBankPosList"
              :key="pos._id"
              class="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 hover:-translate-y-1"
            >
              <!-- Colored Header with Bank Info -->
              <div
                class="relative p-5 pb-4"
                :style="{
                  background: `linear-gradient(135deg, ${banks.find(b => b.code === pos.bankCode)?.color || '#6366f1'}15, ${banks.find(b => b.code === pos.bankCode)?.color || '#6366f1'}05)`
                }"
              >
                <!-- Status Badge -->
                <div class="absolute top-4 right-4">
                  <span
                    :class="[
                      'px-3 py-1.5 text-xs rounded-full font-semibold shadow-sm',
                      getStatusBadge(pos).class
                    ]"
                  >
                    {{ getStatusBadge(pos).text }}
                  </span>
                </div>

                <!-- Bank Logo & Name -->
                <div class="flex items-center gap-4">
                  <div class="relative">
                    <div
                      class="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl shadow-md flex items-center justify-center p-2 group-hover:shadow-lg transition-shadow"
                    >
                      <img
                        :src="getBankLogo(pos.bankCode)"
                        :alt="pos.name"
                        class="w-full h-full object-contain"
                      />
                    </div>
                    <div
                      v-if="pos.status"
                      class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center"
                    >
                      <span class="material-icons text-white text-xs">check</span>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-gray-800 dark:text-white text-lg truncate">
                      {{ pos.name }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-slate-400">
                      {{ banks.find(b => b.code === pos.bankCode)?.name || pos.bankCode }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Card Family & Features -->
              <div class="px-5 py-4 border-t border-gray-100 dark:border-slate-700">
                <div class="flex items-center gap-3 mb-4">
                  <span
                    class="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide"
                    >Desteklenen Kartlar</span
                  >
                  <div class="flex-1 h-px bg-gray-100 dark:bg-slate-700"></div>
                </div>

                <div class="flex items-center gap-3 flex-wrap">
                  <div
                    v-if="bankCardFamilies[pos.bankCode]"
                    class="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 rounded-xl border border-gray-200 dark:border-slate-600"
                  >
                    <img
                      :src="getCardLogo(bankCardFamilies[pos.bankCode].code)"
                      :alt="bankCardFamilies[pos.bankCode].name"
                      class="h-6 object-contain"
                      @error="$event.target.style.display = 'none'"
                    />
                    <span class="text-sm font-semibold text-gray-700 dark:text-slate-300">{{
                      bankCardFamilies[pos.bankCode].name
                    }}</span>
                  </div>

                  <!-- Card Brand Icons -->
                  <div class="flex items-center gap-1 ml-auto">
                    <div
                      v-if="pos.supportedCards?.visa !== false"
                      class="w-8 h-5 bg-blue-600 rounded flex items-center justify-center"
                      title="Visa"
                    >
                      <span class="text-white text-[8px] font-bold">VISA</span>
                    </div>
                    <div
                      v-if="pos.supportedCards?.mastercard !== false"
                      class="w-8 h-5 bg-gradient-to-r from-red-500 to-orange-500 rounded flex items-center justify-center"
                      title="Mastercard"
                    >
                      <span class="text-white text-[8px] font-bold">MC</span>
                    </div>
                    <div
                      v-if="pos.supportedCards?.troy !== false"
                      class="w-8 h-5 bg-purple-600 rounded flex items-center justify-center"
                      title="Troy"
                    >
                      <span class="text-white text-[8px] font-bold">TROY</span>
                    </div>
                  </div>
                </div>

                <!-- Features Row -->
                <div
                  class="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700"
                >
                  <div v-if="pos.installment?.enabled" class="flex items-center gap-2 text-sm">
                    <span class="material-icons text-primary-500 dark:text-primary-400 text-lg"
                      >calendar_month</span
                    >
                    <span class="text-gray-600 dark:text-slate-400"
                      >{{ pos.installment.maxCount }} Taksit</span
                    >
                  </div>

                  <div
                    class="flex items-center gap-2 text-sm px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/50"
                  >
                    <span class="material-icons text-base text-green-600 dark:text-green-400"
                      >verified_user</span
                    >
                    <span class="font-medium text-green-700 dark:text-green-400">
                      {{ secureModels[pos.paymentModel]?.name || '3D Secure' }}
                    </span>
                  </div>

                  <div
                    v-if="pos.allowDirectPayment"
                    class="flex items-center gap-1 text-sm px-2 py-1 rounded-lg bg-orange-100 dark:bg-orange-900/50"
                  >
                    <span class="material-icons text-base text-orange-600 dark:text-orange-400"
                      >lock_open</span
                    >
                    <span class="font-medium text-orange-700 dark:text-orange-400">3D'siz</span>
                  </div>
                </div>
              </div>

              <!-- Currency & Actions Footer -->
              <div
                class="px-5 py-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between"
              >
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400 dark:text-slate-500">Para Birimleri:</span>
                  <div class="flex gap-1">
                    <span
                      v-for="curr in pos.currencies || []"
                      :key="curr"
                      class="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600"
                    >
                      {{ curr.toUpperCase() }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-1">
                  <button
                    @click="openEdit(pos)"
                    class="p-2 text-gray-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/50 rounded-lg transition-all"
                  >
                    <span class="material-icons text-xl">edit</span>
                  </button>
                  <button
                    @click="handleDelete(pos)"
                    class="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-all"
                  >
                    <span class="material-icons text-xl">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Boş State -->
          <div
            v-else
            class="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700"
          >
            <div
              class="w-20 h-20 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <span class="material-icons text-4xl text-gray-400 dark:text-slate-500"
                >account_balance</span
              >
            </div>
            <h4 class="text-lg font-semibold text-gray-600 dark:text-slate-400 mb-2">
              Henüz POS Tanımlanmadı
            </h4>
            <p class="text-gray-500 dark:text-slate-500 mb-4">
              Ödeme almaya başlamak için bir banka POS terminali ekleyin
            </p>
            <button
              @click="openCreate('bank')"
              class="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 flex items-center gap-2 mx-auto shadow-lg shadow-primary-500/30 transition-all"
            >
              <span class="material-icons">add</span>
              İlk POS'unuzu Ekleyin
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- PLATFORM VIEW - POS Yönetimi -->
    <!-- ============================================ -->
    <div v-else>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-white">
            Platform POS Yönetimi
          </h2>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Banka POS terminalleri ve ödeme entegrasyonlarınızı yönetin
          </p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="flex justify-center py-12">
        <span class="material-icons animate-spin text-4xl text-gray-400 dark:text-slate-500"
          >refresh</span
        >
      </div>

      <!-- Content -->
      <div v-else class="space-y-8">
        <!-- Warning: Currencies without default POS -->
        <div
          v-if="currenciesWithoutDefault.length > 0"
          class="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-start gap-3"
        >
          <span class="material-icons text-orange-500 dark:text-orange-400 text-xl mt-0.5"
            >warning</span
          >
          <div class="flex-1">
            <p class="text-sm font-medium text-orange-800 dark:text-orange-300">
              Varsayilan POS Secilmemis
            </p>
            <p class="text-sm text-orange-700 dark:text-orange-400 mt-1">
              <strong>{{ currenciesWithoutDefault.join(', ') }}</strong> para birimi icin varsayilan
              POS belirlenmemis. Odeme islemlerinin dogru calismasi icin her para birimine bir
              varsayilan POS atanmalidir.
            </p>
            <p class="text-xs text-orange-600 dark:text-orange-500 mt-2 flex items-center gap-1">
              <span class="material-icons text-sm">info</span>
              POS kartindaki para birimi etiketine tiklayarak varsayilan yapabilirsiniz.
            </p>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- BANKA POS TERMİNALLERİ -->
        <!-- ============================================ -->
        <div>
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg"
              >
                <span class="material-icons text-white">account_balance</span>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">
                  Banka POS Terminalleri
                </h3>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ filteredBankPosList.length }} aktif terminal
                </p>
              </div>
            </div>
            <button
              @click="openCreate('bank')"
              :disabled="availableBanks.length === 0"
              class="px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary-500/30 transition-all hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5"
            >
              <span class="material-icons">add</span>
              Banka POS Ekle
            </button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              v-for="pos in filteredBankPosList"
              :key="pos._id"
              class="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 hover:-translate-y-1"
            >
              <!-- Colored Header with Bank Info -->
              <div
                class="relative p-5 pb-4"
                :style="{
                  background: `linear-gradient(135deg, ${banks.find(b => b.code === pos.bankCode)?.color || '#6366f1'}15, ${banks.find(b => b.code === pos.bankCode)?.color || '#6366f1'}05)`
                }"
              >
                <!-- Status Badge - Absolute positioned -->
                <div class="absolute top-4 right-4">
                  <span
                    :class="[
                      'px-3 py-1.5 text-xs rounded-full font-semibold shadow-sm',
                      getStatusBadge(pos).class
                    ]"
                  >
                    {{ getStatusBadge(pos).text }}
                  </span>
                </div>

                <!-- Bank Logo & Name -->
                <div class="flex items-center gap-4">
                  <div class="relative">
                    <div
                      class="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl shadow-md flex items-center justify-center p-2 group-hover:shadow-lg transition-shadow"
                    >
                      <img
                        :src="getBankLogo(pos.bankCode)"
                        :alt="pos.name"
                        class="w-full h-full object-contain"
                      />
                    </div>
                    <!-- Online indicator -->
                    <div
                      v-if="pos.status"
                      class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center"
                    >
                      <span class="material-icons text-white text-xs">check</span>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-gray-800 dark:text-white text-lg truncate">
                      {{ pos.name }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-slate-400">
                      {{ banks.find(b => b.code === pos.bankCode)?.name || pos.bankCode }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Card Family & Features -->
              <div class="px-5 py-4 border-t border-gray-100 dark:border-slate-700">
                <!-- Supported Card Families -->
                <div class="flex items-center gap-3 mb-4">
                  <span
                    class="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide"
                    >Desteklenen Kartlar</span
                  >
                  <div class="flex-1 h-px bg-gray-100 dark:bg-slate-700"></div>
                </div>

                <div class="flex items-center gap-3 flex-wrap">
                  <!-- Primary Card Family (from bankCardFamilies) -->
                  <div
                    v-if="bankCardFamilies[pos.bankCode]"
                    class="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 rounded-xl border border-gray-200 dark:border-slate-600"
                  >
                    <img
                      :src="getCardLogo(bankCardFamilies[pos.bankCode].code)"
                      :alt="bankCardFamilies[pos.bankCode].name"
                      class="h-6 object-contain"
                      @error="$event.target.style.display = 'none'"
                    />
                    <span class="text-sm font-semibold text-gray-700 dark:text-slate-300">{{
                      bankCardFamilies[pos.bankCode].name
                    }}</span>
                  </div>

                  <!-- Additional Supported Families from DB -->
                  <template v-if="pos.supportedCardFamilies?.length">
                    <div
                      v-for="family in pos.supportedCardFamilies.filter(
                        f => f !== bankCardFamilies[pos.bankCode]?.code
                      )"
                      :key="family"
                      class="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/50 rounded-xl border border-purple-200 dark:border-purple-700"
                    >
                      <img
                        :src="getCardLogo(family)"
                        :alt="family"
                        class="h-5 object-contain"
                        @error="$event.target.style.display = 'none'"
                      />
                      <span
                        class="text-sm font-medium text-purple-700 dark:text-purple-400 capitalize"
                        >{{ family }}</span
                      >
                    </div>
                  </template>

                  <!-- Card Brand Icons -->
                  <div class="flex items-center gap-1 ml-auto">
                    <div
                      v-if="pos.supportedCards?.visa !== false"
                      class="w-8 h-5 bg-blue-600 rounded flex items-center justify-center"
                      title="Visa"
                    >
                      <span class="text-white text-[8px] font-bold">VISA</span>
                    </div>
                    <div
                      v-if="pos.supportedCards?.mastercard !== false"
                      class="w-8 h-5 bg-gradient-to-r from-red-500 to-orange-500 rounded flex items-center justify-center"
                      title="Mastercard"
                    >
                      <span class="text-white text-[8px] font-bold">MC</span>
                    </div>
                    <div
                      v-if="pos.supportedCards?.troy !== false"
                      class="w-8 h-5 bg-purple-600 rounded flex items-center justify-center"
                      title="Troy"
                    >
                      <span class="text-white text-[8px] font-bold">TROY</span>
                    </div>
                  </div>
                </div>

                <!-- Features Row -->
                <div
                  class="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700"
                >
                  <!-- Installment Info -->
                  <div v-if="pos.installment?.enabled" class="flex items-center gap-2 text-sm">
                    <span class="material-icons text-primary-500 dark:text-primary-400 text-lg"
                      >calendar_month</span
                    >
                    <span class="text-gray-600 dark:text-slate-400"
                      >{{ pos.installment.maxCount }} Taksit</span
                    >
                  </div>

                  <!-- 3D Model Badge -->
                  <div
                    class="flex items-center gap-2 text-sm px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/50"
                  >
                    <span class="material-icons text-base text-green-600 dark:text-green-400"
                      >verified_user</span
                    >
                    <span class="font-medium text-green-700 dark:text-green-400">
                      {{ secureModels[pos.paymentModel]?.name || '3D Secure' }}
                    </span>
                  </div>

                  <!-- Direct Payment Badge (if allowed) -->
                  <div
                    v-if="pos.allowDirectPayment"
                    class="flex items-center gap-1 text-sm px-2 py-1 rounded-lg bg-orange-100 dark:bg-orange-900/50"
                  >
                    <span class="material-icons text-base text-orange-600 dark:text-orange-400"
                      >lock_open</span
                    >
                    <span class="font-medium text-orange-700 dark:text-orange-400">3D'siz</span>
                  </div>

                  <!-- Priority -->
                  <div v-if="pos.priority > 0" class="flex items-center gap-1 text-sm ml-auto">
                    <span class="material-icons text-yellow-500 text-sm">star</span>
                    <span class="text-gray-500 dark:text-slate-400"
                      >Öncelik: {{ pos.priority }}</span
                    >
                  </div>
                </div>
              </div>

              <!-- Currency & Actions Footer -->
              <div
                class="px-5 py-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between"
              >
                <!-- Default Currencies -->
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400 dark:text-slate-500">Varsayılan:</span>
                  <div class="flex gap-1">
                    <button
                      v-for="curr in pos.currencies || []"
                      :key="curr"
                      @click.stop="toggleDefault(pos, curr)"
                      :title="
                        isDefaultForCurrency(pos, curr)
                          ? 'Varsayılan - kaldırmak için tıkla'
                          : 'Varsayılan yap'
                      "
                      :class="[
                        'px-2.5 py-1 text-xs font-bold rounded-lg transition-all',
                        isDefaultForCurrency(pos, curr)
                          ? 'bg-green-500 text-white shadow-sm shadow-green-500/30'
                          : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400'
                      ]"
                    >
                      {{ curr.toUpperCase() }}
                    </button>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1">
                  <button
                    @click="openEdit(pos)"
                    class="p-2 text-gray-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/50 rounded-lg transition-all"
                  >
                    <span class="material-icons text-xl">edit</span>
                  </button>
                  <button
                    @click="handleDelete(pos)"
                    class="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-all"
                  >
                    <span class="material-icons text-xl">delete</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State for Bank POS -->
            <div
              v-if="filteredBankPosList.length === 0"
              class="col-span-full text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700"
            >
              <div
                class="w-20 h-20 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span class="material-icons text-4xl text-gray-400 dark:text-slate-500"
                  >account_balance</span
                >
              </div>
              <h4 class="text-lg font-semibold text-gray-600 dark:text-slate-400 mb-2">
                Henüz POS Eklenmemiş
              </h4>
              <p class="text-gray-500 dark:text-slate-500 mb-4">
                İlk banka POS terminalinizi ekleyin
              </p>
              <button
                @click="openCreate('bank')"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                POS Ekle
              </button>
            </div>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- ENTEGRASYONLAR (Aggregators) -->
        <!-- ============================================ -->
        <div>
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg"
              >
                <span class="material-icons text-white">hub</span>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">
                  Ödeme Entegratörleri
                </h3>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ filteredAggregatorList.length }} aktif entegrasyon
                </p>
              </div>
            </div>
            <button
              @click="openCreate('aggregator')"
              :disabled="availableAggregators.length === 0"
              class="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5"
            >
              <span class="material-icons">add</span>
              Entegrasyon Ekle
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="pos in filteredAggregatorList"
              :key="pos._id"
              class="group bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/30 dark:to-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-purple-100 dark:border-purple-800 hover:border-purple-200 dark:hover:border-purple-700 hover:-translate-y-1"
            >
              <!-- Header -->
              <div class="relative p-5">
                <!-- Status Badge -->
                <div class="absolute top-4 right-4">
                  <span
                    :class="[
                      'px-3 py-1.5 text-xs rounded-full font-semibold shadow-sm',
                      getStatusBadge(pos).class
                    ]"
                  >
                    {{ getStatusBadge(pos).text }}
                  </span>
                </div>

                <!-- Logo & Name -->
                <div class="flex items-center gap-4">
                  <div
                    class="w-14 h-14 bg-white dark:bg-slate-700 rounded-2xl shadow-md flex items-center justify-center p-2 group-hover:shadow-lg transition-shadow"
                  >
                    <img
                      :src="getBankLogo(pos.bankCode)"
                      :alt="pos.name"
                      class="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 class="font-bold text-gray-800 dark:text-white text-lg">{{ pos.name }}</h3>
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 text-xs rounded-full font-medium"
                    >
                      <span class="material-icons text-xs">hub</span>
                      Entegratör
                    </span>
                  </div>
                </div>

                <!-- All Cards Support -->
                <div
                  class="mt-4 p-3 bg-white dark:bg-slate-700 rounded-xl border border-purple-100 dark:border-purple-800"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500 dark:text-slate-400"
                      >Desteklenen Kartlar</span
                    >
                    <div class="flex items-center gap-1">
                      <div class="w-7 h-4 bg-blue-600 rounded flex items-center justify-center">
                        <span class="text-white text-[7px] font-bold">VISA</span>
                      </div>
                      <div
                        class="w-7 h-4 bg-gradient-to-r from-red-500 to-orange-500 rounded flex items-center justify-center"
                      >
                        <span class="text-white text-[7px] font-bold">MC</span>
                      </div>
                      <div class="w-7 h-4 bg-purple-600 rounded flex items-center justify-center">
                        <span class="text-white text-[7px] font-bold">TROY</span>
                      </div>
                      <div class="w-7 h-4 bg-green-600 rounded flex items-center justify-center">
                        <span class="text-white text-[7px] font-bold">AMEX</span>
                      </div>
                    </div>
                  </div>
                  <p class="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    Tüm banka kartlarını destekler
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div
                class="px-5 py-3 bg-purple-50/50 dark:bg-purple-900/30 border-t border-purple-100 dark:border-purple-800 flex items-center justify-between"
              >
                <!-- Currencies -->
                <div class="flex items-center gap-1">
                  <span
                    v-for="curr in pos.currencies || []"
                    :key="curr"
                    class="px-2 py-1 text-xs font-bold rounded-lg bg-purple-600 text-white"
                  >
                    {{ curr.toUpperCase() }}
                  </span>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1">
                  <button
                    @click="openEdit(pos)"
                    class="p-2 text-gray-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-all"
                  >
                    <span class="material-icons text-xl">edit</span>
                  </button>
                  <button
                    @click="handleDelete(pos)"
                    class="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-all"
                  >
                    <span class="material-icons text-xl">delete</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State for Aggregators -->
            <div
              v-if="filteredAggregatorList.length === 0"
              class="col-span-full text-center py-16 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-slate-800 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-700"
            >
              <div
                class="w-20 h-20 bg-purple-200 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span class="material-icons text-4xl text-purple-400 dark:text-purple-500"
                  >hub</span
                >
              </div>
              <h4 class="text-lg font-semibold text-purple-700 dark:text-purple-400 mb-2">
                Entegrasyon Yok
              </h4>
              <p class="text-purple-600 dark:text-purple-500 mb-4">
                PayTR, iyzico veya SigmaPay ekleyin
              </p>
              <button
                @click="openCreate('aggregator')"
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Entegrasyon Ekle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- POS MODAL (her iki view'dan erişilebilir) -->
    <!-- ============================================ -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col"
      >
        <!-- Modal Header -->
        <div
          :class="[
            'px-6 py-4 border-b dark:border-slate-700 flex items-center justify-between',
            createType === 'aggregator'
              ? 'bg-purple-50 dark:bg-purple-900/30'
              : 'bg-gray-50 dark:bg-slate-900'
          ]"
        >
          <div class="flex items-center gap-3">
            <img
              v-if="selectedBank"
              :src="getBankLogo(selectedBank.code)"
              :alt="selectedBank.name"
              class="w-10 h-10 rounded-lg"
              @error="$event.target.style.display = 'none'"
            />
            <div
              v-else
              :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center',
                createType === 'aggregator'
                  ? 'bg-purple-200 dark:bg-purple-900/50'
                  : 'bg-gray-200 dark:bg-slate-700'
              ]"
            >
              <span
                :class="[
                  'material-icons',
                  createType === 'aggregator'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 dark:text-slate-400'
                ]"
              >
                {{ createType === 'aggregator' ? 'hub' : 'account_balance' }}
              </span>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                {{
                  editingPos
                    ? isAggregator(editingPos.bankCode)
                      ? 'Entegrasyon Duzenle'
                      : 'POS Duzenle'
                    : createType === 'aggregator'
                      ? 'Yeni Entegrasyon Ekle'
                      : 'Yeni Banka POS Ekle'
                }}
              </h3>
              <p v-if="selectedBank" class="text-sm text-gray-500 dark:text-slate-400">
                {{ generatedPosName }}
              </p>
            </div>
          </div>
          <button
            @click="showModal = false"
            class="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span class="material-icons text-gray-500 dark:text-slate-400">close</span>
          </button>
        </div>

        <!-- Tabs -->
        <div class="px-6 border-b dark:border-slate-700 bg-white dark:bg-slate-800">
          <nav class="flex gap-1 -mb-px overflow-x-auto">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
              ]"
            >
              <span class="material-icons text-lg">{{ tab.icon }}</span>
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <form @submit.prevent="handleSubmit">
            <!-- General Tab -->
            <div v-show="activeTab === 'general'" class="space-y-6">
              <!-- Bank/Aggregator Selection - Only show when creating new POS -->
              <div v-if="!editingPos">
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {{ createType === 'aggregator' ? 'Entegrasyon Secin' : 'Banka Secin' }} *
                </label>
                <div class="flex items-center gap-4">
                  <select
                    v-model="form.bankCode"
                    class="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                  >
                    <option value="">
                      -- {{ createType === 'aggregator' ? 'Entegrasyon' : 'Banka' }} Secin --
                    </option>
                    <option v-for="bank in modalBankOptions" :key="bank.code" :value="bank.code">
                      {{ bank.name }}{{ !bank.providerSupported ? ' (Yakin Zamanda)' : '' }}
                    </option>
                  </select>
                  <!-- Selected Bank Logo -->
                  <img
                    v-if="selectedBank"
                    :src="getBankLogo(selectedBank.code)"
                    :alt="selectedBank.name"
                    class="w-14 h-14 rounded-xl shrink-0 object-contain"
                    @error="$event.target.style.display = 'none'"
                  />
                </div>
                <!-- Info when all options are used -->
                <p
                  v-if="modalBankOptions.length === 0"
                  class="text-sm text-orange-600 dark:text-orange-400 mt-2"
                >
                  {{
                    createType === 'aggregator'
                      ? 'Tüm entegrasyonlar eklenmiş'
                      : 'Tüm bankalar eklenmiş'
                  }}
                </p>

                <!-- Bank & Card Family Logos Display (only for bank POS) -->
                <div
                  v-if="selectedBank && !selectedBank.isAggregator"
                  class="mt-4 p-4 bg-gray-50 dark:bg-slate-900 rounded-xl flex items-center gap-6"
                >
                  <div class="flex items-center gap-3">
                    <img
                      :src="getBankLogo(selectedBank.code)"
                      :alt="selectedBank.name"
                      class="h-10 w-auto max-w-24 object-contain"
                    />
                    <div>
                      <p class="font-medium text-gray-800 dark:text-white">
                        {{ selectedBank.name }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-slate-400">Banka</p>
                    </div>
                  </div>
                  <div class="w-px h-10 bg-gray-300 dark:bg-slate-600"></div>
                  <div v-if="selectedCardFamily" class="flex items-center gap-3">
                    <img
                      :src="getCardLogo(selectedCardFamily.code)"
                      :alt="selectedCardFamily.name"
                      class="h-10 rounded-lg"
                    />
                    <div>
                      <p class="font-medium text-gray-800 dark:text-white">
                        {{ selectedCardFamily.name }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-slate-400">Kart Ailesi</p>
                    </div>
                  </div>
                </div>

                <!-- Aggregator Info Display -->
                <div
                  v-if="selectedBank && selectedBank.isAggregator"
                  class="mt-4 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center gap-4"
                >
                  <img
                    :src="getBankLogo(selectedBank.code)"
                    :alt="selectedBank.name"
                    class="h-10 w-auto max-w-24 object-contain"
                  />
                  <div>
                    <p class="font-medium text-gray-800 dark:text-white">
                      {{ selectedBank.name }}
                    </p>
                    <p class="text-xs text-purple-600 dark:text-purple-400">
                      Odeme Entegratoru - Tum kart ailelerini destekler
                    </p>
                  </div>
                </div>
              </div>

              <!-- Currency Multi-Select -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Para Birimleri *
                  <span class="text-gray-400 dark:text-slate-500 font-normal"
                    >(Birden fazla seçilebilir)</span
                  >
                </label>
                <div class="flex flex-wrap gap-3">
                  <label
                    v-for="curr in currencies"
                    :key="curr.code"
                    @click.prevent="toggleCurrency(curr.code)"
                    :class="[
                      'flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all cursor-pointer',
                      form.currencies.includes(curr.code)
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-500'
                    ]"
                  >
                    <span class="text-lg">{{ curr.symbol }}</span>
                    <span class="font-medium text-gray-800 dark:text-white">{{
                      curr.code.toUpperCase()
                    }}</span>
                    <span class="text-sm text-gray-500 dark:text-slate-400">{{ curr.name }}</span>
                    <span
                      v-if="form.currencies.includes(curr.code)"
                      class="material-icons text-primary-600 dark:text-primary-400 text-lg"
                      >check_circle</span
                    >
                  </label>
                </div>
                <p
                  v-if="form.currencies.length > 1"
                  class="text-sm text-primary-600 dark:text-primary-400 mt-2"
                >
                  Bu POS {{ form.currencies.length }} para birimini destekleyecek
                </p>
              </div>

              <!-- Status Row - Switches -->
              <div class="grid grid-cols-2 gap-4">
                <div
                  class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-xl"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="material-icons text-lg"
                      :class="
                        form.status
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-400 dark:text-slate-500'
                      "
                      >power_settings_new</span
                    >
                    <div>
                      <p class="text-sm font-medium text-gray-700 dark:text-slate-300">
                        POS Durumu
                      </p>
                      <p class="text-xs text-gray-500 dark:text-slate-400">
                        {{ form.status ? 'Aktif' : 'Pasif' }}
                      </p>
                    </div>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input v-model="form.status" type="checkbox" class="sr-only peer" />
                    <div
                      class="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"
                    ></div>
                  </label>
                </div>
                <div
                  class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-xl"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="material-icons text-lg"
                      :class="
                        form.testMode
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-400 dark:text-slate-500'
                      "
                      >science</span
                    >
                    <div>
                      <p class="text-sm font-medium text-gray-700 dark:text-slate-300">Test Modu</p>
                      <p class="text-xs text-gray-500 dark:text-slate-400">
                        {{ form.testMode ? 'Test ortami' : 'Canli ortam' }}
                      </p>
                    </div>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input v-model="form.testMode" type="checkbox" class="sr-only peer" />
                    <div
                      class="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"
                    ></div>
                  </label>
                </div>
              </div>

              <!-- 3D Secure Model Selection (always active) -->
              <div
                v-if="selectedBank && supported3DModels.length > 0"
                class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200 dark:border-green-800"
              >
                <div class="flex items-center gap-3 mb-3">
                  <span class="material-icons text-xl text-green-600 dark:text-green-400"
                    >verified_user</span
                  >
                  <div>
                    <p class="text-sm font-medium text-gray-800 dark:text-white">
                      3D Secure Modeli
                    </p>
                    <p class="text-xs text-gray-500 dark:text-slate-400">
                      Guvenli odeme icin kullanilacak 3D dogrulama yontemi
                    </p>
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    v-for="model in supported3DModels"
                    :key="model.code"
                    @click.prevent="form.paymentModel = model.code"
                    :class="[
                      'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                      form.paymentModel === model.code
                        ? 'border-green-500 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                        : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-green-300 dark:hover:border-green-600'
                    ]"
                  >
                    <span
                      :class="[
                        'material-icons text-lg',
                        form.paymentModel === model.code
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-400 dark:text-slate-500'
                      ]"
                      >verified_user</span
                    >
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium truncate text-gray-800 dark:text-white">
                        {{ model.name }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {{ model.description }}
                      </p>
                    </div>
                    <span
                      v-if="form.paymentModel === model.code"
                      class="material-icons text-green-600 dark:text-green-400"
                      >check_circle</span
                    >
                  </label>
                </div>
              </div>

              <!-- 3D'siz Odeme Izni Toggle (separate option) -->
              <div
                v-if="selectedBank && supportsDirectPayment"
                class="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl border border-orange-200 dark:border-orange-800"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="material-icons text-xl text-orange-600 dark:text-orange-400"
                      >lock_open</span
                    >
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-white">
                        3D'siz Odeme Izni
                      </p>
                      <p class="text-xs text-gray-500 dark:text-slate-400">
                        Odeme linki vb. durumlarda 3D olmadan odeme alinabilir
                      </p>
                    </div>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input v-model="form.allowDirectPayment" type="checkbox" class="sr-only peer" />
                    <div
                      class="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"
                    ></div>
                  </label>
                </div>
                <p
                  v-if="form.allowDirectPayment"
                  class="mt-3 text-xs text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 p-2 rounded-lg"
                >
                  <span class="material-icons text-sm align-middle mr-1">warning</span>
                  Dikkat: 3D olmadan odeme almak guvenlik riski tasir. Sadece guvenilir musteriler
                  ve ozel durumlar icin kullanin.
                </p>
              </div>

              <!-- Campaign / Plus Installment -->
              <div
                v-if="selectedCardFamily"
                class="p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <img
                      :src="getCardLogo(selectedCardFamily.code)"
                      :alt="selectedCardFamily.name"
                      class="h-10 rounded-lg"
                      @error="$event.target.style.display = 'none'"
                    />
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-white">
                        {{ selectedCardFamily.name }} Kampanyasi
                      </p>
                      <p class="text-xs text-gray-500 dark:text-slate-400">
                        Ekstra taksit kampanyasi
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-600 dark:text-slate-400">+</span>
                    <input
                      v-model.number="form.plusInstallment"
                      type="number"
                      min="0"
                      max="12"
                      step="1"
                      class="w-16 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-center font-semibold focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                    />
                    <span class="text-sm font-medium text-gray-600 dark:text-slate-400"
                      >Taksit</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Credentials Tab -->
            <div v-show="activeTab === 'credentials'" class="space-y-6">
              <div
                class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3"
              >
                <span class="material-icons text-yellow-600 dark:text-yellow-400">info</span>
                <div>
                  <p class="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                    Hassas Bilgiler
                  </p>
                  <p class="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    Bu bilgiler sifrelenerek saklanir. Guvenligi icin sifre alanlari kaydedildikten
                    sonra gosterilmez.
                  </p>
                </div>
              </div>

              <!-- Provider info badge -->
              <div
                v-if="selectedProvider"
                class="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400"
              >
                <span class="material-icons text-base">settings</span>
                <span
                  >Provider:
                  <strong class="text-gray-700 dark:text-slate-300">{{
                    selectedProvider
                  }}</strong></span
                >
              </div>

              <!-- IP Address Tip for specific banks -->
              <div
                v-if="selectedIpTip"
                :class="[
                  'p-4 rounded-xl border flex items-start gap-3',
                  selectedIpTip.type === 'warning'
                    ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800'
                    : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
                ]"
              >
                <span
                  :class="[
                    'material-icons text-xl',
                    selectedIpTip.type === 'warning'
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-blue-600 dark:text-blue-400'
                  ]"
                  >{{ selectedIpTip.icon }}</span
                >
                <div>
                  <p
                    :class="[
                      'text-sm font-medium',
                      selectedIpTip.type === 'warning'
                        ? 'text-orange-800 dark:text-orange-300'
                        : 'text-blue-800 dark:text-blue-300'
                    ]"
                  >
                    {{ selectedIpTip.title }}
                  </p>
                  <p
                    :class="[
                      'text-sm mt-1',
                      selectedIpTip.type === 'warning'
                        ? 'text-orange-700 dark:text-orange-400'
                        : 'text-blue-700 dark:text-blue-400'
                    ]"
                  >
                    {{ selectedIpTip.message }}
                  </p>
                  <div class="mt-2 flex items-center gap-2 text-xs">
                    <span class="material-icons text-sm text-gray-500 dark:text-slate-400"
                      >dns</span
                    >
                    <span
                      class="font-mono bg-white dark:bg-slate-700 px-2 py-1 rounded border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300"
                      >{{ serverIp }}</span
                    >
                    <span class="text-gray-500 dark:text-slate-400">(Sunucu IP Adresi)</span>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <!-- Merchant ID -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{{
                    credentialFields.merchantId?.label || 'Merchant ID'
                  }}</label>
                  <input
                    v-model="form.credentials.merchantId"
                    type="text"
                    autocomplete="off"
                    :placeholder="credentialFields.merchantId?.placeholder || 'Merchant ID'"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                  />
                </div>
                <!-- Terminal ID -->
                <div v-if="credentialFields.terminalId?.show !== false">
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{{
                    credentialFields.terminalId?.label || 'Terminal ID'
                  }}</label>
                  <input
                    v-model="form.credentials.terminalId"
                    type="text"
                    autocomplete="off"
                    :placeholder="credentialFields.terminalId?.placeholder || 'Terminal ID'"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <!-- Username -->
                <div v-if="credentialFields.username?.show !== false">
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{{
                    credentialFields.username?.label || 'Kullanici Adi'
                  }}</label>
                  <input
                    v-model="form.credentials.username"
                    type="text"
                    autocomplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    :placeholder="credentialFields.username?.placeholder || 'Kullanici adi'"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                  />
                </div>
                <!-- Password -->
                <div v-if="credentialFields.password?.show !== false">
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ credentialFields.password?.label || 'Sifre' }}
                    <span v-if="editingPos" class="text-gray-400 dark:text-slate-500 font-normal"
                      >(degistirmek icin yeni deger girin)</span
                    >
                  </label>
                  <input
                    v-model="form.credentials.password"
                    type="password"
                    autocomplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    :placeholder="credentialFields.password?.placeholder || 'Sifre'"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <!-- Secret Key -->
                <div v-if="credentialFields.secretKey?.show !== false">
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ credentialFields.secretKey?.label || 'Secret Key' }}
                    <span v-if="editingPos" class="text-gray-400 dark:text-slate-500 font-normal"
                      >(degistirmek icin yeni deger girin)</span
                    >
                  </label>
                  <input
                    v-model="form.credentials.secretKey"
                    type="password"
                    autocomplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    :placeholder="credentialFields.secretKey?.placeholder || 'Guvenlik anahtari'"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                  />
                </div>
                <!-- POSNET ID (YKB only) -->
                <div v-if="credentialFields.posnetId?.show === true">
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{{
                    credentialFields.posnetId?.label || 'POSNET ID'
                  }}</label>
                  <input
                    v-model="form.credentials.posnetId"
                    type="text"
                    autocomplete="off"
                    :placeholder="credentialFields.posnetId?.placeholder || 'POSNET ID'"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                  />
                </div>
                <!-- Section/BOLUM (Payten banks - İşbank etc.) -->
                <div v-if="credentialFields.section?.show === true">
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{{
                    credentialFields.section?.label || 'BOLUM'
                  }}</label>
                  <input
                    v-model="form.credentials.section"
                    type="text"
                    autocomplete="off"
                    :placeholder="credentialFields.section?.placeholder || 'Bolum/Sube kodu'"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <!-- Installment Tab -->
            <div v-show="activeTab === 'installment'" class="space-y-6">
              <!-- Installment Toggle -->
              <div
                class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <span class="material-icons text-2xl text-primary-600 dark:text-primary-400"
                    >calendar_month</span
                  >
                  <div>
                    <p class="font-medium text-gray-800 dark:text-white">Taksitli Satis</p>
                    <p class="text-sm text-gray-500 dark:text-slate-400">
                      Taksitli odeme secenegi sun
                    </p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input v-model="form.installment.enabled" type="checkbox" class="sr-only peer" />
                  <div
                    class="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
                  ></div>
                </label>
              </div>

              <div v-if="form.installment.enabled" class="space-y-6">
                <!-- Basic Settings -->
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
                      >Minimum Taksit</label
                    >
                    <select
                      v-model.number="form.installment.minCount"
                      class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                    >
                      <option v-for="n in 6" :key="n" :value="n + 1">{{ n + 1 }} Taksit</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
                      >Maksimum Taksit</label
                    >
                    <select
                      v-model.number="form.installment.maxCount"
                      class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                    >
                      <option
                        v-for="n in 12"
                        :key="n"
                        :value="n"
                        :disabled="n < form.installment.minCount"
                      >
                        {{ n }} Taksit
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
                      >Min. Tutar ({{ (form.currencies[0] || 'try').toUpperCase() }})</label
                    >
                    <input
                      v-model.number="form.installment.minAmount"
                      type="number"
                      min="0"
                      step="1"
                      class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <!-- Info about Commission Rates -->
                <div
                  class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3"
                >
                  <span class="material-icons text-blue-600 dark:text-blue-400">info</span>
                  <div>
                    <p class="text-sm text-blue-800 dark:text-blue-300 font-medium">
                      Banka Komisyon Oranlari
                    </p>
                    <p class="text-sm text-blue-700 dark:text-blue-400 mt-1">
                      Banka komisyon oranlarini ayarlamak icin "Komisyon Oranlari" sekmesine gidin.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Commissions Tab -->
            <div v-show="activeTab === 'commissions'" class="space-y-6">
              <!-- Header with Add Button -->
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-medium text-gray-800 dark:text-white">Banka Komisyon Oranlari</h4>
                  <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    Tarih bazli komisyon donemlerini yonetin
                  </p>
                </div>
                <button
                  type="button"
                  @click="addCommissionPeriod"
                  class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm"
                >
                  <span class="material-icons text-lg">add</span>
                  Yeni Donem Ekle
                </button>
              </div>

              <!-- No periods message -->
              <div
                v-if="form.commissionRates.length === 0"
                class="text-center py-12 bg-gray-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700"
              >
                <span class="material-icons text-5xl text-gray-300 dark:text-slate-600 mb-3"
                  >calendar_month</span
                >
                <p class="text-gray-500 dark:text-slate-400 mb-4">
                  Henuz komisyon donemi tanimlanmamis
                </p>
                <button
                  type="button"
                  @click="addCommissionPeriod"
                  class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                >
                  Ilk Donemi Ekle
                </button>
              </div>

              <!-- Commission Periods -->
              <div
                v-for="(period, periodIndex) in form.commissionRates"
                :key="periodIndex"
                class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden"
              >
                <!-- Period Header -->
                <div
                  class="bg-gray-50 dark:bg-slate-900 px-4 py-3 border-b dark:border-slate-700 flex items-center justify-between"
                >
                  <div class="flex items-center gap-4">
                    <span class="material-icons text-gray-500 dark:text-slate-400">event</span>
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-gray-700 dark:text-slate-300"
                        >Bu tarihten itibaren:</span
                      >
                      <input
                        v-model="period.startDate"
                        type="date"
                        class="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="removeCommissionPeriod(periodIndex)"
                    class="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                  >
                    <span class="material-icons text-lg">delete</span>
                  </button>
                </div>

                <!-- Rates List -->
                <div class="divide-y divide-gray-100 dark:divide-slate-700">
                  <!-- Yurtdışı Kartlar -->
                  <div
                    class="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20"
                  >
                    <div class="flex items-center gap-3">
                      <span class="material-icons text-blue-600 dark:text-blue-400 text-lg"
                        >credit_card</span
                      >
                      <span class="font-medium text-gray-800 dark:text-white"
                        >Yurtdisi Kartlar</span
                      >
                    </div>
                    <div class="flex items-center gap-2">
                      <input
                        v-model.number="period.foreignCardRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        class="w-20 px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-center text-sm focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                      />
                      <span class="text-sm text-gray-500 dark:text-slate-400">%</span>
                    </div>
                  </div>

                  <!-- Yabancı Bankalar -->
                  <div
                    class="flex items-center justify-between px-4 py-3 bg-orange-50 dark:bg-orange-900/20"
                  >
                    <div class="flex items-center gap-3">
                      <span class="material-icons text-orange-600 dark:text-orange-400 text-lg"
                        >account_balance</span
                      >
                      <span class="font-medium text-gray-800 dark:text-white"
                        >Yabanci Bankalar</span
                      >
                    </div>
                    <div class="flex items-center gap-2">
                      <input
                        v-model.number="period.foreignBankRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        class="w-20 px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-center text-sm focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                      />
                      <span class="text-sm text-gray-500 dark:text-slate-400">%</span>
                    </div>
                  </div>

                  <!-- Taksit Oranları -->
                  <div
                    v-for="rate in period.rates"
                    :key="rate.count"
                    class="flex items-center justify-between px-4 py-2.5"
                    :class="rate.count === 1 ? 'bg-green-50 dark:bg-green-900/20' : ''"
                  >
                    <span class="font-medium text-gray-800 dark:text-white">
                      {{ rate.count === 1 ? 'Pesin' : rate.count + ' Taksit' }}
                    </span>
                    <div class="flex items-center gap-2">
                      <input
                        v-model.number="rate.rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        class="w-20 px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-center text-sm focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                      />
                      <span class="text-sm text-gray-500 dark:text-slate-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Modal Footer -->
        <div
          class="px-6 py-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex justify-end items-center gap-3"
        >
          <button
            type="button"
            @click="showModal = false"
            class="px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            Iptal
          </button>
          <button
            type="button"
            @click="handleSubmit"
            :disabled="saving || !form.bankCode"
            class="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
            <span class="material-icons text-sm" v-else>save</span>
            {{ editingPos ? 'Guncelle' : 'Kaydet' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
