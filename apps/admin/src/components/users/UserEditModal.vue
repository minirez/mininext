<template>
  <Modal v-model="isOpen" :title="$t('users.editUser')" size="lg" :close-on-overlay="false">
    <!-- Custom Header with Avatar -->
    <template #header>
      <div class="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-slate-700">
        <div
          class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg"
        >
          {{ avatarInitials }}
        </div>
        <div class="flex-1">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ $t('users.editUser') }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {{ props.user?.email }}
          </p>
        </div>
        <div>
          <span
            :class="[
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
              statusBadgeClass
            ]"
          >
            <span :class="['w-1.5 h-1.5 rounded-full mr-1.5', statusDotClass]"></span>
            {{ statusLabel }}
          </span>
        </div>
      </div>
    </template>

    <form class="space-y-6 -mt-2" @submit.prevent="handleSubmit">
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
                class="w-full pl-10 pr-3 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                :class="
                  errors.name
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-300 dark:border-slate-600'
                "
                @blur="validateField('name')"
                @input="clearError('name')"
              />
            </div>
            <p v-if="errors.name" class="mt-1 text-sm text-red-500 flex items-center gap-1">
              <span class="material-icons text-sm">error</span>
              {{ errors.name }}
            </p>
          </div>

          <!-- Email (readonly) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ $t('users.email') }}
            </label>
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg"
                >email</span
              >
              <input
                v-model="form.email"
                type="email"
                disabled
                class="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-slate-400">
              {{ $t('users.emailCannotChange') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Section: Rol -->
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
            {{ $t('users.role') }}
          </h3>
        </div>

        <!-- Role Selection Cards -->
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
            <div
              v-if="form.role === role.value"
              class="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"
            >
              <span class="material-icons text-white text-sm">check</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Section: Admin Activation (for pending users without password, platform admin only) -->
      <div
        v-if="isPendingWithoutPassword && isPlatformAdmin"
        class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
      >
        <div class="flex items-center gap-2 mb-3">
          <div
            class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-amber-600 dark:text-amber-400 text-lg"
              >admin_panel_settings</span
            >
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('users.adminActivation.title') }}
          </h3>
        </div>

        <p class="text-sm text-amber-700 dark:text-amber-300 mb-4">
          {{ $t('users.adminActivation.description') }}
        </p>

        <!-- Activation mode selection -->
        <div class="space-y-3">
          <label
            class="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
            :class="
              activationMode === 'no-password'
                ? 'border-amber-400 bg-amber-100/50 dark:bg-amber-900/30'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
            "
          >
            <input
              v-model="activationMode"
              type="radio"
              value="no-password"
              class="mt-0.5 text-amber-500 focus:ring-amber-500"
            />
            <div>
              <p class="font-medium text-gray-900 dark:text-white text-sm">
                {{ $t('users.adminActivation.withoutPassword') }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {{ $t('users.adminActivation.withoutPasswordDesc') }}
              </p>
            </div>
          </label>

          <label
            class="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
            :class="
              activationMode === 'with-password'
                ? 'border-amber-400 bg-amber-100/50 dark:bg-amber-900/30'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
            "
          >
            <input
              v-model="activationMode"
              type="radio"
              value="with-password"
              class="mt-0.5 text-amber-500 focus:ring-amber-500"
            />
            <div class="flex-1">
              <p class="font-medium text-gray-900 dark:text-white text-sm">
                {{ $t('users.adminActivation.withPassword') }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {{ $t('users.adminActivation.withPasswordDesc') }}
              </p>
            </div>
          </label>

          <!-- Password field (shown when with-password is selected) -->
          <div v-if="activationMode === 'with-password'" class="pl-8">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ $t('users.adminActivation.passwordLabel') }} <span class="text-red-500">*</span>
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
                class="w-full pl-10 pr-10 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                :class="
                  errors.password
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-300 dark:border-slate-600'
                "
                :placeholder="$t('users.adminActivation.passwordPlaceholder')"
                @blur="validateField('password')"
                @input="clearError('password')"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                @click="showPassword = !showPassword"
              >
                <span class="material-icons text-lg">{{
                  showPassword ? 'visibility_off' : 'visibility'
                }}</span>
              </button>
            </div>
            <p v-if="errors.password" class="mt-1 text-sm text-red-500 flex items-center gap-1">
              <span class="material-icons text-sm">error</span>
              {{ errors.password }}
            </p>
            <p v-else class="mt-1 text-xs text-gray-500 dark:text-slate-400">
              {{ $t('users.adminActivation.passwordHint') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Section: Hesap Durumu (hidden for pending users without password when platform admin) -->
      <div
        v-if="!isPendingWithoutPassword"
        class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center"
            :class="
              form.status === 'active'
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-gray-100 dark:bg-slate-600'
            "
          >
            <span
              class="material-icons"
              :class="
                form.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
              "
              >{{ form.status === 'active' ? 'verified_user' : 'person_off' }}</span
            >
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ $t('users.accountStatus') }}</p>
            <p
              class="text-sm"
              :class="
                form.status === 'active'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-slate-400'
              "
            >
              {{
                form.status === 'active'
                  ? $t('users.statusActiveDesc')
                  : $t('users.statusInactiveDesc')
              }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="relative w-14 h-8 rounded-full transition-colors duration-200"
          :class="form.status === 'active' ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'"
          @click="form.status = form.status === 'active' ? 'inactive' : 'active'"
        >
          <span
            class="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-200"
            :class="form.status === 'active' ? 'left-7' : 'left-1'"
          ></span>
        </button>
      </div>
    </form>

    <template #footer>
      <div
        class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700"
      >
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
            v-if="isPendingWithoutPassword && isPlatformAdmin"
            :disabled="saving || (activationMode === 'with-password' && !form.password)"
            class="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-green-500/25 transition-all"
            @click="handleAdminActivate"
          >
            <span v-if="saving" class="animate-spin material-icons text-lg">refresh</span>
            <span v-else class="material-icons text-lg">check_circle</span>
            {{ saving ? $t('common.saving') : $t('users.adminActivation.activateButton') }}
          </button>
          <button
            v-else
            :disabled="saving"
            class="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all"
            @click="handleSubmit"
          >
            <span v-if="saving" class="animate-spin material-icons text-lg">refresh</span>
            <span v-else class="material-icons text-lg">save</span>
            {{ saving ? $t('common.saving') : $t('common.save') }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import Modal from '@/components/common/Modal.vue'
import { updateUser, adminActivateUser } from '@/services/userService'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'success'])

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()

