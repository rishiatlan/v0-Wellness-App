import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables!")
}

// Create a safe global variable that works in both browser and server
const getGlobalThis = () => {
  if (typeof globalThis !== "undefined") return globalThis
  if (typeof window !== "undefined") return window
  if (typeof global !== "undefined") return global
  if (typeof self !== "undefined") return self
  throw new Error("Unable to locate global object")
}

// Type for our global store
type SupabaseClientSingleton = ReturnType<typeof createClient> | undefined

// Create a key for our global instance
const GLOBAL_SUPABASE_CLIENT_KEY = "__supabase_singleton"

// Get the global object safely
const globalObj = getGlobalThis() as unknown as {
  [GLOBAL_SUPABASE_CLIENT_KEY]?: SupabaseClientSingleton
}

// Create a singleton Supabase client for the entire app
export const supabase = (() => {
  // Check if we already have an instance
  if (globalObj[GLOBAL_SUPABASE_CLIENT_KEY]) {
    return globalObj[GLOBAL_SUPABASE_CLIENT_KEY]!
  }

  // Create a new instance
  console.log("Creating new Supabase client instance")
  const client = createClient<Database>(supabaseUrl || "", supabaseAnonKey || "", {
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

  // Store the instance in our global object
  globalObj[GLOBAL_SUPABASE_CLIENT_KEY] = client
  return client
})()

// Export a function to get the client
export function getSupabaseClient() {
  return supabase
}
