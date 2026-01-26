<script setup>
import { ref, onMounted, computed } from 'vue';
import { usePaymentStore } from '@/stores/payment';
import { useAuthStore } from '@/stores/auth';
import { usePartnerStore } from '@/stores/partner';

const store = usePaymentStore();
const authStore = useAuthStore();
const partnerStore = usePartnerStore();

// Platform view mi? (Partner seçilmemişse platform view)
const isPlatformView = computed(() => authStore.isPlatformAdmin && !partnerStore.hasSelectedPartner);

const pagination = ref({ page: 1, limit: 20, total: 0, pages: 0 });
const filters = ref({ status: '', currency: '', orderId: '', startDate: '', endDate: '', pos: '', minAmount: '', maxAmount: '' });
const selectedTransaction = ref(null);
const loadingDetail = ref(false);
const activeLogTab = ref(0);
const filterPosList = ref([]);
const processingAction = ref(false);
const actionMessage = ref({ show: false, success: false, text: '' });

onMounted(async () => {
  const [, , posList] = await Promise.all([
    fetchTransactions(),
    store.fetchStats(),
    store.fetchFilterPosList()
  ]);
  filterPosList.value = posList || [];
});

async function fetchTransactions() {
  const params = {
    page: pagination.value.page,
    limit: pagination.value.limit,
    ...filters.value
  };

  // Partner view ise sadece o partner'ın işlemlerini getir
  if (!isPlatformView.value && partnerStore.selectedPartner?._id) {
    params.partnerId = partnerStore.selectedPartner._id;
  }

  const result = await store.fetchTransactions(params);
  if (result) {
    pagination.value = result.pagination;
  }
}

function getStatusBadge(status) {
  const badges = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    processing: 'bg-blue-100 text-blue-800 border-blue-300',
    success: 'bg-green-100 text-green-800 border-green-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
    refunded: 'bg-purple-100 text-purple-800 border-purple-300'
  };
  return badges[status] || 'bg-gray-100 text-gray-800 border-gray-300';
}

function getStatusIcon(status) {
  const icons = {
    pending: 'schedule',
    processing: 'sync',
    success: 'check_circle',
    failed: 'cancel',
    cancelled: 'block',
    refunded: 'undo'
  };
  return icons[status] || 'help';
}

function formatDate(date) {
  return new Date(date).toLocaleString('tr-TR');
}

function formatAmount(amount, currency) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
}

function maskCardNumber(number) {
  if (!number) return '****';
  return '**** **** **** ' + number.slice(-4);
}

async function changePage(page) {
  pagination.value.page = page;
  await fetchTransactions();
}

async function applyFilters() {
  pagination.value.page = 1;
  await fetchTransactions();
}

async function clearFilters() {
  filters.value = { status: '', currency: '', orderId: '', startDate: '', endDate: '', pos: '', minAmount: '', maxAmount: '' };
  pagination.value.page = 1;
  await fetchTransactions();
}

async function showTransactionDetail(tx) {
  loadingDetail.value = true;
  activeLogTab.value = 0;
  try {
    const result = await store.getTransaction(tx._id);
    selectedTransaction.value = result.transaction || result;
  } catch (e) {
    console.error('Failed to fetch transaction details:', e);
    selectedTransaction.value = tx;
  } finally {
    loadingDetail.value = false;
  }
}

function getLogTypeBadge(type) {
  const badges = {
    init: 'bg-blue-500 text-white',
    '3d_form': 'bg-purple-500 text-white',
    '3d_redirect': 'bg-purple-500 text-white',
    '3d_callback': 'bg-amber-500 text-white',
    provision: 'bg-green-500 text-white',
    refund: 'bg-orange-500 text-white',
    cancel: 'bg-red-400 text-white',
    status: 'bg-cyan-500 text-white',
    pre_auth: 'bg-indigo-500 text-white',
    post_auth: 'bg-teal-500 text-white',
    error: 'bg-red-500 text-white'
  };
  return badges[type] || 'bg-gray-500 text-white';
}

function getLogTypeIcon(type) {
  const icons = {
    init: 'play_circle',
    '3d_form': 'launch',
    '3d_redirect': 'launch',
    '3d_callback': 'keyboard_return',
    provision: 'payments',
    refund: 'undo',
    cancel: 'cancel',
    status: 'info',
    pre_auth: 'lock',
    post_auth: 'lock_open',
    error: 'error'
  };
  return icons[type] || 'article';
}

