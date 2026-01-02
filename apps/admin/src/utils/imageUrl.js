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
 * @param {string} url - Relative image path (e.g., /hotels/123/image.png) or full URL
 * @returns {string} Full image URL
 */
export const getImageUrl = (url) => {
  if (!url) return ''

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
export const getHotelImageUrl = (hotel) => {
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
export const getRoomImageUrl = (roomType) => {
  if (!roomType?.images?.length) return null

  const mainImage = roomType.images.find(img => img.isMain) || roomType.images[0]
  return mainImage?.url ? getImageUrl(mainImage.url) : null
}

export default getImageUrl
