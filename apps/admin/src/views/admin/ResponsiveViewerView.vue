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
        <!-- Left: URL selector -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
            <button
              v-for="site in sites"
              :key="site.url"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
              :class="
                activeSite === site.url
                  ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
              "
              @click="activeSite = site.url"
            >
              {{ site.label }}
            </button>
          </div>
          <div class="text-xs text-gray-400 font-mono hidden lg:block">{{ activeSite }}</div>
        </div>

        <!-- Center: Device selector -->
        <div class="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
          <button
            v-for="device in devices"
            :key="device.id"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
            :class="
              selectedDevices.includes(device.id)
                ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
            "
            @click="toggleDevice(device.id)"
            :title="device.name"
          >
            <span class="material-icons text-lg">{{ device.icon }}</span>
            <span class="hidden xl:inline text-xs">{{ device.name }}</span>
          </button>
        </div>

        <!-- Right: Controls row -->
        <div class="flex items-center gap-2">
          <!-- Page zoom -->
          <div class="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg px-2 py-1">
            <span class="material-icons text-gray-400 text-sm">zoom_out</span>
            <input
              v-model.number="pageZoom"
              type="range"
              min="30"
              max="200"
              step="5"
              class="w-24 h-1.5 accent-purple-600 cursor-pointer"
            />
            <span class="material-icons text-gray-400 text-sm">zoom_in</span>
            <span class="text-xs text-gray-500 font-mono w-9 text-center">{{ pageZoom }}%</span>
            <button
              v-if="pageZoom !== 100"
              class="text-gray-400 hover:text-purple-500"
              @click="pageZoom = 100"
              title="Reset zoom"
            >
              <span class="material-icons text-sm">restart_alt</span>
            </button>
          </div>

          <!-- Iframe zoom -->
          <div class="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg px-2 py-1">
            <span class="material-icons text-gray-400 text-sm">web</span>
            <input
              v-model.number="iframeZoom"
              type="range"
              min="25"
              max="200"
              step="5"
              class="w-20 h-1.5 accent-indigo-500 cursor-pointer"
            />
            <span class="text-xs text-gray-500 font-mono w-9 text-center">{{ iframeZoom }}%</span>
            <button
              v-if="iframeZoom !== 100"
              class="text-gray-400 hover:text-indigo-500"
              @click="iframeZoom = 100"
              title="Reset content zoom"
            >
              <span class="material-icons text-sm">restart_alt</span>
            </button>
          </div>

          <!-- Tilt -->
          <div class="flex items-center gap-1">
            <button
              v-for="preset in tiltPresets"
              :key="preset.name"
              class="px-1.5 py-1 text-xs rounded-md transition-colors"
              :class="
                tiltX === preset.x && tiltY === preset.y
                  ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              "
              @click="
                tiltX = preset.x
                tiltY = preset.y
              "
              :title="preset.name"
            >
              {{ preset.label }}
            </button>
          </div>

          <div class="w-px h-6 bg-gray-200 dark:bg-slate-600"></div>

          <!-- Background -->
          <div class="relative" ref="bgPickerRef">
            <button
              class="w-7 h-7 rounded-full border-2 transition-all duration-200 border-purple-400"
              :style="{ background: activeBgPreview }"
              @click="showBgPicker = !showBgPicker"
              title="Background color"
            />
            <!-- Popover -->
            <div
              v-if="showBgPicker"
              class="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 p-3 z-50 w-56"
            >
              <div class="text-xs font-medium text-gray-500 mb-2">Presets</div>
              <div class="grid grid-cols-7 gap-1.5 mb-3">
                <button
                  v-for="bg in presetColors"
                  :key="bg.value"
                  class="w-6 h-6 rounded-full border-2 transition-all"
                  :class="
                    selectedBg === bg.value
                      ? 'border-purple-500 scale-110'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-400'
                  "
                  :style="{ background: bg.preview }"
                  @click="selectBg(bg.value)"
                  :title="bg.name"
                />
              </div>
              <div class="text-xs font-medium text-gray-500 mb-2">Custom</div>
              <div class="flex items-center gap-2">
                <input
                  v-model="customColor"
                  type="color"
                  class="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <input
                  v-model="customColor"
                  type="text"
                  class="flex-1 text-xs font-mono bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5"
                  placeholder="#hex"
                />
                <button
                  class="text-xs px-2 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  @click="selectBg('custom')"
                >
                  Use
                </button>
              </div>
            </div>
          </div>

          <div class="w-px h-6 bg-gray-200 dark:bg-slate-600"></div>

          <!-- Export -->
          <button
            @click="exportAsPng"
            :disabled="exporting"
            class="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <span v-if="exporting" class="material-icons text-sm animate-spin">refresh</span>
            <span v-else class="material-icons text-sm">image</span>
            PNG
          </button>
        </div>
      </div>
    </div>

    <!-- Device Canvas -->
    <div
      class="overflow-auto min-h-[calc(100vh-64px)]"
      :class="canvasBgClass"
      :style="canvasBgStyle"
    >
      <div
        ref="captureArea"
        class="device-canvas inline-flex items-end justify-center gap-8 mx-auto"
        :style="captureAreaStyle"
      >
        <div
          v-for="device in activeDevices"
          :key="device.id"
          class="device-wrapper flex flex-col items-center shrink-0"
          :style="deviceTiltStyle"
        >
          <div class="relative">
            <!-- Phone Frame -->
            <div v-if="device.type === 'phone'" class="device-phone">
              <div class="phone-frame" :style="getPhoneFrameStyle(device)">
                <div class="phone-notch" :style="{ top: `${device.bezel}px` }"></div>
                <div class="phone-screen" :style="{ borderRadius: `${device.screenRadius}px` }">
                  <iframe
                    :src="activeSite"
                    :style="getIframeStyle(device)"
                    class="device-iframe"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    loading="lazy"
                  />
                </div>
                <div class="phone-button-right"></div>
                <div class="phone-button-left-top"></div>
                <div class="phone-button-left-mid"></div>
                <div class="phone-button-left-bot"></div>
              </div>
            </div>

            <!-- Tablet Frame -->
            <div v-if="device.type === 'tablet'" class="device-tablet">
              <div class="tablet-frame" :style="getTabletFrameStyle(device)">
                <div class="tablet-camera"></div>
                <div class="tablet-screen">
                  <iframe
                    :src="activeSite"
                    :style="getIframeStyle(device)"
                    class="device-iframe"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            <!-- Laptop Frame -->
            <div v-if="device.type === 'laptop'" class="device-laptop">
              <div class="laptop-screen-container" :style="getLaptopContainerStyle(device)">
                <div class="laptop-camera"></div>
                <div class="laptop-screen">
                  <iframe
                    :src="activeSite"
                    :style="getIframeStyle(device)"
                    class="device-iframe"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    loading="lazy"
                  />
                </div>
              </div>
              <div class="laptop-base" :style="getLaptopBaseStyle(device)">
                <div class="laptop-notch"></div>
              </div>
              <div class="laptop-bottom" :style="getLaptopBottomStyle(device)"></div>
            </div>

            <!-- Desktop Frame -->
            <div v-if="device.type === 'desktop'" class="device-desktop">
              <div class="imac-screen-container" :style="getImacContainerStyle(device)">
                <div class="imac-screen" :style="getImacScreenStyle(device)">
                  <iframe
                    :src="activeSite"
                    :style="getIframeStyle(device)"
                    class="device-iframe"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    loading="lazy"
                  />
                </div>
                <div class="imac-chin">
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { toPng } from 'html-to-image'

