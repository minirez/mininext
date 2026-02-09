import { onMounted, onUnmounted, watch } from 'vue'
import { useSocket } from './useSocket'

/**
 * Composable for receiving real-time PMS updates via WebSocket
 * Joins hotel:{hotelId} room and listens for PMS events
 *
 * @param {Ref<string>|string} hotelId - Reactive or static hotel ID
 * @param {Object} callbacks - Event callback functions
 * @param {Function} callbacks.onCheckIn - Guest check-in event
 * @param {Function} callbacks.onCheckOut - Guest check-out event
 * @param {Function} callbacks.onStayUpdated - Stay record updated
 * @param {Function} callbacks.onRoomStatus - Room status changed
 * @param {Function} callbacks.onHousekeeping - Housekeeping status changed
 * @param {Function} callbacks.onReservation - Reservation created/updated
 * @param {Function} callbacks.onTransaction - Transaction event
 */
export function usePmsSocket(hotelId, callbacks = {}) {
  const { join, leave, on, off, isConnected } = useSocket()

  let currentRoom = null

  const eventMap = {
    checkin: 'onCheckIn',
    checkout: 'onCheckOut',
    'stay:updated': 'onStayUpdated',
    'room:status': 'onRoomStatus',
    housekeeping: 'onHousekeeping',
    reservation: 'onReservation',
    transaction: 'onTransaction'
  }

  const handler = (event, data) => {
    const cbName = eventMap[event]
    if (cbName && callbacks[cbName]) {
      callbacks[cbName](data)
    }
  }

  const eventHandlers = {}
  for (const event of Object.keys(eventMap)) {
    eventHandlers[event] = data => handler(event, data)
  }

  const joinRoom = hId => {
    if (!hId) return

    const room = `hotel:${hId}`

    if (currentRoom && currentRoom !== room) {
      leaveRoom()
    }

    join(room)
    currentRoom = room

    for (const [event, fn] of Object.entries(eventHandlers)) {
      on(event, fn)
    }
  }

  const leaveRoom = () => {
    if (currentRoom) {
      for (const [event, fn] of Object.entries(eventHandlers)) {
        off(event, fn)
      }
      leave(currentRoom)
      currentRoom = null
    }
  }

  const getHotelIdValue = () => {
    if (!hotelId) return null
    return typeof hotelId === 'object' && 'value' in hotelId ? hotelId.value : hotelId
  }

  watch(
    () => getHotelIdValue(),
    newHotelId => {
      if (newHotelId) {
        joinRoom(newHotelId)
      } else {
        leaveRoom()
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    const hId = getHotelIdValue()
    if (hId) {
      joinRoom(hId)
    }
  })

  onUnmounted(() => {
    leaveRoom()
  })

  return {
    isConnected,
    joinRoom,
    leaveRoom
  }
}

export default usePmsSocket
