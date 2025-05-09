"use server"

import { createServiceRoleClient } from "@/lib/server-auth"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

// Make sure to import INITIAL_ADMIN_EMAILS at the top of the file
import { INITIAL_ADMIN_EMAILS } from "@/lib/admin-utils"

export async function getCurrentUser() {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    console.error("Server: Session error:", error)
    return null
  }

  return session.user
}

// Simplified and more robust admin verification
export async function verifyAdmin() {
  try {
    const user = await getCurrentUser()

    if (!user || !user.email) {
      console.error("Server: No user found or user has no email")
      return false
    }

    console.log("Server: Checking admin status for:", user.email)

    // CRITICAL FIX: Always check INITIAL_ADMIN_EMAILS first and make it case-insensitive
    const userEmailLower = user.email.toLowerCase()
    const isInitialAdmin = INITIAL_ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === userEmailLower)

    if (isInitialAdmin) {
      console.log("Server: User is in INITIAL_ADMIN_EMAILS:", user.email)
      return true
    }

    // If not in initial list, check the database
    try {
      const serviceClient = createServiceRoleClient()

      // Simple direct query with case-insensitive comparison
      const { data, error } = await serviceClient
        .from("admin_users")
        .select("*")
        .ilike("email", user.email)
        .maybeSingle()

      if (error) {
        console.error("Server: Admin verification error:", error)
        return false
      }

      if (data) {
        console.log("Server: User found in admin_users table:", user.email)
        return true
      }
    } catch (error) {
      console.error("Server: Error checking admin_users table:", error)
      // Fall back to initial admin list if database check fails
      return isInitialAdmin
    }

    console.log("Server: User is not an admin:", user.email)
    return false
  } catch (error) {
    console.error("Server: Admin verification exception:", error)
    return false
  }
}

// Get all users
export async function getAllUsers() {
  try {
    const user = await getCurrentUser()
    if (!user || !(await verifyAdmin())) {
      throw new Error("Unauthorized: Admin access required")
    }

    const serviceClient = createServiceRoleClient()
    const { data, error } = await serviceClient.from("users").select("*").order("full_name")

    if (error) throw error

    return data || []
  } catch (error: any) {
    console.error("Error fetching all users:", error)
    throw new Error(`Failed to fetch users: ${error.message}`)
  }
}

// Get all teams with member count
export async function getAllTeams() {
  try {
    const user = await getCurrentUser()
    if (!user || !(await verifyAdmin())) {
      throw new Error("Unauthorized: Admin access required")
    }

    const serviceClient = createServiceRoleClient()

    // Get all teams
    const { data: teams, error } = await serviceClient.from("teams").select("*").order("name")

    if (error) throw error

    // Get member count for each team
    const teamsWithMemberCount = await Promise.all(
      (teams || []).map(async (team) => {
        const { count, error: countError } = await serviceClient
          .from("users")
          .select("id", { count: "exact" })
          .eq("team_id", team.id)

        if (countError) throw countError

        return {
          ...team,
          member_count: count || 0,
        }
      }),
    )

    return teamsWithMemberCount
  } catch (error: any) {
    console.error("Error fetching all teams:", error)
    throw new Error(`Failed to fetch teams: ${error.message}`)
  }
}

// Reset a user (remove from team, reset points)
export async function resetUser(userId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !(await verifyAdmin())) {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    const serviceClient = createServiceRoleClient()

    // Get user details first
    const { data: userData, error: userError } = await serviceClient
      .from("users")
      .select("email, full_name")
      .eq("id", userId)
      .single()

    if (userError) throw userError

    // Reset user
    const { error } = await serviceClient
      .from("users")
      .update({
        team_id: null,
        total_points: 0,
        current_tier: 0,
        current_streak: 0,
      })
      .eq("id", userId)

    if (error) throw error

    // Delete user's daily logs
    const { error: logsError } = await serviceClient.from("daily_logs").delete().eq("user_id", userId)

    if (logsError) throw logsError

    // Delete user's achievements
    const { error: achievementsError } = await serviceClient.from("user_achievements").delete().eq("user_id", userId)

    if (achievementsError) throw achievementsError

    revalidatePath("/admin")
    revalidatePath("/team-challenge")
    revalidatePath("/leaderboard")

    return {
      success: true,
      email: userData.email,
      name: userData.full_name,
    }
  } catch (error: any) {
    console.error("Error resetting user:", error)
    return { success: false, error: error.message }
  }
}

