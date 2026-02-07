import { defineConfig } from 'vitest/config'
import path from 'path'

const src = path.resolve(import.meta.dirname, './src')

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.js'],
    include: ['src/**/*.test.js'],
    exclude: ['**/node_modules/**', 'dist', 'src/templates/**'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'src/templates/**',
        'src/constants/**',
        'src/tests/**',
        'coverage/**',
        'vitest.config.js'
      ],
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50
      }
    },
    alias: {
      // Direct imports (no wildcard)
      '#config': path.join(src, 'config/index.js'),
      '#helpers': path.join(src, 'helpers/index.js'),

      // Wildcard path aliases - order matters, specific before general
      '#constants/': path.join(src, 'constants/'),
      '#core/': path.join(src, 'core/'),
      '#helpers/': path.join(src, 'helpers/'),
      '#middleware/': path.join(src, 'middleware/'),
      '#modules/': path.join(src, 'modules/'),
      '#services/': path.join(src, 'services/'),
      '#plugins/': path.join(src, 'plugins/'),
      '#utils/': path.join(src, 'utils/')
    }
  }
})
