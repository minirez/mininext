<template>
  <div
    class="responsive-viewer min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
  >
    <!-- Top Toolbar -->
    <div
      class="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700 px-4 py-2.5"
    >
      <!-- Row 1: Site + Devices + Export -->
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <!-- Left: URL selector + path input -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
            <button
              v-for="site in sites"
              :key="site.url"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
              :class="
                activeSiteBase === site.url
                  ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
              "
              @click="setActiveSiteBase(site.url)"
            >
              {{ site.label }}
            </button>
          </div>
          <div
            class="hidden lg:flex items-center gap-0.5 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 px-2 py-1"
          >
            <span class="text-xs text-gray-400 font-mono shrink-0">{{ activeSiteBase }}</span>
            <input
              v-model="activePath"
              type="text"
              class="text-xs text-gray-600 dark:text-slate-300 font-mono bg-transparent border-none outline-none w-48"
              placeholder="/admin/dashboard"
              @keydown.enter="refreshIframes"
            />
            <button
              class="text-gray-400 hover:text-blue-500 shrink-0"
              @click="refreshIframes"
              title="Navigate to this path"
            >
              <span class="material-icons text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

        <!-- Center: Device selector -->
        <div class="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
          <button
            v-for="device in devices"
            :key="device.id"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
            :class="
              selectedDevices.includes(device.id)
                ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
            "
            @click="toggleDevice(device.id)"
            :title="device.name"
          >
            <span class="material-icons text-lg">{{ device.icon }}</span>
            <span class="hidden xl:inline text-xs">{{ device.name }}</span>
          </button>
        </div>

        <!-- Right: Scroll + Export -->
        <div class="flex items-center gap-2">
          <div
            class="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg px-2 py-1.5"
            :class="{ 'ring-1 ring-blue-400': scrollOverride }"
            title="Scroll Y — auto-tracked from iframe, click lock to override"
          >
            <span class="material-icons text-gray-400 text-sm">swap_vert</span>
            <input
              v-model.number="exportScrollY"
              type="number"
              min="0"
              step="100"
              class="w-16 text-xs text-gray-600 dark:text-slate-300 font-mono bg-transparent border-none outline-none text-center"
              placeholder="0"
              @focus="scrollOverride = true"
            />
            <span class="text-[10px] text-gray-400">px</span>
            <button
              v-if="scrollOverride"
              class="text-blue-400 hover:text-blue-600 ml-0.5"
              title="Unlock — resume auto-tracking scroll"
              @click="scrollOverride = false"
            >
              <span class="material-icons text-xs">lock</span>
            </button>
          </div>
          <button
            @click="exportAsPng"
            :disabled="exporting"
            class="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <span v-if="exporting" class="material-icons text-sm animate-spin">refresh</span>
            <span v-else class="material-icons text-sm">image</span>
            PNG
          </button>
        </div>
      </div>

      <!-- Row 2: Controls -->
      <div class="flex items-center gap-3 mt-2 flex-wrap">
        <!-- Device Scale (slider 1) — scales entire device visually -->
        <div
          class="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg px-2.5 py-1.5"
        >
          <span class="material-icons text-gray-400 text-sm">zoom_out</span>
          <input
            v-model.number="pageZoom"
            type="range"
            min="30"
            max="200"
            step="5"
            class="w-24 h-1.5 accent-blue-600 cursor-pointer"
          />
          <span class="material-icons text-gray-400 text-sm">zoom_in</span>
          <span class="text-xs text-gray-500 font-mono w-10 text-center">{{ pageZoom }}%</span>
          <button
            v-if="pageZoom !== 100"
            class="text-gray-400 hover:text-blue-500"
            @click="pageZoom = 100"
            title="Reset device scale"
          >
            <span class="material-icons text-sm">restart_alt</span>
          </button>
        </div>

        <!-- Content Zoom (slider 2) — zooms page content inside iframe only -->
        <div
          class="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg px-2.5 py-1.5"
        >
          <span class="material-icons text-gray-400 text-sm">web</span>
          <input
            v-model.number="contentZoom"
            type="range"
            min="25"
            max="200"
            step="5"
            class="w-20 h-1.5 accent-indigo-500 cursor-pointer"
          />
          <span class="text-xs text-gray-500 font-mono w-10 text-center">{{ contentZoom }}%</span>
          <button
            v-if="contentZoom !== 100"
            class="text-gray-400 hover:text-indigo-500"
            @click="contentZoom = 100"
            title="Reset content zoom"
          >
            <span class="material-icons text-sm">restart_alt</span>
          </button>
        </div>

        <div class="w-px h-6 bg-gray-200 dark:bg-slate-600"></div>

        <!-- Rotation -->
        <div
          class="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg px-2.5 py-1.5"
        >
          <span class="material-icons text-gray-400 text-sm">360</span>
          <input
            v-model.number="rotationY"
            type="range"
            min="-45"
            max="45"
            step="1"
            class="w-16 h-1.5 accent-amber-500 cursor-pointer"
          />
          <span class="text-xs text-gray-500 font-mono w-8 text-center">{{ rotationY }}°</span>
        </div>

        <!-- Tilt -->
        <div
          class="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg px-2.5 py-1.5"
        >
          <span class="material-icons text-gray-400 text-sm">flip</span>
          <input
            v-model.number="tiltX"
            type="range"
            min="-30"
            max="30"
            step="1"
            class="w-16 h-1.5 accent-emerald-500 cursor-pointer"
          />
          <span class="text-xs text-gray-500 font-mono w-8 text-center">{{ tiltX }}°</span>
        </div>

        <!-- Tilt presets -->
        <div class="flex items-center gap-1">
          <button
            v-for="preset in tiltPresets"
            :key="preset.name"
            class="px-1.5 py-1 text-xs rounded-md transition-colors"
            :class="
              rotationY === preset.ry && tiltX === preset.tx
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            "
            @click="applyTiltPreset(preset)"
            :title="preset.name"
          >
            {{ preset.label }}
          </button>
        </div>

        <div class="w-px h-6 bg-gray-200 dark:bg-slate-600"></div>

        <!-- Device Color -->
        <div class="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg px-2.5 py-1.5">
          <span class="text-xs text-gray-500 mr-1">Frame</span>
          <button
            class="w-5 h-5 rounded-full border-2 transition-all bg-[#1a1a1e]"
            :class="deviceColor === 'black' ? 'border-blue-500 scale-110' : 'border-gray-300'"
            @click="deviceColor = 'black'"
            title="Black frame"
          />
          <button
            class="w-5 h-5 rounded-full border-2 transition-all bg-white"
            :class="deviceColor === 'white' ? 'border-blue-500 scale-110' : 'border-gray-300'"
            @click="deviceColor = 'white'"
            title="White frame"
          />
        </div>

        <!-- Shadow -->
        <div
          class="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg px-2.5 py-1.5"
        >
          <span class="material-icons text-gray-400 text-sm">blur_on</span>
          <input
            v-model.number="shadowIntensity"
            type="range"
            min="0"
            max="100"
            step="5"
            class="w-16 h-1.5 accent-gray-500 cursor-pointer"
          />
          <span class="text-xs text-gray-500 font-mono w-8 text-center"
            >{{ shadowIntensity }}%</span
          >
        </div>

        <div class="w-px h-6 bg-gray-200 dark:bg-slate-600"></div>

        <!-- Free Move -->
        <button
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all"
          :class="
            freeMode
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 ring-1 ring-blue-300'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-500 hover:text-gray-700'
          "
          @click="freeMode = !freeMode"
          title="Free position mode - drag devices to reposition"
        >
          <span class="material-icons text-sm">open_with</span>
          <span class="text-xs">Free</span>
        </button>

        <button
          v-if="freeMode"
          class="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-slate-700 text-gray-500 hover:text-gray-700"
          @click="resetFreePositions"
          title="Reset all positions"
        >
          <span class="material-icons text-sm">restart_alt</span>
        </button>

        <div class="w-px h-6 bg-gray-200 dark:bg-slate-600"></div>

        <!-- Background -->
        <div class="relative" ref="bgPickerRef">
          <button
            class="w-7 h-7 rounded-full border-2 transition-all duration-200 border-blue-400"
            :style="{ background: activeBgPreview }"
            @click="showBgPicker = !showBgPicker"
            title="Background color"
          />
          <div
            v-if="showBgPicker"
            class="absolute left-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 p-3 z-50 w-64"
          >
            <div class="text-xs font-medium text-gray-500 mb-2">Presets</div>
            <div class="grid grid-cols-8 gap-1.5 mb-3">
              <button
                v-for="bg in presetColors"
                :key="bg.value"
                class="w-6 h-6 rounded-full border-2 transition-all"
                :class="
                  selectedBg === bg.value
                    ? 'border-blue-500 scale-110'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-400'
                "
                :style="{ background: bg.preview }"
                @click="selectBg(bg.value)"
                :title="bg.name"
              />
            </div>
            <div class="text-xs font-medium text-gray-500 mb-2">Custom</div>
            <div class="flex items-center gap-2">
              <div class="relative">
                <div
                  class="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer"
                  :style="{ backgroundColor: customColor }"
                  @click="$refs.hiddenColorInput.click()"
                ></div>
                <input ref="hiddenColorInput" v-model="customColor" type="color" class="sr-only" />
              </div>
              <input
                v-model="customColor"
                type="text"
                class="flex-1 text-xs font-mono bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5"
                placeholder="#hex"
              />
              <button
                class="text-xs px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                @click="selectBg('custom')"
              >
                Use
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Device Canvas -->
    <div
      ref="canvasContainer"
      class="overflow-auto"
      :class="canvasBgClass"
      :style="canvasContainerStyle"
    >
      <div
        ref="captureArea"
        class="device-canvas"
        :class="freeMode ? 'relative' : 'inline-flex items-end justify-center gap-8'"
        :style="captureAreaStyle"
      >
        <div
          v-for="device in activeDevices"
          :key="device.id"
          class="device-wrapper flex flex-col items-center shrink-0"
          :class="{ 'absolute cursor-grab active:cursor-grabbing': freeMode }"
          :style="getDeviceWrapperStyle(device)"
          @mousedown="freeMode ? startDrag($event, device.id) : null"
        >
          <div class="relative" :style="getDeviceShadowStyle()">
            <!-- Phone Frame -->
            <div v-if="device.type === 'phone'" class="device-phone">
              <div class="phone-frame" :class="frameColorClass" :style="getPhoneFrameStyle(device)">
                <div class="phone-notch" :style="{ top: `${device.bezel}px` }"></div>
                <div class="phone-screen" :style="{ borderRadius: `${device.screenRadius}px` }">
                  <div class="iframe-clip-box" :style="getScreenClipStyle(device)">
                    <iframe
                      :key="device.id + '-' + iframeKey"
                      :ref="el => setIframeRef(device.id, el)"
                      :src="iframeSrc"
                      :style="getIframeStyle(device)"
                      class="device-iframe"
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                      loading="lazy"
                      @load="onIframeLoad(device.id)"
                    />
                  </div>
                </div>
                <div class="phone-button-right" :class="buttonColorClass"></div>
                <div class="phone-button-left-top" :class="buttonColorClass"></div>
                <div class="phone-button-left-mid" :class="buttonColorClass"></div>
                <div class="phone-button-left-bot" :class="buttonColorClass"></div>
              </div>
            </div>

            <!-- Tablet Frame -->
            <div v-if="device.type === 'tablet'" class="device-tablet">
              <div
                class="tablet-frame"
                :class="tabletFrameColorClass"
                :style="getTabletFrameStyle(device)"
              >
                <div class="tablet-camera"></div>
                <div class="tablet-screen">
                  <div class="iframe-clip-box" :style="getScreenClipStyle(device)">
                    <iframe
                      :key="device.id + '-' + iframeKey"
                      :ref="el => setIframeRef(device.id, el)"
                      :src="iframeSrc"
                      :style="getIframeStyle(device)"
                      class="device-iframe"
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                      loading="lazy"
                      @load="onIframeLoad(device.id)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Laptop Frame -->
            <div v-if="device.type === 'laptop'" class="device-laptop">
              <div
                class="laptop-screen-container"
                :class="laptopFrameColorClass"
                :style="getLaptopContainerStyle(device)"
              >
                <div class="laptop-camera"></div>
                <div class="laptop-screen">
                  <div class="iframe-clip-box" :style="getScreenClipStyle(device)">
                    <iframe
                      :key="device.id + '-' + iframeKey"
                      :ref="el => setIframeRef(device.id, el)"
                      :src="iframeSrc"
                      :style="getIframeStyle(device)"
                      class="device-iframe"
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                      loading="lazy"
                      @load="onIframeLoad(device.id)"
                    />
                  </div>
                </div>
              </div>
              <div class="laptop-base" :style="getLaptopBaseStyle(device)">
                <div class="laptop-notch"></div>
              </div>
              <div class="laptop-bottom" :style="getLaptopBottomStyle(device)"></div>
            </div>

            <!-- Desktop Frame -->
            <div v-if="device.type === 'desktop'" class="device-desktop">
              <div class="imac-body" :class="imacBodyColorClass" :style="getImacBodyStyle(device)">
                <div class="imac-bezel-top">
                  <div class="imac-camera"></div>
                </div>
                <div class="imac-screen" :style="getImacScreenStyle(device)">
                  <div class="iframe-clip-box" :style="getScreenClipStyle(device)">
                    <iframe
                      :key="device.id + '-' + iframeKey"
                      :ref="el => setIframeRef(device.id, el)"
                      :src="iframeSrc"
                      :style="getIframeStyle(device)"
                      class="device-iframe"
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                      loading="lazy"
                      @load="onIframeLoad(device.id)"
                    />
                  </div>
                </div>
                <div class="imac-chin" :class="imacChinColorClass">
                  <div class="imac-logo"></div>
                </div>
              </div>
              <div class="imac-stand">
                <div class="imac-stand-neck"></div>
                <div class="imac-stand-base"></div>
              </div>
            </div>
          </div>

          <!-- Device Label -->
          <div class="device-label text-center mt-3">
            <div class="text-sm font-semibold text-gray-700 dark:text-slate-300">
              {{ device.name }}
            </div>
            <div class="text-xs text-gray-400">
              {{ device.viewport.width }} × {{ device.viewport.height }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { toPng } from 'html-to-image'

const captureArea = ref(null)
const canvasContainer = ref(null)
const exporting = ref(false)
const bgPickerRef = ref(null)
const showBgPicker = ref(false)

const iframeRefs = reactive({})
function setIframeRef(id, el) {
  if (el) iframeRefs[id] = el
}

const sites = [
  { label: 'Maxirez', url: 'https://app.maxirez.com' },
  { label: 'Minirez', url: 'https://app.minirez.com' }
]
const activeSiteBase = ref('https://app.maxirez.com')
const activePath = ref('')
const iframeKey = ref(0)
const iframeScrollY = ref(0)
let pollTimer = null
let suppressPathSync = false

const activeSite = computed(() => activeSiteBase.value + activePath.value)
const iframeSrc = ref(activeSiteBase.value)

function setActiveSiteBase(url) {
  activeSiteBase.value = url
  activePath.value = ''
  iframeScrollY.value = 0
  iframeSrc.value = url
  iframeKey.value++
}

function refreshIframes() {
  iframeSrc.value = activeSite.value
  iframeKey.value++
}

function onIframeLoad(deviceId) {
  syncIframeState(deviceId)
}

function syncIframeState(deviceId) {
  try {
    const iframe = iframeRefs[deviceId]
    if (!iframe?.contentWindow) return

    const iframeUrl = iframe.contentWindow.location?.href
    if (iframeUrl && iframeUrl !== 'about:blank') {
      const parsed = new URL(iframeUrl)
      const baseParsed = new URL(activeSiteBase.value)
      if (parsed.origin === baseParsed.origin) {
        const newPath = parsed.pathname + parsed.search + parsed.hash
        if (newPath !== activePath.value) {
          suppressPathSync = true
          activePath.value = newPath
          setTimeout(() => {
            suppressPathSync = false
          }, 50)
        }
      }
    }

    const scrollTop =
      iframe.contentWindow.document?.documentElement?.scrollTop ||
      iframe.contentWindow.document?.body?.scrollTop ||
      0
    iframeScrollY.value = Math.round(scrollTop)
  } catch {
    // cross-origin — can't access iframe internals
  }
}

function startIframePoll() {
  stopIframePoll()
  pollTimer = setInterval(() => {
    const firstId = activeDevices.value[0]?.id
    if (firstId && iframeRefs[firstId]) {
      syncIframeState(firstId)
    }
  }, 400)
}

function stopIframePoll() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const pageZoom = ref(100)
const contentZoom = ref(100)

const devices = [
  {
    id: 'iphone',
    name: 'iPhone 16 Pro',
    icon: 'smartphone',
    type: 'phone',
    viewport: { width: 393, height: 852 },
    baseScale: 0.55,
    bezel: 12,
    frameRadius: 40,
    screenRadius: 30
  },
  {
    id: 'ipad',
    name: 'iPad Pro 13"',
    icon: 'tablet_mac',
    type: 'tablet',
    viewport: { width: 1024, height: 1366 },
    baseScale: 0.42,
    bezel: 16
  },
  {
    id: 'macbook',
    name: 'MacBook Pro 16"',
    icon: 'laptop_mac',
    type: 'laptop',
    viewport: { width: 1728, height: 1117 },
    baseScale: 0.38,
    bezelH: 22,
    bezelTop: 22,
    bezelBot: 10
  },
  {
    id: 'imac',
    name: 'iMac 27"',
    icon: 'desktop_mac',
    type: 'desktop',
    viewport: { width: 2560, height: 1440 },
    baseScale: 0.3,
    bezel: 14
  }
]

const selectedDevices = ref(['iphone', 'ipad', 'macbook', 'imac'])

const toggleDevice = id => {
  const idx = selectedDevices.value.indexOf(id)
  if (idx > -1) {
    if (selectedDevices.value.length > 1) selectedDevices.value.splice(idx, 1)
  } else {
    selectedDevices.value.push(id)
  }
}

const activeDevices = computed(() => devices.filter(d => selectedDevices.value.includes(d.id)))

const rotationY = ref(0)
const tiltX = ref(0)

const tiltPresets = [
  { name: 'Flat', label: '—', ry: 0, tx: 0 },
  { name: 'Slight Left', label: '↰', ry: -8, tx: 5 },
  { name: 'Slight Right', label: '↱', ry: 8, tx: 5 },
  { name: 'Hero', label: '◇', ry: -15, tx: 10 },
  { name: 'Dramatic', label: '◈', ry: -25, tx: 15 }
]

function applyTiltPreset(preset) {
  rotationY.value = preset.ry
  tiltX.value = preset.tx
}

const deviceTiltStyle = computed(() => ({
  transform: `perspective(1200px) rotateY(${rotationY.value}deg) rotateX(${tiltX.value}deg)`,
  transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
}))

const deviceColor = ref('black')

const frameColorClass = computed(() =>
  deviceColor.value === 'white' ? 'frame-white' : 'frame-black'
)
const buttonColorClass = computed(() =>
  deviceColor.value === 'white' ? 'button-white' : 'button-black'
)
const tabletFrameColorClass = computed(() =>
  deviceColor.value === 'white' ? 'tablet-frame-white' : 'tablet-frame-black'
)
const laptopFrameColorClass = computed(() =>
  deviceColor.value === 'white' ? 'laptop-frame-white' : 'laptop-frame-black'
)
const imacBodyColorClass = computed(() =>
  deviceColor.value === 'white' ? 'imac-body-white' : 'imac-body-black'
)
const imacChinColorClass = computed(() =>
  deviceColor.value === 'white' ? 'imac-chin-white' : 'imac-chin-black'
)

const shadowIntensity = ref(50)

function getDeviceShadowStyle() {
  const i = shadowIntensity.value / 100
  if (i === 0) return { filter: 'none' }
  return {
    filter: `drop-shadow(0 ${10 * i}px ${30 * i}px rgba(0,0,0,${0.25 * i})) drop-shadow(0 ${4 * i}px ${8 * i}px rgba(0,0,0,${0.1 * i}))`
  }
}

const freeMode = ref(false)
const freePositions = reactive({})
const dragging = ref(null)
const dragStart = reactive({ x: 0, y: 0, ox: 0, oy: 0 })

function getDeviceWrapperStyle(device) {
  const base = deviceTiltStyle.value
  if (freeMode.value && freePositions[device.id]) {
    return {
      transform: base.transform,
      transition: base.transition,
      left: freePositions[device.id].x + 'px',
      top: freePositions[device.id].y + 'px'
    }
  }
  return base
}

function startDrag(e, deviceId) {
  if (!freeMode.value) return
  e.preventDefault()
  dragging.value = deviceId
  if (!freePositions[deviceId]) {
    freePositions[deviceId] = { x: 0, y: 0 }
  }
  dragStart.x = e.clientX
  dragStart.y = e.clientY
  dragStart.ox = freePositions[deviceId].x
  dragStart.oy = freePositions[deviceId].y
}

function onDrag(e) {
  if (!dragging.value) return
  const dx = (e.clientX - dragStart.x) / (pageZoom.value / 100)
  const dy = (e.clientY - dragStart.y) / (pageZoom.value / 100)
  freePositions[dragging.value] = {
    x: dragStart.ox + dx,
    y: dragStart.oy + dy
  }
}

function stopDrag() {
  dragging.value = null
}

function resetFreePositions() {
  Object.keys(freePositions).forEach(k => delete freePositions[k])
}

const presetColors = [
  {
    name: 'Transparent',
    value: 'transparent',
    preview: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 10px 10px'
  },
  { name: 'White', value: '#ffffff', preview: '#ffffff' },
  { name: 'Light Gray', value: '#f1f5f9', preview: '#f1f5f9' },
  { name: 'Cool Gray', value: '#94a3b8', preview: '#94a3b8' },
  { name: 'Slate', value: '#334155', preview: '#334155' },
  { name: 'Dark', value: '#0f172a', preview: '#0f172a' },
  { name: 'Black', value: '#000000', preview: '#000000' },
  { name: 'Rose', value: '#fda4af', preview: '#fda4af' },
  { name: 'Red', value: '#ef4444', preview: '#ef4444' },
  { name: 'Orange', value: '#f97316', preview: '#f97316' },
  { name: 'Amber', value: '#f59e0b', preview: '#f59e0b' },
  { name: 'Lime', value: '#84cc16', preview: '#84cc16' },
  { name: 'Emerald', value: '#10b981', preview: '#10b981' },
  { name: 'Teal', value: '#14b8a6', preview: '#14b8a6' },
  { name: 'Sky', value: '#0ea5e9', preview: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6', preview: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1', preview: '#6366f1' },
  { name: 'Purple', value: '#8b5cf6', preview: '#8b5cf6' },
  { name: 'Violet', value: '#7c3aed', preview: '#7c3aed' },
  { name: 'Fuchsia', value: '#d946ef', preview: '#d946ef' },
  { name: 'Pink', value: '#ec4899', preview: '#ec4899' },
  {
    name: 'Gradient Blue',
    value: 'gradient-blue',
    preview: 'linear-gradient(135deg, #667eea, #764ba2)'
  },
  {
    name: 'Gradient Sunset',
    value: 'gradient-sunset',
    preview: 'linear-gradient(135deg, #f093fb, #f5576c)'
  },
  {
    name: 'Gradient Ocean',
    value: 'gradient-ocean',
    preview: 'linear-gradient(135deg, #4facfe, #00f2fe)'
  }
]

const selectedBg = ref('transparent')
const customColor = ref('#6366f1')

const selectBg = value => {
  selectedBg.value = value
  showBgPicker.value = false
}

const activeBgPreview = computed(() => {
  if (selectedBg.value === 'transparent') {
    return 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 10px 10px'
  }
  if (selectedBg.value === 'custom') return customColor.value
  const found = presetColors.find(c => c.value === selectedBg.value)
  return found?.preview || selectedBg.value
})

const canvasBgClass = computed(() => {
  if (selectedBg.value === 'transparent') return 'bg-checkerboard'
  return ''
})

const canvasContainerStyle = computed(() => {
  const style = { minHeight: 'calc(100vh - 120px)' }
  if (selectedBg.value === 'transparent') return style
  if (selectedBg.value === 'custom') {
    style.backgroundColor = customColor.value
  } else if (selectedBg.value.startsWith('gradient-')) {
    const found = presetColors.find(c => c.value === selectedBg.value)
    if (found) style.background = found.preview
  } else {
    style.backgroundColor = selectedBg.value
  }
  return style
})

const captureAreaStyle = computed(() => {
  const s = pageZoom.value / 100
  return {
    transform: `scale(${s})`,
    transformOrigin: 'top left',
    padding: freeMode.value ? '48px 40px 200px' : '48px 40px 32px',
    minWidth: freeMode.value ? '2000px' : undefined,
    minHeight: freeMode.value ? '1500px' : undefined
  }
})

const screenW = device => device.viewport.width * device.baseScale
const screenH = device => device.viewport.height * device.baseScale

/**
 * The clip box is the visible screen area — always same fixed pixel size.
 * Content zoom works by scaling the iframe INSIDE this fixed box.
 */
const getScreenClipStyle = device => ({
  width: screenW(device) + 'px',
  height: screenH(device) + 'px',
  overflow: 'hidden',
  position: 'relative'
})

/**
 * Content zoom: scale the iframe's virtual viewport.
 * At contentZoom 100%: iframe is viewport.width x viewport.height, scaled by baseScale.
 * At contentZoom 50%: iframe is viewport.width*2 x viewport.height*2 (more content), scaled by baseScale*0.5.
 * The visual size stays the same because (viewport * (1/zoom)) * (baseScale * zoom) = viewport * baseScale.
 */
const getIframeStyle = device => {
  const z = contentZoom.value / 100
  const effectiveScale = device.baseScale * z
  const iframeW = device.viewport.width / z
  const iframeH = device.viewport.height / z
  return {
    width: Math.round(iframeW) + 'px',
    height: Math.round(iframeH) + 'px',
    transform: `scale(${effectiveScale})`,
    transformOrigin: 'top left',
    display: 'block'
  }
}

const getPhoneFrameStyle = device => {
  const w = screenW(device)
  const h = screenH(device)
  return {
    width: w + device.bezel * 2 + 'px',
    height: h + device.bezel * 2 + 'px',
    borderRadius: device.frameRadius + 'px',
    padding: device.bezel + 'px'
  }
}

const getTabletFrameStyle = device => {
  const w = screenW(device)
  const h = screenH(device)
  return {
    width: w + device.bezel * 2 + 'px',
    height: h + device.bezel * 2 + 'px',
    padding: device.bezel + 'px'
  }
}

const getLaptopContainerStyle = device => {
  const w = screenW(device)
  const h = screenH(device)
  return {
    width: w + device.bezelH * 2 + 'px',
    height: h + device.bezelTop + device.bezelBot + 'px',
    padding: `${device.bezelTop}px ${device.bezelH}px ${device.bezelBot}px`
  }
}

const getLaptopBaseStyle = device => {
  const containerW = screenW(device) + device.bezelH * 2
  return {
    width: containerW + 80 + 'px',
    marginLeft: '-40px'
  }
}

const getLaptopBottomStyle = device => {
  const containerW = screenW(device) + device.bezelH * 2
  return {
    width: containerW + 120 + 'px',
    marginLeft: '-60px'
  }
}

const getImacBodyStyle = device => {
  const w = screenW(device)
  return {
    width: w + device.bezel * 2 + 'px',
    padding: `0 ${device.bezel}px`
  }
}

const getImacScreenStyle = device => {
  const h = screenH(device)
  return { height: h + 'px' }
}

function getScreenshotUrl() {
  return activeSite.value
}

const screenshotCache = new Map()
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const exportScrollY = ref(0)
const scrollOverride = ref(false)

watch(iframeScrollY, val => {
  if (!scrollOverride.value) exportScrollY.value = val
})

watch(activeSite, () => screenshotCache.clear())
watch(activePath, () => screenshotCache.clear())
watch(exportScrollY, () => screenshotCache.clear())

const loadScreenshot = async (url, width, height, scrollY = 0) => {
  const cacheKey = `${url}::${width}x${height}::${scrollY}`
  if (screenshotCache.has(cacheKey)) return screenshotCache.get(cacheKey)

  const token = localStorage.getItem('token')
  const params = new URLSearchParams({
    url,
    width: String(width),
    height: String(height),
    scrollY: String(scrollY)
  })
  const resp = await fetch(`${API_BASE}/screenshot/capture?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!resp.ok) throw new Error('Screenshot API returned ' + resp.status)

  const blob = await resp.blob()
  const objectUrl = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      screenshotCache.set(cacheKey, img)
      resolve(img)
    }
    img.onerror = () => reject(new Error('Screenshot load failed'))
    img.src = objectUrl
  })
}

const exportAsPng = async () => {
  if (!captureArea.value || exporting.value) return
  exporting.value = true

  const labels = captureArea.value.querySelectorAll('.device-label')
  labels.forEach(el => (el.style.display = 'none'))

  const iframes = captureArea.value.querySelectorAll('iframe.device-iframe')
  const replacements = []

  try {
    const screenshotUrl = getScreenshotUrl()
    const z = contentZoom.value / 100

    const screenshotPromises = activeDevices.value.map(device => {
      const ssWidth = Math.round(device.viewport.width / z)
      const ssHeight = Math.round(device.viewport.height / z)
      return loadScreenshot(screenshotUrl, ssWidth, ssHeight, exportScrollY.value).catch(() => null)
    })

    const screenshots = await Promise.all(screenshotPromises)

    iframes.forEach((iframe, i) => {
      const clipBox = iframe.parentElement
      const screenContainer = clipBox.parentElement

      const clipW = parseFloat(clipBox.style.width)
      const clipH = parseFloat(clipBox.style.height)

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(clipW * 2)
      canvas.height = Math.round(clipH * 2)
      canvas.style.width = clipW + 'px'
      canvas.style.height = clipH + 'px'
      canvas.style.position = 'absolute'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.borderRadius = getComputedStyle(screenContainer).borderRadius

      const ctx = canvas.getContext('2d')
      const img = screenshots[i]

      if (img) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      } else {
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#64748b'
        ctx.font = `${16 * 2}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('Loading...', canvas.width / 2, canvas.height / 2)
      }

      clipBox.style.display = 'none'
      screenContainer.style.position = 'relative'
      screenContainer.appendChild(canvas)
      replacements.push({ clipBox, canvas, screenContainer })
    })

    const isTransparent = selectedBg.value === 'transparent'
    let bgColor = null
    if (!isTransparent) {
      if (selectedBg.value === 'custom') bgColor = customColor.value
      else if (!selectedBg.value.startsWith('gradient-')) bgColor = selectedBg.value
    }

    const dataUrl = await toPng(captureArea.value, {
      pixelRatio: 2,
      cacheBust: true,
      skipAutoScale: true,
      backgroundColor: bgColor,
      includeQueryParams: true,
      filter: node => {
        if (node.tagName === 'IFRAME') return false
        if (node.classList?.contains('iframe-clip-box') && node.style?.display === 'none')
          return false
        return true
      }
    })

    const link = document.createElement('a')
    link.download = `responsive-mockup-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('Export failed:', err)
  } finally {
    for (const { clipBox, canvas, screenContainer } of replacements) {
      clipBox.style.display = ''
      screenContainer.removeChild(canvas)
    }
    labels.forEach(el => (el.style.display = ''))
    exporting.value = false
  }
}

const handleClickOutside = e => {
  if (bgPickerRef.value && !bgPickerRef.value.contains(e.target)) {
    showBgPicker.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  startIframePoll()
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  stopIframePoll()
})
</script>

<style scoped>
.device-iframe {
  border: none;
  display: block;
}

.iframe-clip-box {
  position: relative;
}

/* ===== Phone Frame Colors ===== */
.phone-frame {
  position: relative;
}

.frame-black {
  background: linear-gradient(145deg, #2a2a2e, #1a1a1e);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.frame-white {
  background: linear-gradient(145deg, #f0f0f4, #e0e0e4);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.6),
    inset 0 0 0 1px rgba(255, 255, 255, 0.3);
}

.phone-notch {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 90px;
  height: 26px;
  background: #000;
  border-radius: 0 0 16px 16px;
  z-index: 5;
}

.phone-notch::after {
  content: '';
  position: absolute;
  top: 8px;
  right: 20px;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, #1a3a5c 30%, #0a1a2c 70%);
  border-radius: 50%;
  box-shadow: 0 0 3px rgba(26, 58, 92, 0.5);
}

.phone-screen {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
  position: relative;
}

.button-black {
  background: linear-gradient(180deg, #3a3a3e, #2a2a2e);
}

.button-white {
  background: linear-gradient(180deg, #d8d8dc, #c8c8cc);
}

.phone-button-right {
  position: absolute;
  right: -3px;
  top: 28%;
  width: 3px;
  height: 60px;
  border-radius: 0 2px 2px 0;
}

.phone-button-left-top {
  position: absolute;
  left: -3px;
  top: 18%;
  width: 3px;
  height: 25px;
  border-radius: 2px 0 0 2px;
}

.phone-button-left-mid {
  position: absolute;
  left: -3px;
  top: 28%;
  width: 3px;
  height: 50px;
  border-radius: 2px 0 0 2px;
}

.phone-button-left-bot {
  position: absolute;
  left: -3px;
  top: 40%;
  width: 3px;
  height: 50px;
  border-radius: 2px 0 0 2px;
}

/* ===== Tablet ===== */
.tablet-frame {
  position: relative;
  border-radius: 20px;
}

.tablet-frame-white {
  background: linear-gradient(145deg, #e4e4e8, #c8c8cc);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.tablet-frame-black {
  background: linear-gradient(145deg, #2a2a2e, #1a1a1e);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.tablet-camera {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, #3a3a5c 30%, #2a2a3c 70%);
  border-radius: 50%;
  z-index: 5;
}

.tablet-screen {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

/* ===== Laptop ===== */
.laptop-screen-container {
  position: relative;
  border-radius: 14px 14px 0 0;
}

.laptop-frame-black {
  background: linear-gradient(145deg, #2a2a2e, #1a1a1e);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.laptop-frame-white {
  background: linear-gradient(145deg, #e8e8ec, #d8d8dc);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5);
}

.laptop-camera {
  position: absolute;
  top: 9px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, #1a3a5c 30%, #0a1a2c 70%);
  border-radius: 50%;
}

.laptop-screen {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
  background: #000;
}

.laptop-base {
  height: 14px;
  background: linear-gradient(180deg, #c8c8cc, #b0b0b4);
  margin: 0 auto;
  border-radius: 0 0 2px 2px;
  position: relative;
}

.laptop-notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 160px;
  height: 4px;
  background: linear-gradient(180deg, #a0a0a4, #909094);
  border-radius: 0 0 4px 4px;
}

.laptop-bottom {
  height: 5px;
  background: linear-gradient(180deg, #d4d4d8, #c0c0c4);
  margin: 0 auto;
  border-radius: 0 0 8px 8px;
}

/* ===== Desktop / iMac ===== */
.imac-body {
  border-radius: 14px;
  overflow: hidden;
  box-sizing: border-box;
}

.imac-body-white {
  background: linear-gradient(145deg, #f0f0f4, #e0e0e4);
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.06),
    inset 0 0 0 0px transparent;
}

.imac-body-black {
  background: linear-gradient(145deg, #2a2a2e, #1e1e22);
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.06),
    inset 0 0 0 0px transparent;
}

.imac-bezel-top {
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.imac-camera {
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, #3a5a3c 30%, #1a3a1c 70%);
  border-radius: 50%;
}

.imac-screen {
  width: 100%;
  overflow: hidden;
  background: #000;
}

.imac-chin {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.imac-chin-white {
  background: linear-gradient(180deg, #e8e8ec, #dcdce0);
}

.imac-chin-black {
  background: linear-gradient(180deg, #222226, #1a1a1e);
}

.imac-logo {
  width: 14px;
  height: 17px;
  opacity: 0.25;
  background: radial-gradient(ellipse, #888, transparent);
  border-radius: 50%;
}

.imac-stand {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.imac-stand-neck {
  width: 80px;
  height: 50px;
  background: linear-gradient(90deg, #bbbbbf, #d0d0d4, #bbbbbf);
  clip-path: polygon(18% 0, 82% 0, 100% 100%, 0% 100%);
}

.imac-stand-base {
  width: 180px;
  height: 6px;
  background: linear-gradient(180deg, #c0c0c4, #b0b0b4);
  border-radius: 0 0 4px 4px;
}

/* ===== Checkerboard ===== */
.bg-checkerboard {
  background-image: repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%);
  background-size: 20px 20px;
}
</style>
