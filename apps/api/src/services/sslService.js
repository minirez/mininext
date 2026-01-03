/**
 * SSL Service
 *
 * DNS doğrulama, Let's Encrypt sertifika yönetimi ve Nginx konfigürasyonu.
 *
 * Flow:
 * 1. Domain girilir
 * 2. DNS A kaydı doğrulanır (sunucu IP'sine yönlendirme kontrolü)
 * 3. Let's Encrypt ile SSL sertifikası alınır
 * 4. Nginx konfigürasyonu oluşturulur ve yüklenir
 */

import { exec, execSync } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import dns from 'dns'
import logger from '../core/logger.js'

const execAsync = promisify(exec)
const dnsResolve4 = promisify(dns.resolve4)

// Konfigürasyon
const CONFIG = {
  // Nginx config dizini
  nginxSitesAvailable: process.env.NGINX_SITES_AVAILABLE || '/etc/nginx/sites-available',
  nginxSitesEnabled: process.env.NGINX_SITES_ENABLED || '/etc/nginx/sites-enabled',

  // Let's Encrypt
  certbotEmail: process.env.CERTBOT_EMAIL || 'admin@minires.com',
  certbotWebroot: process.env.CERTBOT_WEBROOT || '/var/www/certbot',

  // Frontend build dizinleri (proxy için)
  frontendPorts: {
    b2c: process.env.B2C_FRONTEND_PORT || 3000,
    b2b: process.env.B2B_FRONTEND_PORT || 3001,
    pms: process.env.PMS_FRONTEND_PORT || 3002
  },

  // API backend
  apiBackend: process.env.API_BACKEND_URL || 'http://localhost:4000',

  // Sertifika dizini
  certDir: '/etc/letsencrypt/live'
}

/**
 * Sunucu IP adresini al
 * @returns {Promise<string>} Sunucu public IP
 */
export const getServerIP = async () => {
  try {
    // Önce environment variable'dan kontrol et
    if (process.env.SERVER_PUBLIC_IP) {
      return process.env.SERVER_PUBLIC_IP
    }

    // curl ile public IP al
    const { stdout } = await execAsync('curl -s ifconfig.me || curl -s icanhazip.com')
    return stdout.trim()
  } catch (error) {
    logger.error('[SSL] Failed to get server IP:', error.message)
    throw new Error('SERVER_IP_FETCH_FAILED')
  }
}

/**
 * DNS A kaydını doğrula
 * @param {string} domain - Doğrulanacak domain
 * @returns {Promise<{success: boolean, serverIP: string, domainIP: string|null, message: string}>}
 */
export const verifyDNS = async (domain) => {
  try {
    // Sunucu IP'sini al
    const serverIP = await getServerIP()

    // Domain'in A kaydını sorgula
    let domainIPs
    try {
      domainIPs = await dnsResolve4(domain)
    } catch (dnsError) {
      logger.warn(`[SSL] DNS lookup failed for ${domain}:`, dnsError.message)
      return {
        success: false,
        serverIP,
        domainIP: null,
        message: 'DNS_RECORD_NOT_FOUND'
      }
    }

    // A kaydı sunucu IP'sine yönlendirilmiş mi?
    const isPointingToServer = domainIPs.includes(serverIP)

    if (isPointingToServer) {
      logger.info(`[SSL] DNS verification successful for ${domain} -> ${serverIP}`)
      return {
        success: true,
        serverIP,
        domainIP: domainIPs[0],
        message: 'DNS_VERIFIED'
      }
    } else {
      logger.warn(`[SSL] DNS mismatch for ${domain}: expected ${serverIP}, got ${domainIPs.join(', ')}`)
      return {
        success: false,
        serverIP,
        domainIP: domainIPs[0],
        message: 'DNS_NOT_POINTING_TO_SERVER'
      }
    }
  } catch (error) {
    logger.error('[SSL] DNS verification error:', error.message)
    throw error
  }
}

/**
 * Let's Encrypt SSL sertifikası al
 * @param {string} domain - Sertifika alınacak domain
 * @returns {Promise<{success: boolean, certPath: string|null, expiresAt: Date|null, message: string}>}
 */
