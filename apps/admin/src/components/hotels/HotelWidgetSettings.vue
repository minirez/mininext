<template>
  <div class="space-y-8">
    <!-- Enable/Disable Widget -->
    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      <div>
        <h3 class="font-medium text-gray-900 dark:text-white">
          {{ $t('hotels.widget.enabled') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
          {{ $t('hotels.widget.enabledDescription') }}
        </p>
      </div>
      <Toggle v-model="form.enabled" />
    </div>

    <template v-if="form.enabled">
      <!-- Appearance Section -->
      <div class="border-b border-gray-200 dark:border-slate-700 pb-8">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-purple-500">palette</span>
          {{ $t('hotels.widget.appearance') }}
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Mode -->
          <div>
            <label class="form-label">{{ $t('hotels.widget.mode') }}</label>
            <select v-model="form.mode" class="form-input">
              <option value="floating">{{ $t('hotels.widget.modes.floating') }}</option>
              <option value="inline">{{ $t('hotels.widget.modes.inline') }}</option>
              <option value="fullpage">{{ $t('hotels.widget.modes.fullpage') }}</option>
            </select>
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {{ modeDescription }}
            </p>
          </div>

          <!-- Theme -->
          <div>
            <label class="form-label">{{ $t('hotels.widget.theme') }}</label>
            <select v-model="form.theme" class="form-input">
              <option value="light">{{ $t('hotels.widget.themes.light') }}</option>
              <option value="dark">{{ $t('hotels.widget.themes.dark') }}</option>
              <option value="auto">{{ $t('hotels.widget.themes.auto') }}</option>
            </select>
          </div>

          <!-- Primary Color -->
          <div>
            <label class="form-label">{{ $t('hotels.widget.primaryColor') }}</label>
            <div class="flex items-center gap-3">
              <input
                v-model="form.primaryColor"
                type="color"
                class="w-12 h-10 rounded cursor-pointer border border-gray-300 dark:border-slate-600"
              />
              <input
                v-model="form.primaryColor"
                type="text"
                class="form-input flex-1"
                placeholder="#7c3aed"
              />
            </div>
          </div>

          <!-- Trigger Position (only for floating mode) -->
          <div v-if="form.mode === 'floating'">
            <label class="form-label">{{ $t('hotels.widget.triggerPosition') }}</label>
            <select v-model="form.triggerPosition" class="form-input">
              <option value="bottom-right">{{ $t('hotels.widget.positions.bottomRight') }}</option>
              <option value="bottom-left">{{ $t('hotels.widget.positions.bottomLeft') }}</option>
              <option value="top-right">{{ $t('hotels.widget.positions.topRight') }}</option>
              <option value="top-left">{{ $t('hotels.widget.positions.topLeft') }}</option>
            </select>
          </div>
        </div>

        <!-- Trigger Text (multilingual) -->
        <div v-if="form.mode === 'floating'" class="mt-6">
          <label class="form-label">{{ $t('hotels.widget.triggerText') }}</label>
          <MultiLangInput
            v-model="form.triggerText"
            :languages="B2C_LANGUAGES"
            :placeholder="$t('hotels.widget.triggerTextPlaceholder')"
            :help="$t('hotels.widget.triggerTextHelp')"
          />
        </div>
      </div>

      <!-- WhatsApp Section -->
      <div class="border-b border-gray-200 dark:border-slate-700 pb-8">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-green-500">chat</span>
          {{ $t('hotels.widget.whatsapp.title') }}
        </h3>

        <div class="flex items-center gap-4 mb-4">
          <Toggle v-model="form.whatsapp.enabled" />
          <span class="text-sm text-gray-600 dark:text-slate-400">
            {{ $t('hotels.widget.whatsapp.enable') }}
          </span>
        </div>

        <div v-if="form.whatsapp.enabled" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="form-label">{{ $t('hotels.widget.whatsapp.number') }}</label>
            <PhoneInput
              v-model="form.whatsapp.number"
              :placeholder="$t('hotels.widget.whatsapp.numberPlaceholder')"
            />
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {{ $t('hotels.widget.whatsapp.numberHelp') }}
            </p>
          </div>

          <div class="md:col-span-2">
            <label class="form-label">{{ $t('hotels.widget.whatsapp.message') }}</label>
            <MultiLangInput
              v-model="form.whatsapp.message"
              :languages="B2C_LANGUAGES"
              type="textarea"
              :placeholder="$t('hotels.widget.whatsapp.messagePlaceholder')"
            />
          </div>
        </div>
      </div>

      <!-- Payment Methods Section -->
      <div class="border-b border-gray-200 dark:border-slate-700 pb-8">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-blue-500">payment</span>
          {{ $t('hotels.widget.paymentMethods.title') }}
        </h3>

        <div class="space-y-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.paymentMethods.creditCard"
              type="checkbox"
              class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <div>
              <span class="font-medium text-gray-700 dark:text-slate-300">
                {{ $t('hotels.widget.paymentMethods.creditCard') }}
              </span>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('hotels.widget.paymentMethods.creditCardDesc') }}
              </p>
            </div>
          </label>

          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.paymentMethods.payAtHotel"
              type="checkbox"
              class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <div>
              <span class="font-medium text-gray-700 dark:text-slate-300">
                {{ $t('hotels.widget.paymentMethods.payAtHotel') }}
              </span>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('hotels.widget.paymentMethods.payAtHotelDesc') }}
              </p>
            </div>
          </label>

          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.paymentMethods.bankTransfer"
              type="checkbox"
              class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <div>
              <span class="font-medium text-gray-700 dark:text-slate-300">
                {{ $t('hotels.widget.paymentMethods.bankTransfer') }}
              </span>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('hotels.widget.paymentMethods.bankTransferDesc') }}
              </p>
            </div>
          </label>
        </div>
      </div>

      <!-- Guest Options Section -->
      <div class="border-b border-gray-200 dark:border-slate-700 pb-8">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-amber-500">person</span>
          {{ $t('hotels.widget.guestOptions.title') }}
        </h3>

        <div class="space-y-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.guestOptions.requirePhone"
              type="checkbox"
              class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span class="text-gray-700 dark:text-slate-300">
              {{ $t('hotels.widget.guestOptions.requirePhone') }}
            </span>
          </label>

          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.guestOptions.requireNationality"
              type="checkbox"
              class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span class="text-gray-700 dark:text-slate-300">
              {{ $t('hotels.widget.guestOptions.requireNationality') }}
            </span>
          </label>

          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.guestOptions.requireBirthDate"
              type="checkbox"
              class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span class="text-gray-700 dark:text-slate-300">
              {{ $t('hotels.widget.guestOptions.requireBirthDate') }}
            </span>
          </label>
        </div>
      </div>

      <!-- Display Options Section -->
      <div class="border-b border-gray-200 dark:border-slate-700 pb-8">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-indigo-500">visibility</span>
          {{ $t('hotels.widget.displayOptions.title') }}
        </h3>

        <div class="space-y-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.showRoomCapacity"
              type="checkbox"
              class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span class="text-gray-700 dark:text-slate-300">
              {{ $t('hotels.widget.displayOptions.showRoomCapacity') }}
            </span>
          </label>

          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.showCampaigns"
              type="checkbox"
              class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span class="text-gray-700 dark:text-slate-300">
              {{ $t('hotels.widget.displayOptions.showCampaigns') }}
            </span>
          </label>

          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.showOriginalPrice"
              type="checkbox"
              class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span class="text-gray-700 dark:text-slate-300">
              {{ $t('hotels.widget.displayOptions.showOriginalPrice') }}
            </span>
          </label>

          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.showPoweredBy"
              type="checkbox"
              class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span class="text-gray-700 dark:text-slate-300">
              {{ $t('hotels.widget.displayOptions.showPoweredBy') }}
            </span>
          </label>
        </div>
      </div>

      <!-- Booking Rules Section -->
      <div class="border-b border-gray-200 dark:border-slate-700 pb-8">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-red-500">rule</span>
          {{ $t('hotels.widget.bookingRules.title') }}
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="form-label">{{ $t('hotels.widget.bookingRules.minAdvance') }}</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="form.minAdvanceBookingDays"
                type="number"
                min="0"
                max="365"
                class="form-input"
              />
              <span class="text-gray-500 dark:text-slate-400">{{ $t('common.days') }}</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {{ $t('hotels.widget.bookingRules.minAdvanceHelp') }}
            </p>
          </div>

          <div>
            <label class="form-label">{{ $t('hotels.widget.bookingRules.maxAdvance') }}</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="form.maxAdvanceBookingDays"
                type="number"
                min="1"
                max="730"
                class="form-input"
              />
              <span class="text-gray-500 dark:text-slate-400">{{ $t('common.days') }}</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {{ $t('hotels.widget.bookingRules.maxAdvanceHelp') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Demo Page -->
      <div class="border-b border-gray-200 dark:border-slate-700 pb-8">
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

      <!-- Embed Code Section -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-gray-500">code</span>
          {{ $t('hotels.widget.embedCode.title') }}
        </h3>

        <p class="text-sm text-gray-600 dark:text-slate-400 mb-4">
          {{ $t('hotels.widget.embedCode.description') }}
        </p>

        <div class="relative">
          <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">{{
            embedCode
          }}</pre>
          <button
            type="button"
            class="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
            @click="copyEmbedCode"
          >
            <span class="material-icons text-lg">{{ copied ? 'check' : 'content_copy' }}</span>
          </button>
        </div>

        <div
          class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
        >
          <div class="flex items-start gap-2">
            <span class="material-icons text-blue-500 mt-0.5">info</span>
            <div class="text-sm text-blue-700 dark:text-blue-400">
              {{ $t('hotels.widget.embedCode.note') }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Toggle from '@/components/ui/form/Toggle.vue'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import { B2C_LANGUAGES } from '@/constants/languages'

const props = defineProps({
  hotel: {
    type: Object,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const { t } = useI18n()
const toast = useToast()
const copied = ref(false)

// Form state
const form = ref({
  enabled: true,
  mode: 'floating',
  theme: 'light',
  primaryColor: '#7c3aed',
  triggerPosition: 'bottom-right',
  triggerText: {},
  whatsapp: {
    enabled: false,
    number: '',
    message: {}
  },
  paymentMethods: {
    creditCard: true,
    payAtHotel: true,
    bankTransfer: false
  },
  guestOptions: {
    requireNationality: true,
    requireBirthDate: false,
    requirePhone: true
  },
  showPoweredBy: true,
  showRoomCapacity: true,
  showCampaigns: true,
  showOriginalPrice: true,
  minAdvanceBookingDays: 0,
  maxAdvanceBookingDays: 365
})

// Mode descriptions
const modeDescription = computed(() => {
  const descriptions = {
    floating: t('hotels.widget.modes.floatingDesc'),
    inline: t('hotels.widget.modes.inlineDesc'),
    fullpage: t('hotels.widget.modes.fullpageDesc')
  }
  return descriptions[form.value.mode] || ''
})

// Resolve partner ID
const partnerId = computed(() => {
  const p = props.hotel?.partner
  if (!p) return ''
  return typeof p === 'object' ? p._id || p.id || '' : p
})

// Generate embed code
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

// Open demo page in new tab
const openDemoPage = () => {
  const hotelName = props.hotel?.name || 'Demo Hotel'
  const primaryColor = form.value.primaryColor || '#7c3aed'
  const cacheBust = Date.now()

  const html =
    `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${hotelName} - Demo</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #1e293b; background: #fff; }
    .demo-header { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 16px 32px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
    .demo-logo { font-size: 20px; font-weight: 700; color: ${primaryColor}; }
    .demo-nav { display: flex; gap: 24px; }
    .demo-nav a { text-decoration: none; color: #64748b; font-size: 14px; font-weight: 500; }
    .demo-nav a:hover { color: ${primaryColor}; }
    .demo-hero { background: linear-gradient(135deg, ${primaryColor}dd, ${primaryColor}88), url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=80') center/cover; min-height: 480px; display: flex; align-items: center; justify-content: center; text-align: center; color: #fff; padding: 60px 32px; }
    .demo-hero h1 { font-size: 48px; font-weight: 700; margin-bottom: 16px; text-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .demo-hero p { font-size: 18px; opacity: 0.9; max-width: 560px; line-height: 1.6; }
    .demo-features { padding: 80px 32px; max-width: 1100px; margin: 0 auto; }
    .demo-features h2 { text-align: center; font-size: 28px; font-weight: 700; margin-bottom: 48px; color: #0f172a; }
    .demo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
    .demo-card { padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; transition: all 0.2s; }
    .demo-card:hover { border-color: ${primaryColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .demo-card-icon { width: 56px; height: 56px; border-radius: 12px; background: ${primaryColor}15; color: ${primaryColor}; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px; }
    .demo-card h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
    .demo-card p { font-size: 14px; color: #64748b; line-height: 1.5; }
    .demo-cta { background: #f8fafc; padding: 64px 32px; text-align: center; }
    .demo-cta h2 { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
    .demo-cta p { color: #64748b; margin-bottom: 24px; }
    .demo-footer { background: #0f172a; color: #94a3b8; padding: 32px; text-align: center; font-size: 13px; }
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
  <div class="demo-banner">Bu sayfa widget \u00f6nizlemesi i\u00e7in olu\u015fturulmu\u015f demo bir sayfad\u0131r</div>
  <header class="demo-header">
    <div class="demo-logo">${hotelName}</div>
    <nav class="demo-nav">
      <a href="#">Ana Sayfa</a>
      <a href="#">Odalar</a>
      <a href="#">Galeri</a>
      <a href="#">Hakk\u0131m\u0131zda</a>
      <a href="#">\u0130leti\u015fim</a>
    </nav>
  </header>
  <section class="demo-hero">
    <div>
      <h1>${hotelName}</h1>
      <p>Konfor ve huzurun bulu\u015ftu\u011fu e\u015fsiz bir tatil deneyimi. Unutulmaz an\u0131lar biriktirece\u011finiz \u00f6zel bir konaklama sizi bekliyor.</p>
    </div>
  </section>
  <section class="demo-features">
    <h2>Neden Bizi Tercih Etmelisiniz?</h2>
    <div class="demo-grid">
      <div class="demo-card">
        <div class="demo-card-icon">&#9733;</div>
        <h3>Premium Konfor</h3>
        <p>\u00d6zenle tasarlanm\u0131\u015f odalar\u0131m\u0131zda \u00fcst d\u00fczey konfor ve modern donan\u0131mlarla kendinizi evinizde hissedin.</p>
      </div>
      <div class="demo-card">
        <div class="demo-card-icon">&#9832;</div>
        <h3>E\u015fsiz Konum</h3>
        <p>\u015eehrin kalbinde veya do\u011fan\u0131n kuca\u011f\u0131nda, m\u00fckemmel konumumuzla t\u00fcm g\u00fczelliklere kolayca ula\u015f\u0131n.</p>
      </div>
      <div class="demo-card">
        <div class="demo-card-icon">&#9829;</div>
        <h3>\u00d6zel Hizmet</h3>
        <p>7/24 misafir memnuniyeti odakl\u0131 profesyonel ekibimizle fark yaratan bir hizmet anlay\u0131\u015f\u0131.</p>
      </div>
    </div>
  </section>
  <section class="demo-cta">
    <h2>Hemen Rezervasyon Yap\u0131n</h2>
    <p>En uygun fiyatlarla hayalinizdeki tatili \u015fimdi planlay\u0131n</p>
  </section>
  <footer class="demo-footer">
    &copy; 2026 ${hotelName} &mdash; Bu bir demo sayfas\u0131d\u0131r. Widget \u00f6nizlemesi i\u00e7in olu\u015fturulmu\u015ftur.
  </footer>
  <script
    src="https://widget.maxirez.com/widget.js?v=${cacheBust}"
    data-hotel="${props.hotel?.slug || ''}"
    data-partner="${partnerId.value}"
    data-mode="${form.value.mode}"
    data-theme="${form.value.theme}"
    data-primary-color="${form.value.primaryColor}"${form.value.mode === 'floating' && form.value.triggerPosition !== 'bottom-right' ? `\n    data-position="${form.value.triggerPosition}"` : ''}
  ><` +
    `/script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Copy embed code to clipboard
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

// Initialize form from hotel data
const initializeForm = () => {
  const config = props.hotel?.widgetConfig || {}

  form.value = {
    enabled: config.enabled ?? true,
    mode: config.mode || 'floating',
    theme: config.theme || 'light',
    primaryColor: config.primaryColor || '#7c3aed',
    triggerPosition: config.triggerPosition || 'bottom-right',
    triggerText: config.triggerText || {},
    whatsapp: {
      enabled: config.whatsapp?.enabled ?? false,
      number: config.whatsapp?.number || props.hotel?.contact?.phone || '',
      message: config.whatsapp?.message || {}
    },
    paymentMethods: {
      creditCard: config.paymentMethods?.creditCard ?? true,
      payAtHotel: config.paymentMethods?.payAtHotel ?? true,
      bankTransfer: config.paymentMethods?.bankTransfer ?? false
    },
    guestOptions: {
      requireNationality: config.guestOptions?.requireNationality ?? true,
      requireBirthDate: config.guestOptions?.requireBirthDate ?? false,
      requirePhone: config.guestOptions?.requirePhone ?? true
    },
    showPoweredBy: config.showPoweredBy ?? true,
    showRoomCapacity: config.showRoomCapacity ?? true,
    showCampaigns: config.showCampaigns ?? true,
    showOriginalPrice: config.showOriginalPrice ?? true,
    minAdvanceBookingDays: config.minAdvanceBookingDays ?? 0,
    maxAdvanceBookingDays: config.maxAdvanceBookingDays ?? 365
  }
}

// Get form data for saving
const getFormData = () => {
  return {
    widgetConfig: { ...form.value }
  }
}

// Watch for hotel changes
watch(
  () => props.hotel,
  () => {
    initializeForm()
  },
  { deep: true }
)

onMounted(() => {
  initializeForm()
})

// Expose methods
defineExpose({
  getFormData
})
</script>
