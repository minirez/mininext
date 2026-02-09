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
            {{ $t('settings.users.addModal.title') }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            <span class="inline-flex items-center gap-1">
              <span class="material-icons text-sm">business</span>
              {{ hotels[0]?.name || $t('settings.users.addModal.hotel') }}
            </span>
          </p>
        </div>
      </div>
    </template>

    <form class="space-y-6 -mt-2" @submit.prevent="handleSubmit">
      <!-- Section: Hesap Bilgileri -->
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-4">
          <div
            class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-indigo-600 dark:text-indigo-400 text-lg"
              >account_circle</span
            >
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('settings.users.addModal.accountInfo') }}
          </h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Email (identifier) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ $t('settings.users.addModal.email') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-lg"
                :class="errors.email ? 'text-red-400' : 'text-gray-400'"
                >email</span
              >
              <input
                v-model="form.email"
                type="email"
                autocomplete="off"
                class="w-full pl-10 pr-3 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                :class="
                  errors.email
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-300 dark:border-slate-600'
                "
                :placeholder="$t('settings.users.addModal.placeholders.email')"
                @blur="validateField('email')"
                @input="clearError('email')"
              />
            </div>
            <p v-if="errors.email" class="mt-1 text-sm text-red-500 flex items-center gap-1">
              <span class="material-icons text-sm">error</span>
              {{ errors.email }}
            </p>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ $t('settings.users.addModal.password') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-lg"
                :class="errors.password ? 'text-red-400' : 'text-gray-400'"
                >lock</span
              >
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                class="w-full pl-10 pr-20 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                :class="
                  errors.password
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-300 dark:border-slate-600'
                "
                :placeholder="$t('settings.users.addModal.placeholders.password')"
                @blur="validateField('password')"
                @input="clearError('password')"
              />
              <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                  :title="$t('settings.users.addModal.generatePassword')"
                  @click="generatePassword"
                >
                  <span class="material-icons text-lg">auto_awesome</span>
                </button>
                <button
                  type="button"
                  class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                  @click="showPassword = !showPassword"
                >
                  <span class="material-icons text-lg">{{
                    showPassword ? 'visibility_off' : 'visibility'
                  }}</span>
                </button>
              </div>
            </div>
            <p v-if="errors.password" class="mt-1 text-sm text-red-500 flex items-center gap-1">
              <span class="material-icons text-sm">error</span>
              {{ errors.password }}
            </p>
          </div>
        </div>
      </div>

      <!-- Section: Kisisel Bilgiler -->
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-4">
          <div
            class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-green-600 dark:text-green-400 text-lg">badge</span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('settings.users.addModal.personalInfo') }}
          </h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ $t('settings.users.addModal.fullName') }} <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              class="w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              :class="
                errors.name
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                  : 'border-gray-300 dark:border-slate-600'
              "
              :placeholder="$t('settings.users.addModal.placeholders.fullName')"
              @blur="validateField('name')"
              @input="clearError('name')"
            />
            <p v-if="errors.name" class="mt-1 text-sm text-red-500 flex items-center gap-1">
              <span class="material-icons text-sm">error</span>
              {{ errors.name }}
            </p>
          </div>

          <!-- Phone -->
          <div>
            <PhoneInput
              v-model="form.phone"
              :label="$t('settings.users.addModal.phone')"
              country="TR"
            />
          </div>
        </div>
      </div>

      <!-- Section: Gorev Bilgileri -->
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-4">
          <div
            class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-purple-600 dark:text-purple-400 text-lg">work</span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('settings.users.addModal.jobInfo') }}
          </h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Department -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ $t('settings.users.addModal.department') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-lg"
                :class="errors.department ? 'text-red-400' : 'text-gray-400'"
                >apartment</span
              >
              <select
                v-model="form.department"
                class="w-full pl-10 pr-8 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                :class="
                  errors.department
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-300 dark:border-slate-600'
                "
                @change="clearError('department')"
              >
                <option value="">{{ $t('settings.users.addModal.selectDepartment') }}</option>
                <option v-for="dept in departments" :key="dept.value" :value="dept.value">
                  {{ dept.label }}
                </option>
              </select>
              <span
                class="absolute right-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 pointer-events-none"
                >expand_more</span
              >
            </div>
            <p v-if="errors.department" class="mt-1 text-sm text-red-500 flex items-center gap-1">
              <span class="material-icons text-sm">error</span>
              {{ errors.department }}
            </p>
          </div>

          <!-- Position -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{
              $t('settings.users.addModal.position')
            }}</label>
            <input
              v-model="form.position"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              :placeholder="$t('settings.users.addModal.placeholders.position')"
            />
          </div>
        </div>

        <!-- Role Selection Cards -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ $t('settings.users.addModal.systemRole') }} <span class="text-red-500">*</span>
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
                    selectedRole === role.value
                      ? 'bg-indigo-100 dark:bg-indigo-900/40'
                      : 'bg-gray-100 dark:bg-slate-600'
                  "
                >
                  <span
                    class="material-icons"
                    :class="
                      selectedRole === role.value
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
                v-if="selectedRole === role.value"
                class="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center"
              >
                <span class="material-icons text-white text-sm">check</span>
              </div>
            </button>
          </div>
          <p v-else class="text-sm text-gray-500 dark:text-slate-400 italic">
            {{ $t('settings.users.addModal.selectDepartmentFirst') }}
          </p>
          <p v-if="errors.role" class="mt-2 text-sm text-red-500 flex items-center gap-1">
            <span class="material-icons text-sm">error</span>
            {{ errors.role }}
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
              {{ $t('settings.users.addModal.accountStatus') }}
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
                  ? $t('settings.users.addModal.activeCanLogin')
                  : $t('settings.users.addModal.inactiveCannotLogin')
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

      <!-- Validation Summary -->
      <div
        v-if="showValidationSummary && hasErrors"
        class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
      >
        <div class="flex items-start gap-3">
          <span class="material-icons text-red-500 mt-0.5">warning</span>
          <div>
            <p class="font-medium text-red-800 dark:text-red-200">
              {{ $t('settings.users.addModal.fillRequired') }}
            </p>
            <ul class="mt-1 text-sm text-red-600 dark:text-red-300 list-disc list-inside">
              <li v-if="errors.email">{{ $t('settings.users.addModal.email') }}</li>
              <li v-if="errors.password">{{ $t('settings.users.addModal.password') }}</li>
              <li v-if="errors.name">{{ $t('settings.users.addModal.fullName') }}</li>
              <li v-if="errors.department">{{ $t('settings.users.addModal.department') }}</li>
              <li v-if="errors.role">{{ $t('settings.users.addModal.systemRole') }}</li>
            </ul>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div
        class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700"
      >
        <p class="text-xs text-gray-500 dark:text-slate-400">
          <span class="text-red-500">*</span> {{ $t('settings.users.addModal.requiredFields') }}
        </p>
        <div class="flex gap-3">
          <button
            type="button"
            class="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
            @click="handleCancel"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            :disabled="saving"
            class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
            @click="handleSubmit"
          >
            <span v-if="saving" class="animate-spin material-icons text-lg">refresh</span>
            <span v-else class="material-icons text-lg">person_add</span>
            {{
              saving ? $t('settings.users.addModal.saving') : $t('settings.users.addModal.addStaff')
            }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import adminUserService from '@/services/pms/adminUserService'

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

// Rol bazlı varsayılan yetkiler
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
  hotels: Array
})

