import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  // Get all cookies for debugging
  const allCookies = cookieStore.getAll()
  const cookieNames = allCookies.map((c) => c.name)

  // Check for auth cookie
  const authCookie = cookieStore.get("sb-auth-token")

  // Create a temporary Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  // Try to get session from cookie
  let sessionData = null
  let sessionError = null

  try {
    const { data, error } = await supabase.auth.getSession()
    sessionData = data
    sessionError = error
  } catch (err) {
    sessionError = err
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    cookieExists: !!authCookie,
    cookieNames,
    sessionExists: !!sessionData?.session,
    sessionError: sessionError ? String(sessionError) : null,
    userExists: !!sessionData?.session?.user,
    expiresAt: sessionData?.session?.expires_at ? new Date(sessionData.session.expires_at * 1000).toISOString() : null,
  })
}
