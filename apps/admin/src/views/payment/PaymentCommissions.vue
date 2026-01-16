<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { usePaymentStore } from '@/stores/payment'

const store = usePaymentStore()

// State
const activeTab = ref(null)
const saving = ref(false)
const successMessage = ref(null)
const errorMessage = ref(null)

// Platform POS listesi (partnerId: null olanlar)
const platformPosList = computed(() => {
  return store.posList.filter(pos => pos.partnerId === null || pos.isPlatformPos === true)
})

// Aktif POS (seçili tab)
const activePos = computed(() => {
  if (!activeTab.value) return null
  return platformPosList.value.find(pos => pos._id === activeTab.value)
})

// Aktif dönem (en güncel tarihli)
const activePeriod = computed(() => {
  if (!activePos.value?.commissionRates?.length) return null
  // En güncel tarihe sahip dönemi bul
  const sorted = [...activePos.value.commissionRates].sort(
    (a, b) => new Date(b.startDate) - new Date(a.startDate)
  )
  return sorted[0]
})

// Form state - editable margins
const formData = ref({
  foreignCardMargin: 0,
  foreignBankMargin: 0,
  rates: [] // [{ count, platformMargin }]
})

// Watch activePos and initialize form
watch(activePos, (pos) => {
  if (pos && activePeriod.value) {
    initializeForm()
  }
}, { immediate: true })

function initializeForm() {
  const period = activePeriod.value
  if (!period) {
    // Boş form
    formData.value = {
      foreignCardMargin: 0,
      foreignBankMargin: 0,
      rates: generateDefaultRates()
    }
    return
  }

  formData.value = {
    foreignCardMargin: period.foreignCardMargin || 0,
    foreignBankMargin: period.foreignBankMargin || 0,
    rates: generateRatesFromPeriod(period)
  }
}

function generateDefaultRates() {
  const rates = []
  for (let i = 1; i <= 12; i++) {
    rates.push({
      count: i,
      rate: 0,
      platformMargin: 0
    })
  }
  return rates
}

function generateRatesFromPeriod(period) {
  const rates = []
  for (let i = 1; i <= 12; i++) {
    const existingRate = period.rates?.find(r => r.count === i)
    rates.push({
      count: i,
      rate: existingRate?.rate || 0,
      platformMargin: existingRate?.platformMargin || 0
    })
  }
  return rates
}

// Bank info helpers
function getBankLogo(bankCode) {
  return `/logos/banks/${bankCode}.png`
}

// Get bank rate for display
function getBankRate(count) {
  const period = activePeriod.value
  if (!period) return 0
  const rate = period.rates?.find(r => r.count === count)
  return rate?.rate || 0
}

// Calculate total (bank + platform margin)
function getTotal(count) {
  const bankRate = getBankRate(count)
  const margin = formData.value.rates.find(r => r.count === count)?.platformMargin || 0
  return (bankRate + margin).toFixed(2)
}

// Foreign card/bank totals
function getForeignCardTotal() {
  const bankRate = activePeriod.value?.foreignCardRate || 0
  return (bankRate + formData.value.foreignCardMargin).toFixed(2)
}

function getForeignBankTotal() {
  const bankRate = activePeriod.value?.foreignBankRate || 0
  return (bankRate + formData.value.foreignBankMargin).toFixed(2)
}

// Save commission rates
async function handleSave() {
  if (!activePos.value) return

  saving.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    // Prepare updated commission rates
    const periodId = activePeriod.value?._id
    const updatedRates = formData.value.rates.map(r => ({
      count: r.count,
      rate: getBankRate(r.count), // Preserve bank rate
      platformMargin: r.platformMargin
    }))

    const commissionData = {
      foreignCardMargin: formData.value.foreignCardMargin,
      foreignBankMargin: formData.value.foreignBankMargin,
      rates: updatedRates
    }

    // Call API to update POS commission
    await store.updatePosCommission(activePos.value._id, periodId, commissionData)

    successMessage.value = 'Platform komisyonları kaydedildi'
    setTimeout(() => successMessage.value = null, 3000)
  } catch (e) {
    errorMessage.value = e.response?.data?.error || e.message
  } finally {
    saving.value = false
  }
}

