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

// Function to preload assets
export function preloadAssets(assetNames: string[]): void {
  if (typeof window === "undefined") return

  assetNames.forEach((assetName) => {
    const link = document.createElement("link")
    link.rel = "preload"
    link.as = "image"
    link.href = getEmailAssetUrl(assetName)
    document.head.appendChild(link)
  })
}
