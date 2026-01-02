<template>
	<div class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col min-h-0">
		<!-- Hotel Header -->
		<HotelHeader v-if="hotel" :hotel="hotel" :search-info="searchInfo" />

		<!-- Loading State -->
		<div v-if="loading" class="flex-1 flex items-center justify-center p-8">
			<div class="text-center">
				<span class="material-icons text-3xl text-purple-500 animate-spin">refresh</span>
				<p class="text-sm text-gray-500 dark:text-slate-400 mt-2">{{ $t('booking.loadingRooms') }}</p>
			</div>
		</div>

		<!-- No Rooms State -->
		<div v-else-if="rooms.length === 0" class="flex-1 flex items-center justify-center p-8">
			<div class="text-center">
				<span class="material-icons text-4xl text-gray-300 dark:text-slate-600">meeting_room</span>
				<p class="text-sm text-gray-500 dark:text-slate-400 mt-2">{{ $t('booking.noRoomsAvailable') }}</p>
			</div>
		</div>

		<!-- Rooms List -->
		<div v-else class="flex-1 overflow-y-auto p-3 space-y-3">
			<!-- Room Card -->
			<div
				v-for="(room, roomIndex) in rooms"
				:key="room.roomType?._id || roomIndex"
				class="bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden"
			>
				<!-- Room Header: Image + Name -->
				<div class="flex items-stretch border-b border-gray-200 dark:border-slate-600">
					<!-- Room Image -->
					<div class="w-32 h-24 flex-shrink-0 relative">
						<img
							v-if="getRoomImage(room)"
							:src="getImageUrl(getRoomImage(room))"
							:alt="getLocalizedName(room.roomType?.name)"
							class="w-full h-full object-cover"
						/>
						<div v-else class="w-full h-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
							<span class="material-icons text-2xl text-gray-400 dark:text-slate-500">bed</span>
						</div>
						<!-- Photo count badge -->
						<button
							v-if="room.roomType?.images?.length > 1"
							@click="openRoomGallery(room.roomType)"
							class="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5"
						>
							<span class="material-icons" style="font-size: 12px">photo_library</span>
							{{ room.roomType.images.length }}
						</button>
					</div>

					<!-- Room Info -->
					<div class="flex-1 p-3 flex flex-col justify-center">
						<h4 class="font-semibold text-gray-900 dark:text-white text-sm">
							{{ getLocalizedName(room.roomType?.name) }}
						</h4>
						<div class="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-slate-400">
							<span class="flex items-center gap-0.5">
								<span class="material-icons" style="font-size: 12px">square_foot</span>
								{{ room.roomType?.size || 30 }}m²
							</span>
							<span class="flex items-center gap-0.5">
								<span class="material-icons" style="font-size: 12px">person</span>
								{{ room.roomType?.occupancy?.maxAdults || 2 }}
							</span>
							<span v-if="room.roomType?.occupancy?.maxChildren" class="flex items-center gap-0.5">
								<span class="material-icons" style="font-size: 12px">child_care</span>
								{{ room.roomType.occupancy.maxChildren }}
							</span>
						</div>
					</div>
				</div>

				<!-- Capacity Warning -->
				<div
					v-if="room.capacityExceeded"
					class="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 flex items-center gap-2"
				>
					<span class="material-icons text-amber-500 text-sm">warning</span>
					<span class="text-xs text-amber-700 dark:text-amber-300">{{ $t('booking.capacityExceeded') }}</span>
				</div>

				<!-- Meal Plan Options -->
				<div v-if="!room.capacityExceeded && room.options?.length > 0" class="divide-y divide-gray-200 dark:divide-slate-600">
					<div
						v-for="option in room.options.filter(o => o.pricing)"
						:key="option.mealPlan?._id"
						class="p-3 hover:bg-white dark:hover:bg-slate-700 transition-colors"
					>
						<!-- Main Row: Refundable Rate -->
						<div class="flex items-center gap-3">
							<!-- Meal Plan Icon & Name -->
							<div class="flex items-center gap-2 flex-1 min-w-0">
								<div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
									<span class="material-icons text-purple-500 text-sm">{{ getMealPlanIcon(option.mealPlan?.code) }}</span>
								</div>
								<div class="min-w-0">
									<div class="flex items-center gap-1.5">
										<span class="text-sm font-medium text-gray-900 dark:text-white truncate">
											{{ getLocalizedName(option.mealPlan?.name) }}
										</span>
										<span class="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300 rounded">
											{{ option.mealPlan?.code }}
										</span>
									</div>
									<!-- Campaigns -->
									<div v-if="option.campaigns?.length > 0" class="flex items-center gap-1 mt-0.5">
										<span
											v-for="campaign in option.campaigns.slice(0, 2)"
											:key="campaign.code"
											class="text-xs text-green-600 dark:text-green-400 flex items-center gap-0.5"
										>
											<span class="material-icons" style="font-size: 10px">local_offer</span>
											{{ campaign.discountText || '-' + Math.round(campaign.discountPercent || 0) + '%' }}
										</span>
									</div>
								</div>
							</div>

							<!-- Price -->
							<div class="text-right flex-shrink-0">
								<div v-if="option.pricing.totalDiscount > 0" class="text-xs text-gray-400 line-through">
									{{ formatPrice(option.pricing.originalTotal, option.pricing.currency) }}
								</div>
								<div class="font-bold text-purple-600 dark:text-purple-400">
									{{ formatPrice(option.pricing.finalTotal, option.pricing.currency) }}
								</div>
								<button
									@click="openPriceDetail(room.roomType, option)"
									class="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-0.5 mt-0.5 ml-auto"
								>
									<span class="material-icons" style="font-size: 12px">info</span>
									{{ $t('common.details') }}
								</button>
							</div>

							<!-- Add to Cart Button -->
							<button
								@click="handleAddToCart(room.roomType, option.mealPlan, option)"
								class="flex-shrink-0 w-9 h-9 rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-colors shadow-sm"
								:title="$t('booking.addToCart')"
							>
								<span class="material-icons text-lg">add</span>
							</button>
						</div>

						<!-- Non-Refundable Rate Row (if enabled) -->
						<div
							v-if="option.nonRefundable?.enabled"
							class="flex items-center gap-3 mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-slate-600"
						>
							<!-- Non-refundable label -->
							<div class="flex items-center gap-2 flex-1 min-w-0">
								<div class="w-8 h-8 flex-shrink-0"></div>
								<div class="flex items-center gap-1.5">
									<span class="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
										İade Edilmez
									</span>
									<span class="text-xs text-green-600 dark:text-green-400">
										-%{{ option.nonRefundable.discountPercent }}
									</span>
								</div>
							</div>

							<!-- Non-refundable Price -->
							<div class="text-right flex-shrink-0">
								<div class="font-bold text-red-600 dark:text-red-400">
									{{ formatPrice(option.nonRefundable.pricing?.finalTotal, option.pricing.currency) }}
								</div>
							</div>

							<!-- Add Non-refundable to Cart Button -->
							<button
								@click="handleAddToCartNonRefundable(room.roomType, option.mealPlan, option)"
								class="flex-shrink-0 w-9 h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-sm"
								:title="$t('booking.addToCart') + ' (İade Edilmez)'"
							>
								<span class="material-icons text-lg">add</span>
							</button>
						</div>
					</div>
				</div>

				<!-- Unavailable Options (No Allotment) -->
				<div v-if="!room.capacityExceeded && room.unavailableOptions?.length > 0" class="divide-y divide-gray-200 dark:divide-slate-600 opacity-60">
					<div
						v-for="option in room.unavailableOptions"
						:key="'unavail-' + option.mealPlan?._id"
						class="flex items-center gap-3 p-3 bg-gray-100 dark:bg-slate-800/50"
					>
						<!-- Meal Plan Icon & Name -->
						<div class="flex items-center gap-2 flex-1 min-w-0">
							<div class="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
								<span class="material-icons text-gray-400 dark:text-slate-500 text-sm">{{ getMealPlanIcon(option.mealPlan?.code) }}</span>
							</div>
							<div class="min-w-0">
								<div class="flex items-center gap-1.5">
									<span class="text-sm font-medium text-gray-500 dark:text-slate-400 truncate">
										{{ getLocalizedName(option.mealPlan?.name) }}
									</span>
									<span class="text-xs px-1.5 py-0.5 bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-slate-400 rounded">
										{{ option.mealPlan?.code }}
									</span>
								</div>
								<div class="flex items-center gap-1 mt-0.5">
									<span class="material-icons text-orange-500" style="font-size: 12px">block</span>
									<span class="text-xs text-orange-600 dark:text-orange-400">Müsait değil</span>
								</div>
							</div>
						</div>

						<!-- Price (shown but greyed out) -->
						<div class="text-right flex-shrink-0">
							<div class="font-bold text-gray-400 dark:text-slate-500">
								{{ formatPrice(option.pricing?.finalTotal, option.pricing?.currency) }}
							</div>
						</div>

						<!-- Disabled Button -->
						<button
							disabled
							class="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-300 dark:bg-slate-600 text-gray-400 dark:text-slate-500 flex items-center justify-center cursor-not-allowed"
						>
							<span class="material-icons text-lg">block</span>
						</button>
					</div>
				</div>

				<!-- No Options -->
				<div
					v-if="!room.capacityExceeded && room.options?.filter(o => o.pricing).length === 0 && !room.unavailableOptions?.length"
					class="p-3 text-center text-xs text-gray-400"
				>
					{{ $t('booking.noOptionsAvailable') }}
				</div>
			</div>
		</div>

		<!-- Room Gallery Modal -->
		<RoomGalleryModal
			v-model="showRoomGallery"
			:room-type="selectedRoomType"
		/>

		<!-- Price Detail Modal -->
		<PriceDetailModal
			v-model="showPriceDetail"
			:option="selectedPriceOption"
			:room-type="selectedPriceRoomType"
			:max-discount-percent="hotel?.commission || 15"
			@add-to-cart="handleAddToCartFromModal"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import HotelHeader from './HotelHeader.vue'
