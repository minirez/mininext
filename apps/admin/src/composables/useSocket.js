/**
 * Socket.io Composable
 *
 * Singleton socket connection manager.
 *
 * Önemli:
 * - Socket bağlantısı uygulama genelinde tek bir instance kullanır
 * - Logout'ta disconnect() çağrılmalıdır
 * - Reconnection stratejisi otomatiktir
 *
 * Kullanım:
 *   const { socket, isConnected, join, leave, on, off, disconnect } = useSocket()
 */

import { ref, readonly } from 'vue'
import { io } from 'socket.io-client'
import { socketLogger } from '@/utils/logger'

// ============================================================================
// SINGLETON STATE
// ============================================================================

let socketInstance = null
const isConnected = ref(false)
const connectionError = ref(null)
const connectionAttempts = ref(0)
const joinedRooms = ref(new Set())
const authenticatedUserId = ref(null)

// Event listeners registry (for cleanup)
const registeredListeners = new Map()

// ============================================================================
// SOCKET CONFIGURATION
// ============================================================================

const getSocketConfig = () => ({
  transports: ['websocket', 'polling'],
  autoConnect: false, // Manuel control
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  auth: {
    token: localStorage.getItem('token')
  }
})

// ============================================================================
// SOCKET INSTANCE MANAGEMENT
// ============================================================================

/**
 * Get or create socket instance
 * @returns {Socket} Socket.io instance
 */
const getSocketInstance = () => {
  if (socketInstance) return socketInstance

  // Socket URL - API URL'den /api prefix'ini çıkar
  let baseUrl =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'https://api.maxirez.com'
  // Socket.IO /api prefix'siz çalışır
  baseUrl = baseUrl.replace(/\/api\/?$/, '')

  socketLogger.debug('[Socket] Creating new instance, connecting to:', baseUrl)

  socketInstance = io(baseUrl, getSocketConfig())

  // Connection events
  socketInstance.on('connect', () => {
    isConnected.value = true
    connectionError.value = null
    connectionAttempts.value = 0
    socketLogger.debug('[Socket] Connected:', socketInstance.id)

    // Re-join previously joined rooms
    if (joinedRooms.value.size > 0) {
      socketLogger.debug('[Socket] Re-joining rooms:', Array.from(joinedRooms.value))
      joinedRooms.value.forEach(room => {
        socketInstance.emit('join', room)
      })
    }

    // Re-authenticate if was authenticated
    if (authenticatedUserId.value) {
      socketInstance.emit('authenticate', {
        userId: authenticatedUserId.value.id,
        userType: authenticatedUserId.value.type
      })
    }
  })

  socketInstance.on('disconnect', reason => {
    isConnected.value = false
    socketLogger.debug('[Socket] Disconnected:', reason)

    // Don't clear rooms on temporary disconnection
    if (reason === 'io server disconnect') {
      // Server disconnected us - might need to re-auth
      socketLogger.debug('[Socket] Server initiated disconnect')
    }
  })

  socketInstance.on('connect_error', error => {
    connectionError.value = error.message
    connectionAttempts.value++
    socketLogger.error(
      '[Socket] Connection error:',
      error.message,
      `(attempt ${connectionAttempts.value})`
    )
  })

  socketInstance.on('reconnect', attemptNumber => {
    socketLogger.debug('[Socket] Reconnected after', attemptNumber, 'attempts')
  })

  socketInstance.on('reconnect_failed', () => {
    socketLogger.error('[Socket] Reconnection failed after max attempts')
    connectionError.value = 'Reconnection failed'
  })

  // Auth acknowledgment
  socketInstance.on('authenticated', data => {
    socketLogger.debug('[Socket] Authenticated:', data)
  })

  return socketInstance
}

/**
 * Connect socket (if not connected)
 */
const connect = () => {
  const socket = getSocketInstance()
  if (!socket.connected) {
    // Update auth token before connecting (may have been refreshed)
    socket.auth = { token: localStorage.getItem('token') }
    socketLogger.debug('[Socket] Connecting...')
    socket.connect()
  }
  return socket
}

/**
 * Disconnect socket and cleanup
 */
const disconnect = () => {
  if (!socketInstance) return

  socketLogger.debug('[Socket] Disconnecting and cleaning up...')

  // Remove all registered listeners
  registeredListeners.forEach((callbacks, event) => {
    callbacks.forEach(cb => {
      socketInstance.off(event, cb)
    })
  })
  registeredListeners.clear()

  // Clear state
  joinedRooms.value.clear()
  authenticatedUserId.value = null
  isConnected.value = false
  connectionError.value = null

  // Disconnect
  socketInstance.disconnect()
  socketInstance = null

  socketLogger.debug('[Socket] Disconnected and cleaned up')
}

