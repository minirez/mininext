/**
 * Booking Store - Cart Actions
 * Cart management: add, remove, clear, guest initialization
 */

/**
 * Create cart actions with store state refs
 */
export function createCartActions(state) {
  const { cart, guests, search, searchResults } = state

  /**
   * Add room to cart
   */
  function addToCart(roomType, mealPlan, option) {
    const hotel = searchResults.value.selectedHotel
    const market = searchResults.value.selectedMarket

    // Determine final pricing based on rate type
    const rateType = option.rateType || 'refundable'
    const isNonRefundable = rateType === 'non_refundable'

    // Use custom final price if provided (from PriceDetailModal), otherwise calculate based on rate type
    let finalPricing = option.pricing
    if (isNonRefundable && option.nonRefundable?.enabled) {
      // If non-refundable is selected and we have non-refundable pricing
      finalPricing = {
        ...option.pricing,
        finalTotal:
          option.finalPriceWithDiscount ||
          option.nonRefundable.pricing?.finalTotal ||
          option.pricing.finalTotal
      }
    } else if (option.finalPriceWithDiscount) {
      // If custom discount was applied
      finalPricing = {
        ...option.pricing,
        finalTotal: option.finalPriceWithDiscount
      }
    }

    const cartItem = {
      hotelId: hotel._id,
      hotelName: hotel.name,
      // Market info for booking creation
      market: market
        ? {
            _id: market._id,
            code: market.code,
            currency: market.currency
          }
        : null,
      roomType: {
        _id: roomType._id,
        code: roomType.code,
        name: roomType.name,
        images: roomType.images,
        occupancy: roomType.occupancy
      },
      mealPlan: {
        _id: mealPlan._id,
        code: mealPlan.code,
        name: mealPlan.name
      },
      adults: search.value.adults,
      children: [...search.value.children],
      pricing: finalPricing,
      campaigns: option.campaigns || [],
      dailyBreakdown: option.dailyBreakdown || [],
      // Rate type information
      rateType: rateType,
      isNonRefundable: isNonRefundable,
      nonRefundableDiscount: option.nonRefundableDiscount || 0,
      // Custom discount from PriceDetailModal
      customDiscount: option.customDiscount || null
    }

    cart.value.push(cartItem)

    // Initialize guest array for this room
    initializeRoomGuests(cart.value.length - 1)
  }

  /**
   * Remove room from cart
   */
  function removeFromCart(index) {
    if (index >= 0 && index < cart.value.length) {
      cart.value.splice(index, 1)
      guests.value.roomGuests.splice(index, 1)
    }
  }

  /**
   * Clear cart
   */
  function clearCart() {
    cart.value = []
    guests.value.roomGuests = []
  }

  /**
   * Initialize guests for a room
   * Default titles: 1st adult = mr (Bay), 2nd adult = mrs (Bayan)
   */
  function initializeRoomGuests(roomIndex) {
    const room = cart.value[roomIndex]
    if (!room) return

    const roomGuests = []

    // Add adults
    for (let i = 0; i < room.adults; i++) {
      roomGuests.push({
        type: 'adult',
        title: i === 0 ? 'mr' : i === 1 ? 'mrs' : '',
        firstName: '',
        lastName: '',
        nationality: 'TR',
        birthDate: '',
        tcNumber: '',
        passportNumber: '',
        age: null,
        isLead: roomIndex === 0 && i === 0
      })
    }

    // Add children
    room.children.forEach(age => {
      roomGuests.push({
        type: age < 2 ? 'infant' : 'child',
        title: '',
        firstName: '',
        lastName: '',
        nationality: 'TR',
        birthDate: '',
        tcNumber: '',
        passportNumber: '',
        age: age,
        isLead: false
      })
    })

    guests.value.roomGuests[roomIndex] = roomGuests
  }

  /**
   * Update lead guest
   */
  function updateLeadGuest(data) {
    Object.assign(guests.value.leadGuest, data)
  }

  /**
   * Update room guests
   */
  function updateRoomGuests(roomGuestsData) {
    // Handle both formats:
    // 1. Flat array: [[guest1, guest2], [guest3]]
    // 2. Structured: [{ adults: [...], children: [...] }]
    guests.value.roomGuests = roomGuestsData.map(room => {
      if (Array.isArray(room)) {
        // Already flat array
        return room
      }
      // Flatten { adults: [...], children: [...] } structure
      const flatGuests = []
      if (room.adults) {
        room.adults.forEach((g, i) => {
          flatGuests.push({
            ...g,
            type: 'adult',
            isLead: i === 0 && flatGuests.length === 0
          })
        })
      }
      if (room.children) {
        room.children.forEach(g => {
          flatGuests.push({
            ...g,
            type: g.type || 'child'
          })
        })
      }
      return flatGuests
    })
  }

  return {
    addToCart,
    removeFromCart,
    clearCart,
    initializeRoomGuests,
    updateLeadGuest,
    updateRoomGuests
  }
}
