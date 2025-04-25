"use server"

import { createServiceRoleClient } from "@/lib/server-auth"
import { revalidatePath } from "next/cache"

// Verify and fix activity points to ensure all are set to 5
export async function verifyActivityPoints() {
  const serviceClient = createServiceRoleClient()

  try {
    // Get all activities
    const { data: activities, error } = await serviceClient.from("activities").select("*")

    if (error) {
      console.error("Error fetching activities:", error)
      return { success: false, error: "Failed to fetch activities" }
    }

    // Check for activities with incorrect points
    const incorrectActivities = activities.filter((activity) => activity.points !== 5)

    if (incorrectActivities.length === 0) {
      return { success: true, message: "All activities have correct point values (5)" }
    }

    // Fix activities with incorrect points
    for (const activity of incorrectActivities) {
      const { error: updateError } = await serviceClient.from("activities").update({ points: 5 }).eq("id", activity.id)

      if (updateError) {
        console.error(`Error updating activity ${activity.id}:`, updateError)
        return { success: false, error: `Failed to update activity ${activity.name}` }
      }
    }

    // Also fix any daily logs with incorrect points
    const { error: logsUpdateError } = await serviceClient.from("daily_logs").update({ points: 5 }).neq("points", 5)

    if (logsUpdateError) {
      console.error("Error updating daily logs:", logsUpdateError)
      return { success: false, error: "Fixed activities but failed to update daily logs" }
    }

    // Recalculate points for all users
    const { data: users, error: usersError } = await serviceClient.from("users").select("id")

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return {
        success: true,
        message: `Fixed ${incorrectActivities.length} activities and daily logs, but couldn't recalculate user points`,
      }
    }

    // Update each user's total points
    for (const user of users) {
      await recalculateUserPoints(user.id)
    }

    // Revalidate relevant paths
    revalidatePath("/daily-tracker")
    revalidatePath("/my-progress")
    revalidatePath("/leaderboard")

    return {
      success: true,
      message: `Fixed ${incorrectActivities.length} activities and updated all user points`,
    }
  } catch (error: any) {
    console.error("Error verifying activity points:", error)
    return { success: false, error: error.message }
  }
}

// Helper function to recalculate user points
async function recalculateUserPoints(userId: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Get all daily logs for the user
    const { data: logs, error: logsError } = await serviceClient
      .from("daily_logs")
      .select("points")
      .eq("user_id", userId)

    if (logsError) {
      console.error(`Error fetching logs for user ${userId}:`, logsError)
      return false
    }

    // Calculate total points
    const totalPoints = logs.reduce((sum, log) => sum + log.points, 0)

    // Update user's total points
    const { error: updateError } = await serviceClient
      .from("users")
      .update({ total_points: totalPoints })
      .eq("id", userId)

    if (updateError) {
      console.error(`Error updating points for user ${userId}:`, updateError)
      return false
    }

    return true
  } catch (error) {
    console.error(`Error recalculating points for user ${userId}:`, error)
    return false
  }
}

// Check and fix the Exercise activity if it's missing or has incorrect points
export async function checkAndFixExerciseActivity() {
  const serviceClient = createServiceRoleClient()

  try {
    // Check if Exercise activity exists
    const { data, error } = await serviceClient.from("activities").select("*").ilike("name", "exercise").maybeSingle()

    if (error) {
      console.error("Error checking Exercise activity:", error)
      return { success: false, error: "Failed to check Exercise activity" }
    }

    if (!data) {
      // Create the Exercise activity if it doesn't exist
      const { error: insertError } = await serviceClient.from("activities").insert({
        name: "Exercise",
        emoji: "💪",
        points: 5,
        description: "20 min workout",
      })

      if (insertError) {
        console.error("Error creating Exercise activity:", insertError)
        return { success: false, error: "Failed to create Exercise activity" }
      }

      return { success: true, message: "Exercise activity created successfully" }
    }

    // Fix the Exercise activity if it has incorrect points
    if (data.points !== 5) {
      const { error: updateError } = await serviceClient.from("activities").update({ points: 5 }).eq("id", data.id)

      if (updateError) {
        console.error("Error updating Exercise activity:", updateError)
        return { success: false, error: "Failed to update Exercise activity" }
      }

      return { success: true, message: "Exercise activity points fixed" }
    }

    return { success: true, message: "Exercise activity is correctly configured" }
  } catch (error: any) {
    console.error("Error in checkAndFixExerciseActivity:", error)
    return { success: false, error: error.message }
  }
}
