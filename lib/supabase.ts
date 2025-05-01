import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only log errors in production
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables!")
}

// Create a single supabase client for the entire app
export const supabase = createClient<Database>(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "supabase.auth.token",
    flowType: "pkce",
  },
})

// Log initial session state for debugging
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error("Error getting initial session:", error)
  } else if (data.session) {
    console.log("Initial session exists, expires at:", new Date(data.session.expires_at! * 1000).toLocaleString())
  } else {
    console.log("No initial session found")
  }
})
