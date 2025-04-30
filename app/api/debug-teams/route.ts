import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/server-auth"

export async function GET() {
  try {
    const supabase = createServiceRoleClient()

    // Get all teams
    const { data: teams, error: teamsError } = await supabase.from("teams").select("*").order("name")

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
    }

    // For each team, get the members
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const { data: members, error: membersError } = await supabase
          .from("users")
          .select("id, full_name, email, total_points, avatar_url")
          .eq("team_id", team.id)

        if (membersError) {
          console.error(`Error fetching members for team ${team.id}:`, membersError)
          return {
            ...team,
            members: [],
            memberCount: 0,
            error: membersError.message,
          }
        }

        return {
          ...team,
          members: members || [],
          memberCount: members?.length || 0,
        }
      }),
    )

    return NextResponse.json({
      teams: teamsWithMembers,
      count: teamsWithMembers.length,
    })
  } catch (error) {
    console.error("Error in debug-teams API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
