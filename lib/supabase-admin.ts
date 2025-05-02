import { createClient as supabaseCreateClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key for admin operations
export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return supabaseCreateClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Create a singleton instance for reuse
let adminClientInstance: SupabaseClient | null = null

export function getAdminClient(): SupabaseClient {
  if (!adminClientInstance) {
    adminClientInstance = createClient()
  }
  return adminClientInstance
}
