import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/server-auth"

export async function GET() {
  try {
    const supabase = createServiceRoleClient()
    console.log("Debug API: Fetching teams with service role client")

    // Get all teams
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, total_points, banner_url, creator_id")
      .order("total_points", { ascending: false })

    if (teamsError) {
      console.error("Debug API: Error fetching teams:", teamsError)
      return NextResponse.json({ error: teamsError.message }, { status: 500 })
    }

    if (!teams || teams.length === 0) {
      console.log("Debug API: No teams found in database")
      return NextResponse.json({ message: "No teams found in database" }, { status: 404 })
    }

    console.log(`Debug API: Found ${teams.length} teams, fetching members for each team`)

    // For each team, get the members
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const { data: members, error: membersError } = await supabase
          .from("users")
          .select("id, full_name, email, total_points, avatar_url")
          .eq("team_id", team.id)

        if (membersError) {
          console.error(`Debug API: Error fetching members for team ${team.id}:`, membersError)
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
      success: true,
      count: teamsWithMembers.length,
      teams: teamsWithMembers,
    })
  } catch (error: any) {
    console.error("Debug API: Error in debug-teams route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
