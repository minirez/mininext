export const useBookingStore = defineStore('booking', () => {
  // Current step (1-4)
  const step = ref(1)

  // Hotel info
  const hotel = ref<any>(null)

  // Selected room
  const selectedRoom = ref<{
    roomTypeCode: string
    roomTypeName: string
    mealPlanCode: string
    mealPlanName: string
    price: any
    availability: number
    images: any[]
  } | null>(null)

  // Price quote
  const priceQuote = ref<any>(null)

  // Promo code
  const promoCode = ref('')
  const promoApplied = ref(false)
  const promoDiscount = ref(0)

  // Guest info
  const contact = ref({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    birthDate: '',
  })

  const guests = ref<Array<{
    firstName: string
    lastName: string
    type: 'adult' | 'child'
    age?: number
  }>>([])

  const specialRequests = ref('')

  // Payment
  const paymentMethod = ref<'creditCard' | 'payAtHotel' | 'bankTransfer'>('creditCard')
  const card = ref({
    holder: '',
    number: '',
    expiry: '',
    cvv: '',
  })
  const installment = ref(1)
  const installmentOptions = ref<any[]>([])

  // Booking result
  const bookingResult = ref<any>(null)
  const bookingError = ref('')
  const processing = ref(false)

  // Search params (carried from search)
  const searchParams = ref({
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: [] as number[],
  })

  function goToStep(s: number) {
    if (s >= 1 && s <= 4) step.value = s
  }

  function selectRoom(room: any) {
    selectedRoom.value = room
    step.value = 2
  }

  function reset() {
    step.value = 1
    hotel.value = null
    selectedRoom.value = null
    priceQuote.value = null
    promoCode.value = ''
    promoApplied.value = false
    promoDiscount.value = 0
    contact.value = { firstName: '', lastName: '', email: '', phone: '', nationality: '', birthDate: '' }
    guests.value = []
    specialRequests.value = ''
    paymentMethod.value = 'creditCard'
    card.value = { holder: '', number: '', expiry: '', cvv: '' }
    installment.value = 1
    installmentOptions.value = []
    bookingResult.value = null
    bookingError.value = ''
    processing.value = false
  }

  return {
    step, hotel, selectedRoom, priceQuote,
    promoCode, promoApplied, promoDiscount,
    contact, guests, specialRequests,
    paymentMethod, card, installment, installmentOptions,
    bookingResult, bookingError, processing,
    searchParams,
    goToStep, selectRoom, reset,
  }
})
