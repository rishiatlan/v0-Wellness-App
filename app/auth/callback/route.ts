import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { initializeUserProfile } from "@/lib/server-auth"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type") // Get the type parameter (signup, recovery, etc.)
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")
  const access_token = requestUrl.searchParams.get("access_token")
  const refresh_token = requestUrl.searchParams.get("refresh_token")

  // Get the callback URL from the query parameters or use a default
  const callbackUrl = requestUrl.searchParams.get("callbackUrl") || "/daily-tracker"

  console.log("Auth callback received with type:", type || "Not specified")
  console.log("Auth callback received with code:", code ? "Present" : "Missing")
  console.log("Auth callback received with tokens:", access_token ? "Present" : "Missing")
  console.log("Callback URL:", callbackUrl)

  if (error || error_description) {
    console.error("Auth error received:", error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent(error_description || "Authentication failed")}`,
    )
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set: (name, value, options) => {
          try {
            cookieStore.set(name, value, {
              ...options,
              path: "/",
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 days default
            })
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error)
          }
        },
        remove: (name, options) => {
          try {
            cookieStore.set(name, "", {
              ...options,
              path: "/",
              maxAge: 0,
            })
          } catch (error) {
            console.error(`Error removing cookie ${name}:`, error)
          }
        },
      },
    },
  )

  // Handle direct token-based auth (email confirmation or password reset)
  if (access_token && refresh_token) {
    try {
      console.log("Setting session from tokens")
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      })

      if (sessionError) {
        console.error("Error setting session from tokens:", sessionError)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/login?error=${encodeURIComponent(
            sessionError.message || "Authentication failed",
          )}`,
        )
      }

      // If this is a password reset, redirect to the password reset confirmation page
      if (type === "recovery") {
        return NextResponse.redirect(`${requestUrl.origin}/auth/reset-password/confirm`, { status: 302 })
      }

      // For other types (signup, etc.), proceed with normal flow
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
          console.log("User profile initialized for:", user.email)
        } catch (error) {
          console.error("Error in user profile initialization:", error)
        }
      }

      console.log("Auth with tokens completed successfully, redirecting to:", callbackUrl)
      return NextResponse.redirect(requestUrl.origin + callbackUrl, { status: 302 })
    } catch (error) {
      console.error("Unexpected error in token-based auth:", error)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent("Authentication failed")}`,
      )
    }
  }

  // Handle code-based auth (OAuth, magic link)
  if (!code) {
    console.log("Auth callback received with no code parameter - this might be normal in some flows")

    try {
      const { data } = await supabase.auth.getSession()

      // If user already has a session, just redirect them
      if (data.session) {
        console.log("Existing session found, redirecting to:", callbackUrl)
        return NextResponse.redirect(requestUrl.origin + callbackUrl, { status: 302 })
      }
    } catch (error) {
      console.error("Error checking session:", error)
    }

    // Otherwise, redirect to login without an error message
    return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
  }

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
        console.log("User profile initialized for:", user.email)
      } catch (error) {
        console.error("Error in user profile initialization:", error)
      }
    }

    console.log("Auth callback completed successfully, redirecting to:", callbackUrl)

    // URL to redirect to after sign in process completes
    const redirectUrl = requestUrl.origin + callbackUrl
    console.log("Full redirect URL:", redirectUrl)

    // Create a response with the redirect
    return NextResponse.redirect(redirectUrl, { status: 302 })
  } catch (error) {
    console.error("Unexpected error in auth callback:", error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${encodeURIComponent("Authentication failed")}`)
  }
}
