"use client"

// Performance monitoring utility
// This file provides utilities for monitoring and reporting performance metrics

import { useEffect } from "react"

// Constants
const PERFORMANCE_ENDPOINT = process.env.NEXT_PUBLIC_ERROR_ENDPOINT || "/api/log-error"
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "unknown"
const SAMPLE_RATE = 0.1 // Only report 10% of performance data to reduce server load

// Types
type PerformanceMetric = {
  name: string
  value: number
  unit: string
  page: string
  timestamp: number
  appVersion: string
  userAgent: string
  connection?: string
  deviceMemory?: number
  hardwareConcurrency?: number
}

// Define types for performance metrics
interface PerformanceMetrics {
  pageLoadTime?: number
  ttfb?: number
  fcp?: number
  lcp?: number
  cls?: number
  fid?: number
  apiCallTimes: Record<string, number>
  resourceLoadTimes: Record<string, number>
  errors: Array<{
    message: string
    timestamp: number
    url: string
    stack?: string
  }>
}

interface NavigationTiming {
  fetchStart: number
  domainLookupStart: number
  domainLookupEnd: number
  connectStart: number
  connectEnd: number
  requestStart: number
  responseStart: number
  responseEnd: number
  domInteractive: number
  domContentLoadedEventEnd: number
  loadEventEnd: number
}

// Initialize metrics object
const metrics: PerformanceMetrics = {
  apiCallTimes: {},
  resourceLoadTimes: {},
  errors: [],
}

// Sample rate for reporting (to reduce server load)
// Should this session report metrics?
const shouldReportMetrics = Math.random() < SAMPLE_RATE

// Helper to check if we should sample this session
const shouldSample = () => {
  // Store the decision in sessionStorage so it's consistent for the session
  const key = "perf_sample_decision"
  let decision = sessionStorage.getItem(key)

  if (decision === null) {
    decision = Math.random() < SAMPLE_RATE ? "yes" : "no"
    sessionStorage.setItem(key, decision)
  }

  return decision === "yes"
}

// Report a performance metric to the server
export async function reportPerformanceMetric(
  metric: Omit<PerformanceMetric, "timestamp" | "appVersion" | "userAgent">,
) {
  // Only report if we're sampling this session
  if (!shouldSample()) return

  try {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
      appVersion: APP_VERSION,
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType,
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
    }

    // Use sendBeacon for non-blocking reporting if available
    if (navigator.sendBeacon) {
      navigator.sendBeacon(PERFORMANCE_ENDPOINT, JSON.stringify({ type: "performance", data: fullMetric }))
    } else {
      // Fall back to fetch
      fetch(PERFORMANCE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "performance", data: fullMetric }),
        // Use keepalive to ensure the request completes even if the page is unloading
        keepalive: true,
      }).catch(() => {
        // Ignore errors - performance reporting should never break the app
      })
    }
  } catch (error) {
    // Silently fail - performance reporting should never break the app
    console.debug("Failed to report performance metric", error)
  }
}

// Thresholds for performance metrics (in ms)
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
}

// Get rating based on thresholds
const getRating = (name: string, value: number): "good" | "needs-improvement" | "poor" => {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS]
  if (!threshold) return "good"

  if (value <= threshold.good) return "good"
  if (value <= threshold.poor) return "needs-improvement"
  return "poor"
}

// Initialize performance monitoring
export function initPerformanceMonitoring() {
  if (typeof window === "undefined" || !shouldReportMetrics) return

  try {
    // Capture page load metrics
    window.addEventListener("load", () => {
      setTimeout(capturePageLoadMetrics, 0)
    })

    // Capture errors
    window.addEventListener("error", (event) => {
      captureError(event.message, event.error?.stack)
    })

    // Capture unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      captureError(`Unhandled Promise Rejection: ${event.reason}`, event.reason?.stack)
    })

    // Capture API call times
    monkeyPatchFetch()

    console.log("Performance monitoring initialized")
  } catch (error) {
    console.error("Error initializing performance monitoring:", error)
  }
}