const emit = defineEmits(['update:modelValue', 'created'])

const { t } = useI18n()
const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

// Get hotels array safely
const hotels = computed(() => props.hotels || [])

// Departmanlar (translated)
const departments = computed(() => {
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

// Avatar initials from name
const avatarInitials = computed(() => {
  const name = form.value.name || ''
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase()
  }
  return (name[0] || 'Y').toUpperCase() + 'K'
})

const saving = ref(false)
const showPassword = ref(false)
const showValidationSummary = ref(false)

// Selected role (separate from form)
const selectedRole = ref('receptionist')
const selectedPermissions = ref([...(DEFAULT_PERMISSIONS['receptionist'] || [])])

// Form data
const form = ref({
  name: '',
  email: '',
  password: '',
  phone: '',
  department: 'front_office',
  position: '',
  isActive: true
})

// Departman değiştiğinde rolü sıfırla ve ilk rolü seç
watch(
  () => form.value.department,
  newDept => {
    if (newDept && ROLES_BY_DEPARTMENT[newDept]) {
      const firstRole = ROLES_BY_DEPARTMENT[newDept][0]?.value
      selectedRole.value = firstRole || ''
      if (firstRole) {
        selectedPermissions.value = [...(DEFAULT_PERMISSIONS[firstRole] || [])]
      }
    }
  }
)

// Rol değiştiğinde varsayılan yetkileri ata
watch(selectedRole, newRole => {
  if (newRole && DEFAULT_PERMISSIONS[newRole]) {
    selectedPermissions.value = [...DEFAULT_PERMISSIONS[newRole]]
  }
})

// Validation errors
const errors = reactive({
  email: '',
  password: '',
  name: '',
  department: '',
  role: ''
})

const hasErrors = computed(() => {
  return Object.values(errors).some(e => e)
})

// Validation functions
const validateField = field => {
  switch (field) {
    case 'email':
      if (!form.value.email?.trim()) {
        errors.email = t('settings.users.addModal.errors.emailRequired')
      } else if (!/^\S+@\S+\.\S+$/.test(form.value.email)) {
        errors.email = t('settings.users.addModal.errors.emailInvalid')
      } else {
        errors.email = ''
      }
      break
    case 'password':
      if (!form.value.password) {
        errors.password = t('settings.users.addModal.errors.passwordRequired')
      } else if (form.value.password.length < 8) {
        errors.password = t('settings.users.addModal.errors.passwordMinLength')
      } else if (!/[A-Z]/.test(form.value.password)) {
        errors.password = t('settings.users.addModal.errors.passwordUppercase')
      } else if (!/[a-z]/.test(form.value.password)) {
        errors.password = t('settings.users.addModal.errors.passwordLowercase')
      } else if (!/[0-9]/.test(form.value.password)) {
        errors.password = t('settings.users.addModal.errors.passwordNumber')
      } else {
        errors.password = ''
      }
      break
    case 'name':
      if (!form.value.name?.trim()) {
        errors.name = t('settings.users.addModal.errors.nameRequired')
      } else if (form.value.name.trim().length < 2) {
        errors.name = t('settings.users.addModal.errors.nameMinLength')
      } else {
        errors.name = ''
      }
      break
    case 'department':
      if (!form.value.department) {
        errors.department = t('settings.users.addModal.errors.departmentRequired')
      } else {
        errors.department = ''
      }
      break
    case 'role':
      if (!selectedRole.value) {
        errors.role = t('settings.users.addModal.errors.roleRequired')
      } else {
        errors.role = ''
      }
      break
  }
}

const validateAll = () => {
  validateField('email')
  validateField('password')
  validateField('name')
  validateField('department')
  validateField('role')
  return !hasErrors.value
}

const clearError = field => {
  errors[field] = ''
  showValidationSummary.value = false
}

const clearAllErrors = () => {
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
  showValidationSummary.value = false
}

// Role selection
const selectRole = roleValue => {
  selectedRole.value = roleValue
  clearError('role')
}

const getRoleButtonClass = roleValue => {
  if (errors.role && !selectedRole.value) {
    return 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10 hover:border-red-400'
  }
  if (selectedRole.value === roleValue) {
    return 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
  }
  return 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-700'
}

// Generate random password (meets BE complexity: uppercase + lowercase + number, min 8)
const generatePassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const all = upper + lower + digits

  // Ensure at least one of each required type
  let password = ''
  password += upper.charAt(Math.floor(Math.random() * upper.length))
  password += lower.charAt(Math.floor(Math.random() * lower.length))
  password += digits.charAt(Math.floor(Math.random() * digits.length))

  // Fill remaining characters
  for (let i = 3; i < 10; i++) {
    password += all.charAt(Math.floor(Math.random() * all.length))
  }

  // Shuffle
  password = password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')

  form.value.password = password
  showPassword.value = true
  clearError('password')
  toast.info(t('settings.users.addModal.success.passwordGenerated'))
}

