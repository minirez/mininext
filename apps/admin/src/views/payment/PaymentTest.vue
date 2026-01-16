<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { usePaymentStore } from '@/stores/payment';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const store = usePaymentStore();

// Selected POS (empty = auto-select)
const selectedPos = ref('');

// Fetch POS list on mount
onMounted(async () => {
  await store.fetchPosList();
});

// Active POS list (only enabled ones)
const activePosList = computed(() => {
  return store.posList.filter(pos => pos.status === true);
});

// Test cards - click to auto-fill
// Mock Provider test kartları
const mockTestCards = [
  {
    name: 'Mock Success',
    label: 'Basarili',
    number: '4111111111111111',
    expiry: '12/28',
    cvv: '123',
    holder: 'TEST USER',
    brand: 'visa',
    color: 'from-green-500 to-green-700',
    description: 'Her zaman basarili olur',
    isMock: true
  },
  {
    name: 'Mock Fail',
    label: 'Reddedilir',
    number: '5555555555554444',
    expiry: '12/28',
    cvv: '123',
    holder: 'TEST USER',
    brand: 'mastercard',
    color: 'from-red-500 to-red-700',
    description: 'Kart reddedilir',
    isMock: true
  },
  {
    name: 'Mock Insufficient',
    label: 'Yetersiz',
    number: '4000000000000119',
    expiry: '12/28',
    cvv: '123',
    holder: 'TEST USER',
    brand: 'visa',
    color: 'from-orange-500 to-orange-700',
    description: 'Yetersiz bakiye',
    isMock: true
  },
  {
    name: 'Mock Blocked',
    label: 'Blokeli',
    number: '4000000000000069',
    expiry: '12/28',
    cvv: '123',
    holder: 'TEST USER',
    brand: 'visa',
    color: 'from-gray-500 to-gray-700',
    description: 'Kart blokeli',
    isMock: true
  }
];

// Akbank test kartları: https://dev.isyerimpos.com/test-kartlari
const bankTestCards = [
  {
    name: 'Akbank Visa',
    label: 'Akbank Visa',
    number: '4355084355084358',
    expiry: '12/26',
    cvv: '000',
    holder: 'TEST USER',
    brand: 'visa',
    color: 'from-red-500 to-orange-600',
    smsCode: 'a',
    description: 'Akbank test'
  },
  {
    name: 'Akbank Visa 2',
    label: 'Akbank Visa 2',
    number: '4355093000777068',
    expiry: '11/40',
    cvv: '313',
    holder: 'TEST USER',
    brand: 'visa',
    color: 'from-blue-500 to-blue-700',
    smsCode: '123456',
    description: 'Akbank test'
  },
  {
    name: 'Akbank MC',
    label: 'Akbank MC',
    number: '5571135571135575',
    expiry: '12/26',
    cvv: '000',
    holder: 'TEST USER',
    brand: 'mastercard',
    color: 'from-red-500 to-red-700',
    smsCode: 'a',
    description: 'Akbank test'
  },
  {
    name: 'Troy Test',
    label: 'Troy',
    number: '9792030000000001',
    expiry: '12/28',
    cvv: '123',
    holder: 'TEST USER',
    brand: 'troy',
    color: 'from-purple-500 to-purple-700',
    description: 'Troy test'
  }
];

// Active test card type
const testCardType = ref('mock');

// Filtered test cards based on selection
const testCards = computed(() => {
  return testCardType.value === 'mock' ? mockTestCards : bankTestCards;
});

// Quick amounts
const quickAmounts = [1, 10, 50, 100, 250, 500, 1000];

// Form state
const form = ref({
  amount: '1',
  currency: 'TRY',
  cardHolder: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
  installment: 1
});

// UI state
const loading = ref(false);
const binLoading = ref(false);
const error = ref('');
const result = ref(null);
const binInfo = ref(null);
const showIframe = ref(false);
const iframeUrl = ref('');
const selectedCard = ref(null);

// Format card number with spaces
const formattedCardNumber = computed({
  get: () => form.value.cardNumber.replace(/(.{4})/g, '$1 ').trim(),
  set: (val) => { form.value.cardNumber = val.replace(/\s/g, ''); }
});

// Format expiry as MM/YY
const formattedExpiry = computed({
  get: () => form.value.expiry,
  set: (val) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length >= 2) {
      form.value.expiry = clean.slice(0, 2) + '/' + clean.slice(2, 4);
    } else {
      form.value.expiry = clean;
    }
  }
});

