import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/server-auth"

export async function GET() {
  try {
    console.log("Debug: Testing direct access to teams table")
    const serviceClient = createServiceRoleClient()

    // Try to get a count of teams
    const { count, error: countError } = await serviceClient.from("teams").select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Debug: Error counting teams:", countError)
      return NextResponse.json(
        {
          success: false,
          error: countError.message,
          details: {
            code: countError.code,
            hint: countError.hint,
            details: countError.details,
          },
        },
        { status: 500 },
      )
    }

    // Try to get the first team
    const { data: firstTeam, error: teamError } = await serviceClient.from("teams").select("*").limit(1).single()

    if (teamError && teamError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is fine
      console.error("Debug: Error fetching first team:", teamError)
      return NextResponse.json(
        {
          success: false,
          error: teamError.message,
          details: {
            code: teamError.code,
            hint: teamError.hint,
            details: teamError.details,
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        count,
        hasTeams: count > 0,
        firstTeam: firstTeam || null,
        serviceClientInfo: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
          key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set",
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Debug: Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