// Reset form when modal opens
watch(
  () => props.modelValue,
  val => {
    if (val) {
      form.value = {
        name: '',
        email: '',
        password: '',
        phone: '',
        department: 'front_office',
        position: '',
        isActive: true
      }
      selectedRole.value = 'receptionist'
      selectedPermissions.value = [...(DEFAULT_PERMISSIONS['receptionist'] || [])]
      showPassword.value = false
      clearAllErrors()
    }
  }
)

const handleCancel = () => {
  clearAllErrors()
  isOpen.value = false
}

const handleSubmit = async () => {
  // Validate all fields
  const isValid = validateAll()

  if (!isValid) {
    showValidationSummary.value = true
    toast.error(t('settings.users.addModal.errors.fillRequired'))

    // Scroll to first error
    const firstError = document.querySelector('.border-red-500')
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  saving.value = true
  try {
    const data = {
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
      phone: form.value.phone,
      pmsRole: selectedRole.value,
      pmsDepartment: form.value.department,
      pmsPermissions: selectedPermissions.value,
      position: form.value.position,
      status: form.value.isActive ? 'active' : 'inactive'
    }

    await adminUserService.create(data)
    toast.success(t('settings.users.addModal.success.userCreated', { name: form.value.name }))
    emit('created')
  } catch (error) {
    console.error('Failed to create user:', error)
    const message =
      error.response?.data?.message || t('settings.users.addModal.errors.createFailed')
    toast.error(message)
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
