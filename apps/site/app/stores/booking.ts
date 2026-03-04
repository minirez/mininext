interface CartItem {
  id: string
  roomTypeCode: string
  roomTypeName: string
  mealPlanCode: string
  mealPlanName: string
  price: any
  availability?: number
  images: any[]
  guests: { adults: number; children: number[] }
}

interface RoomGuest {
  type: 'adult' | 'child'
  title: string
  firstName: string
  lastName: string
  nationality: string
  birthDate: string
  age?: number
  isLead: boolean
}

export const useBookingStore = defineStore('booking', () => {
  // Current step (1-4)
  const step = ref(1)

  // Hotel info
  const hotel = ref<any>(null)

  // Cart (multi-room)
  const cart = ref<CartItem[]>([])

  // Backward compat: selectedRoom = first cart item
  const selectedRoom = computed(() => cart.value[0] || null)

  // Cart total
  const cartTotal = computed(() => {
    const currency = cart.value[0]?.price?.currency || 'TRY'
    const amount = cart.value.reduce((sum, item) => {
      return sum + (item.price?.finalTotal || item.price?.total || 0)
    }, 0)
    return { amount, currency }
  })

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

  // Room-level guests — key: cart item ID
  const roomGuests = ref<Record<string, RoomGuest[]>>({})

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

  // Payment configuration (from search API)
  const paymentTerms = ref<any>(null)
  const bankTransferDiscount = ref(0)
  const bankTransferReleaseDays = ref(3)
  const cancellationGuarantee = ref(false)
  const cancellationGuaranteeConfig = ref<any>(null)
  const binInfo = ref<any>(null)
  const currencyConversion = ref<any>(null)
  const termsAccepted = ref(false)
  const posId = ref('')

  // Cancellation guarantee amount
  const guaranteeAmount = computed(() => {
    if (!cancellationGuarantee.value || !cancellationGuaranteeConfig.value?.enabled) return 0
    return Math.round(cartTotal.value.amount * (cancellationGuaranteeConfig.value.rate || 0) / 100)
  })

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

  // Initialize room guests for a cart item
  function initRoomGuests(cartItemId: string, adults: number, children: number[]) {
    const guestList: RoomGuest[] = []

    // Adults
    for (let i = 0; i < adults; i++) {
      const isFirst = i === 0 && cart.value[0]?.id === cartItemId
      guestList.push({
        type: 'adult',
        title: '',
        firstName: isFirst ? contact.value.firstName : '',
        lastName: isFirst ? contact.value.lastName : '',
        nationality: '',
        birthDate: '',
        isLead: isFirst,
      })
    }

    // Children
    for (const age of children) {
      guestList.push({
        type: 'child',
        title: '',
        firstName: '',
        lastName: '',
        nationality: '',
        birthDate: '',
        age,
        isLead: false,
      })
    }

    roomGuests.value[cartItemId] = guestList
  }

  // Cart actions
  function addToCart(item: Omit<CartItem, 'id'>) {
    const id = String(Date.now()) + '-' + cart.value.length
    cart.value.push({ ...item, id })
    initRoomGuests(id, item.guests.adults, item.guests.children)
  }

  function removeFromCart(id: string) {
    cart.value = cart.value.filter(item => item.id !== id)
    delete roomGuests.value[id]
  }

  function clearCart() {
    cart.value = []
    roomGuests.value = {}
  }

  function isInCart(roomTypeCode: string, mealPlanCode: string): boolean {
    return cart.value.some(item => item.roomTypeCode === roomTypeCode && item.mealPlanCode === mealPlanCode)
  }

  // Backward compat: clears cart and adds single room, navigates to step 2
  function selectRoom(room: any) {
    cart.value = [{
      ...room,
      id: '1',
      guests: { adults: searchParams.value.adults, children: searchParams.value.children }
    }]
    initRoomGuests('1', searchParams.value.adults, searchParams.value.children)
    step.value = 2
  }

  function reset() {
    step.value = 1
    hotel.value = null
    cart.value = []
    roomGuests.value = {}
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
    paymentTerms.value = null
    bankTransferDiscount.value = 0
    bankTransferReleaseDays.value = 3
    cancellationGuarantee.value = false
    cancellationGuaranteeConfig.value = null
    binInfo.value = null
    currencyConversion.value = null
    termsAccepted.value = false
    posId.value = ''
    bookingResult.value = null
    bookingError.value = ''
    processing.value = false
  }

  return {
    step, hotel, cart, selectedRoom, cartTotal, priceQuote,
    promoCode, promoApplied, promoDiscount,
    contact, guests, roomGuests, specialRequests,
    paymentMethod, card, installment, installmentOptions,
    paymentTerms, bankTransferDiscount, bankTransferReleaseDays,
    cancellationGuarantee, cancellationGuaranteeConfig, guaranteeAmount,
    binInfo, currencyConversion, termsAccepted, posId,
    bookingResult, bookingError, processing,
    searchParams,
    goToStep, selectRoom, addToCart, removeFromCart, clearCart, isInCart,
    initRoomGuests, reset,
  }
})
