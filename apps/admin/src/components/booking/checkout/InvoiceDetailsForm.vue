<template>
	<div class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
		<h3 class="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-4 flex items-center">
			<span class="material-icons mr-2 text-purple-500">receipt_long</span>
			{{ $t('booking.invoiceDetails.title') }}
			<span class="text-red-500 ml-1">*</span>
		</h3>

		<!-- Invoice Type Selection -->
		<div class="mb-6">
			<label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
				{{ $t('booking.invoiceDetails.invoiceType') }} <span class="text-red-500">*</span>
			</label>
			<div class="flex gap-4">
				<label
					class="flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-colors"
					:class="[
						invoiceDetails.type === 'individual'
							? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
							: 'border-gray-200 dark:border-slate-600 hover:border-purple-300',
						showValidation && !invoiceDetails.type ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''
					]"
				>
					<input
						type="radio"
						name="invoiceType"
						value="individual"
						:checked="invoiceDetails.type === 'individual'"
						@change="updateType('individual')"
						class="sr-only"
					>
					<span class="material-icons mr-2" :class="invoiceDetails.type === 'individual' ? 'text-purple-600' : 'text-gray-400'">person</span>
					<span :class="invoiceDetails.type === 'individual' ? 'text-purple-700 dark:text-purple-300 font-medium' : 'text-gray-600 dark:text-slate-400'">
						{{ $t('booking.invoiceDetails.individual') }}
					</span>
				</label>

				<label
					class="flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-colors"
					:class="[
						invoiceDetails.type === 'corporate'
							? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
							: 'border-gray-200 dark:border-slate-600 hover:border-purple-300',
						showValidation && !invoiceDetails.type ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''
					]"
				>
					<input
						type="radio"
						name="invoiceType"
						value="corporate"
						:checked="invoiceDetails.type === 'corporate'"
						@change="updateType('corporate')"
						class="sr-only"
					>
					<span class="material-icons mr-2" :class="invoiceDetails.type === 'corporate' ? 'text-purple-600' : 'text-gray-400'">business</span>
					<span :class="invoiceDetails.type === 'corporate' ? 'text-purple-700 dark:text-purple-300 font-medium' : 'text-gray-600 dark:text-slate-400'">
						{{ $t('booking.invoiceDetails.corporate') }}
					</span>
				</label>
			</div>
			<p v-if="showValidation && !invoiceDetails.type" class="text-red-500 text-xs mt-2">{{ $t('validation.required') }}</p>
		</div>

		<!-- Individual Invoice Fields -->
		<div v-if="invoiceDetails.type === 'individual'" class="space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- First Name -->
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
						{{ $t('booking.invoiceDetails.firstName') }} <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						:value="invoiceDetails.individual?.firstName"
						@input="updateIndividual('firstName', $event.target.value)"
						class="form-input w-full transition-colors"
						:class="getFieldClass('individual', 'firstName')"
						:placeholder="$t('booking.invoiceDetails.firstNamePlaceholder')"
						autocomplete="off"
					>
					<p v-if="showValidation && !invoiceDetails.individual?.firstName" class="text-red-500 text-xs mt-1">{{ $t('validation.required') }}</p>
				</div>

				<!-- Last Name -->
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
						{{ $t('booking.invoiceDetails.lastName') }} <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						:value="invoiceDetails.individual?.lastName"
						@input="updateIndividual('lastName', $event.target.value)"
						class="form-input w-full transition-colors"
						:class="getFieldClass('individual', 'lastName')"
						:placeholder="$t('booking.invoiceDetails.lastNamePlaceholder')"
						autocomplete="off"
					>
					<p v-if="showValidation && !invoiceDetails.individual?.lastName" class="text-red-500 text-xs mt-1">{{ $t('validation.required') }}</p>
				</div>
			</div>

			<!-- TC Number (for Turkish citizens) -->
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
					{{ $t('booking.invoiceDetails.tcNumber') }}
					<span v-if="!isTurkishCitizen" class="text-gray-400 text-xs">({{ $t('booking.invoiceDetails.trCitizensOnly') }})</span>
				</label>
				<input
					type="text"
					:value="invoiceDetails.individual?.tcNumber"
					@input="updateIndividual('tcNumber', formatTcNumber($event.target.value))"
					class="form-input w-full transition-colors"
					:class="isTurkishCitizen ? getFieldClass('individual', 'tcNumber') : ''"
					:placeholder="$t('booking.invoiceDetails.tcNumberPlaceholder')"
					maxlength="11"
					inputmode="numeric"
					autocomplete="off"
				>
				<p v-if="showValidation && invoiceDetails.individual?.tcNumber && !isValidTcNumber(invoiceDetails.individual?.tcNumber)" class="text-red-500 text-xs mt-1">{{ $t('validation.invalidTcNumber') }}</p>
			</div>

			<!-- Address -->
			<div class="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
				<h4 class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
					{{ $t('booking.invoiceDetails.address') }}
				</h4>
				<div class="space-y-4">
					<div>
						<input
							type="text"
							:value="invoiceDetails.individual?.address?.street"
							@input="updateIndividualAddress('street', $event.target.value)"
							class="form-input w-full"
							:placeholder="$t('booking.invoiceDetails.streetPlaceholder')"
							autocomplete="off"
						>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<input
							type="text"
							:value="invoiceDetails.individual?.address?.district"
							@input="updateIndividualAddress('district', $event.target.value)"
							class="form-input w-full"
							:placeholder="$t('booking.invoiceDetails.district')"
							autocomplete="off"
						>
						<input
							type="text"
							:value="invoiceDetails.individual?.address?.city"
							@input="updateIndividualAddress('city', $event.target.value)"
							class="form-input w-full"
							:placeholder="$t('booking.invoiceDetails.city')"
							autocomplete="off"
						>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<input
							type="text"
							:value="invoiceDetails.individual?.address?.postalCode"
							@input="updateIndividualAddress('postalCode', $event.target.value)"
							class="form-input w-full"
							:placeholder="$t('booking.invoiceDetails.postalCode')"
							autocomplete="off"
						>
						<input
							type="text"
							:value="invoiceDetails.individual?.address?.country || 'TR'"
							@input="updateIndividualAddress('country', $event.target.value)"
							class="form-input w-full"
							:placeholder="$t('booking.invoiceDetails.country')"
							autocomplete="off"
						>
					</div>
				</div>
			</div>
		</div>

		<!-- Corporate Invoice Fields -->
		<div v-if="invoiceDetails.type === 'corporate'" class="space-y-4">
			<!-- Company Name -->
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
					{{ $t('booking.invoiceDetails.companyName') }} <span class="text-red-500">*</span>
				</label>
				<input
					type="text"
					:value="invoiceDetails.corporate?.companyName"
					@input="updateCorporate('companyName', $event.target.value)"
					class="form-input w-full transition-colors"
					:class="getFieldClass('corporate', 'companyName')"
					:placeholder="$t('booking.invoiceDetails.companyNamePlaceholder')"
					autocomplete="off"
				>
				<p v-if="showValidation && !invoiceDetails.corporate?.companyName" class="text-red-500 text-xs mt-1">{{ $t('validation.required') }}</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Tax Number -->
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
						{{ $t('booking.invoiceDetails.taxNumber') }} <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						:value="invoiceDetails.corporate?.taxNumber"
						@input="updateCorporate('taxNumber', $event.target.value)"
						class="form-input w-full transition-colors"
						:class="getFieldClass('corporate', 'taxNumber')"
						:placeholder="$t('booking.invoiceDetails.taxNumberPlaceholder')"
						autocomplete="off"
					>
					<p v-if="showValidation && !invoiceDetails.corporate?.taxNumber" class="text-red-500 text-xs mt-1">{{ $t('validation.required') }}</p>
				</div>

				<!-- Tax Office -->
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
						{{ $t('booking.invoiceDetails.taxOffice') }} <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						:value="invoiceDetails.corporate?.taxOffice"
						@input="updateCorporate('taxOffice', $event.target.value)"
						class="form-input w-full transition-colors"
						:class="getFieldClass('corporate', 'taxOffice')"
						:placeholder="$t('booking.invoiceDetails.taxOfficePlaceholder')"
						autocomplete="off"
					>
					<p v-if="showValidation && !invoiceDetails.corporate?.taxOffice" class="text-red-500 text-xs mt-1">{{ $t('validation.required') }}</p>
				</div>
			</div>

			<!-- Address -->
			<div class="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
				<h4 class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
					{{ $t('booking.invoiceDetails.address') }}
				</h4>
				<div class="space-y-4">
					<div>
						<input
							type="text"
							:value="invoiceDetails.corporate?.address?.street"
							@input="updateCorporateAddress('street', $event.target.value)"
							class="form-input w-full"
							:placeholder="$t('booking.invoiceDetails.streetPlaceholder')"
							autocomplete="off"
						>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<input
							type="text"
							:value="invoiceDetails.corporate?.address?.district"
							@input="updateCorporateAddress('district', $event.target.value)"
							class="form-input w-full"
							:placeholder="$t('booking.invoiceDetails.district')"
							autocomplete="off"
						>
						<input
							type="text"
							:value="invoiceDetails.corporate?.address?.city"
							@input="updateCorporateAddress('city', $event.target.value)"
							class="form-input w-full"
							:placeholder="$t('booking.invoiceDetails.city')"
							autocomplete="off"
						>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<input
							type="text"
							:value="invoiceDetails.corporate?.address?.postalCode"
							@input="updateCorporateAddress('postalCode', $event.target.value)"
							class="form-input w-full"
							:placeholder="$t('booking.invoiceDetails.postalCode')"
							autocomplete="off"
						>
						<input
							type="text"
							:value="invoiceDetails.corporate?.address?.country || 'TR'"
							@input="updateCorporateAddress('country', $event.target.value)"
							class="form-input w-full"
							:placeholder="$t('booking.invoiceDetails.country')"
							autocomplete="off"
						>
					</div>
				</div>
			</div>
		</div>

		<!-- No Type Selected -->
		<div v-if="!invoiceDetails.type && showValidation" class="text-center py-4 text-red-500">
			<span class="material-icons text-3xl mb-2">warning</span>
			<p>{{ $t('booking.invoiceDetails.selectType') }}</p>
		</div>
		<div v-else-if="!invoiceDetails.type" class="text-center py-4 text-gray-500 dark:text-slate-400">
			<span class="material-icons text-3xl mb-2">info</span>
			<p>{{ $t('booking.invoiceDetails.selectType') }}</p>
		</div>
	</div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useBookingStore } from '@/stores/booking'

