<template>
	<Teleport to="body">
		<transition name="modal-fade">
			<div
				v-if="modelValue"
				class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
				@click.self="close"
			>
				<!-- Backdrop -->
				<div class="absolute inset-0 bg-black/90" @click="close"></div>

				<!-- Modal Content -->
				<div class="relative w-full max-w-5xl max-h-[90vh] flex flex-col">
					<!-- Close Button -->
					<button
						@click="close"
						class="absolute -top-12 right-0 text-white/80 hover:text-white flex items-center gap-2 transition-colors"
					>
						<span>{{ $t('common.close') }}</span>
						<span class="material-icons">close</span>
					</button>

					<!-- Room Name -->
					<div class="text-center mb-4">
						<h2 class="text-2xl font-bold text-white">{{ getRoomName }}</h2>
						<p class="text-white/60 text-sm mt-1">
							{{ currentImageIndex + 1 }} / {{ images.length }}
						</p>
					</div>

					<!-- Main Image Container -->
					<div class="relative flex-1 min-h-0 flex items-center justify-center">
						<!-- Navigation Arrows -->
						<button
							v-if="images.length > 1"
							@click="prevImage"
							class="absolute left-4 z-10 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
						>
							<span class="material-icons text-3xl">chevron_left</span>
						</button>

						<!-- Current Image -->
						<div class="relative max-h-[60vh] flex items-center justify-center">
							<transition name="slide-fade" mode="out-in">
								<img
									:key="currentImageIndex"
									:src="getImageUrl(currentImage?.url || currentImage)"
									:alt="getRoomName"
									class="max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl"
								/>
							</transition>
						</div>

						<button
							v-if="images.length > 1"
							@click="nextImage"
							class="absolute right-4 z-10 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
						>
							<span class="material-icons text-3xl">chevron_right</span>
						</button>
					</div>

					<!-- Thumbnails -->
					<div v-if="images.length > 1" class="mt-4">
						<div class="flex justify-center gap-2 overflow-x-auto pb-2 px-4">
							<button
								v-for="(img, index) in images"
								:key="index"
								@click="currentImageIndex = index"
								:class="[
									'w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all',
									currentImageIndex === index
										? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105'
										: 'opacity-50 hover:opacity-75'
								]"
							>
								<img
									:src="getImageUrl(img.url || img)"
									:alt="`${getRoomName} - ${index + 1}`"
									class="w-full h-full object-cover"
								/>
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
	roomType: {
		type: Object,
		default: null
	}
})

const emit = defineEmits(['update:modelValue'])

const { locale } = useI18n()

// Image carousel state
const currentImageIndex = ref(0)

// getImageUrl imported from @/utils/imageUrl

// Get images array
const images = computed(() => {
	if (!props.roomType?.images) return []
	return props.roomType.images
})

// Current image
const currentImage = computed(() => {
	return images.value[currentImageIndex.value] || null
})

// Get room name
const getRoomName = computed(() => {
	if (!props.roomType?.name) return ''
	const name = props.roomType.name
	if (typeof name === 'object') {
		return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
	}
	return name
})

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
