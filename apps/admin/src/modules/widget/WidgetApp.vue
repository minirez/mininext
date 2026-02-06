<template>
  <div
    ref="widgetRoot"
    class="widget-root"
    :class="{ 'dark': isDark }"
  >
    <!-- Floating Mode: Trigger Button + Modal -->
    <template v-if="config.mode === 'floating'">
      <WidgetTrigger @open="openWidget" />
      <WidgetModal
        :is-open="isOpen"
        @close="closeWidget"
      >
        <WidgetContent />
      </WidgetModal>
    </template>

    <!-- Inline Mode: Compact Search + Modal -->
    <template v-else-if="config.mode === 'inline'">
      <div class="widget-inline">
        <CompactSearch @search="handleSearch" />
      </div>
      <WidgetModal
        :is-open="isOpen"
        @close="closeWidget"
      >
        <WidgetContent />
      </WidgetModal>
    </template>

    <!-- Fullpage Mode: Direct Content -->
    <template v-else>
      <div class="widget-fullpage">
        <WidgetContent :show-header="true" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWidgetStore } from './stores/widgetStore'
import { useWidgetApi } from './composables/useWidgetApi'
import { useWidgetTheme } from './composables/useWidgetTheme'

// Components
import WidgetTrigger from './components/WidgetTrigger.vue'
import WidgetModal from './components/WidgetModal.vue'
import WidgetContent from './components/WidgetContent.vue'
import CompactSearch from './components/CompactSearch.vue'

const props = defineProps({
  hotelCode: {
    type: String,
    required: true
  },
  partnerId: {
    type: String,
    default: null
  },
  mode: {
    type: String,
    default: 'floating',
    validator: (v) => ['floating', 'inline', 'fullpage'].includes(v)
  },
  theme: {
    type: String,
    default: 'light'
  },
  primaryColor: {
    type: String,
    default: '#7c3aed'
  },
  language: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['ready', 'booking-created', 'error'])

// Refs
const widgetRoot = ref(null)

// Store & Composables
const store = useWidgetStore()
const api = useWidgetApi()
const { isDark, applyTheme, watchThemeChanges } = useWidgetTheme()
const { locale } = useI18n()

// Computed
const config = computed(() => store.config)
const isOpen = computed(() => store.isOpen)

// Methods
function openWidget() {
  store.openWidget()
}

function closeWidget() {
  store.closeWidget()
}

async function handleSearch() {
  store.openWidget()
  store.goToStep(2) // Go to rooms
}

// Initialize widget
async function initialize() {
  try {
    // Initialize store with config
    await store.initialize({
      hotelCode: props.hotelCode,
      partnerId: props.partnerId,
      mode: props.mode,
      theme: props.theme,
      primaryColor: props.primaryColor,
      language: props.language
    })

    // Set locale
    if (store.config.language) {
      locale.value = store.config.language
    }

    // Detect market
    const marketData = await api.detectMarket()
    store.setMarket(marketData)

    // Load hotel data (with partner validation if partnerId provided)
    const hotelData = await api.getHotel(props.hotelCode, props.partnerId)
    store.setHotel(hotelData)

    // Load widget config
    const widgetConfig = await api.getWidgetConfig(props.hotelCode, props.partnerId)
    if (widgetConfig) {
      store.setHotelConfig(widgetConfig)
    }

    // Apply theme
    applyTheme(widgetRoot.value)
    watchThemeChanges(widgetRoot.value)

    // Emit ready event
    emit('ready', { hotel: hotelData, market: marketData })
  } catch (err) {
    console.error('Widget initialization failed:', err)
    emit('error', err)
  }
}

// Provide store to children
provide('widgetStore', store)
provide('widgetApi', api)

// Lifecycle
onMounted(() => {
  initialize()
})
</script>

<style>
@import './styles/widget.css';
</style>
