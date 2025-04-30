import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/server-auth"

export async function GET() {
  try {
    // Use the service role client for direct database access
    const supabase = createServiceRoleClient()

    // Get all teams
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, total_points, banner_url, creator_id")

    if (teamsError) {
      console.error("API: Error fetching teams:", teamsError)
      return NextResponse.json({ error: teamsError.message }, { status: 500 })
    }

    if (!teams || teams.length === 0) {
      return NextResponse.json({ teams: [] }, { status: 200 })
    }

    // For each team, get its members
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        try {
          const { data: members, error: membersError } = await supabase
            .from("users")
            .select("id, full_name, email, total_points, avatar_url")
            .eq("team_id", team.id)

          return {
            ...team,
            members: membersError ? [] : members || [],
            memberCount: membersError ? 0 : members?.length || 0,
          }
        } catch (error) {
          console.error(`API: Error fetching members for team ${team.id}:`, error)
          return {
            ...team,
            members: [],
            memberCount: 0,
          }
        }
      }),
    )

    return NextResponse.json({ teams: teamsWithMembers }, { status: 200 })
  } catch (error: any) {
    console.error("API: Error in teams route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
