<template>
  <div class="space-y-6">
    <!-- Room Types Section -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ $t('planning.roomTypes.title') }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('planning.roomTypes.description') }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Show deleted toggle -->
          <button
            v-if="hasDeletedRoomTypes"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors"
            :class="
              showDeletedRooms
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'
            "
            @click="showDeletedRooms = !showDeletedRooms"
          >
            <span class="material-icons text-sm">{{
              showDeletedRooms ? 'visibility' : 'visibility_off'
            }}</span>
            {{ $t('planning.showDeleted') }}
          </button>
          <!-- Import from Base Hotel Button (only if hotel is linked to a base hotel) -->
          <button
            v-if="hotel.hotelBase"
            class="btn-secondary flex items-center gap-2"
            @click="showImportModal = true"
          >
            <span class="material-icons text-sm">download</span>
            {{ $t('planning.roomTemplates.importFromBase') }}
          </button>
          <button class="btn-primary flex items-center gap-2" @click="addNewRoomType">
            <span class="material-icons text-sm">add</span>
            {{ $t('planning.roomTypes.add') }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loadingRoomTypes" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Room Types List -->
      <div v-else-if="filteredRoomTypes.length > 0" class="grid gap-4">
        <div
          v-for="roomType in filteredRoomTypes"
          :key="roomType._id"
          class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 flex items-center gap-4"
          :class="roomType.status === 'deleted' ? 'opacity-50' : ''"
        >
          <!-- Base Room Star (only show if more than 1 room type) -->
          <button
            v-if="roomTypes.length > 1"
            class="flex-shrink-0 p-1"
            :class="
              roomType.isBaseRoom
                ? 'text-yellow-500'
                : 'text-gray-300 dark:text-slate-600 hover:text-yellow-400'
            "
            :title="
              roomType.isBaseRoom
                ? $t('planning.pricing.clickToRemoveBase')
                : $t('planning.pricing.setAsBase')
            "
            @click="toggleBaseRoom(roomType)"
          >
            <span class="material-icons text-xl">{{
              roomType.isBaseRoom ? 'star' : 'star_border'
            }}</span>
          </button>

          <div
            class="w-16 h-12 rounded bg-gray-200 dark:bg-slate-600 overflow-hidden flex-shrink-0"
          >
            <img
              v-if="roomType.images?.[0]?.url"
              :src="getImageUrl(roomType.images[0].url)"
              class="w-full h-full object-cover"
            />
            <span
              v-else
              class="material-icons text-2xl text-gray-400 dark:text-slate-500 flex items-center justify-center w-full h-full"
              >bed</span
            >
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-800 dark:text-white">
              {{ getRoomTypeName(roomType) }}
            </div>
            <div class="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-3">
              <span>{{ roomType.code }}</span>
              <span class="flex items-center gap-1">
                <span class="material-icons text-sm">person</span>
                {{ roomType.occupancy?.maxAdults ?? 2 }} +
                {{ roomType.occupancy?.maxChildren ?? 0 }}
              </span>
              <span
                class="px-2 py-0.5 rounded text-xs"
                :class="{
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                    roomType.status === 'active',
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
                    roomType.status === 'draft',
                  'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400':
                    roomType.status === 'inactive',
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':
                    roomType.status === 'deleted'
                }"
              >
                {{ $t(`common.status.${roomType.status}`) }}
              </span>
              <!-- Pricing Type Tag -->
              <span
                class="px-2 py-0.5 rounded text-xs font-medium"
                :class="getPricingTypeClass(roomType)"
                :title="getPricingTypeTooltip(roomType)"
              >
                {{ getPricingTypeLabel(roomType) }}
              </span>
            </div>
            <!-- Markets that have this room type active -->
            <div v-if="markets.length > 0" class="mt-1 flex items-center gap-1 flex-wrap">
              <span class="material-icons text-xs text-indigo-500">public</span>
              <span
                v-for="market in getMarketsForRoomType(roomType._id)"
                :key="market._id"
                class="px-1.5 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded"
              >
                {{ market.code }}
              </span>
            </div>
          </div>

          <!-- Price Adjustment (only show if a base room is selected) -->
          <div v-if="hasBaseRoom" class="flex items-center gap-2 flex-shrink-0">
            <template v-if="!roomType.isBaseRoom">
              <span class="text-xs text-gray-500 dark:text-slate-400"
                >{{ $t('planning.pricing.adjustment') }}:</span
              >
              <div class="flex items-center">
                <input
                  v-model.number="roomType.priceAdjustment"
                  type="number"
                  class="w-16 text-right text-sm px-2 py-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-white focus:ring-1 focus:ring-indigo-500"
                  :class="
                    roomType.priceAdjustment > 0
                      ? 'text-green-600 dark:text-green-400'
                      : roomType.priceAdjustment < 0
                        ? 'text-red-600 dark:text-red-400'
                        : ''
                  "
                  min="-100"
                  max="500"
                  step="5"
                  @blur="updateRoomTypeAdjustment(roomType)"
                />
                <span class="ml-1 text-sm text-gray-500 dark:text-slate-400">%</span>
              </div>
            </template>
            <span v-else class="text-xs text-yellow-600 dark:text-yellow-400 font-medium">{{
              $t('planning.pricing.baseRoom')
            }}</span>
          </div>

          <div class="flex items-center gap-1">
            <!-- Restore button for deleted items -->
            <template v-if="roomType.status === 'deleted'">
              <button
                class="p-2 text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"
                :title="$t('planning.restore')"
                @click="restoreRoomType(roomType)"
              >
                <span class="material-icons">restore</span>
              </button>
            </template>
            <!-- Normal action buttons for active/draft/inactive items -->
            <template v-else>
              <button
                v-if="roomType.status === 'draft' || roomType.status === 'inactive'"
                class="p-2 text-gray-500 hover:text-green-600 dark:text-slate-400 dark:hover:text-green-400"
                :title="$t('common.activate')"
                @click="toggleRoomTypeStatus(roomType, 'active')"
              >
                <span class="material-icons">check_circle</span>
              </button>
              <button
                v-if="roomType.status === 'active'"
                class="p-2 text-gray-500 hover:text-yellow-600 dark:text-slate-400 dark:hover:text-yellow-400"
                :title="$t('common.deactivate')"
                @click="toggleRoomTypeStatus(roomType, 'inactive')"
              >
                <span class="material-icons">pause_circle</span>
              </button>
              <button
                class="p-2 text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                :title="$t('common.edit')"
                @click="editRoomType(roomType)"
              >
                <span class="material-icons">edit</span>
              </button>
              <button
                class="p-2 text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                :title="$t('common.delete')"
                @click="confirmDeleteRoomType(roomType)"
              >
                <span class="material-icons">delete</span>
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <span class="material-icons text-4xl text-gray-300 dark:text-slate-600">bed</span>
        <p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('planning.roomTypes.empty') }}</p>
      </div>
    </div>

    <hr class="border-gray-200 dark:border-slate-700" />

    <!-- Meal Plans Section -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ $t('planning.mealPlans.title') }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('planning.mealPlans.description') }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Show deleted toggle -->
          <button
            v-if="hasDeletedMealPlans"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors"
            :class="
              showDeletedMealPlans
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'
            "
            @click="showDeletedMealPlans = !showDeletedMealPlans"
          >
            <span class="material-icons text-sm">{{
              showDeletedMealPlans ? 'visibility' : 'visibility_off'
            }}</span>
            {{ $t('planning.showDeleted') }}
          </button>
          <button class="btn-primary flex items-center gap-2" @click="showStandardSelector = true">
            <span class="material-icons text-sm">add</span>
            {{ $t('planning.mealPlans.addStandard') }}
          </button>
          <button class="btn-secondary flex items-center gap-2" @click="showMealPlanForm = true">
            <span class="material-icons text-sm">add</span>
            {{ $t('planning.mealPlans.addCustom') }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loadingMealPlans" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Meal Plans List -->
      <div
        v-else-if="filteredMealPlans.length > 0"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        <div
          v-for="plan in filteredMealPlans"
          :key="plan._id"
          class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center relative"
          :class="[
            hasBaseMealPlan && plan.isBaseMealPlan
              ? 'ring-2 ring-yellow-400 dark:ring-yellow-500'
              : '',
            plan.status === 'deleted' ? 'opacity-50' : ''
          ]"
        >
          <!-- Base Meal Plan Star (only show if more than 1 meal plan) -->
          <button
            v-if="mealPlans.length > 1"
            class="absolute top-1 right-1"
            :class="
              plan.isBaseMealPlan
                ? 'text-yellow-500'
                : 'text-gray-300 dark:text-slate-600 hover:text-yellow-400'
            "
            :title="
              plan.isBaseMealPlan
                ? $t('planning.pricing.clickToRemoveBase')
                : $t('planning.pricing.setAsBase')
            "
            @click="toggleBaseMealPlan(plan)"
          >
            <span class="material-icons text-lg">{{
              plan.isBaseMealPlan ? 'star' : 'star_border'
            }}</span>
          </button>

          <div class="font-bold text-lg text-indigo-600 dark:text-indigo-400">{{ plan.code }}</div>
          <div class="text-sm text-gray-600 dark:text-slate-300 truncate">
            {{ getMealPlanName(plan) }}
          </div>
          <div class="mt-2 flex flex-wrap justify-center gap-1">
            <span
              v-if="plan.includedMeals?.breakfast"
              class="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded"
              >B</span
            >
            <span
              v-if="plan.includedMeals?.lunch"
              class="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded"
              >L</span
            >
            <span
              v-if="plan.includedMeals?.dinner"
              class="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded"
              >D</span
            >
            <span
              v-if="plan.includedMeals?.drinks"
              class="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded"
              >DR</span
            >
          </div>

          <!-- Price Adjustment (only show if a base meal plan is selected) -->
          <div v-if="hasBaseMealPlan" class="mt-2">
            <template v-if="!plan.isBaseMealPlan">
              <div class="flex items-center justify-center gap-1">
                <input
                  v-model.number="plan.priceAdjustment"
                  type="number"
                  class="w-12 text-right text-xs px-1 py-0.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-white focus:ring-1 focus:ring-indigo-500"
                  :class="
                    plan.priceAdjustment > 0
                      ? 'text-green-600 dark:text-green-400'
                      : plan.priceAdjustment < 0
                        ? 'text-red-600 dark:text-red-400'
                        : ''
                  "
                  min="-50"
                  max="200"
                  step="5"
                  @blur="updateMealPlanAdjustment(plan)"
                />
                <span class="text-xs text-gray-500 dark:text-slate-400">%</span>
              </div>
            </template>
            <span v-else class="text-xs text-yellow-600 dark:text-yellow-400 font-medium">{{
              $t('planning.pricing.base')
            }}</span>
          </div>

          <!-- Markets that have this meal plan active -->
          <div v-if="markets.length > 0" class="mt-2 flex flex-wrap justify-center gap-1">
            <span
              v-for="market in getMarketsForMealPlan(plan._id)"
              :key="market._id"
              class="px-1.5 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded"
              :title="getMarketName(market)"
            >
              {{ market.code }}
            </span>
          </div>
          <div v-if="mealPlans.length > 1" class="mt-2">
            <!-- Restore button for deleted items -->
            <button
              v-if="plan.status === 'deleted'"
              class="text-xs text-green-500 hover:text-green-700 flex items-center gap-1 mx-auto"
              @click="restoreMealPlan(plan)"
            >
              <span class="material-icons text-sm">restore</span>
              {{ $t('planning.restore') }}
            </button>
            <!-- Delete button for active items -->
            <button
              v-else
              class="text-xs text-red-500 hover:text-red-700"
              @click="confirmDeleteMealPlan(plan)"
            >
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <span class="material-icons text-4xl text-gray-300 dark:text-slate-600">restaurant</span>
        <p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('planning.mealPlans.empty') }}</p>
        <p class="text-sm text-gray-400 dark:text-slate-500">
          {{ $t('planning.mealPlans.emptyHint') }}
        </p>
      </div>
    </div>

    <!-- Meal Plan Form Modal -->
    <Modal v-model="showMealPlanForm" :title="$t('planning.mealPlans.addCustom')" size="md">
      <MealPlanForm
        :hotel="hotel"
        @saved="handleMealPlanSaved"
        @cancel="showMealPlanForm = false"
      />
    </Modal>

    <!-- Standard Meal Plan Selector Modal -->
    <Modal v-model="showStandardSelector" :title="$t('planning.mealPlans.addStandard')" size="lg">
      <StandardMealPlanSelector
        :hotel="hotel"
        :existing-meal-plans="mealPlans"
        @saved="handleStandardPlansAdded"
        @cancel="showStandardSelector = false"
      />
    </Modal>

    <!-- Room Template Import Modal -->
    <RoomTemplateImportModal
      v-if="showImportModal"
      :hotel-id="hotel._id"
      :existing-room-types="roomTypes"
      @close="showImportModal = false"
      @imported="handleImported"
    />

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" :title="$t('common.delete')" size="sm">
      <div class="space-y-3">
        <p class="text-gray-600 dark:text-slate-400">{{ $t('common.confirm') }}?</p>
        <!-- Rate count info for room types -->
        <div
          v-if="deleteType === 'roomType' && deleteTarget?.rateCount > 0"
          class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3"
        >
          <div class="flex items-start gap-2">
            <span class="material-icons text-blue-500 text-lg">info</span>
            <div class="text-sm">
              <p class="font-medium text-blue-700 dark:text-blue-400">
                {{ $t('planning.roomTypes.hasRates') }}
              </p>
              <p class="text-blue-600 dark:text-blue-300 mt-1">
                {{ $t('planning.roomTypes.willBeDeactivated') }}
              </p>
            </div>
          </div>
        </div>
        <!-- Rate count info for meal plans -->
        <div
          v-if="deleteType === 'mealPlan' && deleteTarget?.rateCount > 0"
          class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3"
        >
          <div class="flex items-start gap-2">
            <span class="material-icons text-blue-500 text-lg">info</span>
            <div class="text-sm">
              <p class="font-medium text-blue-700 dark:text-blue-400">
                {{ $t('planning.mealPlans.hasRates') }}
              </p>
              <p class="text-blue-600 dark:text-blue-300 mt-1">
                {{ $t('planning.mealPlans.willBeDeactivated') }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn-secondary" @click="showDeleteModal = false">
          {{ $t('common.no') }}
        </button>
        <button type="button" class="btn-danger" :disabled="deleting" @click="executeDelete">
          <span v-if="deleting">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.yes') }}</span>
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import MealPlanForm from './MealPlanForm.vue'
import StandardMealPlanSelector from './StandardMealPlanSelector.vue'
import RoomTemplateImportModal from './RoomTemplateImportModal.vue'
import planningService from '@/services/planningService'
import { getImageUrl } from '@/utils/imageUrl'

const props = defineProps({
  hotel: {
    type: Object,
    required: true
  }
})

defineEmits(['refresh'])

const router = useRouter()
const { t, locale } = useI18n()
const toast = useToast()

// Room Types
const roomTypes = ref([])
const loadingRoomTypes = ref(false)

// Meal Plans
const mealPlans = ref([])
const loadingMealPlans = ref(false)

// Markets (for showing which markets use each room type/meal plan)
const markets = ref([])
const showMealPlanForm = ref(false)
const showStandardSelector = ref(false)
const showImportModal = ref(false)

// Delete
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const deleteType = ref(null)
const deleting = ref(false)

// Filter toggles for deleted (inactive) items
const showDeletedRooms = ref(false)
const showDeletedMealPlans = ref(false)

// Computed: check if any room/meal plan is set as base
const hasBaseRoom = computed(() => roomTypes.value.some(rt => rt.isBaseRoom))
const hasBaseMealPlan = computed(() => mealPlans.value.some(mp => mp.isBaseMealPlan))

// Computed: check if there are any deleted items
const hasDeletedRoomTypes = computed(() => roomTypes.value.some(rt => rt.status === 'deleted'))
const hasDeletedMealPlans = computed(() => mealPlans.value.some(mp => mp.status === 'deleted'))

// Computed: filtered lists based on show deleted toggle
const filteredRoomTypes = computed(() => {
  if (showDeletedRooms.value) {
    return roomTypes.value
  }
  return roomTypes.value.filter(rt => rt.status !== 'deleted')
})

const filteredMealPlans = computed(() => {
  if (showDeletedMealPlans.value) {
    return mealPlans.value
  }
  return mealPlans.value.filter(mp => mp.status !== 'deleted')
})

// getImageUrl imported from @/utils/imageUrl

const getRoomTypeName = roomType => {
  return roomType.name?.[locale.value] || roomType.name?.tr || roomType.name?.en || roomType.code
}

const getMealPlanName = plan => {
  return plan.name?.[locale.value] || plan.name?.tr || plan.name?.en || plan.code
}

const getMarketName = market => {
  return market.name?.[locale.value] || market.name?.tr || market.name?.en || market.code
}

// Pricing type helpers
const getPricingTypeLabel = roomType => {
  if (roomType.pricingType === 'per_person') {
    return roomType.useMultipliers ? 'OBP ×' : 'OBP'
  }
  return t('planning.pricing.unit')
}

const getPricingTypeClass = roomType => {
  if (roomType.pricingType === 'per_person') {
    if (roomType.useMultipliers) {
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    }
    return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
  }
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
}

const getPricingTypeTooltip = roomType => {
  if (roomType.pricingType === 'per_person') {
    if (roomType.useMultipliers) {
      return t('planning.pricing.obpMultiplierTooltip')
    }
    return t('planning.pricing.obpTooltip')
  }
  return t('planning.pricing.unitTooltip')
}

// Get markets that have this room type active (empty activeRoomTypes = all active)
const getMarketsForRoomType = rtId => {
  return markets.value.filter(market => {
    const activeIds = (market.activeRoomTypes || []).map(id =>
      typeof id === 'object' ? id._id : id
    )
    // If empty, this market has all room types active
    if (activeIds.length === 0) return true
    return activeIds.includes(rtId)
  })
}

// Get markets that have this meal plan active (empty activeMealPlans = all active)
const getMarketsForMealPlan = mpId => {
  return markets.value.filter(market => {
    const activeIds = (market.activeMealPlans || []).map(id =>
      typeof id === 'object' ? id._id : id
    )
    // If empty, this market has all meal plans active
    if (activeIds.length === 0) return true
    return activeIds.includes(mpId)
  })
}

const fetchRoomTypes = async () => {
  loadingRoomTypes.value = true
  try {
    // Always fetch with includeDeleted to know if there are deleted items
    // The filteredRoomTypes computed will handle the display filtering
    const response = await planningService.getRoomTypes(props.hotel._id, { includeDeleted: 'true' })
    if (response.success) {
      roomTypes.value = response.data
    }
  } catch {
    toast.error(t('common.fetchError'))
  } finally {
    loadingRoomTypes.value = false
  }
}

const fetchMealPlans = async () => {
  loadingMealPlans.value = true
  try {
    // Always fetch with includeDeleted to know if there are deleted items
    // The filteredMealPlans computed will handle the display filtering
    const response = await planningService.getMealPlans(props.hotel._id, { includeDeleted: 'true' })
    if (response.success) {
      mealPlans.value = response.data
    }
  } catch {
    toast.error(t('common.fetchError'))
  } finally {
    loadingMealPlans.value = false
  }
}

const fetchMarkets = async () => {
  try {
    const response = await planningService.getMarkets(props.hotel._id)
    if (response.success) {
      markets.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to fetch markets:', error)
  }
}

const handleStandardPlansAdded = () => {
  showStandardSelector.value = false
  fetchMealPlans()
}

const handleImported = () => {
  showImportModal.value = false
  fetchRoomTypes()
}

const addNewRoomType = () => {
  router.push({
    name: 'room-type-new',
    params: { hotelId: props.hotel._id }
  })
}

const editRoomType = roomType => {
  router.push({
    name: 'room-type-detail',
    params: { hotelId: props.hotel._id, id: roomType._id }
  })
}

// Toggle room type status
const toggleRoomTypeStatus = async (roomType, newStatus) => {
  try {
    const response = await planningService.updateRoomType(props.hotel._id, roomType._id, {
      status: newStatus
    })
    if (response.success) {
      roomType.status = newStatus
      toast.success(newStatus === 'active' ? t('common.activated') : t('common.deactivated'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  }
}

// Toggle base room for relative pricing
const toggleBaseRoom = async roomType => {
  try {
    if (roomType.isBaseRoom) {
      // Already base - clear it by updating to isBaseRoom: false
      const response = await planningService.updateRoomType(props.hotel._id, roomType._id, {
        isBaseRoom: false
      })
      if (response.success) {
        roomTypes.value.forEach(rt => {
          rt.isBaseRoom = false
        })
        toast.success(t('planning.pricing.baseRoomCleared'))
      }
    } else {
      // Set as base
      const response = await planningService.setBaseRoom(props.hotel._id, roomType._id)
      if (response.success) {
        // Update local state - clear all isBaseRoom flags and set the selected one
        roomTypes.value.forEach(rt => {
          rt.isBaseRoom = rt._id === roomType._id
          if (rt.isBaseRoom) {
            rt.priceAdjustment = 0
          }
        })
        toast.success(t('planning.pricing.baseRoomSet'))
      }
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  }
}

// Update room type price adjustment
const updateRoomTypeAdjustment = async roomType => {
  try {
    await planningService.updateRoomTypePriceAdjustment(
      props.hotel._id,
      roomType._id,
      roomType.priceAdjustment
    )
    // No toast - inline edit feedback is sufficient
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  }
}

// Toggle base meal plan for relative pricing
const toggleBaseMealPlan = async plan => {
  try {
    if (plan.isBaseMealPlan) {
      // Already base - clear it by updating to isBaseMealPlan: false
      const response = await planningService.updateMealPlan(props.hotel._id, plan._id, {
        isBaseMealPlan: false
      })
      if (response.success) {
        mealPlans.value.forEach(mp => {
          mp.isBaseMealPlan = false
        })
        toast.success(t('planning.pricing.baseMealPlanCleared'))
      }
    } else {
      // Set as base
      const response = await planningService.setBaseMealPlan(props.hotel._id, plan._id)
      if (response.success) {
        // Update local state - clear all isBaseMealPlan flags and set the selected one
        mealPlans.value.forEach(mp => {
          mp.isBaseMealPlan = mp._id === plan._id
          if (mp.isBaseMealPlan) {
            mp.priceAdjustment = 0
          }
        })
        toast.success(t('planning.pricing.baseMealPlanSet'))
      }
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  }
}

// Update meal plan price adjustment
const updateMealPlanAdjustment = async plan => {
  try {
    await planningService.updateMealPlanPriceAdjustment(
      props.hotel._id,
      plan._id,
      plan.priceAdjustment
    )
    // No toast - inline edit feedback is sufficient
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  }
}

const handleMealPlanSaved = () => {
  showMealPlanForm.value = false
  fetchMealPlans()
}

const confirmDeleteRoomType = async roomType => {
  deleteTarget.value = roomType
  deleteType.value = 'roomType'
  // Check if room type has rates - show warning
  try {
    const ratesRes = await planningService.getRates(props.hotel._id, { roomType: roomType._id })
    const rates = Array.isArray(ratesRes.data) ? ratesRes.data : ratesRes.data?.rates || []
    deleteTarget.value.rateCount = rates.length
  } catch {
    deleteTarget.value.rateCount = 0
  }
  showDeleteModal.value = true
}

const confirmDeleteMealPlan = async plan => {
  deleteTarget.value = plan
  deleteType.value = 'mealPlan'
  // Check if meal plan has rates - show warning
  try {
    const ratesRes = await planningService.getRates(props.hotel._id, { mealPlan: plan._id })
    const rates = Array.isArray(ratesRes.data) ? ratesRes.data : ratesRes.data?.rates || []
    deleteTarget.value.rateCount = rates.length
  } catch {
    deleteTarget.value.rateCount = 0
  }
  showDeleteModal.value = true
}

const executeDelete = async () => {
  deleting.value = true
  try {
    if (deleteType.value === 'roomType') {
      // If room type has rates, do soft delete (set status to deleted)
      if (deleteTarget.value.rateCount > 0) {
        await planningService.updateRoomType(props.hotel._id, deleteTarget.value._id, {
          status: 'deleted'
        })
        toast.success(t('planning.roomTypes.deleted'))
      } else {
        await planningService.deleteRoomType(props.hotel._id, deleteTarget.value._id)
        toast.success(t('planning.roomTypes.deleted'))
      }
      fetchRoomTypes()
    } else if (deleteType.value === 'mealPlan') {
      // If meal plan has rates, do soft delete (set status to deleted)
      if (deleteTarget.value.rateCount > 0) {
        await planningService.updateMealPlan(props.hotel._id, deleteTarget.value._id, {
          status: 'deleted'
        })
        toast.success(t('planning.mealPlans.deleted'))
      } else {
        await planningService.deleteMealPlan(props.hotel._id, deleteTarget.value._id)
        toast.success(t('planning.mealPlans.deleted'))
      }
      fetchMealPlans()
    }
    showDeleteModal.value = false
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.deleteFailed'))
  } finally {
    deleting.value = false
  }
}

// Restore deleted room type
const restoreRoomType = async roomType => {
  try {
    await planningService.updateRoomType(props.hotel._id, roomType._id, { status: 'active' })
    toast.success(t('planning.roomTypes.restored'))
    fetchRoomTypes()
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  }
}

// Restore deleted meal plan
const restoreMealPlan = async plan => {
  try {
    await planningService.updateMealPlan(props.hotel._id, plan._id, { status: 'active' })
    toast.success(t('planning.mealPlans.restored'))
    fetchMealPlans()
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  }
}

// Watch for hotel changes
watch(
  () => props.hotel?._id,
  newId => {
    if (newId) {
      fetchRoomTypes()
      fetchMealPlans()
      fetchMarkets()
    }
  },
  { immediate: true }
)
</script>
