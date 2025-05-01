import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => cookieStore.set({ name, value, ...options }),
          remove: (name, options) => cookieStore.set({ name, value: "", ...options, maxAge: 0 }),
        },
      },
    )

    // Get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    // Get user if session exists
    let userData = null
    let userError = null

    if (sessionData?.session) {
      const userResult = await supabase.auth.getUser()
      userData = userResult.data
      userError = userResult.error
    }

    // Get cookies for debugging
    const authCookies = {}
    for (const cookie of cookieStore.getAll()) {
      if (cookie.name.includes("supabase") || cookie.name.includes("auth")) {
        authCookies[cookie.name] = `${cookie.value.substring(0, 10)}... (expires: ${cookie.expires || "session"})`
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session: {
        exists: !!sessionData?.session,
        expiresAt: sessionData?.session?.expires_at
          ? new Date(sessionData.session.expires_at * 1000).toISOString()
          : null,
        error: sessionError?.message || null,
      },
      user: {
        exists: !!userData?.user,
        email: userData?.user?.email || null,
        error: userError?.message || null,
      },
      cookies: authCookies,
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing",
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing",
      },
    })
  } catch (error) {
    console.error("Error in debug-auth-status route:", error)
    return NextResponse.json({ error: "Failed to get auth status" }, { status: 500 })
  }
}
