<template>
  <div class="space-y-8">
    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        {{ $t('hotels.amenities.title') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-6">
        {{ $t('hotels.amenities.description') }}
      </p>

      <!-- Selected count badge -->
      <div class="mb-6 flex items-center gap-4">
        <span
          class="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
        >
          {{ form.length }} {{ $t('common.selected') }}
        </span>
        <button
          v-if="form.length > 0 && !readonly"
          type="button"
          class="text-sm text-red-600 dark:text-red-400 hover:underline"
          @click="form = []"
        >
          {{ $t('common.clearAll') }}
        </button>
      </div>

      <!-- Categories -->
      <div class="space-y-8">
        <!-- General -->
        <div>
          <h4
            class="text-md font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2"
          >
            <span class="material-icons text-purple-600">settings</span>
            {{ $t('hotels.amenities.categories.general') }}
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <label
              v-for="amenity in generalAmenities"
              :key="amenity.id"
              class="flex items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg transition-colors"
              :class="[
                form.includes(amenity.id)
                  ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30'
                  : '',
                readonly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700'
              ]"
            >
              <input
                v-model="form"
                type="checkbox"
                :value="amenity.id"
                :disabled="readonly"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <span class="material-icons ml-2 text-gray-500 dark:text-slate-400 text-lg">{{
                amenity.icon
              }}</span>
              <span class="ml-2 text-sm text-gray-700 dark:text-slate-300">{{
                amenity.label
              }}</span>
            </label>
          </div>
        </div>

        <!-- Facilities -->
        <div>
          <h4
            class="text-md font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2"
          >
            <span class="material-icons text-blue-600">apartment</span>
            {{ $t('hotels.amenities.categories.facilities') }}
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <label
              v-for="amenity in facilityAmenities"
              :key="amenity.id"
              class="flex items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg transition-colors"
              :class="[
                form.includes(amenity.id)
                  ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30'
                  : '',
                readonly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700'
              ]"
            >
              <input
                v-model="form"
                type="checkbox"
                :value="amenity.id"
                :disabled="readonly"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <span class="material-icons ml-2 text-gray-500 dark:text-slate-400 text-lg">{{
                amenity.icon
              }}</span>
              <span class="ml-2 text-sm text-gray-700 dark:text-slate-300">{{
                amenity.label
              }}</span>
            </label>
          </div>
        </div>

        <!-- Dining -->
        <div>
          <h4
            class="text-md font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2"
          >
            <span class="material-icons text-orange-600">restaurant</span>
            {{ $t('hotels.amenities.categories.dining') }}
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <label
              v-for="amenity in diningAmenities"
              :key="amenity.id"
              class="flex items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg transition-colors"
              :class="[
                form.includes(amenity.id)
                  ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30'
                  : '',
                readonly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700'
              ]"
            >
              <input
                v-model="form"
                type="checkbox"
                :value="amenity.id"
                :disabled="readonly"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <span class="material-icons ml-2 text-gray-500 dark:text-slate-400 text-lg">{{
                amenity.icon
              }}</span>
              <span class="ml-2 text-sm text-gray-700 dark:text-slate-300">{{
                amenity.label
              }}</span>
            </label>
          </div>
        </div>

        <!-- Services -->
        <div>
          <h4
            class="text-md font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2"
          >
            <span class="material-icons text-green-600">support_agent</span>
            {{ $t('hotels.amenities.categories.services') }}
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <label
              v-for="amenity in serviceAmenities"
              :key="amenity.id"
              class="flex items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg transition-colors"
              :class="[
                form.includes(amenity.id)
                  ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30'
                  : '',
                readonly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700'
              ]"
            >
              <input
                v-model="form"
                type="checkbox"
                :value="amenity.id"
                :disabled="readonly"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <span class="material-icons ml-2 text-gray-500 dark:text-slate-400 text-lg">{{
                amenity.icon
              }}</span>
              <span class="ml-2 text-sm text-gray-700 dark:text-slate-300">{{
                amenity.label
              }}</span>
            </label>
          </div>
        </div>

        <!-- Business -->
        <div>
          <h4
            class="text-md font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2"
          >
            <span class="material-icons text-indigo-600">business_center</span>
            {{ $t('hotels.amenities.categories.business') }}
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <label
              v-for="amenity in businessAmenities"
              :key="amenity.id"
              class="flex items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg transition-colors"
              :class="[
                form.includes(amenity.id)
                  ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30'
                  : '',
                readonly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700'
              ]"
            >
              <input
                v-model="form"
                type="checkbox"
                :value="amenity.id"
                :disabled="readonly"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <span class="material-icons ml-2 text-gray-500 dark:text-slate-400 text-lg">{{
                amenity.icon
              }}</span>
              <span class="ml-2 text-sm text-gray-700 dark:text-slate-300">{{
                amenity.label
              }}</span>
            </label>
          </div>
        </div>

        <!-- Family -->
        <div>
          <h4
            class="text-md font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2"
          >
            <span class="material-icons text-pink-600">family_restroom</span>
            {{ $t('hotels.amenities.categories.family') }}
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <label
              v-for="amenity in familyAmenities"
              :key="amenity.id"
              class="flex items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg transition-colors"
              :class="[
                form.includes(amenity.id)
                  ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30'
                  : '',
                readonly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700'
              ]"
            >
              <input
                v-model="form"
                type="checkbox"
                :value="amenity.id"
                :disabled="readonly"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <span class="material-icons ml-2 text-gray-500 dark:text-slate-400 text-lg">{{
                amenity.icon
              }}</span>
              <span class="ml-2 text-sm text-gray-700 dark:text-slate-300">{{
                amenity.label
              }}</span>
            </label>
          </div>
        </div>

        <!-- Beach & Nature -->
        <div>
          <h4
            class="text-md font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2"
          >
            <span class="material-icons text-cyan-600">beach_access</span>
            {{ $t('hotels.amenities.categories.beachNature') }}
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <label
              v-for="amenity in beachAmenities"
              :key="amenity.id"
              class="flex items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              :class="{
                'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30': form.includes(
                  amenity.id
                )
              }"
            >
              <input
                v-model="form"
                type="checkbox"
                :value="amenity.id"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <span class="material-icons ml-2 text-gray-500 dark:text-slate-400 text-lg">{{
                amenity.icon
              }}</span>
              <span class="ml-2 text-sm text-gray-700 dark:text-slate-300">{{
                amenity.label
              }}</span>
            </label>
          </div>
        </div>

        <!-- Sports & Entertainment -->
        <div>
          <h4
            class="text-md font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2"
          >
            <span class="material-icons text-red-600">sports_tennis</span>
            {{ $t('hotels.amenities.categories.sports') }}
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <label
              v-for="amenity in sportsAmenities"
              :key="amenity.id"
              class="flex items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              :class="{
                'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30': form.includes(
                  amenity.id
                )
              }"
            >
              <input
                v-model="form"
                type="checkbox"
                :value="amenity.id"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <span class="material-icons ml-2 text-gray-500 dark:text-slate-400 text-lg">{{
                amenity.icon
              }}</span>
              <span class="ml-2 text-sm text-gray-700 dark:text-slate-300">{{
                amenity.label
              }}</span>
            </label>
          </div>
        </div>

        <!-- Accessibility & Policies -->
        <div>
          <h4
            class="text-md font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2"
          >
            <span class="material-icons text-teal-600">accessible</span>
            {{ $t('hotels.amenities.categories.accessibility') }}
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <label
              v-for="amenity in accessibilityAmenities"
              :key="amenity.id"
              class="flex items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              :class="{
                'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30': form.includes(
                  amenity.id
                )
              }"
            >
              <input
                v-model="form"
                type="checkbox"
                :value="amenity.id"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <span class="material-icons ml-2 text-gray-500 dark:text-slate-400 text-lg">{{
                amenity.icon
              }}</span>
              <span class="ml-2 text-sm text-gray-700 dark:text-slate-300">{{
                amenity.label
              }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  hotel: {
    type: Object,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const { t } = useI18n()

const form = ref([])

// General amenities
const generalAmenities = computed(() => [
  { id: 'wifi', icon: 'wifi', label: t('hotels.amenities.wifi') },
  { id: 'parking', icon: 'local_parking', label: t('hotels.amenities.parking') },
  { id: 'freeParking', icon: 'local_parking', label: t('hotels.amenities.freeParking') },
  { id: 'valetParking', icon: 'car_rental', label: t('hotels.amenities.valetParking') },
  { id: 'airConditioning', icon: 'ac_unit', label: t('hotels.amenities.airConditioning') },
  { id: 'heating', icon: 'whatshot', label: t('hotels.amenities.heating') }
])

// Facility amenities
const facilityAmenities = computed(() => [
  { id: 'pool', icon: 'pool', label: t('hotels.amenities.pool') },
  { id: 'indoorPool', icon: 'pool', label: t('hotels.amenities.indoorPool') },
  { id: 'outdoorPool', icon: 'pool', label: t('hotels.amenities.outdoorPool') },
  { id: 'spa', icon: 'spa', label: t('hotels.amenities.spa') },
  { id: 'gym', icon: 'fitness_center', label: t('hotels.amenities.gym') },
  { id: 'sauna', icon: 'hot_tub', label: t('hotels.amenities.sauna') },
  { id: 'hammam', icon: 'hot_tub', label: t('hotels.amenities.hammam') }
])

// Dining amenities
const diningAmenities = computed(() => [
  { id: 'restaurant', icon: 'restaurant', label: t('hotels.amenities.restaurant') },
  { id: 'bar', icon: 'local_bar', label: t('hotels.amenities.bar') },
  { id: 'roomService', icon: 'room_service', label: t('hotels.amenities.roomService') },
  { id: 'breakfast', icon: 'free_breakfast', label: t('hotels.amenities.breakfast') },
  { id: 'minibar', icon: 'kitchen', label: t('hotels.amenities.minibar') }
])

// Service amenities
const serviceAmenities = computed(() => [
  { id: 'reception24h', icon: 'support_agent', label: t('hotels.amenities.reception24h') },
  { id: 'concierge', icon: 'concierge', label: t('hotels.amenities.concierge') },
  { id: 'laundry', icon: 'local_laundry_service', label: t('hotels.amenities.laundry') },
  { id: 'dryCleaning', icon: 'dry_cleaning', label: t('hotels.amenities.dryCleaning') },
  { id: 'airportShuttle', icon: 'airport_shuttle', label: t('hotels.amenities.airportShuttle') },
  { id: 'carRental', icon: 'directions_car', label: t('hotels.amenities.carRental') },
  { id: 'tourDesk', icon: 'tour', label: t('hotels.amenities.tourDesk') },
  {
    id: 'currencyExchange',
    icon: 'currency_exchange',
    label: t('hotels.amenities.currencyExchange')
  },
  { id: 'atm', icon: 'atm', label: t('hotels.amenities.atm') },
  { id: 'luggageStorage', icon: 'luggage', label: t('hotels.amenities.luggageStorage') }
])

// Business amenities
const businessAmenities = computed(() => [
  { id: 'businessCenter', icon: 'business_center', label: t('hotels.amenities.businessCenter') },
  { id: 'meetingRooms', icon: 'meeting_room', label: t('hotels.amenities.meetingRooms') },
  { id: 'conferenceHall', icon: 'groups', label: t('hotels.amenities.conferenceHall') }
])

// Family amenities
const familyAmenities = computed(() => [
  { id: 'kidsClub', icon: 'child_care', label: t('hotels.amenities.kidsClub') },
  { id: 'playground', icon: 'toys', label: t('hotels.amenities.playground') },
  { id: 'babysitting', icon: 'baby_changing_station', label: t('hotels.amenities.babysitting') }
])

// Beach & Nature amenities
const beachAmenities = computed(() => [
  { id: 'beachAccess', icon: 'beach_access', label: t('hotels.amenities.beachAccess') },
  { id: 'privateBeach', icon: 'beach_access', label: t('hotels.amenities.privateBeach') },
  { id: 'garden', icon: 'yard', label: t('hotels.amenities.garden') },
  { id: 'terrace', icon: 'deck', label: t('hotels.amenities.terrace') }
])

// Sports & Entertainment amenities
const sportsAmenities = computed(() => [
  { id: 'tennis', icon: 'sports_tennis', label: t('hotels.amenities.tennis') },
  { id: 'golf', icon: 'golf_course', label: t('hotels.amenities.golf') },
  { id: 'diving', icon: 'scuba_diving', label: t('hotels.amenities.diving') },
  { id: 'waterSports', icon: 'surfing', label: t('hotels.amenities.waterSports') },
  { id: 'casino', icon: 'casino', label: t('hotels.amenities.casino') },
  { id: 'nightclub', icon: 'nightlife', label: t('hotels.amenities.nightclub') },
  { id: 'gameRoom', icon: 'sports_esports', label: t('hotels.amenities.gameRoom') }
])

// Accessibility & Policies amenities
const accessibilityAmenities = computed(() => [
  {
    id: 'wheelchairAccessible',
    icon: 'accessible',
    label: t('hotels.amenities.wheelchairAccessible')
  },
  { id: 'elevator', icon: 'elevator', label: t('hotels.amenities.elevator') },
  { id: 'petFriendly', icon: 'pets', label: t('hotels.amenities.petFriendly') },
  { id: 'smokingArea', icon: 'smoking_rooms', label: t('hotels.amenities.smokingArea') },
  { id: 'nonSmoking', icon: 'smoke_free', label: t('hotels.amenities.nonSmoking') }
])

// Watch for hotel changes and update form
watch(
  () => props.hotel,
  newHotel => {
    if (newHotel?.amenities) {
      form.value = [...newHotel.amenities]
    }
  },
  { immediate: true, deep: true }
)

// Validate all fields (no required fields in amenities)
const validateAll = () => true

// Get current form data
const getFormData = () => {
  return { amenities: form.value }
}

// Expose methods for parent component
defineExpose({
  validateAll,
  getFormData
})
</script>
