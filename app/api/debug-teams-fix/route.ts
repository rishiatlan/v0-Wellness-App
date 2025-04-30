import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/server-auth"

export async function GET() {
  try {
    const supabase = createServiceRoleClient()

    // Check if teams exist
    const { data: existingTeams, error: checkError } = await supabase.from("teams").select("*")

    if (checkError) {
      console.error("Error checking teams:", checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    // If no teams exist, create sample teams
    if (!existingTeams || existingTeams.length === 0) {
      console.log("No teams found, creating sample teams...")

      // Create sample teams
      const sampleTeams = [
        { name: "Wellness Warriors", total_points: 250 },
        { name: "Fitness Fanatics", total_points: 320 },
        { name: "Health Heroes", total_points: 180 },
        { name: "Mindful Movers", total_points: 210 },
        { name: "Vitality Crew", total_points: 290 },
      ]

      const { data: createdTeams, error: createError } = await supabase.from("teams").insert(sampleTeams).select()

      if (createError) {
        console.error("Error creating sample teams:", createError)
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      return NextResponse.json({
        message: "Created sample teams",
        teams: createdTeams,
      })
    }

    // Teams exist, return them
    return NextResponse.json({
      message: "Teams already exist",
      count: existingTeams.length,
      teams: existingTeams,
    })
  } catch (error: any) {
    console.error("Error in debug-teams-fix:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
