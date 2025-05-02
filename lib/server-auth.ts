"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Create a Supabase client for server-side use
export async function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => cookieStore.set(name, value, options),
      remove: (name, options) => cookieStore.set(name, "", { ...options, maxAge: 0 }),
    },
  })
}

// Create a Supabase client with service role for admin operations
export async function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function initializeUserProfile(userId: string, email: string, fullName: string) {
  const serviceClient = await createServiceRoleClient()

  try {
    // Check if user already exists
    const { data: existingUser } = await serviceClient.from("users").select("*").eq("id", userId).maybeSingle()

    if (existingUser) {
      return existingUser
    }

    // Create the user profile
    const { data, error } = await serviceClient
      .from("users")
      .insert({
        id: userId,
        email: email,
        full_name: fullName || email.split("@")[0] || "User",
        total_points: 0,
        current_tier: 0,
        current_streak: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating user profile:", error)
      throw new Error("Unable to create user profile")
    }

    return data
  } catch (error: any) {
    console.error("Error in createUserProfile:", error)
    throw new Error(`Error creating user profile: ${error.message}`)
  }
}
