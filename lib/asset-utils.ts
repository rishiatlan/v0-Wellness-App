/**
 * Utility functions for handling asset URLs with proper error handling
 */

// Base URL for email assets in Supabase storage
const EMAIL_ASSETS_BASE_URL = "https://mqvcdyzqegzqfwvesoiz.supabase.co/storage/v1/object/public/email-assets/"

// Base URL for public assets
const PUBLIC_ASSETS_BASE_URL = "/"

/**
 * Get the URL for an email asset from Supabase storage
 * @param assetName The name of the asset file
 * @returns The full URL to the asset
 */
export function getEmailAssetUrl(assetName: string): string {
  try {
    // Ensure the asset name is properly formatted
    const formattedAssetName = assetName.startsWith("/") ? assetName.substring(1) : assetName
    return `${EMAIL_ASSETS_BASE_URL}/${formattedAssetName}`
  } catch (error) {
    console.error("Error generating email asset URL:", error)
    return getFallbackAssetUrl(assetName)
  }
}

/**
 * Get a fallback URL for an asset from the public directory
 * @param assetName The name of the asset file
 * @returns The full URL to the public asset
 */
export function getFallbackAssetUrl(assetName: string): string {
  try {
    // Ensure the asset name is properly formatted
    const formattedAssetName = assetName.startsWith("/") ? assetName.substring(1) : assetName
    return `${PUBLIC_ASSETS_BASE_URL}${formattedAssetName}`
  } catch (error) {
    console.error("Error generating fallback asset URL:", error)
    return "/placeholder.svg"
  }
}

/**
 * Check if a URL is valid
 * @param url The URL to check
 * @returns Boolean indicating if the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}
