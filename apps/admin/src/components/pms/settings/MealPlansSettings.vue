<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ $t('settings.mealPlans.title') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('settings.mealPlans.description') }}
        </p>
      </div>
      <button
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        @click="showCreateModal = true"
      >
        <span class="material-icons text-sm">add</span>
        {{ $t('settings.mealPlans.add') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="material-icons animate-spin text-4xl text-indigo-600">refresh</span>
    </div>

    <!-- Meal Plans List -->
    <div v-else class="space-y-3">
      <div
        v-for="mealPlan in mealPlans"
        :key="mealPlan._id"
        class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600"
      >
        <div
          class="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0"
        >
          <span class="material-icons text-orange-600 dark:text-orange-400 text-xl"
            >restaurant</span
          >
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h4 class="font-semibold text-gray-900 dark:text-white truncate">
              {{ localizedText(mealPlan.name) }}
            </h4>
            <span
              class="px-2 py-0.5 text-xs font-medium rounded bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300"
            >
              {{ mealPlan.code }}
            </span>
            <span
              class="px-2 py-0.5 text-xs font-medium rounded-full"
              :class="
                mealPlan.status === 'active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-slate-600 dark:text-slate-400'
              "
            >
              {{ mealPlan.status === 'active' ? $t('common.active') : $t('common.inactive') }}
            </span>
          </div>
          <div class="flex items-center gap-3 mt-1">
            <span
              v-if="mealPlan.includedMeals?.drinks && mealPlan.includedMeals?.snacks"
              class="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
            >
              <span class="material-icons text-xs">star</span>
              {{ $t('settings.mealPlans.allInclusive') }}
            </span>
            <span
              v-if="mealPlan.includedMeals?.breakfast"
              class="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            >
              {{ $t('settings.mealPlans.breakfast') }}
            </span>
            <span
              v-if="mealPlan.includedMeals?.lunch"
              class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            >
              {{ $t('settings.mealPlans.lunch') }}
            </span>
            <span
              v-if="mealPlan.includedMeals?.dinner"
              class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            >
              {{ $t('settings.mealPlans.dinner') }}
            </span>
            <span
              v-if="
                !mealPlan.includedMeals?.breakfast &&
                !mealPlan.includedMeals?.lunch &&
                !mealPlan.includedMeals?.dinner
              "
              class="text-xs text-gray-500 dark:text-slate-400"
            >
              {{ $t('settings.mealPlans.roomOnly') }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            @click="editMealPlan(mealPlan)"
          >
            <span class="material-icons text-lg">edit</span>
          </button>
          <button
            class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            @click="confirmDelete(mealPlan)"
          >
            <span class="material-icons text-lg">delete</span>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="mealPlans.length === 0" class="text-center py-12">
        <span class="material-icons text-5xl text-gray-300 dark:text-slate-600">restaurant</span>
        <h4 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          {{ $t('settings.mealPlans.noMealPlans') }}
        </h4>
        <p class="mt-2 text-sm text-gray-500 dark:text-slate-400">
          {{ $t('settings.mealPlans.noMealPlansDesc') }}
        </p>
        <button
          class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          @click="showCreateModal = true"
        >
          <span class="material-icons text-sm">add</span>
          {{ $t('settings.mealPlans.addFirst') }}
        </button>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModal || showEditModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      >
        <div
          class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ showEditModal ? $t('settings.mealPlans.edit') : $t('settings.mealPlans.new') }}
            </h3>
            <button
              class="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
              @click="closeModals"
            >
              <span class="material-icons text-gray-500">close</span>
            </button>
          </div>

          <form class="p-6 space-y-4" @submit.prevent="saveMealPlan">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('settings.mealPlans.name') }} *
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  :placeholder="$t('settings.mealPlans.namePlaceholder')"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('settings.mealPlans.code') }} *
                </label>
                <input
                  v-model="form.code"
                  type="text"
                  required
                  maxlength="10"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 uppercase"
                  placeholder="BB, HB, FB"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('common.description') }}
              </label>
              <textarea
                v-model="form.description"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                {{ $t('settings.mealPlans.includedMeals') }}
              </label>
              <div class="space-y-2">
                <label
                  class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <input
                    v-model="form.includesBreakfast"
                    type="checkbox"
                    class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span class="material-icons text-yellow-500 text-lg">free_breakfast</span>
                  <span class="text-sm text-gray-700 dark:text-slate-300">{{
                    $t('settings.mealPlans.breakfast')
                  }}</span>
                </label>

                <label
                  class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <input
                    v-model="form.includesLunch"
                    type="checkbox"
                    class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span class="material-icons text-green-500 text-lg">lunch_dining</span>
                  <span class="text-sm text-gray-700 dark:text-slate-300">{{
                    $t('settings.mealPlans.lunch')
                  }}</span>
                </label>

                <label
                  class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <input
                    v-model="form.includesDinner"
                    type="checkbox"
                    class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span class="material-icons text-blue-500 text-lg">dinner_dining</span>
                  <span class="text-sm text-gray-700 dark:text-slate-300">{{
                    $t('settings.mealPlans.dinner')
                  }}</span>
                </label>

                <label
                  class="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800"
                >
                  <input
                    v-model="form.allInclusive"
                    type="checkbox"
                    class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span class="material-icons text-purple-500 text-lg">star</span>
                  <span class="text-sm font-medium text-purple-700 dark:text-purple-300">{{
                    $t('settings.mealPlans.allInclusive')
                  }}</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('common.status') }}
              </label>
              <select
                v-model="form.status"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">{{ $t('common.active') }}</option>
                <option value="inactive">{{ $t('common.inactive') }}</option>
              </select>
            </div>

            <div
              v-if="formError"
              class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p class="text-sm text-red-600 dark:text-red-400">{{ formError }}</p>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button
                type="button"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                @click="closeModals"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
                {{ showEditModal ? $t('common.save') : $t('common.create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      >
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
          <div class="text-center">
            <div
              class="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-red-600 dark:text-red-400">delete</span>
            </div>
            <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t('settings.mealPlans.deleteTitle') }}
            </h3>
            <p class="mt-2 text-sm text-gray-500 dark:text-slate-400">
              {{
                $t('settings.mealPlans.deleteConfirm', {
                  name: localizedText(mealPlanToDelete?.name)
                })
              }}
            </p>
          </div>
          <div class="flex items-center gap-3 mt-6">
            <button
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
              @click="showDeleteModal = false"
            >
              {{ $t('common.cancel') }}
            </button>
            <button
              :disabled="deleting"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              @click="deleteMealPlanConfirm"
            >
              <span v-if="deleting" class="material-icons animate-spin text-sm">refresh</span>
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import * as roomService from '@/services/pms/roomService'
import { usePmsStore } from '@/stores/pms'

const { t, locale } = useI18n()
const toast = useToast()
const pmsStore = usePmsStore()
const hotelId = computed(() => pmsStore.hotelId)

// Helper: Extract localized text from multilingual object
const localizedText = obj => {
  if (!obj || typeof obj === 'string') return obj || ''
  return (
    obj[locale.value] ||
    obj.tr ||
    obj.en ||
    Object.values(obj).find(v => typeof v === 'string' && v) ||
    ''
  )
}

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const mealPlans = ref([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingMealPlan = ref(null)
const mealPlanToDelete = ref(null)
const formError = ref('')

const defaultForm = {
  name: '',
  code: '',
  description: '',
  includesBreakfast: false,
  includesLunch: false,
  includesDinner: false,
  allInclusive: false,
  status: 'active'
}

const form = ref({ ...defaultForm })

const fetchMealPlans = async () => {
  loading.value = true
  try {
    const response = await roomService.getMealPlans(hotelId.value)
    mealPlans.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch meal plans:', error)
    toast.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

const editMealPlan = mealPlan => {
  editingMealPlan.value = mealPlan
  form.value = {
    name: localizedText(mealPlan.name),
    code: mealPlan.code || '',
    description: localizedText(mealPlan.description),
    includesBreakfast: mealPlan.includedMeals?.breakfast || false,
    includesLunch: mealPlan.includedMeals?.lunch || false,
    includesDinner: mealPlan.includedMeals?.dinner || false,
    allInclusive: !!(mealPlan.includedMeals?.drinks && mealPlan.includedMeals?.snacks),
    status: mealPlan.status || 'active'
  }
  showEditModal.value = true
}

const confirmDelete = mealPlan => {
  mealPlanToDelete.value = mealPlan
  showDeleteModal.value = true
}

const buildPayload = () => {
  const existing = editingMealPlan.value
  return {
    name: { ...(existing?.name || {}), [locale.value]: form.value.name },
    code: form.value.code,
    description: { ...(existing?.description || {}), [locale.value]: form.value.description },
    includedMeals: {
      ...(existing?.includedMeals || {}),
      breakfast: form.value.includesBreakfast,
      lunch: form.value.includesLunch,
      dinner: form.value.includesDinner,
      snacks: form.value.allInclusive,
      drinks: form.value.allInclusive
    },
    status: form.value.status
  }
}

const saveMealPlan = async () => {
  if (!form.value.name || !form.value.code) return

  saving.value = true
  formError.value = ''

  try {
    const payload = buildPayload()
    if (showEditModal.value && editingMealPlan.value) {
      await roomService.updateMealPlan(hotelId.value, editingMealPlan.value._id, payload)
      toast.success(t('settings.mealPlans.updated'))
    } else {
      await roomService.createMealPlan(hotelId.value, payload)
      toast.success(t('settings.mealPlans.created'))
    }
    await fetchMealPlans()
    closeModals()
  } catch (error) {
    formError.value = error.response?.data?.message || t('common.error')
  } finally {
    saving.value = false
  }
}

const deleteMealPlanConfirm = async () => {
  if (!mealPlanToDelete.value) return

  deleting.value = true
  try {
    await roomService.deleteMealPlan(hotelId.value, mealPlanToDelete.value._id)
    toast.success(t('settings.mealPlans.deleted'))
    await fetchMealPlans()
    showDeleteModal.value = false
    mealPlanToDelete.value = null
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.error'))
  } finally {
    deleting.value = false
  }
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingMealPlan.value = null
  formError.value = ''
  form.value = { ...defaultForm }
}

onMounted(fetchMealPlans)
</script>
