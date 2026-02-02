<template>
  <Modal :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" :title="$t('website.presets.saveCurrent') || 'Save Preset'" size="sm" :closable="true">
    <div class="space-y-3">
      <label class="block text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('website.presets.name') || 'Preset name' }}</label>
      <input v-model="name" type="text" class="form-input w-full" :placeholder="$t('website.presets.enterName') || 'Enter preset name'"
        @keyup.enter="save" ref="input" />
    </div>
    <template #footer>
      <button class="btn-secondary" @click="$emit('update:modelValue', false)">{{ $t('common.cancel') }}</button>
      <button class="btn-primary" @click="save">{{ $t('common.save') }}</button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import Modal from '@/components/ui/overlay/Modal.vue'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'save'])

const name = ref('')
const input = ref(null)

watch(() => props.modelValue, async v => {
  if (v) { name.value = ''; await nextTick(); input.value?.focus() }
})

const save = () => {
  if (name.value.trim()) {
    emit('save', name.value.trim())
    emit('update:modelValue', false)
  }
}
</script>
