import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables!")
}

// Create a singleton Supabase client for the entire app
const createSingletonClient = () => {
  return createClient<Database>(supabaseUrl || "", supabaseAnonKey || "", {
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
}

// Export as a singleton to prevent multiple instances
export const supabase = createSingletonClient()

// Initialize and test connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error("Error getting initial session:", error)
  } else if (data.session) {
    console.log("Initial session exists, expires at:", new Date(data.session.expires_at! * 1000).toLocaleString())
  } else {
    console.log("No initial session found")
  }
})

// Export a function to get a fresh client if needed
export function getSupabaseClient() {
  return supabase
}
