<template>
	<div class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
		<!-- Provider Tab Bar -->
		<div v-if="bookingStore.paximumEnabled" class="flex border-b border-gray-200 dark:border-slate-700">
			<button
				@click="bookingStore.setProvider('local')"
				:class="[
					'flex-1 px-4 py-2 text-sm font-medium transition-colors',
					bookingStore.activeProvider === 'local'
						? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20'
						: 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white'
				]"
			>
				<span class="flex items-center justify-center gap-1.5">
					<span class="material-icons text-sm">home</span>
					{{ $t('booking.provider.local') }}
				</span>
			</button>
			<button
				@click="bookingStore.setProvider('paximum')"
				:class="[
					'flex-1 px-4 py-2 text-sm font-medium transition-colors',
					bookingStore.activeProvider === 'paximum'
						? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
						: 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white'
				]"
			>
				<span class="flex items-center justify-center gap-1.5">
					<span class="material-icons text-sm">travel_explore</span>
					Bedbank
				</span>
			</button>
		</div>

		<!-- Header - Always Visible -->
		<div
			@click="toggleExpanded"
			class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
			:class="{ 'border-b border-gray-200 dark:border-slate-700': isExpanded }"
		>
			<div class="flex items-center gap-2">
				<span class="material-icons" :class="bookingStore.activeProvider === 'paximum' ? 'text-indigo-500' : 'text-purple-500'">search</span>
				<span class="font-medium text-gray-900 dark:text-white text-sm">{{ $t('booking.searchTitle') }}</span>
			</div>
			<div class="flex items-center gap-2">
				<!-- Search Summary when collapsed -->
				<div v-if="!isExpanded && hasSearchCriteria" class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
					<span v-if="bookingStore.search.dateRange.start" class="flex items-center gap-1">
						<span class="material-icons" style="font-size: 12px">calendar_today</span>
						{{ formatDateShort(bookingStore.search.dateRange.start) }} - {{ formatDateShort(bookingStore.search.dateRange.end) }}
					</span>
					<span class="flex items-center gap-1">
						<span class="material-icons" style="font-size: 12px">people</span>
						{{ bookingStore.search.adults }}{{ bookingStore.search.children.length ? '+' + bookingStore.search.children.length : '' }}
					</span>
				</div>
				<button class="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
					<span class="material-icons transition-transform" :class="{ 'rotate-180': isExpanded }">expand_more</span>
				</button>
			</div>
		</div>

		<!-- Collapsible Content -->
		<transition name="collapse">
			<div v-show="isExpanded" class="p-4 space-y-4">
				<!-- Paximum Search Form -->
				<PaximumSearchForm
					v-if="bookingStore.activeProvider === 'paximum'"
					@search="handlePaximumSearch"
				/>

				<!-- Local Search Form -->
				<template v-else>
				<!-- Hotel/Region Selection -->
				<div>
					<label class="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
						{{ $t('booking.hotelOrRegion') }} <span class="text-red-500">*</span>
					</label>
					<HotelRegionSelector
						v-model="selectedLocation"
						@hotel-selected="handleHotelSelected"
						:hasError="locationError"
					/>
					<p v-if="locationError" class="text-red-500 text-xs mt-1">{{ $t('validation.required') }}</p>
				</div>

				<!-- Date Range -->
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

				<!-- Guests - Compact -->
				<div class="grid grid-cols-2 gap-3">
					<!-- Adults -->
					<div class="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
						<span class="text-xs text-gray-600 dark:text-slate-300">{{ $t('booking.adults') }}</span>
						<div class="flex items-center gap-2">
							<button
								@click="decrementAdults"
								:disabled="bookingStore.search.adults <= 1"
								class="w-6 h-6 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-30"
							>
								<span class="material-icons text-sm">remove</span>
							</button>
							<span class="w-5 text-center font-semibold text-sm">{{ bookingStore.search.adults }}</span>
							<button
								@click="incrementAdults"
								:disabled="bookingStore.search.adults >= 10"
								class="w-6 h-6 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-30"
							>
								<span class="material-icons text-sm">add</span>
							</button>
						</div>
					</div>

					<!-- Children -->
					<div class="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2" :class="{ 'opacity-50': !childrenAllowed }">
						<span class="text-xs text-gray-600 dark:text-slate-300">{{ $t('booking.children') }}</span>
						<div class="flex items-center gap-2">
							<button
								@click="removeLastChild"
								:disabled="!childrenAllowed || bookingStore.search.children.length === 0"
								class="w-6 h-6 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-30"
							>
								<span class="material-icons text-sm">remove</span>
							</button>
							<span class="w-5 text-center font-semibold text-sm">{{ bookingStore.search.children.length }}</span>
							<button
								@click="addChild"
								:disabled="!childrenAllowed || bookingStore.search.children.length >= 6"
								class="w-6 h-6 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-30"
							>
								<span class="material-icons text-sm">add</span>
							</button>
						</div>
					</div>
				</div>

				<!-- Child Ages -->
				<div v-if="childrenAllowed && bookingStore.search.children.length > 0" class="flex flex-wrap gap-2">
					<div
						v-for="(age, index) in bookingStore.search.children"
						:key="index"
						class="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-2 py-1"
					>
						<span class="text-xs text-purple-600 dark:text-purple-400">{{ index + 1 }}.</span>
						<select
							:value="age"
							@change="updateChildAge(index, parseInt($event.target.value))"
							class="text-xs bg-transparent border-none p-0 pr-4 text-purple-700 dark:text-purple-300 focus:ring-0"
						>
							<option v-for="a in maxChildAge + 1" :key="a - 1" :value="a - 1">{{ a - 1 }} yaş</option>
						</select>
						<button @click="removeChild(index)" class="text-purple-400 hover:text-red-500">
							<span class="material-icons text-xs">close</span>
						</button>
					</div>
				</div>

				<!-- Channel & Country Row -->
				<div class="grid grid-cols-2 gap-3">
					<!-- Channel -->
					<div>
						<label class="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">{{ $t('booking.channel') }}</label>
						<div class="flex rounded-lg bg-gray-100 dark:bg-slate-700 p-0.5">
							<button
								@click="bookingStore.search.channel = 'B2B'"
								:class="[
									'flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors',
									bookingStore.search.channel === 'B2B'
										? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm'
										: 'text-gray-500 hover:text-gray-700'
								]"
							>B2B</button>
							<button
								@click="bookingStore.search.channel = 'B2C'"
								:class="[
									'flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors',
									bookingStore.search.channel === 'B2C'
										? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm'
										: 'text-gray-500 hover:text-gray-700'
								]"
							>B2C</button>
						</div>
					</div>

					<!-- Country -->
					<div>
						<label class="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">{{ $t('booking.guestCountry') }}</label>
						<CountrySelect
							v-model="bookingStore.search.countryCode"
							:placeholder="$t('booking.selectCountry')"
						/>
					</div>
				</div>

				<!-- Search Button -->
				<button
					@click="handleSearch"
					:disabled="bookingStore.loading.hotels"
					class="btn-primary w-full py-2.5 flex items-center justify-center text-sm font-medium"
				>
					<span v-if="bookingStore.loading.hotels" class="material-icons animate-spin mr-1.5 text-sm">refresh</span>
					<span v-else class="material-icons mr-1.5 text-sm">search</span>
					{{ $t('booking.searchAvailability') }}
				</button>
				</template>
			</div>
		</transition>
	</div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBookingStore } from '@/stores/booking'
