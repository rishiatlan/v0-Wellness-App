import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Make this route public
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Fetch individual leaderboard
    const { data: individuals, error: individualsError } = await supabase
      .from("user_points")
      .select("id, user_id, display_name, points, tier, avatar_url")
      .order("points", { ascending: false })
      .limit(100)

    if (individualsError) {
      console.error("Error fetching individual leaderboard:", individualsError)
      return NextResponse.json({ error: "Failed to fetch individual leaderboard" }, { status: 500 })
    }

    // Fetch team leaderboard
    const { data: teams, error: teamsError } = await supabase
      .from("team_points")
      .select("id, team_name, points, member_count, logo_url")
      .order("points", { ascending: false })
      .limit(20)

    if (teamsError) {
      console.error("Error fetching team leaderboard:", teamsError)
      return NextResponse.json({ error: "Failed to fetch team leaderboard" }, { status: 500 })
    }

    return NextResponse.json({
      individuals: individuals || [],
      teams: teams || [],
    })
  } catch (error) {
    console.error("Error in leaderboard API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
