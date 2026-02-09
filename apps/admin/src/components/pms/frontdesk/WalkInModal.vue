<template>
  <Modal v-model="show" :title="$t('frontDesk.walkInModal.title')" size="xl" @close="close">
    <div class="space-y-6">
      <!-- Room Selection -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {{ $t('frontDesk.walkInModal.roomSelection') }}
        </h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              $t('frontDesk.walkInModal.roomType')
            }}</label>
            <select
              v-model="form.roomTypeId"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              @change="filterRooms"
            >
              <option value="">{{ $t('frontDesk.walkInModal.allTypes') }}</option>
              <option v-for="rt in roomTypes" :key="rt._id" :value="rt._id">
                {{ rt.name?.tr || rt.code }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
              >{{ $t('frontDesk.walkInModal.availableRoom') }} *</label
            >
            <select
              v-model="form.roomId"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">{{ $t('common.select') }}</option>
              <option v-for="room in filteredRooms" :key="room._id" :value="room._id">
                {{ room.roomNumber }} - {{ room.roomType?.name?.tr || room.roomType?.code }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Dates -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {{ $t('frontDesk.walkInModal.dates') }}
        </h4>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
              >{{ $t('frontDesk.walkInModal.checkIn') }} *</label
            >
            <input
              v-model="form.checkInDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
              >{{ $t('frontDesk.walkInModal.checkOut') }} *</label
            >
            <input
              v-model="form.checkOutDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              :min="form.checkInDate"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              $t('common.nights')
            }}</label>
            <input
              :value="nights"
              type="text"
              class="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-600 text-gray-900 dark:text-white"
              disabled
            />
          </div>
        </div>
      </div>

      <!-- Main Guest -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {{ $t('frontDesk.walkInModal.mainGuest') }}
        </h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
              >{{ $t('frontDesk.walkInModal.firstName') }} *</label
            >
            <input
              v-model="form.guests[0].firstName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
              >{{ $t('frontDesk.walkInModal.lastName') }} *</label
            >
            <input
              v-model="form.guests[0].lastName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              $t('frontDesk.walkInModal.idType')
            }}</label>
            <select
              v-model="form.guests[0].idType"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="tc_kimlik">{{ $t('frontDesk.walkInModal.idTypes.tcKimlik') }}</option>
              <option value="passport">{{ $t('frontDesk.walkInModal.idTypes.passport') }}</option>
              <option value="driving_license">
                {{ $t('frontDesk.walkInModal.idTypes.drivingLicense') }}
              </option>
              <option value="other">{{ $t('frontDesk.walkInModal.idTypes.other') }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              $t('frontDesk.walkInModal.idNumber')
            }}</label>
            <input
              v-model="form.guests[0].idNumber"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <PhoneInput v-model="form.guests[0].phone" :label="$t('common.phone')" country="TR" />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              $t('common.email')
            }}</label>
            <input
              v-model="form.guests[0].email"
              type="email"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <!-- Occupancy -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {{ $t('frontDesk.walkInModal.occupancy') }}
        </h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              $t('frontDesk.walkInModal.adults')
            }}</label>
            <input
              v-model.number="form.adultsCount"
              type="number"
              min="1"
              max="10"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              $t('frontDesk.walkInModal.children')
            }}</label>
            <input
              v-model.number="form.childrenCount"
              type="number"
              min="0"
              max="10"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <!-- Pricing -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {{ $t('frontDesk.walkInModal.pricing') }}
        </h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
              >{{ $t('frontDesk.walkInModal.totalRate') }} *</label
            >
            <input
              v-model.number="form.roomRate"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              $t('frontDesk.walkInModal.deposit')
            }}</label>
            <input
              v-model.number="form.paymentAmount"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div v-if="form.paymentAmount > 0" class="mt-3">
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
            $t('frontDesk.walkInModal.paymentMethod')
          }}</label>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="method in paymentMethods"
              :key="method.value"
              class="flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer"
              :class="
                form.paymentMethod === method.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-slate-600'
              "
            >
              <input
                v-model="form.paymentMethod"
                type="radio"
                :value="method.value"
                class="hidden"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ method.label }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Special Requests -->
      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
          $t('frontDesk.walkInModal.specialRequests')
        }}</label>
        <textarea
          v-model="form.specialRequests"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          :placeholder="$t('frontDesk.walkInModal.specialRequestsPlaceholder')"
        ></textarea>
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
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        :disabled="loading || !isValid"
        @click="submit"
      >
        <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
        <span v-else class="material-icons text-sm">login</span>
        {{ $t('frontDesk.walkInModal.doCheckIn') }}
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
import stayService, { PAYMENT_METHODS } from '@/services/pms/stayService'
import roomService from '@/services/pms/roomService'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  hotelId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'created'])

const toast = useToast()
const loading = ref(false)
const roomTypes = ref([])
const availableRooms = ref([])

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const paymentMethods = PAYMENT_METHODS

const defaultForm = () => ({
  roomId: '',
  roomTypeId: '',
  checkInDate: new Date().toISOString().split('T')[0],
  checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  guests: [
    {
      firstName: '',
      lastName: '',
      idType: 'tc_kimlik',
      idNumber: '',
      phone: '',
      email: '',
      isMainGuest: true
    }
  ],
  adultsCount: 1,
  childrenCount: 0,
  roomRate: 0,
  paymentAmount: 0,
  paymentMethod: 'cash',
  specialRequests: ''
})

const form = ref(defaultForm())

const nights = computed(() => {
  if (!form.value.checkInDate || !form.value.checkOutDate) return 0
  const checkIn = new Date(form.value.checkInDate)
  const checkOut = new Date(form.value.checkOutDate)
  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
})

const filteredRooms = computed(() => {
  if (!form.value.roomTypeId) return availableRooms.value
  return availableRooms.value.filter(r => r.roomType?._id === form.value.roomTypeId)
})

const isValid = computed(() => {
  return (
    form.value.roomId &&
    form.value.checkInDate &&
    form.value.checkOutDate &&
    nights.value > 0 &&
    form.value.guests[0].firstName &&
    form.value.guests[0].lastName &&
    form.value.roomRate > 0
  )
})

const filterRooms = () => {
  form.value.roomId = ''
}

const fetchData = async () => {
  if (!props.hotelId) return

  try {
    const [roomTypesRes, roomsRes] = await Promise.all([
      roomService.getRoomTypes(props.hotelId),
      stayService.getAvailableRooms(props.hotelId)
    ])

    roomTypes.value = roomTypesRes.data || []
    availableRooms.value = roomsRes.data || []
  } catch (error) {
    console.error('Failed to fetch data:', error)
  }
}

const submit = async () => {
  if (!isValid.value) return

  loading.value = true
  try {
    await stayService.walkInCheckIn(props.hotelId, {
      roomId: form.value.roomId,
      checkInDate: form.value.checkInDate,
      checkOutDate: form.value.checkOutDate,
      guests: form.value.guests,
      adultsCount: form.value.adultsCount,
      childrenCount: form.value.childrenCount,
      roomRate: form.value.roomRate,
      paymentAmount: form.value.paymentAmount,
      paymentMethod: form.value.paymentMethod,
      specialRequests: form.value.specialRequests
    })

    toast.success(t('frontDesk.walkInModal.success'))
    emit('created')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || t('frontDesk.walkInModal.error'))
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
      fetchData()
    }
  }
)
</script>
