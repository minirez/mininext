<template>
  <div class="space-y-8">
    <!-- Logo Section -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {{ $t('companyProfile.fields.logo') }}
      </h3>

      <div class="flex items-start gap-6">
        <!-- Logo Preview -->
        <div
          class="w-48 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg
                 flex items-center justify-center bg-gray-50 dark:bg-gray-700 overflow-hidden"
        >
          <img
            v-if="logoUrl"
            :src="logoUrl"
            alt="Logo"
            class="max-w-full max-h-full object-contain"
          />
          <div v-else class="text-center text-gray-400">
            <span class="material-icons text-4xl">image</span>
            <p class="text-xs mt-1">{{ $t('siteSettings.general.logoDescription') }}</p>
          </div>
        </div>

        <!-- Logo Actions -->
        <div class="space-y-3">
          <input
            ref="logoInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleLogoSelect"
          />
          <button
            @click="$refs.logoInput.click()"
            :disabled="saving"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                   text-gray-700 dark:text-gray-300 flex items-center gap-2"
          >
            <span class="material-icons text-lg">upload</span>
            {{ logo ? $t('siteSettings.general.changeLogo') : $t('companyProfile.actions.uploadLogo') }}
          </button>

          <button
            v-if="logo"
            @click="handleDeleteLogo"
            :disabled="saving"
            class="px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg
                   hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
                   text-red-600 dark:text-red-400 flex items-center gap-2"
          >
            <span class="material-icons text-lg">delete</span>
            {{ $t('companyProfile.actions.deleteLogo') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <hr class="border-gray-200 dark:border-gray-700" />

    <!-- Favicon Section -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {{ $t('companyProfile.fields.favicon') }}
      </h3>

      <div class="flex items-start gap-6">
        <!-- Favicon Preview -->
        <div
          class="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg
                 flex items-center justify-center bg-gray-50 dark:bg-gray-700 overflow-hidden"
        >
          <img
            v-if="faviconUrl"
            :src="faviconUrl"
            alt="Favicon"
            class="max-w-full max-h-full object-contain"
          />
          <div v-else class="text-center text-gray-400">
            <span class="material-icons text-3xl">tab</span>
            <p class="text-xs mt-1">32x32</p>
          </div>
        </div>

        <!-- Favicon Actions -->
        <div class="space-y-3">
          <input
            ref="faviconInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFaviconSelect"
          />
          <button
            @click="$refs.faviconInput.click()"
            :disabled="saving"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                   text-gray-700 dark:text-gray-300 flex items-center gap-2"
          >
            <span class="material-icons text-lg">upload</span>
            {{ favicon ? $t('siteSettings.general.changeFavicon') : $t('companyProfile.actions.uploadFavicon') }}
          </button>

          <button
            v-if="favicon"
            @click="handleDeleteFavicon"
            :disabled="saving"
            class="px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg
                   hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
                   text-red-600 dark:text-red-400 flex items-center gap-2"
          >
            <span class="material-icons text-lg">delete</span>
            {{ $t('companyProfile.actions.deleteFavicon') }}
          </button>
        </div>
      </div>

      <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
        {{ $t('siteSettings.general.faviconDescription') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getFileUrl } from '@/utils/imageUrl'

const props = defineProps({
  logo: {
    type: String,
    default: null
  },
  favicon: {
    type: String,
    default: null
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:logo',
  'update:favicon',
  'upload-logo',
  'delete-logo',
  'upload-favicon',
  'delete-favicon'
])

// Computed URLs with API base
const logoUrl = computed(() => {
  return props.logo ? getFileUrl(props.logo) : null
})

const faviconUrl = computed(() => {
  return props.favicon ? getFileUrl(props.favicon) : null
})

// Logo handlers
const handleLogoSelect = event => {
  const file = event.target.files?.[0]
  if (file) {
    emit('upload-logo', file)
  }
  // Reset input
  event.target.value = ''
}

const handleDeleteLogo = () => {
  emit('delete-logo')
}

// Favicon handlers
const handleFaviconSelect = event => {
  const file = event.target.files?.[0]
  if (file) {
    emit('upload-favicon', file)
  }
  // Reset input
  event.target.value = ''
}

const handleDeleteFavicon = () => {
  emit('delete-favicon')
}
</script>
