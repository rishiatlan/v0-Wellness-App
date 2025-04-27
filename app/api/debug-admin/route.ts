import { createServiceRoleClient } from "@/lib/server-auth"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { INITIAL_ADMIN_EMAILS } from "@/lib/admin-utils"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = session.user
    if (!user || !user.email) {
      return NextResponse.json({ error: "No user email found" }, { status: 400 })
    }

    // Check if user is in INITIAL_ADMIN_EMAILS
    const isInInitialList = INITIAL_ADMIN_EMAILS.some(
      (adminEmail) => adminEmail.toLowerCase() === user.email?.toLowerCase(),
    )

    // Use service role client to check admin_users table
    const serviceClient = createServiceRoleClient()

    // Try direct SQL query
    const { data: sqlResult, error: sqlError } = await serviceClient.rpc("execute_sql", {
      sql_query: `SELECT * FROM admin_users WHERE LOWER(email) = LOWER('${user.email}')`,
    })

    // Try is_admin function if available
    let isAdminFunctionResult = null
    let isAdminFunctionError = null
    try {
      const { data, error } = await serviceClient.rpc("is_admin", {
        user_email: user.email,
      })
      isAdminFunctionResult = data
      isAdminFunctionError = error
    } catch (e) {
      isAdminFunctionError = e
    }

    // Direct query with case-insensitive comparison
    const { data, error } = await serviceClient.from("admin_users").select("*").ilike("email", user.email).maybeSingle()

    return NextResponse.json({
      email: user.email,
      isInInitialList,
      sqlQuery: {
        result: sqlResult,
        error: sqlError,
      },
      isAdminFunction: {
        result: isAdminFunctionResult,
        error: isAdminFunctionError,
      },
      directQuery: {
        result: data,
        error,
      },
    })
  } catch (error: any) {
    console.error("Error in debug-admin API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
