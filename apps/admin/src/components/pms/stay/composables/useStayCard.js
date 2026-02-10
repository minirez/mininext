import { ref, computed, watch } from 'vue'
import apiClient from '@/services/api'
import { useToast } from 'vue-toastification'

/**
 * Composable for StayCard state management
 * Handles all stay-related operations: payments, charges, notes, etc.
 */
export function useStayCard(stayId, hotelId) {
  const toast = useToast()

  // State
  const stay = ref(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)
  const activeTab = ref('overview')
  const quickPaymentOpen = ref(false)

  // Currency data
  const availableCurrencies = ref(['TRY', 'USD', 'EUR', 'GBP'])
  const exchangeRates = ref({})

  // Shift data
  const activeShift = ref(null)

  // Computed
  const balance = computed(() => stay.value?.balance || 0)
  const isBalanceDue = computed(() => balance.value > 0)
  const totalAmount = computed(() => stay.value?.totalAmount || 0)
  const paidAmount = computed(() => stay.value?.paidAmount || 0)

  const mainGuest = computed(() => {
    if (!stay.value?.guests?.length) return null
    return stay.value.guests.find(g => g.isMainGuest) || stay.value.guests[0]
  })

  const guestCount = computed(() => {
    if (!stay.value) return { adults: 0, children: 0, total: 0 }
    const adults =
      stay.value.adultsCount || stay.value.guests?.filter(g => g.type === 'adult').length || 0
    const children =
      stay.value.childrenCount || stay.value.guests?.filter(g => g.type !== 'adult').length || 0
    return { adults, children, total: adults + children }
  })

  const nights = computed(() => {
    if (!stay.value?.checkInDate || !stay.value?.checkOutDate) return 0
    const checkIn = new Date(stay.value.checkInDate)
    const checkOut = new Date(stay.value.checkOutDate)
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
  })

  const paymentStatusInfo = computed(() => {
    const status = stay.value?.paymentStatus || 'pending'
    const statusMap = {
      paid: { label: 'Ödendi', color: 'green', icon: 'check_circle' },
      partial: { label: 'Kısmi Ödeme', color: 'amber', icon: 'schedule' },
      pending: { label: 'Ödeme Bekliyor', color: 'red', icon: 'warning' },
      refunded: { label: 'İade Edildi', color: 'blue', icon: 'replay' }
    }
    return statusMap[status] || statusMap.pending
  })

  const stayStatusInfo = computed(() => {
    const status = stay.value?.status || 'pending'
    const statusMap = {
      checked_in: { label: 'Aktif', color: 'green', icon: 'hotel' },
      checked_out: { label: 'Çıkış Yapıldı', color: 'gray', icon: 'logout' },
      pending: { label: 'Beklemede', color: 'amber', icon: 'schedule' },
      cancelled: { label: 'İptal', color: 'red', icon: 'cancel' },
      no_show: { label: 'Gelmedi', color: 'red', icon: 'person_off' }
    }
    return statusMap[status] || statusMap.pending
  })

  const shiftWarning = computed(() => {
    if (!activeShift.value) {
      return { type: 'no_shift' }
    }
    const openedAt = new Date(activeShift.value.openedAt)
    const hoursOpen = (Date.now() - openedAt.getTime()) / (1000 * 60 * 60)
    if (hoursOpen > 24) {
      return { type: 'long_shift', hours: Math.floor(hoursOpen) }
    }
    return null
  })

  // API base paths
  const BASE = '/pms/frontdesk/hotels'
  const BILLING_BASE = '/pms/billing/hotels'

  // Methods
  const fetchCurrencies = async () => {
    if (!hotelId.value) return
    try {
      const response = await apiClient.get(`${BILLING_BASE}/${hotelId.value}/cashier/currencies`)
      if (response.data?.data) {
        availableCurrencies.value = response.data.data.availableCurrencies || [
          'TRY',
          'USD',
          'EUR',
          'GBP'
        ]
        exchangeRates.value = response.data.data.exchangeRates || {}
      }
    } catch (err) {
      console.error('Currency fetch error:', err)
    }
  }

  const fetchActiveShift = async () => {
    if (!hotelId.value) return
    try {
      const response = await apiClient.get(`${BILLING_BASE}/${hotelId.value}/cashier/shifts/active`)
      activeShift.value = response.data?.data || null
    } catch (err) {
      activeShift.value = null
    }
  }

  const fetchStay = async () => {
    if (!stayId.value || !hotelId.value) return

    loading.value = true
    error.value = null

    try {
      const response = await apiClient.get(`${BASE}/${hotelId.value}/stays/${stayId.value}`)
      stay.value = response.data.data || response.data

      // Fetch currencies and shift info when stay is loaded
      await Promise.all([fetchCurrencies(), fetchActiveShift()])

      // Auto-open quick payment if balance due
      if (balance.value > 0) {
        quickPaymentOpen.value = true
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Konaklama bilgileri yüklenemedi'
      toast.error(error.value)
    } finally {
      loading.value = false
    }
  }

  const addPayment = async (
    amount,
    method,
    currency = 'TRY',
    reference = '',
    notes = '',
    exchangeRate = null
  ) => {
    if (!stayId.value || !hotelId.value) return false

    saving.value = true
    try {
      // Get exchange rate if not provided
      const rate = exchangeRate || exchangeRates.value[currency] || 1

      const response = await apiClient.post(
        `${BASE}/${hotelId.value}/stays/${stayId.value}/payments`,
        {
          amount: parseFloat(amount),
          method,
          currency,
          exchangeRate: rate,
          reference,
          notes
        }
      )

      // Update local stay data
      if (response.data.data) {
        stay.value = response.data.data
      } else {
        await fetchStay()
      }

      toast.success(`${formatCurrency(amount, currency)} ödeme kaydedildi`)
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ödeme kaydedilemedi')
      return false
    } finally {
      saving.value = false
    }
  }

  const addCharge = async (category, amount, description = '', quantity = 1) => {
    if (!stayId.value || !hotelId.value) return false

    saving.value = true
    try {
      const response = await apiClient.post(
        `${BASE}/${hotelId.value}/stays/${stayId.value}/extras`,
        {
          category,
          amount: parseFloat(amount),
          description,
          quantity
        }
      )

      if (response.data.data) {
        stay.value = response.data.data
      } else {
        await fetchStay()
      }

      toast.success('Ücret eklendi')
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ücret eklenemedi')
      return false
    } finally {
      saving.value = false
    }
  }

  const updateNotes = async (specialRequests, internalNotes) => {
    if (!stayId.value || !hotelId.value) return false

    saving.value = true
    try {
      await apiClient.patch(`${BASE}/${hotelId.value}/stays/${stayId.value}/notes`, {
        specialRequests,
        internalNotes
      })

      // Always refetch to get properly populated data
      await fetchStay()

      toast.success('Notlar güncellendi')
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Notlar güncellenemedi')
      return false
    } finally {
      saving.value = false
    }
  }

  const changeRoom = async (newRoomId, reason = '') => {
    if (!stayId.value || !hotelId.value) return false

    saving.value = true
    try {
      const response = await apiClient.post(
        `${BASE}/${hotelId.value}/stays/${stayId.value}/change-room`,
        {
          newRoomId,
          reason
        }
      )

      if (response.data.data) {
        stay.value = response.data.data
      } else {
        await fetchStay()
      }

      toast.success('Oda değiştirildi')
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Oda değiştirilemedi')
      return false
    } finally {
      saving.value = false
    }
  }

  const extendStay = async newCheckOut => {
    if (!stayId.value || !hotelId.value) return false

    saving.value = true
    try {
      const response = await apiClient.post(
        `${BASE}/${hotelId.value}/stays/${stayId.value}/extend`,
        {
          newCheckOutDate: newCheckOut
        }
      )

      if (response.data.data) {
        stay.value = response.data.data
      } else {
        await fetchStay()
      }

      toast.success('Konaklama uzatıldı')
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Konaklama uzatılamadı')
      return false
    } finally {
      saving.value = false
    }
  }

  const checkOut = async (settleBalance = false, paymentMethod = null) => {
    if (!stayId.value || !hotelId.value) return false

    saving.value = true
    try {
      const payload = {}
      if (settleBalance && balance.value > 0 && paymentMethod) {
        payload.settleBalance = true
        payload.paymentMethod = paymentMethod
      }

      const response = await apiClient.post(
        `${BASE}/${hotelId.value}/stays/${stayId.value}/check-out`,
        payload
      )

      if (response.data.data) {
        stay.value = response.data.data
      }

      toast.success('Check-out tamamlandı')
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out yapılamadı')
      return false
    } finally {
      saving.value = false
    }
  }

  // Guest management
  const addGuest = async guestData => {
    if (!stayId.value || !hotelId.value) return false

    saving.value = true
    try {
      const response = await apiClient.post(
        `${BASE}/${hotelId.value}/stays/${stayId.value}/guests`,
        guestData
      )

      if (response.data.data) {
        stay.value = response.data.data
      } else {
        await fetchStay()
      }

      toast.success('Misafir eklendi')
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Misafir eklenemedi')
      return false
    } finally {
      saving.value = false
    }
  }

  const updateGuest = async (guestIndex, guestData) => {
    if (!stayId.value || !hotelId.value) return false

    saving.value = true
    try {
      const response = await apiClient.patch(
        `${BASE}/${hotelId.value}/stays/${stayId.value}/guests/${guestIndex}`,
        guestData
      )

      if (response.data.data) {
        stay.value = response.data.data
      } else {
        await fetchStay()
      }

      toast.success('Misafir güncellendi')
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Misafir güncellenemedi')
      return false
    } finally {
      saving.value = false
    }
  }

  const removeGuest = async guestIndex => {
    if (!stayId.value || !hotelId.value) return false

    saving.value = true
    try {
      const response = await apiClient.delete(
        `${BASE}/${hotelId.value}/stays/${stayId.value}/guests/${guestIndex}`
      )

      if (response.data.data) {
        stay.value = response.data.data
      } else {
        await fetchStay()
      }

      toast.success('Misafir silindi')
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Misafir silinemedi')
      return false
    } finally {
      saving.value = false
    }
  }

  const setMainGuest = async guestIndex => {
    if (!stayId.value || !hotelId.value) return false

    saving.value = true
    try {
      const response = await apiClient.patch(
        `${BASE}/${hotelId.value}/stays/${stayId.value}/guests/${guestIndex}`,
        { isMainGuest: true }
      )

      if (response.data.data) {
        stay.value = response.data.data
      } else {
        await fetchStay()
      }

      toast.success('Ana misafir değiştirildi')
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ana misafir değiştirilemedi')
      return false
    } finally {
      saving.value = false
    }
  }

  // Helper functions
  const formatCurrency = (amount, currency = null) => {
    // Use provided currency, or stay's currency, or default to TRY
    const curr = currency || stay.value?.currency || 'TRY'
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: curr
    }).format(amount || 0)
  }

  const formatDate = (dateStr, format = 'short') => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (format === 'short') {
      return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
    }
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const formatTime = dateStr => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  // Watch for stayId changes
  watch(
    () => stayId.value,
    newId => {
      if (newId) {
        fetchStay()
      } else {
        stay.value = null
      }
    },
    { immediate: true }
  )

  return {
    // State
    stay,
    loading,
    saving,
    error,
    activeTab,
    quickPaymentOpen,

    // Currency data
    availableCurrencies,
    exchangeRates,

    // Shift data
    activeShift,
    shiftWarning,

    // Computed
    balance,
    isBalanceDue,
    totalAmount,
    paidAmount,
    mainGuest,
    guestCount,
    nights,
    paymentStatusInfo,
    stayStatusInfo,

    // Methods
    fetchStay,
    fetchCurrencies,
    addPayment,
    addCharge,
    updateNotes,
    changeRoom,
    extendStay,
    checkOut,
    addGuest,
    updateGuest,
    removeGuest,
    setMainGuest,

    // Helpers
    formatCurrency,
    formatDate,
    formatTime
  }
}

