import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { APP_VERSION, SUPABASE_URL, SUPABASE_ANON_KEY, NODE_ENV } from "@/lib/env-vars"

// Cache health check results to reduce database load
let healthCache: {
  timestamp: number
  data: any
} | null = null

const CACHE_TTL = 60 * 1000 // 1 minute cache for health checks

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const startTime = Date.now()

  // Check if we have a valid cached response
  if (healthCache && startTime - healthCache.timestamp < CACHE_TTL) {
    // Update response time in cached data
    const cachedResponse = {
      ...healthCache.data,
      responseTime: Date.now() - startTime,
      fromCache: true,
    }

    return NextResponse.json(cachedResponse, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  }

  const healthStatus = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: "unknown",
    databaseLatency: null,
    environment: NODE_ENV,
    version: APP_VERSION,
    fromCache: false,
  }

  // Check database connection
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Missing Supabase credentials")
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Simple query to check database connection
    const dbStartTime = Date.now()
    const { data, error } = await supabase.from("users").select("count", { count: "exact", head: true }).limit(1)

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

  // Cache the result
  healthCache = {
    timestamp: Date.now(),
    data: healthStatus,
  }

  return NextResponse.json(healthStatus, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  })
}
