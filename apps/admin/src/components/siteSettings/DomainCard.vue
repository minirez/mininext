<template>
  <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
      <span class="material-icons mr-2" :class="iconColor">{{ icon }}</span>
      {{ title }}
    </h3>
    <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">{{ description }}</p>

    <div class="space-y-4">
      <!-- Domain: Active SSL -> link, otherwise -> input -->
      <div>
        <label class="form-label">{{ $t('siteSettings.setup.domain') }}</label>

        <!-- SSL Active: clickable link + remove button -->
        <div v-if="sslStatus === 'active' && domain" class="mt-1 flex items-center gap-2">
          <a
            :href="'https://' + domain"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <span class="material-icons text-sm">lock</span>
            <span class="font-medium">{{ domain }}</span>
            <span class="material-icons text-sm">open_in_new</span>
          </a>
          <button
            class="inline-flex items-center gap-1 px-2 py-2 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            :title="$t('siteSettings.setup.deleteIdentity')"
            @click="$emit('remove-domain')"
          >
            <span class="material-icons text-sm">link_off</span>
          </button>
        </div>

        <!-- SSL not active: editable input + remove button -->
        <div v-else class="flex items-center gap-2">
          <input
            :value="domain"
            @input="$emit('update:domain', $event.target.value)"
            type="text"
            class="form-input flex-1"
            :placeholder="placeholder"
          />
          <button
            v-if="domain"
            class="inline-flex items-center gap-1 px-2 py-2 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
            :title="$t('siteSettings.setup.deleteIdentity')"
            @click="$emit('remove-domain')"
          >
            <span class="material-icons text-sm">link_off</span>
          </button>
        </div>
      </div>

      <!-- SSL Status & Actions -->
      <div class="border-t border-gray-200 dark:border-slate-600 pt-4 mt-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-gray-600 dark:text-slate-400">SSL:</span>
          <span class="badge" :class="sslBadgeClass">{{ sslStatusText }}</span>
        </div>

        <!-- SSL Expiry Date -->
        <div
          v-if="sslStatus === 'active' && sslExpires"
          class="text-xs text-gray-500 dark:text-slate-400 mb-3"
        >
          {{ $t('siteSettings.setup.sslExpires') }}: {{ formatDate(sslExpires) }}
        </div>

        <!-- Action Buttons (only when SSL is not active) -->
        <div v-if="sslStatus !== 'active'" class="flex flex-wrap gap-2">
          <!-- Verify DNS Button -->
          <button
            v-if="domain"
            class="btn-secondary text-sm flex-1"
            :disabled="verifying || saving"
            @click="$emit('verify-dns')"
          >
            <span v-if="verifying" class="flex items-center justify-center">
              <svg class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {{ $t('siteSettings.setup.verifying') }}
            </span>
            <span v-else class="flex items-center justify-center">
              <span class="material-icons text-sm mr-1">dns</span>
              {{ $t('siteSettings.setup.verifyDns') }}
            </span>
          </button>

          <!-- Setup SSL Button (shown after DNS verified) -->
          <button
            v-if="domain && dnsVerified"
            class="btn-primary text-sm flex-1"
            :disabled="settingUpSsl || saving"
            @click="$emit('setup-ssl')"
          >
            <span v-if="settingUpSsl" class="flex items-center justify-center">
              <svg class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {{ $t('siteSettings.setup.settingUpSsl') }}
            </span>
            <span v-else class="flex items-center justify-center">
              <span class="material-icons text-sm mr-1">security</span>
              {{ $t('siteSettings.setup.setupSsl') }}
            </span>
          </button>
        </div>

        <!-- DNS Verification Result -->
        <div
          v-if="dnsResult"
          class="mt-3 p-3 rounded-lg text-sm"
          :class="
            dnsResult.success
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          "
        >
          <div class="flex items-center">
            <span class="material-icons text-sm mr-2">{{
              dnsResult.success ? 'check_circle' : 'error'
            }}</span>
            {{ dnsResult.message }}
          </div>
          <div
            v-if="!dnsResult.success && (dnsResult.cnameTarget || dnsResult.serverIP)"
            class="mt-2 text-xs"
          >
            {{ $t('siteSettings.setup.pointDomainTo') }}:
            <code class="bg-gray-200 dark:bg-slate-700 px-1 rounded">{{
              dnsResult.cnameTarget || dnsResult.serverIP
            }}</code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  type: { type: String, required: true },
  icon: { type: String, required: true },
  iconColor: { type: String, default: 'text-gray-600' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  domain: { type: String, default: '' },
  sslStatus: { type: String, default: 'none' },
  sslExpires: { type: [String, Date], default: null },
  verifying: { type: Boolean, default: false },
  settingUpSsl: { type: Boolean, default: false },
  dnsVerified: { type: Boolean, default: false },
  dnsResult: { type: Object, default: null },
  saving: { type: Boolean, default: false }
})

defineEmits(['update:domain', 'verify-dns', 'setup-ssl', 'remove-domain'])

const sslBadgeClass = computed(() => ({
  'badge-success': props.sslStatus === 'active',
  'badge-warning': props.sslStatus === 'pending',
  'badge-danger': props.sslStatus === 'failed',
  'badge-secondary': !props.sslStatus || props.sslStatus === 'none'
}))

const sslStatusText = computed(() => {
  const statusMap = {
    active: t('siteSettings.setup.sslActive'),
    pending: t('siteSettings.setup.sslPending'),
    failed: t('siteSettings.setup.sslFailed'),
    none: t('siteSettings.setup.sslNone')
  }
  return statusMap[props.sslStatus] || statusMap.none
})

const formatDate = date => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}
</script>
