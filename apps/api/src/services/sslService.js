/**
 * SSL Service
 *
 * This file re-exports from the modular ssl/ directory for backward compatibility.
 * All functionality has been split into separate modules:
 *
 * - ssl/dnsService.js - DNS verification functions (getServerIP, verifyDNS)
 * - ssl/certificateService.js - Let's Encrypt operations (requestCertificate, checkCertificate, renewCertificate)
 * - ssl/nginxService.js - Nginx config generation and installation (generateNginxConfig, installNginxConfig, removeNginxConfig)
 * - ssl/index.js - Barrel export with setupSSL orchestration
 *
 * @deprecated Import from './ssl/index.js' or specific modules directly for new code.
 */

// Re-export everything from the modular ssl directory
export {
  // DNS Service
  getServerIP,
  verifyDNS,
  // Certificate Service
  requestCertificate,
  checkCertificate,
  renewCertificate,
  getCertConfig,
  // Nginx Service
  generateNginxConfig,
  installNginxConfig,
  installTempHttpConfig,
  removeNginxConfig,
  getNginxConfig,
  // Main setup
  setupSSL
} from './ssl/index.js'

// Default export for backward compatibility
export { default } from './ssl/index.js'
