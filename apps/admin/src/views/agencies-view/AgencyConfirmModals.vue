<template>
  <div>
    <!-- Delete Confirmation Modal -->
    <Modal
      :model-value="showDeleteModal"
      :title="$t('common.confirmDelete')"
      size="sm"
      @update:model-value="$emit('update:showDeleteModal', $event)"
    >
      <div class="text-center py-4">
        <div
          class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span class="material-icons text-3xl text-red-600">delete_forever</span>
        </div>
        <p class="text-gray-600 dark:text-slate-400">{{ $t('agencies.deleteConfirmation') }}</p>
        <p class="text-sm text-gray-500 dark:text-slate-500 mt-2">
          {{ selectedAgency?.companyName }}
        </p>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="$emit('update:showDeleteModal', false)">
          {{ $t('common.cancel') }}
        </button>
        <button :disabled="deleting" class="btn-danger" @click="$emit('delete')">
          <span v-if="deleting" class="material-icons animate-spin mr-2">sync</span>
          {{ $t('common.delete') }}
        </button>
      </template>
    </Modal>

    <!-- Approve Confirmation Modal -->
    <Modal
      :model-value="showApproveModal"
      :title="$t('agencies.approveAgency')"
      size="sm"
      @update:model-value="$emit('update:showApproveModal', $event)"
    >
      <div class="text-center py-4">
        <div
          class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span class="material-icons text-3xl text-green-600">check_circle</span>
        </div>
        <p class="text-gray-600 dark:text-slate-400">{{ $t('agencies.approveConfirmation') }}</p>
        <p class="text-sm text-gray-500 dark:text-slate-500 mt-2">
          {{ selectedAgency?.companyName }}
        </p>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="$emit('update:showApproveModal', false)">
          {{ $t('common.cancel') }}
        </button>
        <button
          :disabled="approving"
          class="btn-primary bg-green-600 hover:bg-green-700"
          @click="$emit('approve')"
        >
          <span v-if="approving" class="material-icons animate-spin mr-2">sync</span>
          {{ $t('agencies.approve') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import Modal from '@/components/common/Modal.vue'

defineProps({
  showDeleteModal: { type: Boolean, default: false },
  showApproveModal: { type: Boolean, default: false },
  selectedAgency: { type: Object, default: null },
  deleting: { type: Boolean, default: false },
  approving: { type: Boolean, default: false }
})

defineEmits(['update:showDeleteModal', 'update:showApproveModal', 'delete', 'approve'])
</script>
