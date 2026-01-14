/**
 * HTML Sanitization Utility
 *
 * XSS saldırılarına karşı koruma sağlar.
 * Tüm v-html kullanımlarında bu utility kullanılmalıdır.
 */

import DOMPurify from 'dompurify'

/**
 * HTML içeriğini sanitize eder
 * @param {string} html - Sanitize edilecek HTML string
 * @param {object} options - DOMPurify options
 * @returns {string} Sanitize edilmiş HTML
 */
export const sanitizeHtml = (html, options = {}) => {
  if (!html) return ''

  // Varsayılan güvenli ayarlar
  const defaultOptions = {
    // İzin verilen HTML etiketleri
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'hr'
    ],
    // İzin verilen attributeler
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'id', 'style',
      'src', 'alt', 'title', 'width', 'height'
    ],
    // Link'leri güvenli hale getir
    ALLOW_DATA_ATTR: false,
    // JavaScript protokollerini engelle
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  }

  const mergedOptions = { ...defaultOptions, ...options }

  return DOMPurify.sanitize(html, mergedOptions)
}

/**
 * Sadece metin içeren HTML'i sanitize eder (tüm etiketleri kaldırır)
 * @param {string} html - Sanitize edilecek HTML string
 * @returns {string} Düz metin
 */
export const sanitizeToText = (html) => {
  if (!html) return ''
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] })
}

/**
 * Markdown çıktısı için optimize edilmiş sanitize
 * @param {string} html - Markdown'dan dönüştürülmüş HTML
 * @returns {string} Sanitize edilmiş HTML
 */
export const sanitizeMarkdown = (html) => {
  if (!html) return ''

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'del',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'span',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'img'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'title'],
    // Tüm link'leri yeni sekmede aç
    ADD_ATTR: ['target'],
    ALLOW_DATA_ATTR: false
  })
}

/**
 * Vue directive için sanitize fonksiyonu
 * Kullanım: v-safe-html="content"
 */
export const vSafeHtml = {
  mounted(el, binding) {
    el.innerHTML = sanitizeHtml(binding.value)
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      el.innerHTML = sanitizeHtml(binding.value)
    }
  }
}

export default {
  sanitizeHtml,
  sanitizeToText,
  sanitizeMarkdown,
  vSafeHtml
}