// Card type detection
const cardType = computed(() => {
  const num = form.value.cardNumber;
  if (!num) return null;
  if (/^4/.test(num)) return { type: 'visa', color: 'bg-blue-600', textColor: 'text-blue-400' };
  if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return { type: 'mastercard', color: 'bg-red-600', textColor: 'text-red-400' };
  if (/^3[47]/.test(num)) return { type: 'amex', color: 'bg-green-600', textColor: 'text-green-400' };
  if (/^9/.test(num)) return { type: 'troy', color: 'bg-purple-600', textColor: 'text-purple-400' };
  return null;
});

// BIN query when card number has 8+ digits
watch(() => form.value.cardNumber, async (val) => {
  if (val.length >= 8 && form.value.amount) {
    await queryBin();
  } else {
    binInfo.value = null;
  }
});

// Select test card
function selectTestCard(card) {
  selectedCard.value = card.number;
  form.value.cardNumber = card.number;
  form.value.expiry = card.expiry;
  form.value.cvv = card.cvv;
  form.value.cardHolder = card.holder;
}

// Set quick amount
function setAmount(amount) {
  form.value.amount = String(amount);
  if (form.value.cardNumber.length >= 8) {
    queryBin();
  }
}

async function queryBin() {
  if (!form.value.cardNumber || !form.value.amount) return;

  binLoading.value = true;
  try {
    const data = await store.queryBin(
      form.value.cardNumber.slice(0, 8),
      parseFloat(form.value.amount),
      form.value.currency
    );
    if (data?.success) {
      binInfo.value = data;
    }
  } catch (e) {
    console.error('BIN query failed:', e);
  } finally {
    binLoading.value = false;
  }
}

async function handleSubmit() {
  error.value = '';
  result.value = null;
  loading.value = true;

  try {
    const paymentData = {
      amount: parseFloat(form.value.amount),
      currency: form.value.currency,
      installment: form.value.installment,
      card: {
        holder: form.value.cardHolder,
        number: form.value.cardNumber,
        expiry: form.value.expiry,
        cvv: form.value.cvv
      },
      customer: {
        name: form.value.cardHolder
      }
    };

    // Add posId if manually selected
    if (selectedPos.value) {
      paymentData.posId = selectedPos.value;
    }

    const response = await store.processPayment(paymentData);

    if (response.success && response.formUrl) {
      // 3D Secure - show iframe
      iframeUrl.value = response.formUrl;
      showIframe.value = true;
    } else if (response.success) {
      // Direct success
      result.value = response;
    } else {
      error.value = response.message || response.error || 'Payment failed';
    }
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Payment failed';
  } finally {
    loading.value = false;
  }
}

// Listen for payment result from iframe
window.addEventListener('message', (event) => {
  if (event.data?.type === 'payment_result') {
    showIframe.value = false;
    result.value = event.data.data;
  }
});

function resetForm() {
  form.value = {
    amount: '1',
    currency: 'TRY',
    cardHolder: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    installment: 1
  };
  error.value = '';
  result.value = null;
  binInfo.value = null;
  selectedCard.value = null;
  selectedPos.value = '';
}

