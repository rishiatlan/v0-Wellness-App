import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const flow = url.searchParams.get("flow") || "all"

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
        set: () => {}, // No-op for this read-only endpoint
        remove: () => {}, // No-op for this read-only endpoint
      },
    },
  )

  try {
    // Get the current configuration
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://v0-spring-wellness-app.vercel.app"

    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      siteUrl,
    }

    // Check email confirmation flow
    if (flow === "all" || flow === "signup") {
      results.signup = {
        redirectUrl: `${siteUrl}/auth/callback`,
        expectedFlow:
          "User clicks confirmation link → /auth/callback → exchangeCodeForSession → redirect to /daily-tracker",
      }
    }

    // Check password reset flow
    if (flow === "all" || flow === "reset") {
      results.passwordReset = {
        redirectUrl: `${siteUrl}/auth/reset-password/confirm`,
        expectedFlow:
          "User clicks reset link → /auth/callback → token processing → /auth/reset-password/confirm → updateUser",
      }
    }

    // Check current session if available
    if (flow === "all" || flow === "session") {
      const { data, error } = await supabase.auth.getSession()

      results.session = {
        exists: !!data.session,
        error: error?.message || null,
      }

      if (data.session) {
        results.session.expiresAt = new Date(data.session.expires_at! * 1000).toISOString()
        results.session.user = {
          id: data.session.user.id,
          email: data.session.user.email,
          emailConfirmed: data.session.user.email_confirmed_at !== null,
        }
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred during auth flow debugging" },
      { status: 500 },
    )
  }
}
