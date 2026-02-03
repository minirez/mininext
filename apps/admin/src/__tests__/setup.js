/**
 * Vitest Test Setup
 * Global configuration for Vue component tests
 */
import { config } from '@vue/test-utils'

// Mock vue-i18n
config.global.mocks = {
  $t: key => key,
  $tc: key => key,
  $d: date => date,
  $n: num => num
}

// Mock vue-router
config.global.stubs = {
  'router-link': true,
  'router-view': true
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  })
})

// Mock IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
