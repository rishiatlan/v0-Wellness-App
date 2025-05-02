"use server"

import { createServiceRoleClient } from "@/lib/server-auth"
import { generateNameFromEmail } from "@/lib/utils"

export async function getLeaderboardData(limit = 100) {
  try {
    const serviceClient = await createServiceRoleClient()

    // Get top users by points
    const { data: users, error } = await serviceClient
      .from("users")
      .select("id, full_name, email, total_points, current_tier, avatar_url")
      .order("total_points", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching leaderboard data:", error)
      return { success: false, error: "Failed to fetch leaderboard data" }
    }

    // Format the data for display
    const formattedUsers = users.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      full_name: user.full_name || generateNameFromEmail(user.email),
      email: user.email,
      total_points: user.total_points,
      current_tier: user.current_tier,
      avatar_url: user.avatar_url,
    }))

    return { success: true, data: formattedUsers }
  } catch (error: any) {
    console.error("Error in getLeaderboardData:", error)
    return { success: false, error: error.message }
  }
}

export async function getIndividualLeaderboard(limit = 100) {
  try {
    const serviceClient = await createServiceRoleClient()

    const { data, error } = await serviceClient
      .from("users")
      .select("id, full_name, email, total_points, current_tier, avatar_url")
      .order("total_points", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching individual leaderboard:", error)
      return []
    }

    return data || []
  } catch (error: any) {
    console.error("Error in getIndividualLeaderboard:", error)
    return []
  }
}

export async function getTeamLeaderboard(limit = 20) {
  try {
    const serviceClient = await createServiceRoleClient()

    const { data, error } = await serviceClient
      .from("teams")
      .select("id, name, total_points, banner_url")
      .order("total_points", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching team leaderboard:", error)
      return []
    }

    return data || []
  } catch (error: any) {
    console.error("Error in getTeamLeaderboard:", error)
    return []
  }
}

export async function searchUsers(query: string) {
  try {
    const serviceClient = await createServiceRoleClient()

    const { data, error } = await serviceClient
      .from("users")
      .select("id, full_name, email, total_points, current_tier, avatar_url")
      .ilike("full_name", `%${query}%`)
      .order("total_points", { ascending: false })
      .limit(5)

    if (error) {
      console.error("Error searching users:", error)
      return []
    }

    return data || []
  } catch (error: any) {
    console.error("Error in searchUsers:", error)
    return []
  }
}

export async function searchTeams(query: string) {
  try {
    const serviceClient = await createServiceRoleClient()

    const { data, error } = await serviceClient
      .from("teams")
      .select("id, name, total_points, banner_url")
      .ilike("name", `%${query}%`)
      .order("total_points", { ascending: false })
      .limit(5)

    if (error) {
      console.error("Error searching teams:", error)
      return []
    }

    return data || []
  } catch (error: any) {
    console.error("Error in searchTeams:", error)
    return []
  }
}