const isOpen = computed({
  get: () => true,
  set: val => {
    if (!val) emit('close')
  }
})

const saving = ref(false)
const showPassword = ref(false)
const activationMode = ref('no-password')

const isPlatformAdmin = computed(() => authStore.user?.accountType === 'platform')
const isPendingWithoutPassword = computed(
  () => ['pending', 'pending_activation'].includes(props.user?.status) && isPlatformAdmin.value
)

// Form data
const form = ref({
  name: '',
  email: '',
  role: 'user',
  status: 'active',
  password: ''
})

// Validation errors
const errors = reactive({
  name: '',
  password: ''
})

// Initialize form from props
watch(
  () => props.user,
  user => {
    if (user) {
      form.value = {
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        status: user.status || 'active',
        password: ''
      }
    }
  },
  { immediate: true }
)

// Status badge classes
const statusBadgeClass = computed(() => {
  const s = props.user?.status
  if (s === 'active') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
  if (s === 'pending' || s === 'pending_activation')
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
  return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
})

const statusDotClass = computed(() => {
  const s = props.user?.status
  if (s === 'active') return 'bg-green-500'
  if (s === 'pending' || s === 'pending_activation') return 'bg-yellow-500'
  return 'bg-gray-400'
})

const statusLabel = computed(() => {
  const s = props.user?.status
  if (s === 'active') return t('common.active')
  if (s === 'pending') return t('common.pending')
  if (s === 'pending_activation') return t('users.pendingActivation')
  return t('common.inactive')
})

// Avatar initials
const avatarInitials = computed(() => {
  const name = form.value.name || ''
  return (
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || '?'
  )
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

// Role selection
const selectRole = roleValue => {
  form.value.role = roleValue
}

const getRoleButtonClass = roleValue => {
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
    case 'password':
      if (activationMode.value === 'with-password') {
        if (!form.value.password) {
          errors.password = t('validation.required')
        } else if (form.value.password.length < 8) {
          errors.password = t('validation.minLength', { min: 8 })
        } else {
          errors.password = ''
        }
      } else {
        errors.password = ''
      }
      break
  }
}

const validateAll = () => {
  validateField('name')
  return !errors.name
}

const validateActivation = () => {
  validateField('name')
  if (activationMode.value === 'with-password') {
    validateField('password')
    return !errors.name && !errors.password
  }
  return !errors.name
}

const clearError = field => {
  errors[field] = ''
}

const handleCancel = () => {
  emit('close')
}

// Standard update (for non-pending users)
const handleSubmit = async () => {
  if (!validateAll()) {
    toast.error(t('validation.checkForm'))
    return
  }

  saving.value = true
  try {
    await updateUser(props.user._id, {
      name: form.value.name,
      role: form.value.role,
      status: form.value.status
    })
    toast.success(t('common.saved'))
    emit('success')
  } catch (error) {
    const message = error.response?.data?.message || error.message || t('common.error')
    toast.error(message)
  } finally {
    saving.value = false
  }
}

// Admin activation (for pending users without password)
const handleAdminActivate = async () => {
  if (!validateActivation()) {
    toast.error(t('validation.checkForm'))
    return
  }

  saving.value = true
  try {
    // First update name/role if changed
    await updateUser(props.user._id, {
      name: form.value.name,
      role: form.value.role
    })

    // Then admin-activate
    const payload =
      activationMode.value === 'with-password' ? { password: form.value.password } : {}

    const result = await adminActivateUser(props.user._id, payload)
    toast.success(result.message || t('users.adminActivation.success'))
    emit('success')
  } catch (error) {
    const message = error.response?.data?.message || error.message || t('common.error')
    toast.error(message)
  } finally {
    saving.value = false
  }
}
</script>
