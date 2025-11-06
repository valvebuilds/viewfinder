/**
 * Shared constants across the application
 */

export const STORAGE_BUCKET = 'viewfinder-images'

/**
 * Thumbnail generation settings
 */
export const THUMBNAIL_CONFIG = {
  maxDimension: 300, // Maximum width or height in pixels
  quality: 85, // WebP quality (0-100)
  format: 'webp' as const, // Output format
} as const

