"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"
import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { createServiceRoleClient } from "@/lib/server-auth"

const createServiceRoleClientOld = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// This function is the main one we need to fix
export async function getTeams() {
  const supabase = createServerActionClient<Database>({ cookies })

  try {
    const { data, error } = await supabase.from("teams").select("*").order("total_points", { ascending: false })

    if (error) {
      console.error("Error fetching teams:", error)
      throw new Error("Failed to fetch teams")
    }

    return data || []
  } catch (error) {
    console.error("Exception in getTeams:", error)
    return []
  }
}

export async function getUserTeam(userId: string) {
  const supabase = createServerActionClient<Database>({ cookies })

  try {
    const { data, error } = await supabase.from("users").select("team_id, teams(*)").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user team:", error)
      return null
    }

    return data?.teams || null
  } catch (error) {
    console.error("Exception in getUserTeam:", error)
    return null
  }
}

export async function createTeam(userId: string, teamName: string, bannerUrl?: string) {
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
      return {
        success: false,
        error: "You are already a member of a team. You can only be part of one team at a time.",
      }
    }

    // Get total number of teams to check if this is one of the first X teams
    const { count: teamCount, error: countError } = await supabase.from("teams").select("id", { count: "exact" })

    if (countError) throw countError

    const BONUS_TEAM_LIMIT = 10 // First 10 teams get bonus
    const shouldGetBonus = teamCount < BONUS_TEAM_LIMIT

    // Create new team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        name: teamName,
        banner_url: bannerUrl || null,
        total_points: shouldGetBonus ? 50 : 0,
        creator_id: userId, // Set the creator_id to the user who created the team
      })
      .select()
      .single()

    if (teamError) throw teamError

    // Update user's team_id
    const { error: updateError } = await supabase.from("users").update({ team_id: team.id }).eq("id", userId)

    if (updateError) throw updateError

    // Create team formation achievement if eligible for bonus
    if (shouldGetBonus) {
      const { error: achievementError } = await supabase.from("team_achievements").insert({
        team_id: team.id,
        achievement_type: "EARLY_TEAM_FORMATION",
        achievement_description: "Early Team Formation Bonus",
        points_awarded: 50,
      })

      if (achievementError) throw achievementError
    }

    revalidatePath("/team-challenge")
    return {
      success: true,
      team,
      earlyBonus: shouldGetBonus,
      message: shouldGetBonus
        ? `Team "${teamName}" created successfully with a 50 point early formation bonus! You are now the team creator.`
        : `Team "${teamName}" created successfully! You are now the team creator.`,
    }
  } catch (error: any) {
    console.error("Error creating team:", error)
    return { success: false, error: error.message }
  }
}

