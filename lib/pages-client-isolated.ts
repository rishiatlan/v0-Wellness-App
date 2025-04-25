"use client"

// COMPLETELY ISOLATED CLIENT FILE FOR PAGES DIRECTORY
// NO IMPORTS FROM ANYWHERE THAT MIGHT USE SERVER COMPONENTS

import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a completely isolated Supabase client for pages
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables in pages client")
}

// Create a single isolated client for pages
export const pagesClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Utility function for email validation
// export function isAtlanEmail(email: string): boolean {
//   return email.endsWith("@atlan.com")
// }

// AUTH FUNCTIONS
export async function pagesSignIn(email: string, password: string) {
  try {
    const { data, error } = await pagesClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  } catch (error: any) {
    throw new Error(error.message || "Authentication failed")
  }
}

export async function pagesSignOut() {
  try {
    const { error } = await pagesClient.auth.signOut()
    if (error) throw error
    window.location.href = "/auth/login"
  } catch (error: any) {
    throw new Error(error.message)
  }
}

// DATA FUNCTIONS
export async function getActivitiesPages() {
  try {
    const { data, error } = await pagesClient.from("activities").select("*").order("name")

    if (error) {
      console.error("Error fetching activities:", error)
      throw new Error(error.message)
    }

    return data || []
  } catch (error: any) {
    console.error("Exception in getActivities:", error)
    throw new Error(`Error fetching activities: ${error.message}`)
  }
}

export async function getUserProfilePages(userId: string) {
  try {
    const { data, error } = await pagesClient.from("users").select("*").eq("id", userId).maybeSingle()

    if (error) {
      console.error("Error fetching user profile:", error)
      throw new Error(error.message)
    }

    return data
  } catch (error: any) {
    console.error("Error in getUserProfile:", error)
    throw new Error(`Error fetching user profile: ${error.message}`)
  }
}

export async function testConnectionPages() {
  try {
    const { data, error } = await pagesClient.from("activities").select("count").limit(1)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