function getLogTypeName(type) {
  const names = {
    init: 'Initialize',
    '3d_form': '3D Redirect',
    '3d_redirect': '3D Redirect',
    '3d_callback': '3D Callback',
    provision: 'Provision',
    refund: 'Refund',
    cancel: 'Cancel',
    status: 'Status',
    pre_auth: 'Pre-Auth',
    post_auth: 'Post-Auth',
    error: 'Error'
  };
  return names[type] || type;
}

function formatLogDate(date) {
  return new Date(date).toLocaleString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
}

// Get current stage based on logs
function getCurrentStage(tx) {
  if (!tx.logs || tx.logs.length === 0) return { stage: 'pending', text: 'Bekliyor', icon: 'hourglass_empty' };

  const lastLog = tx.logs[tx.logs.length - 1];
  const stages = {
    init: { stage: 'init', text: 'Hazırlanıyor', icon: 'settings' },
    '3d_form': { stage: '3d_form', text: '3D Yönlendirme', icon: 'launch' },
    '3d_callback': { stage: '3d_callback', text: '3D Dönüş', icon: 'keyboard_return' },
    provision: { stage: 'provision', text: 'Provizyon', icon: 'payments' },
    error: { stage: 'error', text: 'Hata', icon: 'error' }
  };

  return stages[lastLog.type] || { stage: 'unknown', text: lastLog.type, icon: 'help' };
}

// Get order ID from transaction (bankaya gönderilen OrderId)
function getOrderId(tx) {
  if (tx.logs && tx.logs.length > 0) {
    // 3D Redirect'te bankaya gönderilen OrderId
    const redirectLog = tx.logs.find(l => l.type === '3d_redirect' || l.type === '3d_form');
    if (redirectLog?.response?.OrderId) return redirectLog.response.OrderId;
    if (redirectLog?.response?.orderId) return redirectLog.response.orderId;
    if (redirectLog?.response?.orderid) return redirectLog.response.orderid;
    if (redirectLog?.response?.oid) return redirectLog.response.oid;

    // Init log'da orderId
    const initLog = tx.logs.find(l => l.type === 'init');
    if (initLog?.request?.orderId) return initLog.request.orderId;
    if (initLog?.request?.OrderId) return initLog.request.OrderId;

    // Callback'te dönen OrderId
    const callbackLog = tx.logs.find(l => l.type === '3d_callback');
    if (callbackLog?.request?.OrderId) return callbackLog.request.OrderId;
  }
  return '-';
}

