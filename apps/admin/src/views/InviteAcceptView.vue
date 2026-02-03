<template>
  <div
    class="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 flex items-center justify-center p-4"
  >
    <!-- Loading State -->
    <div
      v-if="loading"
      class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center"
    >
      <div
        class="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <span class="material-icons text-3xl text-purple-600 animate-spin">refresh</span>
      </div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {{ $t('users.invite.verifying') }}
      </h2>
      <p class="text-gray-500 dark:text-slate-400">
        {{ $t('users.invite.pleaseWait') }}
      </p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center"
    >
      <div
        class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <span class="material-icons text-3xl text-red-600 dark:text-red-400">error</span>
      </div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {{ $t('users.invite.invalidInvite') }}
      </h2>
      <p class="text-gray-500 dark:text-slate-400 mb-6">
        {{ errorMessage }}
      </p>
      <router-link
        to="/login"
        class="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
      >
        <span class="material-icons">login</span>
        {{ $t('auth.goToLogin') }}
      </router-link>
    </div>

    <!-- Success State -->
    <div
      v-else-if="success"
      class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center"
    >
      <div
        class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <span class="material-icons text-3xl text-green-600 dark:text-green-400">check_circle</span>
      </div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {{ $t('users.invite.accountCreated') }}
      </h2>
      <p class="text-gray-500 dark:text-slate-400 mb-6">
        {{ $t('users.invite.accountCreatedDesc') }}
      </p>
      <router-link
        to="/login"
        class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 transition-all"
      >
        <span class="material-icons">login</span>
        {{ $t('auth.goToLogin') }}
      </router-link>
    </div>

    <!-- Accept Form -->
    <div
      v-else-if="invite"
      class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md"
    >
      <!-- Header -->
      <div class="text-center mb-8">
        <div
          class="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30"
        >
          <span class="material-icons text-3xl text-white">person_add</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {{ $t('users.invite.welcome') }}
        </h1>
        <p class="text-gray-500 dark:text-slate-400">
          {{ $t('users.invite.welcomeDesc', { name: invite.name }) }}
        </p>
      </div>

      <!-- Invite Info -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-purple-600 dark:text-purple-400">email</span>
          </div>
          <div class="flex-1">
            <p class="font-medium text-gray-900 dark:text-white">{{ invite.email }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ invite.role === 'admin' ? $t('users.admin') : $t('users.user') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Password -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {{ $t('auth.password') }} <span class="text-red-500">*</span>
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
              class="w-full pl-10 pr-12 py-3 border rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              :class="
                errors.password
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                  : 'border-gray-300 dark:border-slate-600'
              "
              :placeholder="$t('users.invite.passwordPlaceholder')"
              @blur="validateField('password')"
              @input="clearError('password')"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
          <p class="mt-1 text-xs text-gray-500 dark:text-slate-400">
            {{ $t('users.invite.passwordHint') }}
          </p>
        </div>

        <!-- Confirm Password -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {{ $t('auth.confirmPassword') }} <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-lg"
              :class="errors.confirmPassword ? 'text-red-400' : 'text-gray-400'"
              >lock_outline</span
            >
            <input
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              autocomplete="new-password"
              class="w-full pl-10 pr-12 py-3 border rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              :class="
                errors.confirmPassword
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                  : 'border-gray-300 dark:border-slate-600'
              "
              :placeholder="$t('users.invite.confirmPasswordPlaceholder')"
              @blur="validateField('confirmPassword')"
              @input="clearError('confirmPassword')"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <span class="material-icons text-lg">{{
                showConfirmPassword ? 'visibility_off' : 'visibility'
              }}</span>
            </button>
          </div>
          <p
            v-if="errors.confirmPassword"
            class="mt-1 text-sm text-red-500 flex items-center gap-1"
          >
            <span class="material-icons text-sm">error</span>
            {{ errors.confirmPassword }}
          </p>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="saving"
          class="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all mt-6"
        >
          <span v-if="saving" class="animate-spin material-icons">refresh</span>
          <span v-else class="material-icons">check</span>
          {{ saving ? $t('common.saving') : $t('users.invite.createAccount') }}
        </button>
      </form>

      <!-- Footer -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('users.invite.alreadyHaveAccount') }}
          <router-link
            to="/login"
            class="text-purple-600 dark:text-purple-400 hover:underline font-medium"
          >
            {{ $t('auth.login') }}
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { verifyInviteToken, acceptInvite } from '@/services/userService'

const route = useRoute()
const { t } = useI18n()
const toast = useToast()

// Async action composables
const { isLoading: loading, execute: executeVerify } = useAsyncAction({
  showSuccessToast: false,
  showErrorToast: false
})
const { isLoading: saving, execute: executeAccept } = useAsyncAction({
  showSuccessToast: false,
  showErrorToast: false
})

const error = ref(false)
const errorMessage = ref('')
const success = ref(false)
const invite = ref(null)

const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Form data
const form = ref({
  password: '',
  confirmPassword: ''
})

// Validation errors
const errors = reactive({
  password: '',
  confirmPassword: ''
})

// Validation functions
const validateField = field => {
  switch (field) {
    case 'password':
      if (!form.value.password) {
        errors.password = t('validation.required')
      } else if (form.value.password.length < 8) {
        errors.password = t('validation.minLength', { min: 8 })
      } else {
        errors.password = ''
      }
      break
    case 'confirmPassword':
      if (!form.value.confirmPassword) {
        errors.confirmPassword = t('validation.required')
      } else if (form.value.confirmPassword !== form.value.password) {
        errors.confirmPassword = t('validation.passwordMismatch')
      } else {
        errors.confirmPassword = ''
      }
      break
  }
}

const validateAll = () => {
  validateField('password')
  validateField('confirmPassword')
  return !errors.password && !errors.confirmPassword
}

const clearError = field => {
  errors[field] = ''
}

// Verify token on mount
onMounted(async () => {
  const token = route.params.token

  if (!token) {
    error.value = true
    errorMessage.value = t('users.invite.noToken')
    return
  }

  await executeVerify(() => verifyInviteToken(token), {
    onSuccess: response => {
      invite.value = response.data
    },
    onError: err => {
      error.value = true
      errorMessage.value = err.response?.data?.message || t('users.invite.invalidOrExpired')
    }
  })
})

// Handle form submit
const handleSubmit = async () => {
  if (!validateAll()) {
    toast.error(t('validation.checkForm'))
    return
  }

  await executeAccept(() => acceptInvite(route.params.token, { password: form.value.password }), {
    onSuccess: () => {
      success.value = true
      invite.value = null
    },
    onError: err => {
      const message = err.response?.data?.message || err.message || t('common.error')
      toast.error(message)
    }
  })
}
</script>
