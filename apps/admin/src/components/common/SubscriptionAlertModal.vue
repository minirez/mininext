<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="dismiss"
      >
        <Transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div
            v-if="visible"
            class="relative w-full max-w-md mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <!-- Top accent bar -->
            <div class="h-1.5" :class="accentClass"></div>

            <!-- Content -->
            <div class="px-6 pt-6 pb-4 text-center">
              <!-- Icon -->
              <div
                class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                :class="iconBgClass"
              >
                <span class="material-icons text-3xl" :class="iconClass">
                  {{ alertIcon }}
                </span>
              </div>

              <!-- Title -->
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {{ alertTitle }}
              </h3>

              <!-- Description -->
              <p class="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                {{ alertDescription }}
              </p>

              <!-- Remaining days badge -->
              <div
                v-if="alert?.remainingDays != null"
                class="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-semibold"
                :class="daysBadgeClass"
              >
                <span class="material-icons text-base">schedule</span>
                {{ $t('subscriptionAlert.daysRemaining', { days: alert.remainingDays }) }}
              </div>
            </div>

            <!-- Actions -->
            <div class="px-6 pb-6 space-y-2">
              <button
                class="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                :class="primaryBtnClass"
                @click="goToSubscription"
              >
                <span class="material-icons text-base">{{ primaryBtnIcon }}</span>
                {{ primaryBtnLabel }}
              </button>
              <button
                class="w-full py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                @click="dismiss"
              >
                {{ $t('subscriptionAlert.remindLater') }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import partnerService from '@/services/partnerService'

const ALERT_COOLDOWN_KEY = 'subscription_alert_dismissed_at'
const COOLDOWN_MS = 30 * 60 * 1000 // 30 min between dismissals

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const visible = ref(false)
const alert = ref(null)

const accentClass = computed(() => {
  const type = alert.value?.type
  if (type === 'trial') return 'bg-gradient-to-r from-blue-500 to-indigo-500'
  if (type === 'renewal_warning') return 'bg-gradient-to-r from-amber-400 to-orange-500'
  if (type === 'grace_period') return 'bg-gradient-to-r from-red-400 to-rose-500'
  if (type === 'expired') return 'bg-gradient-to-r from-red-600 to-red-700'
  return 'bg-gray-300'
})

const iconBgClass = computed(() => {
  const type = alert.value?.type
  if (type === 'trial') return 'bg-blue-50 dark:bg-blue-900/20'
  if (type === 'renewal_warning') return 'bg-amber-50 dark:bg-amber-900/20'
  if (type === 'grace_period') return 'bg-red-50 dark:bg-red-900/20'
  if (type === 'expired') return 'bg-red-50 dark:bg-red-900/20'
  return 'bg-gray-50'
})

const iconClass = computed(() => {
  const type = alert.value?.type
  if (type === 'trial') return 'text-blue-500'
  if (type === 'renewal_warning') return 'text-amber-500'
  if (type === 'grace_period') return 'text-red-500'
  if (type === 'expired') return 'text-red-600'
  return 'text-gray-400'
})

const alertIcon = computed(() => {
  const type = alert.value?.type
  if (type === 'trial') return 'timer'
  if (type === 'renewal_warning') return 'notifications_active'
  if (type === 'grace_period') return 'warning'
  if (type === 'expired') return 'block'
  return 'info'
})

const alertTitle = computed(() => {
  const type = alert.value?.type
  if (type === 'trial') return t('subscriptionAlert.trialTitle')
  if (type === 'renewal_warning') return t('subscriptionAlert.renewalTitle')
  if (type === 'grace_period') return t('subscriptionAlert.graceTitle')
  if (type === 'expired') return t('subscriptionAlert.expiredTitle')
  return ''
})

const alertDescription = computed(() => {
  const type = alert.value?.type
  const days = alert.value?.remainingDays
  if (type === 'trial') return t('subscriptionAlert.trialDescription', { days })
  if (type === 'renewal_warning') return t('subscriptionAlert.renewalDescription', { days })
  if (type === 'grace_period') return t('subscriptionAlert.graceDescription', { days })
  if (type === 'expired') return t('subscriptionAlert.expiredDescription')
  return ''
})

const daysBadgeClass = computed(() => {
  const type = alert.value?.type
  if (type === 'trial') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  if (type === 'renewal_warning')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  if (type === 'grace_period') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (type === 'expired') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  return 'bg-gray-100 text-gray-700'
})

const primaryBtnClass = computed(() => {
  const type = alert.value?.type
  if (type === 'trial')
    return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/20'
  if (type === 'renewal_warning')
    return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/20'
  return 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-lg shadow-red-500/20'
})

const primaryBtnIcon = computed(() => {
  const type = alert.value?.type
  if (type === 'trial') return 'payment'
  if (type === 'renewal_warning') return 'autorenew'
  return 'payment'
})

const primaryBtnLabel = computed(() => {
  const type = alert.value?.type
  if (type === 'trial') return t('subscriptionAlert.goToPayment')
  if (type === 'renewal_warning') return t('subscriptionAlert.renewNow')
  if (type === 'grace_period') return t('subscriptionAlert.payNow')
  if (type === 'expired') return t('subscriptionAlert.reactivate')
  return t('subscriptionAlert.goToPayment')
})

function dismiss() {
  visible.value = false
  sessionStorage.setItem(ALERT_COOLDOWN_KEY, Date.now().toString())
}

function goToSubscription() {
  visible.value = false
  router.push({ name: 'my-subscription' })
}

function shouldShowAlert() {
  const dismissed = sessionStorage.getItem(ALERT_COOLDOWN_KEY)
  if (dismissed) {
    const elapsed = Date.now() - parseInt(dismissed, 10)
    if (elapsed < COOLDOWN_MS) return false
  }
  return true
}

let visibilityHandler = null

async function checkAlert() {
  if (authStore.accountType !== 'partner') return
  if (!authStore.isAuthenticated) return
  if (!shouldShowAlert()) return

  try {
    const res = await partnerService.getSubscriptionAlert()
    if (res.data?.show) {
      alert.value = res.data
      visible.value = true
    }
  } catch {
    // Silently fail
  }
}

onMounted(() => {
  checkAlert()

  visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      checkAlert()
    }
  }
  document.addEventListener('visibilitychange', visibilityHandler)
})

onUnmounted(() => {
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
  }
})
</script>
