// Cache for asset URLs to avoid repeated lookups
const assetUrlCache = new Map<string, string>()

// Function to get asset URL with fallback
export function getEmailAssetUrl(assetName: string): string {
  // Check cache first
  if (assetUrlCache.has(assetName)) {
    return assetUrlCache.get(assetName) as string
  }

  // Try to get from public folder
  const url = `/${assetName}`

  // Store in cache
  assetUrlCache.set(assetName, url)

  return url
}

// Function to get fallback asset URL
export function getFallbackAssetUrl(assetName: string): string {
  // Check cache first
  const cacheKey = `fallback-${assetName}`
  if (assetUrlCache.has(cacheKey)) {
    return assetUrlCache.get(cacheKey) as string
  }

  // Generate a fallback URL
  const url = `/placeholder.svg?height=32&width=32&query=wellness%20logo`

  // Store in cache
  assetUrlCache.set(cacheKey, url)

  return url
}

/**
 * Preloads assets to improve initial load performance
 * @param assets Array of asset filenames to preload
 */
export function preloadAssets(assets: string[]) {
  if (typeof window === "undefined") return

  assets.forEach((asset) => {
    const link = document.createElement("link")
    link.rel = "preload"

    // Determine the correct 'as' attribute based on file extension
    const extension = asset.split(".").pop()?.toLowerCase()
    if (
      extension === "png" ||
      extension === "jpg" ||
      extension === "jpeg" ||
      extension === "gif" ||
      extension === "webp"
    ) {
      link.as = "image"
    } else if (extension === "css") {
      link.as = "style"
    } else if (extension === "js") {
      link.as = "script"
    } else if (extension === "woff" || extension === "woff2" || extension === "ttf") {
      link.as = "font"
    }

    // Set crossorigin attribute for CORS resources
    link.crossOrigin = "anonymous"

    // Set the href
    link.href = `/${asset}`

    // Add to document head
    document.head.appendChild(link)
  })
}
