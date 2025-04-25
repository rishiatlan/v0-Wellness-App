"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
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

export async function getTeams() {
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
    const { data, error } = await supabase.from("teams").select("*").order("total_points", { ascending: false })

    if (error) throw error

    return data || []
  } catch (error: any) {
    console.error("Error fetching teams:", error)
    throw new Error(`Error fetching teams: ${error.message}`)
  }
}

export async function getUserTeam(userId: string) {
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
    // Get user with team_id
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("team_id")
      .eq("id", userId)
      .maybeSingle()

    if (userError) {
      console.error("Error fetching user team_id:", userError)
      throw userError
    }

    // If user has no team or user doesn't exist, return null
    if (!user || !user.team_id) {
      console.log("User has no team:", userId)
      return null
    }

    // Get team details
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("*, creator_id")
      .eq("id", user.team_id)
      .maybeSingle()

    if (teamError) {
      console.error("Error fetching team details:", teamError)
      throw teamError
    }

    // If team doesn't exist (shouldn't happen, but just in case), return null
    if (!team) {
      console.log("Team not found for team_id:", user.team_id)
      return null
    }

    // Get team members
    const { data: members, error: membersError } = await supabase
      .from("users")
      .select("id, full_name, email, avatar_url, total_points")
      .eq("team_id", user.team_id)

    if (membersError) {
      console.error("Error fetching team members:", membersError)
      throw membersError
    }

    // Calculate team stats
    const avgPoints =
      members && members.length > 0
        ? Math.round(members.reduce((sum, member) => sum + member.total_points, 0) / members.length)
        : 0

    return {
      ...team,
      members: members || [],
      avgPoints,
      memberCount: members?.length || 0,
      isFull: (members?.length || 0) >= 5,
      isCreator: team.creator_id === userId,
    }
  } catch (error: any) {
    console.error("Error in getUserTeam:", error)
    throw new Error(`Error fetching team data: ${error.message}`)
  }
}

export async function createTeam(userId: string, teamName: string, bannerUrl?: string) {
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

export async function joinTeam(userId: string, teamId: string) {
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

    // Check if team exists
    const { data: team, error: teamError } = await supabase.from("teams").select("id").eq("id", teamId).maybeSingle()

    if (teamError) throw teamError

    if (!team) {
      return { success: false, error: "Team not found" }
    }

    // Check if team is full (5 members max)
    const { count: memberCount, error: countError } = await supabase
      .from("users")
      .select("id", { count: "exact" })
      .eq("team_id", teamId)

    if (countError) throw countError

    if (memberCount >= 5) {
      return { success: false, error: "Team is already full (5 members maximum)" }
    }

    // Update user's team_id
    const { error: updateError } = await supabase.from("users").update({ team_id: teamId }).eq("id", userId)

    if (updateError) throw updateError

    revalidatePath("/team-challenge")
    return { success: true, teamId }
  } catch (error: any) {
    console.error("Error joining team:", error)
    return { success: false, error: error.message }
  }
}

