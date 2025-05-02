"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"
import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/utils/supabase/service"
import { createServiceRoleClient as createServiceRoleClientNew } from "@/lib/server-auth"

export async function getTeams() {
  try {
    const serviceClient = await createServiceRoleClientNew()

    const { data, error } = await serviceClient.from("teams").select("*").order("name")

    if (error) {
      console.error("Error fetching teams:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error in getTeams:", error)
    return { success: false, error: error.message }
  }
}

export async function getUserTeam(userId: string) {
  if (!userId) {
    return { success: false, error: "User ID is required" }
  }

  try {
    const serviceClient = await createServiceRoleClientNew()

    // Get user with team
    const { data: user, error: userError } = await serviceClient
      .from("users")
      .select("team_id")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Error fetching user team ID:", userError)
      return { success: false, error: userError.message }
    }

    if (!user.team_id) {
      return { success: true, data: null }
    }

    // Get team details
    const { data: team, error: teamError } = await serviceClient
      .from("teams")
      .select("*")
      .eq("id", user.team_id)
      .single()

    if (teamError) {
      console.error("Error fetching team details:", teamError)
      return { success: false, error: teamError.message }
    }

    return { success: true, data: team }
  } catch (error: any) {
    console.error("Error in getUserTeam:", error)
    return { success: false, error: error.message }
  }
}

