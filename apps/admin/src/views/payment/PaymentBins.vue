<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { binApi } from '@/services/virtualPosService';

// State
const bins = ref([]);
const stats = ref(null);
const banks = ref([]);
const families = ref([]);
const loading = ref(false);
const searchInput = ref('');
const searchResults = ref([]);
const showSearchResults = ref(false);
const pagination = ref({ page: 1, limit: 50, total: 0, pages: 0 });
const filters = ref({ brand: '', type: '', bank: '', family: '', country: '' });

// Modal state
const showModal = ref(false);
const editingBin = ref(null);
const formData = ref({
  bin: '',
  brand: 'visa',
  type: 'credit',
  family: '',
  bank: '',
  bankCode: '',
  country: 'TR',
  notes: ''
});
const saving = ref(false);

// Card brands
const cardBrands = [
  { value: 'visa', label: 'Visa', color: 'bg-blue-500' },
  { value: 'mastercard', label: 'Mastercard', color: 'bg-red-500' },
  { value: 'amex', label: 'American Express', color: 'bg-indigo-500' },
  { value: 'troy', label: 'Troy', color: 'bg-teal-500' },
  { value: 'discover', label: 'Discover', color: 'bg-orange-500' },
  { value: 'mir', label: 'MIR', color: 'bg-green-500' },
  { value: 'unionpay', label: 'UnionPay', color: 'bg-red-600' },
  { value: 'other', label: 'Diğer', color: 'bg-gray-500' }
];

const cardTypes = [
  { value: 'credit', label: 'Kredi Kartı', icon: 'credit_card' },
  { value: 'debit', label: 'Banka Kartı', icon: 'account_balance' },
  { value: 'prepaid', label: 'Ön Ödemeli', icon: 'card_giftcard' }
];

// Fetch data
async function fetchBins() {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...filters.value
    };
    // Remove empty filters
    Object.keys(params).forEach(key => {
      if (params[key] === '') delete params[key];
    });

    const res = await binApi.list(params);
    bins.value = res.data.bins || [];
    pagination.value = res.data.pagination || pagination.value;
  } catch (e) {
    console.error('Failed to fetch bins:', e);
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    const res = await binApi.getStats();
    stats.value = res.data.stats;
  } catch (e) {
    console.error('Failed to fetch stats:', e);
  }
}

async function fetchBanks() {
  try {
    const res = await binApi.getBanks();
    banks.value = res.data.banks || [];
  } catch (e) {
    console.error('Failed to fetch banks:', e);
  }
}

async function fetchFamilies() {
  try {
    const res = await binApi.getFamilies();
    families.value = res.data.families || [];
  } catch (e) {
    console.error('Failed to fetch families:', e);
  }
}

// Real-time search
let searchTimeout = null;
const searchLoading = ref(false);

watch(searchInput, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout);

  if (!val || val.length < 4) {
    searchResults.value = [];
    showSearchResults.value = false;
    return;
  }

  searchTimeout = setTimeout(async () => {
    searchLoading.value = true;
    try {
      // First try local search
      const res = await binApi.search(val);
      searchResults.value = res.data.bins || [];

      // If 6+ digits and no results, try lookup (auto-fetch from external sources)
      if (val.length >= 6 && searchResults.value.length === 0) {
        try {
          const lookupRes = await binApi.lookup(val);
          if (lookupRes.data.bin) {
            searchResults.value = [lookupRes.data.bin];
            // Refresh stats and lists
            fetchStats();
            fetchBanks();
            fetchFamilies();
          }
        } catch (lookupError) {
          console.log('Lookup failed:', lookupError.message);
        }
      }

      showSearchResults.value = true;
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      searchLoading.value = false;
    }
  }, 300);
});

function selectSearchResult(bin) {
  searchInput.value = bin.bin;
  showSearchResults.value = false;
  openEditModal(bin);
}

function clearSearch() {
  searchInput.value = '';
  searchResults.value = [];
  showSearchResults.value = false;
}

// Pagination
async function changePage(page) {
  pagination.value.page = page;
  await fetchBins();
}

// Filters
async function applyFilters() {
  pagination.value.page = 1;
  await fetchBins();
}

async function clearFilters() {
  filters.value = { brand: '', type: '', bank: '', family: '', country: '' };
  pagination.value.page = 1;
  await fetchBins();
}

