<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ $t('pms.channelManager.mapping.description') }}
      </p>
      <button
        :disabled="loadingProducts"
        class="px-4 py-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 flex items-center gap-2"
        @click="$emit('fetchProducts')"
      >
        <span v-if="loadingProducts" class="material-icons animate-spin text-sm">refresh</span>
        <span v-else class="material-icons text-sm">cloud_download</span>
        {{ $t('pms.channelManager.mapping.fetchProducts') }}
      </button>
    </div>

    <!-- No products yet -->
    <div
      v-if="!products || products.length === 0"
      class="text-center py-8 text-gray-500 dark:text-gray-400"
    >
      <span class="material-icons text-4xl mb-2">inventory_2</span>
      <p>{{ $t('pms.channelManager.mapping.noProducts') }}</p>
    </div>

    <!-- Room Type Mappings -->
    <div v-else class="space-y-4">
      <div
        v-for="rt in products"
        :key="rt.id"
        class="border border-gray-200 dark:border-slate-700 rounded-lg p-4"
      >
        <!-- Room Type Header -->
        <div class="flex items-center justify-between mb-3">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">
              {{ rt.name }}
            </h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">Reseliva ID: {{ rt.id }}</p>
          </div>
          <div class="w-64">
            <select
              :value="getMappingValue(rt.id, 'localRoomTypeId')"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
              @change="updateRoomMapping(rt, $event.target.value)"
            >
              <option value="">{{ $t('pms.channelManager.mapping.selectRoomType') }}</option>
              <option v-for="lr in localRoomTypes" :key="lr._id" :value="lr._id">
                {{ lr.name?.tr || lr.name?.en || lr.code }}
              </option>
            </select>
          </div>
        </div>

        <!-- Rate Plan Mappings -->
        <div v-if="rt.ratePlans && rt.ratePlans.length > 0" class="ml-4 space-y-2">
          <div
            v-for="rp in rt.ratePlans"
            :key="rp.id"
            class="flex items-center justify-between py-2 border-t border-gray-100 dark:border-slate-700"
          >
            <div>
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ rp.name }}</span>
              <span
                v-if="rp.boardType"
                class="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
              >
                {{ rp.boardType }}
              </span>
            </div>
            <div class="w-64">
              <select
                :value="getRateMappingValue(rt.id, rp.id)"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                @change="updateRateMapping(rt.id, rp, $event.target.value)"
              >
                <option value="">{{ $t('pms.channelManager.mapping.selectMealPlan') }}</option>
                <option v-for="mp in localMealPlans" :key="mp._id" :value="mp._id">
                  {{ mp.name?.tr || mp.name?.en || mp.code }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end pt-4">
        <button
          :disabled="savingMappings"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          @click="saveMappings"
        >
          <span v-if="savingMappings" class="material-icons animate-spin text-sm">refresh</span>
          <span class="material-icons text-sm">save</span>
          {{ $t('pms.channelManager.mapping.saveMappings') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  products: { type: Array, default: () => [] },
  existingMappings: { type: Array, default: () => [] },
  localRoomTypes: { type: Array, default: () => [] },
  localMealPlans: { type: Array, default: () => [] },
  loadingProducts: { type: Boolean, default: false },
  savingMappings: { type: Boolean, default: false }
})

const emit = defineEmits(['fetchProducts', 'save'])

const mappings = ref([])

// Initialize mappings from existing data
watch(
  () => props.existingMappings,
  existing => {
    if (existing && existing.length > 0) {
      mappings.value = JSON.parse(JSON.stringify(existing))
    }
  },
  { immediate: true }
)

function getMappingValue(reselivaRoomId, field) {
  const m = mappings.value.find(m => m.reselivaRoomId === reselivaRoomId)
  return m ? m[field] : ''
}

function getRateMappingValue(reselivaRoomId, reselivaRateId) {
  const rm = mappings.value.find(m => m.reselivaRoomId === reselivaRoomId)
  if (!rm) return ''
  const rate = rm.rateMappings?.find(r => r.reselivaRateId === reselivaRateId)
  return rate?.localMealPlanId || ''
}

function updateRoomMapping(rt, localRoomTypeId) {
  let existing = mappings.value.find(m => m.reselivaRoomId === rt.id)
  if (!existing) {
    existing = {
      reselivaRoomId: rt.id,
      reselivaRoomName: rt.name,
      pricingMode: rt.pricing,
      pricingChild: rt.pricingChild,
      localRoomTypeId: '',
      rateMappings: []
    }
    mappings.value.push(existing)
  }
  existing.localRoomTypeId = localRoomTypeId || ''
}

function updateRateMapping(reselivaRoomId, rp, localMealPlanId) {
  let roomMapping = mappings.value.find(m => m.reselivaRoomId === reselivaRoomId)
  if (!roomMapping) return

  if (!roomMapping.rateMappings) roomMapping.rateMappings = []

  let rateMapping = roomMapping.rateMappings.find(r => r.reselivaRateId === rp.id)
  if (!rateMapping) {
    rateMapping = {
      reselivaRateId: rp.id,
      reselivaRateName: rp.name,
      boardType: rp.boardType,
      localMealPlanId: ''
    }
    roomMapping.rateMappings.push(rateMapping)
  }
  rateMapping.localMealPlanId = localMealPlanId || ''
}

function saveMappings() {
  // Filter out incomplete mappings
  const validMappings = mappings.value.filter(m => m.localRoomTypeId)
  emit('save', validMappings)
}
</script>