export async function getTeamMembers(teamId: string) {
  if (!teamId) {
    return { success: false, error: "Team ID is required" }
  }

  try {
    const serviceClient = await createServiceRoleClientNew()

    const { data, error } = await serviceClient
      .from("users")
      .select("id, full_name, email, total_points")
      .eq("team_id", teamId)
      .order("total_points", { ascending: false })

    if (error) {
      console.error("Error fetching team members:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error in getTeamMembers:", error)
    return { success: false, error: error.message }
  }
}

export async function assignUserToTeam(userId: string, teamId: string) {
  if (!userId || !teamId) {
    return { success: false, error: "User ID and Team ID are required" }
  }

  try {
    const serviceClient = await createServiceRoleClientNew()

    const { error } = await serviceClient.from("users").update({ team_id: teamId }).eq("id", userId)

    if (error) {
      console.error("Error assigning user to team:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    revalidatePath("/team-challenge")
    return { success: true }
  } catch (error: any) {
    console.error("Error in assignUserToTeam:", error)
    return { success: false, error: error.message }
  }
}

export async function createTeam(name: string, description: string) {
  if (!name) {
    return { success: false, error: "Team name is required" }
  }

  try {
    const serviceClient = await createServiceRoleClientNew()

    const { data, error } = await serviceClient.from("teams").insert({ name, description }).select().single()

    if (error) {
      console.error("Error creating team:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error in createTeam:", error)
    return { success: false, error: error.message }
  }
}

export async function updateTeam(id: string, name: string, description: string) {
  if (!id || !name) {
    return { success: false, error: "Team ID and name are required" }
  }

  try {
    const serviceClient = await createServiceRoleClientNew()

    const { error } = await serviceClient.from("teams").update({ name, description }).eq("id", id)

    if (error) {
      console.error("Error updating team:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    revalidatePath("/team-challenge")
    return { success: true }
  } catch (error: any) {
    console.error("Error in updateTeam:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteTeam(id: string) {
  if (!id) {
    return { success: false, error: "Team ID is required" }
  }

  try {
    const serviceClient = await createServiceRoleClientNew()

    // First, remove team_id from all users in this team
    const { error: userUpdateError } = await serviceClient.from("users").update({ team_id: null }).eq("team_id", id)

    if (userUpdateError) {
      console.error("Error removing users from team:", userUpdateError)
      return { success: false, error: userUpdateError.message }
    }

    // Then delete the team
    const { error } = await serviceClient.from("teams").delete().eq("id", id)

    if (error) {
      console.error("Error deleting team:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("Error in deleteTeam:", error)
    return { success: false, error: error.message }
  }
}

export async function joinTeam(userId: string, teamId: string) {
  const supabase = createServerActionClient<Database>({ cookies })

  try {
    const { error } = await supabase.from("users").update({ team_id: teamId }).eq("id", userId)

    if (error) {
      console.error("Error joining team:", error)
      throw new Error("Failed to join team")
    }

    revalidatePath("/team-challenge")
    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Exception in joinTeam:", error)
    return { success: false, error: "Failed to join team" }
  }
}

export async function leaveTeam(userId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    // Get user's current team
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("team_id")
      .eq("id", userId)
      .maybeSingle()

    if (userError) throw userError

    if (!user?.team_id) {
      return { success: false, error: "You are not a member of any team" }
    }

    // Update user's team_id to null
    const { error: updateError } = await supabase.from("users").update({ team_id: null }).eq("id", userId)

    if (updateError) throw updateError

    revalidatePath("/team-challenge")
    return { success: true }
  } catch (error: any) {
    console.error("Error leaving team:", error)
    return { success: false, error: error.message }
  }
}

export async function assignRandomTeam(userId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    // Check if user already has a team
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("team_id")
      .eq("id", userId)
      .maybeSingle()

    if (userError) throw userError

    if (userData?.team_id) {
      return { success: false, error: "You are already a member of a team" }
    }

    // Find teams with less than 5 members
    const { data: teams, error: teamsError } = await supabase.from("teams").select("id")

    if (teamsError) throw teamsError

    const availableTeams = []

    // Check each team's member count
    for (const team of teams || []) {
      const { count, error: countError } = await supabase
        .from("users")
        .select("id", { count: "exact" })
        .eq("team_id", team.id)

      if (countError) throw countError

      if (count < 5) {
        availableTeams.push(team.id)
      }
    }

    // If no available teams, create a new one
    if (availableTeams.length === 0) {
      const teamName = `Team ${Math.floor(Math.random() * 1000)}`
      return createTeam(userId, teamName)
    }

    // Randomly select a team
    const randomTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)]

    // Update user's team_id
    const { error: updateError } = await supabase.from("users").update({ team_id: randomTeam }).eq("id", userId)

    if (updateError) throw updateError

    revalidatePath("/team-challenge")
    return { success: true, teamId: randomTeam }
  } catch (error: any) {
    console.error("Error assigning random team:", error)
    return { success: false, error: error.message }
  }
}

export async function updateTeamBanner(teamId: string, bannerUrl: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const { error } = await supabase.from("teams").update({ banner_url: bannerUrl }).eq("id", teamId)

    if (error) throw error

    revalidatePath("/team-challenge")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating team banner:", error)
    return { success: false, error: error.message }
  }
}

export async function uploadTeamImage(teamId: string, file: File) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    // Create a unique file name
    const fileName = `team-${teamId}-${Date.now()}`
    const fileExt = file.name.split(".").pop()
    const fullPath = `team-banners/${fileName}.${fileExt}`

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage.from("team-images").upload(fullPath, file)

    if (error) throw error

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from("team-images").getPublicUrl(fullPath)

    // Update the team's banner_url
    const { error: updateError } = await supabase
      .from("teams")
      .update({ banner_url: publicUrlData.publicUrl })
      .eq("id", teamId)

    if (updateError) throw updateError

    revalidatePath("/team-challenge")
    return { success: true, url: publicUrlData.publicUrl }
  } catch (error: any) {
    console.error("Error uploading team image:", error)
    return { success: false, error: error.message }
  }
}

export async function getTeamAchievements(teamId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const { data, error } = await supabase
      .from("team_achievements")
      .select("*")
      .eq("team_id", teamId)
      .order("achieved_at", { ascending: false })

    if (error) throw error

    return data || []
  } catch (error: any) {
    console.error("Error fetching team achievements:", error)
    throw new Error(`Error fetching team achievements: ${error.message}`)
  }
}

export async function getWellnessWednesdays(teamId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const { data, error } = await supabase
      .from("wellness_wednesday")
      .select("*")
      .eq("team_id", teamId)
      .order("date", { ascending: false })

    if (error) throw error

    return data || []
  } catch (error: any) {
    console.error("Error fetching wellness wednesdays:", error)
    throw new Error(`Error fetching wellness wednesdays: ${error.message}`)
  }
}

export async function calculateTeamDailyScore(teamId: string, date: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Get all team members
    const { data: members, error: membersError } = await serviceClient.from("users").select("id").eq("team_id", teamId)

    if (membersError) throw membersError
    if (!members || members.length === 0) return 0

    // Get daily points for each member
    let totalPoints = 0
    for (const member of members) {
      const { data: logs, error: logsError } = await serviceClient
        .from("daily_logs")
        .select("points")
        .eq("user_id", member.id)
        .eq("log_date", date)

      if (logsError) throw logsError

      if (logs) {
        totalPoints += logs.reduce((sum, log) => sum + log.points, 0)
      }
    }

    // Calculate average
    return Math.round(totalPoints / members.length)
  } catch (error: any) {
    console.error("Error calculating team daily score:", error)
    return 0
  }
}

