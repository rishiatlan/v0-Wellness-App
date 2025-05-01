import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/server-auth"
import { ensureRLSPolicies } from "@/app/actions/setup-rls-action"

export async function GET() {
  try {
    const serviceClient = createServiceRoleClient()
    const results = {
      timestamp: new Date().toISOString(),
      rls: null,
      tables: {},
      errors: [],
    }

    // Check if tables exist
    const tables = ["users", "daily_logs", "activities", "teams", "team_members"]
    for (const table of tables) {
      try {
        const { count, error } = await serviceClient.from(table).select("*", { count: "exact", head: true })

        results.tables[table] = {
          exists: !error,
          count: count,
          error: error ? error.message : null,
        }

        if (error) {
          results.errors.push(`Table ${table} check failed: ${error.message}`)
        }
      } catch (error: any) {
        results.tables[table] = {
          exists: false,
          count: 0,
          error: error.message,
        }
        results.errors.push(`Table ${table} check exception: ${error.message}`)
      }
    }

    // Ensure RLS policies are set up
    try {
      const rlsResult = await ensureRLSPolicies()
      results.rls = rlsResult
    } catch (error: any) {
      results.errors.push(`RLS setup failed: ${error.message}`)
      results.rls = { success: false, error: error.message }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error("Error in ensure-db-setup route:", error)
    return NextResponse.json({ error: "Failed to check database setup", message: error.message }, { status: 500 })
  }
}
