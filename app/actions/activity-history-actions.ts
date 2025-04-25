"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Fix the getUserActivityHistory function to ensure all days in the month are included
export async function getUserActivityHistory(userId: string, month: number, year: number) {
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

  // Use service role client for more reliable data access
  const serviceClient = createServiceRoleClient()

  // Calculate the first and last day of the month
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const startDateStr = startDate.toISOString().split("T")[0]
  const endDateStr = endDate.toISOString().split("T")[0]

  // Get all daily logs for the user in the specified month
  const { data, error } = await serviceClient
    .from("daily_logs")
    .select("activity_id, log_date, points, activities(name, emoji)")
    .eq("user_id", userId)
    .gte("log_date", startDateStr)
    .lte("log_date", endDateStr)

  if (error) throw error

  // Group logs by date
  const logsByDate: Record<string, { totalPoints: number; activities: string[] }> = {}

  // Initialize all days in the month
  const daysInMonth = endDate.getDate()
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dateStr = date.toISOString().split("T")[0]
    logsByDate[dateStr] = { totalPoints: 0, activities: [] }
  }

  // Populate with actual data
  for (const log of data) {
    if (!logsByDate[log.log_date]) {
      logsByDate[log.log_date] = { totalPoints: 0, activities: [] }
    }

    logsByDate[log.log_date].totalPoints += log.points
    logsByDate[log.log_date].activities.push(log.activity_id)
  }

  return logsByDate
}

export async function getUserMonthlyStats(userId: string, month: number, year: number) {
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

  // Calculate the first and last day of the month
  const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0]
  const endDate = new Date(year, month, 0).toISOString().split("T")[0]

  // Get all daily logs for the user in the specified month
  const { data, error } = await supabase
    .from("daily_logs")
    .select("log_date, points")
    .eq("user_id", userId)
    .gte("log_date", startDate)
    .lte("log_date", endDate)

  if (error) throw error

  // Calculate stats
  const totalDaysLogged = new Set(data.map((log) => log.log_date)).size
  const totalPoints = data.reduce((sum, log) => sum + log.points, 0)
  const perfectDays = Object.values(
    data.reduce((acc: Record<string, number>, log) => {
      if (!acc[log.log_date]) acc[log.log_date] = 0
      acc[log.log_date] += log.points
      return acc
    }, {}),
  ).filter((points) => points === 30).length

  return {
    totalDaysLogged,
    totalPoints,
    perfectDays,
    daysInMonth: new Date(year, month, 0).getDate(),
  }
}

// Fix the getRecentActivityHistory function to ensure all days are included
export async function getRecentActivityHistory(userId: string, days = 14) {
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
    // Use service role client for more reliable data access
    const serviceClient = createServiceRoleClient()

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const startDateStr = startDate.toISOString().split("T")[0]
    const endDateStr = endDate.toISOString().split("T")[0]

    console.log(`Fetching activity history for user ${userId} from ${startDateStr} to ${endDateStr}`)

    // Get all daily logs for the date range
    const { data, error } = await serviceClient
      .from("daily_logs")
      .select("*, activities(name, emoji, points)")
      .eq("user_id", userId)
      .gte("log_date", startDateStr)
      .lte("log_date", endDateStr)
      .order("log_date", { ascending: false })

    if (error) {
      console.error("Error fetching activity history:", error)
      throw error
    }

    console.log(`Found ${data.length} activity logs`)

    // Group logs by date
    const groupedLogs: Record<string, any[]> = {}

    // First, create entries for all days in the range (to ensure no missing days)
    for (let d = new Date(startDateStr); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]
      groupedLogs[dateStr] = []
    }

    // Then populate with actual data
    data.forEach((log) => {
      if (!groupedLogs[log.log_date]) {
        groupedLogs[log.log_date] = []
      }
      groupedLogs[log.log_date].push(log)
    })

    return groupedLogs
  } catch (error) {
    console.error("Error fetching activity history:", error)
    throw error
  }
}
