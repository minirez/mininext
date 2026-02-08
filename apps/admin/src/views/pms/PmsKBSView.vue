<template>
  <div class="space-y-6">
    <!-- Action Buttons -->
    <div class="flex justify-end">
      <div class="flex gap-2">
        <button
          v-if="selectedGuests.length > 0"
          :disabled="!hasValidSelection"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          @click="handleDownloadXML"
        >
          <span class="material-icons text-lg">download</span>
          {{ t('guests.kbs.downloadXml') }} ({{ selectedGuests.length }})
        </button>
        <button
          v-if="selectedGuests.length > 0"
          class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          @click="showMarkSentModal = true"
        >
          <span class="material-icons text-lg">check_circle</span>
          {{ t('guests.kbs.markAsSent') }}
        </button>
      </div>
    </div>

    <!-- No Hotel Selected Warning -->
    <div
      v-if="!hotelId"
      class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center"
    >
      <span class="material-icons text-4xl text-amber-500 mb-2">hotel</span>
      <p class="text-amber-700 dark:text-amber-300">{{ t('guests.kbs.selectHotel') }}</p>
    </div>

    <template v-else>
      <!-- Statistics Cards -->
      <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-amber-600 dark:text-amber-400">pending</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ summary.pending || 0 }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ t('guests.kbs.stats.pending') }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-green-600 dark:text-green-400">send</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ summary.sent || 0 }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ t('guests.kbs.stats.sent') }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-emerald-600 dark:text-emerald-400"
                >check_circle</span
              >
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary.valid }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ t('guests.kbs.stats.valid') }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-red-600 dark:text-red-400">error</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary.invalid }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ t('guests.kbs.stats.invalid') }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-blue-600 dark:text-blue-400">badge</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary.turkish }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ t('guests.kbs.stats.turkish') }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-purple-600 dark:text-purple-400">flight</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary.foreign }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ t('guests.kbs.stats.foreign') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <div class="flex flex-wrap gap-4 items-end">
          <!-- Date Range -->
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
              t('guests.kbs.filters.checkInDate')
            }}</label>
            <div class="flex gap-2">
              <input
                v-model="filters.startDate"
                type="date"
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                @change="fetchPendingGuests"
              />
              <input
                v-model="filters.endDate"
                type="date"
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                @change="fetchPendingGuests"
              />
            </div>
          </div>
          <!-- Stay Status Filter -->
          <div class="w-40">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
              t('guests.kbs.filters.stayStatus')
            }}</label>
            <select
              v-model="filters.stayStatus"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              @change="fetchPendingGuests"
            >
              <option value="all">{{ t('guests.kbs.filters.all') }}</option>
              <option value="checked_in">{{ t('guests.kbs.filters.active') }}</option>
              <option value="checked_out">{{ t('guests.kbs.filters.checkedOut') }}</option>
            </select>
          </div>
          <!-- KBS Status Filter -->
          <div class="w-40">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
              t('guests.kbs.filters.kbsStatus')
            }}</label>
            <select
              v-model="filters.kbsStatus"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              @change="fetchPendingGuests"
            >
              <option value="pending">{{ t('guests.kbs.status.pending') }}</option>
              <option value="all">{{ t('guests.kbs.filters.all') }}</option>
              <option value="sent">{{ t('guests.kbs.status.sent') }}</option>
            </select>
          </div>
          <!-- Validation Status Filter -->
          <div class="w-40">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
              t('guests.kbs.filters.validationStatus')
            }}</label>
            <select
              v-model="filters.validationStatus"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              @change="applyFilters"
            >
              <option value="all">{{ t('guests.kbs.filters.all') }}</option>
              <option value="valid">{{ t('guests.kbs.filters.ready') }}</option>
              <option value="invalid">{{ t('guests.kbs.filters.missingInfo') }}</option>
            </select>
          </div>
          <!-- Select All -->
          <button
            class="px-4 py-2 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
            @click="toggleSelectAll"
          >
            <span class="material-icons text-lg">{{
              allSelected ? 'check_box' : 'check_box_outline_blank'
            }}</span>
            {{ allSelected ? t('guests.kbs.deselectAll') : t('guests.kbs.selectAll') }}
          </button>
        </div>
      </div>

      <!-- Guest List -->
      <DataTable
        :data="filteredGuests"
        :columns="columns"
        :loading="loading"
        :show-header="false"
        :show-pagination="false"
        responsive
        card-title-key="firstName"
        empty-icon="check_circle"
        :empty-text="
          guests.length === 0
            ? t('guests.kbs.noPendingNotifications')
            : t('guests.kbs.noFilterResults')
        "
        :row-class="row => (!row.isValid ? 'bg-red-50 dark:bg-red-900/10' : '')"
      >
        <template #header-checkbox>
          <input
            type="checkbox"
            :checked="allSelected"
            class="w-4 h-4 rounded border-gray-300 dark:border-slate-500 text-indigo-600 focus:ring-indigo-500"
            @change="toggleSelectAll"
          />
        </template>

        <template #cell-checkbox="{ row }">
          <input
            type="checkbox"
            :checked="selectedGuests.includes(row.guestId)"
            :disabled="!row.isValid || row.kbsStatus === 'sent'"
            class="w-4 h-4 rounded border-gray-300 dark:border-slate-500 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
            @change="toggleGuest(row.guestId)"
          />
        </template>

        <template #cell-guest="{ row }">
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center"
              :class="
                row.isTurkish
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-purple-100 dark:bg-purple-900/30'
              "
            >
              <span
                class="material-icons text-sm"
                :class="
                  row.isTurkish
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-purple-600 dark:text-purple-400'
                "
              >
                {{ row.isTurkish ? 'badge' : 'flight' }}
              </span>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ row.firstName }} {{ row.lastName }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ row.nationality || '-' }}
              </p>
            </div>
          </div>
        </template>

        <template #cell-identity="{ row }">
          <p class="text-sm text-gray-900 dark:text-white font-mono">
            {{ row.idNumber || '-' }}
          </p>
          <p class="text-xs text-gray-500 dark:text-slate-400">
            {{ getIdTypeLabel(row.idType) }}
          </p>
        </template>

        <template #cell-roomNumber="{ row }">
          <span
            class="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {{ row.roomNumber }}
          </span>
        </template>

        <template #cell-checkInDate="{ row }">
          <p class="text-sm text-gray-900 dark:text-white">
            {{ formatDate(row.checkInDate) }}
          </p>
        </template>

        <template #cell-status="{ row }">
          <!-- KBS Status -->
          <div
            v-if="row.kbsStatus === 'sent'"
            class="flex items-center gap-1 text-green-600 dark:text-green-400 mb-1"
          >
            <span class="material-icons text-sm">send</span>
            <span class="text-sm">{{ t('guests.kbs.status.sent') }}</span>
          </div>
          <div
            v-else-if="row.isValid"
            class="flex items-center gap-1 text-amber-600 dark:text-amber-400 mb-1"
          >
            <span class="material-icons text-sm">pending</span>
            <span class="text-sm">{{ t('guests.kbs.status.ready') }}</span>
          </div>
          <div v-else class="space-y-1">
            <div class="flex items-center gap-1 text-red-600 dark:text-red-400">
              <span class="material-icons text-sm">error</span>
              <span class="text-sm">{{ t('guests.kbs.status.missing') }}</span>
            </div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="field in row.missingFields"
                :key="field"
                class="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded"
              >
                {{ getFieldLabel(field) }}
              </span>
            </div>
          </div>
        </template>

        <template #row-actions="{ row }">
          <button
            v-if="!row.isValid"
            class="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            :title="t('guests.kbs.editInfo')"
            @click="openEditModal(row)"
          >
            <span class="material-icons text-gray-600 dark:text-gray-400">edit</span>
          </button>
        </template>
      </DataTable>

      <!-- Edit Guest Modal -->
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="showEditModal = false"
      >
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
          <div class="fixed inset-0 bg-black/50" @click="showEditModal = false"></div>
          <div class="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ t('guests.kbs.modal.completeInfo') }}
              </h3>
              <button class="text-gray-400 hover:text-gray-500" @click="showEditModal = false">
                <span class="material-icons">close</span>
              </button>
            </div>

            <div v-if="editingGuest" class="space-y-4">
              <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 mb-4">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ editingGuest.firstName }} {{ editingGuest.lastName }}
                </p>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ t('guests.kbs.modal.room') }}: {{ editingGuest.roomNumber }}
                </p>
              </div>

              <!-- Father Name (for foreigners) -->
              <div v-if="!editingGuest.isTurkish">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('guests.kbs.fields.fatherName') }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="editForm.fatherName"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <!-- Mother Name (for foreigners) -->
              <div v-if="!editingGuest.isTurkish">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('guests.kbs.fields.motherName') }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="editForm.motherName"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <!-- Birth Place (for foreigners) -->
              <div v-if="!editingGuest.isTurkish">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('guests.kbs.fields.birthPlace') }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="editForm.birthPlace"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <!-- Date of Birth -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('guests.kbs.fields.dateOfBirth') }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="editForm.dateOfBirth"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <!-- ID Number (if missing) -->
              <div v-if="editingGuest.missingFields?.includes('idNumber')">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{
                    editingGuest.isTurkish
                      ? t('guests.kbs.fields.tcKimlik')
                      : t('guests.kbs.fields.passportNo')
                  }}
                  <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="editForm.idNumber"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div class="flex justify-end gap-3 pt-4">
                <button
                  class="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  @click="showEditModal = false"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  :disabled="saving"
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  @click="saveGuestFields"
                >
                  <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
                  {{ t('common.save') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mark as Sent Modal -->
      <div
        v-if="showMarkSentModal"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="showMarkSentModal = false"
      >
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
          <div class="fixed inset-0 bg-black/50" @click="showMarkSentModal = false"></div>
          <div class="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <div class="text-center mb-6">
              <div
                class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
              >
                <span class="material-icons text-3xl text-green-600 dark:text-green-400"
                  >check_circle</span
                >
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ t('guests.kbs.modal.markAsSentTitle') }}
              </h3>
              <p class="text-gray-500 dark:text-slate-400 mt-2">
                {{ t('guests.kbs.modal.markAsSentDesc', { count: selectedGuests.length }) }}
              </p>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('guests.kbs.modal.referenceNo') }}
              </label>
              <input
                v-model="kbsReference"
                type="text"
                :placeholder="t('guests.kbs.modal.referencePlaceholder')"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div class="flex justify-end gap-3">
              <button
                class="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                @click="showMarkSentModal = false"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                :disabled="marking"
                class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                @click="handleMarkAsSent"
              >
                <span v-if="marking" class="material-icons animate-spin text-sm">refresh</span>
                {{ t('common.confirm') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { usePmsStore } from '@/stores/pms'
import DataTable from '@/components/ui/data/DataTable.vue'
import * as kbsService from '@/services/pms/kbsService'

const { t, locale } = useI18n()
const toast = useToast()
const pmsStore = usePmsStore()
const hotelId = computed(() => pmsStore.hotelId)
const localeMap = { tr: 'tr-TR', en: 'en-US' }

// State
const loading = ref(false)
const saving = ref(false)
const marking = ref(false)
const guests = ref([])
const selectedGuests = ref([])
const summary = ref({ total: 0, pending: 0, sent: 0, valid: 0, invalid: 0, turkish: 0, foreign: 0 })

// Filters
const filters = ref({
  startDate: '',
  endDate: '',
  stayStatus: 'all', // checked_in, checked_out, all
  kbsStatus: 'pending', // pending, sent, all
  validationStatus: 'all', // valid, invalid, all
  nationality: 'all' // turkish, foreign, all
})

// Modals
const showEditModal = ref(false)
const showMarkSentModal = ref(false)
const editingGuest = ref(null)
const editForm = ref({})
const kbsReference = ref('')

// Columns
const columns = computed(() => [
  { key: 'checkbox', label: '', sortable: false, width: '48px' },
  { key: 'guest', label: t('guests.columns.guest'), sortable: false },
  { key: 'identity', label: t('guests.columns.identity'), sortable: false },
  { key: 'roomNumber', label: t('guests.kbs.columns.room'), sortable: false },
  { key: 'checkInDate', label: t('guests.kbs.columns.checkIn'), sortable: false },
  { key: 'status', label: t('guests.kbs.columns.status'), sortable: false }
])

// Computed
const filteredGuests = computed(() => {
  let result = guests.value

  // Filter by validation status
  if (filters.value.validationStatus === 'valid') {
    result = result.filter(g => g.isValid)
  } else if (filters.value.validationStatus === 'invalid') {
    result = result.filter(g => !g.isValid)
  }

  // Filter by nationality
  if (filters.value.nationality === 'turkish') {
    result = result.filter(g => g.isTurkish)
  } else if (filters.value.nationality === 'foreign') {
    result = result.filter(g => !g.isTurkish)
  }

  // Filter by KBS status (client-side for sent filter)
  if (filters.value.kbsStatus === 'sent') {
    result = result.filter(g => g.kbsStatus === 'sent')
  } else if (filters.value.kbsStatus === 'pending') {
    result = result.filter(g => g.kbsStatus === 'pending' || g.kbsStatus === 'failed')
  }

  return result
})

const allSelected = computed(() => {
  const selectableGuests = filteredGuests.value.filter(g => g.isValid && g.kbsStatus !== 'sent')
  return (
    selectableGuests.length > 0 &&
    selectableGuests.every(g => selectedGuests.value.includes(g.guestId))
  )
})

const hasValidSelection = computed(() => {
  return selectedGuests.value.some(id => {
    const guest = guests.value.find(g => g.guestId === id)
    return guest?.isValid
  })
})

// Methods
const fetchPendingGuests = async () => {
  if (!hotelId.value) return

  loading.value = true
  try {
    const params = {}
    if (filters.value.startDate) params.startDate = filters.value.startDate
    if (filters.value.endDate) params.endDate = filters.value.endDate
    if (filters.value.stayStatus !== 'all') params.status = filters.value.stayStatus
    if (filters.value.kbsStatus === 'all') params.includeAll = 'true'

    const response = await kbsService.getPending(hotelId.value, params)
    guests.value = response.data || []
    summary.value = response.summary || {
      total: 0,
      pending: 0,
      sent: 0,
      valid: 0,
      invalid: 0,
      turkish: 0,
      foreign: 0
    }
  } catch (error) {
    console.error('Failed to fetch KBS pending:', error)
    toast.error(t('guests.kbs.messages.loadError'))
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  // Filters are applied via computed property
}

const toggleGuest = guestId => {
  const index = selectedGuests.value.indexOf(guestId)
  if (index === -1) {
    selectedGuests.value.push(guestId)
  } else {
    selectedGuests.value.splice(index, 1)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedGuests.value = []
  } else {
    selectedGuests.value = filteredGuests.value
      .filter(g => g.isValid && g.kbsStatus !== 'sent')
      .map(g => g.guestId)
  }
}

const openEditModal = guest => {
  editingGuest.value = guest
  editForm.value = {
    fatherName: guest.fatherName || '',
    motherName: guest.motherName || '',
    birthPlace: guest.birthPlace || '',
    dateOfBirth: guest.dateOfBirth ? new Date(guest.dateOfBirth).toISOString().split('T')[0] : '',
    idNumber: guest.idNumber || '',
    nationality: guest.nationality || ''
  }
  showEditModal.value = true
}

const saveGuestFields = async () => {
  if (!editingGuest.value) return

  saving.value = true
  try {
    await kbsService.updateGuestFields(
      hotelId.value,
      editingGuest.value.stayId,
      editingGuest.value.guestId,
      editForm.value
    )
    toast.success(t('guests.kbs.messages.guestUpdated'))
    showEditModal.value = false
    await fetchPendingGuests()
  } catch (error) {
    console.error('Failed to update guest:', error)
    toast.error(t('guests.kbs.messages.updateError'))
  } finally {
    saving.value = false
  }
}

const handleDownloadXML = async () => {
  if (selectedGuests.value.length === 0) return

  try {
    await kbsService.downloadXML(hotelId.value, selectedGuests.value)
    toast.success(t('guests.kbs.messages.xmlDownloaded'))
  } catch (error) {
    console.error('Failed to download XML:', error)
    toast.error(t('guests.kbs.messages.xmlError'))
  }
}

const handleMarkAsSent = async () => {
  if (selectedGuests.value.length === 0) return

  marking.value = true
  try {
    await kbsService.markAsSent(hotelId.value, selectedGuests.value, kbsReference.value || null)
    toast.success(t('guests.kbs.messages.markedAsSent', { count: selectedGuests.value.length }))
    showMarkSentModal.value = false
    selectedGuests.value = []
    kbsReference.value = ''
    await fetchPendingGuests()
  } catch (error) {
    console.error('Failed to mark as sent:', error)
    toast.error(t('guests.kbs.messages.operationError'))
  } finally {
    marking.value = false
  }
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(localeMap[locale.value] || 'tr-TR')
}

const getIdTypeLabel = type => {
  if (!type) return '-'
  return t(`guests.idTypes.${type}`)
}

const getFieldLabel = field => {
  return t(`guests.kbs.fieldLabels.${field}`)
}

// Lifecycle
onMounted(() => {
  // Set default date range (last 30 days)
  const today = new Date()
  const monthAgo = new Date(today)
  monthAgo.setDate(monthAgo.getDate() - 30)

  filters.value.endDate = today.toISOString().split('T')[0]
  filters.value.startDate = monthAgo.toISOString().split('T')[0]

  if (hotelId.value) {
    fetchPendingGuests()
  }
})

// Watch for hotel changes
watch(hotelId, newId => {
  if (newId) {
    fetchPendingGuests()
  } else {
    guests.value = []
    summary.value = { total: 0, valid: 0, invalid: 0, turkish: 0, foreign: 0 }
  }
})
</script>
