/**
 * Composable for resolving image URLs from API paths.
 * Handles storefront paths (storefront/xxx) and upload paths (/uploads/xxx).
 */
export function useImageUrl() {
  function imageUrl(path: string | { link?: string; url?: string } | null | undefined): string {
    if (!path) return ''

    // Support photo objects: { id, width, height, link }
    if (typeof path === 'object') {
      path = path?.link || path?.url || ''
    }

    if (typeof path !== 'string' || !path) return ''

    // Already a full URL
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }

    // Storefront uploaded images: storefront/xxx → /uploads/storefront/xxx
    if (path.startsWith('storefront/')) {
      return `/uploads/${path}`
    }

    // Already an absolute path (e.g., /uploads/sites/xxx)
    if (path.startsWith('/')) {
      return path
    }

    // Relative path → make absolute
    return `/${path}`
  }

  return { imageUrl }
}
