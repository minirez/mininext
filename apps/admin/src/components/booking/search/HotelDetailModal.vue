<template>
	<Teleport to="body">
		<transition name="modal-fade">
			<div
				v-if="modelValue"
				class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
				@click.self="close"
			>
				<!-- Backdrop -->
				<div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="close"></div>

				<!-- Modal Content -->
				<div class="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
					<!-- Close Button -->
					<button
						@click="close"
						class="absolute top-4 right-4 z-20 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
					>
						<span class="material-icons">close</span>
					</button>

					<!-- Image Carousel -->
					<div class="relative h-72 md:h-96 bg-gray-900 flex-shrink-0">
						<!-- Main Image -->
						<transition name="slide-fade" mode="out-in">
							<img
								v-if="currentImage"
								:key="currentImageIndex"
								:src="currentImage"
								:alt="getHotelName"
								class="w-full h-full object-cover"
							/>
							<div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
								<span class="material-icons text-7xl text-gray-500">hotel</span>
							</div>
						</transition>

						<!-- Image Navigation Arrows -->
						<template v-if="images.length > 1">
							<button
								@click="prevImage"
								class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
							>
								<span class="material-icons text-2xl">chevron_left</span>
							</button>
							<button
								@click="nextImage"
								class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
							>
								<span class="material-icons text-2xl">chevron_right</span>
							</button>
						</template>

						<!-- Image Counter -->
						<div v-if="images.length > 1" class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
							{{ currentImageIndex + 1 }} / {{ images.length }}
						</div>

						<!-- Thumbnail Strip -->
						<div v-if="images.length > 1" class="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
							<button
								v-for="(img, index) in images.slice(0, 6)"
								:key="index"
								@click="currentImageIndex = index"
								:class="[
									'w-14 h-10 rounded-lg overflow-hidden border-2 transition-all',
									currentImageIndex === index
										? 'border-white shadow-lg scale-110'
										: 'border-transparent opacity-70 hover:opacity-100'
								]"
							>
								<img :src="img" :alt="`Image ${index + 1}`" class="w-full h-full object-cover" />
							</button>
							<span
								v-if="images.length > 6"
								class="w-14 h-10 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-sm font-medium"
							>
								+{{ images.length - 6 }}
							</span>
						</div>

						<!-- Gradient Overlay -->
						<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>

						<!-- Hotel Name & Stars -->
						<div class="absolute top-4 left-4 right-16">
							<div class="flex items-center gap-2 mb-2">
								<div v-if="hotel?.stars" class="flex items-center gap-0.5 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
									<span
										v-for="n in hotel.stars"
										:key="n"
										class="material-icons text-yellow-400"
										style="font-size: 14px"
									>star</span>
								</div>
								<span v-if="hotel?.type" class="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
									{{ hotel.type }}
								</span>
							</div>
							<h2 class="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
								{{ getHotelName }}
							</h2>
							<p class="text-white/80 flex items-center gap-1 mt-1">
								<span class="material-icons text-sm">location_on</span>
								{{ hotel?.city }}
							</p>
						</div>
					</div>

					<!-- Content -->
					<div class="flex-1 overflow-y-auto p-6">
						<div class="grid md:grid-cols-2 gap-6">
							<!-- Left Column: Description & Features -->
							<div>
								<!-- Description -->
								<div v-if="getDescription" class="mb-6">
									<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
										<span class="material-icons text-purple-500">description</span>
										{{ $t('booking.hotelDescription') }}
									</h3>
									<p class="text-gray-600 dark:text-slate-300 leading-relaxed">
										{{ getDescription }}
									</p>
								</div>

								<!-- Amenities -->
								<div v-if="hotel?.amenities && hotel.amenities.length > 0">
									<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
										<span class="material-icons text-purple-500">spa</span>
										{{ $t('booking.amenities') }}
									</h3>
									<div class="grid grid-cols-2 gap-2">
										<div
											v-for="amenity in hotel.amenities"
											:key="amenity"
											class="flex items-center gap-2 text-gray-600 dark:text-slate-300"
										>
											<span class="material-icons text-green-500 text-lg">check_circle</span>
											<span class="text-sm">{{ amenity }}</span>
										</div>
									</div>
								</div>
							</div>

							<!-- Right Column: Contact & Policies -->
							<div>
								<!-- Contact Information -->
								<div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4">
									<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
										<span class="material-icons text-purple-500">contact_phone</span>
										{{ $t('booking.contactInfo') }}
									</h3>
									<div class="space-y-2">
										<div v-if="hotel?.contact?.phone" class="flex items-center gap-3 text-gray-600 dark:text-slate-300">
											<span class="material-icons text-gray-400">phone</span>
											<span>{{ hotel.contact.phone }}</span>
										</div>
										<div v-if="hotel?.contact?.email" class="flex items-center gap-3 text-gray-600 dark:text-slate-300">
											<span class="material-icons text-gray-400">email</span>
											<span>{{ hotel.contact.email }}</span>
										</div>
										<div v-if="hotel?.address" class="flex items-start gap-3 text-gray-600 dark:text-slate-300">
											<span class="material-icons text-gray-400 mt-0.5">location_on</span>
											<span>{{ hotel.address }}</span>
										</div>
									</div>
								</div>

								<!-- Policies Preview -->
								<div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
									<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
										<span class="material-icons text-blue-500">policy</span>
										{{ $t('booking.policies') }}
									</h3>
									<div class="space-y-2 text-sm">
										<div class="flex items-center justify-between text-gray-600 dark:text-slate-300">
											<span>{{ $t('booking.checkInTime') }}</span>
											<span class="font-medium">{{ hotel?.policies?.checkIn || '14:00' }}</span>
										</div>
										<div class="flex items-center justify-between text-gray-600 dark:text-slate-300">
											<span>{{ $t('booking.checkOutTime') }}</span>
											<span class="font-medium">{{ hotel?.policies?.checkOut || '12:00' }}</span>
										</div>
										<div v-if="hotel?.policies?.maxChildAge !== undefined" class="flex items-center justify-between text-gray-600 dark:text-slate-300">
											<span>{{ $t('booking.maxChildAge') }}</span>
											<span class="font-medium">{{ hotel.policies.maxChildAge }} {{ $t('booking.yearsOld') }}</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Footer Actions -->
					<div class="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
						<div class="flex items-center justify-between">
							<div>
								<span class="text-sm text-gray-500 dark:text-slate-400">{{ $t('booking.startingFrom') }}</span>
								<div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
									{{ formatPrice(hotel?.cheapestPrice) }} {{ hotel?.currency }}
								</div>
							</div>
							<button
								@click="selectHotel"
								class="btn-primary px-6 py-3 text-base font-medium"
							>
								<span class="material-icons mr-2">search</span>
								{{ $t('booking.viewAvailableRooms') }}
							</button>
						</div>
					</div>
				</div>
			</div>
		</transition>
	</Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getImageUrl } from '@/utils/imageUrl'

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false
	},
	hotel: {
		type: Object,
		default: null
	}
})

