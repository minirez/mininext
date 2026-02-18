<template>
  <div class="space-y-6">
    <!-- Logo & Favicon Upload -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Logo -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          {{ $t('siteSettings.general.logo') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          {{ $t('siteSettings.general.logoHint') }}
        </p>

        <div class="flex flex-col items-center">
          <div
            class="w-48 h-24 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-slate-600 mb-4"
          >
            <img
              v-if="form.logo"
              :src="getImageUrl(form.logo)"
              alt="Logo"
              class="max-w-full max-h-full object-contain"
            />
            <span v-else class="material-icons text-4xl text-gray-300 dark:text-slate-600"
              >image</span
            >
          </div>

          <div class="flex gap-2">
            <label class="btn-primary cursor-pointer text-sm">
              <span class="material-icons text-sm mr-1">upload</span>
              {{ $t('common.upload') }}
              <input
                type="file"
                accept="image/*"
                class="hidden"
                :disabled="uploading"
                @change="handleLogoUpload"
              />
            </label>
            <button
              v-if="form.logo"
              class="btn-danger text-sm"
              :disabled="uploading"
              @click="handleLogoDelete"
            >
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Favicon -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          {{ $t('siteSettings.general.favicon') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          {{ $t('siteSettings.general.faviconHint') }}
        </p>

        <div class="flex flex-col items-center">
          <div
            class="w-24 h-24 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-slate-600 mb-4"
          >
            <img
              v-if="form.favicon"
              :src="getImageUrl(form.favicon)"
              alt="Favicon"
              class="max-w-full max-h-full object-contain"
            />
            <span v-else class="material-icons text-4xl text-gray-300 dark:text-slate-600"
              >tab</span
            >
          </div>

          <div class="flex gap-2">
            <label class="btn-primary cursor-pointer text-sm">
              <span class="material-icons text-sm mr-1">upload</span>
              {{ $t('common.upload') }}
              <input
                type="file"
                accept="image/png"
                class="hidden"
                :disabled="uploading"
                @change="handleFaviconUpload"
              />
            </label>
            <button
              v-if="form.favicon"
              class="btn-danger text-sm"
              :disabled="uploading"
              @click="handleFaviconDelete"
            >
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TURSAB Logo -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        {{ $t('siteSettings.general.tursabLogo') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
        {{ $t('siteSettings.general.tursabHint') }}
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Photo Upload -->
        <div class="flex flex-col items-center">
          <div
            class="w-40 h-40 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-slate-600 mb-4"
          >
            <img
              v-if="form.tursab.photo"
              :src="getImageUrl(form.tursab.photo)"
              alt="TURSAB"
              class="max-w-full max-h-full object-contain"
            />
            <span v-else class="material-icons text-4xl text-gray-300 dark:text-slate-600"
              >verified</span
            >
          </div>

          <div class="flex gap-2">
            <label class="btn-primary cursor-pointer text-sm">
              <span class="material-icons text-sm mr-1">upload</span>
              {{ $t('common.upload') }}
              <input
                type="file"
                accept="image/*"
                class="hidden"
                :disabled="uploading"
                @change="handleTursabUpload"
              />
            </label>
            <button
              v-if="form.tursab.photo"
              class="btn-danger text-sm"
              :disabled="uploading"
              @click="handleTursabDelete"
            >
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>

        <!-- TURSAB Fields -->
        <div class="space-y-4">
          <div>
            <label class="form-label">{{ $t('siteSettings.general.tursabDocumentNumber') }}</label>
            <input
              v-model="form.tursab.documentNumber"
              type="text"
              class="form-input"
              :placeholder="$t('siteSettings.general.tursabDocumentNumberPlaceholder')"
            />
          </div>
          <div>
            <label class="form-label">{{ $t('siteSettings.general.tursabLink') }}</label>
            <input
              v-model="form.tursab.link"
              type="url"
              class="form-input"
              placeholder="https://www.tursab.org.tr/tr/ddsv"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Maintenance Mode -->
    <div
      class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
    >
      <div class="flex items-center justify-between">
        <div>
          <h4 class="font-semibold text-yellow-800 dark:text-yellow-300 flex items-center">
            <span class="material-icons text-sm mr-2">engineering</span>
            {{ $t('siteSettings.general.maintenanceMode') }}
          </h4>
          <p class="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
            {{ $t('siteSettings.general.maintenanceDescription') }}
          </p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input v-model="form.maintenanceMode" type="checkbox" class="sr-only peer" />
          <div
            class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"
          ></div>
        </label>
      </div>
      <div v-if="form.maintenanceMode" class="mt-4">
        <label class="form-label">{{ $t('siteSettings.general.maintenanceMessage') }}</label>
        <textarea
          v-model="form.maintenanceMessage"
          class="form-input"
          rows="2"
          :placeholder="$t('siteSettings.general.maintenanceMessagePlaceholder')"
        ></textarea>
      </div>
    </div>

    <!-- Site Title & Description -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
        {{ $t('siteSettings.general.seoSettings') }}
      </h3>

      <!-- Language tabs with translation button -->
      <div class="border-b border-gray-200 dark:border-slate-700">
        <div class="flex items-center justify-between">
          <nav class="flex space-x-1 overflow-x-auto">
            <button
              v-for="lang in form.activeLanguages"
              :key="lang"
              class="px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1"
              :class="
                selectedLang === lang
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              "
              @click="selectedLang = lang"
            >
              <span>{{ getLanguageFlag(lang) }}</span>
              <span>{{ getLanguageName(lang) }}</span>
              <span v-if="isDefaultLanguage(lang)" class="text-yellow-500 ml-1">
                <span class="material-icons text-xs">star</span>
              </span>
            </button>
          </nav>

          <!-- AI Translation Button -->
          <button
            :disabled="translating || form.activeLanguages.length < 2"
            class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
            :title="$t('siteSettings.general.translateTooltip')"
            @click="handleTranslate"
          >
            <span v-if="translating" class="material-icons text-sm animate-spin">sync</span>
            <span v-else class="material-icons text-sm">translate</span>
            <span>{{
              translating
                ? $t('siteSettings.general.translating')
                : $t('siteSettings.general.translateAll')
            }}</span>
            <span class="material-icons text-xs">auto_awesome</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="form-label">{{ $t('siteSettings.general.siteTitle') }}</label>
          <input
            v-model="form.siteTitle[selectedLang]"
            type="text"
            class="form-input"
            :placeholder="$t('siteSettings.general.siteTitlePlaceholder')"
          />
        </div>

        <div>
          <label class="form-label">{{ $t('siteSettings.general.siteDescription') }}</label>
          <textarea
            v-model="form.siteDescription[selectedLang]"
            class="form-input"
            rows="3"
            :placeholder="$t('siteSettings.general.siteDescriptionPlaceholder')"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end">
      <button class="btn-primary" :disabled="saving" @click="handleSave">
        <span v-if="saving" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
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
          {{ $t('common.loading') }}
        </span>
        <span v-else>{{ $t('common.save') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import siteSettingsService from '@/services/siteSettingsService'
import translationService from '@/services/translationService'
import { getImageUrl } from '@/utils/imageUrl'

const { t: translate } = useI18n()
const toast = useToast()

const props = defineProps({
  settings: Object,
  saving: Boolean
})

const emit = defineEmits(['save', 'refresh'])

const uploading = ref(false)
const translating = ref(false)

const availableLanguages = [
  { code: 'tr', name: 'Türkçe', nameTr: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', nameTr: 'İngilizce', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', nameTr: 'Rusça', flag: '🇷🇺' },
  { code: 'el', name: 'Ελληνικά', nameTr: 'Yunanca', flag: '🇬🇷' },
  { code: 'de', name: 'Deutsch', nameTr: 'Almanca', flag: '🇩🇪' },
  { code: 'es', name: 'Español', nameTr: 'İspanyolca', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', nameTr: 'İtalyanca', flag: '🇮🇹' },
  { code: 'fr', name: 'Français', nameTr: 'Fransızca', flag: '🇫🇷' },
  { code: 'ro', name: 'Română', nameTr: 'Romence', flag: '🇷🇴' },
  { code: 'bg', name: 'Български', nameTr: 'Bulgarca', flag: '🇧🇬' },
  { code: 'pt', name: 'Português', nameTr: 'Portekizce', flag: '🇵🇹' },
  { code: 'da', name: 'Dansk', nameTr: 'Danca', flag: '🇩🇰' },
  { code: 'zh', name: '中文', nameTr: 'Çince', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', nameTr: 'Arapça', flag: '🇸🇦' },
  { code: 'fa', name: 'فارسی', nameTr: 'Farsça', flag: '🇮🇷' },
  { code: 'he', name: 'עברית', nameTr: 'İbranice', flag: '🇮🇱' },
  { code: 'sq', name: 'Shqip', nameTr: 'Arnavutça', flag: '🇦🇱' },
  { code: 'uk', name: 'Українська', nameTr: 'Ukraynaca', flag: '🇺🇦' },
  { code: 'pl', name: 'Polski', nameTr: 'Lehçe', flag: '🇵🇱' },
  { code: 'az', name: 'Azərbaycanca', nameTr: 'Azerice', flag: '🇦🇿' }
]

const selectedLang = ref('tr')

const defaultLangData = () => {
  const obj = {}
  availableLanguages.forEach(l => (obj[l.code] = ''))
  return obj
}

const form = ref({
  logo: '',
  favicon: '',
  activeLanguages: ['tr', 'en'],
  defaultLanguage: 'tr',
  maintenanceMode: false,
  maintenanceMessage: '',
  siteTitle: defaultLangData(),
  siteDescription: defaultLangData(),
  tursab: {
    photo: '',
    link: '',
    documentNumber: ''
  }
})

watch(
  () => props.settings,
  newSettings => {
    if (newSettings) {
      form.value = {
        logo: newSettings.logo || '',
        favicon: newSettings.favicon || '',
        activeLanguages: newSettings.activeLanguages || ['tr', 'en'],
        defaultLanguage: newSettings.defaultLanguage || 'tr',
        maintenanceMode: newSettings.maintenanceMode || false,
        maintenanceMessage: newSettings.maintenanceMessage || '',
        siteTitle: { ...defaultLangData(), ...(newSettings.siteTitle || {}) },
        siteDescription: { ...defaultLangData(), ...(newSettings.siteDescription || {}) },
        tursab: {
          photo: newSettings.tursab?.photo || '',
          link: newSettings.tursab?.link || '',
          documentNumber: newSettings.tursab?.documentNumber || ''
        }
      }
      if (form.value.activeLanguages.length > 0) {
        selectedLang.value = form.value.activeLanguages[0]
      }
    }
  },
  { immediate: true }
)

const getLanguageName = code => {
  return availableLanguages.find(l => l.code === code)?.name || code
}

const getLanguageFlag = code => {
  return availableLanguages.find(l => l.code === code)?.flag || ''
}

const isDefaultLanguage = code => {
  return form.value.defaultLanguage === code
}

const handleTursabUpload = async event => {
  const file = event.target.files[0]
  if (!file) return

  uploading.value = true
  try {
    const response = await siteSettingsService.uploadImage(file, 'tursab')
    if (response.success) {
      form.value.tursab.photo = response.data.url
      toast.success(translate('siteSettings.general.tursabUploaded'))
      emit('refresh')
    }
  } catch (error) {
    toast.error(error.response?.data?.message || translate('common.uploadFailed'))
  } finally {
    uploading.value = false
  }
}

const handleTursabDelete = async () => {
  if (!form.value.tursab.photo) return

  uploading.value = true
  try {
    const filename = form.value.tursab.photo.split('/').pop()
    await siteSettingsService.deleteImage(filename, 'tursab')
    form.value.tursab.photo = ''
    toast.success(translate('siteSettings.general.tursabDeleted'))
    emit('refresh')
  } catch (error) {
    toast.error(error.response?.data?.message || translate('common.deleteFailed'))
  } finally {
    uploading.value = false
  }
}

const handleLogoUpload = async event => {
  const file = event.target.files[0]
  if (!file) return

  uploading.value = true
  try {
    const response = await siteSettingsService.uploadImage(file, 'logo')
    if (response.success) {
      form.value.logo = response.data.url
      toast.success(translate('siteSettings.general.logoUploaded'))
      emit('refresh')
    }
  } catch (error) {
    toast.error(error.response?.data?.message || translate('common.uploadFailed'))
  } finally {
    uploading.value = false
  }
}

const handleFaviconUpload = async event => {
  const file = event.target.files[0]
  if (!file) return

  uploading.value = true
  try {
    const response = await siteSettingsService.uploadImage(file, 'favicon')
    if (response.success) {
      form.value.favicon = response.data.url
      toast.success(translate('siteSettings.general.faviconUploaded'))
      emit('refresh')
    }
  } catch (error) {
    toast.error(error.response?.data?.message || translate('common.uploadFailed'))
  } finally {
    uploading.value = false
  }
}

const handleLogoDelete = async () => {
  if (!form.value.logo) return

  uploading.value = true
  try {
    const filename = form.value.logo.split('/').pop()
    await siteSettingsService.deleteImage(filename, 'logo')
    form.value.logo = ''
    toast.success(translate('siteSettings.general.logoDeleted'))
    emit('refresh')
  } catch (error) {
    toast.error(error.response?.data?.message || translate('common.deleteFailed'))
  } finally {
    uploading.value = false
  }
}

const handleFaviconDelete = async () => {
  if (!form.value.favicon) return

  uploading.value = true
  try {
    const filename = form.value.favicon.split('/').pop()
    await siteSettingsService.deleteImage(filename, 'favicon')
    form.value.favicon = ''
    toast.success(translate('siteSettings.general.faviconDeleted'))
    emit('refresh')
  } catch (error) {
    toast.error(error.response?.data?.message || translate('common.deleteFailed'))
  } finally {
    uploading.value = false
  }
}

const handleSave = () => {
  // eslint-disable-next-line no-unused-vars
  const { logo, favicon, tursab, ...rest } = form.value
  emit('save', {
    ...rest,
    tursab: { link: tursab.link, documentNumber: tursab.documentNumber }
  })
}

const handleTranslate = async () => {
  const sourceTitle = form.value.siteTitle[selectedLang.value]
  const sourceDescription = form.value.siteDescription[selectedLang.value]

  if (!sourceTitle && !sourceDescription) {
    toast.warning(translate('siteSettings.general.noContentToTranslate'))
    return
  }

  translating.value = true
  try {
    const response = await translationService.translateSeo(
      form.value.siteTitle,
      form.value.siteDescription,
      selectedLang.value,
      form.value.activeLanguages
    )

    if (response.success) {
      form.value.siteTitle = { ...form.value.siteTitle, ...response.data.siteTitle }
      form.value.siteDescription = {
        ...form.value.siteDescription,
        ...response.data.siteDescription
      }
      toast.success(translate('siteSettings.general.translationSuccess'))
    }
  } catch (error) {
    toast.error(
      error.response?.data?.message || translate('siteSettings.general.translationFailed')
    )
  } finally {
    translating.value = false
  }
}
</script>