// ============================================================================
// COMPOSABLE
// ============================================================================

export function useSocket() {
  /**
   * Ensure socket is connected
   */
  const ensureConnected = () => {
    return connect()
  }

  /**
   * Authenticate user for user-specific notifications
   * @param {string} userId - User ID
   * @param {string} userType - 'User' | 'PMSUser' | 'AgencyUser'
   */
  const authenticate = (userId, userType = 'User') => {
    if (!userId) {
      socketLogger.warn('[Socket] Cannot authenticate: no userId')
      return
    }

    const socket = ensureConnected()
    authenticatedUserId.value = { id: userId, type: userType }
    socket.emit('authenticate', { userId, userType })
    socketLogger.debug(`[Socket] Authenticating as ${userType}:${userId}`)
  }

  /**
   * Join a room
   * @param {string} room - Room name
   */
  const join = room => {
    if (!room) {
      socketLogger.warn('[Socket] Cannot join: no room name')
      return
    }

    const socket = ensureConnected()
    if (!joinedRooms.value.has(room)) {
      socket.emit('join', room)
      joinedRooms.value.add(room)
      socketLogger.debug('[Socket] Joined room:', room)
    }
  }

  /**
   * Leave a room
   * @param {string} room - Room name
   */
  const leave = room => {
    if (!room || !socketInstance) return

    if (joinedRooms.value.has(room)) {
      socketInstance.emit('leave', room)
      joinedRooms.value.delete(room)
      socketLogger.debug('[Socket] Left room:', room)
    }
  }

  /**
   * Leave all rooms
   */
  const leaveAll = () => {
    if (!socketInstance) return

    joinedRooms.value.forEach(room => {
      socketInstance.emit('leave', room)
    })
    joinedRooms.value.clear()
    socketLogger.debug('[Socket] Left all rooms')
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  const on = (event, callback) => {
    const socket = ensureConnected()

    // Register listener
    socket.on(event, callback)

    // Track for cleanup
    if (!registeredListeners.has(event)) {
      registeredListeners.set(event, new Set())
    }
    registeredListeners.get(event).add(callback)

    // Return unsubscribe function
    return () => {
      off(event, callback)
    }
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Optional specific callback
   */
  const off = (event, callback) => {
    if (!socketInstance) return

    if (callback) {
      socketInstance.off(event, callback)
      registeredListeners.get(event)?.delete(callback)
    } else {
      socketInstance.removeAllListeners(event)
      registeredListeners.delete(event)
    }
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  const emit = (event, data) => {
    const socket = ensureConnected()
    socket.emit(event, data)
  }

  /**
   * Get current socket instance (for advanced use)
   */
  const getSocket = () => {
    return ensureConnected()
  }

  /**
   * Get joined rooms
   */
  const getRooms = () => {
    return Array.from(joinedRooms.value)
  }

  /**
   * Debug info
   */
  const debug = () => {
    socketLogger.debug('[Socket Debug]')
    socketLogger.debug('Connected:', isConnected.value)
    socketLogger.debug('Socket ID:', socketInstance?.id)
    socketLogger.debug('Joined Rooms:', Array.from(joinedRooms.value))
    socketLogger.debug('Authenticated User:', authenticatedUserId.value)
    socketLogger.debug('Registered Events:', Array.from(registeredListeners.keys()))
    socketLogger.debug('Connection Error:', connectionError.value)
    socketLogger.debug('Connection Attempts:', connectionAttempts.value)
  }

  return {
    // State (readonly)
    isConnected: readonly(isConnected),
    connectionError: readonly(connectionError),

    // Connection management
    connect,
    disconnect,
    ensureConnected,

    // Authentication
    authenticate,

    // Room management
    join,
    leave,
    leaveAll,
    getRooms,

    // Event handling
    on,
    off,
    emit,

    // Advanced
    getSocket,
    socket: getSocketInstance(),

    // Debug
    debug
  }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Disconnect socket (can be called from outside composable)
 * Use this in logout flows
 */
export const disconnectSocket = () => {
  disconnect()
}

/**
 * Check if socket is connected
 */
export const isSocketConnected = () => {
  return isConnected.value
}

export default useSocket
