"use client"

import { useEffect } from "react"
import { preloadAssets } from "@/lib/asset-utils"

export function AssetPreloader() {
  useEffect(() => {
    // Preload critical assets
    preloadAssets(["wellness.png", "wellness-logo.png", "abstract-geometric-logo.png"])
  }, [])

  return null // This component doesn't render anything
}
