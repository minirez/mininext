<template>
	<div class="space-y-4">
		<!-- Location Autocomplete -->
		<div>
			<label class="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
				{{ $t('booking.paximum.location') }} <span class="text-red-500">*</span>
			</label>
			<div class="relative">
				<input
					v-model="locationQuery"
					@input="handleLocationSearch"
					@focus="showSuggestions = true"
					type="text"
					:placeholder="$t('booking.paximum.locationPlaceholder')"
					class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
					:class="locationError ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'"
				>
				<span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
					<span v-if="loadingLocations" class="material-icons animate-spin text-sm">refresh</span>
					<span v-else class="material-icons text-sm">location_on</span>
				</span>

				<!-- Suggestions Dropdown -->
				<div
					v-if="showSuggestions && locations.length > 0"
					class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
				>
					<button
						v-for="loc in locations"
						:key="loc.id"
						@click="selectLocation(loc)"
						class="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700 text-sm flex items-center gap-2"
					>
						<span class="material-icons text-gray-400 text-sm">
							{{ getLocationIcon(loc.type) }}
						</span>
						<div class="flex-1 min-w-0">
							<span class="text-gray-900 dark:text-white">{{ loc.name }}</span>
							<span v-if="loc.country" class="text-gray-400 text-xs ml-1">{{ loc.country }}</span>
						</div>
						<span v-if="loc.hotelCount" class="text-xs text-gray-400">{{ loc.hotelCount }} otel</span>
					</button>
				</div>
			</div>
			<!-- Selected Location Badge -->
			<div v-if="bookingStore.paximumSearch.location" class="mt-2">
				<span class="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs">
					<span class="material-icons text-xs">location_on</span>
					{{ bookingStore.paximumSearch.location.name }}
					<span v-if="bookingStore.paximumSearch.location.country" class="text-indigo-400">
						({{ bookingStore.paximumSearch.location.country }})
					</span>
					<button @click="clearLocation" class="ml-1 hover:text-red-500">
						<span class="material-icons text-xs">close</span>
					</button>
				</span>
			</div>
			<p v-if="locationError" class="text-red-500 text-xs mt-1">{{ $t('validation.required') }}</p>
		</div>

		<!-- Date Range (Same as Local) -->
		<div>
			<label class="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
				{{ $t('booking.dates') }} <span class="text-red-500">*</span>
			</label>
			<BookingDateRangePicker
				v-model="dateRange"
				:min-date="minDate"
				:hasError="dateError"
			/>
			<p v-if="dateError" class="text-red-500 text-xs mt-1">{{ $t('validation.required') }}</p>
		</div>

		<!-- Guests - Compact (Same as Local) -->
		<div class="grid grid-cols-2 gap-3">
			<!-- Adults -->
			<div class="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
				<span class="text-xs text-gray-600 dark:text-slate-300">{{ $t('booking.adults') }}</span>
				<div class="flex items-center gap-2">
					<button
						@click="decrementAdults"
						:disabled="totalAdults <= 1"
						class="w-6 h-6 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-30"
					>
						<span class="material-icons text-sm">remove</span>
					</button>
					<span class="w-5 text-center font-semibold text-sm">{{ totalAdults }}</span>
					<button
						@click="incrementAdults"
						:disabled="totalAdults >= 10"
						class="w-6 h-6 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-30"
					>
						<span class="material-icons text-sm">add</span>
					</button>
				</div>
			</div>

			<!-- Children -->
			<div class="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
				<span class="text-xs text-gray-600 dark:text-slate-300">{{ $t('booking.children') }}</span>
				<div class="flex items-center gap-2">
					<button
						@click="removeLastChild"
						:disabled="totalChildren === 0"
						class="w-6 h-6 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-30"
					>
						<span class="material-icons text-sm">remove</span>
					</button>
					<span class="w-5 text-center font-semibold text-sm">{{ totalChildren }}</span>
					<button
						@click="addChild"
						:disabled="totalChildren >= 6"
						class="w-6 h-6 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-30"
					>
						<span class="material-icons text-sm">add</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Child Ages (Same style as Local) -->
		<div v-if="totalChildren > 0" class="flex flex-wrap gap-2">
			<div
				v-for="(age, index) in bookingStore.paximumSearch.rooms[0].childAges"
				:key="index"
				class="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-2 py-1"
			>
				<span class="text-xs text-indigo-600 dark:text-indigo-400">{{ index + 1 }}.</span>
				<select
					:value="age"
					@change="updateChildAge(index, parseInt($event.target.value))"
					class="text-xs bg-transparent border-none p-0 pr-4 text-indigo-700 dark:text-indigo-300 focus:ring-0"
				>
					<option v-for="a in 18" :key="a - 1" :value="a - 1">{{ a - 1 }} {{ $t('booking.yearsOld') }}</option>
				</select>
				<button @click="removeChild(index)" class="text-indigo-400 hover:text-red-500">
					<span class="material-icons text-xs">close</span>
				</button>
			</div>
		</div>

		<!-- Nationality -->
		<div>
			<label class="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
				{{ $t('booking.paximum.nationality') }}
			</label>
			<CountrySelect
				v-model="bookingStore.paximumSearch.nationality"
				:placeholder="$t('booking.selectCountry')"
			/>
		</div>

		<!-- Search Button -->
		<button
			@click="handleSearch"
			:disabled="bookingStore.loading.paximum"
			class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center text-sm font-medium disabled:opacity-50"
		>
			<span v-if="bookingStore.loading.paximum" class="material-icons animate-spin mr-1.5 text-sm">refresh</span>
			<span v-else class="material-icons mr-1.5 text-sm">search</span>
			{{ $t('booking.paximum.search') }}
		</button>

		<!-- Error Message -->
		<p v-if="bookingStore.error" class="text-red-500 text-xs text-center">
			{{ bookingStore.error }}
		</p>

		<!-- No Results Message -->
		<div
			v-if="bookingStore.paximumResults.noResults && !bookingStore.loading.paximum"
			class="text-center py-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
		>
			<span class="material-icons text-amber-500 text-lg mb-1">info</span>
			<p class="text-amber-700 dark:text-amber-400 text-sm font-medium">
				{{ $t('booking.paximum.noResults') }}
			</p>
			<p class="text-amber-600 dark:text-amber-500 text-xs mt-1">
				{{ $t('booking.paximum.tryDifferentCriteria') }}
			</p>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBookingStore } from '@/stores/booking'