import HotelRegionSelector from './HotelRegionSelector.vue'
import BookingDateRangePicker from './BookingDateRangePicker.vue'
import PaximumSearchForm from './PaximumSearchForm.vue'
import CountrySelect from '@/components/common/CountrySelect.vue'

const { locale } = useI18n()
const bookingStore = useBookingStore()

const emit = defineEmits(['search', 'paximum-search'])

// Check Paximum status on mount
onMounted(() => {
	bookingStore.checkPaximumStatus()
})

// Collapsed state
const isExpanded = ref(true)

// Validation state
const showValidation = ref(false)

const toggleExpanded = () => {
	isExpanded.value = !isExpanded.value
}

// Check if has search criteria
const hasSearchCriteria = computed(() => {
	return bookingStore.search.dateRange.start || bookingStore.search.hotelIds.length > 0
})

// Format date short
const formatDateShort = (date) => {
	if (!date) return ''
	return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
		day: 'numeric',
		month: 'short'
	})
}

// Selected location (hotel/region)
const selectedLocation = ref({
	hotels: [],
	regions: [],
	provinces: []
})

// Selected hotel data (for child age limits)
const selectedHotelData = ref(null)

// Child settings based on selected hotel
const maxChildAge = computed(() => {
	if (selectedHotelData.value?.maxChildAge !== undefined) {
		return selectedHotelData.value.maxChildAge
	}
	return 12
})

