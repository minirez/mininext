/**
 * Widget Theme Composable
 * Theme and styling management for widget
 */

import { computed, watch, onMounted } from 'vue'
import { useWidgetStore } from '../stores/widgetStore'

export function useWidgetTheme() {
  const store = useWidgetStore()

  // Computed CSS variables based on primary color
  const cssVariables = computed(() => {
    const primary = store.config.primaryColor || '#7c3aed'

    // Generate color shades
    const shades = generateColorShades(primary)

    return {
      '--widget-primary': primary,
      '--widget-primary-50': shades[50],
      '--widget-primary-100': shades[100],
      '--widget-primary-200': shades[200],
      '--widget-primary-300': shades[300],
      '--widget-primary-400': shades[400],
      '--widget-primary-500': shades[500],
      '--widget-primary-600': shades[600],
      '--widget-primary-700': shades[700],
      '--widget-primary-800': shades[800],
      '--widget-primary-900': shades[900]
    }
  })

  // Is dark mode
  const isDark = computed(() => {
    if (store.config.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return store.config.theme === 'dark'
  })

  // Apply theme to widget root
  function applyTheme(element) {
    if (!element) return

    // Apply CSS variables
    Object.entries(cssVariables.value).forEach(([key, value]) => {
      element.style.setProperty(key, value)
    })

    // Apply dark mode class
    if (isDark.value) {
      element.classList.add('dark')
    } else {
      element.classList.remove('dark')
    }
  }

  // Watch for theme changes
  function watchThemeChanges(element) {
    // Watch config changes
    watch(() => [store.config.theme, store.config.primaryColor], () => {
      applyTheme(element)
    })

    // Watch system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (store.config.theme === 'auto') {
        applyTheme(element)
      }
    }
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }

  return {
    cssVariables,
    isDark,
    applyTheme,
    watchThemeChanges
  }
}

/**
 * Generate color shades from a hex color
 */
function generateColorShades(hex) {
  // Convert hex to RGB
  const rgb = hexToRgb(hex)
  if (!rgb) {
    return getDefaultShades()
  }

  // Convert to HSL for easier manipulation
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

  // Generate shades
  const shades = {}
  const lightnessSteps = {
    50: 0.95,
    100: 0.9,
    200: 0.8,
    300: 0.7,
    400: 0.6,
    500: 0.5,
    600: 0.4,
    700: 0.3,
    800: 0.2,
    900: 0.1
  }

  Object.entries(lightnessSteps).forEach(([shade, lightness]) => {
    const adjustedLightness = lightness
    const rgb = hslToRgb(hsl.h, hsl.s, adjustedLightness)
    shades[shade] = rgbToHex(rgb.r, rgb.g, rgb.b)
  })

  return shades
}

function getDefaultShades() {
  return {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87'
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h, s, l }
}

function hslToRgb(h, s, l) {
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}
