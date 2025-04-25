"use server"

// DO NOT import this file in client components that might be used in the Pages Router
// Use lib/api-client.ts instead for client components

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createServiceRoleClient } from "@/lib/server-auth"

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
    // Use the service role client for more reliable data access
    const serviceClient = createServiceRoleClient()

    const { data, error } = await serviceClient
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", date)

    if (error) {
      console.error("Error fetching daily logs:", error)
      throw new Error("Unable to complete the requested action")
    }

    return data || []
  } catch (error: any) {
    console.error("Exception in getDailyLogs:", error)
    throw new Error("Unable to complete the requested action")
  }
}

// Fix the checkActivityAlreadyLogged function to be more reliable
export async function checkActivityAlreadyLogged(userId: string, activityId: string, date: string): Promise<boolean> {
  // Always use the service role client for this check to avoid RLS issues
  const serviceClient = createServiceRoleClient()

  try {
    const { data, error, count } = await serviceClient
      .from("daily_logs")
      .select("*", { count: "exact" })
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
      const { error: insertError } = await serviceClient.from("users").insert({
        id: userId,
        email: userEmail,
        full_name: userName || userEmail.split("@")[0] || "User",
        total_points: 0,
        current_tier: 0,
        current_streak: 0,
      })

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

// Fix the logActivity function to ensure proper persistence
export async function logActivity(
  userId: string,
  activityId: string,
  date: string,
  points: number,
  userEmail: string,
  userName: string,
) {
  const serviceClient = createServiceRoleClient()

  try {
    console.log(`Logging activity for user ${userId}, activity ${activityId}, date ${date}, points ${points}`)

    // Ensure user exists
    await ensureUserExists(userId, userEmail, userName)

    // Check if already logged with a more reliable query
    const {
      data: existingLogs,
      error: checkError,
      count,
    } = await serviceClient
      .from("daily_logs")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("activity_id", activityId)
      .eq("log_date", date)

    if (checkError) {
      console.error("Error checking existing logs:", checkError)
      throw new Error(`Error checking existing logs: ${checkError.message}`)
    }

    if (count && count > 0) {
      console.log(`Activity ${activityId} already logged for user ${userId} on ${date}, skipping`)
      return { success: true, alreadyLogged: true }
    }

    // Insert the log with retry logic
    const now = new Date().toISOString()

    // Try up to 3 times to insert the log
    let insertError = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { error } = await serviceClient.from("daily_logs").insert({
        user_id: userId,
        activity_id: activityId,
        log_date: date,
        points: points,
        completed_at: now,
      })

      if (!error) {
        console.log(`Successfully logged activity on attempt ${attempt}`)

        // Update user points immediately after successful log
        await recalculateUserPoints(userId)

        // Revalidate the daily tracker page
        revalidatePath("/daily-tracker")
        return { success: true }
      }

      insertError = error
      console.error(`Error inserting log (attempt ${attempt}):`, error)

      // Wait a short time before retrying
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // If we get here, all attempts failed
    throw new Error(`Failed to insert log after 3 attempts: ${insertError?.message}`)
  } catch (error: any) {
    console.error("Error in logActivity:", error)
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
    const { data, error } = await serviceClient.from("users").select("*").eq("id", userId).maybeSingle()

    if (error) {
      console.error("Error fetching user profile:", error)
      throw new Error("Unable to complete the requested action")
    }

    // If no profile exists, return a default profile
    if (!data) {
      console.log("No user profile found for ID:", userId)

      // Try to get user from auth using service role
      try {
        const { data: authUser, error: authError } = await serviceClient.auth.admin.getUserById(userId)

        if (authError) {
          console.error("Error getting auth user:", authError)
        }

        if (authUser && authUser.user) {
          // Try to create the user profile
          const { error: insertError } = await serviceClient.from("users").insert({
            id: userId,
            email: authUser.user.email || "",
            full_name: authUser.user.user_metadata?.full_name || authUser.user.email?.split("@")[0] || "User",
            total_points: 0,
            current_tier: 0,
            current_streak: 0,
          })

          if (insertError) {
            console.error("Error creating user profile:", insertError)
          } else {
            // Fetch the newly created profile
            const { data: newProfile, error: fetchError } = await serviceClient
              .from("users")
              .select("*")
              .eq("id", userId)
              .single()

            if (fetchError) {
              console.error("Error fetching new profile:", fetchError)
            } else {
              return newProfile
            }
          }
        }
      } catch (authError) {
        console.error("Error getting auth user:", authError)
      }

      // Return default profile if all else fails
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
    throw new Error("Unable to complete the requested action")
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
    const { error: deleteError } = await serviceClient.from("daily_logs").delete().eq("id", existingLog.id)

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