const captureArea = ref(null)
const exporting = ref(false)
const bgPickerRef = ref(null)
const showBgPicker = ref(false)

const sites = [
  { label: 'Maxirez', url: 'https://app.maxirez.com' },
  { label: 'Minirez', url: 'https://app.minirez.com' }
]
const activeSite = ref('https://app.maxirez.com')

const pageZoom = ref(100)
const iframeZoom = ref(100)

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
    bezel: 16
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

const tiltX = ref(0)
const tiltY = ref(0)

const tiltPresets = [
  { name: 'Flat', label: '—', x: 0, y: 0 },
  { name: 'Slight Left', label: '↰', x: 8, y: -3 },
  { name: 'Slight Right', label: '↱', x: -8, y: 3 },
  { name: 'Hero', label: '◇', x: 15, y: -8 },
  { name: 'Dramatic', label: '◈', x: 25, y: -12 }
]

const deviceTiltStyle = computed(() => ({
  transform: `perspective(1200px) rotateX(${tiltY.value}deg) rotateY(${tiltX.value}deg)`,
  transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
}))

// --- Background ---
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
  { name: 'Pink', value: '#ec4899', preview: '#ec4899' }
]

const selectedBg = ref('transparent')
const customColor = ref('#6366f1')

const selectBg = value => {
  selectedBg.value = value
  showBgPicker.value = false
}

