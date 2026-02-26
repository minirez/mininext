/**
 * Auto Route Loader
 * Automatically discovers and loads route modules from the modules directory
 *
 * Convention:
 * - Each module can have a {moduleName}.routes.js file
 * - Route path defaults to /api/{moduleName}
 * - Custom paths can be defined in ROUTE_CONFIG below
 */

import { readdirSync, existsSync } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'
import path from 'path'
import logger from '#core/logger.js'
import { validateObjectIdParams } from '#middleware/validation.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Custom route path mappings
 * Key: module folder name
 * Value: API path (without /api prefix) or false to skip auto-loading
 */
const ROUTE_CONFIG = {
  // Plural endpoints
  partner: 'partners',
  agency: 'agencies',
  user: 'users',
  session: 'sessions',
  hotel: 'hotels',
  tag: 'tags',
  location: 'locations',
  booking: 'bookings',
  notification: 'notifications',
  issue: 'issues',
  'email-log': 'email-logs',

  // Kebab-case endpoints
  siteSettings: 'site-settings',
  'platform-settings': 'platform-settings',
  audit: 'audit-logs',

  // Notification logs
  'notification-log': 'notification-logs',

  // Subscription invoices
  subscriptionInvoice: 'subscription-invoices',

  // Payment links
  paymentLink: 'payment-links',

  // Subscription services & packages (barrel route)
  subscriptions: 'subscriptions',

  // Storefront (B2C website configuration)
  storefront: 'storefronts',

  // Debug endpoint (Claude Code access)
  debug: 'debug',

  // PMS modules
  'pms-frontdesk': 'pms/frontdesk',
  'pms-housekeeping': 'pms/housekeeping',
  'pms-guest': 'pms/guests',
  'pms-billing': 'pms/billing',
  'pms-reservation': 'pms/reservations',
  'pms-settings': 'pms/settings',

  // Platform-level modules
  'platform-booking': 'platform/bookings',

  // Channel Manager
  'channel-manager': 'channel-manager',

  // Migration (legacy system import)
  migration: 'migration',

  // TURSAB Agency Directory
  'tursab-agency': 'tursab-agencies',

  // Screenshot service (responsive viewer)
  screenshot: 'screenshot'
}

/**
 * Get the API path for a module
 */
function getApiPath(moduleName) {
  // Check if module has custom config
  if (moduleName in ROUTE_CONFIG) {
    const config = ROUTE_CONFIG[moduleName]
    if (config === false) return null // Skip this module
    return `/api/${config}`
  }

  // Default: use module name as-is
  return `/api/${moduleName}`
}

/**
 * Find route file in module directory
 * Supports: {moduleName}.routes.js or routes.js
 */
function findRouteFile(modulePath, moduleName) {
  const candidates = [
    path.join(modulePath, `${moduleName}.routes.js`),
    path.join(modulePath, 'routes.js')
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

/**
 * Load all routes from modules directory
 * @param {Express} app - Express application instance
 */
export async function loadRoutes(app) {
  const modulesPath = path.join(__dirname, '../modules')
  const loadedRoutes = []
  const skippedModules = []

  // Get all directories in modules folder
  const modules = readdirSync(modulesPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort()

  for (const moduleName of modules) {
    const modulePath = path.join(modulesPath, moduleName)
    const apiPath = getApiPath(moduleName)

    // Skip if configured to skip
    if (apiPath === null) {
      skippedModules.push(moduleName)
      continue
    }

    // Find route file
    const routeFile = findRouteFile(modulePath, moduleName)
    if (!routeFile) {
      continue // No routes file, skip silently
    }

    try {
      // Dynamic import - convert file path to file URL for Windows compatibility
      const routeFileUrl = pathToFileURL(routeFile).href
      const routeModule = await import(routeFileUrl)
      const routes = routeModule.default

      if (routes && typeof routes === 'function') {
        // Apply global ObjectId param validation to all routes
        app.use(apiPath, validateObjectIdParams(), routes)
        loadedRoutes.push({ module: moduleName, path: apiPath })
      }
    } catch (error) {
      logger.error(`Failed to load routes for module "${moduleName}":`, error.message)
    }
  }

  // Log summary
  if (loadedRoutes.length > 0) {
    logger.info(`Loaded ${loadedRoutes.length} route modules`)
    if (process.env.NODE_ENV === 'development') {
      loadedRoutes.forEach(({ module, path: p }) => {
        logger.debug(`  ${module} → ${p}`)
      })
    }
  }

  return loadedRoutes
}

/**
 * Get list of all registered routes (for debugging)
 */
export function getRouteConfig() {
  return { ...ROUTE_CONFIG }
}