// Charge categories
export const CHARGE_CATEGORIES = [
  { value: 'minibar', label: 'Minibar', icon: 'local_bar' },
  { value: 'room_service', label: 'Oda Servisi', icon: 'room_service' },
  { value: 'restaurant', label: 'Restoran', icon: 'restaurant' },
  { value: 'bar', label: 'Bar', icon: 'local_bar' },
  { value: 'spa', label: 'Spa', icon: 'spa' },
  { value: 'laundry', label: 'Çamaşırhane', icon: 'local_laundry_service' },
  { value: 'parking', label: 'Otopark', icon: 'local_parking' },
  { value: 'phone', label: 'Telefon', icon: 'phone' },
  { value: 'damage', label: 'Hasar', icon: 'warning' },
  { value: 'other', label: 'Diğer', icon: 'more_horiz' }
]

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Nakit', icon: 'payments' },
  { value: 'credit_card', label: 'Kredi Kartı', icon: 'credit_card' },
  { value: 'debit_card', label: 'Banka Kartı', icon: 'credit_card' },
  { value: 'bank_transfer', label: 'Havale/EFT', icon: 'account_balance' },
  { value: 'online', label: 'Online', icon: 'language' },
  { value: 'other', label: 'Diğer', icon: 'more_horiz' }
]
