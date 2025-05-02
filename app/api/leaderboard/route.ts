import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/utils/supabase/service"

export async function GET() {
  try {
    // Use service role client for reliable access
    const serviceClient = createServiceRoleClient()

    if (!serviceClient) {
      console.error("Failed to create service client")
      return NextResponse.json({ error: "Failed to create service client" }, { status: 500 })
    }

    // Fetch top users with error handling
    const { data: users, error } = await serviceClient
      .from("users")
      .select("id, full_name, avatar_url, total_points, team_id")
      .order("total_points", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching leaderboard:", error)
      return NextResponse.json({ error: "Failed to fetch leaderboard", details: error.message }, { status: 500 })
    }

    // Add cache headers for performance
    return NextResponse.json(
      { users },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      },
    )
  } catch (error) {
    console.error("Exception in leaderboard API route:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard", details: error.message }, { status: 500 })
  }
}