export const requestCertificate = async (domain) => {
  try {
    logger.info(`[SSL] Requesting certificate for ${domain}`)

    // Certbot komutu - webroot modu veya standalone
    // Production'da webroot tercih edilir
    const certbotCmd = process.env.NODE_ENV === 'production'
      ? `certbot certonly --webroot -w ${CONFIG.certbotWebroot} -d ${domain} --email ${CONFIG.certbotEmail} --agree-tos --non-interactive`
      : `certbot certonly --standalone -d ${domain} --email ${CONFIG.certbotEmail} --agree-tos --non-interactive --dry-run`

    const { stdout, stderr } = await execAsync(certbotCmd, { timeout: 120000 })

    logger.info(`[SSL] Certbot output for ${domain}:`, stdout)

    if (stderr && !stderr.includes('Congratulations')) {
      logger.warn(`[SSL] Certbot stderr for ${domain}:`, stderr)
    }

    // Sertifika yolunu kontrol et
    const certPath = path.join(CONFIG.certDir, domain)

    // Production'da sertifika dosyalarını kontrol et
    if (process.env.NODE_ENV === 'production') {
      try {
        await fs.access(path.join(certPath, 'fullchain.pem'))
        await fs.access(path.join(certPath, 'privkey.pem'))
      } catch {
        throw new Error('CERTIFICATE_FILES_NOT_FOUND')
      }
    }

    // Sertifika bitiş tarihini hesapla (Let's Encrypt = 90 gün)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90)

    logger.info(`[SSL] Certificate obtained for ${domain}, expires: ${expiresAt.toISOString()}`)

    return {
      success: true,
      certPath,
      expiresAt,
      message: 'CERTIFICATE_OBTAINED'
    }
  } catch (error) {
    logger.error(`[SSL] Certificate request failed for ${domain}:`, error.message)

    // Hata mesajını analiz et
    if (error.message.includes('too many certificates') || error.message.includes('rate limit')) {
      return {
        success: false,
        certPath: null,
        expiresAt: null,
        message: 'RATE_LIMIT_EXCEEDED'
      }
    }

    if (error.message.includes('DNS problem') || error.message.includes('unauthorized')) {
      return {
        success: false,
        certPath: null,
        expiresAt: null,
        message: 'DNS_VERIFICATION_FAILED'
      }
    }

    return {
      success: false,
      certPath: null,
      expiresAt: null,
      message: 'CERTIFICATE_REQUEST_FAILED'
    }
  }
}

/**
 * Nginx konfigürasyonu oluştur
 * @param {string} domain - Domain adı
 * @param {string} type - 'b2c' | 'b2b' | 'pms'
 * @param {string} partnerId - Partner ID (routing için)
 * @returns {string} Nginx konfigürasyon içeriği
 */
