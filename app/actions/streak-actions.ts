"use server"
import { createServiceRoleClient } from "@/lib/server-auth"

// Get the user's weekly streak data
export async function getWeeklyStreakData(userId: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Get the current date
    const today = new Date()

    // Calculate the start of the week (Monday)
    const dayOfWeek = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - ((dayOfWeek || 7) - 1))
    startOfWeek.setHours(0, 0, 0, 0)

    // Calculate the end of the week (Sunday)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    // Format dates for the query
    const startDate = startOfWeek.toISOString().split("T")[0]
    const endDate = endOfWeek.toISOString().split("T")[0]

    console.log(`Fetching streak data for user ${userId} from ${startDate} to ${endDate}`)

    // Query daily_logs to get days with activities, using distinct on log_date
    const { data, error } = await serviceClient
      .from("daily_logs")
      .select("log_date")
      .eq("user_id", userId)
      .gte("log_date", startDate)
      .lte("log_date", endDate)

    if (error) {
      console.error("Error fetching weekly streak data:", error)
      throw error
    }

    // Create a map of days with activities (using Set to ensure uniqueness)
    const daysWithActivities = new Set(data.map((log) => log.log_date))

    // Create an array for each day of the week (Monday to Sunday)
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]

      weekDays.push({
        date: dateStr,
        dayOfWeek: i, // 0 = Monday, 1 = Tuesday, etc.
        hasActivity: daysWithActivities.has(dateStr),
        isToday: dateStr === today.toISOString().split("T")[0],
        isPast: date < today,
      })
    }

    // Get the current streak from the user profile
    const { data: userData, error: userError } = await serviceClient
      .from("users")
      .select("current_streak")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Error fetching user streak:", userError)
      throw userError
    }

    return {
      weekDays,
      currentStreak: userData.current_streak || 0,
    }
  } catch (error) {
    console.error("Error in getWeeklyStreakData:", error)
    // Return default data in case of error
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

// Fix the recalculateUserStreak function to properly handle consecutive days
export async function recalculateUserStreak(userId: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Get all daily logs for the user, ordered by date
    const { data: logs, error } = await serviceClient
      .from("daily_logs")
      .select("log_date")
      .eq("user_id", userId)
      .order("log_date", { ascending: false })
      .limit(100) // Limit to recent logs

    if (error) {
      console.error("Error fetching logs for streak calculation:", error)
      throw error
    }

    // Group logs by date to handle multiple activities on the same day
    const uniqueDates = [...new Set(logs.map((log) => log.log_date))].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    )

    // Calculate streak
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split("T")[0]

    // Check if there's activity today
    const hasActivityToday = uniqueDates.includes(todayStr)

    if (hasActivityToday) {
      streak = 1

      // Check consecutive days before today
      let currentDate = new Date(todayStr)

      for (let i = 1; i < uniqueDates.length; i++) {
        // Calculate the expected previous day
        const expectedPrevDate = new Date(currentDate)
        expectedPrevDate.setDate(expectedPrevDate.getDate() - 1)
        const expectedPrevDateStr = expectedPrevDate.toISOString().split("T")[0]

        // Check if the actual previous date matches the expected previous date
        if (uniqueDates[i] === expectedPrevDateStr) {
          streak++
          currentDate = expectedPrevDate
        } else {
          break // Break the streak
        }
      }
    } else if (uniqueDates.length > 0) {
      // If no activity today, check if there was activity yesterday to maintain streak
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split("T")[0]

      if (uniqueDates[0] === yesterdayStr) {
        // Start counting from yesterday
        streak = 1
        let currentDate = yesterday

        for (let i = 1; i < uniqueDates.length; i++) {
          // Calculate the expected previous day
          const expectedPrevDate = new Date(currentDate)
          expectedPrevDate.setDate(expectedPrevDate.getDate() - 1)
          const expectedPrevDateStr = expectedPrevDate.toISOString().split("T")[0]

          // Check if the actual previous date matches the expected previous date
          if (uniqueDates[i] === expectedPrevDateStr) {
            streak++
            currentDate = expectedPrevDate
          } else {
            break // Break the streak
          }
        }
      }
    }

    console.log(`Calculated streak for user ${userId}: ${streak} days`)

    // Update the user's streak in the database
    const { error: updateError } = await serviceClient.from("users").update({ current_streak: streak }).eq("id", userId)

    if (updateError) {
      console.error("Error updating user streak:", updateError)
      throw updateError
    }

    return { success: true, streak }
  } catch (error) {
    console.error("Error recalculating user streak:", error)
    return { success: false, error: "Failed to recalculate streak" }
  }
}
