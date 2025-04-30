import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/server-auth"

export async function GET() {
  try {
    const supabase = createServiceRoleClient()

    // Try to fetch teams
    const { data, error } = await supabase.from("teams").select("*").limit(5)

    if (error) {
      console.error("Error fetching teams:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      teams: data,
    })
  } catch (error: any) {
    console.error("Error in debug-teams route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