// Syntax highlight JSON
function syntaxHighlight(json) {
  if (json === null || json === undefined) {
    return '<span class="text-gray-500 italic">No data</span>';
  }

  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2);
  }

  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'text-amber-600'; // number
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'text-blue-600 font-medium'; // key
        match = match.replace(/"/g, '');
        match = '"' + match;
      } else {
        cls = 'text-green-600'; // string
      }
    } else if (/true|false/.test(match)) {
      cls = 'text-purple-600'; // boolean
    } else if (/null/.test(match)) {
      cls = 'text-gray-400'; // null
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

// Progress steps
const progressSteps = [
  { key: 'init', label: 'Init', icon: 'play_circle' },
  { key: '3d_form', label: '3D Form', icon: 'launch' },
  { key: '3d_callback', label: 'Callback', icon: 'keyboard_return' },
  { key: 'provision', label: 'Provision', icon: 'payments' }
];

function getStepStatus(tx, stepKey) {
  if (!tx.logs) return 'pending';
  const hasStep = tx.logs.some(l => l.type === stepKey);
  const stepIndex = progressSteps.findIndex(s => s.key === stepKey);
  const lastLogType = tx.logs[tx.logs.length - 1]?.type;
  const lastIndex = progressSteps.findIndex(s => s.key === lastLogType);

  if (hasStep) return 'completed';
  if (stepIndex <= lastIndex) return 'completed';
  return 'pending';
}

// Copy to clipboard
async function copyToClipboard(data) {
  try {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

// Check if transaction can be refunded
function canRefund(tx) {
  return tx.type === 'payment' && tx.status === 'success' && !tx.refundedAt;
}

// Check if transaction can be cancelled (same day only)
function canCancel(tx) {
  if (tx.type !== 'payment' || tx.status !== 'success') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const txDate = new Date(tx.createdAt);
  txDate.setHours(0, 0, 0, 0);
  return txDate.getTime() === today.getTime();
}

// Refund transaction
async function refundTransaction() {
  if (!selectedTransaction.value || processingAction.value) return;

  if (!confirm('Bu işlemi iade etmek istediğinize emin misiniz?')) return;

  processingAction.value = true;
  actionMessage.value = { show: false, success: false, text: '' };

  try {
    const result = await store.refundPayment(selectedTransaction.value._id);
    actionMessage.value = { show: true, success: true, text: 'İade işlemi başarılı!' };

    // Refresh transaction detail
    const updated = await store.getTransaction(selectedTransaction.value._id);
    selectedTransaction.value = updated.transaction || updated;

    // Refresh list
    await fetchTransactions();
  } catch (error) {
    actionMessage.value = {
      show: true,
      success: false,
      text: error.response?.data?.error || error.message || 'İade işlemi başarısız!'
    };
  } finally {
    processingAction.value = false;
    setTimeout(() => { actionMessage.value.show = false; }, 5000);
  }
}

// Cancel transaction
async function cancelTransaction() {
  if (!selectedTransaction.value || processingAction.value) return;

  if (!confirm('Bu işlemi iptal etmek istediğinize emin misiniz?')) return;

  processingAction.value = true;
  actionMessage.value = { show: false, success: false, text: '' };

  try {
    const result = await store.cancelPayment(selectedTransaction.value._id);
    actionMessage.value = { show: true, success: true, text: 'İptal işlemi başarılı!' };

    // Refresh transaction detail
    const updated = await store.getTransaction(selectedTransaction.value._id);
    selectedTransaction.value = updated.transaction || updated;

    // Refresh list
    await fetchTransactions();
  } catch (error) {
    actionMessage.value = {
      show: true,
      success: false,
      text: error.response?.data?.error || error.message || 'İptal işlemi başarısız!'
    };
  } finally {
    processingAction.value = false;
    setTimeout(() => { actionMessage.value.show = false; }, 5000);
  }
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Transactions</h2>

    <!-- Stats -->
    <div v-if="store.stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span class="material-icons text-blue-600 dark:text-blue-400">receipt_long</span>
          </div>
          <div>
            <div class="text-sm text-gray-500 dark:text-slate-400">Today's Transactions</div>
            <div class="text-2xl font-bold text-gray-800 dark:text-white">
              {{ store.stats.today?.reduce((a, b) => a + b.count, 0) || 0 }}
            </div>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span class="material-icons text-green-600 dark:text-green-400">check_circle</span>
          </div>
          <div>
            <div class="text-sm text-gray-500 dark:text-slate-400">Successful</div>
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ store.stats.today?.find(s => s._id === 'success')?.count || 0 }}
            </div>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span class="material-icons text-red-600 dark:text-red-400">cancel</span>
          </div>
          <div>
            <div class="text-sm text-gray-500 dark:text-slate-400">Failed</div>
            <div class="text-2xl font-bold text-red-600 dark:text-red-400">
              {{ store.stats.today?.find(s => s._id === 'failed')?.count || 0 }}
            </div>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <span class="material-icons text-purple-600 dark:text-purple-400">currency_exchange</span>
          </div>
          <div>
            <div class="text-sm text-gray-500 dark:text-slate-400">Currencies</div>
            <div class="text-2xl font-bold text-gray-800 dark:text-white">
              {{ store.stats.byCurrency?.length || 0 }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-5 mb-6">
      <div class="flex flex-wrap gap-4 items-end">
        <!-- Order ID Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Order ID</label>
          <input v-model="filters.orderId" type="text" placeholder="ORS_ABC123..."
            class="px-4 py-2.5 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-44" />
        </div>

        <!-- POS Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">POS</label>
          <select v-model="filters.pos"
            class="px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 dark:text-white w-48">
            <option value="">Tümü</option>
            <option v-for="pos in filterPosList" :key="pos._id" :value="pos._id">
              {{ pos.name }}{{ !pos.isActive ? ' (Pasif)' : '' }}
            </option>
          </select>
        </div>

        <!-- Amount Range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Min Tutar</label>
          <input v-model="filters.minAmount" type="number" placeholder="0" min="0" step="0.01"
            class="px-4 py-2.5 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-28" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Max Tutar</label>
          <input v-model="filters.maxAmount" type="number" placeholder="0" min="0" step="0.01"
            class="px-4 py-2.5 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-28" />
        </div>

        <!-- Date Range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Başlangıç</label>
          <input v-model="filters.startDate" type="date"
            class="px-4 py-2.5 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Bitiş</label>
          <input v-model="filters.endDate" type="date"
            class="px-4 py-2.5 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Durum</label>
          <select v-model="filters.status"
            class="px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 dark:text-white">
            <option value="">Tümü</option>
            <option value="pending">Bekliyor</option>
            <option value="processing">İşleniyor</option>
            <option value="success">Başarılı</option>
            <option value="failed">Başarısız</option>
            <option value="cancelled">İptal Edildi</option>
            <option value="refunded">İade Edildi</option>
          </select>
        </div>

        <!-- Currency -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Para Birimi</label>
          <select v-model="filters.currency"
            class="px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 dark:text-white">
            <option value="">Tümü</option>
            <option value="try">TRY</option>
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
          </select>
        </div>

        <!-- Filter Button -->
        <button @click="applyFilters"
          class="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors flex items-center gap-2">
          <span class="material-icons text-sm">filter_list</span>
          Filtrele
        </button>

        <!-- Clear Button -->
        <button @click="clearFilters"
          class="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 font-medium transition-colors flex items-center gap-2">
          <span class="material-icons text-sm">clear</span>
          Temizle
        </button>
      </div>
    </div>

    <!-- Transaction List -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-slate-900 border-b dark:border-slate-700">
          <tr>
            <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Date</th>
            <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Order ID</th>
            <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Card</th>
            <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Amount</th>
            <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Currency</th>
            <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Bank</th>
            <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Stage</th>
            <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
            <th class="px-4 py-4"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
          <tr v-for="tx in store.transactions" :key="tx._id"
              class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
              @click="showTransactionDetail(tx)">
            <td class="px-4 py-4 text-sm text-gray-600 dark:text-slate-300">
              <div class="flex items-center gap-2">
                <span class="material-icons text-gray-400 dark:text-slate-500 text-sm">schedule</span>
                {{ formatDate(tx.createdAt) }}
              </div>
            </td>
            <td class="px-4 py-4">
              <code class="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded font-mono text-gray-700 dark:text-slate-300">
                {{ getOrderId(tx) }}
              </code>
            </td>
            <td class="px-4 py-4 text-sm font-mono text-gray-700 dark:text-slate-300 relative group">
              <div class="cursor-pointer">
                {{ maskCardNumber(tx.card?.maskedNumber) }}
              </div>
              <!-- Card Info Popover -->
              <div v-if="tx.card" class="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
                <div class="bg-gray-900 text-white rounded-lg shadow-xl p-4 min-w-64 text-sm">
                  <div class="font-semibold mb-3 border-b border-gray-700 pb-2">Kart Bilgileri</div>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-gray-400">Kart No:</span>
                      <span class="font-mono">{{ maskCardNumber(tx.card.maskedNumber) }}</span>
                    </div>
                    <div v-if="tx.card.cardFamily" class="flex justify-between">
                      <span class="text-gray-400">Kart Ailesi:</span>
                      <span class="capitalize">{{ tx.card.cardFamily }}</span>
                    </div>
                    <div v-if="tx.card.cardType" class="flex justify-between">
                      <span class="text-gray-400">Kart Tipi:</span>
                      <span class="capitalize">{{ tx.card.cardType }}</span>
                    </div>
                    <div v-if="tx.card.cardBrand" class="flex justify-between">
                      <span class="text-gray-400">Kart Markası:</span>
                      <span class="uppercase">{{ tx.card.cardBrand }}</span>
                    </div>
                    <div v-if="tx.card.bankName" class="flex justify-between">
                      <span class="text-gray-400">Banka:</span>
                      <span>{{ tx.card.bankName }}</span>
                    </div>
                    <div v-if="tx.card.country" class="flex justify-between">
                      <span class="text-gray-400">Ülke:</span>
                      <span>{{ tx.card.country }}</span>
                    </div>
                    <div v-if="tx.card.isCommercial !== undefined" class="flex justify-between">
                      <span class="text-gray-400">Ticari Kart:</span>
                      <span :class="tx.card.isCommercial ? 'text-green-400' : 'text-gray-400'">
                        {{ tx.card.isCommercial ? 'Evet' : 'Hayır' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
            <td class="px-4 py-4">
              <div class="font-semibold text-gray-800 dark:text-white">{{ formatAmount(tx.amount, tx.currency) }}</div>
              <div v-if="tx.installment > 1" class="text-xs text-gray-500 dark:text-slate-400">
                {{ tx.installment }} taksit
              </div>
            </td>
            <td class="px-4 py-4 text-sm text-gray-600 dark:text-slate-300 font-medium">
              {{ tx.currency?.toUpperCase() || '-' }}
            </td>
            <td class="px-4 py-4 text-sm text-gray-600 dark:text-slate-300">
              {{ tx.pos?.bank?.name || tx.pos?.name || '-' }}
            </td>
            <td class="px-4 py-4">
              <div class="flex items-center gap-1.5">
                <span class="material-icons text-sm" :class="{
                  'text-blue-500': getCurrentStage(tx).stage === 'init',
                  'text-purple-500': getCurrentStage(tx).stage === '3d_form',
                  'text-amber-500': getCurrentStage(tx).stage === '3d_callback',
                  'text-green-500': getCurrentStage(tx).stage === 'provision',
                  'text-red-500': getCurrentStage(tx).stage === 'error',
                  'text-gray-400 dark:text-slate-500': getCurrentStage(tx).stage === 'pending'
                }">{{ getCurrentStage(tx).icon }}</span>
                <span class="text-sm text-gray-600 dark:text-slate-300">{{ getCurrentStage(tx).text }}</span>
              </div>
            </td>
            <td class="px-4 py-4">
              <span :class="['inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium border', getStatusBadge(tx.status)]">
                <span class="material-icons text-xs">{{ getStatusIcon(tx.status) }}</span>
                {{ tx.status }}
              </span>
            </td>
            <td class="px-4 py-4 text-right">
              <button @click.stop="showTransactionDetail(tx)"
                class="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-1">
                <span class="material-icons text-sm">visibility</span>
                Details
              </button>
            </td>
          </tr>

          <tr v-if="store.transactions.length === 0">
            <td colspan="9" class="px-4 py-16 text-center">
              <div class="flex flex-col items-center gap-3">
                <span class="material-icons text-5xl text-gray-300 dark:text-slate-600">receipt_long</span>
                <span class="text-gray-500 dark:text-slate-400">No transactions found</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="px-4 py-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex items-center justify-between">
        <div class="text-sm text-gray-600 dark:text-slate-400">
          Showing <span class="font-medium">{{ (pagination.page - 1) * pagination.limit + 1 }}</span> to
          <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span> of
          <span class="font-medium">{{ pagination.total }}</span> results
        </div>
        <div class="flex gap-1">
          <button
            v-for="p in pagination.pages"
            :key="p"
            @click="changePage(p)"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
              pagination.page === p
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-700 border dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300'
            ]"
          >
            {{ p }}
          </button>
        </div>
      </div>
    </div>

    <!-- Transaction Detail Modal - Much Bigger -->
    <div v-if="selectedTransaction"
         class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
         @click.self="selectedTransaction = null">
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="{
              'bg-green-100 dark:bg-green-900/30': selectedTransaction.status === 'success',
              'bg-red-100 dark:bg-red-900/30': selectedTransaction.status === 'failed',
              'bg-blue-100 dark:bg-blue-900/30': selectedTransaction.status === 'processing',
              'bg-yellow-100 dark:bg-yellow-900/30': selectedTransaction.status === 'pending',
              'bg-gray-100 dark:bg-slate-700': selectedTransaction.status === 'cancelled',
              'bg-purple-100 dark:bg-purple-900/30': selectedTransaction.status === 'refunded'
            }">
              <span class="material-icons" :class="{
                'text-green-600 dark:text-green-400': selectedTransaction.status === 'success',
                'text-red-600 dark:text-red-400': selectedTransaction.status === 'failed',
                'text-blue-600 dark:text-blue-400': selectedTransaction.status === 'processing',
                'text-yellow-600 dark:text-yellow-400': selectedTransaction.status === 'pending',
                'text-gray-600 dark:text-slate-400': selectedTransaction.status === 'cancelled',
                'text-purple-600 dark:text-purple-400': selectedTransaction.status === 'refunded'
              }">{{ getStatusIcon(selectedTransaction.status) }}</span>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-800 dark:text-white">Transaction Details</h3>
              <p class="text-sm text-gray-500 dark:text-slate-400 font-mono">{{ selectedTransaction._id }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- Action Buttons -->
            <button v-if="canCancel(selectedTransaction)"
                    @click="cancelTransaction"
                    :disabled="processingAction"
                    class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors">
              <span class="material-icons text-sm">block</span>
              İptal Et
            </button>
            <button v-if="canRefund(selectedTransaction)"
                    @click="refundTransaction"
                    :disabled="processingAction"
                    class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors">
              <span class="material-icons text-sm">undo</span>
              İade Et
            </button>
            <button @click="selectedTransaction = null"
                    class="w-10 h-10 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
              <span class="material-icons text-gray-500 dark:text-slate-400">close</span>
            </button>
          </div>
        </div>

        <!-- Action Message -->
        <div v-if="actionMessage.show"
             class="mx-6 mt-4 p-4 rounded-lg flex items-center gap-3"
             :class="actionMessage.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'">
          <span class="material-icons" :class="actionMessage.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
            {{ actionMessage.success ? 'check_circle' : 'error' }}
          </span>
          <span :class="actionMessage.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'">
            {{ actionMessage.text }}
          </span>
        </div>

        <!-- Modal Body -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Progress Steps -->
          <div class="mb-8">
            <div class="flex items-center justify-between relative">
              <div class="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-slate-700 -z-10"></div>
              <div v-for="(step, idx) in progressSteps" :key="step.key"
                   class="flex flex-col items-center">
                <div :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                  getStepStatus(selectedTransaction, step.key) === 'completed'
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500'
                ]">
                  <span class="material-icons text-sm">{{ step.icon }}</span>
                </div>
                <span class="text-xs font-medium mt-2" :class="
                  getStepStatus(selectedTransaction, step.key) === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'
                ">{{ step.label }}</span>
              </div>
            </div>
          </div>

          <!-- Transaction Info Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
              <label class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Order ID</label>
              <div class="font-mono text-sm mt-1 font-medium dark:text-white">{{ getOrderId(selectedTransaction) }}</div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
              <label class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amount</label>
              <div class="text-lg font-bold mt-1 dark:text-white">{{ formatAmount(selectedTransaction.amount, selectedTransaction.currency) }}</div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
              <label class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Installment</label>
              <div class="font-semibold mt-1 dark:text-white">{{ selectedTransaction.installment || 1 }} Taksit</div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
              <label class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</label>
              <div class="mt-1">
                <span :class="['inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium border', getStatusBadge(selectedTransaction.status)]">
                  <span class="material-icons text-xs">{{ getStatusIcon(selectedTransaction.status) }}</span>
                  {{ selectedTransaction.status }}
                </span>
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
              <label class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Card</label>
              <div class="font-mono mt-1 dark:text-white">{{ maskCardNumber(selectedTransaction.card?.maskedNumber) }}</div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
              <label class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">POS</label>
              <div class="font-medium mt-1 dark:text-white">{{ selectedTransaction.pos?.name || '-' }}</div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
              <label class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Created</label>
              <div class="text-sm mt-1 dark:text-white">{{ formatDate(selectedTransaction.createdAt) }}</div>
            </div>
            <div v-if="selectedTransaction.completedAt" class="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
              <label class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Completed</label>
              <div class="text-sm mt-1 dark:text-white">{{ formatDate(selectedTransaction.completedAt) }}</div>
            </div>
          </div>

          <!-- Result -->
          <div v-if="selectedTransaction.result"
               class="mb-8 rounded-xl p-5 border-2"
               :class="selectedTransaction.result.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'">
            <div class="flex items-start gap-3">
              <div :class="[
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                selectedTransaction.result.success ? 'bg-green-200 dark:bg-green-800' : 'bg-red-200 dark:bg-red-800'
              ]">
                <span class="material-icons" :class="selectedTransaction.result.success ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'">
                  {{ selectedTransaction.result.success ? 'check_circle' : 'error' }}
                </span>
              </div>
              <div class="flex-1">
                <h4 class="font-semibold" :class="selectedTransaction.result.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'">
                  {{ selectedTransaction.result.success ? 'Payment Successful' : 'Payment Failed' }}
                </h4>
                <p class="mt-1" :class="selectedTransaction.result.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
                  <span v-if="selectedTransaction.result.code" class="font-mono bg-white/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded mr-2">[{{ selectedTransaction.result.code }}]</span>
                  {{ selectedTransaction.result.message }}
                </p>
                <div v-if="selectedTransaction.result.authCode || selectedTransaction.result.refNumber"
                     class="mt-3 flex gap-4 text-sm">
                  <div v-if="selectedTransaction.result.authCode">
                    <span class="text-green-600">Auth Code:</span>
                    <code class="ml-1 font-mono bg-white/50 px-1.5 py-0.5 rounded">{{ selectedTransaction.result.authCode }}</code>
                  </div>
                  <div v-if="selectedTransaction.result.refNumber">
                    <span class="text-green-600">Ref Number:</span>
                    <code class="ml-1 font-mono bg-white/50 px-1.5 py-0.5 rounded">{{ selectedTransaction.result.refNumber }}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Logs with Tabs -->
          <div v-if="selectedTransaction.logs?.length" class="mt-6">
            <h4 class="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <span class="material-icons text-gray-400 dark:text-slate-500">article</span>
              Transaction Logs
            </h4>

            <!-- Log Tabs -->
            <div class="border-b dark:border-slate-700 mb-4">
              <div class="flex gap-1">
                <button v-for="(log, idx) in selectedTransaction.logs" :key="idx"
                        @click="activeLogTab = idx"
                        :class="[
                          'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 border-b-2 -mb-px',
                          activeLogTab === idx
                            ? 'bg-white dark:bg-slate-800 border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white border-transparent hover:bg-gray-50 dark:hover:bg-slate-700'
                        ]">
                  <span :class="['w-6 h-6 rounded flex items-center justify-center text-xs', getLogTypeBadge(log.type)]">
                    <span class="material-icons text-xs">{{ getLogTypeIcon(log.type) }}</span>
                  </span>
                  {{ getLogTypeName(log.type) }}
                </button>
              </div>
            </div>

            <!-- Active Log Content -->
            <div v-if="selectedTransaction.logs[activeLogTab]" class="bg-gray-900 rounded-xl overflow-hidden">
              <div class="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
                <div class="flex items-center gap-2">
                  <span :class="['px-2.5 py-1 rounded text-xs font-medium', getLogTypeBadge(selectedTransaction.logs[activeLogTab].type)]">
                    {{ getLogTypeName(selectedTransaction.logs[activeLogTab].type) }}
                  </span>
                  <span class="text-gray-400 text-sm">{{ formatLogDate(selectedTransaction.logs[activeLogTab].at) }}</span>
                </div>
              </div>

              <div class="grid md:grid-cols-2 divide-x divide-gray-700">
                <!-- Request -->
                <div class="p-4">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span class="material-icons text-blue-400 text-sm">upload</span>
                      <span class="text-blue-400 font-medium text-sm uppercase tracking-wider">Request</span>
                    </div>
                    <button @click="copyToClipboard(selectedTransaction.logs[activeLogTab].request)"
                            class="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            title="Kopyala">
                      <span class="material-icons text-sm">content_copy</span>
                    </button>
                  </div>
                  <pre class="text-sm font-mono leading-relaxed overflow-x-auto max-h-96 text-gray-300"
                       v-html="syntaxHighlight(selectedTransaction.logs[activeLogTab].request)"></pre>
                </div>

                <!-- Response -->
                <div class="p-4">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span class="material-icons text-green-400 text-sm">download</span>
                      <span class="text-green-400 font-medium text-sm uppercase tracking-wider">Response</span>
                    </div>
                    <button @click="copyToClipboard(selectedTransaction.logs[activeLogTab].response)"
                            class="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            title="Kopyala">
                      <span class="material-icons text-sm">content_copy</span>
                    </button>
                  </div>
                  <pre class="text-sm font-mono leading-relaxed overflow-x-auto max-h-96 text-gray-300"
                       v-html="syntaxHighlight(selectedTransaction.logs[activeLogTab].response)"></pre>
                </div>
              </div>

              <!-- Decrypted Data (3D Callback için) -->
              <div v-if="selectedTransaction.logs[activeLogTab].type === '3d_callback' && selectedTransaction.secure?.decrypted"
                   class="border-t border-gray-700 p-4">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-amber-400 text-sm">lock_open</span>
                    <span class="text-amber-400 font-medium text-sm uppercase tracking-wider">Decrypted Data</span>
                  </div>
                  <button @click="copyToClipboard(selectedTransaction.secure.decrypted)"
                          class="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                          title="Kopyala">
                    <span class="material-icons text-sm">content_copy</span>
                  </button>
                </div>
                <pre class="text-sm font-mono leading-relaxed overflow-x-auto max-h-96 text-gray-300"
                     v-html="syntaxHighlight(selectedTransaction.secure.decrypted)"></pre>
              </div>
            </div>
          </div>

          <!-- Child Transactions (Refunds/Cancels) -->
          <div v-if="selectedTransaction.childTransactions?.length" class="mt-8">
            <h4 class="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <span class="material-icons text-gray-400 dark:text-slate-500">account_tree</span>
              İlişkili İşlemler
            </h4>

            <div class="space-y-4">
              <div v-for="child in selectedTransaction.childTransactions" :key="child._id"
                   class="border dark:border-slate-700 rounded-xl overflow-hidden">
                <!-- Child Header -->
                <div class="bg-gray-50 dark:bg-slate-700 px-4 py-3 flex items-center justify-between border-b dark:border-slate-600">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="{
                      'bg-orange-100 dark:bg-orange-900/30': child.type === 'refund',
                      'bg-gray-200 dark:bg-slate-600': child.type === 'cancel'
                    }">
                      <span class="material-icons text-sm" :class="{
                        'text-orange-600 dark:text-orange-400': child.type === 'refund',
                        'text-gray-600 dark:text-slate-300': child.type === 'cancel'
                      }">{{ child.type === 'refund' ? 'undo' : 'block' }}</span>
                    </div>
                    <div>
                      <div class="font-semibold text-gray-800 dark:text-white">
                        {{ child.type === 'refund' ? 'İade' : 'İptal' }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-slate-400">{{ formatDate(child.createdAt) }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="font-semibold dark:text-white">{{ formatAmount(child.amount, selectedTransaction.currency) }}</span>
                    <span :class="['px-2.5 py-1 text-xs rounded-full font-medium border', getStatusBadge(child.status)]">
                      {{ child.status }}
                    </span>
                  </div>
                </div>

                <!-- Child Result -->
                <div v-if="child.result" class="px-4 py-3" :class="child.result.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-sm" :class="child.result.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                      {{ child.result.success ? 'check_circle' : 'error' }}
                    </span>
                    <span :class="child.result.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'">
                      <span v-if="child.result.code" class="font-mono text-xs bg-white/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded mr-2">[{{ child.result.code }}]</span>
                      {{ child.result.message }}
                    </span>
                  </div>
                </div>

                <!-- Child Logs -->
                <div v-if="child.logs?.length" class="border-t dark:border-slate-700">
                  <details class="group">
                    <summary class="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center justify-between">
                      <span class="text-sm font-medium text-gray-600 dark:text-slate-300 flex items-center gap-2">
                        <span class="material-icons text-sm text-gray-400 dark:text-slate-500">article</span>
                        {{ child.logs.length }} Log Kaydı
                      </span>
                      <span class="material-icons text-gray-400 dark:text-slate-500 group-open:rotate-180 transition-transform">expand_more</span>
                    </summary>
                    <div class="bg-gray-900 p-4 text-sm">
                      <div v-for="(log, idx) in child.logs" :key="idx" class="mb-4 last:mb-0">
                        <div class="flex items-center gap-2 mb-2">
                          <span :class="['px-2 py-0.5 rounded text-xs font-medium', getLogTypeBadge(log.type)]">
                            {{ getLogTypeName(log.type) }}
                          </span>
                          <span class="text-gray-500 text-xs">{{ formatLogDate(log.at) }}</span>
                        </div>
                        <div class="grid md:grid-cols-2 gap-4">
                          <div>
                            <div class="text-blue-400 text-xs mb-1 uppercase">Request</div>
                            <pre class="text-xs font-mono text-gray-300 overflow-x-auto max-h-40" v-html="syntaxHighlight(log.request)"></pre>
                          </div>
                          <div>
                            <div class="text-green-400 text-xs mb-1 uppercase">Response</div>
                            <pre class="text-xs font-mono text-gray-300 overflow-x-auto max-h-40" v-html="syntaxHighlight(log.response)"></pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="loadingDetail" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            <p class="mt-3 text-gray-500 dark:text-slate-400">Loading transaction details...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
pre {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
