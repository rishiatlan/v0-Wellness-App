import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check if activities already exist
    const { data: existingActivities } = await supabase.from("activities").select("*")

    if (existingActivities && existingActivities.length > 0) {
      return NextResponse.json({ message: "Activities already seeded", count: existingActivities.length })
    }

    // Define the wellness activities with correct descriptions
    const activities = [
      {
        name: "Mindfulness",
        emoji: "🧘",
        points: 5,
        description: "10 min meditation/yoga/deep breathing",
      },
      {
        name: "Hydration",
        emoji: "💧",
        points: 5,
        description: "80oz water",
      },
      {
        name: "Movement",
        emoji: "👣",
        points: 5,
        description: "7,000 steps",
      },
      {
        name: "Sleep",
        emoji: "😴",
        points: 5,
        description: "7+ hours",
      },
      {
        name: "Sunshine",
        emoji: "☀️",
        points: 5,
        description: "15 min outdoors",
      },
      {
        name: "Exercise",
        emoji: "💪",
        points: 5,
        description: "20 min workout",
      },
    ]

    // Insert activities into the database
    const { data, error } = await supabase.from("activities").insert(activities).select()

    if (error) {
      throw error
    }

    return NextResponse.json({ message: "Activities seeded successfully", data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
