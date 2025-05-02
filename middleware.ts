import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname
  const pathname = request.nextUrl.pathname

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

  // Add CSP header with Google Fonts allowed
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://v0-spring-wellness-app.vercel.app; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co https://v0-spring-wellness-app.vercel.app; frame-src 'self'; object-src 'none';",
  )

  // Add the pathname to headers for server components
  headers.set("x-pathname", pathname)

  // Skip auth check for certain paths
  const isPublicPath =
    pathname === "/" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".") // Skip files like favicon.ico

  // Skip auth check if we're already on the login page to prevent redirect loops
  const isLoginPage = pathname === "/auth/login"

  if (!isPublicPath && !isLoginPage) {
    // Check for authentication cookie
    const authCookie = request.cookies.get("sb-auth-token")

    if (!authCookie) {
      console.log("No auth cookie found, redirecting to login from:", pathname)
      // Redirect to login with the original URL as the callback
      const url = new URL("/auth/login", request.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
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
