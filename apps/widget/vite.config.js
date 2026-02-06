import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],

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
      fileName: (format) => `widget.${format}.js`,
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
    port: 5174,
    host: true, // Listen on all addresses
    cors: true,
    // Allow serving from widget.mini.com
    hmr: {
      host: 'widget.mini.com',
      protocol: 'wss'
    }
  },

  // Define environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    __API_URL__: JSON.stringify(
      process.env.NODE_ENV === 'production'
        ? 'https://app.maxirez.com/api'
        : 'https://api.mini.com/api'
    )
  }
})
