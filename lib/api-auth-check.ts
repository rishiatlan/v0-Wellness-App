import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { isPublicRoute } from "./public-routes"

/**
 * API route function to check authentication
 * Use this in API routes that require authentication
 */
export function checkApiAuth(currentPath: string) {
  // Skip auth check for public routes
  if (isPublicRoute(currentPath)) {
    return true
  }

  // Check for authentication
  const cookieStore = cookies()
  const authToken = cookieStore.get("sb-auth-token")

  if (!authToken) {
    return false
  }

  return true
}

/**
 * Helper function to return unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized", message: "Authentication required" }, { status: 401 })
}
