<template>
  <Modal
    v-model="show"
    :title="$t('billing.cashMovement.title')"
    size="md"
    :close-on-overlay="false"
    @close="close"
  >
    <div class="space-y-4">
      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
          >{{ $t('billing.cashMovement.movementType') }} *</label
        >
        <select
          v-model="form.type"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        >
          <option value="">{{ $t('common.select') }}...</option>
          <option value="deposit">{{ $t('billing.cashMovement.types.deposit') }}</option>
          <option value="payout">{{ $t('billing.cashMovement.types.payout') }}</option>
          <option value="withdrawal">{{ $t('billing.cashMovement.types.withdrawal') }}</option>
          <option value="adjustment">{{ $t('billing.cashMovement.types.adjustment') }}</option>
        </select>
      </div>

      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
          >{{ $t('common.amount') }} *</label
        >
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">TRY</span>
          <input
            v-model.number="form.amount"
            type="number"
            min="0"
            step="0.01"
            class="w-full pl-14 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
          >{{ $t('common.description') }} *</label
        >
        <input
          v-model="form.description"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          :placeholder="$t('billing.cashMovement.descriptionPlaceholder')"
        />
      </div>

      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
          $t('billing.cashMovement.reference')
        }}</label>
        <input
          v-model="form.reference"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          :placeholder="$t('billing.cashMovement.referencePlaceholder')"
        />
      </div>

      <!-- Info Box -->
      <div class="p-3 rounded-lg" :class="movementInfoClass">
        <div class="flex items-center gap-2">
          <span class="material-icons text-sm">{{ movementIcon }}</span>
          <span class="text-sm">{{ movementDescription }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
        :disabled="loading"
        @click="close"
      >
        {{ $t('common.cancel') }}
      </button>
      <button
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        :disabled="loading || !isValid"
        @click="submit"
      >
        <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
        <span v-else class="material-icons text-sm">add</span>
        {{ $t('billing.cashMovement.addMovement') }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import cashierService from '@/services/pms/cashierService'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  hotelId: {
    type: String,
    default: ''
  },
  shiftId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'added'])

const toast = useToast()
const loading = ref(false)

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const defaultForm = () => ({
  type: '',
  amount: 0,
  description: '',
  reference: ''
})

const form = ref(defaultForm())

const isValid = computed(() => {
  return form.value.type && form.value.amount > 0 && form.value.description
})

const movementInfoClass = computed(() => {
  switch (form.value.type) {
    case 'deposit':
      return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
    case 'payout':
    case 'withdrawal':
      return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
    case 'adjustment':
      return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
    default:
      return 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
  }
})

const movementIcon = computed(() => {
  switch (form.value.type) {
    case 'deposit':
      return 'add_circle'
    case 'payout':
    case 'withdrawal':
      return 'remove_circle'
    case 'adjustment':
      return 'tune'
    default:
      return 'help'
  }
})

const movementDescription = computed(() => {
  switch (form.value.type) {
    case 'deposit':
      return t('billing.cashMovement.descriptions.deposit')
    case 'payout':
      return t('billing.cashMovement.descriptions.payout')
    case 'withdrawal':
      return t('billing.cashMovement.descriptions.withdrawal')
    case 'adjustment':
      return t('billing.cashMovement.descriptions.adjustment')
    default:
      return t('billing.cashMovement.descriptions.default')
  }
})

const submit = async () => {
  if (!isValid.value || !props.shiftId) return

  loading.value = true
  try {
    await cashierService.addCashMovement(props.hotelId, props.shiftId, form.value)
    toast.success(t('billing.cashMovement.messages.added'))
    emit('added')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || t('billing.cashMovement.messages.addError'))
  } finally {
    loading.value = false
  }
}

const close = () => {
  show.value = false
  form.value = defaultForm()
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      form.value = defaultForm()
    }
  }
)
</script>
