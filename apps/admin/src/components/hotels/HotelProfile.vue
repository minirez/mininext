<template>
  <div class="space-y-4">
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        {{ $t('hotels.profile.title') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400">
        {{ $t('hotels.profile.pageDescription') }}
      </p>
    </div>

    <!-- Overview Section -->
    <ProfileSection
      v-model:content="form.overview.content"
      :title="$t('hotels.profile.sections.overview')"
      icon="info"
      :features="[]"
      :selected-features="[]"
      :languages="languages"
      :default-open="true"
      :readonly="readonly"
    >
      <template #fields>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('hotels.profile.establishedYear') }}
            </label>
            <input
              v-model.number="form.overview.establishedYear"
              type="number"
              min="1800"
              :max="currentYear"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200"
              :placeholder="$t('hotels.profile.establishedYearPlaceholder')"
              :disabled="readonly"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('hotels.profile.renovationYear') }}
            </label>
            <input
              v-model.number="form.overview.renovationYear"
              type="number"
              min="1900"
              :max="currentYear"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200"
              :placeholder="$t('hotels.profile.renovationYearPlaceholder')"
              :disabled="readonly"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('hotels.profile.chainBrand') }}
            </label>
            <input
              v-model="form.overview.chainBrand"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200"
              :placeholder="$t('hotels.profile.chainBrandPlaceholder')"
              :disabled="readonly"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('hotels.profile.officialRating') }}
            </label>
            <input
              v-model="form.overview.officialRating"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200"
              :placeholder="$t('hotels.profile.officialRatingPlaceholder')"
              :disabled="readonly"
            />
          </div>
        </div>
      </template>
    </ProfileSection>

    <!-- Facilities Section -->
    <ProfileSection
      v-model:selected-features="form.facilities.features"
      v-model:content="form.facilities.content"
      :title="$t('hotels.profile.sections.facilities')"
      icon="apartment"
      :features="facilitiesFeatures"
      :languages="languages"
      :readonly="readonly"
    />

    <!-- Dining Section -->
    <ProfileSection
      v-model:selected-features="form.dining.features"
      v-model:content="form.dining.content"
      :title="$t('hotels.profile.sections.dining')"
      icon="restaurant"
      :features="diningFeatures"
      :languages="languages"
      :readonly="readonly"
    />

    <!-- Sports & Entertainment Section -->
    <ProfileSection
      v-model:selected-features="form.sportsEntertainment.features"
      v-model:content="form.sportsEntertainment.content"
      :title="$t('hotels.profile.sections.sportsEntertainment')"
      icon="sports_tennis"
      :features="sportsFeatures"
      :languages="languages"
      :readonly="readonly"
    />

    <!-- Spa & Wellness Section -->
    <ProfileSection
      v-model:selected-features="form.spaWellness.features"
      v-model:content="form.spaWellness.content"
      :title="$t('hotels.profile.sections.spaWellness')"
      icon="spa"
      :features="spaFeatures"
      :languages="languages"
      :readonly="readonly"
    >
      <template #fields>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('hotels.profile.spaArea') }}
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="form.spaWellness.spaDetails.area"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200"
                placeholder="0"
                :disabled="readonly"
              />
              <span class="text-gray-500 dark:text-slate-400">m2</span>
            </div>
          </div>
        </div>
      </template>
    </ProfileSection>

    <!-- Family & Kids Section -->
    <ProfileSection
      v-model:selected-features="form.familyKids.features"
      v-model:content="form.familyKids.content"
      :title="$t('hotels.profile.sections.familyKids')"
      icon="family_restroom"
      :features="familyFeatures"
      :languages="languages"
      :readonly="readonly"
    >
      <template #fields>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('hotels.profile.kidsClubAges') }}
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="form.familyKids.kidsClubAges.min"
                type="number"
                min="0"
                max="18"
                class="w-20 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200"
                placeholder="4"
                :disabled="readonly"
              />
              <span class="text-gray-500 dark:text-slate-400">-</span>
              <input
                v-model.number="form.familyKids.kidsClubAges.max"
                type="number"
                min="0"
                max="18"
                class="w-20 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200"
                placeholder="12"
                :disabled="readonly"
              />
              <span class="text-gray-500 dark:text-slate-400">{{
                $t('hotels.profile.years')
              }}</span>
            </div>
          </div>
        </div>
      </template>
    </ProfileSection>

    <!-- Beach & Pool Section -->
    <ProfileSection
      v-model:selected-features="form.beachPool.features"
      v-model:content="form.beachPool.content"
      :title="$t('hotels.profile.sections.beachPool')"
      icon="beach_access"
      :features="beachPoolFeatures"
      :languages="languages"
      :readonly="readonly"
    >
      <template #fields>
        <div class="space-y-4">
          <!-- Beach Details -->
          <div class="p-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
            <h5 class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
              {{ $t('hotels.profile.beachDetails') }}
            </h5>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                  $t('hotels.profile.beachDistance')
                }}</label>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="form.beachPool.beachDetails.distance"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200"
                    placeholder="0"
                    :disabled="readonly"
                  />
                  <span class="text-gray-500 dark:text-slate-400 text-sm">m</span>
                </div>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                  $t('hotels.profile.beachType')
                }}</label>
                <select
                  v-model="form.beachPool.beachDetails.type"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200"
                  :disabled="readonly"
                >
                  <option value="">{{ $t('common.select') }}</option>
                  <option value="sandy">{{ $t('hotels.profile.beachTypes.sandy') }}</option>
                  <option value="pebble">{{ $t('hotels.profile.beachTypes.pebble') }}</option>
                  <option value="platform">{{ $t('hotels.profile.beachTypes.platform') }}</option>
                  <option value="mixed">{{ $t('hotels.profile.beachTypes.mixed') }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                  $t('hotels.profile.beachLength')
                }}</label>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="form.beachPool.beachDetails.length"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200"
                    placeholder="0"
                    :disabled="readonly"
                  />
                  <span class="text-gray-500 dark:text-slate-400 text-sm">m</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </ProfileSection>

    <!-- Honeymoon Section -->
    <ProfileSection
      v-model:selected-features="form.honeymoon.features"
      v-model:content="form.honeymoon.content"
      :title="$t('hotels.profile.sections.honeymoon')"
      icon="favorite"
      :features="honeymoonFeatures"
      :languages="languages"
      :readonly="readonly"
    >
      <template #fields>
        <div class="flex items-center gap-2">
          <input
            v-model="form.honeymoon.available"
            type="checkbox"
            class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            :disabled="readonly"
          />
          <label class="text-sm text-gray-700 dark:text-slate-300">
            {{ $t('hotels.profile.honeymoonAvailable') }}
          </label>
        </div>
      </template>
    </ProfileSection>

    <!-- Important Info Section -->
    <ProfileSection
      v-model:content="form.importantInfo.content"
      :title="$t('hotels.profile.sections.importantInfo')"
      icon="warning"
      :features="[]"
      :selected-features="[]"
      :languages="languages"
      :readonly="readonly"
    />

    <!-- Location Section -->
    <ProfileSection
      v-model:content="form.location.content"
      :title="$t('hotels.profile.sections.location')"
      icon="location_on"
      :features="[]"
      :selected-features="[]"
      :languages="languages"
      :readonly="readonly"
    >
      <template #fields>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h5 class="text-sm font-medium text-gray-700 dark:text-slate-300">
              {{ $t('hotels.profile.distances') }}
            </h5>
            <button
              v-if="!readonly"
              type="button"
              class="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
              @click="addDistance"
            >
              <span class="material-icons text-sm">add</span>
              {{ $t('common.add') }}
            </button>
          </div>
          <div v-if="form.location.distances.length > 0" class="space-y-2">
            <div
              v-for="(distance, index) in form.location.distances"
              :key="index"
              class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg"
            >
              <input
                v-model="distance.place"
                type="text"
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200"
                :placeholder="$t('hotels.profile.placeName')"
                :disabled="readonly"
              />
              <input
                v-model.number="distance.distance"
                type="number"
                min="0"
                class="w-24 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200"
                placeholder="0"
                :disabled="readonly"
              />
              <select
                v-model="distance.unit"
                class="w-20 px-2 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200"
                :disabled="readonly"
              >
                <option value="m">m</option>
                <option value="km">km</option>
              </select>
              <button
                v-if="!readonly"
                type="button"
                class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                @click="removeDistance(index)"
              >
                <span class="material-icons text-sm">delete</span>
              </button>
            </div>
          </div>
          <p v-else class="text-sm text-gray-500 dark:text-slate-400 italic">
            {{ $t('hotels.profile.noDistances') }}
          </p>
        </div>
      </template>
    </ProfileSection>
  </div>
