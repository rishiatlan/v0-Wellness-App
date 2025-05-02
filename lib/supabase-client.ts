import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables!")
}

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null

// Create a singleton Supabase client for the entire app
export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance

  // Only create a new instance if one doesn't exist
  supabaseInstance = createClient<Database>(supabaseUrl || "", supabaseAnonKey || "", {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "supabase-auth-token",
      flowType: "pkce",
      debug: process.env.NODE_ENV !== "production",
      cookieOptions: {
        name: "sb-auth-token",
        lifetime: 60 * 60 * 24 * 7, // 7 days
        domain: "",
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
  })

  return supabaseInstance
})()

// Export a function to get a fresh client if needed
export function getSupabaseClient() {
  return supabase
}
