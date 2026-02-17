import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    },
    rules: {
      // Vue specific
      'vue/multi-word-component-names': 'off', // Allow single-word names
      'vue/no-v-html': 'warn', // Warn about XSS risk
      'vue/require-default-prop': 'off', // Not always needed
      'vue/require-prop-types': 'warn',
      'vue/no-mutating-props': 'warn', // Project uses form prop mutation pattern extensively
      'vue/block-order': [
        'warn',
        {
          order: ['template', 'script', 'style']
        }
      ],
      'vue/html-self-closing': [
        'warn',
        {
          html: { void: 'always', normal: 'never', component: 'always' }
        }
      ],
      'vue/max-attributes-per-line': 'off', // Let Prettier handle
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-indent': 'off', // Let Prettier handle

      // JS rules for .vue files (override recommended defaults)
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-useless-escape': 'warn',
      'no-empty': 'warn',
      'no-useless-catch': 'warn'
    }
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    },
    rules: {
      // Error prevention
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Discourage console.log in frontend - use logger utility
      'no-debugger': 'error',

      // Best practices
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'warn',

      // Relaxed rules
      'no-useless-escape': 'warn',
      'no-empty': 'warn',
      'no-useless-catch': 'warn',

      // Code style
      semi: ['warn', 'never'],
      quotes: ['warn', 'single', { avoidEscape: true }],
      'comma-dangle': ['warn', 'never']
    }
  },
  {
    ignores: ['node_modules/**', 'dist/**', '.output/**', '*.min.js', 'public/**']
  }
]
