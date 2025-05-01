import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/auth/callback",
  "/terms",
  "/privacy",
  "/health",
  "/contact",
]

/**
 * Server-side authentication check for server components
 * Much more efficient than middleware
 */
export async function checkServerAuth(pathname: string) {
  // Check if this is a public route
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    return { isAuthenticated: true, isPublicRoute: true }
  }

  // Get the supabase client
  const supabase = createServerSupabaseClient()

  // Check if the user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Redirect to login if not authenticated
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`)
  }

  return {
    isAuthenticated: true,
    isPublicRoute: false,
    session,
    user: session.user,
  }
}
