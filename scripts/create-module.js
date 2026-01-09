#!/usr/bin/env node

/**
 * Module Generator Script
 * Creates backend and frontend boilerplate for new modules
 *
 * Usage:
 *   pnpm create-module <module-name>
 *   pnpm create-module hotel-inventory
 *   pnpm create-module hotel-inventory --no-model
 *   pnpm create-module hotel-inventory --with-store
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  dim: '\x1b[2m'
}

const log = {
  info: msg => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: msg => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: msg => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  file: msg => console.log(`${colors.dim}  + ${msg}${colors.reset}`)
}

// Convert kebab-case to PascalCase
const toPascalCase = str =>
  str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

// Convert kebab-case to camelCase
const toCamelCase = str => {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

// Templates
const templates = {
  // Backend Model
  model: (moduleName, pascalName) => `import mongoose from 'mongoose'
import auditPlugin from '#plugins/auditPlugin.js'

/**
 * ${pascalName} Model
 */
const ${toCamelCase(moduleName)}Schema = new mongoose.Schema(
  {
    // Partner reference (multi-tenant isolation)
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
      index: true
    },

    // Name
    name: {
      type: String,
      required: true,
      trim: true
    },

    // Status
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes
${toCamelCase(moduleName)}Schema.index({ partner: 1, status: 1 })

// Audit trail
${toCamelCase(moduleName)}Schema.plugin(auditPlugin)

// Instance methods
${toCamelCase(moduleName)}Schema.methods.isActive = function () {
  return this.status === 'active'
}

// Static methods
${toCamelCase(moduleName)}Schema.statics.findByPartner = function (partnerId) {
  return this.find({ partner: partnerId, status: 'active' })
}

export default mongoose.model('${pascalName}', ${toCamelCase(moduleName)}Schema)
`,

  // Backend Service
  service: (moduleName, pascalName) => `import ${pascalName} from './${moduleName}.model.js'
import { asyncHandler } from '#helpers'
import { NotFoundError, BadRequestError } from '#core/errors.js'

/**
 * Get all ${moduleName}s for partner
 */
export const getList = asyncHandler(async (req, res) => {
  const { partnerId } = req
  const { status, search } = req.query

  const filter = { partner: partnerId }

  if (status) {
    filter.status = status
  }

  if (search) {
    filter.name = { $regex: search, $options: 'i' }
  }

  const items = await ${pascalName}.find(filter).sort({ createdAt: -1 })

  res.json({
    success: true,
    data: items
  })
})

/**
 * Get single ${moduleName} by ID
 */
export const getById = asyncHandler(async (req, res) => {
  const { partnerId } = req
  const { id } = req.params

  const item = await ${pascalName}.findOne({ _id: id, partner: partnerId })

  if (!item) {
    throw new NotFoundError('${moduleName.toUpperCase().replace(/-/g, '_')}_NOT_FOUND')
  }

  res.json({
    success: true,
    data: item
  })
})

/**
 * Create new ${moduleName}
 */
export const create = asyncHandler(async (req, res) => {
  const { partnerId, user } = req
  const { name, ...rest } = req.body

  if (!name) {
    throw new BadRequestError('NAME_REQUIRED')
  }

  const item = new ${pascalName}({
    partner: partnerId,
    name,
    ...rest,
    createdBy: user._id
  })

  await item.save()

  res.status(201).json({
    success: true,
    data: item,
    message: '${moduleName.toUpperCase().replace(/-/g, '_')}_CREATED'
  })
})

/**
 * Update ${moduleName}
 */
export const update = asyncHandler(async (req, res) => {
  const { partnerId, user } = req
  const { id } = req.params
  const updates = req.body

  const item = await ${pascalName}.findOne({ _id: id, partner: partnerId })

  if (!item) {
    throw new NotFoundError('${moduleName.toUpperCase().replace(/-/g, '_')}_NOT_FOUND')
  }

  Object.assign(item, updates, { updatedBy: user._id })
  await item.save()

  res.json({
    success: true,
    data: item,
    message: '${moduleName.toUpperCase().replace(/-/g, '_')}_UPDATED'
  })
})

/**
 * Delete ${moduleName}
 */
export const remove = asyncHandler(async (req, res) => {
  const { partnerId } = req
  const { id } = req.params

  const item = await ${pascalName}.findOne({ _id: id, partner: partnerId })

  if (!item) {
    throw new NotFoundError('${moduleName.toUpperCase().replace(/-/g, '_')}_NOT_FOUND')
  }

  await item.deleteOne()

  res.json({
    success: true,
    message: '${moduleName.toUpperCase().replace(/-/g, '_')}_DELETED'
  })
})
`,

  // Backend Routes
  routes: (moduleName, _pascalName) => `import express from 'express'
import * as service from './${moduleName}.service.js'
import { protect, requireAdmin } from '#middleware/auth.js'
import { partnerContext } from '#middleware/partnerContext.js'

const router = express.Router()

// All routes require authentication and partner context
router.use(protect)
router.use(requireAdmin)
router.use(partnerContext)

// CRUD routes
router.get('/', service.getList)
router.get('/:id', service.getById)
router.post('/', service.create)
router.put('/:id', service.update)
router.delete('/:id', service.remove)

export default router
`,

  // Backend Index (barrel export)
  backendIndex: (moduleName, _pascalName) => `// ${moduleName} module barrel export
export { default as routes } from './${moduleName}.routes.js'
export { default as model } from './${moduleName}.model.js'
export * as service from './${moduleName}.service.js'
`,

  // Frontend Service
  frontendService: (moduleName, pascalName) => `import api from './api'

const BASE_URL = '/api/${moduleName.replace(/-/g, '-')}'

/**
 * Get all ${pascalName}s
 */
export async function get${pascalName}s(params = {}) {
  const { data } = await api.get(BASE_URL, { params })
  return data
}

/**
 * Get single ${pascalName} by ID
 */
export async function get${pascalName}(id) {
  const { data } = await api.get(\`\${BASE_URL}/\${id}\`)
  return data
}

/**
 * Create new ${pascalName}
 */
export async function create${pascalName}(payload) {
  const { data } = await api.post(BASE_URL, payload)
  return data
}

/**
 * Update ${pascalName}
 */
export async function update${pascalName}(id, payload) {
  const { data } = await api.put(\`\${BASE_URL}/\${id}\`, payload)
  return data
}

/**
 * Delete ${pascalName}
 */
export async function delete${pascalName}(id) {
  const { data } = await api.delete(\`\${BASE_URL}/\${id}\`)
  return data
}
`,

  // Frontend Pinia Store
  frontendStore: (moduleName, pascalName) => `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as ${toCamelCase(moduleName)}Service from '@/services/${toCamelCase(moduleName)}Service'
import { useToast } from 'vue-toastification'

export const use${pascalName}Store = defineStore('${toCamelCase(moduleName)}', () => {
  const toast = useToast()

  // State
  const items = ref([])
  const currentItem = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const activeItems = computed(() => items.value.filter(item => item.status === 'active'))
  const itemCount = computed(() => items.value.length)

  // Actions
  async function fetchItems(params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await ${toCamelCase(moduleName)}Service.get${pascalName}s(params)
      items.value = response.data
    } catch (err) {
      error.value = err.message
      toast.error(err.response?.data?.message || 'Failed to fetch items')
    } finally {
      loading.value = false
    }
  }

  async function fetchItem(id) {
    loading.value = true
    error.value = null
    try {
      const response = await ${toCamelCase(moduleName)}Service.get${pascalName}(id)
      currentItem.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      toast.error(err.response?.data?.message || 'Failed to fetch item')
    } finally {
      loading.value = false
    }
  }

  async function createItem(payload) {
    loading.value = true
    error.value = null
    try {
      const response = await ${toCamelCase(moduleName)}Service.create${pascalName}(payload)
      items.value.unshift(response.data)
      toast.success(response.message || 'Item created successfully')
      return response.data
    } catch (err) {
      error.value = err.message
      toast.error(err.response?.data?.message || 'Failed to create item')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateItem(id, payload) {
    loading.value = true
    error.value = null
    try {
      const response = await ${toCamelCase(moduleName)}Service.update${pascalName}(id, payload)
      const index = items.value.findIndex(item => item._id === id)
      if (index !== -1) {
        items.value[index] = response.data
      }
      toast.success(response.message || 'Item updated successfully')
      return response.data
    } catch (err) {
      error.value = err.message
      toast.error(err.response?.data?.message || 'Failed to update item')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteItem(id) {
    loading.value = true
    error.value = null
    try {
      await ${toCamelCase(moduleName)}Service.delete${pascalName}(id)
      items.value = items.value.filter(item => item._id !== id)
      toast.success('Item deleted successfully')
    } catch (err) {
      error.value = err.message
      toast.error(err.response?.data?.message || 'Failed to delete item')
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearCurrent() {
    currentItem.value = null
  }

  return {
    // State
    items,
    currentItem,
    loading,
    error,
    // Getters
    activeItems,
    itemCount,
    // Actions
    fetchItems,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
    clearCurrent
  }
})
`
}

// Create directory if not exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// Write file with logging
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8')
  log.file(path.relative(ROOT_DIR, filePath))
}

// Main function
function createModule(moduleName, options = {}) {
  const { noModel = false, withStore = false } = options

  // Validate module name
  if (!moduleName) {
    log.error('Module name is required')
    console.log('\nUsage: pnpm create-module <module-name> [options]')
    console.log('Options:')
    console.log('  --no-model    Skip model creation')
    console.log('  --with-store  Create Pinia store')
    process.exit(1)
  }

  // Ensure kebab-case
  const kebabName = moduleName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const pascalName = toPascalCase(kebabName)
  const camelName = toCamelCase(kebabName)

  log.info(`Creating module: ${kebabName}`)
  console.log(`  PascalCase: ${pascalName}`)
  console.log(`  camelCase: ${camelName}`)
  console.log('')

  // Paths
  const backendModulePath = path.join(ROOT_DIR, 'apps/api/src/modules', kebabName)
  const frontendServicesPath = path.join(ROOT_DIR, 'apps/admin/src/services')
  const frontendStoresPath = path.join(ROOT_DIR, 'apps/admin/src/stores')

  // Check if module already exists
  if (fs.existsSync(backendModulePath)) {
    log.error(`Backend module already exists: ${backendModulePath}`)
    process.exit(1)
  }

  // Create backend module
  log.info('Creating backend files...')
  ensureDir(backendModulePath)

  if (!noModel) {
    writeFile(path.join(backendModulePath, `${kebabName}.model.js`), templates.model(kebabName, pascalName))
  }

  writeFile(path.join(backendModulePath, `${kebabName}.service.js`), templates.service(kebabName, pascalName))
  writeFile(path.join(backendModulePath, `${kebabName}.routes.js`), templates.routes(kebabName, pascalName))
  writeFile(path.join(backendModulePath, 'index.js'), templates.backendIndex(kebabName, pascalName))

  // Create frontend service
  log.info('Creating frontend service...')
  ensureDir(frontendServicesPath)
  writeFile(path.join(frontendServicesPath, `${camelName}Service.js`), templates.frontendService(kebabName, pascalName))

  // Create frontend store (optional)
  if (withStore) {
    log.info('Creating frontend store...')
    ensureDir(frontendStoresPath)
    writeFile(path.join(frontendStoresPath, `${camelName}.js`), templates.frontendStore(kebabName, pascalName))
  }

  console.log('')
  log.success('Module created successfully!')
  console.log('')
  console.log(`${colors.green}Routes auto-loaded at:${colors.reset} /api/${kebabName}`)
  console.log('')
  console.log(`${colors.yellow}Next steps:${colors.reset}`)
  console.log(`  1. Add translations to ${colors.dim}apps/admin/src/locales/{tr,en}.json${colors.reset}`)
  console.log('')
  console.log(`  2. ${colors.dim}(Optional)${colors.reset} Custom API path? Edit ${colors.dim}apps/api/src/loaders/routes.js${colors.reset} ROUTE_CONFIG`)
  if (!withStore) {
    console.log('')
    console.log(`  3. ${colors.dim}(Optional)${colors.reset} Create store: ${colors.dim}pnpm create-module ${kebabName} --with-store${colors.reset}`)
  }
}

// Parse arguments
const args = process.argv.slice(2)
const moduleName = args.find(arg => !arg.startsWith('--'))
const options = {
  noModel: args.includes('--no-model'),
  withStore: args.includes('--with-store')
}

createModule(moduleName, options)