export async function calculateTeamCumulativeScore(teamId: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Get all team members
    const { data: members, error: membersError } = await serviceClient.from("users").select("id").eq("team_id", teamId)

    if (membersError) throw membersError
    if (!members || members.length === 0) return 0

    // Get total points for each member
    let totalPoints = 0
    for (const member of members) {
      const { data: user, error: userError } = await serviceClient
        .from("users")
        .select("total_points")
        .eq("id", member.id)
        .single()

      if (userError) throw userError

      if (user) {
        totalPoints += user.total_points
      }
    }

    // Calculate average
    return Math.round(totalPoints / members.length)
  } catch (error: any) {
    console.error("Error calculating team cumulative score:", error)
    return 0
  }
}

// Updated function to check for Wellness Wednesday bonus
// Now requires exactly 5 team members, each with 30+ points, and awards 25 bonus points
export async function checkWellnessWednesdayBonus(teamId: string, date: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Check if the date is a Wednesday
    const checkDate = new Date(date)
    if (checkDate.getDay() !== 3) {
      // 0 is Sunday, 3 is Wednesday
      return { success: false, message: "Wellness Wednesday bonus only applies on Wednesdays" }
    }

    // Get all team members
    const { data: teamMembers, error: membersError } = await serviceClient
      .from("users")
      .select("id")
      .eq("team_id", teamId)

    if (membersError || !teamMembers) {
      console.error("Error fetching team members:", membersError)
      return { success: false, message: "Failed to check team members" }
    }

    // Check if team has exactly 5 members
    if (teamMembers.length !== 5) {
      return {
        success: false,
        message: `Team needs exactly 5 members for the bonus (currently has ${teamMembers.length})`,
      }
    }

    // Check if all members earned at least 30 points on this day
    const memberIds = teamMembers.map((member) => member.id)

    // Get the total points for each member on this specific day
    const { data: dailyPoints, error: pointsError } = await serviceClient
      .from("daily_logs")
      .select("user_id, points")
      .in("user_id", memberIds)
      .eq("log_date", date)

    if (pointsError) {
      console.error("Error fetching daily points:", pointsError)
      return { success: false, message: "Failed to check daily points" }
    }

    // Calculate total points per user for this day
    const userPointsMap = new Map()
    dailyPoints?.forEach((log) => {
      const currentPoints = userPointsMap.get(log.user_id) || 0
      userPointsMap.set(log.user_id, currentPoints + log.points)
    })

    // Check if all 5 members earned at least 30 points
    const allMembersQualified = memberIds.every((id) => {
      const points = userPointsMap.get(id) || 0
      return points >= 30
    })

    if (!allMembersQualified) {
      return {
        success: false,
        message: "All team members must earn at least 30 points on Wednesday for the bonus",
      }
    }

    // Check if this Wednesday bonus has already been awarded
    const { data: existingBonus, error: existingBonusError } = await serviceClient
      .from("wellness_wednesday")
      .select("id")
      .eq("team_id", teamId)
      .eq("date", date)
      .maybeSingle()

    if (existingBonusError) {
      console.error("Error checking existing bonus:", existingBonusError)
      return { success: false, message: "Failed to check if bonus was already awarded" }
    }

    if (existingBonus) {
      return { success: false, message: "Wellness Wednesday bonus has already been awarded for this date" }
    }

    // Apply the 25-point bonus to the team
    const { error: updateError } = await serviceClient
      .from("teams")
      .update({ total_points: serviceClient.rpc("increment", { x: 25 }) })
      .eq("id", teamId)

    if (updateError) {
      console.error("Error applying team bonus:", updateError)
      return { success: false, message: "Failed to apply team bonus" }
    }

    // Record the bonus in the wellness_wednesday table
    const { error: recordError } = await serviceClient.from("wellness_wednesday").insert({
      team_id: teamId,
      date: date,
      bonus_achieved: true,
      bonus_points: 25,
    })

    if (recordError) {
      console.error("Error recording bonus:", recordError)
      // Even if recording fails, the bonus was still applied
    }

    return {
      success: true,
      message: "Wellness Wednesday bonus of 25 points applied to the team!",
    }
  } catch (error) {
    console.error("Exception in checkWellnessWednesdayBonus:", error)
    return { success: false, message: "An error occurred while checking for the bonus" }
  }
}

