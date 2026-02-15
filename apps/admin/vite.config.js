import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Check if building widget
const isWidgetBuild = process.env.BUILD_MODE === 'widget'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true, // Listen on all interfaces (0.0.0.0) for Docker/WSL access
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  // Fix for Vue Router history mode 404 issue
  preview: {
    port: 4173
  },
  build: isWidgetBuild
    ? {
        // Widget build configuration
        lib: {
          entry: resolve(__dirname, 'src/widget-entry.js'),
          name: 'MaxiResWidget',
          fileName: 'widget',
          formats: ['iife'] // Immediately Invoked Function Expression for browser
        },
        outDir: 'dist/widget',
        emptyOutDir: true,
        rollupOptions: {
          // Externalize deps that shouldn't be bundled
          external: [],
          output: {
            // Global vars for externalized deps
            globals: {},
            // Single file output
            inlineDynamicImports: true,
            // Asset file names
            assetFileNames: 'widget.[ext]'
          }
        },
        // Minify for production
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true
          }
        }
      }
    : {
        // Default admin build configuration
        rollupOptions: {
          output: {
            manualChunks(id) {
              // Vue core
              if (
                id.includes('node_modules/vue/') ||
                id.includes('node_modules/@vue/') ||
                id.includes('node_modules/vue-router/') ||
                id.includes('node_modules/pinia/')
              ) {
                return 'vue-core'
              }
              // HTTP layer
              if (id.includes('node_modules/axios/')) {
                return 'http'
              }
              // Rich text editor (TipTap) - heavy, lazy loaded
              if (
                id.includes('node_modules/@tiptap/') ||
                id.includes('node_modules/prosemirror') ||
                id.includes('node_modules/tiptap')
              ) {
                return 'editor'
              }
              // Maps
              if (id.includes('node_modules/leaflet')) {
                return 'maps'
              }
              // Date utilities
              if (id.includes('node_modules/date-fns')) {
                return 'date-utils'
              }
              // i18n
              if (id.includes('node_modules/vue-i18n')) {
                return 'i18n'
              }
              // Socket.io
              if (id.includes('node_modules/socket.io')) {
                return 'socket'
              }
              // All other vendor
              if (id.includes('node_modules/')) {
                return 'vendor'
              }
            }
          }
        }
      }
})