import BookingDateRangePicker from './BookingDateRangePicker.vue'
import CountrySelect from '@/components/common/CountrySelect.vue'

const bookingStore = useBookingStore()

const emit = defineEmits(['search'])

// Location search state
const locationQuery = ref('')
const locations = ref([])
const loadingLocations = ref(false)
const showSuggestions = ref(false)

// Validation state
const showValidation = ref(false)

// Date range model (synced with paximumSearch)
const dateRange = computed({
	get: () => {
		const checkIn = bookingStore.paximumSearch.checkIn
		const nights = bookingStore.paximumSearch.nights || 7

		if (!checkIn) return { start: null, end: null }

		const start = checkIn
		const endDate = new Date(checkIn)
		endDate.setDate(endDate.getDate() + nights)
		const end = endDate.toISOString().split('T')[0]

		return { start, end }
	},
	set: (val) => {
		if (val?.start) {
			bookingStore.paximumSearch.checkIn = val.start
		}
		if (val?.start && val?.end) {
			// Calculate nights from date range
			const startDate = new Date(val.start)
			const endDate = new Date(val.end)
			const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
			bookingStore.paximumSearch.nights = nights > 0 ? nights : 1
		}
	}
})

// Computed - Min date (today)
const minDate = computed(() => {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	return today
})

// Total adults (from first room - single room for now)
const totalAdults = computed(() => {
	return bookingStore.paximumSearch.rooms[0]?.adults || 2
})

// Total children
const totalChildren = computed(() => {
	return bookingStore.paximumSearch.rooms[0]?.childAges?.length || 0
})

// Validation
const locationError = computed(() => {
	return showValidation.value && !bookingStore.paximumSearch.location
})

const dateError = computed(() => {
	return showValidation.value && !bookingStore.paximumSearch.checkIn
})

// Location icon based on type
const getLocationIcon = (type) => {
	switch (type) {
		case 1: return 'location_city' // City
		case 2: return 'hotel' // Hotel
		case 3: return 'beach_access' // Region
		default: return 'place'
	}
}

// Handle location search with debounce
let searchTimeout = null
const handleLocationSearch = () => {
	clearTimeout(searchTimeout)

	if (locationQuery.value.length < 2) {
		locations.value = []
		return
	}

	searchTimeout = setTimeout(async () => {
		loadingLocations.value = true
		try {
			locations.value = await bookingStore.paximumAutocomplete(locationQuery.value)
		} finally {
			loadingLocations.value = false
		}
	}, 300)
}

// Select location
const selectLocation = (loc) => {
	bookingStore.paximumSearch.location = loc
	locationQuery.value = ''
	locations.value = []
	showSuggestions.value = false
}

// Clear location
const clearLocation = () => {
	bookingStore.paximumSearch.location = null
}

// Adults
const incrementAdults = () => {
	if (bookingStore.paximumSearch.rooms[0].adults < 10) {
		bookingStore.paximumSearch.rooms[0].adults++
	}
}

const decrementAdults = () => {
	if (bookingStore.paximumSearch.rooms[0].adults > 1) {
		bookingStore.paximumSearch.rooms[0].adults--
	}
}

// Children
const addChild = () => {
	if (bookingStore.paximumSearch.rooms[0].childAges.length < 6) {
		bookingStore.paximumSearch.rooms[0].childAges.push(0)
	}
}

const removeLastChild = () => {
	if (bookingStore.paximumSearch.rooms[0].childAges.length > 0) {
		bookingStore.paximumSearch.rooms[0].childAges.pop()
	}
}

const removeChild = (index) => {
	bookingStore.paximumSearch.rooms[0].childAges.splice(index, 1)
}

// Update child age
const updateChildAge = (index, age) => {
	bookingStore.paximumSearch.rooms[0].childAges[index] = age
}

// Handle search
const handleSearch = async () => {
	showValidation.value = true

	if (!bookingStore.paximumSearch.location || !bookingStore.paximumSearch.checkIn) {
		return
	}

	const success = await bookingStore.searchPaximumHotels()
	if (success) {
		emit('search')
	}
}

// Close suggestions on click outside
const handleClickOutside = (event) => {
	if (!event.target.closest('.relative')) {
		showSuggestions.value = false
	}
}

// Add click outside listener
if (typeof document !== 'undefined') {
	document.addEventListener('click', handleClickOutside)
}
</script>
