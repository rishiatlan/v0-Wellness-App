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
  })
})
