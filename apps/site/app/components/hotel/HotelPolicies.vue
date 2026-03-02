<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-800">{{ $t('hotel.policies') }}</h3>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Check-in -->
      <div v-if="policies.checkIn" class="bg-gray-50 rounded-lg p-4">
        <dt class="text-sm text-gray-500">{{ $t('hotel.checkIn') }}</dt>
        <dd class="font-medium text-gray-800">{{ policies.checkIn }}</dd>
      </div>

      <!-- Check-out -->
      <div v-if="policies.checkOut" class="bg-gray-50 rounded-lg p-4">
        <dt class="text-sm text-gray-500">{{ $t('hotel.checkOut') }}</dt>
        <dd class="font-medium text-gray-800">{{ policies.checkOut }}</dd>
      </div>
    </div>

    <!-- Cancellation -->
    <div v-if="policies.freeCancellation?.enabled" class="flex items-center gap-2 text-sm">
      <Badge variant="success">{{ $t('hotel.freeCancellation') }}</Badge>
      <span v-if="policies.freeCancellation.daysBeforeCheckIn" class="text-gray-500">
        ({{ policies.freeCancellation.daysBeforeCheckIn }} gün öncesine kadar)
      </span>
    </div>

    <!-- Child policy -->
    <div v-if="ml(policies.childPolicy)">
      <h4 class="text-sm font-medium text-gray-800 mb-1">{{ $t('hotel.childPolicy') }}</h4>
      <p class="text-sm text-gray-600">{{ ml(policies.childPolicy) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { ml } = useMultiLang()
defineProps<{ policies: any }>()
</script>
