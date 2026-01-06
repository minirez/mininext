<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <span class="material-icons text-orange-600">folder</span>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
        {{ $t('agencies.documentsTab') }}
      </h3>
    </div>
    <div v-if="isEditing && selectedAgency">
      <DocumentUpload
        :partner-id="selectedAgency._id"
        :documents="selectedAgency.documents"
        :uploading="uploading"
        base-url="/agencies"
        @upload="$emit('upload', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
    <div v-else class="text-center py-12 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
      <span class="material-icons text-5xl text-gray-300 dark:text-slate-600 mb-3"
        >description</span
      >
      <p class="text-gray-500 dark:text-slate-400">
        {{ $t('agencies.saveFirstForDocuments') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import DocumentUpload from '@/components/DocumentUpload.vue'

defineProps({
  isEditing: { type: Boolean, default: false },
  selectedAgency: { type: Object, default: null },
  uploading: { type: Boolean, default: false }
})

defineEmits(['upload', 'delete'])
</script>
