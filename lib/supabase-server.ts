import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cache } from "react"

// Create a cached server client to prevent multiple instances during SSR
export const createServerSupabaseClient = cache(() => {
  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get: (name) => {
        const cookie = cookieStore.get(name)
        return cookie?.value
      },
      set: (name, value, options) => {
        try {
          cookieStore.set(name, value, {
            ...options,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 days default
            httpOnly: true, // Added for better security
          })
        } catch (error) {
          console.error(`Error setting cookie ${name}:`, error)
        }
      },
      remove: (name, options) => {
        try {
          cookieStore.set(name, "", {
            ...options,
            path: "/",
            maxAge: 0,
          })
        } catch (error) {
          console.error(`Error removing cookie ${name}:`, error)
        }
      },
    },
    // Add connection pooling options for better performance
    db: {
      schema: "public",
    },
    global: {
      fetch: fetch,
    },
    auth: {
      persistSession: true,
      detectSessionInUrl: false,
      autoRefreshToken: true,
    },
  })
})

// Add a helper function to execute queries with retry logic
export async function executeWithRetry(queryFn, maxRetries = 3) {
  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn()
    } catch (error) {
      console.error(`Query failed (attempt ${attempt}/${maxRetries}):`, error)
      lastError = error

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 100
        await new Promise((resolve) => setTimeout(resolve, delay))
      } else {
        throw lastError
      }
    }
  }
}
