<template>
	<div class="bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-3">
		<div class="flex items-center gap-3">
			<!-- Hotel Image -->
			<div class="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/20 ring-2 ring-white/30">
				<img
					v-if="mainImage"
					:src="getImageUrl(mainImage)"
					:alt="getHotelName"
					class="w-full h-full object-cover"
				>
				<div v-else class="w-full h-full flex items-center justify-center">
					<span class="material-icons text-white/60 text-xl">hotel</span>
				</div>
			</div>

			<!-- Hotel Info -->
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-1.5 mb-0.5">
					<h3 class="font-semibold text-white truncate text-sm">{{ getHotelName }}</h3>
					<div v-if="hotel.stars" class="flex items-center gap-0.5">
						<span
							v-for="n in hotel.stars"
							:key="n"
							class="material-icons text-yellow-300"
							style="font-size: 11px"
						>star</span>
					</div>
				</div>
				<p class="text-white/70 text-xs flex items-center gap-0.5">
					<span class="material-icons" style="font-size: 11px">location_on</span>
					{{ hotel.city }}
				</p>
			</div>

			<!-- Search Info -->
			<div v-if="searchInfo" class="flex items-center gap-2 text-xs text-white/80">
				<span class="flex items-center gap-1 bg-white/10 px-2 py-1 rounded">
					<span class="material-icons" style="font-size: 12px">calendar_today</span>
					{{ formatDate(searchInfo.checkIn) }} - {{ formatDate(searchInfo.checkOut) }}
				</span>
				<span class="flex items-center gap-1 bg-white/10 px-2 py-1 rounded">
					<span class="material-icons" style="font-size: 12px">people</span>
					{{ searchInfo.adults }}{{ searchInfo.children?.length ? '+' + searchInfo.children.length : '' }}
				</span>
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
	searchInfo: {
		type: Object,
		default: null
	}
})

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

// Format date
const formatDate = (date) => {
	if (!date) return ''
	return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
		day: 'numeric',
		month: 'short'
	})
}
</script>
