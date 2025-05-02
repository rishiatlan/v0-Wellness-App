import { createServerClient as createServerClientSupabase } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// Create a Supabase client for server components (safe for /app directory)
export async function createClient() {
  try {
    // Check if required environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables in server client")
      throw new Error("Application configuration error: Missing Supabase credentials")
    }

    const cookieStore = cookies()

    return createServerClientSupabase<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get: (name) => {
            const cookie = cookieStore.get(name)
            return cookie?.value
          },
          set: (name, value, options) => {
            cookieStore.set(name, value, options)
          },
          remove: (name, options) => {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )
  } catch (error) {
    console.error("Error creating Supabase server client:", error)
    throw error
  }
}

// Also export as createServerClient for compatibility
export const createServerClient = createClient
