<template>
  <Modal v-model="isOpen" :title="$t('siteSettings.dns.title')" size="xl" :close-on-overlay="false">
    <template #header>
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div
          class="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0"
        >
          <span class="material-icons text-indigo-600 dark:text-indigo-400 text-lg">dns</span>
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ $t('siteSettings.dns.title') }}
          </h3>
          <p class="text-xs text-gray-500 dark:text-slate-400 font-mono truncate">{{ domain }}</p>
        </div>
        <span class="badge flex-shrink-0" :class="isRoot ? 'badge-warning' : 'badge-info'">
          {{ isRoot ? 'Root Domain' : 'Subdomain' }}
        </span>
      </div>
    </template>

    <!-- Not on Hostinger -->
    <div v-if="notOnHostinger" class="py-8 text-center">
      <div
        class="w-16 h-16 mx-auto mb-4 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center"
      >
        <span class="material-icons text-3xl text-amber-500">warning</span>
      </div>
      <h4 class="text-base font-semibold text-gray-800 dark:text-white mb-2">
        {{ $t('siteSettings.dns.notOnHostingerTitle') }}
      </h4>
      <p class="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto">
        {{ $t('siteSettings.dns.notOnHostinger') }}
      </p>
    </div>

    <template v-else>
      <!-- Quick Actions Bar -->
      <div
        class="flex flex-wrap items-center gap-2 mb-5 p-3 bg-gray-50 dark:bg-slate-700/40 rounded-lg"
      >
        <!-- Auto DNS record -->
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          :disabled="creatingRecord || settingUp"
          @click="handleCreateRecord"
        >
          <svg v-if="creatingRecord" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span v-else class="material-icons text-base">add_link</span>
          {{ isRoot ? $t('siteSettings.dns.createARecord') : $t('siteSettings.dns.createCname') }}
        </button>

        <!-- One-click setup -->
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          :disabled="creatingRecord || settingUp"
          @click="handleOneClickSetup"
        >
          <svg v-if="settingUp" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span v-else class="material-icons text-base">bolt</span>
          {{ $t('siteSettings.dns.oneClickSetup') }}
        </button>

        <div class="flex-1" />

        <!-- Refresh -->
        <button
          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          :disabled="loading"
          @click="loadRecords"
        >
          <span class="material-icons text-base" :class="{ 'animate-spin': loading }">refresh</span>
        </button>

        <!-- Add record -->
        <button
          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          @click="openAddForm"
        >
          <span class="material-icons text-base">add</span>
        </button>
      </div>

      <!-- Tip: what this domain needs -->
      <div
        class="mb-4 px-3 py-2 rounded-lg text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 flex items-start gap-2"
      >
        <span class="material-icons text-sm mt-px flex-shrink-0">info</span>
        <span v-if="isRoot">
          {{ $t('siteSettings.dns.rootDomainTip') }}
          <code class="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded font-semibold"
            >A → 85.31.238.34</code
          >
        </span>
        <span v-else>
          {{ $t('siteSettings.dns.subdomainTip') }}
          <code class="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded font-semibold"
            >CNAME → app.maxirez.com</code
          >
        </span>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-3">
        <div
          v-for="i in 5"
          :key="i"
          class="h-10 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse"
        />
      </div>

      <!-- Records list -->
      <div v-else-if="records.length > 0" class="space-y-1.5">
        <div
          v-for="(record, idx) in records"
          :key="idx"
          class="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
        >
          <!-- Type badge -->
          <span
            class="inline-flex items-center justify-center w-14 px-1.5 py-0.5 rounded text-xs font-bold tracking-wide flex-shrink-0"
            :class="typeBadgeClass(record.type)"
          >
            {{ record.type }}
          </span>

          <!-- Name -->
          <span
            class="w-32 text-sm font-mono text-gray-800 dark:text-slate-200 truncate flex-shrink-0"
            :title="record.name"
          >
            {{ record.name }}
          </span>

          <!-- Content -->
          <span
            class="flex-1 text-sm font-mono text-gray-600 dark:text-slate-400 truncate"
            :title="record.content"
          >
            {{ record.content }}
          </span>

          <!-- TTL -->
          <span
            class="text-xs text-gray-400 dark:text-slate-500 flex-shrink-0 w-12 text-right tabular-nums"
          >
            {{ record.ttl }}
          </span>

          <!-- Actions -->
          <div
            class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <button
              class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              :title="$t('siteSettings.dns.editRecord')"
              @click="openEditForm(record)"
            >
              <span class="material-icons text-[16px]">edit</span>
            </button>
            <button
              class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              :title="$t('siteSettings.dns.deleteRecord')"
              @click="handleDeleteRecord(record)"
            >
              <span class="material-icons text-[16px]">close</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading && !loadError" class="py-10 text-center">
        <span class="material-icons text-4xl text-gray-300 dark:text-slate-600 mb-2">dns</span>
        <p class="text-sm text-gray-400 dark:text-slate-500">
          {{ $t('siteSettings.dns.noRecords') }}
        </p>
      </div>

      <!-- Load error -->
      <div
        v-if="loadError && !notOnHostinger"
        class="mt-3 px-3 py-2 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center gap-2"
      >
        <span class="material-icons text-sm">error</span>
        {{ loadError }}
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <span class="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
          <span class="material-icons text-xs">cloud</span>
          {{ $t('siteSettings.dns.poweredByHostinger') }}
        </span>
        <button class="btn-secondary text-sm" @click="isOpen = false">
          {{ $t('common.close') }}
        </button>
      </div>
    </template>
  </Modal>

  <!-- Add/Edit Record Modal -->
  <Modal
    v-model="showRecordModal"
    :title="editingRecord ? $t('siteSettings.dns.editRecord') : $t('siteSettings.dns.addRecord')"
    size="md"
  >
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">{{ $t('siteSettings.dns.type') }}</label>
          <select v-model="recordForm.type" class="form-input">
            <option v-for="rt in recordTypes" :key="rt" :value="rt">{{ rt }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">{{ $t('siteSettings.dns.name') }}</label>
          <input
            v-model="recordForm.name"
            type="text"
            class="form-input"
            placeholder="@ or subdomain"
          />
        </div>
      </div>

      <div>
        <label class="form-label">{{ $t('siteSettings.dns.content') }}</label>
        <input
          v-model="recordForm.content"
          type="text"
          class="form-input"
          :placeholder="recordForm.type === 'A' ? '85.31.238.34' : 'app.maxirez.com'"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">{{ $t('siteSettings.dns.ttl') }}</label>
          <input
            v-model.number="recordForm.ttl"
            type="number"
            class="form-input"
            placeholder="3600"
          />
        </div>
        <div v-if="showPriority">
          <label class="form-label">{{ $t('siteSettings.dns.priority') }}</label>
          <input
            v-model.number="recordForm.priority"
            type="number"
            class="form-input"
            placeholder="10"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn-secondary" @click="showRecordModal = false">
        {{ $t('siteSettings.dns.cancel') }}
      </button>
      <button
        class="btn-primary"
        :disabled="savingRecord || !recordForm.name || !recordForm.content"
        @click="handleSaveRecord"
      >
        <svg v-if="savingRecord" class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {{ $t('siteSettings.dns.save') }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { Modal } from '@/components/ui'
import siteSettingsService from '@/services/siteSettingsService'

const { t } = useI18n()
const toast = useToast()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  domain: { type: String, default: '' },
  domainType: { type: String, default: 'b2c' }
})