export async function leaveTeam(userId: string) {
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

export async function checkWellnessWednesdayBonus(teamId: string, date: string) {
  const serviceClient = createServiceRoleClient()

  try {
    // Verify it's a Wednesday
    const checkDate = new Date(date)
    if (checkDate.getDay() !== 3) {
      return { eligible: false, reason: "Not a Wednesday" }
    }

    // Get all team members
    const { data: members, error: membersError } = await serviceClient.from("users").select("id").eq("team_id", teamId)

    if (membersError) throw membersError

    if (!members || members.length < 5) {
      return { eligible: false, reason: "Team needs 5 members" }
    }

    // Check if all members have at least 20 points for the day
    const memberResults = []

    for (const member of members) {
      const { data: logs, error: logsError } = await serviceClient
        .from("daily_logs")
        .select("points")
        .eq("user_id", member.id)
        .eq("log_date", date)

      if (logsError) throw logsError

      const memberPoints = logs ? logs.reduce((sum, log) => sum + log.points, 0) : 0

      memberResults.push({
        userId: member.id,
        points: memberPoints,
        hasEnoughPoints: memberPoints >= 20,
      })
    }

    const allMembersHaveEnoughPoints = memberResults.every((m) => m.hasEnoughPoints)

    if (!allMembersHaveEnoughPoints) {
      return {
        eligible: false,
        reason: "Not all members have 20+ points",
        membersMissing: true,
        memberResults,
      }
    }

    // Check if bonus was already awarded for this date
    const { data: existingBonus, error: existingError } = await serviceClient
      .from("wellness_wednesday")
      .select("*")
      .eq("team_id", teamId)
      .eq("date", date)
      .maybeSingle()

    if (existingError) throw existingError

    if (existingBonus) {
      return {
        eligible: true,
        alreadyAwarded: true,
        bonusPoints: existingBonus.bonus_points,
      }
    }

    // Award bonus points (10 per member)
    const bonusPoints = members.length * 10

    // Record the bonus
    const { error: insertError } = await serviceClient.from("wellness_wednesday").insert({
      team_id: teamId,
      date: date,
      bonus_achieved: true,
      bonus_points: bonusPoints,
    })

    if (insertError) throw insertError

    // Add achievement
    const { error: achievementError } = await serviceClient.from("team_achievements").insert({
      team_id: teamId,
      achievement_type: "WEDNESDAY_BONUS",
      achievement_description: "Wellness Wednesday Bonus",
      points_awarded: bonusPoints,
    })

    if (achievementError) throw achievementError

    // Update team points
    const { data: team, error: teamError } = await serviceClient
      .from("teams")
      .select("total_points")
      .eq("id", teamId)
      .single()

    if (teamError) throw teamError

    const { error: updateError } = await serviceClient
      .from("teams")
      .update({ total_points: (team?.total_points || 0) + bonusPoints })
      .eq("id", teamId)

    if (updateError) throw updateError

    revalidatePath("/team-challenge")

    return { eligible: true, bonusPoints, memberResults }
  } catch (error: any) {
    console.error("Error checking Wellness Wednesday bonus:", error)
    return { eligible: false, error: error.message }
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

export async function getTopTeams(limit = 20) {
  const serviceClient = createServiceRoleClient()

  try {
    // Get top teams by points
    const { data: teams, error } = await serviceClient
      .from("teams")
      .select("id, name, banner_url, total_points")
      .order("total_points", { ascending: false })
      .limit(limit)

    if (error) throw error

    if (!teams || teams.length === 0) {
      return []
    }

    // Get member count for each team
    const teamsWithMemberCount = await Promise.all(
      teams.map(async (team) => {
        const { count, error: countError } = await serviceClient
          .from("users")
          .select("id", { count: "exact" })
          .eq("team_id", team.id)

        if (countError) throw countError

        return {
          ...team,
          members: count || 0,
        }
      }),
    )

    return teamsWithMemberCount
  } catch (error: any) {
    console.error("Error getting top teams:", error)
    return []
  }
}

// Add a new function to get all teams with their members
export async function getAllTeamsWithMembers() {
  const serviceClient = createServiceRoleClient()

  try {
    // Get all teams - don't select creator_id since it might not exist yet
    const { data: teams, error } = await serviceClient
      .from("teams")
      .select("id, name, banner_url, total_points")
      .order("total_points", { ascending: false })

    if (error) throw error

    if (!teams || teams.length === 0) {
      return []
    }

    // Get members for each team
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const { data: members, error: membersError } = await serviceClient
          .from("users")
          .select("id, full_name, email, avatar_url, total_points")
          .eq("team_id", team.id)

        if (membersError) throw membersError

        // Try to find the creator (first member) if creator_id doesn't exist
        let creator_id = null
        if (members && members.length > 0) {
          creator_id = members[0].id // Use first member as fallback creator
        }

        return {
          ...team,
          creator_id, // Add creator_id from our calculation
          members: members || [],
          memberCount: members?.length || 0,
        }
      }),
    )

    return teamsWithMembers
  } catch (error: any) {
    console.error("Error getting all teams with members:", error)
    return []
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

    // Check if team is full
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

    // Create team invitation record
    // Note: In a real app, you would send an email or notification here
    // For this demo, we'll just create a record in the database

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