function getBrandIcon(brand) {
  const icons = {
    visa: '/logos/associations/visa.png',
    mastercard: '/logos/associations/mastercard.png',
    troy: '/logos/associations/troy.png',
    amex: '/logos/associations/amex.png'
  };
  return icons[brand] || null;
}
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-gray-800">Test Payment</h2>
      <button
        @click="resetForm"
        class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
      >
        <span class="material-icons text-lg">refresh</span>
        Reset
      </button>
    </div>

    <!-- Test Cards Selection -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide">Test Kartlari</h3>
        <div class="flex bg-gray-100 rounded-lg p-1">
          <button
            @click="testCardType = 'mock'"
            :class="[
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              testCardType === 'mock'
                ? 'bg-purple-600 text-white shadow'
                : 'text-gray-600 hover:text-gray-800'
            ]"
          >
            Mock (Test)
          </button>
          <button
            @click="testCardType = 'bank'"
            :class="[
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              testCardType === 'bank'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-600 hover:text-gray-800'
            ]"
          >
            Banka
          </button>
        </div>
      </div>
      <p v-if="testCardType === 'mock'" class="text-sm text-purple-600 bg-purple-50 rounded-lg p-3 mb-4 flex items-center gap-2">
        <span class="material-icons text-lg">science</span>
        Mock kartlar gercek banka baglantisi olmadan test icin kullanilir. Test POS sectiginizden emin olun.
      </p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          v-for="card in testCards"
          :key="card.number"
          @click="selectTestCard(card)"
          :class="[
            'relative p-4 rounded-xl border-2 transition-all duration-200 text-left overflow-hidden group',
            selectedCard === card.number
              ? 'border-primary-500 ring-2 ring-primary-200'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          ]"
        >
          <div :class="['absolute inset-0 opacity-10 bg-gradient-to-br', card.color]"></div>
          <div class="relative">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-gray-800">{{ card.label }}</span>
              <img v-if="getBrandIcon(card.brand)" :src="getBrandIcon(card.brand)" class="h-6 w-auto" :alt="card.brand">
            </div>
            <div class="text-xs font-mono text-gray-500">
              {{ card.number.replace(/(.{4})/g, '$1 ').trim() }}
            </div>
            <div v-if="card.description" class="text-xs text-gray-400 mt-1">{{ card.description }}</div>
          </div>
          <div v-if="selectedCard === card.number" class="absolute top-2 right-2">
            <span class="material-icons text-primary-500 text-lg">check_circle</span>
          </div>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Payment Form -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Quick Amounts -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Quick Amount</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="amount in quickAmounts"
                :key="amount"
                type="button"
                @click="setAmount(amount)"
                :class="[
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  form.amount === String(amount)
                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                ]"
              >
                {{ amount }} ₺
              </button>
            </div>
          </div>

          <!-- Amount & Currency -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                v-model="form.amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="100.00"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                @blur="queryBin"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                v-model="form.currency"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <!-- POS Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">POS Terminal</label>
            <select
              v-model="selectedPos"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
            >
              <option value="">Otomatik Sec (BIN'e gore)</option>
              <option
                v-for="pos in activePosList"
                :key="pos._id"
                :value="pos._id"
              >
                {{ pos.name }} ({{ pos.bankCode.toUpperCase() }}) {{ pos.testMode ? '[TEST]' : '' }}
              </option>
            </select>
            <p class="text-xs text-gray-500 mt-1">
              Bos birakirsaniz kart BIN'ine gore uygun POS otomatik secilir
            </p>
          </div>

          <!-- Card Number -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
            <div class="relative">
              <input
                v-model="formattedCardNumber"
                type="text"
                name="cardnumber"
                autocomplete="cc-number"
                maxlength="19"
                required
                placeholder="4242 4242 4242 4242"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-mono tracking-wider pr-24"
              >
              <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span v-if="binLoading" class="material-icons animate-spin text-gray-400">refresh</span>
                <span v-else-if="cardType" :class="['px-2 py-1 text-white text-xs rounded uppercase font-bold', cardType.color]">
                  {{ cardType.type }}
                </span>
              </div>
            </div>
          </div>

          <!-- Card Holder -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Card Holder Name</label>
            <input
              v-model="form.cardHolder"
              type="text"
              name="ccname"
              autocomplete="cc-name"
              required
              placeholder="JOHN DOE"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg uppercase"
            >
          </div>

          <!-- Expiry & CVV -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                v-model="formattedExpiry"
                type="text"
                name="cc-exp"
                autocomplete="cc-exp"
                maxlength="5"
                required
                placeholder="MM/YY"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-mono"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">CVV</label>
              <input
                v-model="form.cvv"
                type="text"
                name="cvc"
                autocomplete="cc-csc"
                maxlength="4"
                required
                placeholder="123"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-mono"
              >
            </div>
          </div>

          <!-- Installment (if TRY) -->
          <div v-if="form.currency === 'TRY' && binInfo?.installments?.length > 1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Installment</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="inst in binInfo.installments"
                :key="inst.count"
                type="button"
                @click="form.installment = inst.count"
                :class="[
                  'py-2 px-3 rounded-lg border-2 text-sm font-medium transition-colors',
                  form.installment === inst.count
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
              >
                <div>{{ inst.count === 1 ? 'Tek Cekim' : inst.count + ' Taksit' }}</div>
                <div class="text-xs text-gray-500">{{ inst.amount.toFixed(2) }} TL</div>
              </button>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
            <span class="material-icons text-red-500">error</span>
            <span>{{ error }}</span>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-4 px-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold text-lg hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <span v-if="loading" class="material-icons animate-spin">refresh</span>
            <span class="material-icons" v-else>lock</span>
            <span>{{ loading ? 'Processing...' : 'Pay ' + (form.amount || '0') + ' ' + form.currency }}</span>
          </button>
        </form>
      </div>

      <!-- Card Preview & Info -->
      <div class="space-y-6">
        <!-- Card Visual -->
        <div :class="[
          'rounded-2xl p-6 text-white shadow-xl aspect-[1.6/1] bg-gradient-to-br',
          cardType ? cardType.color.replace('bg-', 'from-') + ' to-gray-900' : 'from-gray-800 to-gray-900'
        ]">
          <div class="h-full flex flex-col justify-between">
            <div class="flex justify-between items-start">
              <div class="w-12 h-8 bg-gradient-to-r from-yellow-400 to-yellow-200 rounded"></div>
              <img
                v-if="cardType && getBrandIcon(cardType.type)"
                :src="getBrandIcon(cardType.type)"
                class="h-10 w-auto brightness-0 invert opacity-80"
                :alt="cardType.type"
              >
            </div>

            <div class="font-mono text-2xl tracking-[0.15em]">
              {{ formattedCardNumber || '**** **** **** ****' }}
            </div>

            <div class="flex justify-between">
              <div>
                <div class="text-xs text-gray-400 uppercase">Card Holder</div>
                <div class="font-medium text-lg">{{ form.cardHolder || 'YOUR NAME' }}</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-400 uppercase">Expires</div>
                <div class="font-mono text-lg">{{ form.expiry || 'MM/YY' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- BIN Info -->
        <div v-if="binInfo" class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span class="material-icons text-primary-500">credit_card</span>
            Card Information
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
              <span class="text-gray-600">Bank</span>
              <span class="font-medium">{{ binInfo.bank || 'Unknown' }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
              <span class="text-gray-600">Card Type</span>
              <span class="font-medium">{{ binInfo.cardType || 'Unknown' }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
              <span class="text-gray-600">Card Family</span>
              <span class="font-medium">{{ binInfo.cardFamily || 'Unknown' }}</span>
            </div>
            <div class="flex justify-between items-center py-2">
              <span class="text-gray-600">Selected POS</span>
              <span class="font-medium text-primary-600">{{ binInfo.pos?.name || 'Auto-selected' }}</span>
            </div>
          </div>
        </div>

        <!-- Result -->
        <div v-if="result" class="bg-white rounded-xl shadow-lg p-6 border-2" :class="result.success ? 'border-green-200' : 'border-red-200'">
          <div :class="['flex items-center gap-3 mb-4', result.success ? 'text-green-600' : 'text-red-600']">
            <span class="material-icons text-4xl">{{ result.success ? 'check_circle' : 'cancel' }}</span>
            <div>
              <span class="font-semibold text-xl block">{{ result.success ? 'Payment Successful' : 'Payment Failed' }}</span>
              <span v-if="result.message" class="text-sm opacity-80">{{ result.message }}</span>
            </div>
          </div>
          <div class="space-y-2 text-sm bg-gray-50 rounded-lg p-4">
            <div v-if="result.transactionId" class="flex justify-between">
              <span class="text-gray-600">Transaction ID</span>
              <span class="font-mono font-medium">{{ result.transactionId }}</span>
            </div>
            <div v-if="result.amount" class="flex justify-between">
              <span class="text-gray-600">Amount</span>
              <span class="font-medium">{{ result.amount }} {{ result.currency }}</span>
            </div>
            <div v-if="result.authCode" class="flex justify-between">
              <span class="text-gray-600">Auth Code</span>
              <span class="font-mono">{{ result.authCode }}</span>
            </div>
          </div>
          <button @click="resetForm" class="mt-4 w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors">
            New Payment
          </button>
        </div>

        <!-- API Response (Debug) -->
        <details v-if="binInfo || result" class="bg-gray-100 rounded-xl">
          <summary class="p-4 cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            <span class="ml-2">Debug: API Response</span>
          </summary>
          <pre class="p-4 text-xs overflow-auto max-h-60 bg-gray-800 text-green-400 rounded-b-xl">{{ JSON.stringify(binInfo || result, null, 2) }}</pre>
        </details>
      </div>
    </div>

    <!-- 3D Secure iFrame Modal -->
    <div v-if="showIframe" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div class="p-4 border-b flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="material-icons text-primary-500">security</span>
            <h3 class="font-semibold">3D Secure Verification</h3>
          </div>
          <button @click="showIframe = false" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <span class="material-icons">close</span>
          </button>
        </div>
        <iframe
          :src="iframeUrl"
          class="w-full h-[500px] border-0"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  </div>
</template>