const emit = defineEmits(['update:modelValue', 'ssl-setup-complete', 'cname-created'])

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV']

// State
const loading = ref(false)
const loadError = ref(null)
const notOnHostinger = ref(false)
const records = ref([])
const creatingRecord = ref(false)
const settingUp = ref(false)
const savingRecord = ref(false)
const showRecordModal = ref(false)
const editingRecord = ref(null)

const recordForm = ref({
  type: 'CNAME',
  name: '',
  content: '',
  ttl: 3600,
  priority: null
})

const showPriority = computed(() => ['MX', 'SRV'].includes(recordForm.value.type))

// Root domain (example.com) → A record, subdomain (booking.example.com) → CNAME
const isRoot = computed(() => {
  if (!props.domain) return false
  return props.domain.replace(/\.$/, '').split('.').length <= 2
})

const typeBadgeClass = type => {
  const map = {
    A: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    AAAA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    CNAME: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    MX: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    TXT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    NS: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    SRV: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    CAA: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
  }
  return map[type] || map.A
}

// Load records when modal opens
watch(
  () => props.modelValue,
  open => {
    if (open && props.domain) {
      loadRecords()
    }
  }
)

const loadRecords = async () => {
  if (!props.domain) return
  loading.value = true
  loadError.value = null
  notOnHostinger.value = false

  try {
    const result = await siteSettingsService.getDnsRecords(props.domain)
    records.value = result.data || []
  } catch (err) {
    const errData = err.response?.data
    if (errData?.error === 'DOMAIN_NOT_IN_HOSTINGER') {
      notOnHostinger.value = true
    } else {
      loadError.value = errData?.message || t('siteSettings.dns.loadError')
    }
  } finally {
    loading.value = false
  }
}

