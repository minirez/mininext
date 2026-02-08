<template>
  <div class="space-y-6">
    <!-- Special Requests -->
    <div class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
      <h3
        class="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2"
      >
        <span class="material-icons text-sm">star</span>
        {{ t('stayCard.specialRequests') }}
        <span class="text-xs font-normal text-amber-600 dark:text-amber-400"
          >({{ t('stayCard.notes.fromGuest') }})</span
        >
      </h3>

      <div v-if="!editingSpecialRequests">
        <p
          v-if="stay?.specialRequests"
          class="text-sm text-amber-700 dark:text-amber-400 whitespace-pre-wrap"
        >
          {{ stay.specialRequests }}
        </p>
        <p v-else class="text-sm text-amber-600/60 dark:text-amber-500/60 italic">
          {{ t('stayCard.notes.noSpecialRequests') }}
        </p>
        <button
          class="mt-2 text-xs text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
          @click="startEditSpecialRequests"
        >
          <span class="material-icons text-xs">edit</span>
          {{ t('common.edit') }}
        </button>
      </div>

      <div v-else>
        <textarea
          v-model="specialRequestsText"
          rows="3"
          class="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 resize-none"
          :placeholder="t('stayCard.notes.specialRequestsPlaceholder')"
        ></textarea>
        <div class="flex gap-2 mt-2">
          <button
            :disabled="saving"
            class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            @click="saveSpecialRequests"
          >
            <span v-if="saving" class="animate-spin material-icons text-xs">sync</span>
            <span class="material-icons text-xs" v-else>check</span>
            {{ t('common.save') }}
          </button>
          <button
            class="px-3 py-1.5 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-700 dark:text-white rounded-lg text-xs font-medium transition-colors"
            @click="cancelEditSpecialRequests"
          >
            {{ t('common.cancel') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Internal Notes -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span class="material-icons text-sm text-gray-500">notes</span>
        {{ t('stayCard.internalNotes') }}
        <span class="text-xs font-normal text-gray-500 dark:text-slate-400"
          >({{ t('stayCard.notes.staffNotes') }})</span
        >
      </h3>

      <!-- Add Note Form -->
      <div class="mb-4">
        <textarea
          v-model="newNote"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
          :placeholder="t('stayCard.notes.notePlaceholder')"
        ></textarea>
        <button
          :disabled="!newNote.trim() || saving"
          class="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
          @click="addNote"
        >
          <span v-if="saving" class="animate-spin material-icons text-xs">sync</span>
          <span class="material-icons text-xs" v-else>add</span>
          {{ t('stayCard.notes.addNote') }}
        </button>
      </div>

      <!-- Notes List -->
      <div v-if="notesArray.length" class="space-y-3">
        <div
          v-for="(note, index) in notesArray"
          :key="index"
          class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1">
              <p class="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {{ note.content || note }}
              </p>
              <p
                v-if="note.createdAt || note.date"
                class="text-xs text-gray-400 dark:text-slate-500 mt-1"
              >
                {{ formatDate(note.createdAt || note.date) }}
                <span v-if="note.createdBy"> - {{ note.createdBy }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-6 text-gray-500 dark:text-slate-400">
        <span class="material-icons text-3xl mb-2 opacity-50">notes</span>
        <p class="text-sm">{{ t('stayCard.notes.noNotes') }}</p>
      </div>
    </div>

    <!-- Quick Notes -->
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
      <h3
        class="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2"
      >
        <span class="material-icons text-sm">bolt</span>
        {{ t('stayCard.notes.quickNotes') }}
      </h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="quickNote in quickNotesList"
          :key="quickNote.key"
          class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium transition-colors"
          @click="addQuickNote(quickNote.text)"
        >
          {{ quickNote.text }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const props = defineProps({
  stay: Object,
  saving: Boolean
})

const emit = defineEmits(['update-notes'])

const editingSpecialRequests = ref(false)
const specialRequestsText = ref('')
const newNote = ref('')

const quickNoteKeys = [
  'roomCleaned',
  'guestComplaint',
  'earlyCheckout',
  'lateCheckout',
  'extraPillowGiven',
  'minibarRefilled',
  'technicalIssue',
  'vipService'
]

const quickNotesList = computed(() =>
  quickNoteKeys.map(key => ({
    key,
    text: t(`stayCard.notes.quickNoteOptions.${key}`)
  }))
)

const notesArray = computed(() => {
  if (!props.stay?.internalNotes) return []
  if (Array.isArray(props.stay.internalNotes)) {
    return props.stay.internalNotes
  }
  if (typeof props.stay.internalNotes === 'string') {
    return [{ content: props.stay.internalNotes }]
  }
  return []
})

const startEditSpecialRequests = () => {
  specialRequestsText.value = props.stay?.specialRequests || ''
  editingSpecialRequests.value = true
}

const cancelEditSpecialRequests = () => {
  editingSpecialRequests.value = false
  specialRequestsText.value = ''
}

const saveSpecialRequests = () => {
  emit('update-notes', specialRequestsText.value, props.stay?.internalNotes)
  editingSpecialRequests.value = false
}

const addNote = () => {
  if (!newNote.value.trim()) return

  const currentNotes = props.stay?.internalNotes || []
  const updatedNotes = Array.isArray(currentNotes)
    ? [...currentNotes, { content: newNote.value, date: new Date().toISOString() }]
    : [{ content: currentNotes }, { content: newNote.value, date: new Date().toISOString() }]

  emit('update-notes', props.stay?.specialRequests, updatedNotes)
  newNote.value = ''
}

const addQuickNote = note => {
  const currentNotes = props.stay?.internalNotes || []
  const updatedNotes = Array.isArray(currentNotes)
    ? [...currentNotes, { content: note, date: new Date().toISOString() }]
    : currentNotes
      ? [{ content: currentNotes }, { content: note, date: new Date().toISOString() }]
      : [{ content: note, date: new Date().toISOString() }]

  emit('update-notes', props.stay?.specialRequests, updatedNotes)
}

const localeMap = { tr: 'tr-TR', en: 'en-US' }

const formatDate = dateStr => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(localeMap[locale.value] || 'tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

watch(
  () => props.stay,
  () => {
    if (!editingSpecialRequests.value) {
      specialRequestsText.value = ''
    }
  }
)
</script>
