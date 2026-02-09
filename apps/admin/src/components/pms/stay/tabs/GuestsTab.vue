<template>
  <div class="space-y-4">
    <!-- Guest Count Summary -->
    <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-indigo-600 dark:text-indigo-400">groups</span>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ t('stayCard.guests.totalGuests') }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ guestCount.adults }} {{ t('stayCard.adults') }}
              <span v-if="guestCount.children"
                >, {{ guestCount.children }} {{ t('stayCard.children') }}</span
              >
            </p>
          </div>
        </div>
        <span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{
          guestCount.total
        }}</span>
      </div>
    </div>

    <!-- Guests List -->
    <div v-if="stay?.guests?.length" class="space-y-3">
      <div
        v-for="(guest, index) in stay.guests"
        :key="index"
        class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4"
        :class="{ 'ring-2 ring-indigo-500': guest.isMainGuest }"
      >
        <!-- Guest Header -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="
                guest.isMainGuest
                  ? 'bg-indigo-100 dark:bg-indigo-900/30'
                  : 'bg-gray-100 dark:bg-slate-700'
              "
            >
              <span
                class="material-icons"
                :class="
                  guest.isMainGuest
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-slate-400'
                "
              >
                {{ guest.type === 'child' ? 'child_care' : 'person' }}
              </span>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                {{ guest.firstName }} {{ guest.lastName }}
                <span
                  v-if="guest.isMainGuest"
                  class="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium"
                >
                  {{ t('stayCard.guests.mainGuest') }}
                </span>
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{
                  guest.type === 'child' ? t('stayCard.guests.child') : t('stayCard.guests.adult')
                }}
                <span v-if="guest.age"> - {{ guest.age }} {{ t('stayCard.guests.yearsOld') }}</span>
              </p>
            </div>
          </div>

          <!-- KBS Status -->
          <div v-if="guest.kbsStatus" class="flex items-center gap-1">
            <span
              class="w-2 h-2 rounded-full"
              :class="{
                'bg-green-500': guest.kbsStatus === 'sent',
                'bg-amber-500': guest.kbsStatus === 'pending',
                'bg-red-500': guest.kbsStatus === 'failed'
              }"
            ></span>
            <span class="text-xs text-gray-500 dark:text-slate-400">
              {{ getKbsStatusLabel(guest.kbsStatus) }}
            </span>
          </div>
        </div>

        <!-- Guest Details -->
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div v-if="guest.idNumber || guest.passportNumber">
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{
                guest.idType === 'passport'
                  ? t('stayCard.guests.passportNo')
                  : t('stayCard.guests.idNo')
              }}
            </p>
            <p class="text-gray-900 dark:text-white font-mono">
              {{ guest.idNumber || guest.passportNumber }}
            </p>
          </div>

          <div v-if="guest.nationality">
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ t('stayCard.nationality') }}</p>
            <p class="text-gray-900 dark:text-white">{{ guest.nationality }}</p>
          </div>

          <div v-if="guest.phone">
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ t('stayCard.phone') }}</p>
            <p class="text-gray-900 dark:text-white">
              <a
                :href="'tel:' + guest.phone"
                class="hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {{ guest.phone }}
              </a>
            </p>
          </div>

          <div v-if="guest.email">
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ t('stayCard.email') }}</p>
            <p class="text-gray-900 dark:text-white truncate">
              <a
                :href="'mailto:' + guest.email"
                class="hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {{ guest.email }}
              </a>
            </p>
          </div>

          <div v-if="guest.dateOfBirth">
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ t('stayCard.guests.birthDate') }}
            </p>
            <p class="text-gray-900 dark:text-white">{{ formatDate(guest.dateOfBirth) }}</p>
          </div>

          <div v-if="guest.gender">
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ t('stayCard.guests.genderLabel') }}
            </p>
            <p class="text-gray-900 dark:text-white">{{ getGenderLabel(guest.gender) }}</p>
          </div>
        </div>

        <!-- Guest Actions -->
        <div class="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
          <button
            class="px-2 py-1 text-xs text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
            @click="openEditModal(index)"
          >
            <span class="material-icons text-xs">edit</span>
            {{ t('common.edit') }}
          </button>
          <button
            v-if="!guest.isMainGuest"
            class="px-2 py-1 text-xs text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
            @click="emit('set-main-guest', index)"
          >
            <span class="material-icons text-xs">star</span>
            {{ t('stayCard.guests.makeMainGuest') }}
          </button>
          <button
            v-if="!guest.isMainGuest && stay.guests.length > 1"
            class="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex items-center gap-1"
            @click="confirmRemoveGuest(index)"
          >
            <span class="material-icons text-xs">delete</span>
            {{ t('common.delete') }}
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
      <span class="material-icons text-4xl mb-2 opacity-50">person_off</span>
      <p class="text-sm">{{ t('stayCard.guests.noGuests') }}</p>
    </div>

    <!-- Add Guest Button -->
    <button
      class="w-full py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl text-gray-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"
      @click="openAddModal"
    >
      <span class="material-icons text-sm">person_add</span>
      {{ t('stayCard.guests.addGuest') }}
    </button>

    <!-- Add/Edit Guest Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div
        class="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div
          class="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{
              editingIndex !== null ? t('stayCard.guests.editGuest') : t('stayCard.guests.addGuest')
            }}
          </h3>
          <button
            class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
            @click="closeModal"
          >
            <span class="material-icons">close</span>
          </button>
        </div>

        <form @submit.prevent="saveGuest" class="p-4 space-y-4">
          <!-- Name Row -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                {{ t('stayCard.guests.firstName') }} *
              </label>
              <input
                v-model="form.firstName"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                {{ t('stayCard.guests.lastName') }} *
              </label>
              <input
                v-model="form.lastName"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <!-- Type & Nationality -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                {{ t('stayCard.guests.guestType') }}
              </label>
              <select
                v-model="form.type"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="adult">{{ t('stayCard.guests.adult') }}</option>
                <option value="child">{{ t('stayCard.guests.child') }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                {{ t('stayCard.nationality') }}
              </label>
              <input
                v-model="form.nationality"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <!-- ID Type & Number -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                {{ t('stayCard.guests.idType') }}
              </label>
              <select
                v-model="form.idType"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="tc_kimlik">{{ t('stayCard.guests.tcKimlik') }}</option>
                <option value="passport">{{ t('stayCard.guests.passport') }}</option>
                <option value="driving_license">{{ t('stayCard.guests.drivingLicense') }}</option>
                <option value="other">{{ t('stayCard.guests.other') }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                {{ t('stayCard.guests.idNumber') }}
              </label>
              <input
                v-model="form.idNumber"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <!-- Contact -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                {{ t('stayCard.phone') }}
              </label>
              <input
                v-model="form.phone"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                {{ t('stayCard.email') }}
              </label>
              <input
                v-model="form.email"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <!-- Birth Date & Gender -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                {{ t('stayCard.guests.birthDate') }}
              </label>
              <input
                v-model="form.dateOfBirth"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                {{ t('stayCard.guests.genderLabel') }}
              </label>
              <select
                v-model="form.gender"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-</option>
                <option value="male">{{ t('stayCard.guests.gender.male') }}</option>
                <option value="female">{{ t('stayCard.guests.gender.female') }}</option>
              </select>
            </div>
          </div>

          <!-- KBS Fields (for Turkish citizens) -->
          <div
            v-if="form.idType === 'tc_kimlik'"
            class="space-y-3 pt-3 border-t border-gray-200 dark:border-slate-700"
          >
            <p class="text-xs font-medium text-gray-500 dark:text-slate-400">
              {{ t('stayCard.guests.kbsFields') }}
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                  {{ t('stayCard.guests.fatherName') }}
                </label>
                <input
                  v-model="form.fatherName"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                  {{ t('stayCard.guests.motherName') }}
                </label>
                <input
                  v-model="form.motherName"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                {{ t('stayCard.guests.birthPlace') }}
              </label>
              <input
                v-model="form.birthPlace"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              class="px-4 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              @click="closeModal"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <span v-if="saving" class="material-icons text-sm animate-spin">sync</span>
              {{ editingIndex !== null ? t('common.save') : t('common.add') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const props = defineProps({
  stay: Object,
  saving: Boolean
})

const emit = defineEmits(['add-guest', 'update-guest', 'remove-guest', 'set-main-guest'])

const showModal = ref(false)
const editingIndex = ref(null)
const form = ref(getEmptyForm())

function getEmptyForm() {
  return {
    firstName: '',
    lastName: '',
    type: 'adult',
    nationality: '',
    idType: 'tc_kimlik',
    idNumber: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    fatherName: '',
    motherName: '',
    birthPlace: ''
  }
}

const guestCount = computed(() => {
  if (!props.stay) return { adults: 0, children: 0, total: 0 }

  if (props.stay.guests?.length) {
    const adults = props.stay.guests.filter(g => g.type !== 'child').length
    const children = props.stay.guests.filter(g => g.type === 'child').length
    return { adults, children, total: adults + children }
  }

  const adults = props.stay.adultsCount || 1
  const children = props.stay.childrenCount || 0
  return { adults, children, total: adults + children }
})

const openAddModal = () => {
  form.value = getEmptyForm()
  editingIndex.value = null
  showModal.value = true
}

const openEditModal = index => {
  const guest = props.stay.guests[index]
  form.value = {
    firstName: guest.firstName || '',
    lastName: guest.lastName || '',
    type: guest.type || 'adult',
    nationality: guest.nationality || '',
    idType: guest.idType || 'tc_kimlik',
    idNumber: guest.idNumber || '',
    phone: guest.phone || '',
    email: guest.email || '',
    dateOfBirth: guest.dateOfBirth ? guest.dateOfBirth.split('T')[0] : '',
    gender: guest.gender || '',
    fatherName: guest.fatherName || '',
    motherName: guest.motherName || '',
    birthPlace: guest.birthPlace || ''
  }
  editingIndex.value = index
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingIndex.value = null
  form.value = getEmptyForm()
}

const saveGuest = () => {
  const guestData = { ...form.value }
  // Clean empty values
  Object.keys(guestData).forEach(key => {
    if (guestData[key] === '') delete guestData[key]
  })

  if (editingIndex.value !== null) {
    emit('update-guest', editingIndex.value, guestData)
  } else {
    emit('add-guest', guestData)
  }
  closeModal()
}

const confirmRemoveGuest = index => {
  const guest = props.stay.guests[index]
  if (
    confirm(t('stayCard.guests.confirmRemove', { name: `${guest.firstName} ${guest.lastName}` }))
  ) {
    emit('remove-guest', index)
  }
}

const getKbsStatusLabel = status => {
  return t(`stayCard.guests.kbsStatus.${status}`)
}

const getGenderLabel = gender => {
  return t(`stayCard.guests.gender.${gender}`)
}

const localeMap = { tr: 'tr-TR', en: 'en-US' }

const formatDate = dateStr => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString(localeMap[locale.value] || 'tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}
</script>
