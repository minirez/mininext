<template>
  <div>
    <!-- Normal Login Form -->
    <div v-if="!show2FAForm">
      <h2 class="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">
        {{ $t('auth.welcome') }}
      </h2>
      <p class="text-center text-gray-600 dark:text-slate-400 mb-4 sm:mb-8">
        {{ $t('auth.signIn') }}
      </p>

      <!-- Error message -->
      <div
        v-if="errorMessage"
        class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
        role="alert"
      >
        <div class="flex items-center">
          <span class="material-icons text-red-500 mr-2">error_outline</span>
          <span>{{ errorMessage }}</span>
        </div>
      </div>

      <!-- Login Form -->
      <form class="space-y-4 sm:space-y-6" @submit.prevent="handleLogin">
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

        <div>
          <div class="flex items-center justify-between">
            <label for="password" class="form-label">{{ $t('auth.password') }}</label>
            <RouterLink
              to="/forgot-password"
              class="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              {{ $t('auth.forgotPassword') }}
            </RouterLink>
          </div>
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
              type="password"
              class="form-input pl-10"
              placeholder="••••••••"
              required
              :disabled="loading"
              autocomplete="current-password"
              autocapitalize="none"
              autocorrect="off"
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
            {{ $t('auth.signingIn') }}
          </span>
          <span v-else class="flex items-center">
            {{ $t('auth.login') }}
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </span>
        </button>
      </form>

      <!-- Register Link -->
      <div class="mt-4 sm:mt-6 text-center">
        <p class="text-sm text-gray-600 dark:text-slate-400">
          {{ $t('auth.dontHaveAccount') }}
          <RouterLink
            to="/register"
            class="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
          >
            {{ $t('auth.registerHere') }}
          </RouterLink>
        </p>
      </div>
    </div>

    <!-- 2FA Verification Form -->
    <div v-else>
      <h2 class="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">
        {{ $t('auth.twoFactor') }}
      </h2>
      <p class="text-center text-gray-600 dark:text-slate-400 mb-8">
        {{ $t('auth.twoFactorDesc') }}
      </p>

      <!-- Error message -->
      <div
        v-if="errorMessage"
        class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
        role="alert"
      >
        <div class="flex items-center">
          <span class="material-icons text-red-500 mr-2">error_outline</span>
          <span>{{ errorMessage }}</span>
        </div>
      </div>

      <form class="space-y-6" @submit.prevent="handle2FAVerification">
        <div>
          <label for="twoFactorCode" class="form-label">{{ $t('auth.verificationCode') }}</label>
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
              id="twoFactorCode"
              v-model="twoFactorCode"
              type="text"
              class="form-input pl-10 text-center text-2xl tracking-widest"
              placeholder="000000"
              maxlength="6"
              pattern="[0-9]{6}"
              inputmode="numeric"
              required
              :disabled="loading"
              @input="handleCodeInput"
            />
          </div>
        </div>

        <button
          type="submit"
          class="w-full btn-primary flex items-center justify-center"
          :disabled="loading || twoFactorCode.length !== 6"
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
            {{ $t('auth.verifying') }}
          </span>
          <span v-else>{{ $t('auth.verify') }}</span>
        </button>

        <button
          type="button"
          class="w-full text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center"
          @click="backToLogin"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {{ $t('auth.backToLogin') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAsyncAction } from '@/composables/useAsyncAction'

const router = useRouter()
const authStore = useAuthStore()

// Async action composable
const { isLoading: loading, execute: executeAuth } = useAsyncAction({
  showSuccessToast: false,
  showErrorToast: false
})

// Form state
const email = ref('')
const password = ref('')
const errorMessage = ref(null)
const show2FAForm = ref(false)
const twoFactorCode = ref('')

// Handle login
const handleLogin = async () => {
  errorMessage.value = null

  await executeAuth(() => authStore.login({ email: email.value, password: password.value }), {
    onSuccess: result => {
      if (result && result.requires2FA) {
        show2FAForm.value = true
        errorMessage.value = null
      } else if (result && result.success) {
        if (result.forcePasswordChange) {
          router.push({ name: 'force-password-change' })
        } else {
          const pmsAutoSelect = localStorage.getItem('pmsAutoSelectHotel')
          const defaultPath = pmsAutoSelect ? '/pms/dashboard' : '/dashboard'
          const redirectPath = router.currentRoute.value.query.redirect || defaultPath
          router.push(redirectPath)
        }
      }
    },
    onError: error => {
      console.error('Login failed:', error)
      if (error.response?.data?.error) {
        errorMessage.value = error.response.data.error
      } else if (error.message) {
        errorMessage.value = error.message
      } else {
        errorMessage.value = 'An error occurred during login. Please try again.'
      }
    }
  })
}

// Handle 2FA verification
const handle2FAVerification = async () => {
  errorMessage.value = null

  await executeAuth(() => authStore.verify2FA(twoFactorCode.value), {
    onSuccess: result => {
      if (result && result.success) {
        if (result.forcePasswordChange) {
          router.push({ name: 'force-password-change' })
        } else {
          const pmsAutoSelect = localStorage.getItem('pmsAutoSelectHotel')
          const defaultPath = pmsAutoSelect ? '/pms/dashboard' : '/dashboard'
          const redirectPath = router.currentRoute.value.query.redirect || defaultPath
          router.push(redirectPath)
        }
      }
    },
    onError: error => {
      console.error('2FA verification failed:', error)
      if (error.response?.data?.error) {
        errorMessage.value = error.response.data.error
      } else if (error.message) {
        errorMessage.value = error.message
      } else {
        errorMessage.value = 'Verification failed. Please check the code and try again.'
      }
      twoFactorCode.value = ''
    }
  })
}

// Handle code input - only allow numbers
const handleCodeInput = event => {
  const value = event.target.value.replace(/[^0-9]/g, '')
  twoFactorCode.value = value
}

// Go back to login form
const backToLogin = () => {
  show2FAForm.value = false
  twoFactorCode.value = ''
  errorMessage.value = null
  password.value = ''
}
</script>

<style scoped>
/* Spinner animation is handled by Tailwind's animate-spin class */
</style>
