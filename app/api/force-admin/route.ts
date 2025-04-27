import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/server-auth"
import { INITIAL_ADMIN_EMAILS } from "@/lib/admin-utils"

// This endpoint will force add all initial admins to the admin_users table
export async function GET() {
  try {
    const serviceClient = createServiceRoleClient()

    // Create the admin_users table if it doesn't exist
    await serviceClient.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS admin_users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT NOT NULL UNIQUE,
          user_id UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    // Insert all initial admins
    const results = []

    for (const email of INITIAL_ADMIN_EMAILS) {
      // Find user ID if possible
      const { data: userData } = await serviceClient.from("users").select("id").ilike("email", email).maybeSingle()

      // Insert admin (upsert to avoid duplicates)
      const { data, error } = await serviceClient
        .from("admin_users")
        .upsert({
          email: email.toLowerCase(),
          user_id: userData?.id || null,
        })
        .select()

      results.push({
        email,
        success: !error,
        error: error?.message,
        data,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Force admin setup complete",
      results,
    })
  } catch (error: any) {
    console.error("Force admin setup error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
