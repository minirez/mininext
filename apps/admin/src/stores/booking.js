/**
 * Booking Store
 * 2-phase booking flow: Search+Rooms → Guests+Payment
 * Supports draft bookings with localStorage (Phase 1) and DB (Phase 2) persistence
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import bookingService from '@/services/bookingService'
import paximumService from '@/services/paximumService'
import * as storageService from '@/services/bookingStorageService'

export const useBookingStore = defineStore('booking', () => {
	// ==================== STATE ====================

	// Current phase (1: Search+Rooms, 2: Guests+Payment)
	const currentPhase = ref(1)

	// Active provider: 'local' (partner hotels) or 'paximum' (external OTA)
	const activeProvider = ref('local')

	// Search parameters
	const search = ref({
		tourismRegionIds: [],     // Selected tourism regions
		hotelIds: [],             // Directly selected hotels
		dateRange: {
			start: null,
			end: null
		},
		adults: 2,
		children: [],             // Array of child ages
		countryCode: 'TR',
		channel: 'B2B'            // B2B or B2C
	})

	// Search results
	const searchResults = ref({
		hotels: [],               // Hotel list with cheapest prices
		unavailableHotels: [],    // Hotels without availability (from debug)
		selectedHotelId: null,    // Currently selected hotel for room view
		selectedHotelRooms: [],   // Rooms of selected hotel
		selectedHotel: null,      // Full selected hotel object
		selectedMarket: null      // Market used for pricing { _id, code, currency }
	})

	// Cart (selected rooms)
	const cart = ref([])
	// Each cart item: {
	//   hotelId, hotelName, roomType, mealPlan, adults, children,
	//   pricing: { currency, originalTotal, totalDiscount, finalTotal, avgPerNight },
	//   campaigns: [], dailyBreakdown: []
	// }

	// Guest information
	const guests = ref({
		leadGuest: {
			title: '',
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			nationality: 'TR',
			tcNumber: '',
			passportNumber: '',
			birthDate: '',
			type: 'adult',
			isLead: true
		},
		roomGuests: []           // Array of room guests
	})

	// Payment
	const payment = ref({
		method: null,             // 'cash', 'bank_transfer', 'credit_card'
		acceptedMethods: []       // From hotel settings
	})

	// Additional info
	const specialRequests = ref('')
	const termsAccepted = ref(false)

	// Booking result
	const bookingResult = ref(null)

	// Invoice details
	const invoiceDetails = ref({
		type: 'individual', // 'individual' or 'corporate'
		individual: {
			firstName: '',
			lastName: '',
			tcNumber: '',
			address: {
				street: '',
				district: '',
				city: '',
				postalCode: '',
				country: 'TR'
			}
		},
		corporate: {
			companyName: '',
			taxNumber: '',
			taxOffice: '',
			address: {
				street: '',
				district: '',
				city: '',
				postalCode: '',
				country: 'TR'
			}
		}
	})

	// Draft booking state
	const draftBookingNumber = ref(null)
	const draftData = ref(null)
	const lastSavedAt = ref(null)
	const allotmentError = ref(null)

	// ==================== PAXIMUM STATE ====================

	// Paximum integration status
	const paximumEnabled = ref(false)
	const paximumDefaultMarkup = ref(10)

	// Paximum search parameters
	const paximumSearch = ref({
		location: null,           // { id, name, type } from autocomplete
		checkIn: null,            // YYYY-MM-DD
		nights: 7,
		rooms: [{
			adults: 2,
			childAges: []
		}],
		nationality: 'TR',
		currency: 'TRY',
		culture: 'tr-TR'
	})

	// Paximum search results
	const paximumResults = ref({
		hotels: [],
		searchId: null,          // SearchId from priceSearch (needed for getOffers)
		selectedHotel: null,
		selectedHotelOffers: [],
		selectedOffer: null,
		searchPerformed: false,  // Track if search was performed
		noResults: false         // Track if no results found
	})

	// Paximum transaction state
	const paximumTransaction = ref({
		transactionId: null,
		reservationNumber: null
	})

	// UI State
	const loading = ref({
		hotels: false,
		rooms: false,
		booking: false,
		draft: false,
		paximum: false,
		paximumOffers: false
	})
	const error = ref(null)

	// ==================== GETTERS ====================

	// Calculate nights from date range (supports both local and Paximum)
	const nights = computed(() => {
		// For Paximum bookings, use paximumSearch.nights directly
		if (activeProvider.value === 'paximum' && paximumSearch.value.nights) {
			return paximumSearch.value.nights
		}

		// For local bookings, calculate from date range
		if (!search.value.dateRange.start || !search.value.dateRange.end) {
			return 0
		}
		const start = new Date(search.value.dateRange.start)
		const end = new Date(search.value.dateRange.end)
		return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
	})

	// Total rooms in cart
	const totalRooms = computed(() => cart.value.length)

	// Total adults in cart
	const totalAdults = computed(() => {
		return cart.value.reduce((sum, item) => sum + item.adults, 0)
	})

	// Total children in cart
	const totalChildren = computed(() => {
		return cart.value.reduce((sum, item) => sum + (item.children?.length || 0), 0)
	})

	// Total guests
	const totalGuests = computed(() => totalAdults.value + totalChildren.value)

	// Currency from first cart item
	const currency = computed(() => {
		if (cart.value.length > 0) {
			return cart.value[0].pricing?.currency
		}
		return searchResults.value.hotels[0]?.currency || 'TRY'
	})

	// Subtotal (original prices)
	const subtotal = computed(() => {
		return cart.value.reduce((sum, item) => sum + (item.pricing?.originalTotal || 0), 0)
	})

	// Total discount
	const totalDiscount = computed(() => {
		return cart.value.reduce((sum, item) => sum + (item.pricing?.totalDiscount || 0), 0)
	})

	// Grand total
	const grandTotal = computed(() => {
		return cart.value.reduce((sum, item) => sum + (item.pricing?.finalTotal || 0), 0)
	})

	// Average per night
	const avgPerNight = computed(() => {
		if (nights.value === 0) return 0
		return grandTotal.value / nights.value
	})

	// All applied campaigns (unique)
	const appliedCampaigns = computed(() => {
		const campaigns = []
		const seen = new Set()

		cart.value.forEach(item => {
			if (item.campaigns) {
				item.campaigns.forEach(c => {
					if (!seen.has(c.code)) {
						seen.add(c.code)
						campaigns.push(c)
					}
				})
			}
		})

		return campaigns
	})

	// Selected hotel object
	const selectedHotel = computed(() => {
		if (!searchResults.value.selectedHotelId) return null
		return searchResults.value.hotels.find(h => h._id === searchResults.value.selectedHotelId)
	})

	// Can proceed to checkout (cart has items)
	const canProceedToCheckout = computed(() => {
		return cart.value.length > 0
	})

	// Can create booking (guests + payment filled)
	const canCreateBooking = computed(() => {
		const lead = guests.value.leadGuest
		return (
			lead.firstName?.trim() &&
			lead.lastName?.trim() &&
			lead.email?.trim() &&
			lead.phone?.trim() &&
			payment.value.method &&
			termsAccepted.value
		)
	})

	// Search is valid
	const isSearchValid = computed(() => {
		return (
			search.value.dateRange.start &&
			search.value.dateRange.end &&
			search.value.adults >= 1 &&
			nights.value >= 1 &&
			nights.value <= 30
		)
	})

	// ==================== ACTIONS ====================

	// Search hotels with prices
	async function searchHotels() {
		if (!isSearchValid.value) {
			error.value = 'Lütfen tarih aralığı seçin'
			return false
		}

		loading.value.hotels = true
		error.value = null

		try {
			const response = await bookingService.searchHotelsWithPrices({
				tourismRegionIds: search.value.tourismRegionIds,
				hotelIds: search.value.hotelIds,
				checkIn: search.value.dateRange.start,
				checkOut: search.value.dateRange.end,
				adults: search.value.adults,
				children: search.value.children,
				countryCode: search.value.countryCode,
				channel: search.value.channel
			})

			if (response.success) {
				searchResults.value.hotels = response.data.hotels

				// Store unavailable hotels from debug info
				if (response.data.debug && response.data.debug.length > 0) {
					console.log('🔍 Hotel Search Debug Info:', response.data.debug)
					searchResults.value.unavailableHotels = response.data.debug
				} else {
					searchResults.value.unavailableHotels = []
				}

				// Auto-select first hotel if only one
				if (response.data.hotels.length === 1) {
					await selectHotel(response.data.hotels[0]._id)
				}
				return true
			} else {
				error.value = response.message
				return false
			}
		} catch (err) {
			error.value = err.response?.data?.message || err.message
			return false
		} finally {
			loading.value.hotels = false
		}
	}

	// Select hotel and load its rooms
	async function selectHotel(hotelId) {
		if (!hotelId) {
			searchResults.value.selectedHotelId = null
			searchResults.value.selectedHotelRooms = []
			searchResults.value.selectedHotel = null
			searchResults.value.selectedMarket = null
			return
		}

		loading.value.rooms = true
		searchResults.value.selectedHotelId = hotelId
		searchResults.value.selectedHotel = searchResults.value.hotels.find(h => h._id === hotelId)

		try {
			const response = await bookingService.searchAvailability({
				hotelId,
				checkIn: search.value.dateRange.start,
				checkOut: search.value.dateRange.end,
				adults: search.value.adults,
				children: search.value.children,
				countryCode: search.value.countryCode
			})

			if (response.success) {
				searchResults.value.selectedHotelRooms = response.data.results
				// Store market info from search response
				if (response.data.search?.market) {
					searchResults.value.selectedMarket = response.data.search.market
				}
				// Set payment methods from hotel
				if (searchResults.value.selectedHotel?.paymentMethods) {
					payment.value.acceptedMethods = searchResults.value.selectedHotel.paymentMethods
				}
			}
		} catch (err) {
			console.error('Error loading hotel rooms:', err)
			searchResults.value.selectedHotelRooms = []
		} finally {
			loading.value.rooms = false
		}
	}

	// Add room to cart
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
				finalTotal: option.finalPriceWithDiscount || option.nonRefundable.pricing?.finalTotal || option.pricing.finalTotal
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
			market: market ? {
				_id: market._id,
				code: market.code,
				currency: market.currency
			} : null,
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

	// Remove room from cart
	function removeFromCart(index) {
		if (index >= 0 && index < cart.value.length) {
			cart.value.splice(index, 1)
			guests.value.roomGuests.splice(index, 1)
		}
	}

	// Clear cart
	function clearCart() {
		cart.value = []
		guests.value.roomGuests = []
	}

	// Initialize guests for a room
	function initializeRoomGuests(roomIndex) {
		const room = cart.value[roomIndex]
		if (!room) return

		const roomGuests = []

		// Add adults
		for (let i = 0; i < room.adults; i++) {
			roomGuests.push({
				type: 'adult',
				title: '',
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
		room.children.forEach((age) => {
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

	// Go to checkout phase
	function goToCheckout() {
		if (canProceedToCheckout.value) {
			currentPhase.value = 2
		}
	}

	// Go back to search phase
	function goBackToSearch() {
		currentPhase.value = 1
	}

	// Set date range
	function setDateRange(start, end) {
		search.value.dateRange.start = start
		search.value.dateRange.end = end
	}

	// Set guests count
	function setGuestsCount(adults, children = []) {
		search.value.adults = adults
		search.value.children = children
	}

	// Update lead guest
	function updateLeadGuest(data) {
		Object.assign(guests.value.leadGuest, data)
	}

	// Update room guests
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

	// Set payment method
	function setPaymentMethod(method) {
		payment.value.method = method
	}

	// Create booking
	async function createBooking() {
		if (!canCreateBooking.value) {
			error.value = 'Lütfen tüm bilgileri doldurun'
			return null
		}

		loading.value.booking = true
		error.value = null

		try {
			// Get hotel from first cart item
			const firstItem = cart.value[0]

			// Build rooms data
			const roomsData = cart.value.map((item, index) => ({
				roomTypeId: item.roomType._id,
				mealPlanId: item.mealPlan._id,
				adults: item.adults,
				children: item.children,
				guests: guests.value.roomGuests[index] || [],
				specialRequests: '',
				// Rate type information
				rateType: item.rateType || 'refundable',
				isNonRefundable: item.isNonRefundable || false,
				nonRefundableDiscount: item.nonRefundableDiscount || 0,
				// Custom discount if applied
				customDiscount: item.customDiscount || null,
				// Pricing data
				pricing: item.pricing
			}))

			const bookingData = {
				hotelId: firstItem.hotelId,
				checkIn: search.value.dateRange.start,
				checkOut: search.value.dateRange.end,
				rooms: roomsData,
				contact: {
					email: guests.value.leadGuest.email,
					phone: guests.value.leadGuest.phone,
					countryCode: search.value.countryCode,
					firstName: guests.value.leadGuest.firstName,
					lastName: guests.value.leadGuest.lastName
				},
				billing: {
					paymentMethod: payment.value.method
				},
				specialRequests: specialRequests.value
			}

			const response = await bookingService.createBooking(bookingData)

			if (response.success) {
				bookingResult.value = response.data
				return response.data
			} else {
				error.value = response.message
				return null
			}
		} catch (err) {
			error.value = err.response?.data?.message || err.message
			return null
		} finally {
			loading.value.booking = false
		}
	}

	// Reset all
	function resetAll() {
		currentPhase.value = 1

		search.value = {
			tourismRegionIds: [],
			hotelIds: [],
			dateRange: { start: null, end: null },
			adults: 2,
			children: [],
			countryCode: 'TR',
			channel: 'B2B'
		}

		searchResults.value = {
			hotels: [],
			selectedHotelId: null,
			selectedHotelRooms: [],
			selectedHotel: null,
			selectedMarket: null
		}

		cart.value = []

		guests.value = {
			leadGuest: {
				title: '',
				firstName: '',
				lastName: '',
				email: '',
				phone: '',
				nationality: 'TR',
				tcNumber: '',
				passportNumber: '',
				birthDate: '',
				type: 'adult',
				isLead: true
			},
			roomGuests: []
		}

		payment.value = {
			method: null,
			acceptedMethods: []
		}

		specialRequests.value = ''
		termsAccepted.value = false
		bookingResult.value = null
		loading.value = { hotels: false, rooms: false, booking: false, draft: false }
		error.value = null

		// Clear draft state
		draftBookingNumber.value = null
		draftData.value = null
		lastSavedAt.value = null
		allotmentError.value = null

		// Clear invoice details
		invoiceDetails.value = {
			type: 'individual',
			individual: {
				firstName: '',
				lastName: '',
				tcNumber: '',
				address: { street: '', district: '', city: '', postalCode: '', country: 'TR' }
			},
			corporate: {
				companyName: '',
				taxNumber: '',
				taxOffice: '',
				address: { street: '', district: '', city: '', postalCode: '', country: 'TR' }
			}
		}

		// Clear localStorage
		storageService.clearPhase1Data()
	}

	// ==================== LOCALSTORAGE PERSISTENCE ====================

	// Save Phase 1 state to localStorage
	function saveToLocalStorage() {
		if (currentPhase.value !== 1 || draftBookingNumber.value) {
			return // Don't save if in Phase 2 or already have a draft
		}

		storageService.savePhase1Data({
			search: search.value,
			searchResults: {
				hotels: searchResults.value.hotels,
				selectedHotelId: searchResults.value.selectedHotelId,
				selectedHotelRooms: searchResults.value.selectedHotelRooms,
				selectedHotel: searchResults.value.selectedHotel
			},
			cart: cart.value
		})
	}

	// Load Phase 1 state from localStorage
	function loadFromLocalStorage() {
		const data = storageService.loadPhase1Data()
		if (!data) return false

		if (data.search) {
			search.value = data.search
		}
		if (data.searchResults) {
			searchResults.value = data.searchResults
		}
		if (data.cart) {
			cart.value = data.cart
			// Reinitialize room guests for loaded cart
			cart.value.forEach((_, index) => {
				initializeRoomGuests(index)
			})
		}

		console.log('📦 Loaded booking state from localStorage')
		return true
	}

	// Check if has saved Phase 1 data
	function hasLocalStorageData() {
		return storageService.hasPhase1Data()
	}

	// ==================== DRAFT MANAGEMENT ====================

	// Create draft when transitioning to Phase 2
	async function createDraft() {
		if (!canProceedToCheckout.value) {
			error.value = 'Sepetinizde en az bir oda olmalı'
			return null
		}

		loading.value.draft = true
		error.value = null

		try {
			const firstItem = cart.value[0]

			const response = await bookingService.createDraft({
				searchCriteria: search.value,
				hotel: firstItem.hotelId,
				// Market info from cart
				market: firstItem.market?._id,
				marketCode: firstItem.market?.code,
				checkIn: search.value.dateRange.start,
				checkOut: search.value.dateRange.end,
				rooms: cart.value.map((item, index) => ({
					roomType: item.roomType._id,
					roomTypeCode: item.roomType.code,
					roomTypeName: item.roomType.name,
					mealPlan: item.mealPlan._id,
					mealPlanCode: item.mealPlan.code,
					mealPlanName: item.mealPlan.name,
					adults: item.adults,
					children: item.children,
					guests: guests.value.roomGuests[index] || [],
					pricing: item.pricing,
					customDiscount: item.customDiscount,
					dailyBreakdown: item.dailyBreakdown,
					campaigns: item.campaigns,
					// Rate type information
					rateType: item.rateType || 'refundable',
					nonRefundableDiscount: item.nonRefundableDiscount || 0
				}))
			})

			if (response.success) {
				draftBookingNumber.value = response.data.bookingNumber
				draftData.value = response.data
				lastSavedAt.value = new Date()

				// Clear localStorage since we now have a DB draft
				storageService.clearPhase1Data()

				console.log('✅ Draft created:', draftBookingNumber.value)
				return response.data
			} else {
				error.value = response.message
				return null
			}
		} catch (err) {
			error.value = err.response?.data?.message || err.message
			return null
		} finally {
			loading.value.draft = false
		}
	}

	// Update draft (auto-save)
	async function updateDraft() {
		if (!draftBookingNumber.value) return

		try {
			await bookingService.updateDraft(draftBookingNumber.value, {
				leadGuest: guests.value.leadGuest,
				contact: {
					email: guests.value.leadGuest.email,
					phone: guests.value.leadGuest.phone,
					countryCode: search.value.countryCode
				},
				invoiceDetails: invoiceDetails.value,
				payment: { method: payment.value.method },
				specialRequests: specialRequests.value,
				rooms: cart.value.map((item, index) => ({
					adults: item.adults,
					children: item.children,
					guests: guests.value.roomGuests[index] || []
				}))
			})

			lastSavedAt.value = new Date()
			console.log('💾 Draft auto-saved')
		} catch (err) {
			console.error('Draft save error:', err)
		}
	}

	// Load draft from API
	async function loadDraft(bookingNumber) {
		loading.value.draft = true
		error.value = null

		try {
			const response = await bookingService.getDraft(bookingNumber)

			if (response.success) {
				const draft = response.data

				// Set draft info
				draftBookingNumber.value = draft.bookingNumber
				draftData.value = draft
				currentPhase.value = draft.currentPhase || 2

				// Restore search criteria
				if (draft.searchCriteria) {
					search.value = {
						...search.value,
						...draft.searchCriteria,
						dateRange: {
							start: draft.checkIn,
							end: draft.checkOut
						}
					}
				}

				// Restore cart
				if (draft.rooms) {
					cart.value = draft.rooms.map(room => ({
						hotelId: draft.hotel?._id,
						hotelName: draft.hotel?.name,
						roomType: room.roomType,
						mealPlan: room.mealPlan,
						adults: room.adults || draft.searchCriteria?.adults || draft.totalAdults || 2,
						children: room.children || draft.searchCriteria?.children || [],
						pricing: room.pricing,
						campaigns: room.campaigns || [],
						dailyBreakdown: room.dailyBreakdown || []
					}))
				}

				// Restore guests
				if (draft.leadGuest) {
					guests.value.leadGuest = { ...guests.value.leadGuest, ...draft.leadGuest }
				}
				if (draft.rooms) {
					guests.value.roomGuests = draft.rooms.map((room, index) => {
						// If room has guests data, use it
						if (room.guests && room.guests.length > 0) {
							return room.guests
						}
						// Otherwise, initialize guests based on cart
						const cartRoom = cart.value[index]
						if (!cartRoom) return []

						const roomGuests = []
						// Add adults
						for (let i = 0; i < (cartRoom.adults || 2); i++) {
							roomGuests.push({
								type: 'adult',
								title: '',
								firstName: '',
								lastName: '',
								nationality: 'TR',
								birthDate: '',
								tcNumber: '',
								passportNumber: '',
								age: null,
								isLead: index === 0 && i === 0
							})
						}
						// Add children
						(cartRoom.children || []).forEach((age) => {
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
						return roomGuests
					})
				}

				// Restore invoice details
				if (draft.invoiceDetails) {
					invoiceDetails.value = draft.invoiceDetails
				}

				// Restore payment method
				if (draft.payment?.method) {
					payment.value.method = draft.payment.method
				}

				// Restore contact to leadGuest
				if (draft.contact) {
					guests.value.leadGuest.email = draft.contact.email || ''
					guests.value.leadGuest.phone = draft.contact.phone || ''
				}

				// Restore special requests
				if (draft.specialRequests) {
					specialRequests.value = draft.specialRequests
				}

				// Set selected hotel info
				if (draft.hotel) {
					searchResults.value.selectedHotelId = draft.hotel._id
					searchResults.value.selectedHotel = draft.hotel
				}

				console.log('📖 Draft loaded:', bookingNumber)
				return draft
			} else {
				error.value = response.message
				return null
			}
		} catch (err) {
			error.value = err.response?.data?.message || 'Draft yüklenemedi'
			return null
		} finally {
			loading.value.draft = false
		}
	}

	// Delete draft
	async function deleteDraft() {
		if (!draftBookingNumber.value) return

		try {
			await bookingService.deleteDraft(draftBookingNumber.value)
			draftBookingNumber.value = null
			draftData.value = null
			console.log('🗑️ Draft deleted')
		} catch (err) {
			console.error('Draft delete error:', err)
		}
	}

	// Complete draft (final booking)
	async function completeDraft() {
		if (!draftBookingNumber.value) {
			error.value = 'Draft bulunamadı'
			return null
		}

		loading.value.booking = true
		error.value = null
		allotmentError.value = null

		try {
			// First save current state
			await updateDraft()

			// Then complete
			const response = await bookingService.completeDraft(draftBookingNumber.value)

			if (response.success) {
				bookingResult.value = response.data
				console.log('✅ Booking completed:', response.data.bookingNumber)
				return response.data
			} else {
				error.value = response.message
				return null
			}
		} catch (err) {
			const errorData = err.response?.data

			// Handle allotment error specially
			if (errorData?.error?.code === 'ALLOTMENT_NOT_AVAILABLE') {
				allotmentError.value = errorData.error
				error.value = 'Seçilen tarihlerde yeterli kontenjan kalmadı'
			} else if (errorData?.error?.code === 'VALIDATION_FAILED') {
				error.value = 'Lütfen tüm gerekli alanları doldurun'
			} else {
				error.value = errorData?.message || err.message
			}
			return null
		} finally {
			loading.value.booking = false
		}
	}

	// Update invoice details
	function updateInvoiceDetails(data) {
		invoiceDetails.value = { ...invoiceDetails.value, ...data }
	}

	// ==================== PAXIMUM ACTIONS ====================

	// Set active provider
	function setProvider(provider) {
		activeProvider.value = provider
	}

	// Check Paximum status
	async function checkPaximumStatus() {
		try {
			const status = await paximumService.getStatus()
			paximumEnabled.value = status.enabled
			paximumDefaultMarkup.value = status.defaultMarkup || 10
			return status
		} catch (err) {
			console.error('Paximum status check failed:', err)
			paximumEnabled.value = false
			return null
		}
	}

	// Paximum location autocomplete
	async function paximumAutocomplete(query) {
		if (!query || query.length < 2) return []

		try {
			return await paximumService.autocomplete(query)
		} catch (err) {
			console.error('Paximum autocomplete error:', err)
			return []
		}
	}

	// Search Paximum hotels
	async function searchPaximumHotels() {
		if (!paximumSearch.value.location) {
			error.value = 'Lütfen lokasyon seçin'
			return false
		}

		if (!paximumSearch.value.checkIn) {
			error.value = 'Lütfen giriş tarihi seçin'
			return false
		}

		loading.value.paximum = true
		error.value = null
		paximumResults.value.searchPerformed = false
		paximumResults.value.noResults = false

		try {
			// Build room criteria
			const roomCriteria = paximumSearch.value.rooms.map(room => ({
				adult: room.adults,
				childAges: room.childAges || []
			}))

			const results = await paximumService.searchHotels({
				arrivalLocations: [{
					id: paximumSearch.value.location.id,
					type: paximumSearch.value.location.type || 2
				}],
				checkIn: paximumSearch.value.checkIn,
				nights: paximumSearch.value.nights,
				roomCriteria,
				nationality: paximumSearch.value.nationality,
				currency: paximumSearch.value.currency,
				culture: paximumSearch.value.culture,
				markupPercent: paximumDefaultMarkup.value
			})

			console.log('[Paximum] Search results:', results)
			console.log('[Paximum] Hotels count:', results?.hotels?.length || 0)
			console.log('[Paximum] SearchId:', results?.searchId)

			paximumResults.value.hotels = results?.hotels || []
			paximumResults.value.searchId = results?.searchId || null
			paximumResults.value.searchPerformed = true
			paximumResults.value.noResults = paximumResults.value.hotels.length === 0

			console.log('[Paximum] Store hotels updated:', paximumResults.value.hotels.length)
			return true
		} catch (err) {
			console.error('[Paximum] Search error:', err)
			error.value = err.response?.data?.error || err.message
			return false
		} finally {
			loading.value.paximum = false
		}
	}

	// Select Paximum hotel - offers are already in the hotel object from priceSearch
	function selectPaximumHotel(hotel) {
		console.log('[Paximum] selectPaximumHotel called', hotel.name)
		console.log('[Paximum] Hotel offers count:', hotel.offers?.length || 0)

		paximumResults.value.selectedHotel = hotel
		// Use offers from the hotel object (priceSearch returns ALL offers with GetOnlyBestOffers: false)
		paximumResults.value.selectedHotelOffers = hotel.offers || []
		paximumResults.value.selectedOffer = null
		error.value = null

		return true
	}

	// Select Paximum offer (room)
	function selectPaximumOffer(offer) {
		paximumResults.value.selectedOffer = offer
	}

	// Add Paximum offer to cart
	function addPaximumToCart(offer) {
		const hotel = paximumResults.value.selectedHotel

		// Calculate checkout date from checkIn + nights
		const checkInDate = new Date(paximumSearch.value.checkIn)
		const checkOutDate = new Date(checkInDate)
		checkOutDate.setDate(checkOutDate.getDate() + paximumSearch.value.nights)
		const checkOut = checkOutDate.toISOString().split('T')[0]

		// Sync dates to search.dateRange for UI consistency
		search.value.dateRange.start = paximumSearch.value.checkIn
		search.value.dateRange.end = checkOut

		const cartItem = {
			source: 'paximum',
			hotelId: hotel.id,
			hotelName: hotel.name,
			roomType: {
				name: offer.rooms?.[0]?.roomName || offer.roomName || 'Oda',
				code: offer.rooms?.[0]?.roomCode || ''
			},
			mealPlan: {
				name: offer.rooms?.[0]?.boardName || offer.boardName || '',
				code: offer.rooms?.[0]?.boardCode || ''
			},
			adults: paximumSearch.value.rooms.reduce((sum, r) => sum + r.adults, 0),
			children: paximumSearch.value.rooms.flatMap(r => r.childAges || []),
			pricing: {
				currency: offer.price?.currency || paximumSearch.value.currency,
				finalTotal: offer.price?.amount || 0,
				originalTotal: offer.price?.amount || 0,
				totalDiscount: 0
			},
			paximumData: {
				offerId: offer.offerId,
				hotelId: hotel.id,
				checkIn: paximumSearch.value.checkIn,
				checkOut: checkOut,
				nights: paximumSearch.value.nights,
				rooms: paximumSearch.value.rooms
			}
		}

		cart.value.push(cartItem)

		// Initialize guest array for this room
		initializeRoomGuests(cart.value.length - 1)
	}

	// Reset Paximum state
	function resetPaximum() {
		paximumSearch.value = {
			location: null,
			checkIn: null,
			nights: 7,
			rooms: [{ adults: 2, childAges: [] }],
			nationality: 'TR',
			currency: 'TRY',
			culture: 'tr-TR'
		}
		paximumResults.value = {
			hotels: [],
			selectedHotel: null,
			selectedHotelOffers: [],
			selectedOffer: null
		}
		paximumTransaction.value = {
			transactionId: null,
			reservationNumber: null
		}
	}

	// Check if cart has Paximum items
	function hasPaximumItems() {
		return cart.value.some(item => item.source === 'paximum')
	}

	// Create Paximum booking
	async function createPaximumBooking() {
		const paximumItems = cart.value.filter(item => item.source === 'paximum')
		if (paximumItems.length === 0) {
			error.value = 'Sepette Paximum ürünü bulunamadı'
			return null
		}

		loading.value.booking = true
		error.value = null

		try {
			// Step 1: Begin transaction with offer IDs
			const offerIds = paximumItems.map(item => item.paximumData?.offerId).filter(Boolean)
			if (offerIds.length === 0) {
				throw new Error('Geçerli offer ID bulunamadı')
			}

			console.log('[Paximum] Beginning transaction with offers:', offerIds)
			const transactionResult = await paximumService.beginTransaction(
				offerIds,
				paximumSearch.value.currency,
				paximumSearch.value.culture
			)

			const transactionId = transactionResult?.transactionId
			if (!transactionId) {
				throw new Error('Transaction başlatılamadı')
			}

			paximumTransaction.value.transactionId = transactionId
			console.log('[Paximum] Transaction started:', transactionId)

			// Step 2: Build travellers array from guests
			const travellers = []
			const lead = guests.value.leadGuest

			// Add lead guest as first traveller
			travellers.push({
				travellerId: '1',
				type: 1, // Adult
				title: lead.title === 'mr' ? 1 : 2, // 1=Mr, 2=Mrs
				name: lead.firstName,
				surname: lead.lastName,
				isLeader: true,
				birthDate: lead.birthDate || null,
				nationality: lead.nationality || 'TR',
				identityNumber: lead.tcNumber || null,
				passportNumber: lead.passportNumber || null
			})

			// Add room guests
			let travellerIndex = 2
			guests.value.roomGuests.forEach((room, roomIndex) => {
				room.forEach((guest, guestIndex) => {
					// Skip first guest of first room (already added as lead)
					if (roomIndex === 0 && guestIndex === 0) return

					travellers.push({
						travellerId: String(travellerIndex++),
						type: guest.type === 'adult' ? 1 : (guest.type === 'child' ? 2 : 3), // 1=Adult, 2=Child, 3=Infant
						title: guest.title === 'mr' ? 1 : 2,
						name: guest.firstName,
						surname: guest.lastName,
						isLeader: false,
						birthDate: guest.birthDate || null,
						nationality: guest.nationality || 'TR',
						identityNumber: guest.tcNumber || null,
						passportNumber: guest.passportNumber || null
					})
				})
			})

			// Customer info
			const customerInfo = {
				email: lead.email,
				mobilePhone: lead.phone?.replace(/\D/g, '') || '',
				address: invoiceDetails.value?.individual?.address?.street || '',
				city: invoiceDetails.value?.individual?.address?.city || '',
				country: lead.nationality || 'TR'
			}

			console.log('[Paximum] Setting reservation info:', { travellers: travellers.length, customerInfo })
			await paximumService.setReservationInfo(
				transactionId,
				travellers,
				customerInfo,
				null // agencyReservationNumber
			)

			// Step 3: Commit transaction
			console.log('[Paximum] Committing transaction...')
			const commitResult = await paximumService.commitTransaction(transactionId)

			const reservationNumber = commitResult?.reservation?.reservationNumber
			paximumTransaction.value.reservationNumber = reservationNumber

			console.log('[Paximum] Booking completed:', reservationNumber)

			// Build booking result
			bookingResult.value = {
				source: 'paximum',
				bookingNumber: reservationNumber,
				paximumReservationNumber: reservationNumber,
				transactionId: transactionId,
				hotel: paximumItems[0]?.hotelName,
				checkIn: paximumSearch.value.checkIn,
				nights: paximumSearch.value.nights,
				totalAmount: paximumItems.reduce((sum, item) => sum + (item.pricing?.finalTotal || 0), 0),
				currency: paximumSearch.value.currency
			}

			return bookingResult.value
		} catch (err) {
			console.error('[Paximum] Booking error:', err)
			error.value = err.response?.data?.error || err.message || 'Paximum rezervasyon hatası'
			return null
		} finally {
			loading.value.booking = false
		}
	}

	// ==================== RETURN ====================

	return {
		// State
		currentPhase,
		activeProvider,
		search,
		searchResults,
		cart,
		guests,
		payment,
		specialRequests,
		termsAccepted,
		bookingResult,
		loading,
		error,
		invoiceDetails,
		draftBookingNumber,
		draftData,
		lastSavedAt,
		allotmentError,

		// Paximum State
		paximumEnabled,
		paximumDefaultMarkup,
		paximumSearch,
		paximumResults,
		paximumTransaction,

		// Getters
		nights,
		totalRooms,
		totalAdults,
		totalChildren,
		totalGuests,
		currency,
		subtotal,
		totalDiscount,
		grandTotal,
		avgPerNight,
		appliedCampaigns,
		selectedHotel,
		canProceedToCheckout,
		canCreateBooking,
		isSearchValid,

		// Actions
		searchHotels,
		selectHotel,
		addToCart,
		removeFromCart,
		clearCart,
		initializeRoomGuests,
		goToCheckout,
		goBackToSearch,
		setDateRange,
		setGuestsCount,
		updateLeadGuest,
		updateRoomGuests,
		setPaymentMethod,
		createBooking,
		resetAll,

		// localStorage persistence
		saveToLocalStorage,
		loadFromLocalStorage,
		hasLocalStorageData,

		// Draft management
		createDraft,
		updateDraft,
		loadDraft,
		deleteDraft,
		completeDraft,
		updateInvoiceDetails,

		// Paximum actions
		setProvider,
		checkPaximumStatus,
		paximumAutocomplete,
		searchPaximumHotels,
		selectPaximumHotel,
		selectPaximumOffer,
		addPaximumToCart,
		resetPaximum,
		hasPaximumItems,
		createPaximumBooking
	}
})