const activeBgColor = computed(() => {
  if (selectedBg.value === 'transparent') return null
  if (selectedBg.value === 'custom') return customColor.value
  return selectedBg.value
})

const activeBgPreview = computed(() => {
  if (selectedBg.value === 'transparent') {
    return 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 10px 10px'
  }
  if (selectedBg.value === 'custom') return customColor.value
  return selectedBg.value
})

const canvasBgClass = computed(() => {
  if (selectedBg.value === 'transparent') return 'bg-checkerboard'
  return ''
})

const canvasBgStyle = computed(() => {
  if (selectedBg.value === 'transparent') return {}
  const color = selectedBg.value === 'custom' ? customColor.value : selectedBg.value
  return { backgroundColor: color }
})

const captureAreaStyle = computed(() => ({
  transform: `scale(${pageZoom.value / 100})`,
  transformOrigin: 'top center',
  padding: '48px 40px 32px'
}))

const effectiveScale = device => {
  return device.baseScale * (iframeZoom.value / 100)
}

const getIframeStyle = device => {
  const s = effectiveScale(device)
  return {
    width: device.viewport.width + 'px',
    height: device.viewport.height + 'px',
    transform: `scale(${s})`,
    transformOrigin: 'top left'
  }
}

const screenW = device => device.viewport.width * effectiveScale(device)
const screenH = device => device.viewport.height * effectiveScale(device)

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

const getImacContainerStyle = device => {
  const w = screenW(device)
  return { width: w + device.bezel * 2 + 'px' }
}

const getImacScreenStyle = device => {
  const h = screenH(device)
  return { height: h + 'px' }
}

// --- Screenshot export via own API (Puppeteer-based) ---
const screenshotCache = new Map()
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

watch(activeSite, () => screenshotCache.clear())

