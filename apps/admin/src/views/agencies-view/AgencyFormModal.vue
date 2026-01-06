<template>
  <Modal
    :model-value="modelValue"
    :title="isEditing ? $t('agencies.editAgency') : $t('agencies.addAgency')"
    size="xl"
    :close-on-overlay="false"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="flex flex-col h-[600px] -mx-6 -my-4">
      <!-- Tabs Header -->
      <div
        class="flex-shrink-0 border-b border-gray-200 dark:border-slate-700 px-6 bg-gray-50 dark:bg-slate-700/50"
      >
        <nav class="flex gap-1 overflow-x-auto py-2 -mb-px">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap border-b-2 -mb-[2px]"
            :class="
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border-transparent hover:border-gray-300'
            "
            @click="$emit('update:activeTab', tab.id)"
          >
            <span class="material-icons text-lg">{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
            <span
              v-if="tab.id === 'basic' && hasBasicErrors"
              class="w-2 h-2 bg-red-500 rounded-full"
            ></span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Tab 1: Basic Info & Address -->
        <AgencyBasicTab v-show="activeTab === 'basic'" :form="form" :errors="errors" />

        <!-- Tab 2: Commission & Credit -->
        <AgencyFinanceTab v-show="activeTab === 'finance'" :form="form" />

        <!-- Tab 3: Sales Restrictions -->
        <AgencySalesTab
          v-show="activeTab === 'sales'"
          :form="form"
          :hotels="hotels"
          :selected-country-to-add="selectedCountryToAdd"
          :get-country-label="getCountryLabel"
          @add-country="$emit('add-country', $event)"
          @remove-country="$emit('remove-country', $event)"
        />

        <!-- Tab 4: Payment Methods -->
        <AgencyPaymentTab
          v-show="activeTab === 'payment'"
          :form="form"
          @toggle-payment="$emit('toggle-payment', $event)"
        />

        <!-- Tab 5: Documents -->
        <AgencyDocumentsTab
          v-show="activeTab === 'documents'"
          :is-editing="isEditing"
          :selected-agency="selectedAgency"
          :uploading="uploading"
          @upload="$emit('upload', $event)"
          @delete="$emit('delete', $event)"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <button type="button" class="btn-secondary" @click="$emit('update:modelValue', false)">
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          :disabled="submitting"
          class="btn-primary min-w-[120px]"
          @click="$emit('submit')"
        >
          <span v-if="submitting" class="material-icons animate-spin mr-2 text-lg">sync</span>
          {{
            submitting ? $t('common.saving') : isEditing ? $t('common.save') : $t('common.create')
          }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import Modal from '@/components/common/Modal.vue'
import AgencyBasicTab from './tabs/AgencyBasicTab.vue'
import AgencyFinanceTab from './tabs/AgencyFinanceTab.vue'
import AgencySalesTab from './tabs/AgencySalesTab.vue'
import AgencyPaymentTab from './tabs/AgencyPaymentTab.vue'
import AgencyDocumentsTab from './tabs/AgencyDocumentsTab.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  isEditing: { type: Boolean, default: false },
  activeTab: { type: String, default: 'basic' },
  tabs: { type: Array, required: true },
  hasBasicErrors: { type: Boolean, default: false },
  form: { type: Object, required: true },
  errors: { type: Object, required: true },
  hotels: { type: Array, default: () => [] },
  selectedAgency: { type: Object, default: null },
  selectedCountryToAdd: { type: String, default: '' },
  submitting: { type: Boolean, default: false },
  uploading: { type: Boolean, default: false },
  getCountryLabel: { type: Function, required: true }
})

defineEmits([
  'update:modelValue',
  'update:activeTab',
  'submit',
  'add-country',
  'remove-country',
  'toggle-payment',
  'upload',
  'delete'
])
</script>