const emit = defineEmits(['update:modelValue', 'select'])

const { locale } = useI18n()

// Image carousel state
const currentImageIndex = ref(0)

// getImageUrl imported from @/utils/imageUrl

// Get images array (with proper URLs)
const images = computed(() => {
	if (!props.hotel) return []
	if (props.hotel.images && Array.isArray(props.hotel.images)) {
		return props.hotel.images.map(img => {
			const url = typeof img === 'string' ? img : img.url
			return url ? getImageUrl(url) : null
		}).filter(Boolean)
	}
	if (props.hotel.image) return [getImageUrl(props.hotel.image)]
	return []
})

// Current image
const currentImage = computed(() => {
	return images.value[currentImageIndex.value] || null
})

// Get localized hotel name
const getHotelName = computed(() => {
	if (!props.hotel?.name) return ''
	const name = props.hotel.name
	if (typeof name === 'object') {
		return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
	}
	return name
})

// Get localized description
const getDescription = computed(() => {
	if (!props.hotel?.description) return ''
	const desc = props.hotel.description
	if (typeof desc === 'object') {
		return desc[locale.value] || desc.en || desc.tr || Object.values(desc)[0] || ''
	}
	return desc
})

// Format price
const formatPrice = (price) => {
	if (!price) return '-'
	return new Intl.NumberFormat('tr-TR', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(price)
}

// Image navigation
const prevImage = () => {
	currentImageIndex.value = currentImageIndex.value > 0
		? currentImageIndex.value - 1
		: images.value.length - 1
}

const nextImage = () => {
	currentImageIndex.value = currentImageIndex.value < images.value.length - 1
		? currentImageIndex.value + 1
		: 0
}

// Close modal
const close = () => {
	emit('update:modelValue', false)
}

// Select hotel
const selectHotel = () => {
	emit('select', props.hotel)
	close()
}

// Reset image index when modal opens
watch(() => props.modelValue, (val) => {
	if (val) {
		currentImageIndex.value = 0
	}
})

// Handle keyboard navigation
const handleKeydown = (e) => {
	if (!props.modelValue) return
	if (e.key === 'Escape') close()
	if (e.key === 'ArrowLeft') prevImage()
	if (e.key === 'ArrowRight') nextImage()
}

// Add keyboard listener
if (typeof window !== 'undefined') {
	window.addEventListener('keydown', handleKeydown)
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
	transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
	opacity: 0;
}

.modal-fade-enter-from .relative,
.modal-fade-leave-to .relative {
	transform: scale(0.95);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
	transition: all 0.3s ease;
}

.slide-fade-enter-from {
	opacity: 0;
	transform: translateX(20px);
}

.slide-fade-leave-to {
	opacity: 0;
	transform: translateX(-20px);
}
</style>
