import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { isPublicRoute } from "./public-routes"

/**
 * Server component function to check authentication
 * Use this in server components that require authentication
 */
export function checkServerAuth(currentPath: string) {
  // Skip auth check for public routes
  if (isPublicRoute(currentPath)) {
    return true
  }

  // Check for authentication
  const cookieStore = cookies()
  const authToken = cookieStore.get("sb-auth-token")

  if (!authToken) {
    // Redirect to login with callback URL
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`)
  }

  return true
}
