import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Cache for auth status to reduce cookie parsing overhead
const AUTH_CACHE = new Map<string, { timestamp: number; isAuthenticated: boolean }>()
const AUTH_CACHE_TTL = 10 * 1000 // 10 seconds cache

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/auth/callback",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/health",
]

// Check if a path is public
const isPublicPath = (path: string) => {
  return PUBLIC_PATHS.includes(path) || path.startsWith("/api/") || path.startsWith("/_next/") || path.includes(".")
}

export function middleware(request: NextRequest) {
  // Get the pathname
  const pathname = request.nextUrl.pathname

  // Skip processing for static assets and public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Clone the response
  const response = NextResponse.next()

  // Add security headers
  const headers = response.headers

  // Add security headers to all responses
  headers.set("X-DNS-Prefetch-Control", "on")
  headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
  headers.set("X-XSS-Protection", "1; mode=block")
  headers.set("X-Frame-Options", "SAMEORIGIN")
  headers.set("X-Content-Type-Options", "nosniff")
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()")

  // Add CSP header
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://v0-spring-wellness-app.vercel.app; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://v0-spring-wellness-app.vercel.app; frame-src 'self'; object-src 'none';",
  )

  // Add the pathname to headers for server components
  headers.set("x-pathname", pathname)

  // Check for authentication using cache if possible
  const cacheKey = request.cookies.get("sb-auth-token")?.value || "no-auth"
  const now = Date.now()
  const cachedAuth = AUTH_CACHE.get(cacheKey)

  // Use cached auth status if available and not expired
  if (cachedAuth && now - cachedAuth.timestamp < AUTH_CACHE_TTL) {
    if (!cachedAuth.isAuthenticated) {
      // Redirect to login with the original URL as the callback
      const url = new URL("/auth/login", request.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
    return response
  }

  // Check for authentication cookie
  const authCookie = request.cookies.get("sb-auth-token")
  const isAuthenticated = !!authCookie

  // Update cache
  AUTH_CACHE.set(cacheKey, { timestamp: now, isAuthenticated })

  // Clean up old cache entries periodically (1% chance per request)
  if (Math.random() < 0.01) {
    for (const [key, value] of AUTH_CACHE.entries()) {
      if (now - value.timestamp > AUTH_CACHE_TTL * 10) {
        AUTH_CACHE.delete(key)
      }
    }
  }

  if (!isAuthenticated) {
    // Redirect to login with the original URL as the callback
    const url = new URL("/auth/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return response
}

// Run on all routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