</template>

<script setup>
import { computed, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import ProfileSection from './profile/ProfileSection.vue'

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
const currentYear = new Date().getFullYear()

// Supported languages
const languages = [
  'tr',
  'en',
  'de',
  'ru',
  'es',
  'el',
  'it',
  'fr',
  'ro',
  'bg',
  'pt',
  'da',
  'zh',
  'ar',
  'fa',
  'he',
  'sq',
  'uk',
  'pl',
  'az'
]

// Helper to create empty multilingual object
const createMultiLangObject = () => {
  const obj = {}
  languages.forEach(lang => {
    obj[lang] = ''
  })
  return obj
}

// Form state
const form = reactive({
  overview: {
    content: createMultiLangObject(),
    establishedYear: null,
    renovationYear: null,
    chainBrand: '',
    officialRating: ''
  },
  facilities: {
    content: createMultiLangObject(),
    features: []
  },
  dining: {
    content: createMultiLangObject(),
    features: []
  },
  sportsEntertainment: {
    content: createMultiLangObject(),
    features: []
  },
  spaWellness: {
    content: createMultiLangObject(),
    features: [],
    spaDetails: {
      area: null
    }
  },
  familyKids: {
    content: createMultiLangObject(),
    features: [],
    kidsClubAges: { min: null, max: null }
  },
  beachPool: {
    content: createMultiLangObject(),
    features: [],
    beachDetails: {
      distance: null,
      type: '',
      length: null
    }
  },
  honeymoon: {
    content: createMultiLangObject(),
    features: [],
    available: false
  },
  importantInfo: {
    content: createMultiLangObject()
  },
  location: {
    content: createMultiLangObject(),
    distances: []
  }
})

// Feature options for each section
const facilitiesFeatures = computed(() => [
  { value: 'wifi', label: t('hotels.profile.features.wifi') },
  { value: 'freeWifi', label: t('hotels.profile.features.freeWifi') },
  { value: 'parking', label: t('hotels.profile.features.parking') },
  { value: 'freeParking', label: t('hotels.profile.features.freeParking') },
  { value: 'valetParking', label: t('hotels.profile.features.valetParking') },
  { value: 'reception24h', label: t('hotels.profile.features.reception24h') },
  { value: 'concierge', label: t('hotels.profile.features.concierge') },
  { value: 'luggageStorage', label: t('hotels.profile.features.luggageStorage') },
  { value: 'elevator', label: t('hotels.profile.features.elevator') },
  { value: 'airConditioning', label: t('hotels.profile.features.airConditioning') },
  { value: 'heating', label: t('hotels.profile.features.heating') },
  { value: 'laundry', label: t('hotels.profile.features.laundry') },
  { value: 'dryCleaning', label: t('hotels.profile.features.dryCleaning') },
  { value: 'currencyExchange', label: t('hotels.profile.features.currencyExchange') },
  { value: 'atm', label: t('hotels.profile.features.atm') },
  { value: 'safe', label: t('hotels.profile.features.safe') },
  { value: 'giftShop', label: t('hotels.profile.features.giftShop') },
  { value: 'hairdresser', label: t('hotels.profile.features.hairdresser') },
  { value: 'carRental', label: t('hotels.profile.features.carRental') },
  { value: 'airportShuttle', label: t('hotels.profile.features.airportShuttle') },
  { value: 'disabledAccess', label: t('hotels.profile.features.disabledAccess') }
])

const diningFeatures = computed(() => [
  { value: 'mainRestaurant', label: t('hotels.profile.features.mainRestaurant') },
  { value: 'alacarteRestaurant', label: t('hotels.profile.features.alacarteRestaurant') },
  { value: 'buffetRestaurant', label: t('hotels.profile.features.buffetRestaurant') },
  { value: 'snackBar', label: t('hotels.profile.features.snackBar') },
  { value: 'poolBar', label: t('hotels.profile.features.poolBar') },
  { value: 'beachBar', label: t('hotels.profile.features.beachBar') },
  { value: 'lobbyBar', label: t('hotels.profile.features.lobbyBar') },
  { value: 'nightclub', label: t('hotels.profile.features.nightclub') },
  { value: 'patisserie', label: t('hotels.profile.features.patisserie') },
  { value: 'iceCream', label: t('hotels.profile.features.iceCream') },
  { value: 'roomService', label: t('hotels.profile.features.roomService') },
  { value: 'roomService24h', label: t('hotels.profile.features.roomService24h') },
  { value: 'minibar', label: t('hotels.profile.features.minibar') },
  { value: 'dietMenu', label: t('hotels.profile.features.dietMenu') },
  { value: 'veganOptions', label: t('hotels.profile.features.veganOptions') }
])

const sportsFeatures = computed(() => [
  { value: 'fitness', label: t('hotels.profile.features.fitness') },
  { value: 'aerobics', label: t('hotels.profile.features.aerobics') },
  { value: 'yoga', label: t('hotels.profile.features.yoga') },
  { value: 'tennis', label: t('hotels.profile.features.tennis') },
  { value: 'tableTennis', label: t('hotels.profile.features.tableTennis') },
  { value: 'basketball', label: t('hotels.profile.features.basketball') },
  { value: 'volleyball', label: t('hotels.profile.features.volleyball') },
  { value: 'beachVolleyball', label: t('hotels.profile.features.beachVolleyball') },
  { value: 'football', label: t('hotels.profile.features.football') },
  { value: 'golf', label: t('hotels.profile.features.golf') },
  { value: 'miniGolf', label: t('hotels.profile.features.miniGolf') },
  { value: 'bowling', label: t('hotels.profile.features.bowling') },
  { value: 'billiards', label: t('hotels.profile.features.billiards') },
  { value: 'darts', label: t('hotels.profile.features.darts') },
  { value: 'waterSports', label: t('hotels.profile.features.waterSports') },
  { value: 'diving', label: t('hotels.profile.features.diving') },
  { value: 'snorkeling', label: t('hotels.profile.features.snorkeling') },
  { value: 'jetski', label: t('hotels.profile.features.jetski') },
  { value: 'parasailing', label: t('hotels.profile.features.parasailing') },
  { value: 'animation', label: t('hotels.profile.features.animation') },
  { value: 'liveMusic', label: t('hotels.profile.features.liveMusic') },
  { value: 'disco', label: t('hotels.profile.features.disco') },
  { value: 'cinema', label: t('hotels.profile.features.cinema') },
  { value: 'gameRoom', label: t('hotels.profile.features.gameRoom') }
])

const spaFeatures = computed(() => [
  { value: 'spa', label: t('hotels.profile.features.spa') },
  { value: 'hammam', label: t('hotels.profile.features.hammam') },
  { value: 'sauna', label: t('hotels.profile.features.sauna') },
  { value: 'steamRoom', label: t('hotels.profile.features.steamRoom') },
  { value: 'jacuzzi', label: t('hotels.profile.features.jacuzzi') },
  { value: 'massage', label: t('hotels.profile.features.massage') },
  { value: 'thaiMassage', label: t('hotels.profile.features.thaiMassage') },
  { value: 'aromatherapy', label: t('hotels.profile.features.aromatherapy') },
  { value: 'beautyCenter', label: t('hotels.profile.features.beautyCenter') },
  { value: 'manicure', label: t('hotels.profile.features.manicure') },
  { value: 'pedicure', label: t('hotels.profile.features.pedicure') },
  { value: 'skinCare', label: t('hotels.profile.features.skinCare') }
])

const familyFeatures = computed(() => [
  { value: 'kidsClub', label: t('hotels.profile.features.kidsClub') },
  { value: 'miniClub', label: t('hotels.profile.features.miniClub') },
  { value: 'teenClub', label: t('hotels.profile.features.teenClub') },
  { value: 'playground', label: t('hotels.profile.features.playground') },
  { value: 'babyPool', label: t('hotels.profile.features.babyPool') },
  { value: 'kidsPool', label: t('hotels.profile.features.kidsPool') },
  { value: 'waterSlides', label: t('hotels.profile.features.waterSlides') },
  { value: 'aquapark', label: t('hotels.profile.features.aquapark') },
  { value: 'babysitting', label: t('hotels.profile.features.babysitting') },
  { value: 'babyEquipment', label: t('hotels.profile.features.babyEquipment') },
  { value: 'highChair', label: t('hotels.profile.features.highChair') },
  { value: 'babyCot', label: t('hotels.profile.features.babyCot') },
  { value: 'kidsMenu', label: t('hotels.profile.features.kidsMenu') },
  { value: 'kidsAnimation', label: t('hotels.profile.features.kidsAnimation') },
  { value: 'miniDisco', label: t('hotels.profile.features.miniDisco') }
])

const beachPoolFeatures = computed(() => [
  { value: 'privateBeach', label: t('hotels.profile.features.privateBeach') },
  { value: 'publicBeach', label: t('hotels.profile.features.publicBeach') },
  { value: 'sandyBeach', label: t('hotels.profile.features.sandyBeach') },
  { value: 'pebbleBeach', label: t('hotels.profile.features.pebbleBeach') },
  { value: 'beachPlatform', label: t('hotels.profile.features.beachPlatform') },
  { value: 'pier', label: t('hotels.profile.features.pier') },
  { value: 'sunbeds', label: t('hotels.profile.features.sunbeds') },
  { value: 'beachTowels', label: t('hotels.profile.features.beachTowels') },
  { value: 'outdoorPool', label: t('hotels.profile.features.outdoorPool') },
  { value: 'indoorPool', label: t('hotels.profile.features.indoorPool') },
  { value: 'heatedPool', label: t('hotels.profile.features.heatedPool') },
  { value: 'infinityPool', label: t('hotels.profile.features.infinityPool') },
  { value: 'wavePool', label: t('hotels.profile.features.wavePool') }
])

const honeymoonFeatures = computed(() => [
  { value: 'romanticRoomDecoration', label: t('hotels.profile.features.romanticRoomDecoration') },
  { value: 'honeymoonSuite', label: t('hotels.profile.features.honeymoonSuite') },
  { value: 'champagne', label: t('hotels.profile.features.champagne') },
  { value: 'fruitBasket', label: t('hotels.profile.features.fruitBasket') },
  { value: 'romanticDinner', label: t('hotels.profile.features.romanticDinner') },
  { value: 'privateDining', label: t('hotels.profile.features.privateDining') },
  { value: 'couplesSpa', label: t('hotels.profile.features.couplesSpa') },
  { value: 'sunsetCruise', label: t('hotels.profile.features.sunsetCruise') },
  { value: 'specialTurndown', label: t('hotels.profile.features.specialTurndown') }
])

// Distance management
const addDistance = () => {
  form.location.distances.push({
    place: '',
    distance: null,
    unit: 'km'
  })
}

const removeDistance = index => {
  form.location.distances.splice(index, 1)
}

// Watch for hotel changes and populate form
watch(
  () => props.hotel,
  newHotel => {
    if (newHotel?.profile) {
      const profile = newHotel.profile

      // Overview
      if (profile.overview) {
        form.overview.content = { ...createMultiLangObject(), ...profile.overview.content }
        form.overview.establishedYear = profile.overview.establishedYear || null
        form.overview.renovationYear = profile.overview.renovationYear || null
        form.overview.chainBrand = profile.overview.chainBrand || ''
        form.overview.officialRating = profile.overview.officialRating || ''
      }

      // Facilities
      if (profile.facilities) {
        form.facilities.content = { ...createMultiLangObject(), ...profile.facilities.content }
        form.facilities.features = profile.facilities.features || []
      }

      // Dining
      if (profile.dining) {
        form.dining.content = { ...createMultiLangObject(), ...profile.dining.content }
        form.dining.features = profile.dining.features || []
      }

      // Sports & Entertainment
      if (profile.sportsEntertainment) {
        form.sportsEntertainment.content = {
          ...createMultiLangObject(),
          ...profile.sportsEntertainment.content
        }
        form.sportsEntertainment.features = profile.sportsEntertainment.features || []
      }

      // Spa & Wellness
      if (profile.spaWellness) {
        form.spaWellness.content = { ...createMultiLangObject(), ...profile.spaWellness.content }
        form.spaWellness.features = profile.spaWellness.features || []
        form.spaWellness.spaDetails = { area: null, ...profile.spaWellness.spaDetails }
      }

      // Family & Kids
      if (profile.familyKids) {
        form.familyKids.content = { ...createMultiLangObject(), ...profile.familyKids.content }
        form.familyKids.features = profile.familyKids.features || []
        form.familyKids.kidsClubAges = { min: null, max: null, ...profile.familyKids.kidsClubAges }
      }

      // Beach & Pool
      if (profile.beachPool) {
        form.beachPool.content = { ...createMultiLangObject(), ...profile.beachPool.content }
        form.beachPool.features = profile.beachPool.features || []
        form.beachPool.beachDetails = {
          distance: null,
          type: '',
          length: null,
          ...profile.beachPool.beachDetails
        }
      }

      // Honeymoon
      if (profile.honeymoon) {
        form.honeymoon.content = { ...createMultiLangObject(), ...profile.honeymoon.content }
        form.honeymoon.features = profile.honeymoon.features || []
        form.honeymoon.available = profile.honeymoon.available || false
      }

      // Important Info
      if (profile.importantInfo) {
        form.importantInfo.content = {
          ...createMultiLangObject(),
          ...profile.importantInfo.content
        }
      }

      // Location
      if (profile.location) {
        form.location.content = { ...createMultiLangObject(), ...profile.location.content }
        form.location.distances = profile.location.distances || []
      }
    }
  },
  { immediate: true, deep: true }
)

// Validate all fields
const validateAll = () => true

// Get current form data
const getFormData = () => {
  return { profile: form }
}

// Expose methods for parent component
defineExpose({
  validateAll,
  getFormData
})
</script>
