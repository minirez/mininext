<template>
  <div>
    <h2 class="text-2xl font-bold text-center text-gray-800 mb-2">{{ $t('auth.changePasswordRequired') }}</h2>
    <p class="text-center text-gray-600 mb-8">{{ $t('auth.changePasswordRequiredDesc') }}</p>

    <!-- Success message -->
    <div
      v-if="successMessage"
      class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6"
      role="alert"
    >
      <div class="flex items-center">
        <span class="material-icons text-green-500 mr-2">check_circle</span>
        <span>{{ successMessage }}</span>
      </div>
    </div>

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

    <!-- Warning message -->
    <div class="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg mb-6">
      <div class="flex items-start">
        <span class="material-icons text-amber-500 mr-2 mt-0.5">warning</span>
        <div>
          <p class="font-medium">{{ $t('auth.securityNotice') }}</p>
          <p class="text-sm mt-1">{{ $t('auth.passwordRequirements') }}</p>
        </div>
      </div>
    </div>

    <!-- Password Change Form -->
    <form @submit.prevent="handleChangePassword" class="space-y-6">
      <div>
        <label for="currentPassword" class="form-label">{{ $t('auth.currentPassword') }}</label>
        <div class="relative">
          <svg class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <input
            type="password"
            id="currentPassword"
            v-model="currentPassword"
            class="form-input pl-10"
            :placeholder="$t('auth.enterCurrentPassword')"
            required
            :disabled="loading"
            autocomplete="current-password"
          />
        </div>
      </div>

      <div>
        <label for="newPassword" class="form-label">{{ $t('auth.newPassword') }}</label>
        <div class="relative">
          <svg class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <input
            type="password"
            id="newPassword"
            v-model="newPassword"
            class="form-input pl-10"
            :placeholder="$t('auth.enterNewPassword')"
            required
            minlength="8"
            :disabled="loading"
            autocomplete="new-password"
          />
        </div>
        <p class="text-xs text-gray-500 mt-1">{{ $t('auth.minPasswordLength') }}</p>
      </div>

      <div>
        <label for="confirmPassword" class="form-label">{{ $t('auth.confirmPassword') }}</label>
        <div class="relative">
          <svg class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            class="form-input pl-10"
            :placeholder="$t('auth.confirmNewPassword')"
            required
            :disabled="loading"
            autocomplete="new-password"
          />
        </div>
      </div>

      <button
        type="submit"
        class="w-full btn-primary flex items-center justify-center"
        :disabled="loading || !isFormValid"
      >
        <span v-if="loading" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ $t('auth.changingPassword') }}
        </span>
        <span v-else class="flex items-center">
          {{ $t('auth.changePassword') }}
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import authService from '@/services/authService'

const router = useRouter()
const authStore = useAuthStore()

// Form state
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref(null)
const successMessage = ref(null)

// Form validation
const isFormValid = computed(() => {
  return (
    currentPassword.value.length > 0 &&
    newPassword.value.length >= 8 &&
    newPassword.value === confirmPassword.value
  )
})

// Handle password change
const handleChangePassword = async () => {
  // Validate passwords match
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  // Validate minimum length
  if (newPassword.value.length < 8) {
    errorMessage.value = 'New password must be at least 8 characters'
    return
  }

  loading.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const response = await authService.changePassword(
      currentPassword.value,
      newPassword.value
    )

    if (response.success) {
      // Clear force password change flag
      authStore.clearForcePasswordChange()

      successMessage.value = response.message || 'Password changed successfully'

      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } else {
      throw new Error(response.message || 'Failed to change password')
    }
  } catch (error) {
    console.error('Password change failed:', error)

    if (error.response?.data?.error) {
      errorMessage.value = error.response.data.error
    } else if (error.message) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'An error occurred. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>
