import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/utils/supabase/service"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = await createServerClient(cookieStore)

    // Get the current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get the user's team ID
    const serviceClient = createServiceRoleClient()
    const { data, error } = await serviceClient.from("users").select("team_id").eq("id", session.user.id).single()

    if (error) {
      console.error("Error fetching user team:", error)
      return NextResponse.json({ error: "Failed to fetch user team" }, { status: 500 })
    }

    return NextResponse.json({ teamId: data.team_id, userId: session.user.id })
  } catch (error) {
    console.error("Error in team API route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