export async function getTeamRank(teamId: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Get all teams ordered by points
    const { data: teams, error } = await serviceClient
      .from("teams")
      .select("id, total_points")
      .order("total_points", { ascending: false })

    if (error) throw error

    if (!teams || teams.length === 0) {
      return { rank: 0, totalTeams: 0 }
    }

    // Find the rank of the specified team
    const teamIndex = teams.findIndex((t) => t.id === teamId)

    if (teamIndex === -1) {
      return { rank: 0, totalTeams: teams.length }
    }

    return {
      rank: teamIndex + 1,
      totalTeams: teams.length,
      pointsToNextRank: teamIndex > 0 ? teams[teamIndex - 1].total_points - teams[teamIndex].total_points : 0,
    }
  } catch (error: any) {
    console.error("Error getting team rank:", error)
    return { rank: 0, totalTeams: 0, error: error.message }
  }
}

export async function getTopTeams(limit = 5) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase
      .from("teams")
      .select("id, name, total_points")
      .order("total_points", { ascending: false })
      .limit(limit)

    if (error) {
      return []
    }

    return data
  } catch (error) {
    console.error("Error fetching top teams:", error)
    return []
  }
}

// Update the getAllTeamsWithMembers function to be more robust
export async function getAllTeamsWithMembers() {
  try {
    // Use the service role client for more reliable access
    const serviceClient = createServiceRoleClient()
    console.log("Fetching teams with service role client")

    // First, get all teams
    const { data: teams, error: teamsError } = await serviceClient
      .from("teams")
      .select("id, name, total_points, banner_url")
      .order("total_points", { ascending: false })

    // Handle errors explicitly
    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      return [] // Return empty array instead of throwing
    }

    // If no teams found, return empty array
    if (!teams || teams.length === 0) {
      console.log("No teams found")
      return []
    }

    console.log(`Found ${teams.length} teams, now fetching members`)

    // Process each team to get its members
    const teamsWithMembers = []

    for (const team of teams) {
      try {
        // Get members for this team
        const { data: members, error: membersError } = await serviceClient
          .from("users")
          .select("id, full_name, email, total_points, avatar_url")
          .eq("team_id", team.id)

        // Add team with its members to the result array
        teamsWithMembers.push({
          ...team,
          members: membersError ? [] : members || [],
          memberCount: membersError ? 0 : members?.length || 0,
        })
      } catch (memberError) {
        console.error(`Error processing members for team ${team.id}:`, memberError)
        // Still add the team, but without members
        teamsWithMembers.push({
          ...team,
          members: [],
          memberCount: 0,
        })
      }
    }

    console.log(`Successfully processed ${teamsWithMembers.length} teams with their members`)
    return teamsWithMembers
  } catch (error) {
    console.error("Error in getAllTeamsWithMembers:", error)
    return [] // Return empty array instead of throwing
  }
}

