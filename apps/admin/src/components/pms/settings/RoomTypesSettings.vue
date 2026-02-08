<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ $t('settings.roomTypes.title') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('settings.roomTypes.description') }}
        </p>
      </div>
      <button
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        @click="showCreateModal = true"
      >
        <span class="material-icons text-sm">add</span>
        {{ $t('settings.roomTypes.add') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="material-icons animate-spin text-4xl text-indigo-600">refresh</span>
    </div>

    <!-- Room Types List -->
    <div v-else class="space-y-3">
      <div
        v-for="roomType in roomTypes"
        :key="roomType._id"
        class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600"
      >
        <div
          class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0"
        >
          <span class="material-icons text-blue-600 dark:text-blue-400 text-xl">hotel</span>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h4 class="font-semibold text-gray-900 dark:text-white truncate">
              {{ localizedText(roomType.name) }}
            </h4>
            <span
              class="px-2 py-0.5 text-xs font-medium rounded bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300"
            >
              {{ roomType.code }}
            </span>
            <span
              class="px-2 py-0.5 text-xs font-medium rounded-full"
              :class="
                roomType.status === 'active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-slate-600 dark:text-slate-400'
              "
            >
              {{ roomType.status === 'active' ? $t('common.active') : $t('common.inactive') }}
            </span>
          </div>
          <div class="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-slate-400">
            <span class="flex items-center gap-1">
              <span class="material-icons text-xs">people</span>
              {{ $t('settings.roomTypes.maxOccupancy') }}:
              {{ roomType.occupancy?.totalMaxGuests || roomType.occupancy?.maxAdults || '-' }}
            </span>
            <span v-if="roomType.bedConfiguration?.length" class="flex items-center gap-1">
              <span class="material-icons text-xs">bed</span>
              {{ roomType.bedConfiguration.map(b => b.type).join(', ') }}
            </span>
            <span v-if="roomType.size" class="flex items-center gap-1">
              <span class="material-icons text-xs">square_foot</span>
              {{ roomType.size }} m²
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            @click="editRoomType(roomType)"
          >
            <span class="material-icons text-lg">edit</span>
          </button>
          <button
            class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            @click="confirmDelete(roomType)"
          >
            <span class="material-icons text-lg">delete</span>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="roomTypes.length === 0" class="text-center py-12">
        <span class="material-icons text-5xl text-gray-300 dark:text-slate-600">hotel</span>
        <h4 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          {{ $t('settings.roomTypes.noRoomTypes') }}
        </h4>
        <p class="mt-2 text-sm text-gray-500 dark:text-slate-400">
          {{ $t('settings.roomTypes.noRoomTypesDesc') }}
        </p>
        <button
          class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          @click="showCreateModal = true"
        >
          <span class="material-icons text-sm">add</span>
          {{ $t('settings.roomTypes.addFirst') }}
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
          class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        >
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ showEditModal ? $t('settings.roomTypes.edit') : $t('settings.roomTypes.new') }}
            </h3>
            <button
              class="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
              @click="closeModals"
            >
              <span class="material-icons text-gray-500">close</span>
            </button>
          </div>

          <form class="p-6 space-y-4" @submit.prevent="saveRoomType">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('settings.roomTypes.name') }} *
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  :placeholder="$t('settings.roomTypes.namePlaceholder')"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('settings.roomTypes.code') }}
                </label>
                <input
                  v-model="form.code"
                  type="text"
                  maxlength="10"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 uppercase"
                  placeholder="STD"
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

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('settings.roomTypes.maxOccupancy') }}
                </label>
                <input
                  v-model.number="form.maxOccupancy"
                  type="number"
                  min="1"
                  max="20"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('settings.roomTypes.baseOccupancy') }}
                </label>
                <input
                  v-model.number="form.baseOccupancy"
                  type="number"
                  min="1"
                  max="20"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('settings.roomTypes.maxAdults') }}
                </label>
                <input
                  v-model.number="form.maxAdults"
                  type="number"
                  min="1"
                  max="10"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('settings.roomTypes.maxChildren') }}
                </label>
                <input
                  v-model.number="form.maxChildren"
                  type="number"
                  min="0"
                  max="10"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('settings.roomTypes.bedType') }}
                </label>
                <select
                  v-model="form.bedType"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{{ $t('common.select') }}</option>
                  <option value="single">{{ $t('settings.roomTypes.bedTypes.single') }}</option>
                  <option value="double">{{ $t('settings.roomTypes.bedTypes.double') }}</option>
                  <option value="twin">{{ $t('settings.roomTypes.bedTypes.twin') }}</option>
                  <option value="queen">{{ $t('settings.roomTypes.bedTypes.queen') }}</option>
                  <option value="king">{{ $t('settings.roomTypes.bedTypes.king') }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('settings.roomTypes.size') }} (m²)
                </label>
                <input
                  v-model.number="form.size"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
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
              {{ $t('settings.roomTypes.deleteTitle') }}
            </h3>
            <p class="mt-2 text-sm text-gray-500 dark:text-slate-400">
              {{
                $t('settings.roomTypes.deleteConfirm', {
                  name: localizedText(roomTypeToDelete?.name)
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
              @click="deleteRoomTypeConfirm"
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
const roomTypes = ref([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingRoomType = ref(null)
const roomTypeToDelete = ref(null)
const formError = ref('')

const defaultForm = {
  name: '',
  code: '',
  description: '',
  maxOccupancy: 2,
  maxAdults: 2,
  maxChildren: 1,
  baseOccupancy: 2,
  bedType: '',
  size: null,
  status: 'active'
}

const form = ref({ ...defaultForm })

const fetchRoomTypes = async () => {
  loading.value = true
  try {
    const response = await roomService.getRoomTypes(hotelId.value)
    roomTypes.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch room types:', error)
    toast.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

const editRoomType = roomType => {
  editingRoomType.value = roomType
  form.value = {
    name: localizedText(roomType.name),
    code: roomType.code || '',
    description: localizedText(roomType.description),
    maxOccupancy: roomType.occupancy?.totalMaxGuests || roomType.occupancy?.maxAdults || 2,
    maxAdults: roomType.occupancy?.maxAdults || 2,
    maxChildren: roomType.occupancy?.maxChildren || 1,
    baseOccupancy: roomType.occupancy?.baseOccupancy || 2,
    bedType: roomType.bedConfiguration?.[0]?.type || '',
    size: roomType.size || null,
    status: roomType.status || 'active'
  }
  showEditModal.value = true
}

const confirmDelete = roomType => {
  roomTypeToDelete.value = roomType
  showDeleteModal.value = true
}

const buildPayload = () => {
  const existing = editingRoomType.value
  return {
    name: { ...(existing?.name || {}), [locale.value]: form.value.name },
    code: form.value.code,
    description: { ...(existing?.description || {}), [locale.value]: form.value.description },
    occupancy: {
      ...(existing?.occupancy || {}),
      maxAdults: form.value.maxAdults,
      maxChildren: form.value.maxChildren,
      totalMaxGuests: form.value.maxOccupancy,
      baseOccupancy: form.value.baseOccupancy
    },
    bedConfiguration: form.value.bedType ? [{ type: form.value.bedType, quantity: 1 }] : [],
    size: form.value.size,
    status: form.value.status
  }
}

const saveRoomType = async () => {
  if (!form.value.name) return

  saving.value = true
  formError.value = ''

  try {
    const payload = buildPayload()
    if (showEditModal.value && editingRoomType.value) {
      await roomService.updateRoomType(hotelId.value, editingRoomType.value._id, payload)
      toast.success(t('settings.roomTypes.updated'))
    } else {
      await roomService.createRoomType(hotelId.value, payload)
      toast.success(t('settings.roomTypes.created'))
    }
    await fetchRoomTypes()
    closeModals()
  } catch (error) {
    formError.value = error.response?.data?.message || t('common.error')
  } finally {
    saving.value = false
  }
}

const deleteRoomTypeConfirm = async () => {
  if (!roomTypeToDelete.value) return

  deleting.value = true
  try {
    await roomService.deleteRoomType(hotelId.value, roomTypeToDelete.value._id)
    toast.success(t('settings.roomTypes.deleted'))
    await fetchRoomTypes()
    showDeleteModal.value = false
    roomTypeToDelete.value = null
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.error'))
  } finally {
    deleting.value = false
  }
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingRoomType.value = null
  formError.value = ''
  form.value = { ...defaultForm }
}

onMounted(fetchRoomTypes)
</script>
