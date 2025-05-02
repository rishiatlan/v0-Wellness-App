"use client"

import { useEffect, useState } from "react"
import { initErrorMonitoring } from "@/lib/error-monitoring"
import { APP_VERSION } from "@/lib/env-vars"
import { supabase } from "@/lib/supabase-client"

export function AppInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize error monitoring
        initErrorMonitoring()

        // Test Supabase connection
        try {
          const { data, error } = await supabase.from("users").select("count").limit(1)
          if (error) {
            console.error("Supabase connection test failed:", error)
          } else {
            console.log("Supabase connection successful")
          }
        } catch (supabaseError) {
          console.error("Error testing Supabase connection:", supabaseError)
        }

        // Log application startup
        console.log(`Spring Wellness App v${APP_VERSION} initialized`)

        // Track performance metrics
        if (typeof window !== "undefined" && "performance" in window) {
          // Report navigation timing
          setTimeout(() => {
            const navTiming = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
            if (navTiming) {
              console.log(`Page load time: ${navTiming.loadEventEnd - navTiming.startTime}ms`)
            }
          }, 0)
        }

        setInitialized(true)
      } catch (error) {
        console.error("Error during app initialization:", error)
      }
    }

    initApp()
  }, [])

  // This component doesn't render anything
  return null
}
