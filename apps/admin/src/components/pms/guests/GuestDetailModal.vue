<template>
  <div>
    <Modal
      v-model="show"
      :title="`${t('guests.detail.title')} - ${guest?.firstName} ${guest?.lastName}`"
      size="xl"
      @close="close"
    >
      <div v-if="guest" class="space-y-6">
        <!-- Tabs -->
        <div class="border-b border-gray-200 dark:border-slate-700">
          <nav class="flex -mb-px">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
              :class="
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              "
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'" class="space-y-4">
          <!-- Header with VIP & Blacklist -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                :class="guest.isBlacklisted ? 'bg-red-500' : 'bg-indigo-500'"
              >
                {{ getInitials(guest) }}
              </div>
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ guest.firstName }} {{ guest.lastName }}
                </h3>
                <div class="flex items-center gap-2 mt-1">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :class="getVipClasses(guest.vipLevel)"
                  >
                    {{ getVipLabel(guest.vipLevel) }}
                  </span>
                  <span
                    v-if="guest.isBlacklisted"
                    class="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"
                  >
                    {{ t('guests.detail.blacklisted') }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
                @click="showVipModal = true"
              >
                {{ t('guests.detail.setVip') }}
              </button>
              <button
                v-if="!guest.isBlacklisted"
                class="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20"
                @click="showBlacklistModal = true"
              >
                {{ t('guests.detail.addToBlacklist') }}
              </button>
              <button
                v-else
                class="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                @click="removeFromBlacklist"
              >
                {{ t('guests.detail.removeFromBlacklist') }}
              </button>
            </div>
          </div>

          <!-- Info Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
              <h4 class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-3">
                {{ t('guests.detail.personalInfo') }}
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">{{
                    t('guests.detail.fields.dateOfBirth')
                  }}</span>
                  <span class="text-gray-900 dark:text-white">{{
                    guest.dateOfBirth ? formatDate(guest.dateOfBirth) : '-'
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">{{
                    t('guests.detail.fields.nationality')
                  }}</span>
                  <span class="text-gray-900 dark:text-white">{{ guest.nationality || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">{{
                    t('guests.detail.fields.idType')
                  }}</span>
                  <span class="text-gray-900 dark:text-white">{{
                    getIdTypeLabel(guest.idType)
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">{{
                    t('guests.detail.fields.idNumber')
                  }}</span>
                  <span class="text-gray-900 dark:text-white">{{ guest.idNumber || '-' }}</span>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
              <h4 class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-3">
                {{ t('guests.detail.contact') }}
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">{{
                    t('guests.detail.fields.phone')
                  }}</span>
                  <span class="text-gray-900 dark:text-white">{{ guest.phone || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">{{
                    t('guests.detail.fields.email')
                  }}</span>
                  <span class="text-gray-900 dark:text-white truncate max-w-[200px]">{{
                    guest.email || '-'
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">{{
                    t('guests.detail.fields.whatsapp')
                  }}</span>
                  <span class="text-gray-900 dark:text-white">{{ guest.whatsapp || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistics -->
          <div class="border border-gray-200 dark:border-slate-600 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {{ t('guests.detail.statistics') }}
            </h4>
            <div class="grid grid-cols-5 gap-4 text-center">
              <div>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ guest.statistics?.totalStays || 0 }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">
                  {{ t('guests.detail.stats.stays') }}
                </p>
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ guest.statistics?.totalNights || 0 }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">
                  {{ t('guests.detail.stats.nights') }}
                </p>
              </div>
              <div>
                <p class="text-2xl font-bold text-green-600">
                  {{ formatCurrency(guest.statistics?.totalSpent) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">
                  {{ t('guests.detail.stats.spent') }}
                </p>
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ guest.statistics?.averageStayLength?.toFixed(1) || 0 }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">
                  {{ t('guests.detail.stats.avgNights') }}
                </p>
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{
                    guest.statistics?.firstStayDate
                      ? formatDate(guest.statistics.firstStayDate)
                      : '-'
                  }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">
                  {{ t('guests.detail.stats.firstStay') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Tags -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t('guests.detail.tags') }}
              </h4>
              <button
                class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                @click="showTagsModal = true"
              >
                {{ t('common.edit') }}
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in guest.tags"
                :key="tag"
                class="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded text-sm"
              >
                {{ tag }}
              </span>
              <span v-if="!guest.tags?.length" class="text-sm text-gray-400">{{
                t('guests.detail.noTags')
              }}</span>
            </div>
          </div>
        </div>

        <!-- Stay History Tab -->
        <div v-if="activeTab === 'stays'" class="space-y-4">
          <div v-if="loadingStays" class="text-center py-8">
            <div
              class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"
            ></div>
          </div>
          <div
            v-else-if="stayHistory.length === 0"
            class="text-center py-8 text-gray-500 dark:text-slate-400"
          >
            {{ t('guests.detail.noStayHistory') }}
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="stay in stayHistory"
              :key="stay._id"
              class="border border-gray-200 dark:border-slate-600 rounded-lg p-4"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ t('guests.detail.room') }} {{ stay.room?.roomNumber }} -
                    {{ stay.roomType?.name?.tr || stay.roomType?.code }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-slate-400">
                    {{ formatDate(stay.checkInDate) }} - {{ formatDate(stay.checkOutDate) }} ({{
                      stay.nights
                    }}
                    {{ t('guests.detail.nightsLabel') }})
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ formatCurrency(stay.totalAmount) }}
                  </p>
                  <span
                    class="px-2 py-0.5 rounded text-xs"
                    :class="
                      stay.status === 'checked_out'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-green-100 text-green-600'
                    "
                  >
                    {{
                      stay.status === 'checked_out'
                        ? t('guests.detail.checkedOut')
                        : t('guests.detail.active')
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes Tab -->
        <div v-if="activeTab === 'notes'" class="space-y-4">
          <!-- Add Note Form -->
          <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {{ t('guests.detail.addNote') }}
            </h4>
            <div class="flex gap-3">
              <textarea
                v-model="noteForm.content"
                rows="2"
                :placeholder="t('guests.detail.notePlaceholder')"
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm"
              ></textarea>
              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input v-model="noteForm.isImportant" type="checkbox" class="rounded" />
                  {{ t('guests.detail.important') }}
                </label>
                <button
                  :disabled="!noteForm.content"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
                  @click="addNote"
                >
                  {{ t('common.add') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Notes List -->
          <div v-if="guest.notes?.length > 0" class="space-y-3">
            <div
              v-for="note in guest.notes"
              :key="note._id"
              class="rounded-lg p-3"
              :class="
                note.isImportant
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                  : 'bg-gray-50 dark:bg-slate-700'
              "
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <p class="text-sm text-gray-900 dark:text-white">{{ note.content }}</p>
                  <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {{ formatDateTime(note.createdAt) }}
                    <span v-if="note.isImportant" class="ml-2 text-yellow-600">{{
                      t('guests.detail.important')
                    }}</span>
                  </p>
                </div>
                <button class="p-1 text-gray-400 hover:text-red-500" @click="deleteNote(note._id)">
                  <span class="material-icons text-sm">delete</span>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
            {{ t('guests.detail.noNotes') }}
          </div>
        </div>

        <!-- Preferences Tab -->
        <div v-if="activeTab === 'preferences'" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
              <h4 class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-3">
                {{ t('guests.detail.roomPreferences') }}
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">{{
                    t('guests.detail.prefs.floorPreference')
                  }}</span>
                  <span class="text-gray-900 dark:text-white">{{
                    getFloorPref(guest.preferences?.floorPreference)
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">{{
                    t('guests.detail.prefs.bedType')
                  }}</span>
                  <span class="text-gray-900 dark:text-white">{{
                    getBedPref(guest.preferences?.bedType)
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">{{
                    t('guests.detail.prefs.smokingRoom')
                  }}</span>
                  <span class="text-gray-900 dark:text-white">{{
                    guest.preferences?.smokingRoom ? t('common.yes') : t('common.no')
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-slate-400">{{
                    t('guests.detail.prefs.quietRoom')
                  }}</span>
                  <span class="text-gray-900 dark:text-white">{{
                    guest.preferences?.quietRoom ? t('common.yes') : t('common.no')
                  }}</span>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
              <h4 class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-3">
                {{ t('guests.detail.other') }}
              </h4>
              <div class="space-y-2 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-slate-400 block mb-1">{{
                    t('guests.detail.prefs.allergies')
                  }}</span>
                  <span class="text-gray-900 dark:text-white">{{
                    guest.preferences?.allergies?.join(', ') || '-'
                  }}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-slate-400 block mb-1">{{
                    t('guests.detail.prefs.diet')
                  }}</span>
                  <span class="text-gray-900 dark:text-white">{{
                    guest.preferences?.dietaryRestrictions?.join(', ') || '-'
                  }}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-slate-400 block mb-1">{{
                    t('guests.detail.prefs.specialRequests')
                  }}</span>
                  <span class="text-gray-900 dark:text-white">{{
                    guest.preferences?.specialRequests || '-'
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button
          class="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
          @click="showEditModal = true"
        >
          {{ t('common.edit') }}
        </button>
        <button
          class="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600"
          @click="close"
        >
          {{ t('common.close') }}
        </button>
      </template>
    </Modal>

    <!-- VIP Modal - Outside main modal -->
    <Modal v-model="showVipModal" :title="t('guests.detail.vipLevel')" size="sm">
      <div class="space-y-3">
        <label
          v-for="level in vipLevels"
          :key="level.value"
          class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer"
          :class="
            selectedVipLevel === level.value
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-slate-600'
          "
        >
          <input v-model="selectedVipLevel" type="radio" :value="level.value" class="hidden" />
          <span class="material-icons" :class="level.iconColor">{{ level.icon }}</span>
          <span class="text-gray-900 dark:text-white">{{ level.label }}</span>
        </label>
      </div>
      <template #footer>
        <button class="px-4 py-2 text-gray-600 dark:text-gray-400" @click="showVipModal = false">
          {{ t('common.cancel') }}
        </button>
        <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg" @click="saveVipLevel">
          {{ t('common.save') }}
        </button>
      </template>
    </Modal>

    <!-- Blacklist Modal - Outside main modal -->
    <Modal v-model="showBlacklistModal" :title="t('guests.detail.addToBlacklist')" size="sm">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >{{ t('guests.detail.reason') }} *</label
        >
        <textarea
          v-model="blacklistReason"
          rows="3"
          :placeholder="t('guests.detail.blacklistReasonPlaceholder')"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
        ></textarea>
      </div>
      <template #footer>
        <button
          class="px-4 py-2 text-gray-600 dark:text-gray-400"
          @click="showBlacklistModal = false"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          :disabled="!blacklistReason"
          class="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
          @click="addToBlacklist"
        >
          {{ t('guests.detail.addToBlacklist') }}
        </button>
      </template>
    </Modal>

    <!-- Tags Modal - Outside main modal -->
    <Modal v-model="showTagsModal" :title="t('guests.detail.editTags')" size="sm">
      <div class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in commonTags"
            :key="tag"
            class="px-3 py-1.5 rounded-lg text-sm border"
            :class="
              selectedTags.includes(tag)
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300'
            "
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
        <input
          v-model="newTag"
          type="text"
          :placeholder="t('guests.detail.customTagPlaceholder')"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
          @keyup.enter="addCustomTag"
        />
      </div>
      <template #footer>
        <button class="px-4 py-2 text-gray-600 dark:text-gray-400" @click="showTagsModal = false">
          {{ t('common.cancel') }}
        </button>
        <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg" @click="saveTags">
          {{ t('common.save') }}
        </button>
      </template>
    </Modal>

    <!-- Edit Guest Modal - Outside main modal -->
    <AddGuestModal
      v-model="showEditModal"
      :hotel-id="hotelId"
      :guest="guest"
      @updated="onGuestEdited"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import AddGuestModal from '@/components/pms/guests/AddGuestModal.vue'
import guestService, { VIP_LEVEL_INFO, ID_TYPES, COMMON_TAGS } from '@/services/pms/guestService'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  hotelId: { type: String, default: '' },
  guest: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const { t, locale } = useI18n()
const toast = useToast()
const localeMap = { tr: 'tr-TR', en: 'en-US' }
const activeTab = ref('profile')
const loadingStays = ref(false)
const stayHistory = ref([])

const showVipModal = ref(false)
const showBlacklistModal = ref(false)
const showTagsModal = ref(false)
const showEditModal = ref(false)

const selectedVipLevel = ref('none')
const blacklistReason = ref('')
const selectedTags = ref([])
const newTag = ref('')

const noteForm = ref({ content: '', isImportant: false })

const commonTags = COMMON_TAGS

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const tabs = computed(() => [
  { key: 'profile', label: t('guests.detail.tabs.profile') },
  { key: 'stays', label: t('guests.detail.tabs.stayHistory') },
  { key: 'notes', label: t('guests.detail.tabs.notes') },
  { key: 'preferences', label: t('guests.detail.tabs.preferences') }
])

const vipLevels = computed(() => [
  { value: 'none', label: t('guests.vipLevels.none'), icon: 'person', iconColor: 'text-gray-400' },
  {
    value: 'silver',
    label: t('guests.vipLevels.silver'),
    icon: 'star_half',
    iconColor: 'text-slate-400'
  },
  { value: 'gold', label: t('guests.vipLevels.gold'), icon: 'star', iconColor: 'text-yellow-500' },
  {
    value: 'platinum',
    label: t('guests.vipLevels.platinum'),
    icon: 'workspace_premium',
    iconColor: 'text-purple-500'
  }
])

const fetchStayHistory = async () => {
  if (!props.hotelId || !props.guest?._id) return
  loadingStays.value = true
  try {
    const response = await guestService.getStayHistory(props.hotelId, props.guest._id)
    stayHistory.value = response.data || []
  } catch (error) {
    console.error(error)
  } finally {
    loadingStays.value = false
  }
}

const saveVipLevel = async () => {
  try {
    await guestService.setVipLevel(props.hotelId, props.guest._id, selectedVipLevel.value)
    toast.success(t('guests.messages.vipUpdated'))
    showVipModal.value = false
    emit('updated')
  } catch {
    toast.error(t('guests.messages.vipUpdateError'))
  }
}

const addToBlacklist = async () => {
  if (!blacklistReason.value) return
  try {
    await guestService.blacklist(props.hotelId, props.guest._id, blacklistReason.value)
    toast.success(t('guests.messages.addedToBlacklist'))
    showBlacklistModal.value = false
    blacklistReason.value = ''
    emit('updated')
  } catch {
    toast.error(t('guests.messages.operationError'))
  }
}

const removeFromBlacklist = async () => {
  try {
    await guestService.removeFromBlacklist(props.hotelId, props.guest._id)
    toast.success(t('guests.messages.removedFromBlacklist'))
    emit('updated')
  } catch {
    toast.error(t('guests.messages.operationError'))
  }
}

const toggleTag = tag => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const addCustomTag = () => {
  if (newTag.value && !selectedTags.value.includes(newTag.value)) {
    selectedTags.value.push(newTag.value)
    newTag.value = ''
  }
}

const saveTags = async () => {
  try {
    await guestService.updateTags(props.hotelId, props.guest._id, selectedTags.value)
    toast.success(t('guests.messages.tagsUpdated'))
    showTagsModal.value = false
    emit('updated')
  } catch {
    toast.error(t('guests.messages.tagsUpdateError'))
  }
}

const addNote = async () => {
  if (!noteForm.value.content) return
  try {
    await guestService.addNote(props.hotelId, props.guest._id, noteForm.value)
    toast.success(t('guests.messages.noteAdded'))
    noteForm.value = { content: '', isImportant: false }
    emit('updated')
  } catch {
    toast.error(t('guests.messages.noteAddError'))
  }
}

const deleteNote = async noteId => {
  try {
    await guestService.deleteNote(props.hotelId, props.guest._id, noteId)
    toast.success(t('guests.messages.noteDeleted'))
    emit('updated')
  } catch {
    toast.error(t('guests.messages.noteDeleteError'))
  }
}

const onGuestEdited = () => {
  showEditModal.value = false
  emit('updated')
}

const getInitials = guest => {
  return ((guest?.firstName?.charAt(0) || '') + (guest?.lastName?.charAt(0) || '')).toUpperCase()
}

const getVipLabel = level => {
  const levelKey = level || 'none'
  return t(`guests.vipLevels.${levelKey}`)
}
const getVipClasses = level => {
  const info = VIP_LEVEL_INFO[level]
  return info ? `${info.bgColor} ${info.textColor}` : 'bg-gray-100 text-gray-600'
}

const getIdTypeLabel = type => {
  if (!type) return '-'
  return t(`guests.idTypes.${type}`)
}

const getFloorPref = pref => {
  if (!pref) return '-'
  return t(`guests.detail.floorPrefs.${pref}`)
}
const getBedPref = pref => {
  if (!pref) return '-'
  return t(`guests.detail.bedPrefs.${pref}`)
}

const formatDate = date =>
  date ? new Date(date).toLocaleDateString(localeMap[locale.value] || 'tr-TR') : '-'
const formatDateTime = date =>
  date ? new Date(date).toLocaleString(localeMap[locale.value] || 'tr-TR') : '-'
const formatCurrency = amount =>
  new Intl.NumberFormat(localeMap[locale.value] || 'tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount || 0)

const close = () => {
  show.value = false
  activeTab.value = 'profile'
}

watch(
  () => props.modelValue,
  val => {
    if (val && props.guest) {
      activeTab.value = 'profile'
      selectedVipLevel.value = props.guest.vipLevel || 'none'
      selectedTags.value = [...(props.guest.tags || [])]
      fetchStayHistory()
    }
  }
)
</script>
