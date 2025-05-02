"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { createClient as createAdminClient } from "@/lib/supabase-admin"
import { generateNameFromEmail } from "@/lib/utils"

/**
 * Get individual leaderboard data
 * This function can be called without authentication
 */
export async function getIndividualLeaderboard() {
  try {
    const supabase = createServerSupabaseClient()

    // Query for individual leaderboard data
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, avatar_url, total_points, current_tier")
      .order("total_points", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching individual leaderboard:", error)
      return []
    }

    // Ensure all users have names and add rank to each user
    return (data || []).map((user, index) => ({
      ...user,
      full_name: user.full_name || generateNameFromEmail(user.email),
      rank: index + 1,
      badge: index < 3 ? ["🥇", "🥈", "🥉"][index] : null,
    }))
  } catch (error) {
    console.error("Error in getIndividualLeaderboard:", error)
    return []
  }
}

/**
 * Get team leaderboard data
 * This function can be called without authentication
 */
export async function getTeamLeaderboard() {
  try {
    const supabase = createServerSupabaseClient()

    // Get teams with total points
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, total_points, banner_url")
      .order("total_points", { ascending: false })
      .limit(20)

    if (teamsError) {
      console.error("Error fetching team leaderboard:", teamsError)
      return []
    }

    // For each team, get the count of members and calculate average points
    const teamsWithDetails = await Promise.all(
      (teams || []).map(async (team) => {
        // Get member count
        const { count, error: countError } = await supabase
          .from("users")
          .select("id", { count: "exact" })
          .eq("team_id", team.id)

        if (countError) {
          console.error("Error getting team member count:", countError)
        }

        // Get all team members to calculate average points
        const { data: members, error: membersError } = await supabase
          .from("users")
          .select("total_points")
          .eq("team_id", team.id)

        if (membersError) {
          console.error("Error getting team members:", membersError)
        }

        // Calculate average points per member
        const totalMemberPoints = members?.reduce((sum, member) => sum + member.total_points, 0) || 0
        const avgPoints = members && members.length > 0 ? Math.round(totalMemberPoints / members.length) : 0

        return {
          ...team,
          members: count || 0,
          avg_points: avgPoints,
        }
      }),
    )

    // Add rank and badge to each team
    return teamsWithDetails.map((team, index) => ({
      ...team,
      rank: index + 1,
      badge: index < 3 ? ["🥇", "🥈", "🥉"][index] : null,
    }))
  } catch (error) {
    console.error("Error in getTeamLeaderboard:", error)
    return []
  }
}

export async function searchUsers(query: string) {
  const cookieStore = cookies()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => cookieStore.set(name, value, options),
      remove: (name, options) => cookieStore.set(name, "", { ...options, maxAge: 0 }),
    },
  })

  // Use admin client for more reliable data access
  const adminClient = createAdminClient()

  try {
    const { data, error } = await adminClient
      .from("users")
      .select("id, full_name, email, avatar_url, total_points, current_tier")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order("total_points", { ascending: false })
      .limit(10)

    if (error) throw error

    // Ensure all users have names
    return data.map((user) => ({
      ...user,
      full_name: user.full_name || generateNameFromEmail(user.email),
    }))
  } catch (error) {
    console.error("Error searching users:", error)
    throw error
  }
}

export async function searchTeams(query: string) {
  const cookieStore = cookies()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => cookieStore.set(name, value, options),
      remove: (name, options) => cookieStore.set(name, "", { ...options, maxAge: 0 }),
    },
  })

  // Use admin client for more reliable data access
  const adminClient = createAdminClient()

  try {
    const { data, error } = await adminClient
      .from("teams")
      .select("id, name, total_points, banner_url")
      .ilike("name", `%${query}%`)
      .order("total_points", { ascending: false })
      .limit(10)

    if (error) throw error

    // For each team, get the count of members and calculate average points
    const teamsWithDetails = await Promise.all(
      data.map(async (team) => {
        // Get member count
        const { count, error: countError } = await adminClient
          .from("users")
          .select("id", { count: "exact" })
          .eq("team_id", team.id)

        if (countError) throw countError

        // Get all team members to calculate average points
        const { data: members, error: membersError } = await adminClient
          .from("users")
          .select("total_points")
          .eq("team_id", team.id)

        if (membersError) throw membersError

        // Calculate average points per member
        const totalMemberPoints = members?.reduce((sum, member) => sum + member.total_points, 0) || 0
        const avgPoints = members && members.length > 0 ? Math.round(totalMemberPoints / members.length) : 0

        return {
          ...team,
          members: count || 0,
          avg_points: avgPoints,
        }
      }),
    )

    return teamsWithDetails
  } catch (error) {
    console.error("Error searching teams:", error)
    throw error
  }
}
