import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()

    // Create a server client
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

    // Check if we have a session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json(
        {
          success: false,
          error: sessionError.message,
          stage: "getSession",
        },
        { status: 500 },
      )
    }

    // If we have a session, get the user
    if (sessionData.session) {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        return NextResponse.json(
          {
            success: false,
            error: userError.message,
            stage: "getUser",
            session: sessionData.session ? "exists" : "missing",
          },
          { status: 500 },
        )
      }

      // Try to get the user profile from the database
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userData.user.id)
          .single()

        if (profileError) {
          return NextResponse.json(
            {
              success: false,
              error: profileError.message,
              stage: "getUserProfile",
              user: userData.user
                ? {
                    id: userData.user.id,
                    email: userData.user.email,
                    created_at: userData.user.created_at,
                  }
                : null,
              session: "exists",
            },
            { status: 500 },
          )
        }

        // Success - we have a session, user, and profile
        return NextResponse.json({
          success: true,
          user: {
            id: userData.user.id,
            email: userData.user.email,
            created_at: userData.user.created_at,
          },
          profile: profileData,
          session: {
            expires_at: sessionData.session.expires_at,
            created_at: sessionData.session.created_at,
          },
        })
      } catch (error: any) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            stage: "profileQuery",
            user: userData.user
              ? {
                  id: userData.user.id,
                  email: userData.user.email,
                  created_at: userData.user.created_at,
                }
              : null,
            session: "exists",
          },
          { status: 500 },
        )
      }
    }

    // No session
    return NextResponse.json(
      {
        success: false,
        error: "No active session",
        stage: "checkSession",
        session: "missing",
      },
      { status: 401 },
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stage: "exception",
      },
      { status: 500 },
    )
  }
}