const props = defineProps({
	invoiceDetails: {
		type: Object,
		required: true
	},
	showValidation: {
		type: Boolean,
		default: false
	},
	leadGuest: {
		type: Object,
		default: () => ({})
	}
})

const emit = defineEmits(['update'])

const bookingStore = useBookingStore()

// Auto-fill lead guest info when individual invoice is selected
watch(() => props.invoiceDetails.type, (newType, oldType) => {
	if (newType === 'individual' && !oldType) {
		// First time selecting individual - auto-fill from lead guest
		const lead = props.leadGuest || bookingStore.guests.leadGuest
		if (lead && (lead.firstName || lead.lastName)) {
			emit('update', {
				...props.invoiceDetails,
				type: 'individual',
				individual: {
					...props.invoiceDetails.individual,
					firstName: lead.firstName || '',
					lastName: lead.lastName || '',
					tcNumber: lead.tcNumber || ''
				}
			})
		}
	}
})

// Check if lead guest is Turkish citizen
const isTurkishCitizen = computed(() => {
	return bookingStore.guests.leadGuest?.nationality === 'TR'
})

// Get field validation class
const getFieldClass = (type, field) => {
	if (!props.showValidation) return ''

	const data = type === 'individual' ? props.invoiceDetails.individual : props.invoiceDetails.corporate
	const value = data?.[field]

	// Required fields
	const requiredIndividual = ['firstName', 'lastName']
	const requiredCorporate = ['companyName', 'taxNumber', 'taxOffice']
	// TC Number is optional - only validate format if provided

	const requiredFields = type === 'individual' ? requiredIndividual : requiredCorporate

	if (requiredFields.includes(field)) {
		if (!value || value.trim() === '') {
			return 'border-red-500 bg-red-50 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500'
		}

		// Special validation for TC number
		if (field === 'tcNumber' && !isValidTcNumber(value)) {
			return 'border-red-500 bg-red-50 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500'
		}

		return 'border-green-500 bg-green-50 dark:bg-green-900/10'
	}

	return ''
}

