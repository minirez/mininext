<template>
  <Modal
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :title="isEdit ? $t('membership.services.editService') : $t('membership.services.newService')"
    size="lg"
  >
    <div class="space-y-4">
      <!-- Name (i18n) -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">{{ $t('membership.services.name') }} (TR) *</label>
          <input v-model="form.name.tr" type="text" class="form-input" required />
        </div>
        <div>
          <label class="form-label">{{ $t('membership.services.name') }} (EN) *</label>
          <input v-model="form.name.en" type="text" class="form-input" required />
        </div>
      </div>

      <!-- Description (i18n) -->
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

      <!-- Code + Category -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">{{ $t('membership.services.code') }} *</label>
          <input
            v-model="form.code"
            type="text"
            class="form-input"
            :placeholder="$t('membership.services.codePlaceholder')"
            :disabled="isEdit"
          />
        </div>
        <div>
          <label class="form-label">{{ $t('membership.services.category') }} *</label>
          <select v-model="form.category" class="form-input">
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ $t(`membership.categories.${cat}`) }}
            </option>
          </select>
        </div>
      </div>

      <!-- Billing Type + Interval -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">{{ $t('membership.services.billingType') }} *</label>
          <div class="flex gap-4 mt-1">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.billingType" type="radio" value="one_time" class="form-radio" />
              <span>{{ $t('membership.billingTypes.one_time') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.billingType" type="radio" value="recurring" class="form-radio" />
              <span>{{ $t('membership.billingTypes.recurring') }}</span>
            </label>
          </div>
        </div>
        <div v-if="form.billingType === 'recurring'">
          <label class="form-label">{{ $t('membership.services.interval') }}</label>
          <select v-model="form.interval" class="form-input">
            <option value="monthly">{{ $t('membership.intervals.monthly') }}</option>
            <option value="yearly">{{ $t('membership.intervals.yearly') }}</option>
          </select>
        </div>
      </div>

      <!-- Prices Grid -->
      <div>
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

      <!-- Features (key-value) -->
      <div>
        <label class="form-label">{{ $t('membership.services.features') }}</label>
        <div v-for="(feat, idx) in form.features" :key="idx" class="flex items-center gap-2 mb-2">
          <input
            v-model="feat.key"
            type="text"
            class="form-input flex-1"
            :placeholder="$t('membership.services.featureKey')"
          />
          <input
            v-model="feat.value"
            type="text"
            class="form-input flex-1"
            :placeholder="$t('membership.services.featureValue')"
          />
          <button class="p-1 text-red-500 hover:text-red-600" @click="form.features.splice(idx, 1)">
            <span class="material-icons text-lg">close</span>
          </button>
        </div>
        <button
          class="text-sm text-purple-600 dark:text-purple-400 hover:underline"
          @click="form.features.push({ key: '', value: '' })"
        >
          + {{ $t('membership.services.addFeature') }}
        </button>
      </div>

      <!-- Icon + Sort + Status -->
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="form-label">{{ $t('membership.services.icon') }}</label>
          <input v-model="form.icon" type="text" class="form-input" placeholder="cube" />
        </div>
        <div>
          <label class="form-label">{{ $t('membership.services.sortOrder') }}</label>
          <input v-model.number="form.sortOrder" type="number" class="form-input" />
        </div>
        <div>
          <label class="form-label">{{ $t('membership.services.status') }}</label>
          <select v-model="form.status" class="form-input">
            <option value="active">{{ $t('membership.statuses.active') }}</option>
            <option value="inactive">{{ $t('membership.statuses.inactive') }}</option>
          </select>
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
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import {
  createMembershipService,
  updateMembershipService
} from '@/services/membershipServiceService'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  modelValue: Boolean,
  service: Object
})
const emit = defineEmits(['update:modelValue', 'saved'])

const { t } = useI18n()
const toast = useToast()

const categories = ['payment', 'booking', 'pms', 'web', 'design', 'support', 'integration', 'other']
const currencies = ['TRY', 'USD', 'EUR', 'GBP']

const processing = ref(false)
const isEdit = computed(() => !!props.service)

const defaultForm = () => ({
  name: { tr: '', en: '' },
  description: { tr: '', en: '' },
  code: '',
  category: 'other',
  billingType: 'one_time',
  interval: 'yearly',
  prices: { TRY: null, USD: null, EUR: null, GBP: null },
  features: [],
  icon: 'cube',
  sortOrder: 0,
  status: 'active'
})

const form = ref(defaultForm())

const isValid = computed(
  () => form.value.name.tr && form.value.name.en && form.value.code && form.value.category
)

// Watch for service changes to populate form
watch(
  () => props.service,
  svc => {
    if (svc) {
      const pricesMap = {}
      currencies.forEach(c => {
        pricesMap[c] = null
      })
      svc.pricing?.prices?.forEach(p => {
        pricesMap[p.currency] = p.amount
      })

      const features = []
      if (svc.features) {
        const featObj =
          svc.features instanceof Map ? Object.fromEntries(svc.features) : svc.features
        Object.entries(featObj).forEach(([key, value]) => {
          features.push({ key, value: String(value) })
        })
      }

      form.value = {
        name: { tr: svc.name?.tr || '', en: svc.name?.en || '' },
        description: { tr: svc.description?.tr || '', en: svc.description?.en || '' },
        code: svc.code || '',
        category: svc.category || 'other',
        billingType: svc.pricing?.billingType || 'one_time',
        interval: svc.pricing?.interval || 'yearly',
        prices: pricesMap,
        features,
        icon: svc.icon || 'cube',
        sortOrder: svc.sortOrder || 0,
        status: svc.status || 'active'
      }
    } else {
      form.value = defaultForm()
    }
  },
  { immediate: true }
)

const handleSave = async () => {
  processing.value = true
  try {
    // Build prices array
    const prices = currencies
      .filter(c => form.value.prices[c] != null && form.value.prices[c] > 0)
      .map(c => ({ currency: c, amount: form.value.prices[c] }))

    // Build features object
    const features = {}
    form.value.features.forEach(f => {
      if (f.key) {
        // Try to parse as number/boolean
        let val = f.value
        if (val === 'true') val = true
        else if (val === 'false') val = false
        else if (!isNaN(val) && val !== '') val = Number(val)
        features[f.key] = val
      }
    })

    const payload = {
      name: form.value.name,
      description: form.value.description,
      code: form.value.code,
      category: form.value.category,
      pricing: {
        billingType: form.value.billingType,
        interval: form.value.billingType === 'recurring' ? form.value.interval : undefined,
        prices
      },
      features,
      icon: form.value.icon,
      sortOrder: form.value.sortOrder,
      status: form.value.status
    }

    if (isEdit.value) {
      await updateMembershipService(props.service._id, payload)
      toast.success(t('membership.services.updated'))
    } else {
      await createMembershipService(payload)
      toast.success(t('membership.services.created'))
    }

    emit('saved')
  } catch (error) {
    const msg = error.response?.data?.error
    if (msg === 'SERVICE_CODE_EXISTS') {
      toast.error(t('membership.services.codeExists'))
    } else {
      toast.error(t('common.error'))
    }
  } finally {
    processing.value = false
  }
}
</script>