// Initialize
onMounted(async () => {
  await store.fetchPosList()
  // İlk POS'u seç
  if (platformPosList.value.length > 0) {
    activeTab.value = platformPosList.value[0]._id
  }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-gray-800">Platform Komisyonları</h2>
      <p class="text-sm text-gray-500 mt-1">Her POS için platform kar marjlarını belirleyin</p>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-center py-12">
      <span class="material-icons animate-spin text-4xl text-gray-400">refresh</span>
    </div>

    <!-- No POS -->
    <div v-else-if="platformPosList.length === 0"
      class="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
      <span class="material-icons text-6xl text-gray-300">credit_card_off</span>
      <h3 class="mt-4 text-lg font-medium text-gray-600">POS Tanımlı Değil</h3>
      <p class="text-gray-500 mt-2">Önce POS sekmesinden en az bir POS terminali ekleyin</p>
    </div>

    <!-- Content with Tabs -->
    <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <!-- POS Tabs -->
      <div class="border-b border-gray-200 bg-gray-50">
        <nav class="flex overflow-x-auto px-4 gap-1 -mb-px">
          <button
            v-for="pos in platformPosList"
            :key="pos._id"
            @click="activeTab = pos._id"
            :class="[
              'flex items-center gap-3 px-4 py-3 border-b-2 transition-all whitespace-nowrap',
              activeTab === pos._id
                ? 'border-primary-500 bg-white text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            ]"
          >
            <img :src="getBankLogo(pos.bankCode)"
              :alt="pos.name"
              class="w-6 h-6 object-contain">
            <span class="font-medium text-sm">{{ pos.name }}</span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div v-if="activePos" class="p-6">
        <!-- Success/Error Messages -->
        <div v-if="successMessage"
          class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <span class="material-icons text-lg">check_circle</span>
          {{ successMessage }}
        </div>
        <div v-if="errorMessage"
          class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <span class="material-icons text-lg">error</span>
          {{ errorMessage }}
        </div>

        <!-- No Commission Period Warning -->
        <div v-if="!activePeriod"
          class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <span class="material-icons text-yellow-600">warning</span>
          <div>
            <p class="font-medium text-yellow-800">Komisyon Dönemi Bulunamadı</p>
            <p class="text-sm text-yellow-700 mt-1">
              Bu POS için henüz komisyon dönemi tanımlanmamış.
              POS ayarlarından komisyon dönemi ekleyin.
            </p>
          </div>
        </div>

        <!-- Commission Table -->
        <div class="overflow-hidden rounded-xl border border-gray-200">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">
                  Taksit
                </th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">
                  <div class="flex items-center justify-center gap-1">
                    <span class="material-icons text-sm text-blue-600">account_balance</span>
                    Banka Oranı
                  </div>
                </th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">
                  <div class="flex items-center justify-center gap-1">
                    <span class="material-icons text-sm text-primary-600">trending_up</span>
                    Platform Marjı
                  </div>
                </th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">
                  <div class="flex items-center justify-center gap-1">
                    <span class="material-icons text-sm text-green-600">functions</span>
                    Toplam
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <!-- Yurtdışı Kartlar -->
              <tr class="bg-blue-50/50">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-blue-600 text-lg">credit_card</span>
                    <span class="font-medium text-gray-800">Yurtdışı Kartlar</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="text-gray-600 font-mono">
                    %{{ (activePeriod?.foreignCardRate || 0).toFixed(2) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-1">
                    <span class="text-gray-400">+</span>
                    <input
                      v-model.number="formData.foreignCardMargin"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-center font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                    <span class="text-gray-500">%</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="font-semibold text-green-700 font-mono">
                    %{{ getForeignCardTotal() }}
                  </span>
                </td>
              </tr>

              <!-- Yabancı Bankalar -->
              <tr class="bg-orange-50/50">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-orange-600 text-lg">account_balance</span>
                    <span class="font-medium text-gray-800">Yabancı Bankalar</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="text-gray-600 font-mono">
                    %{{ (activePeriod?.foreignBankRate || 0).toFixed(2) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-1">
                    <span class="text-gray-400">+</span>
                    <input
                      v-model.number="formData.foreignBankMargin"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-center font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                    <span class="text-gray-500">%</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="font-semibold text-green-700 font-mono">
                    %{{ getForeignBankTotal() }}
                  </span>
                </td>
              </tr>

              <!-- Separator -->
              <tr>
                <td colspan="4" class="px-4 py-2 bg-gray-100">
                  <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Taksit Oranları</span>
                </td>
              </tr>

              <!-- Installment Rates -->
              <tr
                v-for="(rate, index) in formData.rates"
                :key="rate.count"
                :class="rate.count === 1 ? 'bg-green-50/50' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')"
              >
                <td class="px-4 py-3">
                  <span class="font-medium text-gray-800">
                    {{ rate.count === 1 ? 'Peşin' : rate.count + ' Taksit' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="text-gray-600 font-mono">
                    %{{ getBankRate(rate.count).toFixed(2) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-1">
                    <span class="text-gray-400">+</span>
                    <input
                      v-model.number="rate.platformMargin"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-center font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                    <span class="text-gray-500">%</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="font-semibold text-green-700 font-mono">
                    %{{ getTotal(rate.count) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Actions -->
        <div class="flex justify-end mt-6 pt-6 border-t border-gray-100">
          <button
            @click="handleSave"
            :disabled="saving"
            class="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-primary-500/20"
          >
            <span v-if="saving" class="material-icons animate-spin text-lg">refresh</span>
            <span v-else class="material-icons text-lg">save</span>
            {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
