"use client"

// This file provides client-side API functions for the Pages Router
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

// Create a client-side Supabase client
const createClient = () => {
  return createClientComponentClient<Database>()
}

// Singleton pattern to avoid multiple instances
let clientInstance: ReturnType<typeof createClient> | null = null

const getClient = () => {
  if (!clientInstance) {
    clientInstance = createClient()
  }
  return clientInstance
}

// Client-side API functions that can be used in /pages directory
export async function toggleActivityClient(
  userId: string,
  activityId: string,
  date: string,
  points: number,
  userEmail: string,
  userName: string,
) {
  const supabase = getClient()

  try {
    const now = new Date().toISOString()

    const { error } = await supabase.from("daily_logs").insert({
      user_id: userId,
      activity_id: activityId,
      log_date: date,
      points: points,
      completed_at: now,
    })

    if (error) {
      console.error("Error logging activity:", error)
      throw new Error(error.message)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Exception in logActivity:", error)
    throw new Error(`Error logging activity: ${error.message}`)
  }
}

export async function getUserProfileClient(userId: string) {
  const supabase = getClient()

  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle()

    if (error) {
      console.error("Error fetching user profile:", error)
      throw new Error(error.message)
    }

    return data
  } catch (error: any) {
    console.error("Exception in getUserProfile:", error)
    throw new Error(`Error fetching user profile: ${error.message}`)
  }
}

export async function updateUserStreakClient(userId: string) {
  const supabase = getClient()

  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user:", error)
      throw new Error(error.message)
    }

    return data
  } catch (error: any) {
    console.error("Exception in updateUserStreak:", error)
    throw new Error(`Error fetching user: ${error.message}`)
  }
}

export async function getActivitiesClient() {
  const supabase = getClient()

  try {
    const { data, error } = await supabase.from("activities").select("*").order("name")

    if (error) {
      console.error("Activity fetch error:", error)
      throw new Error("Unable to complete the requested action")
    }

    return data || []
  } catch (error: any) {
    console.error("Exception in getActivities:", error)
    throw new Error("Unable to complete the requested action")
  }
}

export async function getTeamsClient() {
  const supabase = getClient()

  try {
    console.log("Fetching teams from client-side")

    // First try to fetch teams directly
    const { data, error } = await supabase.from("teams").select("*").order("total_points", { ascending: false })

    if (error) {
      console.error("Teams fetch error from client:", error)

      // If direct fetch fails, try the debug API endpoint as fallback
      console.log("Trying fallback API endpoint")
      const response = await fetch("/api/debug-teams")

      if (!response.ok) {
        throw new Error("Failed to fetch teams from API")
      }

      const apiData = await response.json()
      return apiData.teams || []
    }

    return data || []
  } catch (error: any) {
    console.error("Exception in getTeamsClient:", error)
    throw new Error(`Unable to fetch teams: ${error.message}`)
  }
}
