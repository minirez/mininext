import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import mailboxService from '@/services/mailboxService'
import { storeLogger } from '@/utils/logger'

export const useMailboxStore = defineStore('mailbox', () => {
  // State
  const unreadCount = ref(0)

  // Getters
  const hasUnread = computed(() => unreadCount.value > 0)

  // Actions

  /**
   * Fetch unread count from API
   */
  async function fetchUnreadCount() {
    try {
      const response = await mailboxService.getEmailStats()
      if (response.success) {
        unreadCount.value = response.data.unread || 0
      }
    } catch (error) {
      storeLogger.error('Failed to fetch mailbox unread count:', error)
    }
  }

  /**
   * Handle new email from socket
   */
  function handleNewEmail() {
    unreadCount.value++
  }

  /**
   * Decrement unread count (when an email is read)
   */
  function decrementUnread() {
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }

  /**
   * Set unread count directly (for MailboxView sync)
   */
  function setUnreadCount(n) {
    unreadCount.value = n || 0
  }

  /**
   * Initialize store
   */
  async function init() {
    await fetchUnreadCount()
  }

  return {
    // State
    unreadCount,

    // Getters
    hasUnread,

    // Actions
    fetchUnreadCount,
    handleNewEmail,
    decrementUnread,
    setUnreadCount,
    init
  }
})
