import { createClient } from "@supabase/supabase-js"

// Check if required environment variables are available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("Missing Supabase environment variables")
  throw new Error("Application configuration error: Missing Supabase credentials")
}

// Create a single instance of the Supabase client to be used throughout the app
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: "spring-wellness-auth-token",
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Export a function to get the client for compatibility with existing code
export const getSupabaseClient = () => supabase