// Modal
function openAddModal() {
  editingBin.value = null;
  formData.value = {
    bin: '',
    brand: 'visa',
    type: 'credit',
    family: '',
    bank: '',
    bankCode: '',
    country: 'TR',
    notes: ''
  };
  showModal.value = true;
}

function openEditModal(bin) {
  editingBin.value = bin;
  formData.value = {
    bin: bin.bin,
    brand: bin.brand,
    type: bin.type,
    family: bin.family || '',
    bank: bin.bank,
    bankCode: bin.bankCode || '',
    country: bin.country || 'TR',
    notes: bin.notes || ''
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingBin.value = null;
}

async function saveBin() {
  saving.value = true;
  try {
    if (editingBin.value) {
      await binApi.update(editingBin.value._id, formData.value);
    } else {
      await binApi.create(formData.value);
    }
    closeModal();
    await fetchBins();
    await fetchStats();
  } catch (e) {
    console.error('Failed to save bin:', e);
    alert('Kayıt başarısız: ' + (e.response?.data?.error || e.message));
  } finally {
    saving.value = false;
  }
}

async function deleteBin(bin) {
  if (!confirm(`${bin.bin} numaralı BIN'i silmek istediğinize emin misiniz?`)) return;

  try {
    await binApi.delete(bin._id);
    await fetchBins();
    await fetchStats();
  } catch (e) {
    console.error('Failed to delete bin:', e);
    alert('Silme başarısız: ' + (e.response?.data?.error || e.message));
  }
}

// Helpers
function getBrandInfo(brand) {
  return cardBrands.find(b => b.value === brand) || cardBrands[cardBrands.length - 1];
}

function getTypeInfo(type) {
  return cardTypes.find(t => t.value === type) || cardTypes[0];
}

// Init
onMounted(async () => {
  await Promise.all([
    fetchBins(),
    fetchStats(),
    fetchBanks(),
    fetchFamilies()
  ]);
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-gray-800">BIN Listesi</h2>
      <button @click="openAddModal"
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2">
        <span class="material-icons text-sm">add</span>
        Yeni BIN Ekle
      </button>
    </div>

    <!-- Stats -->
    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-sm border p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <span class="material-icons text-blue-600">credit_card</span>
          </div>
          <div>
            <div class="text-xs text-gray-500">Toplam BIN</div>
            <div class="text-xl font-bold text-gray-800">{{ stats.total?.toLocaleString() || 0 }}</div>
          </div>
        </div>
      </div>
      <div v-for="brand in stats.byBrand?.slice(0, 4)" :key="brand._id" class="bg-white rounded-xl shadow-sm border p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="getBrandInfo(brand._id).color">
            <span class="text-white text-xs font-bold uppercase">{{ brand._id?.slice(0, 2) }}</span>
          </div>
          <div>
            <div class="text-xs text-gray-500 capitalize">{{ brand._id }}</div>
            <div class="text-xl font-bold text-gray-800">{{ brand.count?.toLocaleString() }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Search Box -->
    <div class="bg-white rounded-xl shadow-sm border p-5 mb-6">
      <div class="relative">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <span class="material-icons text-sm align-middle mr-1">search</span>
          Hızlı BIN Arama
          <span v-if="searchLoading" class="ml-2 text-primary-600">
            <span class="inline-block animate-spin">&#9696;</span> Aranıyor...
          </span>
        </label>
        <div class="relative">
          <input v-model="searchInput" type="text" placeholder="Kart numarasının ilk 6-8 hanesini girin..."
            class="w-full px-4 py-3 text-lg font-mono border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 tracking-widest"
            :class="{ 'pr-12': searchInput, 'border-primary-400': searchLoading }"
            @blur="setTimeout(() => showSearchResults = false, 200)" />
          <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span v-if="searchLoading" class="animate-spin text-primary-500">
              <span class="material-icons">refresh</span>
            </span>
            <button v-else-if="searchInput" @click="clearSearch" class="text-gray-400 hover:text-gray-600">
              <span class="material-icons">close</span>
            </button>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-2">
          <span class="material-icons text-xs align-middle">info</span>
          6+ hane girdiğinizde harici kaynaklardan (PayTR, iyzico) otomatik çekilir ve kaydedilir
        </p>

        <!-- Search Results Dropdown -->
        <div v-if="showSearchResults && searchResults.length > 0"
          class="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div v-for="result in searchResults" :key="result._id || result.bin"
            @click="selectSearchResult(result)"
            class="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
            <div class="w-12 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
              :class="getBrandInfo(result.brand).color">
              {{ result.brand?.slice(0, 2).toUpperCase() }}
            </div>
            <div class="flex-1">
              <div class="font-mono text-lg font-semibold">{{ result.bin }}</div>
              <div class="text-sm text-gray-500">{{ result.bank }}</div>
            </div>
            <div class="text-right">
              <span class="px-2 py-1 text-xs rounded-full" :class="{
                'bg-green-100 text-green-700': result.type === 'credit',
                'bg-blue-100 text-blue-700': result.type === 'debit',
                'bg-purple-100 text-purple-700': result.type === 'prepaid'
              }">
                {{ getTypeInfo(result.type).label }}
              </span>
              <div v-if="result.family" class="text-xs text-gray-400 mt-1 capitalize">{{ result.family }}</div>
            </div>
            <div v-if="result.notes?.includes('Auto-fetched')" class="ml-2">
              <span class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Yeni</span>
            </div>
          </div>
        </div>

        <div v-else-if="showSearchResults && searchInput.length >= 6 && !searchLoading" class="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-6 text-center">
          <span class="material-icons text-4xl text-gray-300 mb-2">search_off</span>
          <p class="text-gray-500">Bu BIN numarası harici kaynaklarda da bulunamadı</p>
        </div>

        <div v-else-if="showSearchResults && searchInput.length >= 4 && searchInput.length < 6 && searchResults.length === 0" class="absolute z-50 w-full mt-2 bg-white border-2 border-amber-200 rounded-xl shadow-xl p-4 text-center">
          <span class="material-icons text-2xl text-amber-500 mb-1">info</span>
          <p class="text-gray-600 text-sm">Harici kaynaklardan arama için en az 6 hane girin</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow-sm border p-5 mb-6">
      <div class="flex flex-wrap gap-4 items-end">
        <!-- Brand Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Marka</label>
          <select v-model="filters.brand"
            class="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
            <option value="">Tümü</option>
            <option v-for="brand in cardBrands" :key="brand.value" :value="brand.value">{{ brand.label }}</option>
          </select>
        </div>

        <!-- Type Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kart Tipi</label>
          <select v-model="filters.type"
            class="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
            <option value="">Tümü</option>
            <option v-for="type in cardTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
          </select>
        </div>

        <!-- Bank Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Banka</label>
          <select v-model="filters.bank"
            class="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white w-48">
            <option value="">Tümü</option>
            <option v-for="bank in banks" :key="bank" :value="bank">{{ bank }}</option>
          </select>
        </div>

        <!-- Family Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kart Ailesi</label>
          <select v-model="filters.family"
            class="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
            <option value="">Tümü</option>
            <option v-for="fam in families" :key="fam" :value="fam" class="capitalize">{{ fam }}</option>
          </select>
        </div>

        <!-- Country Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
          <select v-model="filters.country"
            class="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
            <option value="">Tümü</option>
            <option value="TR">Türkiye</option>
            <option value="US">ABD</option>
            <option value="GB">İngiltere</option>
            <option value="DE">Almanya</option>
            <option value="RU">Rusya</option>
          </select>
        </div>

        <button @click="applyFilters"
          class="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2">
          <span class="material-icons text-sm">filter_list</span>
          Filtrele
        </button>

        <button @click="clearFilters"
          class="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2">
          <span class="material-icons text-sm">clear</span>
          Temizle
        </button>
      </div>
    </div>

    <!-- BIN Table -->
    <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">BIN</th>
            <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Marka</th>
            <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tip</th>
            <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Banka</th>
            <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kart Ailesi</th>
            <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ülke</th>
            <th class="px-4 py-4"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="bin in bins" :key="bin._id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-4">
              <code class="text-lg font-mono font-semibold bg-gray-100 px-2 py-1 rounded">{{ bin.bin }}</code>
            </td>
            <td class="px-4 py-4">
              <span class="inline-flex items-center gap-2">
                <span class="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                  :class="getBrandInfo(bin.brand).color">
                  {{ bin.brand?.slice(0, 1).toUpperCase() }}
                </span>
                <span class="capitalize">{{ bin.brand }}</span>
              </span>
            </td>
            <td class="px-4 py-4">
              <span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium" :class="{
                'bg-green-100 text-green-700': bin.type === 'credit',
                'bg-blue-100 text-blue-700': bin.type === 'debit',
                'bg-purple-100 text-purple-700': bin.type === 'prepaid'
              }">
                <span class="material-icons text-xs">{{ getTypeInfo(bin.type).icon }}</span>
                {{ getTypeInfo(bin.type).label }}
              </span>
            </td>
            <td class="px-4 py-4 text-sm text-gray-700">{{ bin.bank }}</td>
            <td class="px-4 py-4">
              <span v-if="bin.family" class="text-sm capitalize bg-amber-50 text-amber-700 px-2 py-1 rounded">
                {{ bin.family }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-4 py-4">
              <span class="text-sm font-medium">{{ bin.country || 'TR' }}</span>
            </td>
            <td class="px-4 py-4 text-right">
              <div class="flex items-center gap-2 justify-end">
                <button @click="openEditModal(bin)"
                  class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                  <span class="material-icons text-sm">edit</span>
                </button>
                <button @click="deleteBin(bin)"
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <span class="material-icons text-sm">delete</span>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="bins.length === 0 && !loading">
            <td colspan="7" class="px-4 py-16 text-center">
              <div class="flex flex-col items-center gap-3">
                <span class="material-icons text-5xl text-gray-300">credit_card_off</span>
                <span class="text-gray-500">Henüz BIN kaydı yok</span>
                <button @click="openAddModal" class="text-primary-600 hover:text-primary-700 font-medium">
                  İlk BIN'i Ekle
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="loading">
            <td colspan="7" class="px-4 py-16 text-center">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p class="mt-2 text-gray-500">Yükleniyor...</p>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="px-4 py-4 border-t bg-gray-50 flex items-center justify-between">
        <div class="text-sm text-gray-600">
          <span class="font-medium">{{ pagination.total?.toLocaleString() }}</span> kayıttan
          <span class="font-medium">{{ (pagination.page - 1) * pagination.limit + 1 }}</span> -
          <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span> arası
        </div>
        <div class="flex gap-1">
          <button v-for="p in Math.min(pagination.pages, 10)" :key="p"
            @click="changePage(p)"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              pagination.page === p
                ? 'bg-primary-600 text-white'
                : 'bg-white border hover:bg-gray-100 text-gray-700'
            ]">
            {{ p }}
          </button>
          <span v-if="pagination.pages > 10" class="px-2 py-1.5 text-gray-400">...</span>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="closeModal">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div class="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 class="text-lg font-bold text-gray-800">
            {{ editingBin ? 'BIN Düzenle' : 'Yeni BIN Ekle' }}
          </h3>
          <button @click="closeModal" class="p-2 hover:bg-gray-200 rounded-lg">
            <span class="material-icons text-gray-500">close</span>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <!-- BIN -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">BIN Numarası *</label>
            <input v-model="formData.bin" type="text" placeholder="453281" maxlength="8"
              :disabled="editingBin"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-lg tracking-widest disabled:bg-gray-100" />
            <p class="text-xs text-gray-500 mt-1">Kartın ilk 6-8 hanesi</p>
          </div>

          <!-- Brand & Type -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Kart Markası *</label>
              <select v-model="formData.brand"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
                <option v-for="brand in cardBrands" :key="brand.value" :value="brand.value">{{ brand.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Kart Tipi *</label>
              <select v-model="formData.type"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
                <option v-for="type in cardTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
              </select>
            </div>
          </div>

          <!-- Bank -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Banka Adı *</label>
            <input v-model="formData.bank" type="text" placeholder="Garanti BBVA"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>

          <!-- Bank Code & Country -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Banka Kodu</label>
              <input v-model="formData.bankCode" type="text" placeholder="garanti"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              <p class="text-xs text-gray-500 mt-1">POS eşleştirmesi için</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
              <select v-model="formData.country"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
                <option value="TR">Türkiye</option>
                <option value="US">ABD</option>
                <option value="GB">İngiltere</option>
                <option value="DE">Almanya</option>
                <option value="RU">Rusya</option>
              </select>
            </div>
          </div>

          <!-- Family -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Kart Ailesi</label>
            <input v-model="formData.family" type="text" placeholder="bonus, world, axess..."
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            <p class="text-xs text-gray-500 mt-1">Taksit kampanyaları için kullanılır</p>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
            <textarea v-model="formData.notes" rows="2" placeholder="Ek bilgiler..."
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"></textarea>
          </div>
        </div>

        <div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button @click="closeModal"
            class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors">
            İptal
          </button>
          <button @click="saveBin" :disabled="saving || !formData.bin || !formData.brand || !formData.bank"
            class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            <span v-if="saving" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            {{ editingBin ? 'Güncelle' : 'Kaydet' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
