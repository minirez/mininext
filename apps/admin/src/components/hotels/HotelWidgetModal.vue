<template>
  <Modal
    :model-value="modelValue"
    :title="$t('hotels.widgetModal.title')"
    size="lg"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
      <p class="text-sm text-gray-500 dark:text-slate-400">
        {{ $t('hotels.widgetModal.loading') }}
      </p>
    </div>

    <div v-else class="space-y-6">
      <!-- Subtitle -->
      <p class="text-sm text-gray-500 dark:text-slate-400">
        {{ $t('hotels.widgetModal.subtitle') }}
      </p>

      <!-- A) Widget Enabled Toggle -->
      <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <div>
          <h4 class="text-sm font-medium text-gray-900 dark:text-white">
            {{ $t('widget.enabled') }}
          </h4>
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {{ $t('widget.enabledDescription') }}
          </p>
        </div>
        <Toggle v-model="form.enabled" />
      </div>

      <!-- B) Display Mode -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {{ $t('hotels.widgetModal.selectMode') }}
        </h4>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="mode in modes"
            :key="mode.key"
            type="button"
            class="flex flex-col items-center p-4 rounded-lg border-2 transition-all text-center"
            :class="
              form.mode === mode.key
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
            "
            @click="form.mode = mode.key"
          >
            <span
              class="material-icons text-2xl mb-2"
              :class="form.mode === mode.key ? 'text-purple-600' : 'text-gray-400'"
              >{{ mode.icon }}</span
            >
            <span
              class="text-sm font-medium"
              :class="
                form.mode === mode.key
                  ? 'text-purple-700 dark:text-purple-300'
                  : 'text-gray-700 dark:text-slate-300'
              "
              >{{ $t(`widget.modes.${mode.key}`) }}</span
            >
            <span
              class="text-xs mt-1"
              :class="
                form.mode === mode.key
                  ? 'text-purple-500 dark:text-purple-400'
                  : 'text-gray-400 dark:text-slate-500'
              "
              >{{ $t(`hotels.widgetModal.${mode.key}Desc`) }}</span
            >
          </button>
        </div>
      </div>

      <!-- C) Theme & Color -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {{ $t('hotels.widgetModal.themeAndColor') }}
        </h4>

        <!-- Theme Selection -->
        <div class="flex gap-2 mb-4">
          <button
            v-for="theme in themes"
            :key="theme.key"
            type="button"
            class="px-4 py-2 text-sm rounded-lg border transition-all"
            :class="
              form.theme === theme.key
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-gray-300'
            "
            @click="form.theme = theme.key"
          >
            {{ $t(`widget.themes.${theme.key}`) }}
          </button>
        </div>

        <!-- Color Palette -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="color in presetColors"
            :key="color"
            type="button"
            class="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center"
            :class="
              form.primaryColor === color
                ? 'border-gray-900 dark:border-white scale-110'
                : 'border-transparent hover:scale-105'
            "
            :style="{ backgroundColor: color }"
            @click="form.primaryColor = color"
          >
            <span v-if="form.primaryColor === color" class="material-icons text-white text-sm"
              >check</span
            >
          </button>

          <!-- Custom Color -->
          <div class="flex items-center gap-2 ml-2">
            <label
              class="relative w-8 h-8 rounded-full border-2 cursor-pointer overflow-hidden flex items-center justify-center"
              :class="
                isCustomColor
                  ? 'border-gray-900 dark:border-white scale-110'
                  : 'border-gray-300 dark:border-slate-500'
              "
              :style="isCustomColor ? { backgroundColor: form.primaryColor } : {}"
            >
              <span v-if="!isCustomColor" class="material-icons text-gray-400 text-sm"
                >palette</span
              >
              <span v-else class="material-icons text-white text-sm">check</span>
              <input
                type="color"
                :value="form.primaryColor"
                class="absolute inset-0 opacity-0 cursor-pointer"
                @input="form.primaryColor = $event.target.value"
              />
            </label>
            <input
              type="text"
              :value="form.primaryColor"
              class="form-input w-24 text-xs font-mono"
              maxlength="7"
              @change="handleColorInput($event.target.value)"
            />
          </div>
        </div>
      </div>

      <!-- Button Position (only floating mode) -->
      <div v-if="form.mode === 'floating'">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {{ $t('hotels.widgetModal.buttonPosition') }}
        </h4>
        <select v-model="form.triggerPosition" class="form-input w-full">
          <option value="bottom-right">{{ $t('widget.positions.bottomRight') }}</option>
          <option value="bottom-left">{{ $t('widget.positions.bottomLeft') }}</option>
          <option value="top-right">{{ $t('widget.positions.topRight') }}</option>
          <option value="top-left">{{ $t('widget.positions.topLeft') }}</option>
        </select>
      </div>

      <!-- D) Integration Code -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {{ $t('hotels.widgetModal.integrationCode') }}
        </h4>
        <div class="relative">
          <pre
            class="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto font-mono leading-relaxed"
            >{{ embedCode }}</pre
          >
          <button
            type="button"
            class="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            :title="$t('common.copy')"
            @click="copyEmbedCode"
          >
            <span class="material-icons text-sm">{{ copied ? 'check' : 'content_copy' }}</span>
          </button>
        </div>
        <div class="mt-3 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <span class="material-icons text-blue-500 text-lg mt-0.5">info</span>
          <p class="text-xs text-blue-700 dark:text-blue-300">
            {{ $t('hotels.widgetModal.integrationNote') }}
          </p>
        </div>
      </div>

      <!-- Demo Page -->
      <div
        class="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-100 dark:border-purple-800/30"
      >
        <div>
          <h4 class="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
            <span class="material-icons text-purple-500 text-lg">preview</span>
            {{ $t('hotels.widgetModal.demoPage') }}
          </h4>
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {{ $t('hotels.widgetModal.demoPageDesc') }}
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          @click="openDemoPage"
        >
          <span class="material-icons text-base">open_in_new</span>
          {{ $t('hotels.widgetModal.demoPage') }}
        </button>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <button type="button" class="btn-secondary" @click="$emit('update:modelValue', false)">
        {{ $t('common.cancel') }}
      </button>
      <button type="button" class="btn-primary" :disabled="saving" @click="save">
        <span v-if="saving" class="flex items-center">
          <span class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
          {{ $t('common.loading') }}
        </span>
        <span v-else>{{ $t('common.save') }}</span>
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import Toggle from '@/components/ui/form/Toggle.vue'
import hotelService from '@/services/hotelService'

