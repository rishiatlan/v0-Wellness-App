"use client"

import { useEffect } from "react"
import { initPerformanceMonitoring } from "@/lib/performance-monitoring"

export function PerformanceMonitor() {
  useEffect(() => {
    initPerformanceMonitoring()
  }, [])

  // This component doesn't render anything
  return null
}
