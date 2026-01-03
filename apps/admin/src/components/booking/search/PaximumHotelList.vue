<template>
	<div class="space-y-3">
		<!-- Loading State -->
		<div v-if="bookingStore.loading.paximum" class="flex items-center justify-center py-12">
			<div class="text-center">
				<span class="material-icons animate-spin text-4xl text-indigo-500">refresh</span>
				<p class="mt-2 text-sm text-gray-500">{{ $t('booking.paximum.searching') }}</p>
			</div>
		</div>

		<!-- Empty State -->
		<div
			v-else-if="bookingStore.paximumResults.hotels.length === 0"
			class="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
		>
			<span class="material-icons text-4xl text-gray-300 dark:text-slate-600">travel_explore</span>
			<p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('booking.paximum.noResults') }}</p>
		</div>

		<!-- Hotel List -->
		<template v-else>
			<!-- Results Header -->
			<div class="flex items-center justify-between px-2">
				<span class="text-sm text-gray-500 dark:text-slate-400">
					{{ bookingStore.paximumResults.hotels.length }} {{ $t('booking.hotels') }}
				</span>
			</div>

			<!-- Hotel Items -->
			<div class="space-y-2">
				<div
					v-for="hotel in bookingStore.paximumResults.hotels"
					:key="hotel.id"
					@click="selectHotel(hotel)"
					:class="[
						'flex items-stretch bg-white dark:bg-slate-800 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border',
						isSelected(hotel)
							? 'border-indigo-500 ring-2 ring-indigo-500/20'
							: 'border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md'
					]"
				>
					<!-- Hotel Image -->
					<div class="relative w-28 h-24 flex-shrink-0">
						<img
							v-if="getHotelImage(hotel)"
							:src="getHotelImage(hotel)"
							:alt="hotel.name"
							class="w-full h-full object-cover"
							loading="lazy"
						>
						<div v-else class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
							<span class="material-icons text-2xl text-gray-400 dark:text-slate-500">hotel</span>
						</div>

						<!-- Selected Check -->
						<div v-if="isSelected(hotel)" class="absolute top-1 left-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
							<span class="material-icons text-white text-xs">check</span>
						</div>
					</div>

					<!-- Hotel Info -->
					<div class="flex-1 p-3 min-w-0 flex flex-col justify-center">
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0 flex-1">
								<h4 class="font-semibold text-gray-900 dark:text-white truncate text-sm">
									{{ hotel.name }}
								</h4>
								<div class="flex items-center gap-2 mt-0.5">
									<!-- Stars -->
									<div v-if="hotel.stars" class="flex items-center">
										<span
											v-for="n in hotel.stars"
											:key="n"
											class="material-icons text-yellow-400"
											style="font-size: 11px"
										>star</span>
									</div>
									<!-- Location -->
									<span v-if="getLocationName(hotel)" class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-0.5">
										<span class="material-icons" style="font-size: 11px">location_on</span>
										{{ getLocationName(hotel) }}
									</span>
								</div>
							</div>
						</div>

						<!-- Bottom Row: Board Type + Price -->
						<div class="flex items-center justify-between mt-2">
							<!-- Board Type -->
							<span v-if="getBoardType(hotel)" class="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
								{{ getBoardType(hotel) }}
							</span>
							<span v-else></span>

							<!-- Price -->
							<div class="text-right">
								<span class="text-xs text-gray-400">{{ $t('booking.startingFrom') }}</span>
								<span class="ml-1 font-bold text-indigo-600 dark:text-indigo-400">
									{{ formatPrice(getMinPrice(hotel)) }} {{ getCurrency(hotel) }}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</template>
	</div>
</template>

<script setup>
import { useBookingStore } from '@/stores/booking'

const bookingStore = useBookingStore()

const emit = defineEmits(['hotel-selected'])

// Check if hotel is selected
const isSelected = (hotel) => {
	return bookingStore.paximumResults.selectedHotel?.id === hotel.id
}

// Get hotel image
const getHotelImage = (hotel) => {
	// Paximum returns thumbnailFull with full URL
	if (hotel.thumbnailFull) return hotel.thumbnailFull
	if (hotel.thumbnailUrl) return hotel.thumbnailUrl
	if (hotel.images && hotel.images.length > 0) {
		return hotel.images[0].url || hotel.images[0]
	}
	return null
}

// Get cheapest price from offers
const getMinPrice = (hotel) => {
	if (!hotel.offers || hotel.offers.length === 0) return null
	const prices = hotel.offers.map(o => o.price?.amount).filter(Boolean)
	return prices.length > 0 ? Math.min(...prices) : null
}

// Get currency from offers
const getCurrency = (hotel) => {
	if (!hotel.offers || hotel.offers.length === 0) return 'TRY'
	return hotel.offers[0]?.price?.currency || 'TRY'
}

// Get board type from first offer
const getBoardType = (hotel) => {
	if (!hotel.offers || hotel.offers.length === 0) return ''
	const firstRoom = hotel.offers[0]?.rooms?.[0]
	return firstRoom?.boardName || ''
}

// Get location display name
const getLocationName = (hotel) => {
	if (hotel.city?.name) return hotel.city.name
	if (hotel.location?.name) return hotel.location.name
	return ''
}

// Format price
const formatPrice = (price) => {
	if (!price) return '-'
	return new Intl.NumberFormat('tr-TR', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(price)
}

// Select hotel
const selectHotel = async (hotel) => {
	await bookingStore.selectPaximumHotel(hotel)
	emit('hotel-selected', hotel)
}
</script>