const props = defineProps({
  modelValue: Boolean,
  hotel: Object
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { t } = useI18n()
const toast = useToast()

const loading = ref(false)
const saving = ref(false)
const copied = ref(false)

const presetColors = [
  '#7c3aed',
  '#6366f1',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#8b5cf6'
]

const modes = [
  { key: 'floating', icon: 'widgets' },
  { key: 'inline', icon: 'web' },
  { key: 'fullpage', icon: 'fullscreen' }
]

const themes = [{ key: 'light' }, { key: 'dark' }, { key: 'auto' }]

const form = ref({
  enabled: false,
  mode: 'floating',
  theme: 'light',
  primaryColor: '#7c3aed',
  triggerPosition: 'bottom-right'
})

const isCustomColor = computed(() => !presetColors.includes(form.value.primaryColor))

const partnerId = computed(() => {
  const p = props.hotel?.partner
  if (!p) return ''
  return typeof p === 'object' ? p._id || p.id || '' : p
})

const embedCode = computed(() => {
  const hotelSlug = props.hotel?.slug || 'YOUR-HOTEL-CODE'
  const attrs = [
    `src="https://widget.maxirez.com/widget.js"`,
    `data-hotel="${hotelSlug}"`,
    `data-partner="${partnerId.value || 'YOUR-PARTNER-ID'}"`,
    `data-mode="${form.value.mode}"`,
    `data-theme="${form.value.theme}"`,
    `data-primary-color="${form.value.primaryColor}"`
  ]

  if (form.value.mode === 'floating' && form.value.triggerPosition !== 'bottom-right') {
    attrs.push(`data-position="${form.value.triggerPosition}"`)
  }

  return `<!-- MaxiRez Booking Widget -->\n<script\n  ${attrs.join('\n  ')}\n><` + `/script>`
})

const handleColorInput = val => {
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    form.value.primaryColor = val
  }
}

const copyEmbedCode = async () => {
  try {
    await navigator.clipboard.writeText(embedCode.value)
    copied.value = true
    toast.success(t('common.copied'))
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    toast.error(t('common.copyFailed'))
  }
}

const openDemoPage = () => {
  const hotelName = props.hotel?.name || 'Demo Hotel'
  const primaryColor = form.value.primaryColor || '#7c3aed'

  const cacheBust = Date.now()
  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${hotelName} - Demo</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #1e293b; background: #fff; }

    /* Header */
    .demo-header { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 16px 32px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
    .demo-logo { font-size: 20px; font-weight: 700; color: ${primaryColor}; }
    .demo-nav { display: flex; gap: 24px; }
    .demo-nav a { text-decoration: none; color: #64748b; font-size: 14px; font-weight: 500; }
    .demo-nav a:hover { color: ${primaryColor}; }

    /* Hero */
    .demo-hero { background: linear-gradient(135deg, ${primaryColor}dd, ${primaryColor}88), url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=80') center/cover; min-height: 480px; display: flex; align-items: center; justify-content: center; text-align: center; color: #fff; padding: 60px 32px; }
    .demo-hero h1 { font-size: 48px; font-weight: 700; margin-bottom: 16px; text-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .demo-hero p { font-size: 18px; opacity: 0.9; max-width: 560px; line-height: 1.6; }

    /* Features */
    .demo-features { padding: 80px 32px; max-width: 1100px; margin: 0 auto; }
    .demo-features h2 { text-align: center; font-size: 28px; font-weight: 700; margin-bottom: 48px; color: #0f172a; }
    .demo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
    .demo-card { padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; transition: all 0.2s; }
    .demo-card:hover { border-color: ${primaryColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .demo-card-icon { width: 56px; height: 56px; border-radius: 12px; background: ${primaryColor}15; color: ${primaryColor}; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px; }
    .demo-card h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
    .demo-card p { font-size: 14px; color: #64748b; line-height: 1.5; }

    /* CTA */
    .demo-cta { background: #f8fafc; padding: 64px 32px; text-align: center; }
    .demo-cta h2 { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
    .demo-cta p { color: #64748b; margin-bottom: 24px; }
    .demo-cta-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 32px; background: ${primaryColor}; color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
    .demo-cta-btn:hover { filter: brightness(0.9); }

    /* Footer */
    .demo-footer { background: #0f172a; color: #94a3b8; padding: 32px; text-align: center; font-size: 13px; }

    /* Banner */
    .demo-banner { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: #fef3c7; color: #92400e; padding: 8px 16px; text-align: center; font-size: 13px; font-weight: 500; border-bottom: 1px solid #fcd34d; }
    .demo-banner + .demo-header { top: 35px; }
    body { padding-top: 35px; }

    @media (max-width: 768px) {
      .demo-hero h1 { font-size: 28px; }
      .demo-grid { grid-template-columns: 1fr; }
      .demo-nav { display: none; }
    }
  </style>
</head>
<body>
  <div class="demo-banner">Bu sayfa widget önizlemesi için oluşturulmuş demo bir sayfadır</div>

  <header class="demo-header">
    <div class="demo-logo">${hotelName}</div>
    <nav class="demo-nav">
      <a href="#">Ana Sayfa</a>
      <a href="#">Odalar</a>
      <a href="#">Galeri</a>
      <a href="#">Hakkımızda</a>
      <a href="#">İletişim</a>
    </nav>
  </header>

  <section class="demo-hero">
    <div>
      <h1>${hotelName}</h1>
      <p>Konfor ve huzurun buluştuğu eşsiz bir tatil deneyimi. Unutulmaz anılar biriktireceğiniz özel bir konaklama sizi bekliyor.</p>
    </div>
  </section>

  <section class="demo-features">
    <h2>Neden Bizi Tercih Etmelisiniz?</h2>
    <div class="demo-grid">
      <div class="demo-card">
        <div class="demo-card-icon">&#9733;</div>
        <h3>Premium Konfor</h3>
        <p>Özenle tasarlanmış odalarımızda üst düzey konfor ve modern donanımlarla kendinizi evinizde hissedin.</p>
      </div>
      <div class="demo-card">
        <div class="demo-card-icon">&#9832;</div>
        <h3>Eşsiz Konum</h3>
        <p>Şehrin kalbinde veya doğanın kucağında, mükemmel konumumuzla tüm güzelliklere kolayca ulaşın.</p>
      </div>
      <div class="demo-card">
        <div class="demo-card-icon">&#9829;</div>
        <h3>Özel Hizmet</h3>
        <p>7/24 misafir memnuniyeti odaklı profesyonel ekibimizle fark yaratan bir hizmet anlayışı.</p>
      </div>
    </div>
  </section>

  <section class="demo-cta">
    <h2>Hemen Rezervasyon Yapın</h2>
    <p>En uygun fiyatlarla hayalinizdeki tatili şimdi planlayın</p>
  </section>

  <footer class="demo-footer">
    &copy; 2026 ${hotelName} &mdash; Bu bir demo sayfasıdır. Widget önizlemesi için oluşturulmuştur.
  </footer>

  <script
    src="https://widget.maxirez.com/widget.js?v=${cacheBust}"
    data-hotel="${props.hotel?.slug || ''}"
    data-partner="${partnerId.value}"
    data-mode="${form.value.mode}"
    data-theme="${form.value.theme}"
    data-primary-color="${form.value.primaryColor}"${form.value.mode === 'floating' && form.value.triggerPosition !== 'bottom-right' ? `\n    data-position="${form.value.triggerPosition}"` : ''}
  ><\/script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const loadConfig = async () => {
  if (!props.hotel?._id) return
  loading.value = true
  try {
    const response = await hotelService.getHotel(props.hotel._id)
    if (response.success) {
      const config = response.data?.widgetConfig || {}
      form.value = {
        enabled: config.enabled ?? false,
        mode: config.mode || 'floating',
        theme: config.theme || 'light',
        primaryColor: config.primaryColor || '#7c3aed',
        triggerPosition: config.triggerPosition || 'bottom-right'
      }
    }
  } catch {
    toast.error(t('hotels.fetchError'))
  } finally {
    loading.value = false
  }
}

const save = async () => {
  saving.value = true
  try {
    const response = await hotelService.updateHotel(props.hotel._id, {
      widgetConfig: { ...form.value }
    })
    if (response.success) {
      toast.success(t('hotels.widgetModal.saveSuccess'))
      emit('saved')
      emit('update:modelValue', false)
    }
  } catch {
    toast.error(t('hotels.widgetModal.saveFailed'))
  } finally {
    saving.value = false
  }
}

// Load config when modal opens
watch(
  () => props.modelValue,
  val => {
    if (val) {
      loadConfig()
      copied.value = false
    }
  }
)
</script>
