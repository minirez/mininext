<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4"
  >
    <div class="w-full max-w-md">
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <!-- Logo/Brand -->
        <div class="text-center mb-8">
          <div
            class="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4"
          >
            <span class="material-icons text-white text-3xl">business</span>
          </div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white">
            {{ $t('auth.partnerRegister') }}
          </h2>
          <p class="text-gray-600 dark:text-slate-400 mt-2">
            {{ $t('auth.createPartnerAccount') }}
          </p>
        </div>

        <!-- Error Alert -->
        <div v-if="error" class="alert alert-error mb-6">
          <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <span>{{ error }}</span>
        </div>

        <!-- Success Alert -->
        <div v-if="success" class="alert alert-success mb-6">
          <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <span>{{ success }}</span>
        </div>

        <!-- Registration Form -->
        <form v-if="!success" class="space-y-5" @submit.prevent="handleRegister">
          <!-- Company Name -->
          <div>
            <label for="companyName" class="form-label">{{ $t('auth.companyName') }} *</label>
            <input
              id="companyName"
              v-model="form.companyName"
              type="text"
              class="form-input"
              required
              :disabled="loading"
            />
          </div>

          <!-- Full Name -->
          <div>
            <label for="name" class="form-label">{{ $t('auth.fullName') }} *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              class="form-input"
              required
              :disabled="loading"
            />
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="form-label">{{ $t('auth.email') }} *</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-input"
              required
              :disabled="loading"
            />
          </div>

          <!-- Phone -->
          <div>
            <label for="phone" class="form-label">{{ $t('auth.phone') }} *</label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              class="form-input"
              required
              :disabled="loading"
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="form-label">{{ $t('auth.password') }} *</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="form-input"
              required
              :disabled="loading"
              minlength="6"
            />
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirmPassword" class="form-label"
              >{{ $t('auth.confirmPassword') }} *</label
            >
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              class="form-input"
              required
              :disabled="loading"
              minlength="6"
            />
          </div>

          <!-- Submit Button -->
          <button type="submit" class="w-full btn-primary" :disabled="loading">
            <span v-if="loading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
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
              {{ $t('auth.registering') }}
            </span>
            <span v-else>{{ $t('auth.register') }}</span>
          </button>
        </form>

        <!-- Login Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600 dark:text-slate-400">
            {{ $t('auth.alreadyHaveAccount') }}
            <RouterLink
              to="/login"
              class="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
            >
              {{ $t('auth.loginHere') }}
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import apiClient from '@/services/api'
import { useI18n } from 'vue-i18n'
import { useAsyncAction } from '@/composables/useAsyncAction'

const { t } = useI18n()

// Async action composable
const { isLoading: loading, execute: executeRegister } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })

const form = ref({
  companyName: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const error = ref('')
const success = ref('')

const handleRegister = async () => {
  error.value = ''
  success.value = ''

  // Validate passwords match
  if (form.value.password !== form.value.confirmPassword) {
    error.value = t('auth.passwordsDoNotMatch')
    return
  }

  await executeRegister(
    () => apiClient.post('/auth/register', {
      companyName: form.value.companyName,
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
      password: form.value.password
    }),
    {
      onSuccess: response => {
        if (response.data.success) {
          success.value = t('auth.registrationSuccess')
          form.value = {
            companyName: '',
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: ''
          }
        }
      },
      onError: err => {
        error.value = err.response?.data?.message || t('auth.registrationFailed')
      }
    }
  )
}
</script>
