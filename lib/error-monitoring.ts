"use client"

import { ERROR_ENDPOINT, APP_VERSION, IS_PRODUCTION } from "./env-vars"

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Error context interface
interface ErrorContext {
  userId?: string
  email?: string
  path?: string
  component?: string
  action?: string
  additionalData?: Record<string, any>
}

// Function to log errors to the server
export async function logError(
  error: Error | string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context: ErrorContext = {},
) {
  try {
    // Get basic error information
    const errorMessage = error instanceof Error ? error.message : error
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorName = error instanceof Error ? error.name : "Unknown"

    // Get browser information
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "Server"
    const url = typeof window !== "undefined" ? window.location.href : ""
    const path = context.path || (typeof window !== "undefined" ? window.location.pathname : "")

    // Prepare the error payload
    const payload = {
      message: errorMessage,
      name: errorName,
      stack: errorStack,
      severity,
      timestamp: new Date().toISOString(),
      url,
      path,
      userAgent,
      appVersion: APP_VERSION,
      ...context,
    }

    // Log to console in development
    if (!IS_PRODUCTION) {
      console.group("Error logged:")
      console.error(payload)
      console.groupEnd()
    }

    // Send to server
    if (typeof fetch !== "undefined") {
      await fetch(ERROR_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
    }

    return true
  } catch (loggingError) {
    // Don't let the error logger cause more problems
    console.error("Error in error logger:", loggingError)
    return false
  }
}

// Global error handler
export function setupGlobalErrorHandler() {
  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      logError(event.error || event.message, ErrorSeverity.HIGH, {
        action: "global_error",
      })
    })

    window.addEventListener("unhandledrejection", (event) => {
      logError(event.reason || "Unhandled Promise Rejection", ErrorSeverity.HIGH, {
        action: "unhandled_promise",
      })
    })

    console.log("Global error handlers set up")
  }
}

// Initialize the error monitoring
export function initErrorMonitoring() {
  setupGlobalErrorHandler()
}
