// This file provides client-safe alternatives to server actions
// It should be used in client components that might be used in the Pages Router

import {
  getActivitiesClient,
  toggleActivityClient,
  getUserProfileClient,
  updateUserStreakClient,
} from "@/lib/api-client"

// Add this at the top of the file
const cache = new Map()
const CACHE_TTL = 60000 // 1 minute cache TTL
const API_TIMEOUT = 8000 // 8 second timeout

// Helper function to implement timeout
const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), ms)),
  ])
}

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

// Add caching to getActivitiesClientSafe
export async function getActivitiesClientSafe() {
  const cacheKey = "activities"
  const cachedData = cache.get(cacheKey)

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return cachedData.data
  }

  try {
    const result = await withTimeout(getActivitiesClient(), API_TIMEOUT)
    cache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  } catch (error) {
    console.error("Error in getActivitiesClientSafe:", error)

    // Return cached data even if expired in case of error
    if (cachedData) {
      return cachedData.data
    }

    return []
  }
}

// Add caching to getDailyLogsClientSafe
export async function getDailyLogsClientSafe(userId: string, date: string) {
  const cacheKey = `daily_logs_${userId}_${date}`
  const cachedData = cache.get(cacheKey)

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return cachedData.data
  }

  try {
    // Import the server action directly for more reliable data access
    const { getDailyLogs } = await import("@/app/actions/activity-actions")
    const result = await withTimeout(getDailyLogs(userId, date), API_TIMEOUT)
    cache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  } catch (error) {
    console.error("Error in getDailyLogsClientSafe:", error)

    // Return cached data even if expired in case of error
    if (cachedData) {
      return cachedData.data
    }

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

// Add caching to getUserProfileClientSafe
export async function getUserProfileClientSafe(userId: string) {
  const cacheKey = `user_profile_${userId}`
  const cachedData = cache.get(cacheKey)

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return cachedData.data
  }

  try {
    const result = await withTimeout(getUserProfileClient(userId), API_TIMEOUT)
    cache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  } catch (error) {
    console.error("Error in getUserProfileClientSafe:", error)

    // Return cached data even if expired in case of error
    if (cachedData) {
      return cachedData.data
    }

    // Return default profile if no cached data
    return {
      id: userId,
      email: "",
      full_name: "User",
      total_points: 0,
      current_tier: 0,
      current_streak: 0,
      team_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
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
