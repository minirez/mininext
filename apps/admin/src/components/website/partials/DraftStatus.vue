<template>
  <div v-if="dirty || saving || lastSave" class="flex items-center gap-2 text-sm">
    <span v-if="saving" class="flex items-center gap-1 text-gray-500">
      <span class="material-icons text-sm animate-spin">sync</span>{{ $t('website.draft.saving') }}
    </span>
    <span v-else-if="dirty" class="flex items-center gap-1 text-amber-600">
      <span class="material-icons text-sm">edit</span>{{ $t('website.draft.unsaved') }}
    </span>
    <span v-else-if="lastSave" class="flex items-center gap-1 text-green-600">
      <span class="material-icons text-sm">cloud_done</span>{{ $t('website.draft.saved') }}
    </span>
  </div>
</template>

<script setup>
defineProps({ dirty: Boolean, saving: Boolean, lastSave: [Date, Object] })
</script>
