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
            manualChunks: {
              vendor: ['vue', 'vue-router', 'pinia', 'axios']
            }
          }
        }
      }
})
