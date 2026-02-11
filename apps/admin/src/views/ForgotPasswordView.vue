<template>
  <div>
    <h2 class="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">
      {{ $t('auth.forgotPasswordTitle') }}
    </h2>
    <p class="text-center text-gray-600 dark:text-slate-400 mb-8">
      {{ $t('auth.forgotPasswordDesc') }}
    </p>

    <!-- Success message -->
    <div
      v-if="success"
      class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6"
      role="alert"
    >
      <div class="flex items-center">
        <span class="material-icons text-green-500 mr-2">check_circle</span>
        <span>{{ $t('auth.passwordResetEmailSent') }}</span>
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

    <!-- Forgot Password Form -->
    <form v-if="!success" class="space-y-6" @submit.prevent="handleSubmit">
      <div>
        <label for="email" class="form-label">{{ $t('auth.email') }}</label>
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
              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
            />
          </svg>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input pl-10"
            placeholder="example@company.com"
            required
            :disabled="loading"
            autocomplete="email"
            autocapitalize="none"
            autocorrect="off"
            inputmode="email"
          />
        </div>
      </div>

      <button
        type="submit"
        class="w-full btn-primary flex items-center justify-center"
        :disabled="loading"
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
          {{ $t('common.sending') }}
        </span>
        <span v-else class="flex items-center">
          <span class="material-icons mr-2">mail</span>
          {{ $t('auth.sendResetLink') }}
        </span>
      </button>
    </form>

    <!-- Back to Login Link -->
    <div class="mt-6 text-center">
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
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import authService from '@/services/authService'
import { useAsyncAction } from '@/composables/useAsyncAction'

const { t } = useI18n()

// Async action composable
const { isLoading: loading, execute: executeSubmit } = useAsyncAction({
  showSuccessToast: false,
  showErrorToast: false
})

const email = ref('')
const success = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''

  await executeSubmit(() => authService.forgotPassword(email.value), {
    onSuccess: () => {
      success.value = true
    },
    onError: () => {
      errorMessage.value = t('auth.forgotPasswordError')
    }
  })
}
</script>