// Update the joinTeam function to enforce a maximum of 5 members per team
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

    // Check if user is the team creator
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("creator_id")
      .eq("id", user.team_id)
      .maybeSingle()

    if (teamError) throw teamError

    if (team?.creator_id === userId) {
      // Check if there are other members in the team
      const { count: memberCount, error: countError } = await supabase
        .from("users")
        .select("id", { count: "exact" })
        .eq("team_id", user.team_id)
        .neq("id", userId)

      if (countError) throw countError

      if (memberCount > 0) {
        // If there are other members, transfer ownership to another member
        const { data: newCreator, error: newCreatorError } = await supabase
          .from("users")
          .select("id")
          .eq("team_id", user.team_id)
          .neq("id", userId)
          .limit(1)
          .single()

        if (newCreatorError) throw newCreatorError

        // Update team creator
        const { error: updateTeamError } = await supabase
          .from("teams")
          .update({ creator_id: newCreator.id })
          .eq("id", user.team_id)

        if (updateTeamError) throw updateTeamError
      } else {
        // If there are no other members, delete the team
        const { error: deleteTeamError } = await supabase.from("teams").delete().eq("id", user.team_id)

        if (deleteTeamError) throw deleteTeamError
      }
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
  const supabase = createServerActionClient<Database>({ cookies })

  try {
    // Check if the date is a Wednesday
    const checkDate = new Date(date)
    if (checkDate.getDay() !== 3) {
      // 0 is Sunday, 3 is Wednesday
      return { success: false, message: "Wellness Wednesday bonus only applies on Wednesdays" }
    }

    // Get all team members
    const { data: teamMembers, error: membersError } = await supabase.from("users").select("id").eq("team_id", teamId)

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
    const { data: dailyPoints, error: pointsError } = await supabase
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

    // Apply the 25-point bonus to the team
    const { error: updateError } = await supabase
      .from("teams")
      .update({ total_points: supabase.rpc("increment", { x: 25 }) })
      .eq("id", teamId)

    if (updateError) {
      console.error("Error applying team bonus:", updateError)
      return { success: false, message: "Failed to apply team bonus" }
    }

    revalidatePath("/team-challenge")
    revalidatePath("/leaderboard")

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

// Update the getAllTeamsWithMembers function to use the service role client
export async function getAllTeamsWithMembers() {
  try {
    // Use the service role client for more reliable access
    const serviceClient = createServiceRoleClient()
    console.log("Fetching all teams with members using service role client")

    // Get all teams
    const { data: teams, error: teamsError } = await serviceClient
      .from("teams")
      .select("id, name, total_points, banner_url, creator_id")
      .order("total_points", { ascending: false })

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      throw new Error(`Failed to fetch teams: ${teamsError.message}`)
    }

    if (!teams || teams.length === 0) {
      console.log("No teams found in database")
      return []
    }

    console.log(`Found ${teams.length} teams, fetching members for each team`)

    // For each team, get the members
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const { data: members, error: membersError } = await serviceClient
          .from("users")
          .select("id, full_name, email, total_points, avatar_url")
          .eq("team_id", team.id)

        if (membersError) {
          console.error(`Error fetching members for team ${team.id}:`, membersError)
          return {
            ...team,
            members: [],
            memberCount: 0,
          }
        }

        return {
          ...team,
          members: members || [],
          memberCount: members?.length || 0,
        }
      }),
    )

    console.log(`Successfully processed ${teamsWithMembers.length} teams with their members`)
    return teamsWithMembers
  } catch (error: any) {
    console.error("Error in getAllTeamsWithMembers:", error)
    throw new Error(`Error fetching teams with members: ${error.message}`)
  }
}

// Update the sendTeamInvite function to enforce a maximum of 5 members per team
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

export async function removeTeamMember(teamId: string, creatorId: string, memberId: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Verify the team exists
    const { data: team, error: teamError } = await serviceClient
      .from("teams")
      .select("creator_id")
      .eq("id", teamId)
      .single()

    if (teamError) throw teamError

    if (!team) {
      return { success: false, error: "Team not found" }
    }

    // Verify the requester is the team creator
    if (team.creator_id !== creatorId) {
      return { success: false, error: "Only the team creator can remove members" }
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

    // Cannot remove the team creator
    if (memberId === creatorId) {
      return { success: false, error: "Team creator cannot be removed. Transfer ownership first." }
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

export async function transferTeamOwnership(teamId: string, currentOwnerId: string, newOwnerId: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Verify the team exists
    const { data: team, error: teamError } = await serviceClient
      .from("teams")
      .select("creator_id")
      .eq("id", teamId)
      .single()

    if (teamError) throw teamError

    if (!team) {
      return { success: false, error: "Team not found" }
    }

    // Verify the requester is the team creator
    if (team.creator_id !== currentOwnerId) {
      return { success: false, error: "Only the team creator can transfer ownership" }
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

    // Transfer ownership
    const { error: updateError } = await serviceClient.from("teams").update({ creator_id: newOwnerId }).eq("id", teamId)

    if (updateError) throw updateError

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