export const generateNginxConfig = (domain, type, partnerId) => {
  const frontendPort = CONFIG.frontendPorts[type]
  const certPath = path.join(CONFIG.certDir, domain)

  // Domain tipine göre upstream ve location ayarları
  const upstreamName = `${domain.replace(/\./g, '_')}_upstream`

  return `# Auto-generated config for ${domain} (${type})
# Partner ID: ${partnerId}
# Generated: ${new Date().toISOString()}

upstream ${upstreamName} {
    server 127.0.0.1:${frontendPort};
    keepalive 64;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root ${CONFIG.certbotWebroot};
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain};

    # SSL certificates
    ssl_certificate ${certPath}/fullchain.pem;
    ssl_certificate_key ${certPath}/privkey.pem;

    # SSL settings (Mozilla Modern configuration)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Logging
    access_log /var/log/nginx/${domain}.access.log;
    error_log /var/log/nginx/${domain}.error.log;

    # API proxy
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
        alias /var/www/mini/booking-engine/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

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
 * Nginx konfigürasyonunu kaydet ve etkinleştir
 * @param {string} domain - Domain adı
 * @param {string} configContent - Nginx konfigürasyon içeriği
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const installNginxConfig = async (domain, configContent) => {
  const configFilename = `${domain}.conf`
  const availablePath = path.join(CONFIG.nginxSitesAvailable, configFilename)
  const enabledPath = path.join(CONFIG.nginxSitesEnabled, configFilename)

  try {
    // Konfigürasyonu sites-available'a yaz
    await fs.writeFile(availablePath, configContent, 'utf8')
    logger.info(`[SSL] Nginx config written to ${availablePath}`)

    // Symlink oluştur (sites-enabled)
    try {
      await fs.unlink(enabledPath)
    } catch {
      // Dosya yoksa sorun değil
    }
    await fs.symlink(availablePath, enabledPath)
    logger.info(`[SSL] Nginx config enabled: ${enabledPath}`)

    // Nginx konfigürasyonunu test et
    const { stderr: testStderr } = await execAsync('nginx -t')
    if (testStderr && !testStderr.includes('successful')) {
      throw new Error(`Nginx config test failed: ${testStderr}`)
    }

    // Nginx'i yeniden yükle
    await execAsync('nginx -s reload')
    logger.info(`[SSL] Nginx reloaded successfully`)

    return {
      success: true,
      message: 'NGINX_CONFIG_INSTALLED'
    }
  } catch (error) {
    logger.error(`[SSL] Nginx config installation failed for ${domain}:`, error.message)

    // Rollback - hatalı konfigürasyonu sil
    try {
      await fs.unlink(enabledPath)
      await fs.unlink(availablePath)
    } catch {
      // Silme hataları yoksay
    }

    return {
      success: false,
      message: 'NGINX_CONFIG_FAILED'
    }
  }
}

/**
 * Nginx konfigürasyonunu kaldır
 * @param {string} domain - Domain adı
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const removeNginxConfig = async (domain) => {
  const configFilename = `${domain}.conf`
  const availablePath = path.join(CONFIG.nginxSitesAvailable, configFilename)
  const enabledPath = path.join(CONFIG.nginxSitesEnabled, configFilename)

  try {
    // Symlink'i sil
    try {
      await fs.unlink(enabledPath)
    } catch {
      // Dosya yoksa sorun değil
    }

    // Config dosyasını sil
    try {
      await fs.unlink(availablePath)
    } catch {
      // Dosya yoksa sorun değil
    }

    // Nginx'i yeniden yükle
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
 * SSL sertifikasını kontrol et
 * @param {string} domain - Domain adı
 * @returns {Promise<{exists: boolean, expiresAt: Date|null, daysRemaining: number|null}>}
 */
export const checkCertificate = async (domain) => {
  const certPath = path.join(CONFIG.certDir, domain, 'fullchain.pem')

  try {
    await fs.access(certPath)

    // Sertifika bitiş tarihini al
    const { stdout } = await execAsync(
      `openssl x509 -enddate -noout -in ${certPath}`
    )

    // "notAfter=Dec 31 23:59:59 2024 GMT" formatından parse et
    const match = stdout.match(/notAfter=(.+)/)
    if (match) {
      const expiresAt = new Date(match[1])
      const now = new Date()
      const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))

      return {
        exists: true,
        expiresAt,
        daysRemaining
      }
    }

    return { exists: true, expiresAt: null, daysRemaining: null }
  } catch {
    return { exists: false, expiresAt: null, daysRemaining: null }
  }
}

/**
 * SSL sertifikasını yenile
 * @param {string} domain - Domain adı
 * @returns {Promise<{success: boolean, expiresAt: Date|null, message: string}>}
 */
export const renewCertificate = async (domain) => {
  try {
    logger.info(`[SSL] Renewing certificate for ${domain}`)

    const { stdout, stderr } = await execAsync(
      `certbot renew --cert-name ${domain} --non-interactive`,
      { timeout: 120000 }
    )

    logger.info(`[SSL] Renewal output for ${domain}:`, stdout)

    // Yeni bitiş tarihini al
    const certInfo = await checkCertificate(domain)

    // Nginx'i yeniden yükle
    await execAsync('nginx -s reload')

    return {
      success: true,
      expiresAt: certInfo.expiresAt,
      message: 'CERTIFICATE_RENEWED'
    }
  } catch (error) {
    logger.error(`[SSL] Certificate renewal failed for ${domain}:`, error.message)
    return {
      success: false,
      expiresAt: null,
      message: 'CERTIFICATE_RENEWAL_FAILED'
    }
  }
}

/**
 * Tam SSL kurulum akışı
 * @param {string} domain - Domain adı
 * @param {string} type - 'b2c' | 'b2b' | 'pms'
 * @param {string} partnerId - Partner ID
 * @returns {Promise<{success: boolean, step: string, expiresAt: Date|null, message: string}>}
 */
export const setupSSL = async (domain, type, partnerId) => {
  try {
    logger.info(`[SSL] Starting full SSL setup for ${domain} (${type})`)

    // 1. DNS doğrulama
    const dnsResult = await verifyDNS(domain)
    if (!dnsResult.success) {
      return {
        success: false,
        step: 'dns',
        expiresAt: null,
        message: dnsResult.message,
        details: dnsResult
      }
    }

    // 2. Sertifika al
    const certResult = await requestCertificate(domain)
    if (!certResult.success) {
      return {
        success: false,
        step: 'certificate',
        expiresAt: null,
        message: certResult.message
      }
    }

    // 3. Nginx konfigürasyonu oluştur ve kur
    const nginxConfig = generateNginxConfig(domain, type, partnerId)
    const nginxResult = await installNginxConfig(domain, nginxConfig)
    if (!nginxResult.success) {
      return {
        success: false,
        step: 'nginx',
        expiresAt: certResult.expiresAt,
        message: nginxResult.message
      }
    }

    logger.info(`[SSL] Full SSL setup completed for ${domain}`)

    return {
      success: true,
      step: 'complete',
      expiresAt: certResult.expiresAt,
      message: 'SSL_SETUP_COMPLETE'
    }
  } catch (error) {
    logger.error(`[SSL] SSL setup failed for ${domain}:`, error.message)
    return {
      success: false,
      step: 'error',
      expiresAt: null,
      message: 'SSL_SETUP_FAILED'
    }
  }
}

export default {
  getServerIP,
  verifyDNS,
  requestCertificate,
  generateNginxConfig,
  installNginxConfig,
  removeNginxConfig,
  checkCertificate,
  renewCertificate,
  setupSSL
}
