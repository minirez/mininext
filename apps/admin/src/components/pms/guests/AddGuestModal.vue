<template>
  <Modal
    v-model="show"
    :title="isEditMode ? t('guests.modal.editGuest') : t('guests.modal.newGuest')"
    size="lg"
    :close-on-overlay="false"
    @close="close"
  >
    <div class="space-y-6">
      <!-- Basic Info -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {{ t('guests.modal.personalInfo') }}
        </h4>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              t('guests.modal.fields.title')
            }}</label>
            <select
              v-model="form.title"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option v-for="t in titleOptions" :key="t.value" :value="t.value">
                {{ t.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
              >{{ t('guests.modal.fields.firstName') }} *</label
            >
            <input
              v-model="form.firstName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
              >{{ t('guests.modal.fields.lastName') }} *</label
            >
            <input
              v-model="form.lastName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              t('guests.modal.fields.dateOfBirth')
            }}</label>
            <input
              v-model="form.dateOfBirth"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              t('guests.modal.fields.gender')
            }}</label>
            <select
              v-model="form.gender"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option v-for="g in genderOptions" :key="g.value" :value="g.value">
                {{ g.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              t('guests.modal.fields.nationality')
            }}</label>
            <input
              v-model="form.nationality"
              type="text"
              placeholder="TR"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 uppercase"
            />
          </div>
        </div>
      </div>

      <!-- ID Info -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {{ t('guests.modal.identityInfo') }}
        </h4>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              t('guests.modal.fields.idType')
            }}</label>
            <select
              v-model="form.idType"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option v-for="t in idTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              t('guests.modal.fields.idNumber')
            }}</label>
            <input
              v-model="form.idNumber"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              t('guests.modal.fields.idExpiry')
            }}</label>
            <input
              v-model="form.idExpiry"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <!-- Contact Info -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {{ t('guests.modal.contactInfo') }}
        </h4>
        <div class="grid grid-cols-2 gap-4">
          <PhoneInput v-model="form.phone" :label="t('guests.modal.fields.phone')" country="TR" />
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              t('guests.modal.fields.email')
            }}</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <PhoneInput
            v-model="form.whatsapp"
            :label="t('guests.modal.fields.whatsapp')"
            country="TR"
          />
          <PhoneInput
            v-model="form.alternatePhone"
            :label="t('guests.modal.fields.alternatePhone')"
            country="TR"
          />
        </div>
      </div>

      <!-- Address -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {{ t('guests.modal.address') }}
        </h4>
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              t('guests.modal.fields.street')
            }}</label>
            <input
              v-model="form.address.street"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              t('guests.modal.fields.city')
            }}</label>
            <input
              v-model="form.address.city"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              t('guests.modal.fields.country')
            }}</label>
            <input
              v-model="form.address.country"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <!-- Company Info (Optional) -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {{ t('guests.modal.companyInfo') }}
        </h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              t('guests.modal.fields.companyName')
            }}</label>
            <input
              v-model="form.company.name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              t('guests.modal.fields.position')
            }}</label>
            <input
              v-model="form.company.position"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
        :disabled="loading"
        @click="close"
      >
        {{ t('common.cancel') }}
      </button>
      <button
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        :disabled="loading || !isValid"
        @click="submit"
      >
        <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
        <span v-else class="material-icons text-sm">{{ isEditMode ? 'save' : 'person_add' }}</span>
        {{ isEditMode ? t('common.save') : t('guests.modal.createGuest') }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import guestService, { ID_TYPES, TITLE_OPTIONS, GENDER_OPTIONS } from '@/services/pms/guestService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  hotelId: {
    type: String,
    default: ''
  },
  guest: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'created', 'updated'])

const isEditMode = computed(() => !!props.guest)

const { t, locale } = useI18n()
const toast = useToast()
const localeMap = { tr: 'tr-TR', en: 'en-US' }
const loading = ref(false)

const titleOptions = TITLE_OPTIONS
const genderOptions = GENDER_OPTIONS
const idTypes = ID_TYPES

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const defaultForm = () => ({
  title: 'mr',
  firstName: '',
  lastName: '',
  gender: 'prefer_not_to_say',
  dateOfBirth: '',
  nationality: 'TR',
  idType: 'tc_kimlik',
  idNumber: '',
  idExpiry: '',
  phone: '',
  email: '',
  whatsapp: '',
  alternatePhone: '',
  address: {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  },
  company: {
    name: '',
    position: '',
    taxNumber: ''
  }
})

const form = ref(defaultForm())

const isValid = computed(() => {
  return form.value.firstName && form.value.lastName
})

const submit = async () => {
  if (!isValid.value) return

  loading.value = true
  try {
    if (isEditMode.value) {
      await guestService.update(props.hotelId, props.guest._id, form.value)
      toast.success(t('guests.messages.guestUpdated'))
      emit('updated')
    } else {
      await guestService.create(props.hotelId, form.value)
      toast.success(t('guests.messages.guestCreated'))
      emit('created')
    }
    close()
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        (isEditMode.value ? t('guests.messages.updateError') : t('guests.messages.createError'))
    )
  } finally {
    loading.value = false
  }
}

const close = () => {
  show.value = false
  form.value = defaultForm()
}

// Helper to format date for input
const formatDateForInput = date => {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      if (props.guest) {
        // Edit mode - populate form with guest data
        form.value = {
          title: props.guest.title || 'mr',
          firstName: props.guest.firstName || '',
          lastName: props.guest.lastName || '',
          gender: props.guest.gender || 'prefer_not_to_say',
          dateOfBirth: formatDateForInput(props.guest.dateOfBirth),
          nationality: props.guest.nationality || 'TR',
          idType: props.guest.idType || 'tc_kimlik',
          idNumber: props.guest.idNumber || '',
          idExpiry: formatDateForInput(props.guest.idExpiry),
          phone: props.guest.phone || '',
          email: props.guest.email || '',
          whatsapp: props.guest.whatsapp || '',
          alternatePhone: props.guest.alternatePhone || '',
          address: {
            street: props.guest.address?.street || '',
            city: props.guest.address?.city || '',
            state: props.guest.address?.state || '',
            postalCode: props.guest.address?.postalCode || '',
            country: props.guest.address?.country || ''
          },
          company: {
            name: props.guest.company?.name || '',
            position: props.guest.company?.position || '',
            taxNumber: props.guest.company?.taxNumber || ''
          }
        }
      } else {
        form.value = defaultForm()
      }
    }
  }
)
</script>
