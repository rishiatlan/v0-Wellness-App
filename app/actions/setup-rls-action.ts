"use server"

import { createServiceRoleClient } from "@/lib/server-auth"

export async function setupRLSPolicies() {
  const serviceClient = createServiceRoleClient()
  const results = {
    success: true,
    tables: {} as Record<string, { enabled: boolean; policies: string[] }>,
    errors: [] as string[],
  }

  try {
    // List of tables that need RLS
    const tables = ["users", "daily_logs", "activities", "teams", "team_members"]

    for (const table of tables) {
      try {
        results.tables[table] = { enabled: false, policies: [] }

        // Enable RLS on table
        await serviceClient.rpc("execute_sql", {
          sql_query: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`,
        })
        results.tables[table].enabled = true

        // Set up policies based on table
        switch (table) {
          case "users":
            await setupUsersPolicies(serviceClient, results)
            break
          case "daily_logs":
            await setupDailyLogsPolicies(serviceClient, results)
            break
          case "activities":
            await setupActivitiesPolicies(serviceClient, results)
            break
          case "teams":
            await setupTeamsPolicies(serviceClient, results)
            break
          case "team_members":
            await setupTeamMembersPolicies(serviceClient, results)
            break
        }
      } catch (error: any) {
        results.success = false
        results.errors.push(`Error setting up RLS for ${table}: ${error.message}`)
      }
    }

    return results
  } catch (error: any) {
    console.error("Error setting up RLS policies:", error)
    return {
      success: false,
      error: error.message,
      tables: results.tables,
      errors: [...results.errors, error.message],
    }
  }
}

async function setupUsersPolicies(serviceClient: any, results: any) {
  // Users can view their own profile
  await serviceClient.rpc("execute_sql", {
    sql_query: `
      DROP POLICY IF EXISTS "Users can view own profile" ON users;
      CREATE POLICY "Users can view own profile"
      ON users
      FOR SELECT
      USING (auth.uid() = id);
    `,
  })
  results.tables.users.policies.push("Users can view own profile")

  // Users can update their own profile
  await serviceClient.rpc("execute_sql", {
    sql_query: `
      DROP POLICY IF EXISTS "Users can update own profile" ON users;
      CREATE POLICY "Users can update own profile"
      ON users
      FOR UPDATE
      USING (auth.uid() = id);
    `,
  })
  results.tables.users.policies.push("Users can update own profile")

  // Service role can do everything
  await serviceClient.rpc("execute_sql", {
    sql_query: `
      DROP POLICY IF EXISTS "Service role can do everything" ON users;
      CREATE POLICY "Service role can do everything"
      ON users
      USING (auth.role() = 'service_role');
    `,
  })
  results.tables.users.policies.push("Service role can do everything")
}

async function setupDailyLogsPolicies(serviceClient: any, results: any) {
  // Users can view their own logs
  await serviceClient.rpc("execute_sql", {
    sql_query: `
      DROP POLICY IF EXISTS "Users can view their own logs" ON daily_logs;
      CREATE POLICY "Users can view their own logs"
      ON daily_logs
      FOR SELECT
      USING (auth.uid() = user_id);
    `,
  })
  results.tables.daily_logs.policies.push("Users can view their own logs")

  // Users can insert their own logs
  await serviceClient.rpc("execute_sql", {
    sql_query: `
      DROP POLICY IF EXISTS "Users can insert their own logs" ON daily_logs;
      CREATE POLICY "Users can insert their own logs"
      ON daily_logs
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    `,
  })
  results.tables.daily_logs.policies.push("Users can insert their own logs")

  // Users can delete their own logs
  await serviceClient.rpc("execute_sql", {
    sql_query: `
      DROP POLICY IF EXISTS "Users can delete their own logs" ON daily_logs;
      CREATE POLICY "Users can delete their own logs"
      ON daily_logs
      FOR DELETE
      USING (auth.uid() = user_id);
    `,
  })
  results.tables.daily_logs.policies.push("Users can delete their own logs")

  // Service role can manage all logs
  await serviceClient.rpc("execute_sql", {
    sql_query: `
      DROP POLICY IF EXISTS "Service role can manage all logs" ON daily_logs;
      CREATE POLICY "Service role can manage all logs"
      ON daily_logs
      USING (auth.role() = 'service_role');
    `,
  })
  results.tables.daily_logs.policies.push("Service role can manage all logs")
}

async function setupActivitiesPolicies(serviceClient: any, results: any) {
  // Everyone can view activities
  await serviceClient.rpc("execute_sql", {
    sql_query: `
      DROP POLICY IF EXISTS "Everyone can view activities" ON activities;
      CREATE POLICY "Everyone can view activities"
      ON activities
      FOR SELECT
      USING (true);
    `,
  })
  results.tables.activities.policies.push("Everyone can view activities")

  // Only service role can modify activities
  await serviceClient.rpc("execute_sql", {
    sql_query: `
      DROP POLICY IF EXISTS "Only service role can modify activities" ON activities;
      CREATE POLICY "Only service role can modify activities"
      ON activities
      FOR ALL
      USING (auth.role() = 'service_role');
    `,
  })
  results.tables.activities.policies.push("Only service role can modify activities")
}

async function setupTeamsPolicies(serviceClient: any, results: any) {
  // Everyone can view teams
  await serviceClient.rpc("execute_sql", {
    sql_query: `
      DROP POLICY IF EXISTS "Everyone can view teams" ON teams;
      CREATE POLICY "Everyone can view teams"
      ON teams
      FOR SELECT
      USING (true);
    `,
  })
  results.tables.teams.policies.push("Everyone can view teams")

  // Team creators can update their teams
  await serviceClient.rpc("execute_sql", {
    sql_query: `
      DROP POLICY IF EXISTS "Team creators can update their teams" ON teams;
      CREATE POLICY "Team creators can update their teams"
      ON teams
      FOR UPDATE
      USING (auth.uid() = created_by);
    `,
  })
  results.tables.teams.policies.push("Team creators can update their teams")

  // Service role can do everything with teams
  await serviceClient.rpc("execute_sql", {
    sql_query: `
      DROP POLICY IF EXISTS "Service role can do everything with teams" ON teams;
      CREATE POLICY "Service role can do everything with teams"
      ON teams
      USING (auth.role() = 'service_role');
    `,
  })
  results.tables.teams.policies.push("Service role can do everything with teams")
}

async function setupTeamMembersPolicies(serviceClient: any, results: any) {
  // Users can view team members
  await serviceClient.rpc("execute_sql", {
    sql_query: `
      DROP POLICY IF EXISTS "Users can view team members" ON team_members;
      CREATE POLICY "Users can view team members"
      ON team_members
      FOR SELECT
      USING (true);
    `,
  })
  results.tables.team_members.policies.push("Users can view team members")

  // Service role can do everything with team members
  await serviceClient.rpc("execute_sql", {
    sql_query: `
      DROP POLICY IF EXISTS "Service role can do everything with team members" ON team_members;
      CREATE POLICY "Service role can do everything with team members"
      ON team_members
      USING (auth.role() = 'service_role');
    `,
  })
  results.tables.team_members.policies.push("Service role can do everything with team members")
}

// Export a function to run this on app startup
export async function ensureRLSPolicies() {
  try {
    const result = await setupRLSPolicies()
    console.log("RLS policies setup result:", result)
    return result
  } catch (error) {
    console.error("Failed to set up RLS policies:", error)
    return { success: false, error }
  }
}
