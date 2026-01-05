<template>
  <div>
    <h2 class="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">
      {{ $t('auth.resetPasswordTitle') }}
    </h2>
    <p class="text-center text-gray-600 dark:text-slate-400 mb-8">
      {{ $t('auth.resetPasswordDesc') }}
    </p>

    <!-- Success message -->
    <div
      v-if="success"
      class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6"
      role="alert"
    >
      <div class="flex items-center">
        <span class="material-icons text-green-500 mr-2">check_circle</span>
        <span>{{ $t('auth.passwordResetSuccess') }}</span>
      </div>
      <div class="mt-4 text-center">
        <RouterLink
          to="/login"
          class="btn-primary inline-flex items-center"
        >
          <span class="material-icons mr-2">login</span>
          {{ $t('auth.goToLogin') }}
        </RouterLink>
      </div>
    </div>

    <!-- Error message -->
    <div
      v-if="errorMessage"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6"
      role="alert"
    >
      <div class="flex items-center">
        <span class="material-icons text-red-500 mr-2">error_outline</span>
        <span>{{ errorMessage }}</span>
      </div>
    </div>

    <!-- Reset Password Form -->
    <form v-if="!success" class="space-y-6" @submit.prevent="handleSubmit">
      <div>
        <label for="password" class="form-label">{{ $t('auth.newPassword') }}</label>
        <div class="relative">
          <svg
            class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="form-input pl-10 pr-10"
            :placeholder="$t('auth.enterNewPassword')"
            required
            :disabled="loading"
            autocomplete="new-password"
            minlength="8"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            @click="showPassword = !showPassword"
          >
            <span class="material-icons text-xl">
              {{ showPassword ? 'visibility_off' : 'visibility' }}
            </span>
          </button>
        </div>
        <!-- Password requirements -->
        <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {{ $t('auth.passwordRequirements') }}
        </p>
      </div>

      <div>
        <label for="confirmPassword" class="form-label">{{ $t('auth.confirmPassword') }}</label>
        <div class="relative">
          <svg
            class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            class="form-input pl-10"
            :placeholder="$t('auth.confirmNewPassword')"
            required
            :disabled="loading"
            autocomplete="new-password"
            minlength="8"
          />
        </div>
        <p v-if="passwordMismatch" class="text-xs text-red-500 mt-1">
          {{ $t('auth.passwordMismatch') }}
        </p>
      </div>

      <!-- Password Strength Indicator -->
      <div v-if="password" class="space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-600 dark:text-slate-400">{{ $t('auth.passwordStrength') }}</span>
          <span
            :class="{
              'text-red-500': passwordStrength < 2,
              'text-yellow-500': passwordStrength >= 2 && passwordStrength < 4,
              'text-green-500': passwordStrength >= 4
            }"
          >
            {{ strengthLabel }}
          </span>
        </div>
        <div class="h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            class="h-full transition-all duration-300"
            :class="{
              'bg-red-500': passwordStrength < 2,
              'bg-yellow-500': passwordStrength >= 2 && passwordStrength < 4,
              'bg-green-500': passwordStrength >= 4
            }"
            :style="{ width: `${(passwordStrength / 5) * 100}%` }"
          ></div>
        </div>
      </div>

      <button
        type="submit"
        class="w-full btn-primary flex items-center justify-center"
        :disabled="loading || passwordMismatch || passwordStrength < 4"
      >
        <span v-if="loading" class="flex items-center">
          <svg
            class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {{ $t('common.saving') }}
        </span>
        <span v-else class="flex items-center">
          <span class="material-icons mr-2">lock_reset</span>
          {{ $t('auth.resetPassword') }}
        </span>
      </button>
    </form>

    <!-- Back to Login Link -->
    <div v-if="!success" class="mt-6 text-center">
      <RouterLink
        to="/login"
        class="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium inline-flex items-center"
      >
        <span class="material-icons text-sm mr-1">arrow_back</span>
        {{ $t('auth.backToLogin') }}
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import authService from '@/services/authService'
import { useAsyncAction } from '@/composables/useAsyncAction'

const route = useRoute()
const { t } = useI18n()

// Async action composable
const { isLoading: loading, execute: executeSubmit } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const success = ref(false)
const errorMessage = ref('')

const token = computed(() => route.params.token)

const passwordMismatch = computed(() => {
  return confirmPassword.value && password.value !== confirmPassword.value
})

const passwordStrength = computed(() => {
  const pwd = password.value
  let strength = 0

  if (pwd.length >= 12) strength++
  if (/[a-z]/.test(pwd)) strength++
  if (/[A-Z]/.test(pwd)) strength++
  if (/[0-9]/.test(pwd)) strength++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++

  return strength
})

const strengthLabel = computed(() => {
  if (passwordStrength.value < 2) return t('auth.weak')
  if (passwordStrength.value < 4) return t('auth.medium')
  return t('auth.strong')
})

const handleSubmit = async () => {
  if (passwordMismatch.value) return
  if (passwordStrength.value < 4) return

  errorMessage.value = ''

  await executeSubmit(
    () => authService.resetPassword(token.value, password.value),
    {
      onSuccess: () => {
        success.value = true
      },
      onError: error => {
        errorMessage.value = error.response?.data?.message || t('auth.resetPasswordError')
      }
    }
  )
}
</script>
