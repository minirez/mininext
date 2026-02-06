import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['src/templates/**', 'src/constants/**']
        },
        alias: {
            '#config': path.resolve(__dirname, './src/config/index.js'),
            '#constants': path.resolve(__dirname, './src/constants'),
            '#core': path.resolve(__dirname, './src/core'),
            '#helpers': path.resolve(__dirname, './src/helpers/index.js'),
            '#middleware': path.resolve(__dirname, './src/middleware'),
            '#modules': path.resolve(__dirname, './src/modules'),
            '#services': path.resolve(__dirname, './src/services'),
            '#plugins': path.resolve(__dirname, './src/plugins'),
            '#utils': path.resolve(__dirname, './src/utils')
        }
    }
})
