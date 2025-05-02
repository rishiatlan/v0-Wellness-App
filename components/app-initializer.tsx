"use client"

import { useEffect } from "react"
import { initErrorMonitoring } from "@/lib/error-monitoring"
import { APP_VERSION } from "@/lib/env-vars"

export function AppInitializer() {
  useEffect(() => {
    // Initialize error monitoring
    initErrorMonitoring()

    // Log application startup
    console.log(`Spring Wellness App v${APP_VERSION} initialized`)

    // You can add other initialization logic here
  }, [])

  // This component doesn't render anything
  return null
}