// Report a web vital metric
const reportWebVital = (name: string, value: number) => {
  const metric: PerformanceMetric = {
    name,
    value,
    unit: "ms",
    page: window.location.pathname,
    timestamp: Date.now(),
    appVersion: APP_VERSION,
    userAgent: navigator.userAgent,
    rating: getRating(name, value),
  }

  console.log(`Performance metric: ${name} = ${value}ms (${metric.rating})`)

  // Send to analytics or monitoring service
  if (process.env.NEXT_PUBLIC_ERROR_ENDPOINT) {
    fetch(`${process.env.NEXT_PUBLIC_ERROR_ENDPOINT}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...metric,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
      // Use keepalive to ensure the request completes even if the page is unloading
      keepalive: true,
    }).catch((err) => {
      console.error("Failed to report performance metric:", err)
    })
  }
}

// Collect navigation timing metrics
const collectNavigationTiming = () => {
  if (!performance || !performance.timing) return

  const timing = performance.timing
  const navigationTiming: NavigationTiming = {
    fetchStart: timing.fetchStart,
    domainLookupStart: timing.domainLookupStart,
    domainLookupEnd: timing.domainLookupEnd,
    connectStart: timing.connectStart,
    connectEnd: timing.connectEnd,
    requestStart: timing.requestStart,
    responseStart: timing.responseStart,
    responseEnd: timing.responseEnd,
    domInteractive: timing.domInteractive,
    domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
    loadEventEnd: timing.loadEventEnd,
  }

  // Calculate derived metrics
  const metrics = {
    // DNS lookup time
    dnsLookup: navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart,
    // Initial connection time
    tcpConnection: navigationTiming.connectEnd - navigationTiming.connectStart,
    // Time to first byte
    ttfb: navigationTiming.responseStart - navigationTiming.requestStart,
    // Download time
    download: navigationTiming.responseEnd - navigationTiming.responseStart,
    // DOM processing time
    domProcessing: navigationTiming.domInteractive - navigationTiming.responseEnd,
    // DOM rendering time
    domRendering: navigationTiming.domContentLoadedEventEnd - navigationTiming.domInteractive,
    // Page load time
    pageLoad: navigationTiming.loadEventEnd - navigationTiming.fetchStart,
  }

  // Report each metric
  Object.entries(metrics).forEach(([name, value]) => {
    reportWebVital(name, value)
  })
}

// Monitor fetch API calls
const monitorFetch = () => {
  const originalFetch = window.fetch

  window.fetch = async function (input, init) {
    const startTime = performance.now()
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url

    try {
      const response = await originalFetch.apply(this, [input, init])
      const endTime = performance.now()
      const duration = endTime - startTime

      // Only log API calls, not asset requests
      if (url.includes("/api/") || url.includes("supabase")) {
        console.log(`API call to ${url} took ${duration.toFixed(2)}ms`)

        // Report slow API calls (over 1000ms)
        if (duration > 1000) {
          reportWebVital("SlowApiCall", duration)
        }
      }

      return response
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      console.error(`API call to ${url} failed after ${duration.toFixed(2)}ms:`, error)
      reportWebVital("FailedApiCall", duration)

      throw error
    }
  }
}

// Monitor XMLHttpRequest calls
const monitorXHR = () => {
  const originalOpen = XMLHttpRequest.prototype.open
  const originalSend = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function (method, url) {
    this._perfUrl = url
    this._perfMethod = method
    originalOpen.apply(this, arguments)
  }

  XMLHttpRequest.prototype.send = function () {
    const startTime = performance.now()

    this.addEventListener("load", () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Only log API calls, not asset requests
      if (this._perfUrl.includes("/api/") || this._perfUrl.includes("supabase")) {
        console.log(`XHR ${this._perfMethod} to ${this._perfUrl} took ${duration.toFixed(2)}ms`)

        // Report slow API calls (over 1000ms)
        if (duration > 1000) {
          reportWebVital("SlowXhrCall", duration)
        }
      }
    })

    this.addEventListener("error", () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      console.error(`XHR ${this._perfMethod} to ${this._perfUrl} failed after ${duration.toFixed(2)}ms`)
      reportWebVital("FailedXhrCall", duration)
    })

    originalSend.apply(this, arguments)
  }
}

// Capture page load metrics
function capturePageLoadMetrics() {
  try {
    if (!performance) return

    // Basic navigation timing
    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
    if (navEntry) {
      metrics.pageLoadTime = navEntry.loadEventEnd - navEntry.startTime
      metrics.ttfb = navEntry.responseStart - navEntry.requestStart
    }

    // Web Vitals if available
    if ("getEntriesByName" in performance) {
      const paintEntries = performance.getEntriesByType("paint")
      const fcpEntry = paintEntries.find((entry) => entry.name === "first-contentful-paint")
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime
      }
    }

    // Resource timing
    const resourceEntries = performance.getEntriesByType("resource")
    resourceEntries.forEach((entry) => {
      const url = entry.name.split("?")[0] // Remove query params
      if (!metrics.resourceLoadTimes[url]) {
        metrics.resourceLoadTimes[url] = entry.duration
      }
    })

    // Report metrics after a short delay
    setTimeout(() => {
      reportMetrics()
    }, 1000)
  } catch (error) {
    console.error("Error capturing page load metrics:", error)
  }
}

// Monkey patch fetch to measure API call times
function monkeyPatchFetch() {
  const originalFetch = window.fetch
  window.fetch = async function (input, init) {
    const startTime = performance.now()
    try {
      const response = await originalFetch.apply(this, [input, init])
      const endTime = performance.now()

      // Only track API calls, not static assets
      const url = typeof input === "string" ? input : input.url
      if (url.includes("/api/") || url.includes("supabase")) {
        const apiPath = url.split("?")[0] // Remove query params
        metrics.apiCallTimes[apiPath] = endTime - startTime
      }

      return response
    } catch (error) {
      const endTime = performance.now()
      captureError(`Fetch error: ${error.message}`, error.stack)
      throw error
    }
  }
}

// Capture error information
function captureError(message: string, stack?: string) {
  if (metrics.errors.length >= 10) return // Limit number of errors captured

  metrics.errors.push({
    message,
    timestamp: Date.now(),
    url: window.location.href,
    stack,
  })
}

// Report metrics to backend
async function reportMetrics() {
  if (!shouldReportMetrics) return

  try {
    // Add some user context if available
    const userContext = {
      path: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      // Don't include PII
    }

    const payload = {
      ...metrics,
      context: userContext,
    }

    // Use the error logging endpoint
    await fetch("/api/log-error", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "performance",
        data: payload,
      }),
      // Use keepalive to ensure the request completes even if the page is unloading
      keepalive: true,
    })

    console.log("Performance metrics reported")

    // Clear metrics after reporting
    metrics.apiCallTimes = {}
    metrics.resourceLoadTimes = {}
    metrics.errors = []
  } catch (error) {
    console.error("Error reporting metrics:", error)
  }
}

// Hook to measure and report page load performance
export function usePageLoadPerformance() {
  useEffect(() => {
    // Wait for the page to be fully loaded
    if (document.readyState === "complete") {
      reportPageLoadMetrics()
    } else {
      window.addEventListener("load", reportPageLoadMetrics, { once: true })
    }

    return () => {
      window.removeEventListener("load", reportPageLoadMetrics)
    }
  }, [])

  function reportPageLoadMetrics() {
    // Only run in the browser
    if (typeof window === "undefined") return

    // Use the Performance API to get timing metrics
    const performance = window.performance

    if (!performance || !performance.timing) return

    // Calculate key metrics
    const timing = performance.timing
    const pageLoadTime = timing.loadEventEnd - timing.navigationStart
    const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart
    const firstPaint =
      performance.getEntriesByType("paint").find((entry) => entry.name === "first-paint")?.startTime || 0

    // Report the metrics
    reportPerformanceMetric({
      name: "page_load",
      value: pageLoadTime,
      unit: "ms",
      page: window.location.pathname,
    })

    reportPerformanceMetric({
      name: "dom_content_loaded",
      value: domContentLoaded,
      unit: "ms",
      page: window.location.pathname,
    })

    if (firstPaint) {
      reportPerformanceMetric({
        name: "first_paint",
        value: firstPaint,
        unit: "ms",
        page: window.location.pathname,
      })
    }

    // Report Largest Contentful Paint if available
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]

      reportPerformanceMetric({
        name: "largest_contentful_paint",
        value: lastEntry.startTime,
        unit: "ms",
        page: window.location.pathname,
      })

      observer.disconnect()
    })

    observer.observe({ type: "largest-contentful-paint", buffered: true })
  }
}

// Hook to measure component render time
export function useComponentRenderTime(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime

      reportPerformanceMetric({
        name: "component_render",
        value: renderTime,
        unit: "ms",
        page: `${window.location.pathname}#${componentName}`,
      })
    }
  }, [componentName])
}

// Export utility functions
export const PerformanceMonitoring = {
  trackApiCall: (name: string, duration: number) => {
    if (shouldReportMetrics) {
      metrics.apiCallTimes[name] = duration
    }
  },

  trackError: (message: string, stack?: string) => {
    if (shouldReportMetrics) {
      captureError(message, stack)
    }
  },

  reportMetricsNow: () => {
    reportMetrics()
  },
}

// Export a function to manually report performance metrics
export const reportPerformance = (name: string, value: number) => {
  reportWebVital(name, value)
}