// Auto DNS record (A for root, CNAME for subdomain)
const handleCreateRecord = async () => {
  creatingRecord.value = true
  try {
    const result = await siteSettingsService.createAutoCname(props.domain)
    if (result.alreadyExists) {
      toast.info(
        result.isRoot
          ? t('siteSettings.dns.aRecordAlreadyExists')
          : t('siteSettings.dns.cnameAlreadyExists')
      )
    } else {
      toast.success(
        result.isRoot ? t('siteSettings.dns.aRecordCreated') : t('siteSettings.dns.cnameCreated')
      )
      emit('cname-created')
    }
    await loadRecords()
  } catch (err) {
    const errData = err.response?.data
    if (errData?.error === 'DOMAIN_NOT_IN_HOSTINGER') {
      notOnHostinger.value = true
    } else {
      toast.error(errData?.message || t('siteSettings.dns.cnameCreationFailed'))
    }
  } finally {
    creatingRecord.value = false
  }
}

// One-click setup
const handleOneClickSetup = async () => {
  settingUp.value = true
  try {
    const result = await siteSettingsService.oneClickSetup(props.domainType)
    if (result.success) {
      toast.success(t('siteSettings.dns.oneClickComplete'))
      emit('ssl-setup-complete', result.data)
      isOpen.value = false
    }
  } catch (err) {
    const errData = err.response?.data
    if (errData?.step === 'dns') {
      toast.warning(t('siteSettings.dns.propagationPending'))
    } else {
      toast.error(errData?.message || t('siteSettings.dns.oneClickFailed'))
    }
  } finally {
    settingUp.value = false
  }
}

// Add/Edit record modal
const openAddForm = () => {
  editingRecord.value = null
  recordForm.value = {
    type: isRoot.value ? 'A' : 'CNAME',
    name: '',
    content: '',
    ttl: 3600,
    priority: null
  }
  showRecordModal.value = true
}

const openEditForm = record => {
  editingRecord.value = record
  recordForm.value = {
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: record.ttl || 3600,
    priority: record.priority || null
  }
  showRecordModal.value = true
}

const handleSaveRecord = async () => {
  const { type, name, content, ttl, priority } = recordForm.value
  if (!name || !content) return

  savingRecord.value = true
  try {
    const rec = { type, name, content, ttl: ttl || 3600 }
    if (['MX', 'SRV'].includes(type) && priority != null) {
      rec.priority = priority
    }

    if (editingRecord.value) {
      await siteSettingsService.deleteDnsRecords(props.domain, [
        { name: editingRecord.value.name, type: editingRecord.value.type }
      ])
    }

    await siteSettingsService.updateDnsRecords(props.domain, [rec], false)
    toast.success(t('siteSettings.dns.recordSaved'))
    showRecordModal.value = false
    await loadRecords()
  } catch (err) {
    toast.error(err.response?.data?.message || t('siteSettings.dns.loadError'))
  } finally {
    savingRecord.value = false
  }
}

// Delete record
const handleDeleteRecord = async record => {
  if (!confirm(t('siteSettings.dns.deleteRecordConfirm'))) return

  try {
    await siteSettingsService.deleteDnsRecords(props.domain, [
      { name: record.name, type: record.type }
    ])
    toast.success(t('siteSettings.dns.recordDeleted'))
    await loadRecords()
  } catch (err) {
    toast.error(err.response?.data?.message || t('siteSettings.dns.loadError'))
  }
}
</script>
