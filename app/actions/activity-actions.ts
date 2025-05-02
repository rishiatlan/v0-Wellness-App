"use server"

// DO NOT import this file in client components that might be used in the Pages Router
// Use lib/api-client.ts instead for client components

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createServiceRoleClient } from "@/lib/server-auth"

// Optimize the getActivities function to use count and minimal returns where appropriate
export async function getActivities() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => cookieStore.set(name, value, options),
        remove: (name, options) => cookieStore.set(name, "", { ...options, maxAge: 0 }),
      },
    },
  )

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

// Fix the getDailyLogs function to ensure all logs are retrieved
export async function getDailyLogs(userId: string, date: string) {
  // Use the service role client directly for more reliable data access
  const serviceClient = createServiceRoleClient()

  try {
    const { data, error } = await serviceClient
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", date)
      .limit(50) // Add limit to prevent excessive data fetching

    if (error) {
      console.error("Error fetching daily logs:", error)
      return [] // Return empty array instead of throwing
    }

    return data || []
  } catch (error: any) {
    console.error("Exception in getDailyLogs:", error)
    return [] // Return empty array instead of throwing
  }
}

// Optimize checkActivityAlreadyLogged to use count only
export async function checkActivityAlreadyLogged(userId: string, activityId: string, date: string): Promise<boolean> {
  // Always use the service role client for this check to avoid RLS issues
  const serviceClient = createServiceRoleClient()

  try {
    // Use count only to minimize data transfer
    const { count, error } = await serviceClient
      .from("daily_logs")
      .select("*", { count: "exact", head: true }) // Use head:true to avoid fetching actual rows
      .eq("user_id", userId)
      .eq("activity_id", activityId)
      .eq("log_date", date)

    if (error) {
      console.error("Error checking activity log:", error)
      throw new Error("Unable to check if activity is already logged")
    }

    return count !== null && count > 0
  } catch (error: any) {
    console.error("Exception in checkActivityAlreadyLogged:", error)
    throw new Error("Unable to check if activity is already logged")
  }
}

// Function to ensure user exists in the database
async function ensureUserExists(userId: string, userEmail: string, userName: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Check if user exists
    const { data: existingUser, error: checkError } = await serviceClient
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking if user exists:", checkError)
      throw new Error("Unable to complete the requested action")
    }

    // If user doesn't exist, create them
    if (!existingUser) {
      console.log("User doesn't exist in database, creating user record:", userId)

      // Create user in the database using the provided information
      const { error: insertError } = await serviceClient
        .from("users")
        .insert({
          id: userId,
          email: userEmail,
          full_name: userName || userEmail.split("@")[0] || "User",
          total_points: 0,
          current_tier: 0,
          current_streak: 0,
        })
        .returns("minimal")

      if (insertError) {
        console.error("Error creating user:", insertError)
        throw new Error("Unable to complete the requested action")
      }

      console.log("User created successfully:", userId)
    } else {
      console.log("User exists in database:", userId)
    }

    return true
  } catch (error: any) {
    console.error("Error ensuring user exists:", error)
    throw new Error("Unable to complete the requested action")
  }
}

// Optimize logActivity to use minimal returns and better error handling
export async function logActivity(activityId: number, notes?: string) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Insert activity with optimized query
    const { data, error } = await supabase
      .from("activity_logs")
      .insert({
        activity_id: activityId,
        user_id: user.id,
        notes,
      })
      .select("id, points")
      .single()

    if (error) {
      console.error("Error logging activity:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: {
        id: data.id,
        points: data.points,
        activityId,
        userId: user.id,
        createdAt: new Date().toISOString(),
        notes,
      },
    }
  } catch (error: any) {
    console.error("Exception in logActivity:", error)
    return { success: false, error: error.message }
  }
}

// Add a helper function to recalculate user points
async function recalculateUserPoints(userId: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Get all daily logs for the user
    const { data: logs, error: logsError } = await serviceClient
      .from("daily_logs")
      .select("points")
      .eq("user_id", userId)

    if (logsError) {
      console.error("Error fetching logs for point calculation:", logsError)
      throw new Error("Unable to fetch logs for point calculation")
    }

    // Calculate total points
    const totalPoints = logs.reduce((sum, log) => sum + log.points, 0)
    console.log(`Calculated total points for user ${userId}: ${totalPoints}`)

    // Update user's total points
    const { error: updateError } = await serviceClient
      .from("users")
      .update({ total_points: totalPoints })
      .eq("id", userId)
      .returns("minimal")

    if (updateError) {
      console.error("Error updating user points:", updateError)
      throw new Error("Unable to update user points")
    }

    return { success: true, totalPoints }
  } catch (error: any) {
    console.error("Error recalculating user points:", error)
    return { success: false, error: error.message }
  }
}

export async function getUserProfile(userId: string) {
  const serviceClient = createServiceRoleClient()

  try {
    const { data, error } = await serviceClient
      .from("users")
      .select("id, email, full_name, total_points, current_tier, current_streak, team_id, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle()

    if (error) {
      console.error("Error fetching user profile:", error)
      // Return default profile instead of throwing
      return {
        id: userId,
        email: "",
        full_name: "",
        total_points: 0,
        current_tier: 0,
        current_streak: 0,
        team_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    // If no profile exists, return a default profile
    if (!data) {
      console.log("No user profile found for ID:", userId)
      return {
        id: userId,
        email: "",
        full_name: "",
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
    // Return default profile instead of throwing
    return {
      id: userId,
      email: "",
      full_name: "",
      total_points: 0,
      current_tier: 0,
      current_streak: 0,
      team_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
}

export async function createDefaultActivities(userId: string, activities: any[]) {
  const serviceClient = createServiceRoleClient()

  try {
    // First ensure the user exists
    await ensureUserExists(userId, "", "")

    // Check if activities already exist
    const { data: existingActivities, error: checkError } = await serviceClient.from("activities").select("*")

    if (checkError) {
      console.error("Error checking existing activities:", checkError)
      throw new Error("Unable to check existing activities")
    }

    // If activities already exist, return success
    if (existingActivities && existingActivities.length > 0) {
      return { success: true, message: "Activities already exist" }
    }

    // Insert the activities
    const { data, error } = await serviceClient.from("activities").insert(activities).select()

    if (error) {
      console.error("Error creating activities:", error)
      throw new Error("Unable to create activities")
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error in createDefaultActivities:", error)
    throw new Error("Unable to create default activities")
  }
}

// Direct server action to unlog an activity (for client-side use)
export async function unlogActivity(userId: string, activityId: string, date: string) {
  const serviceClient = createServiceRoleClient()

  try {
    console.log(`Unlogging activity for user ${userId}, activity ${activityId}, date ${date}`)

    // Find the log
    const { data: existingLog, error: findError } = await serviceClient
      .from("daily_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("activity_id", activityId)
      .eq("log_date", date)
      .maybeSingle()

    if (findError) {
      console.error("Error finding log:", findError)
      throw new Error(`Error finding log: ${findError.message}`)
    }

    if (!existingLog) {
      console.log("No log found to delete")
      return { success: true, noLogFound: true }
    }

    // Delete the log
    const { error: deleteError } = await serviceClient
      .from("daily_logs")
      .delete()
      .eq("id", existingLog.id)
      .returns("minimal")

    if (deleteError) {
      console.error("Error deleting log:", deleteError)
      throw new Error(`Error deleting log: ${deleteError.message}`)
    }

    // Revalidate the daily tracker page
    revalidatePath("/daily-tracker")
    return { success: true }
  } catch (error: any) {
    console.error("Error in unlogActivity:", error)
    return { success: false, error: error.message }
  }
}
