import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// Public API routes that don't require authentication
const PUBLIC_API_ROUTES = ["/api/debug-auth-status", "/api/ensure-db-setup"]

/**
 * Lightweight authentication check for API routes
 * Much more efficient than middleware as it's only used when needed
 */
export async function checkApiAuth(req: NextRequest) {
  // Check if this is a public API route
  const pathname = req.nextUrl.pathname
  if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return null // No auth check needed
  }

  // Get the supabase client
  const supabase = createServerSupabaseClient()

  // Check if the user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized", message: "Authentication required" }, { status: 401 })
  }

  // Return the session for use in the API route
  return { session, supabase }
}
