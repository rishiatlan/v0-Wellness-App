import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createServiceRoleClient } from "@/lib/server-auth"
import { INITIAL_ADMIN_EMAILS } from "@/lib/admin-utils"

// This endpoint will help us debug admin authorization issues
export async function GET(request: Request) {
  try {
    // Get the current user from the session
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json({ error: "Session error", details: sessionError.message }, { status: 500 })
    }

    if (!session || !session.user) {
      return NextResponse.json({ error: "No authenticated user" }, { status: 401 })
    }

    const user = session.user
    const email = user.email

    if (!email) {
      return NextResponse.json({ error: "User has no email" }, { status: 400 })
    }

    // Check if user is in INITIAL_ADMIN_EMAILS
    const isInitialAdmin = INITIAL_ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === email.toLowerCase())

    // Check if user is in admin_users table
    const serviceClient = createServiceRoleClient()

    // First try with exact match
    const { data: exactMatchAdmin, error: exactMatchError } = await serviceClient
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .maybeSingle()

    // Then try with case-insensitive match
    const { data: caseInsensitiveAdmin, error: caseInsensitiveError } = await serviceClient
      .from("admin_users")
      .select("*")
      .ilike("email", email)
      .maybeSingle()

    // Direct SQL query to check admin status
    const { data: sqlQueryResult, error: sqlQueryError } = await serviceClient.rpc("execute_sql", {
      sql_query: `SELECT * FROM admin_users WHERE LOWER(email) = LOWER('${email}')`,
    })

    // Check if admin_users table exists and has data
    const { data: tableInfo, error: tableInfoError } = await serviceClient.rpc("execute_sql", {
      sql_query: `SELECT COUNT(*) FROM admin_users`,
    })

    // Try to run the is_admin function
    const { data: isAdminResult, error: isAdminError } = await serviceClient.rpc("is_admin", {
      user_email: email,
    })

    // Return all debug information
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_confirmed_at ? true : false,
      },
      initialAdminCheck: {
        isInitialAdmin,
        initialAdmins: INITIAL_ADMIN_EMAILS,
      },
      adminTableChecks: {
        exactMatch: {
          found: !!exactMatchAdmin,
          data: exactMatchAdmin,
          error: exactMatchError ? exactMatchError.message : null,
        },
        caseInsensitive: {
          found: !!caseInsensitiveAdmin,
          data: caseInsensitiveAdmin,
          error: caseInsensitiveError ? caseInsensitiveError.message : null,
        },
        sqlQuery: {
          result: sqlQueryResult,
          error: sqlQueryError ? sqlQueryError.message : null,
        },
        tableInfo: {
          result: tableInfo,
          error: tableInfoError ? tableInfoError.message : null,
        },
        isAdminFunction: {
          result: isAdminResult,
          error: isAdminError ? isAdminError.message : null,
        },
      },
      serviceRoleClientInfo: {
        urlConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        keyConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    })
  } catch (error: any) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json({ error: "Debug endpoint error", details: error.message }, { status: 500 })
  }
}
