/**
 * Image URL Utility
 *
 * Centralized utility for generating image URLs.
 * All images are served from the dedicated images subdomain.
 */

// Image CDN base URL
const IMAGES_BASE_URL = import.meta.env.VITE_IMAGES_URL || 'https://images.minires.com'

/**
 * Get full image URL from a relative path
 * @param {string|Object} url - Relative image path (e.g., /hotels/123/image.png), full URL, or a photo object with { link }
 * @returns {string} Full image URL
 */
export const getImageUrl = url => {
  if (!url) return ''

  // Support storefront photo objects: { id, width, height, link }
  // and other object shapes that might include { url }.
  if (typeof url === 'object') {
    url = url?.link || url?.url || ''
  }

  if (typeof url !== 'string') return ''

  // If already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // Ensure path starts with /
  const path = url.startsWith('/') ? url : `/${url}`

  // Remove /uploads prefix if present (for backwards compatibility)
  const cleanPath = path.replace(/^\/uploads/, '')

  return `${IMAGES_BASE_URL}${cleanPath}`
}

/**
 * Get hotel image URL
 * @param {Object} hotel - Hotel object with logo or images
 * @returns {string|null} Image URL or null
 */
export const getHotelImageUrl = hotel => {
  if (!hotel) return null

  // Try logo first
  if (hotel.logo) {
    return getImageUrl(hotel.logo)
  }

  // Try main image from images array
  if (hotel.images?.length) {
    const mainImage = hotel.images.find(img => img.isMain) || hotel.images[0]
    if (mainImage?.url) {
      return getImageUrl(mainImage.url)
    }
  }

  return null
}

/**
 * Get room type image URL
 * @param {Object} roomType - Room type object with images
 * @returns {string|null} Image URL or null
 */
export const getRoomImageUrl = roomType => {
  if (!roomType?.images?.length) return null

  const mainImage = roomType.images.find(img => img.isMain) || roomType.images[0]
  return mainImage?.url ? getImageUrl(mainImage.url) : null
}

/**
 * Get full file URL from API server (for avatars, documents, etc.)
 * @param {string} relativePath - Relative path (e.g., /uploads/avatars/xxx.png)
 * @returns {string|null} Full URL or null
 */
export const getFileUrl = relativePath => {
  if (!relativePath) return null

  // If already a full URL, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath
  }

  // Extract base URL (protocol + host) from API URL
  const apiUrl = import.meta.env.VITE_API_BASE_URL || ''
  try {
    const url = new URL(apiUrl)
    return `${url.protocol}//${url.host}${relativePath}`
  } catch {
    return relativePath
  }
}

/**
 * Get avatar URL from user/partner/agency object
 * @param {Object} entity - Object with avatar property
 * @returns {string|null} Avatar URL or null
 */
export const getAvatarUrl = entity => {
  if (!entity?.avatar?.url) return null
  return getFileUrl(entity.avatar.url)
}

/**
 * Get storefront section image URL
 * Handles both CDN images and storefront uploads (served from API server)
 * @param {string|Object} photo - Photo link string, or object with { link, url }
 * @returns {string} Full image URL
 */
export const getStorefrontImageUrl = photo => {
  if (!photo) return ''
  const link = typeof photo === 'string' ? photo : photo?.link || photo?.url || ''
  if (!link) return ''
  if (link.startsWith('http://') || link.startsWith('https://')) return link
  if (link.startsWith('storefront/')) return getFileUrl(`/uploads/${link}`)
  return getImageUrl(link)
}

export default getImageUrl
