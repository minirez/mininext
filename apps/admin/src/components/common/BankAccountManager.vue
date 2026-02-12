<template>
  <div>
    <!-- Header with Add Button -->
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-medium text-gray-700 dark:text-slate-300">
        {{ $t('platformSettings.billing.bankAccounts') }}
      </h4>
      <button
        type="button"
        class="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
        @click="openAddModal"
      >
        <span class="material-icons text-sm">add</span>
        {{ $t('common.add') }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="modelValue.length === 0" class="text-center py-8 text-gray-500 dark:text-slate-400">
      <span class="material-icons text-4xl mb-2 block text-gray-300 dark:text-slate-600"
        >account_balance</span
      >
      <p class="text-sm">{{ $t('platformSettings.billing.noBankAccounts') }}</p>
    </div>

    <!-- Accounts Table -->
    <div v-else class="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-slate-700/50">
          <tr>
            <th
              class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
            >
              {{ $t('platformSettings.billing.bankName') }}
            </th>
            <th
              class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
            >
              {{ $t('platformSettings.billing.accountName') }}
            </th>
            <th
              class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
            >
              IBAN
            </th>
            <th
              class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
            >
              {{ $t('platformSettings.billing.currency') }}
            </th>
            <th
              class="px-4 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
            >
              {{ $t('platformSettings.bankAccounts.active') }}
            </th>
            <th
              class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
            ></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
          <tr
            v-for="(account, index) in modelValue"
            :key="index"
            class="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
          >
            <td class="px-4 py-3 text-gray-900 dark:text-white font-medium">
              {{ account.bankName || '-' }}
            </td>
            <td class="px-4 py-3 text-gray-700 dark:text-slate-300">
              {{ account.accountName || '-' }}
            </td>
            <td class="px-4 py-3 text-gray-700 dark:text-slate-300 font-mono text-xs">
              {{ maskIban(account.iban) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-slate-300"
              >
                {{ account.currency || 'TRY' }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="
                  account.isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-slate-600 dark:text-slate-400'
                "
              >
                {{
                  account.isActive
                    ? $t('platformSettings.bankAccounts.active')
                    : $t('common.inactive')
                }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  @click="openEditModal(index)"
                >
                  <span class="material-icons text-sm">edit</span>
                </button>
                <button
                  type="button"
                  class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  @click="removeAccount(index)"
                >
                  <span class="material-icons text-sm">delete</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <Modal
      v-model="showModal"
      :title="
        editingIndex !== null
          ? $t('platformSettings.billing.bankAccount') + ' - ' + $t('common.edit')
          : $t('platformSettings.billing.bankAccount') + ' - ' + $t('common.add')
      "
      size="md"
    >
      <div class="space-y-4">
        <!-- Bank Select -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('platformSettings.bankAccounts.bankName') }}
          </label>
          <select
            v-model="formData.bankCode"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            @change="onBankSelect"
          >
            <option value="">{{ $t('platformSettings.bankAccounts.selectBank') }}</option>
            <option v-for="bank in bankOptions" :key="bank.code" :value="bank.code">
              {{ bank.name }}
            </option>
          </select>
        </div>

        <!-- Account Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('platformSettings.billing.accountName') }}
          </label>
          <input
            v-model="formData.accountName"
            type="text"
            :placeholder="$t('platformSettings.billing.accountNamePlaceholder')"
            autocomplete="off"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <!-- IBAN -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            IBAN
          </label>
          <input
            v-model="formData.iban"
            type="text"
            placeholder="TR00 0000 0000 0000 0000 0000 00"
            autocomplete="off"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <!-- SWIFT/BIC + Currency Row -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              SWIFT/BIC
            </label>
            <input
              v-model="formData.swift"
              type="text"
              placeholder="TGBATRIS"
              autocomplete="off"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('platformSettings.billing.currency') }}
            </label>
            <select
              v-model="formData.currency"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <!-- Active Toggle -->
        <div class="flex items-center justify-between pt-2">
          <span class="text-sm font-medium text-gray-700 dark:text-slate-300">
            {{ $t('platformSettings.bankAccounts.active') }}
          </span>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="formData.isActive" type="checkbox" class="sr-only peer" />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-500"
            ></div>
          </label>
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="px-4 py-2 text-sm text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          @click="showModal = false"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          :disabled="!formData.bankCode && !formData.accountName && !formData.iban"
          @click="saveAccount"
        >
          {{ $t('common.save') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { BANKS_TR, getBankByCode } from '@booking-engine/constants'
import Modal from './Modal.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const bankOptions = BANKS_TR

const showModal = ref(false)
const editingIndex = ref(null)

const defaultForm = {
  bankCode: '',
  bankName: '',
  accountName: '',
  iban: '',
  swift: '',
  currency: 'TRY',
  isActive: true
}

const formData = reactive({ ...defaultForm })

function resetForm() {
  Object.assign(formData, { ...defaultForm })
}

function openAddModal() {
  resetForm()
  editingIndex.value = null
  showModal.value = true
}

function openEditModal(index) {
  const account = props.modelValue[index]
  Object.assign(formData, {
    bankCode: account.bankCode || '',
    bankName: account.bankName || '',
    accountName: account.accountName || '',
    iban: account.iban || '',
    swift: account.swift || '',
    currency: account.currency || 'TRY',
    isActive: account.isActive ?? true
  })
  editingIndex.value = index
  showModal.value = true
}

function onBankSelect() {
  const bank = getBankByCode(formData.bankCode)
  if (bank) {
    formData.bankName = bank.name
    formData.swift = bank.swift || formData.swift
  }
}

function saveAccount() {
  const accountData = { ...formData }
  const accounts = [...props.modelValue]

  if (editingIndex.value !== null) {
    accounts[editingIndex.value] = accountData
  } else {
    accounts.push(accountData)
  }

  emit('update:modelValue', accounts)
  showModal.value = false
}

function removeAccount(index) {
  const accounts = [...props.modelValue]
  accounts.splice(index, 1)
  emit('update:modelValue', accounts)
}

function maskIban(iban) {
  if (!iban) return '-'
  const clean = iban.replace(/\s/g, '')
  if (clean.length <= 8) return iban
  return clean.slice(0, 4) + ' **** **** ' + clean.slice(-4)
}
</script>
