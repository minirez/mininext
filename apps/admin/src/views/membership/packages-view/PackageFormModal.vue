<template>
  <Modal
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :title="isEdit ? $t('membership.packages.editPackage') : $t('membership.packages.newPackage')"
    size="xl"
  >
    <!-- Tabs -->
    <div class="border-b border-gray-200 dark:border-slate-700 -mx-6 px-6 mb-4">
      <div class="flex gap-4">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="pb-3 px-1 text-sm font-medium border-b-2 transition-colors"
          :class="
            activeTab === tab.key
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400'
          "
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Basic Tab -->
    <div v-show="activeTab === 'basic'" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">{{ $t('membership.packages.name') }} (TR) *</label>
          <input v-model="form.name.tr" type="text" class="form-input" required />
        </div>
        <div>
          <label class="form-label">{{ $t('membership.packages.name') }} (EN) *</label>
          <input v-model="form.name.en" type="text" class="form-input" required />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">{{ $t('common.description') }} (TR)</label>
          <textarea v-model="form.description.tr" class="form-input" rows="2"></textarea>
        </div>
        <div>
          <label class="form-label">{{ $t('common.description') }} (EN)</label>
          <textarea v-model="form.description.en" class="form-input" rows="2"></textarea>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="form-label">{{ $t('membership.packages.code') }} *</label>
          <input
            v-model="form.code"
            type="text"
            class="form-input"
            :placeholder="$t('membership.packages.codePlaceholder')"
            :disabled="isEdit"
          />
        </div>
        <div>
          <label class="form-label">{{ $t('membership.packages.targetPartnerType') }}</label>
          <select v-model="form.targetPartnerType" class="form-input">
            <option value="all">{{ $t('membership.packages.partnerTypes.all') }}</option>
            <option value="hotel">{{ $t('membership.packages.partnerTypes.hotel') }}</option>
            <option value="agency">{{ $t('membership.packages.partnerTypes.agency') }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">{{ $t('membership.services.status') }}</label>
          <select v-model="form.status" class="form-input">
            <option value="active">{{ $t('membership.statuses.active') }}</option>
            <option value="inactive">{{ $t('membership.statuses.inactive') }}</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="form-label">{{ $t('membership.packages.icon') }}</label>
          <input v-model="form.icon" type="text" class="form-input" placeholder="inventory_2" />
        </div>
        <div>
          <label class="form-label">{{ $t('membership.packages.color') }}</label>
          <input v-model="form.color" type="color" class="form-input h-10" />
        </div>
        <div>
          <label class="form-label">{{ $t('membership.packages.badge') }}</label>
          <input
            v-model="form.badge"
            type="text"
            class="form-input"
            :placeholder="$t('membership.packages.badgePlaceholder')"
          />
        </div>
      </div>
      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="form.isPublic" type="checkbox" class="form-checkbox" />
          <span>{{ $t('membership.packages.isPublic') }}</span>
        </label>
        <span class="text-xs text-gray-500 dark:text-slate-400">{{
          $t('membership.packages.isPublicHelp')
        }}</span>
      </div>
    </div>

    <!-- Services Tab -->
    <div v-show="activeTab === 'services'" class="space-y-4">
      <div v-if="availableServicesLoading" class="text-center py-4">
        <div
          class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"
        ></div>
      </div>
      <div v-else class="grid grid-cols-2 gap-4">
        <!-- Available -->
        <div>
          <div class="font-medium text-sm text-gray-700 dark:text-slate-300 mb-2">
            {{ $t('membership.packages.serviceSelector.available') }}
          </div>
          <div
            class="border border-gray-200 dark:border-slate-700 rounded-lg max-h-64 overflow-y-auto"
          >
            <div
              v-for="svc in availableServices.filter(
                s => !form.services.find(fs => fs.service === s._id)
              )"
              :key="svc._id"
              class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer border-b border-gray-100 dark:border-slate-700 last:border-0"
              @click="addServiceToPackage(svc)"
            >
              <div class="flex items-center gap-2">
                <span class="material-icons text-sm text-gray-400">{{ svc.icon || 'cube' }}</span>
                <span class="text-sm">{{ svc.name?.tr }}</span>
              </div>
              <span class="material-icons text-sm text-green-500">add_circle</span>
            </div>
            <div
              v-if="
                availableServices.filter(s => !form.services.find(fs => fs.service === s._id))
                  .length === 0
              "
              class="p-4 text-center text-sm text-gray-400"
            >
              {{ $t('common.noData') }}
            </div>
          </div>
        </div>
        <!-- Included -->
        <div>
          <div class="font-medium text-sm text-gray-700 dark:text-slate-300 mb-2">
            {{ $t('membership.packages.serviceSelector.included') }} ({{ form.services.length }})
          </div>
          <div
            class="border border-gray-200 dark:border-slate-700 rounded-lg max-h-64 overflow-y-auto"
          >
            <div
              v-for="(fs, idx) in form.services"
              :key="fs.service"
              class="flex items-center justify-between p-3 border-b border-gray-100 dark:border-slate-700 last:border-0"
            >
              <div class="flex items-center gap-2">
                <span class="material-icons text-sm text-gray-400">{{
                  getServiceById(fs.service)?.icon || 'cube'
                }}</span>
                <span class="text-sm">{{ getServiceById(fs.service)?.name?.tr || '?' }}</span>
              </div>
              <button class="text-red-500 hover:text-red-600" @click="form.services.splice(idx, 1)">
                <span class="material-icons text-sm">remove_circle</span>
              </button>
            </div>
            <div v-if="form.services.length === 0" class="p-4 text-center text-sm text-gray-400">
              {{ $t('membership.packages.serviceSelector.noServices') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pricing Tab -->
    <div v-show="activeTab === 'pricing'" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">{{ $t('membership.packages.interval') }}</label>
          <select v-model="form.interval" class="form-input">
            <option value="monthly">{{ $t('membership.intervals.monthly') }}</option>
            <option value="yearly">{{ $t('membership.intervals.yearly') }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">{{ $t('membership.packages.priceMode') }}</label>
          <select v-model="form.priceMode" class="form-input">
            <option value="override">{{ $t('membership.packages.priceModes.override') }}</option>
            <option value="auto">{{ $t('membership.packages.priceModes.auto') }}</option>
          </select>
        </div>
      </div>

      <div v-if="form.priceMode === 'override'">
        <label class="form-label">{{ $t('membership.services.prices') }}</label>
        <div class="grid grid-cols-4 gap-3">
          <div v-for="cur in currencies" :key="cur" class="flex items-center gap-2">
            <span class="text-sm font-medium w-10 text-gray-500">{{ cur }}</span>
            <input
              v-model.number="form.prices[cur]"
              type="number"
              step="0.01"
              min="0"
              class="form-input flex-1"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <!-- Trial -->
      <div class="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
        <label class="flex items-center gap-2 cursor-pointer mb-2">
          <input v-model="form.trialEnabled" type="checkbox" class="form-checkbox" />
          <span class="font-medium text-sm">{{ $t('membership.packages.trialEnabled') }}</span>
        </label>
        <div v-if="form.trialEnabled" class="mt-2">
          <label class="form-label">{{ $t('membership.packages.trialDays') }}</label>
          <input v-model.number="form.trialDays" type="number" min="1" class="form-input w-32" />
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn-secondary" @click="$emit('update:modelValue', false)">
        {{ $t('common.cancel') }}
      </button>
      <button class="btn-primary" :disabled="processing || !isValid" @click="handleSave">
        <span v-if="processing">{{ $t('common.loading') }}</span>
        <span v-else>{{ $t('common.save') }}</span>
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import {
  createMembershipPackage,
  updateMembershipPackage
} from '@/services/membershipPackageService'
import { getMembershipServices } from '@/services/membershipServiceService'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  modelValue: Boolean,
  pkg: Object
})
const emit = defineEmits(['update:modelValue', 'saved'])

const { t } = useI18n()
const toast = useToast()
const currencies = ['TRY', 'USD', 'EUR', 'GBP']

const processing = ref(false)
const activeTab = ref('basic')
const isEdit = computed(() => !!props.pkg)

const tabs = computed(() => [
  { key: 'basic', label: t('membership.packages.tabs.basic') },
  { key: 'services', label: t('membership.packages.tabs.services') },
  { key: 'pricing', label: t('membership.packages.tabs.pricing') }
])

// Available services for selector
const availableServices = ref([])
const availableServicesLoading = ref(false)

const loadAvailableServices = async () => {
  availableServicesLoading.value = true
  try {
    const res = await getMembershipServices({ status: 'active' })
    availableServices.value = res.data || []
  } catch {
    // silent
  } finally {
    availableServicesLoading.value = false
  }
}

const getServiceById = id => availableServices.value.find(s => s._id === id)

const defaultForm = () => ({
  name: { tr: '', en: '' },
  description: { tr: '', en: '' },
  code: '',
  targetPartnerType: 'all',
  services: [],
  interval: 'yearly',
  priceMode: 'override',
  prices: { TRY: null, USD: null, EUR: null, GBP: null },
  trialEnabled: false,
  trialDays: 14,
  badge: '',
  icon: 'inventory_2',
  color: '#6366f1',
  sortOrder: 0,
  isPublic: true,
  status: 'active'
})

const form = ref(defaultForm())

const isValid = computed(() => form.value.name.tr && form.value.name.en && form.value.code)

const addServiceToPackage = svc => {
  form.value.services.push({
    service: svc._id,
    featureOverrides: {},
    included: true
  })
}

watch(
  () => props.pkg,
  pkg => {
    activeTab.value = 'basic'
    if (pkg) {
      const pricesMap = {}
      currencies.forEach(c => {
        pricesMap[c] = null
      })
      pkg.pricing?.prices?.forEach(p => {
        pricesMap[p.currency] = p.amount
      })

      form.value = {
        name: { tr: pkg.name?.tr || '', en: pkg.name?.en || '' },
        description: { tr: pkg.description?.tr || '', en: pkg.description?.en || '' },
        code: pkg.code || '',
        targetPartnerType: pkg.targetPartnerType || 'all',
        services: (pkg.services || []).map(s => ({
          service: s.service?._id || s.service,
          featureOverrides: s.featureOverrides
            ? s.featureOverrides instanceof Map
              ? Object.fromEntries(s.featureOverrides)
              : s.featureOverrides
            : {},
          included: s.included !== false
        })),
        interval: pkg.pricing?.interval || 'yearly',
        priceMode: pkg.pricing?.priceMode || 'override',
        prices: pricesMap,
        trialEnabled: pkg.trial?.enabled || false,
        trialDays: pkg.trial?.days || 14,
        badge: pkg.badge || '',
        icon: pkg.icon || 'inventory_2',
        color: pkg.color || '#6366f1',
        sortOrder: pkg.sortOrder || 0,
        isPublic: pkg.isPublic !== false,
        status: pkg.status || 'active'
      }
    } else {
      form.value = defaultForm()
    }
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  val => {
    if (val) loadAvailableServices()
  }
)

const handleSave = async () => {
  processing.value = true
  try {
    const prices = currencies
      .filter(c => form.value.prices[c] != null && form.value.prices[c] > 0)
      .map(c => ({ currency: c, amount: form.value.prices[c] }))

    const payload = {
      name: form.value.name,
      description: form.value.description,
      code: form.value.code,
      targetPartnerType: form.value.targetPartnerType,
      services: form.value.services.map(s => ({
        service: s.service,
        featureOverrides: s.featureOverrides || {},
        included: s.included !== false
      })),
      pricing: {
        interval: form.value.interval,
        priceMode: form.value.priceMode,
        prices
      },
      trial: {
        enabled: form.value.trialEnabled,
        days: form.value.trialDays
      },
      badge: form.value.badge,
      icon: form.value.icon,
      color: form.value.color,
      sortOrder: form.value.sortOrder,
      isPublic: form.value.isPublic,
      status: form.value.status
    }

    if (isEdit.value) {
      await updateMembershipPackage(props.pkg._id, payload)
      toast.success(t('membership.packages.updated'))
    } else {
      await createMembershipPackage(payload)
      toast.success(t('membership.packages.created'))
    }

    emit('saved')
  } catch (error) {
    const msg = error.response?.data?.error
    if (msg === 'PACKAGE_CODE_EXISTS') {
      toast.error(t('membership.packages.codeExists'))
    } else {
      toast.error(t('common.error'))
    }
  } finally {
    processing.value = false
  }
}

onMounted(loadAvailableServices)
</script>
