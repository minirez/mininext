<template>
	<div class="mt-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
		<!-- Header -->
		<div class="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-gray-200 dark:border-slate-700">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="material-icons text-indigo-500">hotel</span>
					<h3 class="font-semibold text-gray-900 dark:text-white">
						{{ bookingStore.paximumResults.selectedHotel?.name }}
					</h3>
				</div>
				<button
					@click="closePanel"
					class="text-gray-400 hover:text-gray-600 dark:hover:text-white"
				>
					<span class="material-icons">close</span>
				</button>
			</div>
		</div>

		<!-- Loading State -->
		<div v-if="bookingStore.loading.paximumOffers" class="flex items-center justify-center py-8">
			<div class="text-center">
				<span class="material-icons animate-spin text-3xl text-indigo-500">refresh</span>
				<p class="mt-2 text-sm text-gray-500">{{ $t('booking.paximum.searching') }}</p>
			</div>
		</div>

		<!-- No Offers -->
		<div
			v-else-if="bookingStore.paximumResults.selectedHotelOffers.length === 0"
			class="text-center py-8"
		>
			<span class="material-icons text-3xl text-gray-300 dark:text-slate-600">meeting_room</span>
			<p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('booking.paximum.noResults') }}</p>
		</div>

		<!-- Offers List -->
		<div v-else class="divide-y divide-gray-200 dark:divide-slate-700">
			<div
				v-for="offer in bookingStore.paximumResults.selectedHotelOffers"
				:key="offer.offerId"
				class="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
			>
				<div class="flex items-start justify-between gap-4">
					<!-- Room Info -->
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 flex-wrap">
							<h4 class="font-medium text-gray-900 dark:text-white text-sm">
								{{ getRoomName(offer) }}
							</h4>
							<!-- Cancellation Badge -->
							<span
								v-if="offer.isRefundable"
								class="px-1.5 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
							>
								{{ $t('booking.paximum.freeCancellation') }}
							</span>
							<span
								v-else
								class="px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
							>
								{{ $t('booking.paximum.nonRefundable') }}
							</span>
						</div>

						<!-- Board Type -->
						<p class="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1">
							<span class="material-icons" style="font-size: 12px">restaurant</span>
							{{ getBoardName(offer) }}
						</p>

						<!-- Room Details -->
						<div v-if="offer.rooms && offer.rooms.length > 0" class="mt-2 flex flex-wrap gap-2">
							<span
								v-for="(room, idx) in offer.rooms"
								:key="idx"
								class="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-gray-600 dark:text-slate-300"
							>
								{{ room.roomName || room.roomType }}
							</span>
						</div>
					</div>

					<!-- Price & Action -->
					<div class="text-right flex-shrink-0">
						<div class="text-lg font-bold text-indigo-600 dark:text-indigo-400">
							{{ formatPrice(offer.price?.amount) }}
							<span class="text-xs font-normal text-gray-500">{{ offer.price?.currency || 'TRY' }}</span>
						</div>
						<p class="text-xs text-gray-400 mt-0.5">
							{{ bookingStore.paximumSearch.nights }} {{ $t('booking.night') }}
						</p>
						<button
							@click="addToCart(offer)"
							class="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1"
						>
							<span class="material-icons text-sm">add_shopping_cart</span>
							{{ $t('booking.paximum.addToCart') }}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { useBookingStore } from '@/stores/booking'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'

const bookingStore = useBookingStore()
const toast = useToast()
const { t } = useI18n()

const emit = defineEmits(['add-to-cart'])

// Get room name from offer
const getRoomName = (offer) => {
	if (offer.rooms && offer.rooms.length > 0) {
		return offer.rooms[0].roomName || offer.rooms[0].roomType || t('booking.room')
	}
	return offer.roomName || t('booking.room')
}

// Get board name
const getBoardName = (offer) => {
	if (offer.rooms && offer.rooms.length > 0) {
		return offer.rooms[0].boardName || offer.rooms[0].boardType || '-'
	}
	return offer.boardName || '-'
}

// Format price
const formatPrice = (price) => {
	if (!price) return '-'
	return new Intl.NumberFormat('tr-TR', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(price)
}

// Close panel
const closePanel = () => {
	bookingStore.paximumResults.selectedHotel = null
	bookingStore.paximumResults.selectedHotelOffers = []
}

// Add to cart
const addToCart = (offer) => {
	emit('add-to-cart', offer)
	toast.success(t('booking.paximum.addToCart'))
}
</script>
