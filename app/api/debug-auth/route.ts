import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/utils/supabase/service"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Error getting session",
          error: sessionError.message,
        },
        { status: 500 },
      )
    }

    // If no session, return that info
    if (!sessionData.session) {
      return NextResponse.json({
        status: "no_session",
        message: "No active session found",
      })
    }

    // Get user details
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Error getting user data",
          error: userError.message,
          session: sessionData.session,
        },
        { status: 500 },
      )
    }

    // Check if user exists in the users table
    const serviceClient = createServiceRoleClient()
    const { data: profileData, error: profileError } = await serviceClient
      .from("users")
      .select("*")
      .eq("id", userData.user?.id)
      .maybeSingle()

    return NextResponse.json({
      status: "success",
      session: {
        expires_at: sessionData.session?.expires_at,
        created_at: sessionData.session?.created_at,
      },
      user: {
        id: userData.user?.id,
        email: userData.user?.email,
        created_at: userData.user?.created_at,
      },
      profile: profileData || null,
      profile_error: profileError ? profileError.message : null,
      cookies: {
        count: cookieStore.getAll().length,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "Unexpected error in debug endpoint",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
