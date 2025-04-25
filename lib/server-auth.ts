// This file is for server components only
// DO NOT IMPORT THIS FILE IN THE PAGES DIRECTORY

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Create a Supabase client with the service role for admin operations
export const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase service role credentials")
    throw new Error("Server configuration error")
  }

  const cookieStore = cookies()
  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get: (name) => {
        return cookieStore.get(name)?.value
      },
      set: (name, value, options) => {
        cookieStore.set(name, value, options)
      },
      remove: (name, options) => {
        cookieStore.set(name, "", { ...options, maxAge: 0 })
      },
    },
  })
}

// Initialize user profile in the database
export async function initializeUserProfile(userId: string, email: string, fullName?: string) {
  try {
    console.log("Initializing user profile for:", userId)
    const serviceClient = createServiceRoleClient()

    // Check if user already exists
    const { data: existingUser, error: checkError } = await serviceClient
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking if user exists:", checkError)
      throw checkError
    }

    // If user doesn't exist, create them
    if (!existingUser) {
      console.log("Creating new user profile for:", userId)

      const { error: insertError } = await serviceClient.from("users").insert({
        id: userId,
        email: email,
        full_name: fullName || email.split("@")[0] || "User",
        total_points: 0,
        current_tier: 0,
        current_streak: 0,
      })

      if (insertError) {
        console.error("Error creating user profile:", insertError)
        throw insertError
      }

      console.log("User profile created successfully for:", userId)
    } else {
      console.log("User profile already exists for:", userId)
    }

    return true
  } catch (error) {
    console.error("Error initializing user profile:", error)
    throw error
  }
}
