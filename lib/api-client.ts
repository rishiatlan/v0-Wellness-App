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
export async function getActivitiesClient() {
  const supabase = getClient()

  try {
    const { data, error } = await supabase.from("activities").select("*").order("name")

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

export async function getDailyLogsClient(userId: string, date: string) {
  const supabase = getClient()

  try {
    const { data, error } = await supabase.from("daily_logs").select("*").eq("user_id", userId).eq("log_date", date)

    if (error) {
      console.error("Error fetching daily logs:", error)
      throw new Error(error.message)
    }

    return data || []
  } catch (error: any) {
    console.error("Exception in getDailyLogs:", error)
    throw new Error(`Error fetching daily logs: ${error.message}`)
  }
}

export async function toggleActivityClient(
  userId: string,
  activityId: string,
  date: string,
  points: number,
  userEmail: string,
  userName: string,
) {
  try {
    console.log(`Logging activity for user ${userId}, activity ${activityId}, date ${date}, points ${points}`)

    // Check if the activity is already logged for today
    const { data: existingLog, error: checkError } = await getClient()
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("activity_id", activityId)
      .eq("log_date", date)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing log:", checkError)
      throw new Error(`Error checking existing log: ${checkError.message}`)
    }

    // If already logged, return success (don't allow unlogging)
    if (existingLog) {
      console.log("Activity already logged, skipping")
      return { success: true, alreadyLogged: true }
    }

    // Use server action to log the activity
    try {
      const { logActivity } = await import("@/app/actions/activity-actions")
      const result = await logActivity(userId, activityId, date, points, userEmail, userName)

      if (!result.success) {
        throw new Error(result.error || "Failed to log activity")
      }

      return { success: true }
    } catch (serverActionError: any) {
      console.error("Error using server action:", serverActionError)
      throw new Error(`Error using server action: ${serverActionError.message}`)
    }
  } catch (error: any) {
    console.error("Error in toggleActivity:", error)
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

    // If no profile exists, return a default profile
    if (!data) {
      console.log("No user profile found for ID:", userId)

      // Get user from auth
      const { data: authUser, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error("Error getting auth user:", authError)
        throw new Error(`Error getting auth user: ${authError.message}`)
      }

      if (!authUser.user) {
        console.error("Auth user not found")
        throw new Error("Auth user not found")
      }

      // Try to create the user profile using a server action
      try {
        const { createUserProfile } = await import("@/app/actions/user-actions")
        const newProfile = await createUserProfile(
          userId,
          authUser.user.email || "",
          authUser.user.user_metadata?.full_name || authUser.user.email?.split("@")[0] || "User",
        )
        return newProfile
      } catch (createError: any) {
        console.error("Error creating user profile:", createError)
      }

      // Return default profile
      return {
        id: userId,
        email: authUser.user.email || "",
        full_name: authUser.user.user_metadata?.full_name || authUser.user.email?.split("@")[0] || "User",
        total_points: 0,
        current_tier: 0,
        current_streak: 0,
        team_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    return data
  } catch (error: any) {
    console.error("Error in getUserProfile:", error)
    throw new Error(`Error fetching user profile: ${error.message}`)
  }
}

export async function updateUserStreakClient(userId: string) {
  try {
    console.log(`Updating streak for user ${userId}`)

    // Use a server action to update the streak
    try {
      const { updateUserStreak } = await import("@/app/actions/user-actions")
      return await updateUserStreak(userId)
    } catch (serverActionError: any) {
      console.error("Error using server action for streak update:", serverActionError)
      throw new Error(`Error updating streak: ${serverActionError.message}`)
    }
  } catch (error: any) {
    console.error("Error updating streak:", error)
    return { success: false, error: error.message }
  }
}