// Delete a user
export async function deleteUser(userId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !(await verifyAdmin())) {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    const serviceClient = createServiceRoleClient()

    // Get user details first
    const { data: userData, error: userError } = await serviceClient
      .from("users")
      .select("email, full_name")
      .eq("id", userId)
      .single()

    if (userError) throw userError

    // Delete user's daily logs
    const { error: logsError } = await serviceClient.from("daily_logs").delete().eq("user_id", userId)

    if (logsError) throw logsError

    // Delete user's achievements
    const { error: achievementsError } = await serviceClient.from("user_achievements").delete().eq("user_id", userId)

    if (achievementsError) throw achievementsError

    // Remove user from any team
    const { error: updateError } = await serviceClient.from("users").update({ team_id: null }).eq("id", userId)

    if (updateError) throw updateError

    // Delete the user
    const { error } = await serviceClient.from("users").delete().eq("id", userId)

    if (error) throw error

    revalidatePath("/admin")
    revalidatePath("/team-challenge")
    revalidatePath("/leaderboard")

    return {
      success: true,
      email: userData.email,
      name: userData.full_name,
    }
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return { success: false, error: error.message }
  }
}

// Reset a team (remove all members, reset points)
export async function resetTeam(teamId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !(await verifyAdmin())) {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    const serviceClient = createServiceRoleClient()

    // Get team details first
    const { data: team, error: teamError } = await serviceClient.from("teams").select("name").eq("id", teamId).single()

    if (teamError) throw teamError

    // Remove all members from the team
    const { error: updateError } = await serviceClient.from("users").update({ team_id: null }).eq("team_id", teamId)

    if (updateError) throw updateError

    // Reset team points
    const { error } = await serviceClient.from("teams").update({ total_points: 0 }).eq("id", teamId)

    if (error) throw error

    // Delete team achievements
    const { error: achievementsError } = await serviceClient.from("team_achievements").delete().eq("team_id", teamId)

    if (achievementsError) throw achievementsError

    // Delete wellness wednesday records
    const { error: wednesdayError } = await serviceClient.from("wellness_wednesday").delete().eq("team_id", teamId)

    if (wednesdayError) throw wednesdayError

    revalidatePath("/admin")
    revalidatePath("/team-challenge")
    revalidatePath("/leaderboard")

    return {
      success: true,
      name: team.name,
    }
  } catch (error: any) {
    console.error("Error resetting team:", error)
    return { success: false, error: error.message }
  }
}

// Delete a team
export async function deleteTeam(teamId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !(await verifyAdmin())) {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    const serviceClient = createServiceRoleClient()

    // Get team details first
    const { data: team, error: teamError } = await serviceClient.from("teams").select("name").eq("id", teamId).single()

    if (teamError) throw teamError

    // Remove all members from the team
    const { error: updateError } = await serviceClient.from("users").update({ team_id: null }).eq("team_id", teamId)

    if (updateError) throw updateError

    // Delete team achievements
    const { error: achievementsError } = await serviceClient.from("team_achievements").delete().eq("team_id", teamId)

    if (achievementsError) throw achievementsError

    // Delete wellness wednesday records
    const { error: wednesdayError } = await serviceClient.from("wellness_wednesday").delete().eq("team_id", teamId)

    if (wednesdayError) throw wednesdayError

    // Delete the team
    const { error } = await serviceClient.from("teams").delete().eq("id", teamId)

    if (error) throw error

    revalidatePath("/admin")
    revalidatePath("/team-challenge")
    revalidatePath("/leaderboard")

    return {
      success: true,
      name: team.name,
    }
  } catch (error: any) {
    console.error("Error deleting team:", error)
    return { success: false, error: error.message }
  }
}

