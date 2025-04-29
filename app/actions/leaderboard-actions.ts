"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createServiceRoleClient } from "@/lib/server-auth"

// Helper function to generate a name if one doesn't exist
function generateNameFromEmail(email: string): string {
  if (!email) return "Unknown User"

  // Extract name from email
  const namePart = email.split("@")[0]

  // Handle user-xxx@atlan.com format
  if (namePart.startsWith("user-")) {
    return "Atlan User " + namePart.substring(5, 9)
  }

  // Format standard email
  return namePart
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export async function getIndividualLeaderboard() {
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

  try {
    const { data, error } = await serviceClient
      .from("users")
      .select("id, full_name, email, avatar_url, total_points, current_tier")
      .order("total_points", { ascending: false })
      .limit(50)

    if (error) throw error

    // Ensure all users have names and add rank to each user
    return data.map((user, index) => ({
      ...user,
      full_name: user.full_name || generateNameFromEmail(user.email),
      rank: index + 1,
      badge: index < 3 ? ["🥇", "🥈", "🥉"][index] : null,
    }))
  } catch (error) {
    console.error("Error fetching individual leaderboard:", error)
    throw error
  }
}

export async function getTeamLeaderboard() {
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

  try {
    // Get teams with total points
    const { data: teams, error: teamsError } = await serviceClient
      .from("teams")
      .select("id, name, total_points, banner_url")
      .order("total_points", { ascending: false })
      .limit(20)

    if (teamsError) throw teamsError

    // For each team, get the count of members and calculate average points
    const teamsWithDetails = await Promise.all(
      teams.map(async (team) => {
        // Get member count
        const { count, error: countError } = await serviceClient
          .from("users")
          .select("id", { count: "exact" })
          .eq("team_id", team.id)

        if (countError) throw countError

        // Get all team members to calculate average points
        const { data: members, error: membersError } = await serviceClient
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

    // Add rank and badge to each team
    return teamsWithDetails.map((team, index) => ({
      ...team,
      rank: index + 1,
      badge: index < 3 ? ["🥇", "🥈", "🥉"][index] : null,
    }))
  } catch (error) {
    console.error("Error fetching team leaderboard:", error)
    throw error
  }
}

export async function searchUsers(query: string) {
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

  try {
    const { data, error } = await serviceClient
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

  try {
    const { data, error } = await serviceClient
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
        const { count, error: countError } = await serviceClient
          .from("users")
          .select("id", { count: "exact" })
          .eq("team_id", team.id)

        if (countError) throw countError

        // Get all team members to calculate average points
        const { data: members, error: membersError } = await serviceClient
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
