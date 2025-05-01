import { type NextRequest, NextResponse } from "next/server"
import { checkApiAuth } from "@/lib/api-auth-check"

export async function GET(req: NextRequest) {
  // Check authentication - much more efficient than middleware
  const auth = await checkApiAuth(req)
  if (auth === null) {
    // Public route, continue
  } else if ("error" in auth) {
    // Auth check returned an error response
    return auth
  }

  // Auth check passed, we have session and supabase client
  const { session, supabase } = auth

  try {
    const { data, error } = await supabase.from("teams").select("*")

    if (error) throw error

    return NextResponse.json({ teams: data })
  } catch (error: any) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Failed to fetch teams", details: error.message }, { status: 500 })
  }
}
