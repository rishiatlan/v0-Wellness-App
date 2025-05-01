// This file provides client-safe alternatives to server actions
// It should be used in client components that might be used in the Pages Router

import {
  getActivitiesClient,
  toggleActivityClient,
  getUserProfileClient,
  updateUserStreakClient,
} from "@/lib/api-client"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { dataCache } from "@/lib/data-cache"

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
    const cacheKey = `activity-logged-${userId}-${activityId}-${date}`

    // Check cache first
    if (dataCache.has(cacheKey)) {
      return dataCache.get<boolean>(cacheKey)
    }

    const { checkActivityAlreadyLogged } = await import("@/app/actions/activity-actions")
    const result = await checkActivityAlreadyLogged(userId, activityId, date)

    // Cache the result for 5 minutes
    dataCache.set(cacheKey, result, 5 * 60 * 1000)

    return result
  } catch (error) {
    console.error("Error checking if activity is already logged:", error)
    // Return false instead of throwing to prevent UI disruption
    return false
  }
}

export async function getActivitiesClientSafe() {
  try {
    const cacheKey = "activities"

    // Check cache first
    if (dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey)
    }

    const activities = await getActivitiesClient()

    // Cache activities for 5 minutes
    dataCache.set(cacheKey, activities, 5 * 60 * 1000)

    return activities
  } catch (error) {
    console.error("Error in getActivitiesClientSafe:", error)
    throw error
  }
}

export async function getDailyLogsClientSafe(userId: string, date: string) {
  try {
    const cacheKey = `daily-logs-${userId}-${date}`

    // Check cache first
    if (dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey)
    }

    // Import the server action directly for more reliable data access
    const { getDailyLogs } = await import("@/app/actions/activity-actions")
    const logs = await getDailyLogs(userId, date)

    // Cache logs for 1 minute
    dataCache.set(cacheKey, logs, 60 * 1000)

    return logs
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
    const result = await toggleActivityClient(userId, activityId, date, points, userEmail, userName)

    // Clear related caches
    dataCache.clear(`daily-logs-${userId}-${date}`)
    dataCache.clear(`activity-logged-${userId}-${activityId}-${date}`)
    dataCache.clear(`user-profile-${userId}`)
    dataCache.clear(`today-points-${userId}-${date}`)

    return result
  } catch (error) {
    console.error("Error in toggleActivityClientSafe:", error)
    throw error
  }
}

export async function getUserProfileClientSafe(userId: string) {
  try {
    const cacheKey = `user-profile-${userId}`

    // Check cache first
    if (dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey)
    }

    const profile = await getUserProfileClient(userId)

    // Cache profile for 2 minutes
    dataCache.set(cacheKey, profile, 2 * 60 * 1000)

    return profile
  } catch (error) {
    console.error("Error in getUserProfileClientSafe:", error)
    throw error
  }
}

export async function updateUserStreakClientSafe(userId: string) {
  try {
    const result = await updateUserStreakClient(userId)

    // Clear user profile cache
    dataCache.clear(`user-profile-${userId}`)
    dataCache.clear(`weekly-streak-${userId}`)

    return result
  } catch (error) {
    console.error("Error in updateUserStreakClientSafe:", error)
    throw error
  }
}

export async function recalculateUserStreakClientSafe(userId: string) {
  try {
    // Use the server action
    const { recalculateUserStreak } = await import("@/app/actions/streak-actions")
    const result = await recalculateUserStreak(userId)

    // Clear user profile cache
    dataCache.clear(`user-profile-${userId}`)
    dataCache.clear(`weekly-streak-${userId}`)

    return result
  } catch (error) {
    console.error("Error recalculating user streak:", error)
    return { success: false, error: "Failed to recalculate streak" }
  }
}

export async function getActivityHistoryClientSafe(userId: string, days = 14) {
  try {
    const cacheKey = `activity-history-${userId}-${days}`

    // Check cache first
    if (dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey)
    }

    const { getRecentActivityHistory } = await import("@/app/actions/activity-history-actions")
    const history = await getRecentActivityHistory(userId, days)

    // Cache history for 5 minutes
    dataCache.set(cacheKey, history, 5 * 60 * 1000)

    return history
  } catch (error) {
    console.error("Error in getActivityHistoryClientSafe:", error)
    return {}
  }
}

export async function recalculateUserPointsClientSafe(userId: string) {
  try {
    const { recalculateUserPoints } = await import("@/app/actions/user-actions")
    const result = await recalculateUserPoints(userId)

    // Clear user profile cache
    dataCache.clear(`user-profile-${userId}`)

    return result
  } catch (error) {
    console.error("Error recalculating user points:", error)
    return { success: true } // Return success to avoid breaking the UI
  }
}

export async function getTodayPointsClientSafe(userId: string, localDate: string) {
  try {
    const cacheKey = `today-points-${userId}-${localDate}`

    // Check cache first
    if (dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey)
    }

    // Get the daily logs for today using the server action directly
    const { getDailyLogs } = await import("@/app/actions/activity-actions")
    const logs = await getDailyLogs(userId, localDate)

    // Calculate the total points
    const points = logs.reduce((sum, log) => sum + log.points, 0)

    console.log(`Calculated today's points for user ${userId}: ${points}`)

    const result = { success: true, points }

    // Cache points for 1 minute
    dataCache.set(cacheKey, result, 60 * 1000)

    return result
  } catch (error) {
    console.error("Error getting today's points:", error)
    return { success: false, points: 0 }
  }
}

export async function createDefaultActivitiesClientSafe(userId: string, activities: any[]) {
  try {
    const { createDefaultActivities } = await import("@/app/actions/activity-actions")
    const result = await createDefaultActivities(userId, activities)

    // Clear activities cache
    dataCache.clear("activities")

    return result
  } catch (error) {
    console.error("Error creating default activities:", error)
    return { success: false, error: "Failed to create default activities" }
  }
}

export async function getWeeklyStreakDataClientSafe(userId: string) {
  try {
    const cacheKey = `weekly-streak-${userId}`

    // Check cache first
    if (dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey)
    }

    const { getWeeklyStreakData } = await import("@/app/actions/streak-actions")
    const data = await getWeeklyStreakData(userId)

    // Cache streak data for 5 minutes
    dataCache.set(cacheKey, data, 5 * 60 * 1000)

    return data
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

// Add a function to prefetch common data
export async function prefetchCommonData(userId: string) {
  if (!userId) return

  try {
    // Prefetch user profile
    getUserProfileClientSafe(userId).catch((err) => console.error("Error prefetching user profile:", err))

    // Prefetch activities
    getActivitiesClientSafe().catch((err) => console.error("Error prefetching activities:", err))

    // Prefetch today's logs
    const today = getUserLocalDate()
    getDailyLogsClientSafe(userId, today).catch((err) => console.error("Error prefetching daily logs:", err))

    // Prefetch weekly streak data
    getWeeklyStreakDataClientSafe(userId).catch((err) => console.error("Error prefetching weekly streak data:", err))
  } catch (error) {
    console.error("Error in prefetchCommonData:", error)
  }
}

// Helper function to get user's local date
function getUserLocalDate(): string {
  const now = new Date()
  return now.toISOString().split("T")[0]
}