import RoomGalleryModal from './RoomGalleryModal.vue'
import PriceDetailModal from './PriceDetailModal.vue'
import { getImageUrl } from '@/utils/imageUrl'

const { locale } = useI18n()

// Modal states
const showRoomGallery = ref(false)
const selectedRoomType = ref(null)
const showPriceDetail = ref(false)
const selectedPriceOption = ref(null)
const selectedPriceRoomType = ref(null)

const openRoomGallery = (roomType) => {
	selectedRoomType.value = roomType
	showRoomGallery.value = true
}

const openPriceDetail = (roomType, option) => {
	selectedPriceRoomType.value = roomType
	selectedPriceOption.value = option
	showPriceDetail.value = true
}

const props = defineProps({
	hotel: {
		type: Object,
		default: null
	},
	rooms: {
		type: Array,
		default: () => []
	},
	loading: {
		type: Boolean,
		default: false
	},
	searchInfo: {
		type: Object,
		default: null
	}
})

const emit = defineEmits(['add-to-cart'])

// getImageUrl imported from @/utils/imageUrl

// Get room image
const getRoomImage = (room) => {
	if (!room.roomType?.images || room.roomType.images.length === 0) return null
	const main = room.roomType.images.find(img => img.isMain)
	return main?.url || room.roomType.images[0]?.url || null
}

