import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables!")
}

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

// Create a singleton Supabase client for the entire app
const createSingletonClient = () => {
  if (supabaseInstance) return supabaseInstance

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
        httpOnly: true, // Added httpOnly flag for better security
      },
    },
  })

  return supabaseInstance
}

// Export as a singleton to prevent multiple instances
export const supabase = createSingletonClient()

// Initialize and test connection with retry logic
if (typeof window !== "undefined") {
  // Only run in browser environment
  let sessionInitAttempts = 0

  const initSession = () => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Error getting initial session:", error)
        if (sessionInitAttempts < 3) {
          sessionInitAttempts++
          console.log(`Retrying session fetch (attempt ${sessionInitAttempts})...`)
          setTimeout(initSession, 1000) // Retry after 1 second
        }
      } else if (data.session) {
        console.log("Initial session exists, expires at:", new Date(data.session.expires_at! * 1000).toLocaleString())
      } else {
        console.log("No initial session found")
        if (sessionInitAttempts < 3) {
          sessionInitAttempts++
          console.log(`Retrying session fetch (attempt ${sessionInitAttempts})...`)
          setTimeout(initSession, 1000) // Retry after 1 second
        }
      }
    })
  }

  initSession()

  // Add auth state change listener for debugging
  supabase.auth.onAuthStateChange((event, session) => {
    console.log(`Auth state changed: ${event}`, session ? "Session exists" : "No session")

    // Retry session fetch if initial attempt failed
    if (event === "INITIAL_SESSION" && !session) {
      setTimeout(() => {
        console.log("Retrying session fetch after INITIAL_SESSION event...")
        supabase.auth.getSession()
      }, 500)
    }
  })
}

// Export a function to get a fresh client if needed
export function getSupabaseClient() {
  return supabase
}
