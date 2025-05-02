import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { APP_VERSION, SUPABASE_URL, SUPABASE_ANON_KEY, NODE_ENV } from "@/lib/env-vars"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const startTime = Date.now()
  const healthStatus = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: "unknown",
    databaseLatency: null,
    environment: NODE_ENV,
    version: APP_VERSION,
  }

  // Check database connection
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Missing Supabase credentials")
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Simple query to check database connection
    const dbStartTime = Date.now()
    const { data, error } = await supabase.from("users").select("count").limit(1)

    if (error) {
      throw error
    }

    healthStatus.database = "ok"
    healthStatus.databaseLatency = Date.now() - dbStartTime
  } catch (error) {
    console.error("Health check database error:", error)
    healthStatus.database = "error"
    healthStatus.status = "degraded"
  }

  // Calculate total response time
  const responseTime = Date.now() - startTime
  healthStatus.responseTime = responseTime

  return NextResponse.json(healthStatus, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  })
}
