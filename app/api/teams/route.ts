import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/utils/supabase/service"

export async function GET() {
  try {
    const serviceClient = createServiceRoleClient()
    console.log("API: Fetching teams with service role client")

    // First, get all teams
    const { data: teams, error: teamsError } = await serviceClient
      .from("teams")
      .select("id, name, total_points, banner_url")
      .order("total_points", { ascending: false })

    // Handle errors explicitly
    if (teamsError) {
      console.error("API: Error fetching teams:", teamsError)
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
    }

    // If no teams found, return empty array
    if (!teams || teams.length === 0) {
      console.log("API: No teams found")
      return NextResponse.json({ teams: [] })
    }

    console.log(`API: Found ${teams.length} teams, now fetching members`)

    // Process each team to get its members
    const teamsWithMembers = []

    for (const team of teams) {
      try {
        // Get members for this team
        const { data: members, error: membersError } = await serviceClient
          .from("users")
          .select("id, full_name, email, total_points, avatar_url")
          .eq("team_id", team.id)

        // Add team with its members to the result array
        teamsWithMembers.push({
          ...team,
          members: membersError ? [] : members || [],
          memberCount: membersError ? 0 : members?.length || 0,
        })
      } catch (memberError) {
        console.error(`API: Error processing members for team ${team.id}:`, memberError)
        // Still add the team, but without members
        teamsWithMembers.push({
          ...team,
          members: [],
          memberCount: 0,
        })
      }
    }

    console.log(`API: Successfully processed ${teamsWithMembers.length} teams with their members`)
    return NextResponse.json({ teams: teamsWithMembers })
  } catch (error) {
    console.error("API: Error in teams route:", error)
    return NextResponse.json({ error: "An error occurred while fetching teams" }, { status: 500 })
  }
}