// Create a new team
export async function createTeam(teamName: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !(await verifyAdmin())) {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    const serviceClient = createServiceRoleClient()

    // Create new team
    const { data, error } = await serviceClient
      .from("teams")
      .insert({
        name: teamName,
        total_points: 0,
        creator_id: user.id, // Set the creator to the admin
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin")
    revalidatePath("/team-challenge")
    revalidatePath("/leaderboard")

    return {
      success: true,
      name: teamName,
      id: data.id,
    }
  } catch (error: any) {
    console.error("Error creating team:", error)
    return { success: false, error: error.message }
  }
}

// Get all admin users
export async function getAdminUsers() {
  try {
    const serviceClient = await createServiceRoleClient()

    const { data, error } = await serviceClient.from("admin_users").select("*")

    if (error) {
      console.error("Error fetching admin users:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error in getAdminUsers:", error)
    return { success: false, error: error.message }
  }
}

// Add a new admin user
export async function addAdminUser(email: string) {
  try {
    const serviceClient = await createServiceRoleClient()

    // Check if user already exists
    const { data: existingUser, error: checkError } = await serviceClient
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking if admin user exists:", checkError)
      return { success: false, error: checkError.message }
    }

    if (existingUser) {
      return { success: false, error: "User is already an admin" }
    }

    // Add user to admin_users table
    const { error } = await serviceClient.from("admin_users").insert({ email })

    if (error) {
      console.error("Error adding admin user:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("Error in addAdminUser:", error)
    return { success: false, error: error.message }
  }
}

// Remove admin privileges
export async function removeAdminUser(email: string) {
  try {
    const serviceClient = await createServiceRoleClient()

    const { error } = await serviceClient.from("admin_users").delete().eq("email", email)

    if (error) {
      console.error("Error removing admin user:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("Error in removeAdminUser:", error)
    return { success: false, error: error.message }
  }
}

// Add user to team
export async function addUserToTeam(userId: string, teamId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !(await verifyAdmin())) {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    const serviceClient = createServiceRoleClient()

    // Get user and team details
    const [userResult, teamResult] = await Promise.all([
      serviceClient.from("users").select("email, full_name").eq("id", userId).single(),
      serviceClient.from("teams").select("name").eq("id", teamId).single(),
    ])

    if (userResult.error) throw userResult.error
    if (teamResult.error) throw teamResult.error

    // Update user's team
    const { error } = await serviceClient.from("users").update({ team_id: teamId }).eq("id", userId)

    if (error) throw error

    revalidatePath("/admin")
    revalidatePath("/team-challenge")

    return {
      success: true,
      userName: userResult.data.full_name || userResult.data.email,
      teamName: teamResult.data.name,
    }
  } catch (error: any) {
    console.error("Error adding user to team:", error)
    return { success: false, error: error.message }
  }
}

// Remove user from team
export async function removeUserFromTeam(userId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !(await verifyAdmin())) {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    const serviceClient = createServiceRoleClient()

    // Get user details
    const { data: userData, error: userError } = await serviceClient
      .from("users")
      .select("email, full_name")
      .eq("id", userId)
      .single()

    if (userError) throw userError

    // Update user's team to null
    const { error } = await serviceClient.from("users").update({ team_id: null }).eq("id", userId)

    if (error) throw error

    revalidatePath("/admin")
    revalidatePath("/team-challenge")

    return {
      success: true,
      userName: userData.full_name || userData.email,
    }
  } catch (error: any) {
    console.error("Error removing user from team:", error)
    return { success: false, error: error.message }
  }
}

// Check if user is admin
export async function checkIsAdmin(email: string) {
  try {
    const serviceClient = createServiceRoleClient()

    const { data, error } = await serviceClient
      .from("admin_users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle()

    if (error) throw error

    return { isAdmin: !!data }
  } catch (error: any) {
    console.error("Error checking admin status:", error)
    return { isAdmin: false, error: error.message }
  }
}

// Add a new user
export async function addUser(email: string, fullName: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !(await verifyAdmin())) {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    // Check if email is valid
    if (!email || !email.includes("@atlan.com")) {
      return { success: false, error: "Only @atlan.com email addresses are allowed" }
    }

    const serviceClient = createServiceRoleClient()

    // Check if user already exists
    const { data: existingUser, error: checkError } = await serviceClient
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (checkError) throw checkError

    if (existingUser) {
      return { success: false, error: "User with this email already exists" }
    }

    // Create new user
    const { data, error } = await serviceClient
      .from("users")
      .insert({
        email: email,
        full_name: fullName || email.split("@")[0],
        total_points: 0,
        current_tier: 0,
        current_streak: 0,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin")

    return {
      success: true,
      user: data,
    }
  } catch (error: any) {
    console.error("Error adding user:", error)
    return { success: false, error: error.message }
  }
}

export async function isUserAdmin(email: string): Promise<boolean> {
  if (!email) return false

  try {
    const serviceClient = await createServiceRoleClient()

    const { data, error } = await serviceClient.from("admin_users").select("*").eq("email", email).maybeSingle()

    if (error) {
      console.error("Error checking if user is admin:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error in isUserAdmin:", error)
    return false
  }
}
