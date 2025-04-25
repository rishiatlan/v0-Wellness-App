"use server"

import { createServiceRoleClient } from "@/lib/server-auth"
import { revalidatePath } from "next/cache"

export async function createUserProfile(userId: string, email: string, fullName: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await serviceClient
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking if user exists:", checkError)
      throw new Error("Unable to check if user exists")
    }

    // If user already exists, return the existing user
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

    revalidatePath("/profile")
    revalidatePath("/daily-tracker")

    return data
  } catch (error: any) {
    console.error("Error in createUserProfile:", error)
    throw new Error(`Error creating user profile: ${error.message}`)
  }
}

export async function updateUserStreak(userId: string) {
  const serviceClient = createServiceRoleClient()
  const today = new Date().toISOString().split("T")[0]

  try {
    console.log(`Updating streak for user ${userId} on date ${today}`)

    // Get user's current streak
    const { data: user, error: userError } = await serviceClient
      .from("users")
      .select("current_streak")
      .eq("id", userId)
      .maybeSingle()

    if (userError) {
      console.error("Error fetching user streak:", userError)
      throw userError
    }

    if (!user) {
      console.log("No user found for ID:", userId)
      return { success: false, error: "User not found" }
    }

    console.log("Current streak:", user.current_streak)

    // Check if user has logged activities today
    const { data: todayLogs, error: logsError } = await serviceClient
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", today)

    if (logsError) {
      console.error("Error fetching today's logs:", logsError)
      throw logsError
    }

    console.log("Today's logs:", todayLogs?.length || 0)

    // If user has logged activities today, increment streak
    if (todayLogs && todayLogs.length > 0) {
      // Check if user logged activities yesterday to maintain streak
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split("T")[0]

      console.log("Checking logs for yesterday:", yesterdayStr)

      const { data: yesterdayLogs, error: yesterdayError } = await serviceClient
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("log_date", yesterdayStr)

      if (yesterdayError) {
        console.error("Error fetching yesterday's logs:", yesterdayError)
        throw yesterdayError
      }

      console.log("Yesterday's logs:", yesterdayLogs?.length || 0)

      let newStreak = user.current_streak || 0

      // If user logged activities yesterday, increment streak
      // Otherwise, reset streak to 1 (today)
      if (yesterdayLogs && yesterdayLogs.length > 0) {
        newStreak += 1
        console.log("Incrementing streak to:", newStreak)
      } else {
        newStreak = 1
        console.log("Resetting streak to 1")
      }

      // Update the streak
      const { error: updateError } = await serviceClient
        .from("users")
        .update({ current_streak: newStreak })
        .eq("id", userId)

      if (updateError) {
        console.error("Error updating streak:", updateError)
        throw updateError
      }

      console.log("Streak updated successfully to:", newStreak)
      return { success: true, streak: newStreak }
    }

    return { success: true, streak: user.current_streak || 0 }
  } catch (error: any) {
    console.error("Error updating streak:", error)
    return { success: false, error: error.message }
  }
}

export async function recalculateUserPoints(userId: string) {
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

    revalidatePath("/my-progress")
    revalidatePath("/daily-tracker")

    return { success: true, totalPoints }
  } catch (error: any) {
    console.error("Error recalculating user points:", error)
    return { success: false, error: error.message }
  }
}
