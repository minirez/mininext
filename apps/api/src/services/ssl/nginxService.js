/**
 * Nginx Service
 *
 * Nginx configuration generation and management.
 * Handles config creation, installation, and removal.
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import logger from '../../core/logger.js'
import appConfig from '../../config/index.js'

const execAsync = promisify(exec)

// Konfigurasyon (config module'den alınıyor)
const CONFIG = {
  // Nginx config dizini
  nginxSitesAvailable: appConfig.ssl.nginxSitesAvailable,
  nginxSitesEnabled: appConfig.ssl.nginxSitesEnabled,

  // Let's Encrypt
  certbotWebroot: appConfig.ssl.certbotWebroot,

  // Frontend build dizinleri (proxy icin)
  frontendPorts: appConfig.ssl.frontendPorts,

  // API backend
  apiBackend: appConfig.ssl.apiBackend,

  // Sertifika dizini
  certDir: '/etc/letsencrypt/live'
}

/**
 * Nginx konfigurasyonu olustur
 * @param {string} domain - Domain adi
 * @param {string} type - 'b2c' | 'b2b' | 'pms'
 * @param {string} partnerId - Partner ID (routing icin)
 * @returns {string} Nginx konfigurasyon icerigi
 */
export const generateNginxConfig = (domain, type, partnerId) => {
  const certPath = path.join(CONFIG.certDir, domain)

  // Ortak bloklar
  const httpBlock = `# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    location /.well-known/acme-challenge/ {
        root ${CONFIG.certbotWebroot};
    }

    location / {
        return 301 https://$host$request_uri;
    }
}`

  const sslBlock = `    # SSL certificates
    ssl_certificate ${certPath}/fullchain.pem;
    ssl_certificate_key ${certPath}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    access_log /var/log/nginx/${domain}.access.log;
    error_log /var/log/nginx/${domain}.error.log;`

  const apiBlock = `    # API proxy
    location /api {
        proxy_pass ${CONFIG.apiBackend};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Partner-Domain $host;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass ${CONFIG.apiBackend};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /uploads {
        alias /var/www/booking-engine/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }`

  // B2B (admin panel) - statik dist dosyalardan serve eder (app.maxirez.com gibi)
  if (type === 'b2b') {
    const adminDist = CONFIG.adminDistPath
    return `# Auto-generated config for ${domain} (${type})
# Partner ID: ${partnerId}
# Generated: ${new Date().toISOString()}

${httpBlock}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain};

${sslBlock}

${apiBlock}

    # Frontend (SPA - static dist)
    location / {
        root ${adminDist};
        index index.html;
        try_files $uri $uri/ /index.html;

        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
        }

        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
`
  }

  // B2C ve PMS - upstream proxy
  const frontendPort = CONFIG.frontendPorts[type]
  const upstreamName = `${domain.replace(/\./g, '_')}_upstream`

  return `# Auto-generated config for ${domain} (${type})
# Partner ID: ${partnerId}
# Generated: ${new Date().toISOString()}

upstream ${upstreamName} {
    server 127.0.0.1:${frontendPort};
    keepalive 64;
}

${httpBlock}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain};

${sslBlock}

${apiBlock}

    # Frontend
    location / {
        proxy_pass http://${upstreamName};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`
}

/**
 * Certbot ACME challenge icin gecici HTTP-only nginx config olustur ve kur
 * @param {string} domain - Domain adi
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const installTempHttpConfig = async domain => {
  const configContent = `# Temporary HTTP config for ACME challenge - ${domain}
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    location /.well-known/acme-challenge/ {
        root ${CONFIG.certbotWebroot};
    }

    location / {
        return 444;
    }
}
`
  const configFilename = `${domain}.conf`
  const availablePath = path.join(CONFIG.nginxSitesAvailable, configFilename)
  const enabledPath = path.join(CONFIG.nginxSitesEnabled, configFilename)

  try {
    await fs.writeFile(availablePath, configContent, 'utf8')

    try {
      await fs.unlink(enabledPath)
    } catch {
      /* ignore */
    }
    await fs.symlink(availablePath, enabledPath)

    const { stderr } = await execAsync('nginx -t')
    if (stderr && !stderr.includes('successful')) {
      throw new Error(`Nginx config test failed: ${stderr}`)
    }

    await execAsync('nginx -s reload')
    logger.info(`[SSL] Temp HTTP config installed for ${domain}`)

    return { success: true, message: 'TEMP_CONFIG_INSTALLED' }
  } catch (error) {
    logger.error(`[SSL] Temp HTTP config failed for ${domain}:`, error.message)
    try {
      await fs.unlink(enabledPath)
    } catch {
      /* ignore */
    }
    try {
      await fs.unlink(availablePath)
    } catch {
      /* ignore */
    }
    return { success: false, message: 'TEMP_CONFIG_FAILED' }
  }
}

