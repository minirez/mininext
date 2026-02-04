<template>
  <div>
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-slate-700">
        <nav class="flex -mb-px overflow-x-auto items-center">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap"
            :class="
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-300'
            "
            @click="activeTab = tab.id"
          >
            <span class="flex items-center">
              <span class="material-icons text-lg mr-2">{{ tab.icon }}</span>
              {{ tab.label }}
            </span>
          </button>

          <!-- Master switch: enable new storefront source for this partner -->
          <div v-if="storefront" class="ml-auto pr-4 flex items-center gap-4">
            <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
              <input
                type="checkbox"
                class="form-checkbox"
                :checked="Boolean(storefront?.settings?.storefrontV3Enabled)"
                :disabled="loading || saving"
                @change="e => handleStorefrontSourceToggle(e.target.checked)"
              />
              <span>{{ $t('website.storefrontSource.enableNewApi') }}</span>
            </label>

            <span class="text-xs text-gray-400 dark:text-slate-500 hidden lg:inline">
              {{ $t('website.storefrontSource.enableNewApiHelp') }}
            </span>
          </div>

          <!-- AI Import Button -->
          <div v-else class="ml-auto pr-4"></div>
          <div class="pr-4">
            <button
              class="px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center gap-2"
              @click="showAIImporter = true"
              :title="$t('website.aiMigration.title') || 'Import from JSON'"
            >
              <span class="material-icons text-lg">auto_awesome</span>
              <span class="hidden sm:inline">{{
                $t('website.aiMigration.importButton') || 'AI Import'
              }}</span>
            </button>
          </div>
        </nav>
      </div>

      <!-- Content (kept mounted during loading to preserve internal tab state) -->
      <div class="p-6 relative">
        <!-- Loading overlay -->
        <div
          v-if="loading"
          class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-800/70"
        >
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p class="mt-4 text-gray-600 dark:text-slate-400">{{ $t('common.loading') }}</p>
        </div>

        <div :class="loading ? 'opacity-50 pointer-events-none' : ''">
          <div v-if="!storefront" class="text-center py-12">
            <span class="material-icons text-6xl text-gray-300 dark:text-slate-600"
              >public_off</span
            >
            <h3 class="text-xl font-semibold text-gray-600 dark:text-slate-400 mt-4">
              {{ $t('common.noData') }}
            </h3>
          </div>

          <template v-else>
            <div v-show="activeTab === 'themes'">
              <ThemeSelectorTab :storefront="storefront" :saving="saving" @save="handleThemeSave" />
            </div>

            <div v-show="activeTab === 'homepage'">
              <HomepageCustomizerTab
                :storefront="storefront"
                :saving="saving"
                @save="handleHomepageSave"
                @preview="handlePreview"
                @refresh="fetchStorefront"
                @publish="handlePublish"
              />
            </div>

            <div v-show="activeTab === 'pages'">
              <PagesTab
                :storefront="storefront"
                :saving="saving"
                @save="handlePageSave"
                @delete="handlePageDelete"
              />
            </div>

            <div v-show="activeTab === 'photos'">
              <PhotoManagerTab
                :storefront="storefront"
                :saving="saving"
                @upload="handlePhotoUpload"
                @delete="handlePhotoDelete"
              />
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- AI Importer Modal -->
    <StorefrontAIImporter v-model="showAIImporter" @apply="handleAIImportApply" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePartnerContext } from '@/composables/usePartnerContext'
import { useAsyncAction } from '@/composables/useAsyncAction'
import websiteService from '@/services/websiteService'

import ThemeSelectorTab from '@/components/website/ThemeSelectorTab.vue'
import HomepageCustomizerTab from '@/components/website/HomepageCustomizerTab.vue'
import PagesTab from '@/components/website/PagesTab.vue'
import PhotoManagerTab from '@/components/website/PhotoManagerTab.vue'
import StorefrontAIImporter from '@/components/website/StorefrontAIImporter.vue'

const { t } = useI18n()

const { isLoading: loading, execute: executeFetch } = useAsyncAction({ showSuccessToast: false })
const { isLoading: saving, execute: executeSave } = useAsyncAction()

const storefront = ref(null)
const activeTab = ref('homepage')
const showAIImporter = ref(false)

const tabs = computed(() => [
  { id: 'themes', label: t('website.tabs.themes'), icon: 'palette' },
  { id: 'homepage', label: t('website.tabs.homepage'), icon: 'dashboard_customize' },
  { id: 'pages', label: t('website.tabs.pages'), icon: 'description' },
  { id: 'photos', label: t('website.tabs.photos'), icon: 'photo_library' }
])

const fetchStorefront = async () => {
  await executeFetch(() => websiteService.getStorefront({ view: 'full' }), {
    errorMessage: 'website.fetchError',
    onSuccess: response => {
      storefront.value = response.data
    }
  })
}

usePartnerContext({
  onPartnerChange: partner => {
    if (partner) fetchStorefront()
  },
  immediate: true
})

const handleThemeSave = async data => {
  await executeSave(() => websiteService.updateTheme(data), {
    successMessage: 'website.themeSaved',
    onSuccess: async () => {
      await fetchStorefront()
    }
  })
}

const handleStorefrontSourceToggle = async enabled => {
  if (!storefront.value) return

  const nextSettings = {
    ...(storefront.value.settings || {}),
    storefrontV3Enabled: Boolean(enabled)
  }

  // Optimistic update to keep UI responsive
  storefront.value = {
    ...storefront.value,
    settings: nextSettings
  }

  await executeSave(() => websiteService.updateStorefront({ settings: nextSettings }), {
    successMessage: 'website.storefrontSource.saved',
    onSuccess: async () => {
      await fetchStorefront()
    }
  })
}

const handleHomepageSave = async data => {
  await executeSave(() => websiteService.updateHomepage(data), {
    successMessage: 'website.homepageSaved',
    onSuccess: async () => {
      await fetchStorefront()
    }
  })
}

const handlePreview = url => {
  if (!url) return
  window.open(url, '_blank', 'noopener')
}

const handlePublish = async () => {
  await executeSave(() => websiteService.publishDraft(), {
    successMessage: 'website.draft.published',
    onSuccess: async () => {
      await fetchStorefront()
    }
  })
}

const handlePageSave = async data => {
  await executeSave(() => websiteService.savePage(data), {
    successMessage: 'website.pageSaved',
    onSuccess: async () => {
      await fetchStorefront()
    }
  })
}

const handlePageDelete = async pageUrl => {
  await executeSave(() => websiteService.deletePage(pageUrl), {
    successMessage: 'website.pageDeleted',
    onSuccess: async () => {
      await fetchStorefront()
    }
  })
}

const handlePhotoUpload = async file => {
  await executeSave(() => websiteService.uploadPhoto(file), {
    successMessage: 'website.photoUploaded',
    onSuccess: async () => {
      await fetchStorefront()
    }
  })
}

const handlePhotoDelete = async photoId => {
  await executeSave(() => websiteService.deletePhoto(photoId), {
    successMessage: 'website.photoDeleted',
    onSuccess: async () => {
      await fetchStorefront()
    }
  })
}

const handleAIImportApply = async () => {
  // Refresh storefront data after AI import
  await fetchStorefront()
}
</script>
