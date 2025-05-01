"use client"

import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

// Create a client-side Supabase client (safe for /pages directory)
export const createBrowserClient = () => {
  try {
    // Check if required environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables in browser client")
      throw new Error("Application configuration error: Missing Supabase credentials")
    }

    return createSupabaseBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          name: "spring-wellness-auth",
        },
        auth: {
          persistSession: true,
          storageKey: "spring-wellness-auth-token",
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    )
  } catch (error) {
    console.error("Error creating Supabase browser client:", error)
    throw error
  }
}

// Singleton pattern to avoid multiple instances
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export const getBrowserClient = () => {
  if (!browserClient) {
    try {
      browserClient = createBrowserClient()
    } catch (error) {
      console.error("Error getting browser client:", error)
      throw error
    }
  }
  return browserClient
}

// Test the connection to make sure it's working
export const testSupabaseConnection = async () => {
  try {
    const supabase = getBrowserClient()
    const { data, error } = await supabase.from("activities").select("count").limit(1)

    if (error) {
      console.error("Supabase connection test failed:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Supabase connection test exception:", error)
    return { success: false, error: error.message }
  }
}
