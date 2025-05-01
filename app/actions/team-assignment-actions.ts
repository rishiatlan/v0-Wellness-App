"use server"

import { createServiceRoleClient } from "@/utils/supabase/service"
import { revalidatePath } from "next/cache"

interface TeamAssignment {
  team_name: string
  full_name: string
  email: string
}

export async function assignTeamsFromCSV(assignments: TeamAssignment[]) {
  try {
    const serviceClient = createServiceRoleClient()

    // Create a temporary table and insert the assignments
    await serviceClient.rpc("execute_sql", {
      sql_query: `
        -- Create temporary table
        CREATE TEMP TABLE temp_team_assignments (
          team_name TEXT,
          full_name TEXT,
          email TEXT
        );
      `,
    })

    // Insert assignments in batches
    const batchSize = 100
    for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize)

      // Build the insert query
      let insertQuery = "INSERT INTO temp_team_assignments (team_name, full_name, email) VALUES "
      const values = batch
        .map(
          (a, index) =>
            `('${a.team_name.replace(/'/g, "''")}', '${a.full_name.replace(/'/g, "''")}', '${a.email.replace(/'/g, "''")}')`,
        )
        .join(", ")

      insertQuery += values + ";"

      await serviceClient.rpc("execute_sql", { sql_query: insertQuery })
    }

    // Execute the assignment function
    await serviceClient.rpc("execute_sql", {
      sql_query: `
        -- Call the function to assign users to teams
        SELECT assign_users_to_teams();
        
        -- Special cases
        -- Remove Sucharita from team
        UPDATE users
        SET team_id = NULL
        WHERE email = 'sucharita.tuer@atlan.com';
        
        -- Clean up
        DROP TABLE temp_team_assignments;
      `,
    })

    revalidatePath("/team-challenge")
    revalidatePath("/admin")

    return { success: true }
  } catch (error: any) {
    console.error("Error assigning teams from CSV:", error)
    return { success: false, error: error.message }
  }
}

export async function manuallyAssignUserToTeam(email: string, teamName: string) {
  try {
    const serviceClient = createServiceRoleClient()

    // Get team ID
    const { data: teamData, error: teamError } = await serviceClient
      .from("teams")
      .select("id")
      .eq("name", teamName)
      .maybeSingle()

    if (teamError) {
      console.error("Error getting team:", teamError)
      return { success: false, error: teamError.message }
    }

    if (!teamData) {
      // Create the team if it doesn't exist
      const { data: newTeam, error: createError } = await serviceClient
        .from("teams")
        .insert({ name: teamName, total_points: 0 })
        .select()
        .single()

      if (createError) {
        console.error("Error creating team:", createError)
        return { success: false, error: createError.message }
      }

      // Update user's team_id
      const { error: updateError } = await serviceClient
        .from("users")
        .update({ team_id: newTeam.id })
        .eq("email", email)

      if (updateError) {
        console.error("Error updating user team:", updateError)
        return { success: false, error: updateError.message }
      }
    } else {
      // Update user's team_id
      const { error: updateError } = await serviceClient
        .from("users")
        .update({ team_id: teamData.id })
        .eq("email", email)

      if (updateError) {
        console.error("Error updating user team:", updateError)
        return { success: false, error: updateError.message }
      }
    }

    revalidatePath("/team-challenge")
    revalidatePath("/admin")

    return { success: true }
  } catch (error: any) {
    console.error("Error manually assigning user to team:", error)
    return { success: false, error: error.message }
  }
}

export async function removeUserFromTeam(email: string) {
  try {
    const serviceClient = createServiceRoleClient()

    // Update user's team_id to null
    const { error } = await serviceClient.from("users").update({ team_id: null }).eq("email", email)

    if (error) {
      console.error("Error removing user from team:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/team-challenge")
    revalidatePath("/admin")

    return { success: true }
  } catch (error: any) {
    console.error("Error removing user from team:", error)
    return { success: false, error: error.message }
  }
}
