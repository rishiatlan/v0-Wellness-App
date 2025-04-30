import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/utils/supabase/service"

export async function GET() {
  try {
    const serviceClient = createServiceRoleClient()

    // Get the table structure
    const { data: columns, error: columnsError } = await serviceClient.rpc("get_table_columns", {
      table_name: "teams",
    })

    if (columnsError) {
      console.error("Error fetching table structure:", columnsError)

      // Try a simpler approach - just get a sample team
      const { data: sampleTeam, error: sampleError } = await serviceClient.from("teams").select("*").limit(1).single()

      if (sampleError) {
        return NextResponse.json(
          {
            error: "Failed to fetch table structure and sample",
            details: sampleError,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        message: "Could not get columns but retrieved sample team",
        sampleTeam,
        columns: Object.keys(sampleTeam),
      })
    }

    // Get a sample team
    const { data: sampleTeam, error: sampleError } = await serviceClient.from("teams").select("*").limit(1).single()

    return NextResponse.json({
      columns,
      sampleTeam: sampleError ? null : sampleTeam,
      sampleError: sampleError ? sampleError.message : null,
    })
  } catch (error: any) {
    console.error("Error in debug-teams-structure:", error)
    return NextResponse.json(
      {
        error: "An error occurred",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