// Get localized name
const getLocalizedName = (name) => {
	if (!name) return ''
	if (typeof name === 'object') {
		return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
	}
	return name
}

// Format price
const formatPrice = (price, currency = 'TRY') => {
	if (!price) return '-'
	return new Intl.NumberFormat('tr-TR', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(price)
}

// Get meal plan icon
const getMealPlanIcon = (code) => {
	const icons = {
		'RO': 'bed',
		'BB': 'free_breakfast',
		'HB': 'brunch_dining',
		'FB': 'restaurant',
		'AI': 'all_inclusive',
		'UAI': 'stars'
	}
	return icons[code?.toUpperCase()] || 'restaurant_menu'
}

// Handle add to cart (direct, without modal)
const handleAddToCart = (roomType, mealPlan, option) => {
	emit('add-to-cart', roomType, mealPlan, option)
}

// Handle add to cart for non-refundable rate (direct click on red button)
const handleAddToCartNonRefundable = (roomType, mealPlan, option) => {
	const nonRefundableOption = {
		...option,
		rateType: 'non_refundable',
		isNonRefundable: true,
		nonRefundableDiscount: option.nonRefundable?.discountPercent || 0,
		finalPriceWithDiscount: option.nonRefundable?.pricing?.finalTotal
	}
	emit('add-to-cart', roomType, mealPlan, nonRefundableOption)
}

// Handle add to cart from price detail modal
const handleAddToCartFromModal = (data) => {
	// data contains: { roomType, mealPlan, option, rateType, isNonRefundable, nonRefundableDiscount, customDiscount, basePrice, finalTotal }
	const enhancedOption = {
		...data.option,
		rateType: data.rateType,
		isNonRefundable: data.isNonRefundable,
		nonRefundableDiscount: data.nonRefundableDiscount,
		customDiscount: data.customDiscount,
		basePrice: data.basePrice,
		finalPriceWithDiscount: data.finalTotal
	}
	emit('add-to-cart', data.roomType, data.mealPlan, enhancedOption)
}
</script>
