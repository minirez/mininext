import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { symlinkSync, existsSync, unlinkSync } from 'fs'

// Post-build: create widget.js -> widget.iife.js symlink
function widgetSymlinkPlugin() {
  return {
    name: 'widget-symlink',
    closeBundle() {
      const dist = resolve(__dirname, 'dist')
      const link = resolve(dist, 'widget.js')
      const target = 'widget.iife.js'
      try {
        if (existsSync(link)) unlinkSync(link)
        symlinkSync(target, link)
      } catch (_e) {
        /* ignore */
      }
    }
  }
}

export default defineConfig({
  plugins: [vue(), widgetSymlinkPlugin()],

  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },

  // Library mode build config
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widget-entry.js'),
      name: 'MaxiResWidget',
      fileName: format => `widget.${format}.js`,
      formats: ['es', 'iife']
    },
    rollupOptions: {
      // Externalize deps that shouldn't be bundled
      external: [],
      output: {
        // Global variables for IIFE build
        globals: {},
        // Ensure CSS is inlined
        assetFileNames: 'widget.[ext]'
      }
    },
    // Output to dist for deployment
    outDir: 'dist',
    emptyOutDir: true,
    // Inline all CSS into JS
    cssCodeSplit: false,
    cssMinify: true
  },

  // Development server
  server: {
    port: 5181,
    host: true, // Listen on all addresses
    cors: true,
    allowedHosts: ['widget.mini.com'],
    // Allow serving from widget.mini.com
    hmr: {
      host: 'widget.mini.com',
      protocol: 'wss'
    }
  },

  // Define environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __API_URL__: JSON.stringify(
      process.env.NODE_ENV === 'production'
        ? 'https://api.maxirez.com/api'
        : 'https://api.mini.com/api'
    )
  }
})
