<template>
  <Modal v-model="isOpen" title="" size="lg" :close-on-overlay="false">
    <!-- Custom Header -->
    <template #header>
      <div class="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-slate-700">
        <!-- Avatar Preview -->
        <div
          class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg"
        >
          {{ avatarInitials }}
        </div>
        <div class="flex-1">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ $t('settings.users.editModal.title') }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {{ user?.email }}
          </p>
        </div>
      </div>
    </template>

    <form class="space-y-6 -mt-2" @submit.prevent="handleSubmit">
      <!-- Section: Kişisel Bilgiler -->
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-4">
          <div
            class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-green-600 dark:text-green-400 text-lg">badge</span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('settings.users.editModal.personalInfo') }}
          </h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ $t('settings.users.editModal.fullName') }} <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >{{ $t('settings.users.editModal.email') }} <span class="text-red-500">*</span></label
            >
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg"
                >email</span
              >
              <input
                v-model="form.email"
                type="email"
                required
                class="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <!-- Phone -->
          <div>
            <PhoneInput
              v-model="form.phone"
              :label="$t('settings.users.editModal.phone')"
              country="TR"
            />
          </div>

          <!-- Language -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{
              $t('settings.users.editModal.language')
            }}</label>
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg"
                >language</span
              >
              <select
                v-model="form.language"
                class="w-full pl-10 pr-8 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="tr">{{ $t('settings.users.editModal.languages.tr') }}</option>
                <option value="en">{{ $t('settings.users.editModal.languages.en') }}</option>
                <option value="de">{{ $t('settings.users.editModal.languages.de') }}</option>
                <option value="ru">{{ $t('settings.users.editModal.languages.ru') }}</option>
                <option value="ar">{{ $t('settings.users.editModal.languages.ar') }}</option>
              </select>
              <span
                class="absolute right-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 pointer-events-none"
                >expand_more</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Görev Bilgileri -->
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-4">
          <div
            class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-purple-600 dark:text-purple-400 text-lg">work</span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('settings.users.editModal.jobInfo') }}
          </h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Department -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ $t('settings.users.editModal.department') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg"
                >apartment</span
              >
              <select
                v-model="form.department"
                class="w-full pl-10 pr-8 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option v-for="dept in departmentOptions" :key="dept.value" :value="dept.value">
                  {{ dept.label }}
                </option>
              </select>
              <span
                class="absolute right-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 pointer-events-none"
                >expand_more</span
              >
            </div>
          </div>

          <!-- Position -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{
              $t('settings.users.editModal.position')
            }}</label>
            <input
              v-model="form.position"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <!-- Role Selection Cards -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ $t('settings.users.editModal.systemRole') }} <span class="text-red-500">*</span>
          </label>
          <div
            v-if="availableRoles.length > 0"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            <button
              v-for="role in availableRoles"
              :key="role.value"
              type="button"
              class="relative p-3 rounded-xl border-2 text-left transition-all"
              :class="getRoleButtonClass(role.value)"
              @click="selectRole(role.value)"
            >
              <div class="flex items-start gap-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  :class="
                    form.role === role.value
                      ? 'bg-indigo-100 dark:bg-indigo-900/40'
                      : 'bg-gray-100 dark:bg-slate-600'
                  "
                >
                  <span
                    class="material-icons"
                    :class="
                      form.role === role.value
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 dark:text-gray-400'
                    "
                    >{{ role.icon }}</span
                  >
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white text-sm">{{ role.label }}</p>
                  <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {{ role.description }}
                  </p>
                </div>
              </div>
              <!-- Check indicator -->
              <div
                v-if="form.role === role.value"
                class="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center"
              >
                <span class="material-icons text-white text-sm">check</span>
              </div>
            </button>
          </div>
          <p v-else class="text-sm text-gray-500 dark:text-slate-400 italic">
            {{ $t('settings.users.editModal.selectDepartmentFirst') }}
          </p>
        </div>
      </div>

      <!-- Active Status Toggle -->
      <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center"
            :class="
              form.isActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-slate-600'
            "
          >
            <span
              class="material-icons"
              :class="form.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'"
              >{{ form.isActive ? 'verified_user' : 'person_off' }}</span
            >
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ $t('settings.users.editModal.accountStatus') }}
            </p>
            <p
              class="text-sm"
              :class="
                form.isActive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-slate-400'
              "
            >
              {{
                form.isActive
                  ? $t('settings.users.editModal.activeCanLogin')
                  : $t('settings.users.editModal.inactiveCannotLogin')
              }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="relative w-14 h-8 rounded-full transition-colors duration-200"
          :class="form.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'"
          @click="form.isActive = !form.isActive"
        >
          <span
            class="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-200"
            :class="form.isActive ? 'left-7' : 'left-1'"
          ></span>
        </button>
      </div>
    </form>

    <template #footer>
      <div
        class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700"
      >
        <p class="text-xs text-gray-500 dark:text-slate-400">
          <span class="text-red-500">*</span> {{ $t('settings.users.editModal.requiredFields') }}
        </p>
        <div class="flex gap-3">
          <button
            type="button"
            class="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
            @click="isOpen = false"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            :disabled="saving"
            class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
            @click="handleSubmit"
          >
            <span v-if="saving" class="animate-spin material-icons text-lg">refresh</span>
            <span v-else class="material-icons text-lg">save</span>
            {{
              saving ? $t('settings.users.editModal.saving') : $t('settings.users.editModal.save')
            }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import adminUserService from '@/services/pms/adminUserService'
import { usePmsStore } from '@/stores/pms'

// Departman ve Rol tanımları
const DEPARTMENTS = [
  { value: 'management', labelKey: 'settings.users.departments.management' },
  { value: 'sales', labelKey: 'settings.users.departments.sales' },
  { value: 'front_office', labelKey: 'settings.users.departments.front_office' },
  { value: 'housekeeping', labelKey: 'settings.users.departments.housekeeping' },
  { value: 'accounting', labelKey: 'settings.users.departments.accounting' },
  { value: 'maintenance', labelKey: 'settings.users.departments.maintenance' }
]

const ROLES_BY_DEPARTMENT = {
  management: [
    {
      value: 'gm',
      labelKey: 'settings.users.roles.gm',
      descKey: 'settings.users.roleDesc.gm',
      icon: 'admin_panel_settings'
    },
    {
      value: 'night_manager',
      labelKey: 'settings.users.roles.night_manager',
      descKey: 'settings.users.roleDesc.night_manager',
      icon: 'nightlight'
    }
  ],
  sales: [
    {
      value: 'sales_manager',
      labelKey: 'settings.users.roles.sales_manager',
      descKey: 'settings.users.roleDesc.sales_manager',
      icon: 'trending_up'
    },
    {
      value: 'reservation_clerk',
      labelKey: 'settings.users.roles.reservation_clerk',
      descKey: 'settings.users.roleDesc.reservation_clerk',
      icon: 'event_note'
    }
  ],
  front_office: [
    {
      value: 'front_desk_manager',
      labelKey: 'settings.users.roles.front_desk_manager',
      descKey: 'settings.users.roleDesc.front_desk_manager',
      icon: 'supervisor_account'
    },
    {
      value: 'receptionist',
      labelKey: 'settings.users.roles.receptionist',
      descKey: 'settings.users.roleDesc.receptionist',
      icon: 'support_agent'
    },
    {
      value: 'bellboy',
      labelKey: 'settings.users.roles.bellboy',
      descKey: 'settings.users.roleDesc.bellboy',
      icon: 'luggage'
    }
  ],
  housekeeping: [
    {
      value: 'housekeeping_manager',
      labelKey: 'settings.users.roles.housekeeping_manager',
      descKey: 'settings.users.roleDesc.housekeeping_manager',
      icon: 'supervisor_account'
    },
    {
      value: 'maid',
      labelKey: 'settings.users.roles.maid',
      descKey: 'settings.users.roleDesc.maid',
      icon: 'cleaning_services'
    }
  ],
  accounting: [
    {
      value: 'accounting_manager',
      labelKey: 'settings.users.roles.accounting_manager',
      descKey: 'settings.users.roleDesc.accounting_manager',
      icon: 'account_balance'
    },
    {
      value: 'purchasing',
      labelKey: 'settings.users.roles.purchasing',
      descKey: 'settings.users.roleDesc.purchasing',
      icon: 'shopping_cart'
    }
  ],
  maintenance: [
    {
      value: 'technical_chief',
      labelKey: 'settings.users.roles.technical_chief',
      descKey: 'settings.users.roleDesc.technical_chief',
      icon: 'engineering'
    },
    {
      value: 'technician',
      labelKey: 'settings.users.roles.technician',
      descKey: 'settings.users.roleDesc.technician',
      icon: 'build'
    }
  ]
}

const DEFAULT_PERMISSIONS = {
  gm: ['*'],
  night_manager: [
    'dashboard.view',
    'roomplan.view',
    'roomplan.edit',
    'reservations.view',
    'reservations.create',
    'reservations.edit',
    'reservations.cancel',
    'frontdesk.checkin',
    'frontdesk.checkout',
    'frontdesk.walkin',
    'frontdesk.roomMove',
    'housekeeping.view',
    'housekeeping.assign',
    'housekeeping.updateStatus',
    'guests.view',
    'guests.edit',
    'guests.create',
    'billing.view',
    'billing.addCharge',
    'billing.payment',
    'billing.invoice',
    'billing.discount',
    'billing.refund',
    'cashier.view',
    'cashier.payment',
    'kbs.view',
    'kbs.send',
    'nightaudit.view',
    'nightaudit.run',
    'reports.operational',
    'reports.financial',
    'reports.export'
  ],
  sales_manager: [
    'dashboard.view',
    'roomplan.view',
    'reservations.view',
    'reservations.create',
    'reservations.edit',
    'reservations.cancel',
    'reservations.rateChange',
    'guests.view',
    'guests.edit',
    'reports.operational',
    'reports.financial',
    'reports.export'
  ],
  reservation_clerk: [
    'dashboard.view',
    'roomplan.view',
    'reservations.view',
    'reservations.create',
    'guests.view'
  ],
  front_desk_manager: [
    'dashboard.view',
    'roomplan.view',
    'roomplan.edit',
    'reservations.view',
    'reservations.create',
    'reservations.edit',
    'reservations.cancel',
    'frontdesk.checkin',
    'frontdesk.checkout',
    'frontdesk.walkin',
    'frontdesk.roomMove',
    'housekeeping.view',
    'guests.view',
    'guests.edit',
    'guests.create',
    'billing.view',
    'billing.addCharge',
    'billing.payment',
    'billing.invoice',
    'billing.discount',
    'billing.refund',
    'billing.close',
    'cashier.view',
    'cashier.payment',
    'kbs.view',
    'kbs.send',
    'reports.operational',
    'reports.financial'
  ],
  receptionist: [
    'dashboard.view',
    'roomplan.view',
    'reservations.view',
    'reservations.create',
    'frontdesk.checkin',
    'frontdesk.checkout',
    'frontdesk.walkin',
    'frontdesk.roomMove',
    'guests.view',
    'guests.edit',
    'billing.view',
    'billing.addCharge',
    'billing.payment',
    'billing.invoice',
    'cashier.view',
    'cashier.payment',
    'kbs.view',
    'kbs.send'
  ],
  bellboy: ['dashboard.view', 'frontdesk.view', 'guests.view'],
  housekeeping_manager: [
    'dashboard.view',
    'housekeeping.view',
    'housekeeping.assign',
    'housekeeping.updateStatus',
    'housekeeping.inspect',
    'housekeeping.lostFound',
    'housekeeping.maintenance',
    'reports.operational'
  ],
  maid: ['dashboard.view', 'housekeeping.view', 'housekeeping.updateOwnStatus'],
  accounting_manager: [
    'dashboard.view',
    'billing.view',
    'billing.invoice',
    'billing.export',
    'cashier.view',
    'cashier.report',
    'nightaudit.view',
    'nightaudit.run',
    'reports.operational',
    'reports.financial',
    'reports.export'
  ],
  purchasing: ['dashboard.view', 'billing.view', 'billing.addExpense'],
  technical_chief: [
    'dashboard.view',
    'frontdesk.roomBlock',
    'housekeeping.view',
    'housekeeping.maintenance',
    'housekeeping.assignMaintenance',
    'reports.operational'
  ],
  technician: ['dashboard.view', 'housekeeping.viewMaintenance', 'housekeeping.closeMaintenance']
}

const props = defineProps({
  modelValue: Boolean,
  user: Object
})

const emit = defineEmits(['update:modelValue', 'updated'])

const { t } = useI18n()
const toast = useToast()
const pmsStore = usePmsStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const saving = ref(false)

// Avatar initials from name
const avatarInitials = computed(() => {
  const name = form.value.name || ''
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase()
  }
  return (name[0] || 'K').toUpperCase() + 'U'
})

// Departman seçenekleri (translated)
const departmentOptions = computed(() => {
  return DEPARTMENTS.map(dept => ({
    value: dept.value,
    label: t(dept.labelKey)
  }))
})

// Seçili departmana göre roller
const availableRoles = computed(() => {
  const dept = form.value.department
  if (!dept || !ROLES_BY_DEPARTMENT[dept]) return []
  return ROLES_BY_DEPARTMENT[dept].map(role => ({
    value: role.value,
    label: t(role.labelKey),
    description: t(role.descKey),
    icon: role.icon
  }))
})

const form = ref({
  name: '',
  email: '',
  phone: '',
  department: 'front_office',
  role: 'receptionist',
  position: '',
  language: 'tr',
  isActive: true,
  pmsHotels: []
})

// Load user data when modal opens
watch(
  () => props.modelValue,
  val => {
    if (val && props.user) {
      form.value = {
        name: props.user.name || '',
        email: props.user.email || '',
        phone: props.user.phone || '',
        department: props.user.pmsDepartment || 'front_office',
        role: props.user.pmsRole || 'receptionist',
        position: props.user.position || '',
        language: props.user.language || 'tr',
        isActive: props.user.status === 'active',
        pmsHotels: props.user.pmsHotels || []
      }
    }
  }
)

// Departman değiştiğinde rolü sıfırla
watch(
  () => form.value.department,
  (newDept, oldDept) => {
    if (newDept && oldDept && newDept !== oldDept && ROLES_BY_DEPARTMENT[newDept]) {
      const firstRole = ROLES_BY_DEPARTMENT[newDept][0]?.value
      form.value.role = firstRole || ''
    }
  }
)

const selectRole = roleValue => {
  form.value.role = roleValue
}

const getRoleButtonClass = roleValue => {
  if (form.value.role === roleValue) {
    return 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
  }
  return 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-700'
}

const handleSubmit = async () => {
  if (!form.value.name?.trim()) {
    toast.error(t('settings.users.editModal.errors.fillRequired'))
    return
  }

  if (!form.value.role) {
    toast.error(t('settings.users.editModal.errors.roleRequired'))
    return
  }

  saving.value = true
  try {
    const updateData = {
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
      pmsDepartment: form.value.department,
      pmsRole: form.value.role,
      pmsPermissions: DEFAULT_PERMISSIONS[form.value.role] || [],
      pmsHotels: form.value.pmsHotels,
      position: form.value.position,
      language: form.value.language,
      status: form.value.isActive ? 'active' : 'inactive'
    }

    await adminUserService.update(props.user._id, updateData)

    toast.success(t('settings.users.editModal.success.userUpdated'))
    emit('updated')
  } catch (error) {
    console.error('Failed to update user:', error)
    toast.error(t('settings.users.editModal.errors.updateFailed'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
