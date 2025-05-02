import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a Supabase client with the service role key for admin operations
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase service role credentials")
    throw new Error("Server configuration error: Missing Supabase service role credentials")
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-application-name": "spring-wellness-app",
      },
    },
    // Add retries for better reliability
    retryConfig: {
      maxRetryAttempts: 3,
      retryIntervalMs: 500,
      exponentialBackoff: true,
    },
  })
}

// Create a singleton instance for better performance
let serviceClientInstance = null

export function getServiceClient() {
  if (!serviceClientInstance) {
    serviceClientInstance = createServiceRoleClient()
  }
  return serviceClientInstance
}

// Function to check database connection health
export async function checkDatabaseHealth() {
  try {
    const client = getServiceClient()
    const startTime = Date.now()

    // Simple query to check connection
    const { data, error } = await client.from("app_settings").select("id").limit(1)

    const endTime = Date.now()
    const latency = endTime - startTime

    if (error) {
      return {
        healthy: false,
        latency,
        error: error.message,
      }
    }

    return {
      healthy: true,
      latency,
    }
  } catch (error) {
    return {
      healthy: false,
      latency: -1,
      error: error.message,
    }
  }
}
