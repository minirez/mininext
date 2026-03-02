/**
 * Plugin: Apply partner theme colors as CSS custom properties (client-only)
 */
export default defineNuxtPlugin(() => {
  const partner = usePartnerStore()

  function hexToRgb(hex: string): string | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return null
    return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
  }

  function darken(hex: string, amount: number = 40): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return hex
    const r = Math.max(0, parseInt(result[1], 16) - amount)
    const g = Math.max(0, parseInt(result[2], 16) - amount)
    const b = Math.max(0, parseInt(result[3], 16) - amount)
    return `${r} ${g} ${b}`
  }

  function lighten(hex: string, amount: number = 80): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return hex
    const r = Math.min(255, parseInt(result[1], 16) + amount)
    const g = Math.min(255, parseInt(result[2], 16) + amount)
    const b = Math.min(255, parseInt(result[3], 16) + amount)
    return `${r} ${g} ${b}`
  }

  function applyTheme() {
    const color = partner.themeColor
    if (!color) return

    const rgb = hexToRgb(color)
    if (!rgb) return

    const root = document.documentElement
    root.style.setProperty('--site-primary', rgb)
    root.style.setProperty('--site-primary-dark', darken(color))
    root.style.setProperty('--site-primary-light', lighten(color))
  }

  // Apply on load
  applyTheme()

  // Watch for changes (e.g. dynamic theme switching)
  watch(() => partner.themeColor, applyTheme)
})