const childrenAllowed = computed(() => {
	if (!selectedHotelData.value) return true
	return maxChildAge.value > 0
})

// Date range model
const dateRange = computed({
	get: () => ({
		start: bookingStore.search.dateRange.start,
		end: bookingStore.search.dateRange.end
	}),
	set: (val) => {
		bookingStore.setDateRange(val?.start || null, val?.end || null)
	}
})

// Min date (today)
const minDate = computed(() => {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	return today
})

// Validation computed properties
const hasLocation = computed(() => {
	return selectedLocation.value.hotels.length > 0 ||
		selectedLocation.value.regions.length > 0 ||
		selectedLocation.value.provinces.length > 0
})

const hasDateRange = computed(() => {
	return bookingStore.search.dateRange.start && bookingStore.search.dateRange.end
})

const locationError = computed(() => {
	return showValidation.value && !hasLocation.value
})

const dateError = computed(() => {
	return showValidation.value && !hasDateRange.value
})

// Can search
const canSearch = computed(() => {
	return (
		hasLocation.value &&
		hasDateRange.value &&
		bookingStore.search.adults >= 1
	)
})

// Handle hotel selection
const handleHotelSelected = (hotel) => {
	selectedHotelData.value = hotel

	if (hotel && hotel.maxChildAge === 0) {
		bookingStore.setGuestsCount(bookingStore.search.adults, [])
	}

	if (hotel && hotel.maxChildAge > 0) {
		const cappedChildren = bookingStore.search.children.map(age =>
			Math.min(age, hotel.maxChildAge)
		)
		if (JSON.stringify(cappedChildren) !== JSON.stringify(bookingStore.search.children)) {
			bookingStore.setGuestsCount(bookingStore.search.adults, cappedChildren)
		}
	}
}

// Adults
const incrementAdults = () => {
	if (bookingStore.search.adults < 10) {
		bookingStore.setGuestsCount(bookingStore.search.adults + 1, bookingStore.search.children)
	}
}

const decrementAdults = () => {
	if (bookingStore.search.adults > 1) {
		bookingStore.setGuestsCount(bookingStore.search.adults - 1, bookingStore.search.children)
	}
}

// Children
const addChild = () => {
	if (childrenAllowed.value && bookingStore.search.children.length < 6) {
		const newChildren = [...bookingStore.search.children, 0]
		bookingStore.setGuestsCount(bookingStore.search.adults, newChildren)
	}
}

const removeLastChild = () => {
	if (bookingStore.search.children.length > 0) {
		const newChildren = bookingStore.search.children.slice(0, -1)
		bookingStore.setGuestsCount(bookingStore.search.adults, newChildren)
	}
}

const removeChild = (index) => {
	const newChildren = [...bookingStore.search.children]
	newChildren.splice(index, 1)
	bookingStore.setGuestsCount(bookingStore.search.adults, newChildren)
}

const updateChildAge = (index, age) => {
	const newChildren = [...bookingStore.search.children]
	newChildren[index] = Math.min(age, maxChildAge.value)
	bookingStore.setGuestsCount(bookingStore.search.adults, newChildren)
}

// Watch location changes and update store
watch(selectedLocation, (location) => {
	bookingStore.search.hotelIds = location.hotels || []
	bookingStore.search.tourismRegionIds = location.regions || []

	if (location.hotels.length !== 1) {
		selectedHotelData.value = null
	}
}, { deep: true })

// Handle search
const handleSearch = () => {
	// Show validation errors if fields are missing
	if (!canSearch.value) {
		showValidation.value = true
		return
	}

	// Reset validation on successful search
	showValidation.value = false
	emit('search')
	// Collapse after search
	isExpanded.value = false
}

// Handle Paximum search
const handlePaximumSearch = () => {
	emit('paximum-search')
	// Collapse after search
	isExpanded.value = false
}
</script>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
	transition: all 0.3s ease;
	overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
	max-height: 0;
	opacity: 0;
	padding-top: 0;
	padding-bottom: 0;
}

.collapse-enter-to,
.collapse-leave-from {
	max-height: 600px;
	opacity: 1;
}
</style>
