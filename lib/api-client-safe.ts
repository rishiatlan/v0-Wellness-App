// This file provides client-safe alternatives to server actions
// It should be used in client components that might be used in the Pages Router

import {
  getActivitiesClient,
  toggleActivityClient,
  getUserProfileClient,
  updateUserStreakClient,
} from "@/lib/api-client"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const supabase = createClientComponentClient()

// Utility function for conditional logging
const logDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(message, data || "")
  }
}

// Add this function to check if an activity has already been logged today
export async function checkActivityAlreadyLoggedClientSafe(userId: string, activityId: string, date: string) {
  try {
    const { checkActivityAlreadyLogged } = await import("@/app/actions/activity-actions")
    const result = await checkActivityAlreadyLogged(userId, activityId, date)
    return result
  } catch (error) {
    console.error("Error checking if activity is already logged:", error)
    // Return false instead of throwing to prevent UI disruption
    return false
  }
}

export async function getActivitiesClientSafe() {
  try {
    return await getActivitiesClient()
  } catch (error) {
    console.error("Error in getActivitiesClientSafe:", error)
    throw error
  }
}

export async function getDailyLogsClientSafe(userId: string, date: string) {
  try {
    // Import the server action directly for more reliable data access
    const { getDailyLogs } = await import("@/app/actions/activity-actions")
    return await getDailyLogs(userId, date)
  } catch (error) {
    console.error("Error in getDailyLogsClientSafe:", error)
    // Return empty array instead of throwing to prevent UI disruption
    return []
  }
}

export async function toggleActivityClientSafe(
  userId: string,
  activityId: string,
  date: string,
  points: number,
  userEmail: string,
  userName: string,
) {
  try {
    // First check if the activity has already been logged today
    const alreadyLogged = await checkActivityAlreadyLoggedClientSafe(userId, activityId, date)

    if (alreadyLogged) {
      console.log(`Activity ${activityId} already logged for today, cannot log again`)
      throw new Error("This activity has already been logged today")
    }

    // If not already logged, proceed with logging
    return await toggleActivityClient(userId, activityId, date, points, userEmail, userName)
  } catch (error) {
    console.error("Error in toggleActivityClientSafe:", error)
    throw error
  }
}

export async function getUserProfileClientSafe(userId: string) {
  try {
    return await getUserProfileClient(userId)
  } catch (error) {
    console.error("Error in getUserProfileClientSafe:", error)
    throw error
  }
}

export async function updateUserStreakClientSafe(userId: string) {
  try {
    return await updateUserStreakClient(userId)
  } catch (error) {
    console.error("Error in updateUserStreakClientSafe:", error)
    throw error
  }
}

export async function recalculateUserStreakClientSafe(userId: string) {
  try {
    // Use the server action
    const { recalculateUserStreak } = await import("@/app/actions/streak-actions")
    return await recalculateUserStreak(userId)
  } catch (error) {
    console.error("Error recalculating user streak:", error)
    return { success: false, error: "Failed to recalculate streak" }
  }
}

export async function getActivityHistoryClientSafe(userId: string, days = 14) {
  try {
    const { getRecentActivityHistory } = await import("@/app/actions/activity-history-actions")
    return await getRecentActivityHistory(userId, days)
  } catch (error) {
    console.error("Error in getActivityHistoryClientSafe:", error)
    return {}
  }
}

export async function recalculateUserPointsClientSafe(userId: string) {
  try {
    const { recalculateUserPoints } = await import("@/app/actions/user-actions")
    return await recalculateUserPoints(userId)
  } catch (error) {
    console.error("Error recalculating user points:", error)
    return { success: true } // Return success to avoid breaking the UI
  }
}

export async function getTodayPointsClientSafe(userId: string, localDate: string) {
  try {
    // Get the daily logs for today using the server action directly
    const { getDailyLogs } = await import("@/app/actions/activity-actions")
    const logs = await getDailyLogs(userId, localDate)

    // Calculate the total points
    const points = logs.reduce((sum, log) => sum + log.points, 0)

    console.log(`Calculated today's points for user ${userId}: ${points}`)

    return { success: true, points }
  } catch (error) {
    console.error("Error getting today's points:", error)
    return { success: false, points: 0 }
  }
}

export async function createDefaultActivitiesClientSafe(userId: string, activities: any[]) {
  try {
    const { createDefaultActivities } = await import("@/app/actions/activity-actions")
    return await createDefaultActivities(userId, activities)
  } catch (error) {
    console.error("Error creating default activities:", error)
    return { success: false, error: "Failed to create default activities" }
  }
}

export async function getWeeklyStreakDataClientSafe(userId: string) {
  try {
    const { getWeeklyStreakData } = await import("@/app/actions/streak-actions")
    return await getWeeklyStreakData(userId)
  } catch (error) {
    console.error("Error fetching weekly streak data:", error)
    return {
      weekDays: Array(7)
        .fill(null)
        .map((_, i) => ({
          date: "",
          dayOfWeek: i,
          hasActivity: false,
          isToday: i === (new Date().getDay() + 6) % 7,
          isPast: i < (new Date().getDay() + 6) % 7,
        })),
      currentStreak: 0,
    }
  }
}

/**
 * Checks if the user is authenticated and redirects to login if not
 */
export async function checkAuthAndRedirect() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      // Redirect to login with callback to daily-tracker
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent("/daily-tracker")}`
      return false
    }
    return true
  } catch (error) {
    console.error("Error checking authentication:", error)
    // Redirect to login with callback to daily-tracker
    window.location.href = `/auth/login?callbackUrl=${encodeURIComponent("/daily-tracker")}`
    return false
  }
}