export async function sendTeamInvite(teamId: string, inviterUserId: string, inviteeEmail: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Verify the team exists
    const { data: team, error: teamError } = await serviceClient.from("teams").select("name").eq("id", teamId).single()

    if (teamError) throw teamError

    if (!team) {
      return { success: false, error: "Team not found" }
    }

    // Check if team is full (5 members max)
    const { count: memberCount, error: countError } = await serviceClient
      .from("users")
      .select("id", { count: "exact" })
      .eq("team_id", teamId)

    if (countError) throw countError

    if (memberCount >= 5) {
      return { success: false, error: "Team is already full (5 members maximum)" }
    }

    // Get inviter details
    const { data: inviter, error: inviterError } = await serviceClient
      .from("users")
      .select("full_name, email")
      .eq("id", inviterUserId)
      .single()

    if (inviterError) throw inviterError

    // Check if invitee exists
    const { data: invitee, error: inviteeError } = await serviceClient
      .from("users")
      .select("id, team_id")
      .eq("email", inviteeEmail)
      .maybeSingle()

    if (inviteeError) throw inviteeError

    if (!invitee) {
      return { success: false, error: "User not found with that email" }
    }

    if (invitee.team_id) {
      return { success: false, error: "User is already a member of a team" }
    }

    // For simplicity, we'll directly add the user to the team
    const { error: updateError } = await serviceClient.from("users").update({ team_id: teamId }).eq("id", invitee.id)

    if (updateError) throw updateError

    revalidatePath("/team-challenge")

    return {
      success: true,
      message: `${inviteeEmail} has been added to ${team.name}`,
    }
  } catch (error: any) {
    console.error("Error sending team invite:", error)
    return { success: false, error: error.message }
  }
}

export async function removeTeamMember(teamId: string, adminUserId: string, memberId: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Verify the admin user exists and has admin privileges
    const { data: adminUser, error: adminError } = await serviceClient
      .from("admin_users")
      .select("id")
      .eq("user_id", adminUserId)
      .maybeSingle()

    if (adminError || !adminUser) {
      return { success: false, error: "Only administrators can remove team members" }
    }

    // Verify the member is part of the team
    const { data: member, error: memberError } = await serviceClient
      .from("users")
      .select("team_id")
      .eq("id", memberId)
      .eq("team_id", teamId)
      .maybeSingle()

    if (memberError) throw memberError

    if (!member) {
      return { success: false, error: "User is not a member of this team" }
    }

    // Remove the member from the team
    const { error: updateError } = await serviceClient.from("users").update({ team_id: null }).eq("id", memberId)

    if (updateError) throw updateError

    revalidatePath("/team-challenge")

    return {
      success: true,
      message: "Member removed from team",
    }
  } catch (error: any) {
    console.error("Error removing team member:", error)
    return { success: false, error: error.message }
  }
}

// Simplified version without creator_id
export async function transferTeamOwnership(teamId: string, adminUserId: string, newOwnerId: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Verify the admin user exists and has admin privileges
    const { data: adminUser, error: adminError } = await serviceClient
      .from("admin_users")
      .select("id")
      .eq("user_id", adminUserId)
      .maybeSingle()

    if (adminError || !adminUser) {
      return { success: false, error: "Only administrators can transfer team ownership" }
    }

    // Verify the new owner is part of the team
    const { data: newOwner, error: newOwnerError } = await serviceClient
      .from("users")
      .select("team_id")
      .eq("id", newOwnerId)
      .eq("team_id", teamId)
      .maybeSingle()

    if (newOwnerError) throw newOwnerError

    if (!newOwner) {
      return { success: false, error: "New owner is not a member of this team" }
    }

    revalidatePath("/team-challenge")

    return {
      success: true,
      message: "Team ownership transferred successfully",
    }
  } catch (error: any) {
    console.error("Error transferring team ownership:", error)
    return { success: false, error: error.message }
  }
}
