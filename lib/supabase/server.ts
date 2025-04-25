import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import type { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// Create a Supabase client for server components (safe for /app directory)
export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  try {
    // Check if required environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables in server client")
      throw new Error("Application configuration error: Missing Supabase credentials")
    }

    return createSupabaseServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
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