// Validate TC number (11 digits, starts with non-zero)
const isValidTcNumber = (tc) => {
	if (!tc || tc.length !== 11) return false
	if (!/^\d{11}$/.test(tc)) return false
	if (tc[0] === '0') return false

	// TC algorithm validation
	const digits = tc.split('').map(Number)
	const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8]
	const sum2 = digits[1] + digits[3] + digits[5] + digits[7]
	const check1 = (sum1 * 7 - sum2) % 10
	const check2 = (sum1 + sum2 + digits[9]) % 10

	return digits[9] === check1 && digits[10] === check2
}

// Format TC number (only digits)
const formatTcNumber = (value) => {
	return value.replace(/\D/g, '').slice(0, 11)
}

// Update invoice type
const updateType = (type) => {
	emit('update', {
		...props.invoiceDetails,
		type
	})
}

// Update individual field
const updateIndividual = (field, value) => {
	emit('update', {
		...props.invoiceDetails,
		individual: {
			...props.invoiceDetails.individual,
			[field]: value
		}
	})
}

// Update individual address field
const updateIndividualAddress = (field, value) => {
	emit('update', {
		...props.invoiceDetails,
		individual: {
			...props.invoiceDetails.individual,
			address: {
				...props.invoiceDetails.individual?.address,
				[field]: value
			}
		}
	})
}

// Update corporate field
const updateCorporate = (field, value) => {
	emit('update', {
		...props.invoiceDetails,
		corporate: {
			...props.invoiceDetails.corporate,
			[field]: value
		}
	})
}

// Update corporate address field
const updateCorporateAddress = (field, value) => {
	emit('update', {
		...props.invoiceDetails,
		corporate: {
			...props.invoiceDetails.corporate,
			address: {
				...props.invoiceDetails.corporate?.address,
				[field]: value
			}
		}
	})
}
</script>