const loadScreenshot = async (url, width, height) => {
  const cacheKey = `${url}::${width}x${height}`
  if (screenshotCache.has(cacheKey)) return screenshotCache.get(cacheKey)

  const token = localStorage.getItem('token')
  const params = new URLSearchParams({ url, width: String(width), height: String(height) })
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
    const screenshotPromises = Array.from(iframes).map(iframe => {
      const vpWidth = parseInt(iframe.style.width)
      const vpHeight = parseInt(iframe.style.height)
      return loadScreenshot(activeSite.value, vpWidth, vpHeight).catch(() => null)
    })

    const screenshots = await Promise.all(screenshotPromises)

    iframes.forEach((iframe, i) => {
      const parent = iframe.parentElement
      const parentRect = parent.getBoundingClientRect()

      const canvas = document.createElement('canvas')
      canvas.width = parentRect.width * 2
      canvas.height = parentRect.height * 2
      canvas.style.width = parentRect.width + 'px'
      canvas.style.height = parentRect.height + 'px'
      canvas.style.position = 'absolute'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.borderRadius = getComputedStyle(parent).borderRadius

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
        ctx.fillText(activeSite.value, canvas.width / 2, canvas.height / 2)
      }

      iframe.style.display = 'none'
      parent.style.position = 'relative'
      parent.appendChild(canvas)
      replacements.push({ iframe, canvas, parent })
    })

    const isTransparent = selectedBg.value === 'transparent'

    const bgColor = isTransparent
      ? null
      : selectedBg.value === 'custom'
        ? customColor.value
        : selectedBg.value

    const dataUrl = await toPng(captureArea.value, {
      pixelRatio: 2,
      cacheBust: true,
      skipAutoScale: true,
      backgroundColor: bgColor,
      includeQueryParams: true,
      filter: node => node.tagName !== 'IFRAME'
    })

    const link = document.createElement('a')
    link.download = `responsive-mockup-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('Export failed:', err)
  } finally {
    for (const { iframe, canvas, parent } of replacements) {
      iframe.style.display = ''
      parent.removeChild(canvas)
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

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.device-iframe {
  border: none;
  display: block;
}

/* ===== Phone ===== */
.phone-frame {
  position: relative;
  background: linear-gradient(145deg, #2a2a2e, #1a1a1e);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 20px 60px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
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

.phone-button-right {
  position: absolute;
  right: -3px;
  top: 28%;
  width: 3px;
  height: 60px;
  background: linear-gradient(180deg, #3a3a3e, #2a2a2e);
  border-radius: 0 2px 2px 0;
}

.phone-button-left-top {
  position: absolute;
  left: -3px;
  top: 18%;
  width: 3px;
  height: 25px;
  background: linear-gradient(180deg, #3a3a3e, #2a2a2e);
  border-radius: 2px 0 0 2px;
}

.phone-button-left-mid {
  position: absolute;
  left: -3px;
  top: 28%;
  width: 3px;
  height: 50px;
  background: linear-gradient(180deg, #3a3a3e, #2a2a2e);
  border-radius: 2px 0 0 2px;
}

.phone-button-left-bot {
  position: absolute;
  left: -3px;
  top: 40%;
  width: 3px;
  height: 50px;
  background: linear-gradient(180deg, #3a3a3e, #2a2a2e);
  border-radius: 2px 0 0 2px;
}

/* ===== Tablet ===== */
.tablet-frame {
  position: relative;
  background: linear-gradient(145deg, #e4e4e8, #c8c8cc);
  border-radius: 20px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.4),
    0 25px 80px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
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
  background: linear-gradient(145deg, #2a2a2e, #1a1a1e);
  border-radius: 14px 14px 0 0;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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

/* ===== Desktop ===== */
.imac-screen-container {
  background: linear-gradient(145deg, #e4e4e8, #d0d0d4);
  border-radius: 16px 16px 0 0;
  padding: 16px 16px 0;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.4),
    0 30px 100px rgba(0, 0, 0, 0.2);
}

.imac-screen {
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  background: #000;
}

.imac-chin {
  height: 36px;
  background: linear-gradient(180deg, #e4e4e8, #d8d8dc);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 0 16px 16px;
}

.imac-logo {
  width: 16px;
  height: 20px;
  opacity: 0.3;
  background: radial-gradient(ellipse, #888, transparent);
  border-radius: 50%;
}

.imac-stand {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.imac-stand-neck {
  width: 100px;
  height: 60px;
  background: linear-gradient(90deg, #c0c0c4, #d4d4d8, #c0c0c4);
  clip-path: polygon(15% 0, 85% 0, 100% 100%, 0% 100%);
}

.imac-stand-base {
  width: 200px;
  height: 8px;
  background: linear-gradient(180deg, #c8c8cc, #b8b8bc);
  border-radius: 0 0 4px 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* ===== Checkerboard ===== */
.bg-checkerboard {
  background-image: repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%);
  background-size: 20px 20px;
}
</style>
