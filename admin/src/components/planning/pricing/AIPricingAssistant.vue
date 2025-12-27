<template>
  <div class="ai-pricing-assistant">
    <!-- Always Visible Panel -->
    <div class="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden">
      <!-- Content -->
      <div class="p-4">
        <!-- Command Input Row -->
        <div v-if="!parsedResult" class="flex gap-3 items-start">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/30 flex-shrink-0">
            <span class="material-icons text-white text-lg">auto_awesome</span>
          </div>
          <div class="flex-1">
            <input
              v-model="command"
              type="text"
              :placeholder="$t('planning.pricing.aiPlaceholder')"
              class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              :disabled="parsing || executing"
              @keydown.enter="parseCommand"
            />
          </div>
          <button
            @click="parseCommand"
            :disabled="!command.trim() || parsing"
            class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium shadow-md shadow-purple-500/30 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <span v-if="parsing" class="material-icons animate-spin text-lg">refresh</span>
            <span v-else class="material-icons text-lg">psychology</span>
            <span class="hidden sm:inline">{{ parsing ? $t('planning.pricing.aiAnalyzing') : $t('planning.pricing.aiAnalyze') }}</span>
          </button>
        </div>

        <!-- Selected Cells Badge -->
        <Transition name="fade">
          <div v-if="hasSelection && !parsedResult" class="flex items-center gap-3 mt-3 ml-12">
            <div class="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg">
              <span class="material-icons text-sm">grid_on</span>
              <span class="text-sm font-medium">
                {{ selectionInfo.count }} {{ $t('planning.pricing.cellsSelected') }}
              </span>
              <span class="text-xs opacity-75">
                ({{ selectionInfo.startDate }} - {{ selectionInfo.endDate }})
              </span>
            </div>
            <div class="flex gap-1">
              <span
                v-for="code in selectionInfo.roomTypeCodes"
                :key="code"
                class="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium"
              >
                {{ code }}
              </span>
              <span
                v-for="code in selectionInfo.mealPlanCodes"
                :key="code"
                class="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs font-medium"
              >
                {{ code }}
              </span>
            </div>
            <button
              @click="clearSelection"
              class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              :title="$t('common.clear')"
            >
              <span class="material-icons text-sm">close</span>
            </button>
          </div>
        </Transition>

        <!-- Example Commands -->
        <div v-if="!parsedResult && !command && !hasSelection" class="flex flex-wrap gap-2 mt-3 ml-12">
          <button
            v-for="(example, i) in examples"
            :key="i"
            @click="command = example"
            class="text-xs px-3 py-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full hover:border-purple-400 hover:text-purple-600 transition-colors"
          >
            {{ example }}
          </button>
        </div>

          <!-- Parsed Result -->
          <Transition name="fade">
            <div v-if="parsedResult" class="space-y-4">
              <!-- Error State -->
              <div v-if="!parsedResult.success && !parsedResult.needsClarification" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div class="flex items-start gap-3">
                  <span class="material-icons text-red-500">error</span>
                  <div class="flex-1">
                    <p class="font-medium text-red-700 dark:text-red-400">{{ $t('planning.pricing.aiError') }}</p>
                    <p class="text-sm text-red-600 dark:text-red-300 mt-1">{{ parsedResult.error }}</p>
                    <button
                      @click="resetResult"
                      class="mt-3 flex items-center gap-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                    >
                      <span class="material-icons text-base">refresh</span>
                      {{ $t('planning.pricing.aiTryAgain') }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Clarification Needed State -->
              <div v-else-if="parsedResult.needsClarification" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div class="flex items-start gap-3">
                  <span class="material-icons text-amber-500">help_outline</span>
                  <div class="flex-1">
                    <p class="font-medium text-amber-700 dark:text-amber-400">{{ $t('planning.pricing.aiClarificationNeeded') }}</p>
                    <p class="text-sm text-amber-600 dark:text-amber-300 mt-1">{{ parsedResult.clarificationQuestion }}</p>
                    <div class="flex flex-wrap gap-2 mt-3">
                      <button
                        v-for="(option, idx) in parsedResult.clarificationOptions"
                        :key="idx"
                        @click="selectClarification(option)"
                        class="px-4 py-2 bg-white dark:bg-slate-700 border border-amber-300 dark:border-amber-600 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-sm font-medium text-left"
                      >
                        {{ typeof option === 'string' ? option : option.label }}
                      </button>
                    </div>
                    <button
                      @click="resetResult"
                      class="mt-3 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      ← {{ $t('planning.pricing.aiTryAgain') }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Success State -->
              <div v-else class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <!-- Command + Summary Header -->
                <div class="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 border-b border-gray-200 dark:border-slate-700">
                  <p class="text-gray-600 dark:text-slate-400 text-sm mb-2">
                    {{ $t('planning.pricing.aiCommand') }}: {{ command }}
                  </p>
                  <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                    <span class="material-icons">check_circle</span>
                    {{ $t('planning.pricing.aiUnderstood') }}
                  </div>
                  <p class="text-gray-700 dark:text-slate-300 mt-2 font-medium">
                    {{ parsedResult.summary?.[locale] || parsedResult.summary?.tr || parsedResult.summary?.en }}
                  </p>
                </div>

                <!-- Details -->
                <div class="p-4 space-y-3">
                  <!-- Selected Cells Info (when selection exists) -->
                  <div v-if="hasSelection" class="flex items-start gap-3">
                    <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                      <span class="material-icons text-purple-600 dark:text-purple-400 text-sm">grid_on</span>
                    </span>
                    <div class="flex-1">
                      <div class="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">{{ $t('planning.pricing.selectedCells') }}</div>
                      <div class="flex items-center gap-3 flex-wrap">
                        <div class="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium">
                          {{ selectionInfo.count }} {{ $t('planning.pricing.cellsSelected') }}
                        </div>
                        <div class="text-sm text-gray-600 dark:text-slate-400">
                          {{ selectionInfo.startDate }} - {{ selectionInfo.endDate }}
                        </div>
                      </div>
                      <div class="flex gap-1 mt-2">
                        <span
                          v-for="code in selectionInfo.roomTypeCodes"
                          :key="code"
                          class="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium"
                        >
                          {{ code }}
                        </span>
                        <span
                          v-for="code in selectionInfo.mealPlanCodes"
                          :key="code"
                          class="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs font-medium"
                        >
                          {{ code }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Editable Date Range with DateRangePicker (when no selection) -->
                  <div v-else class="flex items-start gap-3">
                    <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                      <span class="material-icons text-blue-600 dark:text-blue-400 text-sm">date_range</span>
                    </span>
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="text-xs font-medium text-gray-600 dark:text-slate-400">{{ $t('planning.pricing.aiDateRange') }}</span>
                        <span class="text-xs text-gray-400 dark:text-slate-500 italic">{{ $t('planning.pricing.aiEditDateHint') }}</span>
                      </div>
                      <DateRangePicker
                        v-model="dateRangeModel"
                        :allow-past="true"
                        :placeholder="$t('planning.pricing.selectDateRange')"
                      />
                      <!-- Date summary -->
                      <p class="mt-1.5 text-xs text-gray-500 dark:text-slate-500">
                        {{ getDateRangeSummary() }}
                      </p>
                    </div>
                  </div>

                  <!-- Actions List -->
                  <div class="space-y-2">
                    <span class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.aiActions') }} ({{ parsedResult.actions?.length || 1 }})</span>
                    <div class="space-y-2">
                      <div
                        v-for="(act, idx) in (parsedResult.actions || [parsedResult])"
                        :key="idx"
                        class="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                      >
                        <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs" :class="getActionIconClass(act.action)">
                          <span class="material-icons text-sm">{{ getActionIcon(act.action) }}</span>
                        </span>
                        <div class="flex-1 min-w-0">
                          <p class="font-medium text-gray-800 dark:text-white text-sm">{{ getActionLabel(act.action) }}</p>
                          <div class="flex flex-wrap gap-1 mt-1">
                            <!-- Room Types -->
                            <template v-if="act.filters?.roomTypes !== 'all' && Array.isArray(act.filters?.roomTypes)">
                              <span v-for="rt in act.filters.roomTypes" :key="rt" class="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                                {{ rt }}
                              </span>
                            </template>
                            <!-- Meal Plans -->
                            <template v-if="act.filters?.mealPlans !== 'all' && Array.isArray(act.filters?.mealPlans)">
                              <span v-for="mp in act.filters.mealPlans" :key="mp" class="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs">
                                {{ mp }}
                              </span>
                            </template>
                            <!-- Days of Week -->
                            <template v-if="act.filters?.daysOfWeek !== 'all' && Array.isArray(act.filters?.daysOfWeek)">
                              <span class="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs flex items-center gap-1">
                                <span class="material-icons text-xs">calendar_today</span>
                                {{ getDaysOfWeekLabel(act.filters.daysOfWeek) }}
                              </span>
                            </template>
                          </div>
                        </div>
                        <!-- Editable Value (only for price-related actions) -->
                        <div v-if="isValueEditableAction(act.action) && act.value !== null && act.value !== undefined" class="flex items-center gap-1">
                          <span v-if="act.valueType === 'percentage'" class="text-emerald-600 dark:text-emerald-400 font-bold">%</span>
                          <input
                            type="number"
                            :value="act.value"
                            @input="updateActionValue(idx, $event.target.value)"
                            class="w-16 px-2 py-1 text-sm text-right font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                          <span v-if="act.valueType !== 'percentage'" class="text-emerald-600 dark:text-emerald-400 font-bold text-sm">TL</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center justify-between p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                  <button
                    @click="resetResult"
                    class="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                  >
                    <span class="material-icons text-lg">arrow_back</span>
                    {{ $t('planning.pricing.aiTryAgain') }}
                  </button>
                  <button
                    @click="executeCommand"
                    :disabled="executing"
                    class="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all disabled:opacity-50"
                  >
                    <span v-if="executing" class="material-icons animate-spin text-lg">refresh</span>
                    <span v-else class="material-icons text-lg">check</span>
                    {{ executing ? $t('planning.pricing.aiExecuting') : $t('planning.pricing.aiExecute') }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'
import DateRangePicker from '@/components/common/DateRangePicker.vue'

const props = defineProps({
  hotelId: { type: String, required: true },
  currentMonth: { type: Object, default: () => ({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }) },
  selectedCells: { type: Array, default: () => [] },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] }
})

const emit = defineEmits(['executed', 'clear-selection'])

const { t, locale } = useI18n()
const toast = useToast()

// State
const command = ref('')
const parsing = ref(false)
const executing = ref(false)
const parsedResult = ref(null)

// Example commands
const examples = computed(() => [
  t('planning.pricing.aiExample1'),
  t('planning.pricing.aiExample2'),
  t('planning.pricing.aiExample3')
])

// Selected cells info
const hasSelection = computed(() => props.selectedCells.length > 0)

const selectionInfo = computed(() => {
  if (!hasSelection.value) return null

  const cells = props.selectedCells
  const dates = cells.map(c => c.date).sort()
  const roomTypeIds = [...new Set(cells.map(c => c.roomTypeId))]
  const mealPlanIds = [...new Set(cells.map(c => c.mealPlanId))]

  const roomTypeCodes = props.roomTypes
    .filter(rt => roomTypeIds.includes(rt._id))
    .map(rt => rt.code)

  const mealPlanCodes = props.mealPlans
    .filter(mp => mealPlanIds.includes(mp._id))
    .map(mp => mp.code)

  // Collect rate IDs (only existing rates)
  const rateIds = cells.map(c => c.rateId).filter(id => id != null)

  return {
    count: cells.length,
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    roomTypeCodes,
    mealPlanCodes,
    rateIds,
    cells // Include full cell data for backend
  }
})

const clearSelection = () => {
  emit('clear-selection')
}

// Build selected cells context for AI
const buildSelectionContext = () => {
  if (!hasSelection.value) return null

  const info = selectionInfo.value
  return {
    count: info.count,
    startDate: info.startDate,
    endDate: info.endDate,
    roomTypes: info.roomTypeCodes,
    mealPlans: info.mealPlanCodes
  }
}

// Parse command
const parseCommand = async () => {
  if (!command.value.trim() || parsing.value) return

  parsing.value = true
  try {
    const selectionContext = buildSelectionContext()
    const response = await planningService.parseAIPricingCommand(
      props.hotelId,
      command.value,
      props.currentMonth,
      selectionContext
    )
    if (response.success) {
      parsedResult.value = response.data
    }
  } catch (error) {
    toast.error(t('planning.pricing.aiParseFailed'))
    parsedResult.value = {
      success: false,
      error: error.response?.data?.message || t('planning.pricing.aiParseFailed')
    }
  } finally {
    parsing.value = false
  }
}

// Handle clarification selection
const selectClarification = async (option) => {
  // Re-parse with the selected clarification
  const optionText = typeof option === 'string' ? option : option.label
  const clarifiedCommand = `${command.value} (${optionText})`
  parsing.value = true
  parsedResult.value = null

  try {
    const selectionContext = buildSelectionContext()
    const response = await planningService.parseAIPricingCommand(
      props.hotelId,
      clarifiedCommand,
      props.currentMonth,
      selectionContext
    )
    if (response.success) {
      parsedResult.value = response.data
    }
  } catch (error) {
    toast.error(t('planning.pricing.aiParseFailed'))
    parsedResult.value = {
      success: false,
      error: error.response?.data?.message || t('planning.pricing.aiParseFailed')
    }
  } finally {
    parsing.value = false
  }
}

// Execute command
const executeCommand = async () => {
  if (!parsedResult.value?.success || executing.value) return

  executing.value = true
  try {
    let commandToExecute = { ...parsedResult.value }

    // If we have selected cells, send rate IDs directly
    if (hasSelection.value) {
      const info = selectionInfo.value
      // Send rate IDs directly for existing rates
      commandToExecute.rateIds = info.rateIds
      // Also send full cell data for cells without existing rates (for upsert operations)
      commandToExecute.selectedCells = info.cells
      // Keep dateRange for reference but rateIds will be used primarily
      commandToExecute.dateRange = {
        startDate: info.startDate,
        endDate: info.endDate
      }
    }

    const response = await planningService.executeAIPricingCommand(props.hotelId, commandToExecute)
    if (response.success) {
      toast.success(t('planning.pricing.aiExecuteSuccess', { count: response.data.affected }))
      emit('executed')
      resetResult()
      command.value = ''
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('planning.pricing.aiExecuteFailed'))
  } finally {
    executing.value = false
  }
}

// Reset result
const resetResult = () => {
  parsedResult.value = null
}

// Computed for DateRangePicker v-model
const dateRangeModel = computed({
  get: () => ({
    start: parsedResult.value?.dateRange?.startDate || null,
    end: parsedResult.value?.dateRange?.endDate || null
  }),
  set: (val) => {
    if (!parsedResult.value?.dateRange) return
    if (val.start) {
      parsedResult.value.dateRange.startDate = val.start instanceof Date
        ? val.start.toISOString().split('T')[0]
        : val.start
    }
    if (val.end) {
      parsedResult.value.dateRange.endDate = val.end instanceof Date
        ? val.end.toISOString().split('T')[0]
        : val.end
    }
  }
})

// Update action value
const updateActionValue = (actionIndex, value) => {
  if (!parsedResult.value?.actions?.[actionIndex]) return
  parsedResult.value.actions[actionIndex].value = parseFloat(value) || 0
}

// Check if action should show editable value
const isValueEditableAction = (action) => {
  const valueActions = [
    'set_price', 'update_price', 'set_supplement',
    'update_single_supplement', 'update_extra_adult', 'update_extra_child', 'update_extra_infant',
    'update_allotment', 'update_min_stay', 'update_max_stay'
  ]
  return valueActions.includes(action)
}

// Get date range summary
const getDateRangeSummary = () => {
  if (!parsedResult.value?.dateRange?.startDate || !parsedResult.value?.dateRange?.endDate) return ''
  const start = new Date(parsedResult.value.dateRange.startDate)
  const end = new Date(parsedResult.value.dateRange.endDate)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return t('planning.pricing.aiDateSummary', { days: diffDays })
}

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Get action icon
const getActionIcon = (action) => {
  const icons = {
    'stop_sale': 'block',
    'open_sale': 'check_circle',
    'set_price': 'payments',
    'update_price': 'attach_money',
    'set_supplement': 'add_circle',
    'update_single_supplement': 'person',
    'update_extra_adult': 'person_add',
    'update_extra_child': 'child_care',
    'update_extra_infant': 'baby_changing_station',
    'update_child_free': 'child_friendly',
    'update_allotment': 'inventory_2',
    'update_min_stay': 'hotel',
    'update_max_stay': 'hotel',
    'close_to_arrival': 'no_meeting_room',
    'close_to_departure': 'logout'
  }
  return icons[action] || 'settings'
}

// Get action icon class
const getActionIconClass = (action) => {
  const classes = {
    'stop_sale': 'bg-red-100 dark:bg-red-900/30 text-red-600',
    'open_sale': 'bg-green-100 dark:bg-green-900/30 text-green-600',
    'set_price': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
    'update_price': 'bg-lime-100 dark:bg-lime-900/30 text-lime-600',
    'set_supplement': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
    'update_single_supplement': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600',
    'update_extra_adult': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
    'update_extra_child': 'bg-pink-100 dark:bg-pink-900/30 text-pink-600',
    'update_extra_infant': 'bg-rose-100 dark:bg-rose-900/30 text-rose-600',
    'update_child_free': 'bg-teal-100 dark:bg-teal-900/30 text-teal-600',
    'update_allotment': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    'update_min_stay': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    'update_max_stay': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    'close_to_arrival': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
    'close_to_departure': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
  }
  return classes[action] || 'bg-gray-100 dark:bg-gray-700 text-gray-600'
}

// Get action label
const getActionLabel = (action) => {
  const labels = {
    'stop_sale': t('planning.pricing.aiActionStopSale'),
    'open_sale': t('planning.pricing.aiActionOpenSale'),
    'set_price': t('planning.pricing.aiActionSetPrice'),
    'update_price': t('planning.pricing.aiActionUpdatePrice'),
    'set_supplement': t('planning.pricing.aiActionSetSupplement'),
    'update_single_supplement': t('planning.pricing.aiActionUpdateSingle'),
    'update_extra_adult': t('planning.pricing.aiActionExtraAdult'),
    'update_extra_child': t('planning.pricing.aiActionExtraChild'),
    'update_extra_infant': t('planning.pricing.aiActionExtraInfant'),
    'update_child_free': t('planning.pricing.aiActionChildFree'),
    'update_allotment': t('planning.pricing.aiActionUpdateAllotment'),
    'update_min_stay': t('planning.pricing.aiActionUpdateMinStay'),
    'update_max_stay': t('planning.pricing.aiActionUpdateMaxStay'),
    'close_to_arrival': t('planning.pricing.aiActionCloseArrival'),
    'close_to_departure': t('planning.pricing.aiActionCloseDeparture')
  }
  return labels[action] || action
}

// Get days of week label
const getDaysOfWeekLabel = (days) => {
  if (!Array.isArray(days)) return ''

  // Normalize: convert numeric to string if needed (0=sunday, 6=saturday)
  const numToDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const normalizedDays = days.map(d => typeof d === 'number' ? numToDay[d] : d)

  // Check for common patterns
  const isWeekend = normalizedDays.length === 2 && normalizedDays.includes('saturday') && normalizedDays.includes('sunday')
  const isWeekday = normalizedDays.length === 5 && !normalizedDays.includes('saturday') && !normalizedDays.includes('sunday')

  if (isWeekend) return t('planning.pricing.weekend')
  if (isWeekday) return t('planning.pricing.weekdays')

  // Otherwise show short day names
  const dayLabels = {
    'monday': t('planning.pricing.dayMon'),
    'tuesday': t('planning.pricing.dayTue'),
    'wednesday': t('planning.pricing.dayWed'),
    'thursday': t('planning.pricing.dayThu'),
    'friday': t('planning.pricing.dayFri'),
    'saturday': t('planning.pricing.daySat'),
    'sunday': t('planning.pricing.daySun')
  }
  return normalizedDays.map(d => dayLabels[d] || d).join(', ')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
