import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/utils/supabase/service"

export async function GET() {
  try {
    console.log("Teams API route called")

    // Use service role client for reliable access
    const serviceClient = createServiceRoleClient()

    if (!serviceClient) {
      console.error("Failed to create service client")
      return NextResponse.json({ error: "Failed to create service client" }, { status: 500 })
    }

    // Fetch teams with error handling
    const { data: teams, error } = await serviceClient
      .from("teams")
      .select("*")
      .order("total_points", { ascending: false })

    if (error) {
      console.error("Error fetching teams:", error)
      return NextResponse.json({ error: "Failed to fetch teams", details: error.message }, { status: 500 })
    }

    // Process teams to include member count
    const teamsWithMembers = []

    for (const team of teams || []) {
      try {
        // Get members for this team
        const { data: members, error: membersError } = await serviceClient
          .from("users")
          .select("id")
          .eq("team_id", team.id)

        if (membersError) {
          console.error(`Error fetching members for team ${team.id}:`, membersError)
        }

        teamsWithMembers.push({
          ...team,
          memberCount: members?.length || 0,
        })
      } catch (error) {
        console.error(`Error processing team ${team.id}:`, error)
        teamsWithMembers.push({
          ...team,
          memberCount: 0,
        })
      }
    }

    console.log(`Successfully fetched ${teamsWithMembers.length} teams`)
    return NextResponse.json({ teams: teamsWithMembers })
  } catch (error) {
    console.error("Exception in teams API route:", error)
    return NextResponse.json({ error: "Failed to fetch teams", details: error.message }, { status: 500 })
  }
}
