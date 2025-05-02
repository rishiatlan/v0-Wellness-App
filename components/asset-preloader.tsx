"use client"

import { useEffect } from "react"
import { preloadAssets } from "@/lib/asset-utils"

// List of critical assets to preload
const CRITICAL_ASSETS = ["wellness-logo.png", "abstract-geometric-logo.png", "wellness.png"]

export function AssetPreloader() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return

    // Preload critical assets
    preloadAssets(CRITICAL_ASSETS)
  }, [])

  return null // This component doesn't render anything
}
