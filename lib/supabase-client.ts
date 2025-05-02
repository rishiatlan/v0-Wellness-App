import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a safe global variable that works in both browser and server
const getGlobalThis = () => {
  if (typeof globalThis !== "undefined") return globalThis
  if (typeof window !== "undefined") return window
  if (typeof global !== "undefined") return global
  if (typeof self !== "undefined") return self
  throw new Error("Unable to locate global object")
}

// Unique key for storing the Supabase client instance
const GLOBAL_SUPABASE_CLIENT_KEY = "__SPRING_WELLNESS_SUPABASE_CLIENT"

// Type for our singleton
type SupabaseClientSingleton = ReturnType<typeof createClient<Database>>

// Get the global object safely
const globalObj = getGlobalThis() as unknown as {
  [GLOBAL_SUPABASE_CLIENT_KEY]?: SupabaseClientSingleton
}

// Create a singleton Supabase client for the entire app
export const supabase = (() => {
  // Return existing instance if available
  if (globalObj[GLOBAL_SUPABASE_CLIENT_KEY]) {
    return globalObj[GLOBAL_SUPABASE_CLIENT_KEY] as SupabaseClientSingleton
  }

  // Create new instance if one doesn't exist
  const client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        storageKey: "sb-spring-wellness-auth-token",
      },
    },
  )

  // Store the client in our global object
  globalObj[GLOBAL_SUPABASE_CLIENT_KEY] = client

  return client
})()

// Export a type for the Supabase client
export type SupabaseClient = typeof supabase
