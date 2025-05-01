import { createServerClient as createSupabaseServerClient, type CookieOptions } from "@supabase/ssr"
import type { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

const createServerClient = (cookieStore: ReturnType<typeof cookies>) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (e) {
          console.error("Failed to set cookie", e)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 })
        } catch (e) {
          console.error("Failed to remove cookie", e)
        }
      },
    },
    auth: {
      persistSession: true,
      storageKey: "spring-wellness-auth-token",
    },
  })
}

// Export both createServerClient and createClient (as an alias) for compatibility
export { createServerClient }
export const createClient = createServerClient
