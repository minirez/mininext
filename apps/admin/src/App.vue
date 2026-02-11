<template>
  <div>
    <RouterView />
    <!-- Development: Missing translation keys panel -->
    <MissingKeysPanel v-if="isDev" />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useSocket } from '@/composables/useSocket'
import MissingKeysPanel from '@/components/dev/MissingKeysPanel.vue'

const isDev = import.meta.env.DEV

// Stores initialized lazily to avoid Pinia initialization issues during HMR
let authStore = null
let notificationStore = null
let mailboxStore = null

const getStores = async () => {
  if (!authStore) {
    const { useAuthStore } = await import('@/stores/auth')
    const { useNotificationStore } = await import('@/stores/notification')
    const { useMailboxStore } = await import('@/stores/mailbox')
    authStore = useAuthStore()
    notificationStore = useNotificationStore()
    mailboxStore = useMailboxStore()
  }
  return { authStore, notificationStore, mailboxStore }
}

// Initialize notifications when user is authenticated
const initNotifications = async () => {
  const { authStore, notificationStore, mailboxStore } = await getStores()
  const { authenticate, on } = useSocket()

  // Only handle authenticated users
  if (!authStore.isAuthenticated || !authStore.user?._id) {
    return
  }

  const userId = authStore.user._id
  authenticate(userId, 'User')

  // Listen for new notifications
  on('notification:new', data => {
    notificationStore.handleNewNotification(data.notification)
  })

  // Listen for notification count updates
  on('notification:count', data => {
    notificationStore.handleCountUpdate(data.count)
  })

  // Fetch initial unread count
  await notificationStore.init()

  // Initialize mailbox store (platform admin only)
  if (authStore.isPlatformAdmin) {
    on('mailbox:new', () => {
      mailboxStore.handleNewEmail()
    })
    await mailboxStore.init()
  }
}

onMounted(async () => {
  const { authStore, notificationStore, mailboxStore } = await getStores()

  // Watch for auth changes
  watch(
    () => authStore.isAuthenticated,
    isAuth => {
      if (isAuth) {
        initNotifications()
      } else {
        notificationStore.clearNotifications()
        mailboxStore.setUnreadCount(0)
      }
    }
  )

  // Check if user is already authenticated on app load
  await authStore.checkAuth()

  if (authStore.isAuthenticated) {
    await initNotifications()
  }
})
</script>

<style>
/* Remove default margins and ensure full height */
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100%;
}

/* Ensure smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Focus styles */
:focus {
  outline: 2px solid theme('colors.purple.500');
  outline-offset: 2px;
}

/* Custom selection color */
::selection {
  background-color: theme('colors.purple.200');
  color: theme('colors.purple.900');
}
</style>
