import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { initializeUserProfile } from "@/lib/server-auth"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")

  // Get the callback URL from the query parameters or use a default
  const callbackUrl = requestUrl.searchParams.get("callbackUrl") || "/daily-tracker"

  console.log("Auth callback received with code:", code ? "Present" : "Missing")
  console.log("Callback URL:", callbackUrl)

  if (error || error_description) {
    console.error("Auth error received:", error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent(error_description || "Authentication failed")}`,
    )
  }

  if (!code) {
    console.log("Auth callback received with no code parameter - this might be normal in some flows")

    // Check if user is already authenticated
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => cookieStore.set(name, value, options),
          remove: (name, options) => cookieStore.set(name, "", { ...options, maxAge: 0 }),
        },
      },
    )

    const { data } = await supabase.auth.getSession()

    // If user already has a session, just redirect them
    if (data.session) {
      return NextResponse.redirect(requestUrl.origin + callbackUrl, { status: 302 })
    }

    // Otherwise, redirect to login without an error message
    return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => cookieStore.set(name, value, options),
          remove: (name, options) => cookieStore.set(name, "", { ...options, maxAge: 0 }),
        },
      },
    )

    try {
      // Exchange the code for a session
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        console.error("Error exchanging code for session:", sessionError)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/login?error=${encodeURIComponent(sessionError.message || "Authentication failed")}`,
        )
      }

      // Get the current user after authentication
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("Error getting user:", userError)
      }

      if (user) {
        try {
          // Initialize user profile
          await initializeUserProfile(user.id, user.email || "", user.user_metadata?.full_name)
        } catch (error) {
          console.error("Error in user profile initialization:", error)
        }
      }

      console.log("Auth callback completed successfully, redirecting to:", callbackUrl)

      // URL to redirect to after sign in process completes
      const redirectUrl = requestUrl.origin + callbackUrl
      console.log("Full redirect URL:", redirectUrl)
      return NextResponse.redirect(redirectUrl, { status: 302 })
    } catch (error) {
      console.error("Unexpected error in auth callback:", error)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent("Authentication failed")}`,
      )
    }
  } else {
    console.error("No code provided in auth callback")
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent("No authentication code provided")}`,
    )
  }
}