/**
 * Nginx konfigurasyonunu kaydet ve etkinlestir
 * @param {string} domain - Domain adi
 * @param {string} configContent - Nginx konfigurasyon icerigi
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const installNginxConfig = async (domain, configContent) => {
  const configFilename = `${domain}.conf`
  const availablePath = path.join(CONFIG.nginxSitesAvailable, configFilename)
  const enabledPath = path.join(CONFIG.nginxSitesEnabled, configFilename)

  try {
    // Konfigurasyonu sites-available'a yaz
    await fs.writeFile(availablePath, configContent, 'utf8')
    logger.info(`[SSL] Nginx config written to ${availablePath}`)

    // Symlink olustur (sites-enabled)
    try {
      await fs.unlink(enabledPath)
    } catch {
      // Dosya yoksa sorun degil
    }
    await fs.symlink(availablePath, enabledPath)
    logger.info(`[SSL] Nginx config enabled: ${enabledPath}`)

    // Nginx konfigurasyonunu test et
    const { stderr: testStderr } = await execAsync('nginx -t')
    if (testStderr && !testStderr.includes('successful')) {
      throw new Error(`Nginx config test failed: ${testStderr}`)
    }

    // Nginx'i yeniden yukle
    await execAsync('nginx -s reload')
    logger.info('[SSL] Nginx reloaded successfully')

    return {
      success: true,
      message: 'NGINX_CONFIG_INSTALLED'
    }
  } catch (error) {
    logger.error(
      `[SSL] Nginx config installation failed for ${domain}: ${error.message || error.stderr || error}`
    )

    // Rollback - hatali konfigurasyonu sil
    try {
      await fs.unlink(enabledPath)
      await fs.unlink(availablePath)
    } catch {
      // Silme hatalari yoksay
    }

    return {
      success: false,
      message: 'NGINX_CONFIG_FAILED'
    }
  }
}

/**
 * Nginx konfigurasyonunu kaldir
 * @param {string} domain - Domain adi
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const removeNginxConfig = async domain => {
  const configFilename = `${domain}.conf`
  const availablePath = path.join(CONFIG.nginxSitesAvailable, configFilename)
  const enabledPath = path.join(CONFIG.nginxSitesEnabled, configFilename)

  try {
    // Symlink'i sil
    try {
      await fs.unlink(enabledPath)
    } catch {
      // Dosya yoksa sorun degil
    }

    // Config dosyasini sil
    try {
      await fs.unlink(availablePath)
    } catch {
      // Dosya yoksa sorun degil
    }

    // Nginx'i yeniden yukle
    await execAsync('nginx -s reload')
    logger.info(`[SSL] Nginx config removed for ${domain}`)

    return {
      success: true,
      message: 'NGINX_CONFIG_REMOVED'
    }
  } catch (error) {
    logger.error(`[SSL] Failed to remove Nginx config for ${domain}:`, error.message)
    return {
      success: false,
      message: 'NGINX_CONFIG_REMOVE_FAILED'
    }
  }
}

/**
 * Get nginx configuration
 * @returns {object} Nginx configuration
 */
export const getNginxConfig = () => CONFIG

export default {
  generateNginxConfig,
  installNginxConfig,
  installTempHttpConfig,
  removeNginxConfig,
  getNginxConfig
}
