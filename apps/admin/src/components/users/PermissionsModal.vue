<template>
  <Modal v-model="isOpen" :title="$t('users.permissions.title')" size="xl" :close-on-overlay="false">
    <!-- User Info Header -->
    <div class="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
      <div
        class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg"
      >
        {{ avatarInitials }}
      </div>
      <div class="flex-1">
        <h3 class="font-semibold text-gray-900 dark:text-white">{{ props.user?.name }}</h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ props.user?.email }}</p>
      </div>
      <span
        :class="[
          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
          props.user?.role === 'admin'
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
            : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
        ]"
      >
        <span class="material-icons text-sm mr-1">{{
          props.user?.role === 'admin' ? 'admin_panel_settings' : 'person'
        }}</span>
        {{ props.user?.role === 'admin' ? $t('users.admin') : $t('users.user') }}
      </span>
    </div>

    <!-- Admin Notice -->
    <div
      v-if="props.user?.role === 'admin'"
      class="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 mb-6"
    >
      <span class="material-icons text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5"
        >admin_panel_settings</span
      >
      <div>
        <p class="text-sm text-purple-800 dark:text-purple-200 font-medium">
          {{ $t('users.permissions.adminNotice') }}
        </p>
        <p class="text-xs text-purple-600 dark:text-purple-300 mt-1">
          {{ $t('users.permissions.adminNoticeDetail') }}
        </p>
      </div>
    </div>

    <!-- Permissions Grid -->
    <div v-else class="space-y-4">
      <!-- Quick Actions -->
      <div class="flex items-center justify-between mb-4">
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('users.permissions.selectModules') }}
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="text-xs px-3 py-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
            @click="selectAll"
          >
            {{ $t('users.permissions.selectAll') }}
          </button>
          <button
            type="button"
            class="text-xs px-3 py-1.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            @click="clearAll"
          >
            {{ $t('users.permissions.clearAll') }}
          </button>
        </div>
      </div>

      <!-- Permissions Table -->
      <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {{ $t('users.permissions.module') }}
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-24"
              >
                {{ $t('users.permissions.view') }}
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-24"
              >
                {{ $t('users.permissions.create') }}
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-24"
              >
                {{ $t('users.permissions.edit') }}
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-24"
              >
                {{ $t('users.permissions.delete') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr
              v-for="module in availableModules"
              :key="module.value"
              class="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center"
                    :class="
                      hasAnyPermission(module.value)
                        ? 'bg-purple-100 dark:bg-purple-900/30'
                        : 'bg-gray-100 dark:bg-slate-600'
                    "
                  >
                    <span
                      class="material-icons text-lg"
                      :class="
                        hasAnyPermission(module.value)
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-gray-400'
                      "
                      >{{ module.icon }}</span
                    >
                  </div>
                  <span class="font-medium text-gray-900 dark:text-white">{{ module.label }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <label class="inline-flex items-center justify-center cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="getPermission(module.value, 'view')"
                    class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300 dark:border-slate-500 cursor-pointer"
                    @change="togglePermission(module.value, 'view')"
                  />
                </label>
              </td>
              <td class="px-4 py-3 text-center">
                <label class="inline-flex items-center justify-center cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="getPermission(module.value, 'create')"
                    :disabled="!getPermission(module.value, 'view')"
                    class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300 dark:border-slate-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    @change="togglePermission(module.value, 'create')"
                  />
                </label>
              </td>
              <td class="px-4 py-3 text-center">
                <label class="inline-flex items-center justify-center cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="getPermission(module.value, 'edit')"
                    :disabled="!getPermission(module.value, 'view')"
                    class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300 dark:border-slate-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    @change="togglePermission(module.value, 'edit')"
                  />
                </label>
              </td>
              <td class="px-4 py-3 text-center">
                <label class="inline-flex items-center justify-center cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="getPermission(module.value, 'delete')"
                    :disabled="!getPermission(module.value, 'view')"
                    class="w-5 h-5 text-red-600 rounded focus:ring-red-500 border-gray-300 dark:border-slate-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    @change="togglePermission(module.value, 'delete')"
                  />
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Help Text -->
      <div class="flex items-start gap-2 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
        <span class="material-icons text-gray-400 text-sm mt-0.5">info</span>
        <p class="text-xs text-gray-500 dark:text-slate-400">
          {{ $t('users.permissions.helpText') }}
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
        <button
          type="button"
          class="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
          @click="handleCancel"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          v-if="props.user?.role !== 'admin'"
          :disabled="saving"
          class="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all"
          @click="handleSubmit"
        >
          <span v-if="saving" class="animate-spin material-icons text-lg">refresh</span>
          <span v-else class="material-icons text-lg">save</span>
          {{ saving ? $t('common.saving') : $t('common.save') }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/common/Modal.vue'
import { updateUserPermissions } from '@/services/userService'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'success'])

const { t } = useI18n()
const toast = useToast()

const isOpen = computed({
  get: () => true,
  set: val => {
    if (!val) emit('close')
  }
})

const saving = ref(false)

// Permissions data
const permissions = ref([])

// Available modules
const availableModules = computed(() => [
  { value: 'dashboard', label: t('users.modules.dashboard'), icon: 'dashboard' },
  { value: 'planning', label: t('users.modules.planning'), icon: 'event_note' },
  { value: 'booking', label: t('users.modules.booking'), icon: 'book_online' },
  { value: 'reports', label: t('users.modules.reports'), icon: 'assessment' },
  { value: 'hotels', label: t('users.modules.hotels'), icon: 'hotel' },
  { value: 'agencies', label: t('users.modules.agencies'), icon: 'groups' },
  { value: 'pms', label: t('users.modules.pms'), icon: 'apartment' },
  { value: 'settings', label: t('users.modules.settings'), icon: 'settings' },
  { value: 'payment-link', label: t('users.modules.paymentLink'), icon: 'link' },
  { value: 'users', label: t('users.modules.users'), icon: 'people' }
])

// Avatar initials
const avatarInitials = computed(() => {
  const name = props.user?.name || ''
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || '?'
})

// Initialize permissions from user
watch(
  () => props.user,
  user => {
    if (user && user.permissions) {
      permissions.value = JSON.parse(JSON.stringify(user.permissions))
    } else {
      permissions.value = []
    }
  },
  { immediate: true }
)

// Get permission for a module and action
const getPermission = (module, action) => {
  const perm = permissions.value.find(p => p.module === module)
  return perm?.actions?.[action] || false
}

// Check if module has any permission
const hasAnyPermission = module => {
  const perm = permissions.value.find(p => p.module === module)
  if (!perm) return false
  return perm.actions?.view || perm.actions?.create || perm.actions?.edit || perm.actions?.delete
}

// Toggle permission
const togglePermission = (module, action) => {
  let perm = permissions.value.find(p => p.module === module)

  if (!perm) {
    perm = {
      module,
      actions: { view: false, create: false, edit: false, delete: false }
    }
    permissions.value.push(perm)
  }

  perm.actions[action] = !perm.actions[action]

  // If view is disabled, disable all other actions
  if (action === 'view' && !perm.actions.view) {
    perm.actions.create = false
    perm.actions.edit = false
    perm.actions.delete = false
  }

  // If any other action is enabled, enable view
  if (action !== 'view' && perm.actions[action]) {
    perm.actions.view = true
  }
}

// Select all permissions
const selectAll = () => {
  permissions.value = availableModules.value.map(module => ({
    module: module.value,
    actions: { view: true, create: true, edit: true, delete: true }
  }))
}

// Clear all permissions
const clearAll = () => {
  permissions.value = []
}

const handleCancel = () => {
  emit('close')
}

const handleSubmit = async () => {
  saving.value = true
  try {
    // Filter out modules with no permissions
    const filteredPermissions = permissions.value.filter(p =>
      p.actions?.view || p.actions?.create || p.actions?.edit || p.actions?.delete
    )

    await updateUserPermissions(props.user._id, filteredPermissions)
    emit('success')
  } catch (error) {
    const message = error.response?.data?.message || error.message || t('common.error')
    toast.error(message)
  } finally {
    saving.value = false
  }
}
</script>
