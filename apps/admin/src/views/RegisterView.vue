<template>
  <div
    class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4"
  >
    <!-- Top Bar: Language & Theme -->
    <div class="fixed top-4 right-4 flex items-center gap-2 z-50">
      <LanguageSelector />
      <button
        class="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        :title="isDark ? 'Light Mode' : 'Dark Mode'"
        @click="toggleTheme"
      >
        <span class="material-icons text-xl">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
      </button>
    </div>

    <div class="w-full max-w-2xl mx-auto">
      <!-- Success State -->
      <div v-if="success" class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
        <div
          class="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <span class="material-icons text-green-600 dark:text-green-400 text-4xl"
            >check_circle</span
          >
        </div>
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          {{ $t('auth.registrationSubmitted') }}
        </h2>
        <p class="text-gray-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
          {{ $t('auth.registrationPendingMessage') }}
        </p>
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
          <div class="flex items-start gap-3">
            <span class="material-icons text-blue-600 dark:text-blue-400 mt-0.5">info</span>
            <div class="text-left text-sm text-blue-700 dark:text-blue-300">
              <p class="font-medium mb-1">{{ $t('auth.whatHappensNext') }}</p>
              <ul class="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
                <li>{{ $t('auth.step1Review') }}</li>
                <li>{{ $t('auth.step2Approval') }}</li>
                <li>{{ $t('auth.step3Activation') }}</li>
              </ul>
            </div>
          </div>
        </div>
        <RouterLink to="/auth/login" class="btn-primary inline-flex items-center">
          <span class="material-icons mr-2">arrow_back</span>
          {{ $t('auth.backToLogin') }}
        </RouterLink>
      </div>

      <!-- Registration Form -->
      <div v-else class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r px-8 py-6 text-white" :class="branding.config.headerGradient">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <span class="material-icons text-3xl">{{ branding.icon }}</span>
            </div>
            <div>
              <h2 class="text-2xl font-bold">{{ $t(branding.config.registerTitle) }}</h2>
              <p class="mt-1 opacity-80">{{ $t(branding.config.registerSubtitle) }}</p>
            </div>
          </div>
        </div>

        <!-- Form Content -->
        <div class="p-8">
          <!-- Error Alert -->
          <div
            v-if="error"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6"
          >
            <div class="flex items-center gap-3">
              <span class="material-icons text-red-600 dark:text-red-400">error</span>
              <span class="text-red-700 dark:text-red-300">{{ error }}</span>
            </div>
          </div>

          <form class="space-y-6" @submit.prevent="handleRegister" novalidate>
            <!-- Company Information Section -->
            <div>
              <h3
                class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"
              >
                <span class="material-icons" :class="branding.config.accentColor">domain</span>
                {{ $t('auth.companyInfo') }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="companyName" class="form-label">{{ $t('auth.companyName') }} *</label>
                  <input
                    id="companyName"
                    v-model="form.companyName"
                    type="text"
                    class="form-input"
                    :class="{
                      'border-red-500 focus:border-red-500 focus:ring-red-500': errors.companyName
                    }"
                    :placeholder="$t('auth.companyNamePlaceholder')"
                    :disabled="loading"
                    @input="clearError('companyName')"
                  />
                  <p v-if="errors.companyName" class="mt-1 text-sm text-red-600 dark:text-red-400">
                    {{ errors.companyName }}
                  </p>
                </div>
                <div>
                  <label for="tradeName" class="form-label">{{ $t('auth.tradeName') }}</label>
                  <input
                    id="tradeName"
                    v-model="form.tradeName"
                    type="text"
                    class="form-input"
                    :placeholder="$t('auth.tradeNamePlaceholder')"
                    :disabled="loading"
                  />
                </div>
                <div>
                  <label for="taxOffice" class="form-label">{{ $t('auth.taxOffice') }}</label>
                  <input
                    id="taxOffice"
                    v-model="form.taxOffice"
                    type="text"
                    class="form-input"
                    :placeholder="$t('auth.taxOfficePlaceholder')"
                    :disabled="loading"
                  />
                </div>
                <div>
                  <label for="taxNumber" class="form-label">{{ $t('auth.taxNumber') }}</label>
                  <input
                    id="taxNumber"
                    v-model="form.taxNumber"
                    type="text"
                    class="form-input"
                    placeholder="1234567890"
                    :disabled="loading"
                  />
                </div>
              </div>
            </div>

            <!-- Contact Person Section -->
            <div>
              <h3
                class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"
              >
                <span class="material-icons" :class="branding.config.accentColor">person</span>
                {{ $t('auth.contactPerson') }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label for="name" class="form-label">{{ $t('auth.fullName') }} *</label>
                  <input
                    id="name"
                    v-model="form.name"
                    type="text"
                    class="form-input"
                    :class="{
                      'border-red-500 focus:border-red-500 focus:ring-red-500': errors.name
                    }"
                    :placeholder="$t('auth.fullNamePlaceholder')"
                    :disabled="loading"
                    @input="clearError('name')"
                  />
                  <p v-if="errors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">
                    {{ errors.name }}
                  </p>
                </div>
                <div>
                  <label for="email" class="form-label">{{ $t('auth.email') }} *</label>
                  <div class="relative">
                    <span
                      class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >email</span
                    >
                    <input
                      id="email"
                      v-model="form.email"
                      type="email"
                      class="form-input pl-10"
                      :class="{
                        'border-red-500 focus:border-red-500 focus:ring-red-500': errors.email
                      }"
                      placeholder="ornek@sirket.com"
                      :disabled="loading"
                      @input="clearError('email')"
                    />
                  </div>
                  <p v-if="errors.email" class="mt-1 text-sm text-red-600 dark:text-red-400">
                    {{ errors.email }}
                  </p>
                </div>
                <div>
                  <PhoneInput
                    v-model="form.phone"
                    :label="$t('auth.phone')"
                    :required="true"
                    :disabled="loading"
                    :error="errors.phone"
                    :country="form.address.country"
                    @change="clearError('phone')"
                  />
                </div>
              </div>
            </div>

            <!-- Address Section -->
            <div>
              <h3
                class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"
              >
                <span class="material-icons" :class="branding.config.accentColor">location_on</span>
                {{ $t('auth.address') }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label for="street" class="form-label">{{ $t('auth.streetAddress') }}</label>
                  <input
                    id="street"
                    v-model="form.address.street"
                    type="text"
                    class="form-input"
                    :placeholder="$t('auth.streetPlaceholder')"
                    :disabled="loading"
                  />
                </div>
                <div>
                  <label for="city" class="form-label">{{ $t('auth.city') }}</label>
                  <input
                    id="city"
                    v-model="form.address.city"
                    type="text"
                    class="form-input"
                    :disabled="loading"
                  />
                </div>
                <div>
                  <label for="country" class="form-label">{{ $t('auth.country') }}</label>
                  <CountrySelect v-model="form.address.country" :disabled="loading" />
                </div>
              </div>
            </div>

            <!-- Terms & Privacy -->
            <div
              class="rounded-xl p-4 transition-colors"
              :class="
                errors.acceptTerms
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
                  : 'bg-gray-50 dark:bg-slate-700/50'
              "
            >
              <label class="flex items-start gap-3 cursor-pointer">
                <input
                  v-model="form.acceptTerms"
                  type="checkbox"
                  class="mt-1 h-4 w-4 border-gray-300 rounded"
                  :class="branding.config.checkboxColor"
                  @change="clearError('acceptTerms')"
                />
                <span
                  class="text-sm"
                  :class="
                    errors.acceptTerms
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-slate-400'
                  "
                >
                  {{ $t('auth.termsPrefix') }}
                  <a href="#" class="hover:underline" :class="branding.config.accentColor">{{
                    $t('auth.termsOfService')
                  }}</a>
                  {{ $t('auth.and') }}
                  <a href="#" class="hover:underline" :class="branding.config.accentColor">{{
                    $t('auth.privacyPolicy')
                  }}</a>
                  {{ $t('auth.termsSuffix') }}
                </span>
              </label>
              <p v-if="errors.acceptTerms" class="mt-2 text-sm text-red-600 dark:text-red-400 ml-7">
                {{ errors.acceptTerms }}
              </p>
            </div>

            <!-- Info Box -->
            <div
              class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
            >
              <div class="flex items-start gap-3">
                <span class="material-icons text-amber-600 dark:text-amber-400 mt-0.5"
                  >lightbulb</span
                >
                <p class="text-sm text-amber-700 dark:text-amber-300">
                  {{ $t('auth.noPasswordNote') }}
                </p>
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="w-full btn-primary py-3 text-lg" :disabled="loading">
              <span v-if="loading" class="flex items-center justify-center">
                <span class="material-icons animate-spin mr-2">sync</span>
                {{ $t('auth.submitting') }}
              </span>
              <span v-else class="flex items-center justify-center">
                <span class="material-icons mr-2">send</span>
                {{ $t('auth.submitApplication') }}
              </span>
            </button>
          </form>

          <!-- Login Link -->
          <div class="mt-6 text-center pt-6 border-t border-gray-200 dark:border-slate-700">
            <p class="text-gray-600 dark:text-slate-400">
              {{ $t('auth.alreadyHaveAccount') }}
              <RouterLink to="/auth/login" class="font-medium" :class="branding.config.linkColor">
                {{ $t('auth.loginHere') }}
              </RouterLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { RouterLink } from 'vue-router'
import apiClient from '@/services/api'
import { useI18n } from 'vue-i18n'
import CountrySelect from '@/components/common/CountrySelect.vue'
import LanguageSelector from '@/components/common/LanguageSelector.vue'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import { useUIStore } from '@/stores/ui'
import { useDomainBranding } from '@/composables/useDomainBranding'

const { t } = useI18n()
const uiStore = useUIStore()
const branding = useDomainBranding()

const isDark = computed(() => uiStore.darkMode)
const toggleTheme = () => uiStore.toggleDarkMode()

const loading = ref(false)
const error = ref('')
const success = ref(false)

const form = ref({
  companyName: '',
  tradeName: '',
  name: '',
  email: '',
  phone: '',
  taxOffice: '',
  taxNumber: '',
  address: {
    street: '',
    city: '',
    country: 'TR'
  },
  acceptTerms: false
})

const errors = reactive({
  companyName: '',
  name: '',
  email: '',
  phone: '',
  acceptTerms: ''
})

const clearError = field => {
  errors[field] = ''
}

const clearAllErrors = () => {
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

const validateForm = () => {
  clearAllErrors()
  let isValid = true

  // Company name
  if (!form.value.companyName.trim()) {
    errors.companyName = t('validation.required', { field: t('auth.companyName') })
    isValid = false
  } else if (form.value.companyName.trim().length < 2) {
    errors.companyName = t('validation.minLength', { field: t('auth.companyName'), min: 2 })
    isValid = false
  }

  // Full name
  if (!form.value.name.trim()) {
    errors.name = t('validation.required', { field: t('auth.fullName') })
    isValid = false
  } else if (form.value.name.trim().length < 2) {
    errors.name = t('validation.minLength', { field: t('auth.fullName'), min: 2 })
    isValid = false
  }

  // Email
  if (!form.value.email.trim()) {
    errors.email = t('validation.required', { field: t('auth.email') })
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.email = t('validation.invalidEmail')
    isValid = false
  }

  // Phone
  if (!form.value.phone.trim()) {
    errors.phone = t('validation.required', { field: t('auth.phone') })
    isValid = false
  } else if (form.value.phone.replace(/\D/g, '').length < 10) {
    errors.phone = t('validation.invalidPhone')
    isValid = false
  }

  // Terms
  if (!form.value.acceptTerms) {
    errors.acceptTerms = t('auth.acceptTermsRequired')
    isValid = false
  }

  return isValid
}

const handleRegister = async () => {
  error.value = ''

  if (!validateForm()) {
    // Scroll to first error
    const firstErrorField = document.querySelector('.border-red-500')
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  loading.value = true

  try {
    const response = await apiClient.post('/auth/register', {
      companyName: form.value.companyName.trim(),
      tradeName: form.value.tradeName.trim(),
      name: form.value.name.trim(),
      email: form.value.email.trim().toLowerCase(),
      phone: form.value.phone.trim(),
      taxOffice: form.value.taxOffice.trim(),
      taxNumber: form.value.taxNumber.trim(),
      address: form.value.address,
      partnerType: branding.partnerType
    })

    if (response.data.success) {
      success.value = true
    }
  } catch (err) {
    error.value = err.response?.data?.message || t('auth.registrationFailed')
  } finally {
    loading.value = false
  }
}
</script>
