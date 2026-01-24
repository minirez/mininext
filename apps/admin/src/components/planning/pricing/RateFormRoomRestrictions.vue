<template>
  <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <!-- Room Info -->
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm"
        >
          {{ roomType?.code }}
        </div>
        <div>
          <div class="font-medium text-gray-800 dark:text-white text-sm">
            {{ roomTypeName }}
          </div>
          <div class="text-xs text-gray-500 dark:text-slate-400">
            {{ roomType?.occupancy?.maxAdults ?? 2 }}+{{
              roomType?.occupancy?.maxChildren ?? 0
            }}
          </div>
        </div>
      </div>

      <!-- Allotment, MinStay, Release Inputs -->
      <div class="flex items-center gap-6">
        <!-- Allotment -->
        <div class="flex flex-col items-center">
          <span class="text-[10px] text-gray-400 dark:text-slate-500 uppercase mb-1">{{
            $t('planning.pricing.allotment')
          }}</span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="w-7 h-7 rounded bg-gray-200 dark:bg-slate-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
              @click="decrementAllotment"
            >
              <span class="material-icons text-sm">remove</span>
            </button>
            <input
              :value="restrictions.allotment"
              type="number"
              min="0"
              class="w-14 text-center text-sm font-bold border-2 border-blue-300 dark:border-blue-700 rounded-lg py-1.5 bg-white dark:bg-slate-800"
              @input="updateAllotment($event.target.value)"
            />
            <button
              type="button"
              class="w-7 h-7 rounded bg-gray-200 dark:bg-slate-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
              @click="incrementAllotment"
            >
              <span class="material-icons text-sm">add</span>
            </button>
          </div>
        </div>

        <!-- MinStay -->
        <div class="flex flex-col items-center">
          <span class="text-[10px] text-gray-400 dark:text-slate-500 uppercase mb-1">{{
            $t('planning.pricing.minStay')
          }}</span>
          <div class="flex items-center gap-1">
            <input
              :value="restrictions.minStay"
              type="number"
              min="1"
              max="30"
              class="w-14 text-center text-sm font-bold border-2 border-purple-300 dark:border-purple-700 rounded-lg py-1.5 bg-white dark:bg-slate-800"
              @input="updateMinStay($event.target.value)"
            />
            <span class="text-xs text-gray-400">{{
              $t('planning.pricing.nightsShort')
            }}</span>
          </div>
        </div>

        <!-- Release Days -->
        <div class="flex flex-col items-center">
          <span class="text-[10px] text-gray-400 dark:text-slate-500 uppercase mb-1"
            >Release</span
          >
          <div class="flex items-center gap-1">
            <input
              :value="restrictions.releaseDays"
              type="number"
              min="0"
              class="w-14 text-center text-sm font-bold border-2 border-amber-300 dark:border-amber-700 rounded-lg py-1.5 bg-white dark:bg-slate-800"
              @input="updateReleaseDays($event.target.value)"
            />
            <span class="text-xs text-gray-400">{{ $t('planning.pricing.daysShort') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const props = defineProps({
  roomType: { type: Object, required: true },
  restrictions: { type: Object, required: true }
})

const emit = defineEmits(['update:restrictions'])

const roomTypeName = computed(() => {
  if (!props.roomType) return ''
  return props.roomType.name?.[locale.value] || props.roomType.name?.tr || props.roomType.name?.en || ''
})

const updateRestriction = (key, value) => {
  emit('update:restrictions', {
    ...props.restrictions,
    [key]: value
  })
}

const updateAllotment = (value) => {
  updateRestriction('allotment', Number(value) || 0)
}

const updateMinStay = (value) => {
  updateRestriction('minStay', Number(value) || 1)
}

const updateReleaseDays = (value) => {
  updateRestriction('releaseDays', Number(value) || 0)
}

const decrementAllotment = () => {
  updateRestriction('allotment', Math.max(0, props.restrictions.allotment - 1))
}

const incrementAllotment = () => {
  updateRestriction('allotment', props.restrictions.allotment + 1)
}
</script>
