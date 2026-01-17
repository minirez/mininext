<template>
  <Modal v-model="isOpen" :title="$t('users.inviteUser')" size="lg" :close-on-overlay="false">
    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Section: Kisisel Bilgiler -->
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-4">
          <div
            class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-purple-600 dark:text-purple-400 text-lg">person</span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('users.personalInfo') }}
          </h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ $t('users.name') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-lg"
                :class="errors.name ? 'text-red-400' : 'text-gray-400'"
                >badge</span
              >
              <input
                v-model="form.name"
                type="text"
                autocomplete="off"
                class="w-full pl-10 pr-3 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                :class="
                  errors.name
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-300 dark:border-slate-600'
                "
                :placeholder="$t('users.namePlaceholder')"
                @blur="validateField('name')"
                @input="clearError('name')"
              />
            </div>
            <p v-if="errors.name" class="mt-1 text-sm text-red-500 flex items-center gap-1">
              <span class="material-icons text-sm">error</span>
              {{ errors.name }}
            </p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ $t('users.email') }} <span class="text-red-500">*</span>
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
                class="w-full pl-10 pr-3 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                :class="
                  errors.email
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-300 dark:border-slate-600'
                "
                :placeholder="$t('users.emailPlaceholder')"
                @blur="validateField('email')"
                @input="clearError('email')"
              />
            </div>
            <p v-if="errors.email" class="mt-1 text-sm text-red-500 flex items-center gap-1">
              <span class="material-icons text-sm">error</span>
              {{ errors.email }}
            </p>
          </div>
        </div>
      </div>

      <!-- Section: Rol ve Izinler -->
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-4">
          <div
            class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-indigo-600 dark:text-indigo-400 text-lg"
              >admin_panel_settings</span
            >
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('users.roleAndPermissions') }}
          </h3>
        </div>

        <!-- Role Selection Cards -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ $t('users.role') }} <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              v-for="role in roles"
              :key="role.value"
              type="button"
              class="relative p-4 rounded-xl border-2 text-left transition-all"
              :class="getRoleButtonClass(role.value)"
              @click="selectRole(role.value)"
            >
              <div class="flex items-start gap-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  :class="
                    form.role === role.value
                      ? 'bg-purple-100 dark:bg-purple-900/40'
                      : 'bg-gray-100 dark:bg-slate-600'
                  "
                >
                  <span
                    class="material-icons"
                    :class="
                      form.role === role.value
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-500 dark:text-gray-400'
                    "
                    >{{ role.icon }}</span
                  >
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white">{{ role.label }}</p>
                  <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {{ role.description }}
                  </p>
                </div>
              </div>
              <!-- Check indicator -->
              <div
                v-if="form.role === role.value"
                class="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"
              >
                <span class="material-icons text-white text-sm">check</span>
              </div>
            </button>
          </div>
          <p v-if="errors.role" class="mt-2 text-sm text-red-500 flex items-center gap-1">
            <span class="material-icons text-sm">error</span>
            {{ errors.role }}
          </p>
        </div>

        <!-- Permissions Grid (only for 'user' role) -->
        <div v-if="form.role === 'user'" class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {{ $t('users.permissions.title') }}
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              v-for="module in availableModules"
              :key="module.value"
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
              :class="{ 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700': isModuleSelected(module.value) }"
            >
              <input
                type="checkbox"
                :checked="isModuleSelected(module.value)"
                class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300 dark:border-slate-500"
                @change="toggleModule(module.value)"
              />
              <div class="flex items-center gap-2">
                <span class="material-icons text-lg" :class="isModuleSelected(module.value) ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'">
                  {{ module.icon }}
                </span>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ module.label }}
                </span>
              </div>
            </label>
          </div>
          <p class="mt-2 text-xs text-gray-500 dark:text-slate-400">
            {{ $t('users.permissions.hint') }}
          </p>
        </div>
      </div>

      <!-- Info Box -->
      <div class="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <span class="material-icons text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">info</span>
        <div>
          <p class="text-sm text-blue-800 dark:text-blue-200 font-medium">
            {{ $t('users.inviteInfo') }}
          </p>
          <p class="text-xs text-blue-600 dark:text-blue-300 mt-1">
            {{ $t('users.inviteInfoDetail') }}
          </p>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
        <p class="text-xs text-gray-500 dark:text-slate-400">
          <span class="text-red-500">*</span> {{ $t('common.requiredFields') }}
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
            class="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all"
            @click="handleSubmit"
          >
            <span v-if="saving" class="animate-spin material-icons text-lg">refresh</span>
            <span v-else class="material-icons text-lg">send</span>
            {{ saving ? $t('common.sending') : $t('users.sendInvite') }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/common/Modal.vue'
import { inviteUser } from '@/services/userService'

const emit = defineEmits(['close', 'success'])

const { t } = useI18n()
const toast = useToast()

const isOpen = computed({
  get: () => true,
  set: val => {
    if (!val) emit('close')
  }
})

const saving = ref(false)

// Form data
const form = ref({
  name: '',
  email: '',
  role: 'user',
  permissions: []
})

// Validation errors
const errors = reactive({
  name: '',
  email: '',
  role: ''
})

// Roles
const roles = computed(() => [
  {
    value: 'admin',
    label: t('users.admin'),
    description: t('users.adminDesc'),
    icon: 'admin_panel_settings'
  },
  {
    value: 'user',
    label: t('users.user'),
    description: t('users.userDesc'),
    icon: 'person'
  }
])

// Available modules for permissions
const availableModules = computed(() => [
  { value: 'dashboard', label: t('users.modules.dashboard'), icon: 'dashboard' },
  { value: 'planning', label: t('users.modules.planning'), icon: 'event_note' },
  { value: 'booking', label: t('users.modules.booking'), icon: 'book_online' },
  { value: 'reports', label: t('users.modules.reports'), icon: 'assessment' },
  { value: 'hotels', label: t('users.modules.hotels'), icon: 'hotel' },
  { value: 'agencies', label: t('users.modules.agencies'), icon: 'groups' },
  { value: 'pms', label: t('users.modules.pms'), icon: 'apartment' },
  { value: 'settings', label: t('users.modules.settings'), icon: 'settings' },
  { value: 'payment-link', label: t('users.modules.paymentLink'), icon: 'link' }
])

// Check if module is selected
const isModuleSelected = module => {
  return form.value.permissions.some(p => p.module === module)
}

// Toggle module permission
const toggleModule = module => {
  const index = form.value.permissions.findIndex(p => p.module === module)
  if (index > -1) {
    form.value.permissions.splice(index, 1)
  } else {
    form.value.permissions.push({
      module,
      actions: { view: true, create: true, edit: true, delete: false }
    })
  }
}

// Role selection
const selectRole = roleValue => {
  form.value.role = roleValue
  clearError('role')

  // If admin, clear permissions (admins have full access)
  if (roleValue === 'admin') {
    form.value.permissions = []
  }
}

const getRoleButtonClass = roleValue => {
  if (errors.role && !form.value.role) {
    return 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10 hover:border-red-400'
  }
  if (form.value.role === roleValue) {
    return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
  }
  return 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-700'
}

// Validation functions
const validateField = field => {
  switch (field) {
    case 'name':
      if (!form.value.name?.trim()) {
        errors.name = t('validation.required')
      } else if (form.value.name.length < 2) {
        errors.name = t('validation.minLength', { min: 2 })
      } else {
        errors.name = ''
      }
      break
    case 'email':
      if (!form.value.email?.trim()) {
        errors.email = t('validation.required')
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(form.value.email)) {
          errors.email = t('validation.email')
        } else {
          errors.email = ''
        }
      }
      break
    case 'role':
      if (!form.value.role) {
        errors.role = t('validation.required')
      } else {
        errors.role = ''
      }
      break
  }
}

const validateAll = () => {
  validateField('name')
  validateField('email')
  validateField('role')
  return !errors.name && !errors.email && !errors.role
}

const clearError = field => {
  errors[field] = ''
}

const handleCancel = () => {
  emit('close')
}

const handleSubmit = async () => {
  if (!validateAll()) {
    toast.error(t('validation.checkForm'))
    return
  }

  saving.value = true
  try {
    await inviteUser({
      name: form.value.name,
      email: form.value.email,
      role: form.value.role,
      permissions: form.value.role === 'user' ? form.value.permissions : []
    })
    emit('success')
  } catch (error) {
    const message = error.response?.data?.message || error.message || t('common.error')
    toast.error(message)
  } finally {
    saving.value = false
  }
}
</script>
