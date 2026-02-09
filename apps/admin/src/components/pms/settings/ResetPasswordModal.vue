<template>
  <Modal
    v-model="isOpen"
    :title="$t('settings.users.resetPasswordModal.title')"
    size="sm"
    :close-on-overlay="false"
  >
    <div class="space-y-4">
      <!-- User Info -->
      <div class="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('settings.users.resetPasswordModal.user') }}
        </p>
        <p class="font-medium text-gray-900 dark:text-white">
          {{ user?.name }}
        </p>
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ user?.email }}</p>
      </div>

      <!-- New Password -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('settings.users.resetPasswordModal.newPassword') }}
          <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <input
            v-model="newPassword"
            :type="showPassword ? 'text' : 'password'"
            required
            minlength="8"
            autocomplete="new-password"
            class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            :placeholder="$t('settings.users.resetPasswordModal.minCharacters')"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            @click="showPassword = !showPassword"
          >
            <span class="material-icons text-lg">{{
              showPassword ? 'visibility_off' : 'visibility'
            }}</span>
          </button>
        </div>
        <!-- Password strength hints -->
        <div v-if="newPassword" class="mt-1 space-y-0.5">
          <p class="text-xs" :class="newPassword.length >= 8 ? 'text-green-600' : 'text-red-500'">
            {{ newPassword.length >= 8 ? '&#10003;' : '&#10007;' }}
            {{ $t('settings.users.resetPasswordModal.minCharsRule') }}
          </p>
          <p class="text-xs" :class="/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-red-500'">
            {{ /[A-Z]/.test(newPassword) ? '&#10003;' : '&#10007;' }}
            {{ $t('settings.users.resetPasswordModal.uppercaseRule') }}
          </p>
          <p class="text-xs" :class="/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-red-500'">
            {{ /[a-z]/.test(newPassword) ? '&#10003;' : '&#10007;' }}
            {{ $t('settings.users.resetPasswordModal.lowercaseRule') }}
          </p>
          <p class="text-xs" :class="/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-red-500'">
            {{ /[0-9]/.test(newPassword) ? '&#10003;' : '&#10007;' }}
            {{ $t('settings.users.resetPasswordModal.numberRule') }}
          </p>
        </div>
      </div>

      <!-- Confirm Password -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('settings.users.resetPasswordModal.confirmPassword') }}
          <span class="text-red-500">*</span>
        </label>
        <input
          v-model="confirmPassword"
          :type="showPassword ? 'text' : 'password'"
          required
          minlength="8"
          autocomplete="new-password"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          :placeholder="$t('settings.users.resetPasswordModal.enterAgain')"
        />
      </div>

      <!-- Password Mismatch Warning -->
      <p
        v-if="confirmPassword && newPassword !== confirmPassword"
        class="text-sm text-red-500 flex items-center gap-1"
      >
        <span class="material-icons text-lg">warning</span>
        {{ $t('settings.users.resetPasswordModal.passwordMismatch') }}
      </p>

      <!-- Generate Random Password -->
      <button
        type="button"
        class="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
        @click="generatePassword"
      >
        <span class="material-icons text-lg">casino</span>
        {{ $t('settings.users.resetPasswordModal.generateRandom') }}
      </button>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
          @click="isOpen = false"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          :disabled="saving || !isPasswordValid"
          class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          @click="resetPassword"
        >
          <span v-if="saving" class="animate-spin material-icons text-lg">refresh</span>
          {{
            saving
              ? $t('settings.users.resetPasswordModal.resetting')
              : $t('settings.users.resetPasswordModal.reset')
          }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import adminUserService from '@/services/pms/adminUserService'

const props = defineProps({
  modelValue: Boolean,
  user: Object
})

const emit = defineEmits(['update:modelValue', 'reset'])

const { t } = useI18n()
const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const saving = ref(false)
const showPassword = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')

// Password validation: min 8 + uppercase + lowercase + number + match
const isPasswordValid = computed(() => {
  return (
    newPassword.value &&
    newPassword.value.length >= 8 &&
    /[A-Z]/.test(newPassword.value) &&
    /[a-z]/.test(newPassword.value) &&
    /[0-9]/.test(newPassword.value) &&
    newPassword.value === confirmPassword.value
  )
})

// Reset form when modal opens
watch(
  () => props.modelValue,
  val => {
    if (val) {
      newPassword.value = ''
      confirmPassword.value = ''
      showPassword.value = false
    }
  }
)

// Generate random password (meets BE complexity: uppercase + lowercase + number, min 8)
const generatePassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const all = upper + lower + digits

  let password = ''
  password += upper.charAt(Math.floor(Math.random() * upper.length))
  password += lower.charAt(Math.floor(Math.random() * lower.length))
  password += digits.charAt(Math.floor(Math.random() * digits.length))

  for (let i = 3; i < 10; i++) {
    password += all.charAt(Math.floor(Math.random() * all.length))
  }

  password = password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')

  newPassword.value = password
  confirmPassword.value = password
  showPassword.value = true
}

const resetPassword = async () => {
  if (!isPasswordValid.value) {
    toast.error(t('settings.users.resetPasswordModal.errors.passwordMinLength'))
    return
  }

  saving.value = true
  try {
    await adminUserService.resetPassword(props.user._id, newPassword.value)
    toast.success(t('settings.users.resetPasswordModal.success.passwordReset'))
    emit('reset')
  } catch (error) {
    console.error('Failed to reset password:', error)
    toast.error(t('settings.users.resetPasswordModal.errors.resetFailed'))
  } finally {
    saving.value = false
  }
}
</script>
