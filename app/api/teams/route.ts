import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/server-auth"

export async function GET() {
  try {
    console.log("API: Fetching teams with service role client")
    const serviceClient = createServiceRoleClient()

    // Get teams with total points - same approach as leaderboard
    const { data: teams, error: teamsError } = await serviceClient
      .from("teams")
      .select("id, name, total_points, banner_url, creator_id")
      .order("total_points", { ascending: false })

    if (teamsError) {
      console.error("API: Error fetching teams:", teamsError)
      return NextResponse.json({ error: teamsError.message }, { status: 500 })
    }

    console.log(`API: Found ${teams?.length || 0} teams, now fetching members for each`)

    // For each team, get the members - similar to getTeamLeaderboard
    const teamsWithMembers = await Promise.all(
      (teams || []).map(async (team) => {
        try {
          // Get member count
          const { count, error: countError } = await serviceClient
            .from("users")
            .select("id", { count: "exact" })
            .eq("team_id", team.id)

          if (countError) {
            console.error(`API: Error getting member count for team ${team.id}:`, countError)
            return { ...team, members: [], memberCount: 0 }
          }

          // Get all team members
          const { data: members, error: membersError } = await serviceClient
            .from("users")
            .select("id, full_name, email, total_points, avatar_url")
            .eq("team_id", team.id)

          if (membersError) {
            console.error(`API: Error getting members for team ${team.id}:`, membersError)
            return { ...team, members: [], memberCount: count || 0 }
          }

          return {
            ...team,
            members: members || [],
            memberCount: count || 0,
          }
        } catch (error) {
          console.error(`API: Error processing team ${team.id}:`, error)
          return { ...team, members: [], memberCount: 0 }
        }
      }),
    )

    console.log(`API: Successfully processed ${teamsWithMembers.length} teams with their members`)
    return NextResponse.json({ teams: teamsWithMembers }, { status: 200 })
  } catch (error: any) {
    console.error("API: Error in teams route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
