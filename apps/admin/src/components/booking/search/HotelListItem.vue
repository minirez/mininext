<template>
	<div
		@click="$emit('click')"
		:class="[
			'flex items-stretch bg-white dark:bg-slate-800 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border',
			selected
				? 'border-purple-500 ring-2 ring-purple-500/20'
				: 'border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md'
		]"
	>
		<!-- Hotel Image -->
		<div class="relative w-28 h-24 flex-shrink-0">
			<img
				v-if="mainImage"
				:src="getImageUrl(mainImage)"
				:alt="getHotelName"
				class="w-full h-full object-cover"
			>
			<div v-else class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
				<span class="material-icons text-2xl text-gray-400 dark:text-slate-500">hotel</span>
			</div>

			<!-- Selected Check -->
			<div v-if="selected" class="absolute top-1 left-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
				<span class="material-icons text-white text-xs">check</span>
			</div>
		</div>

		<!-- Hotel Info -->
		<div class="flex-1 p-3 min-w-0 flex flex-col justify-center">
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0 flex-1">
					<h4 class="font-semibold text-gray-900 dark:text-white truncate text-sm">
						{{ getHotelName }}
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
						<span class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-0.5">
							<span class="material-icons" style="font-size: 11px">location_on</span>
							{{ hotel.city }}
						</span>
					</div>
				</div>

				<!-- Info Button -->
				<button
					@click.stop="$emit('show-info')"
					class="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex-shrink-0"
					:title="$t('booking.hotelDetails')"
				>
					<span class="material-icons text-lg">info_outline</span>
				</button>
			</div>

			<!-- Bottom Row: Availability + Price -->
			<div class="flex items-center justify-between mt-2">
				<!-- Availability -->
				<span
					:class="[
						'text-xs font-medium',
						hotel.availableRoomCount > 3
							? 'text-green-600 dark:text-green-400'
							: hotel.availableRoomCount > 0
								? 'text-amber-600 dark:text-amber-400'
								: 'text-red-600 dark:text-red-400'
					]"
				>
					{{ hotel.availableRoomCount > 0 ? `${hotel.availableRoomCount} oda` : $t('booking.noAvailability') }}
				</span>

				<!-- Price -->
				<div class="text-right">
					<span class="text-xs text-gray-400">{{ $t('booking.startingFrom') }}</span>
					<span class="ml-1 font-bold text-purple-600 dark:text-purple-400">
						{{ formatPrice(hotel.cheapestPrice) }} {{ hotel.currency }}
					</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getImageUrl } from '@/utils/imageUrl'

const { locale } = useI18n()

const props = defineProps({
	hotel: {
		type: Object,
		required: true
	},
	selected: {
		type: Boolean,
		default: false
	}
})

defineEmits(['click', 'show-info'])

// getImageUrl imported from @/utils/imageUrl

// Get main image
const mainImage = computed(() => {
	if (!props.hotel.images || props.hotel.images.length === 0) return null
	const main = props.hotel.images.find(img => img.isMain)
	return main?.url || props.hotel.images[0]?.url || null
})

// Get localized hotel name
const getHotelName = computed(() => {
	const name = props.hotel.name
	if (!name) return ''
	if (typeof name === 'object') {
		return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
	}
	return name
})

// Format price
const formatPrice = (price) => {
	if (!price) return '-'
	return new Intl.NumberFormat('tr-TR', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(price)
}
</script>
