"use client"

// Base URL for the application
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://v0-spring-wellness-app.vercel.app"

// Function to get the full URL for a path
export function getFullUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.substring(1) : path
  return `${APP_URL}/${cleanPath}`
}

// Function to get the current URL
export function getCurrentUrl(): string {
  if (typeof window === "undefined") {
    return APP_URL
  }
  return window.location.href
}

// Function to get URL parameters
export function getUrlParams(): Record<string, string> {
  if (typeof window === "undefined") {
    return {}
  }

  const params = {}
  const searchParams = new URLSearchParams(window.location.search)

  for (const [key, value] of searchParams.entries()) {
    params[key] = value
  }

  return params
}

// Function to build a URL with query parameters
export function buildUrl(base: string, params: Record<string, string>): string {
  const url = new URL(base.startsWith("http") ? base : `${APP_URL}/${base.replace(/^\//, "")}`)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, value)
    }
  })

  return url.toString()
}

// Function to handle authentication redirects
export function getAuthRedirectUrl(path = "/daily-tracker"): string {
  // Remove leading slash if present for consistency
  const cleanPath = path.startsWith("/") ? path.substring(1) : path

  // Build the callback URL
  return buildUrl("/auth/login", {
    callbackUrl: `/${cleanPath}`,
  })
}

// Function to sanitize and validate internal URLs
export function sanitizeRedirectUrl(url: string | null | undefined): string {
  if (!url) {
    return "/daily-tracker"
  }

  // Check if it's an absolute URL
  if (url.startsWith("http")) {
    try {
      const urlObj = new URL(url)
      // Only allow redirects to our own domain
      if (urlObj.hostname !== new URL(APP_URL).hostname) {
        return "/daily-tracker"
      }
      return url
    } catch (e) {
      return "/daily-tracker"
    }
  }

  // For relative URLs, ensure they start with a slash
  return url.startsWith("/") ? url : `/${url}`
}
