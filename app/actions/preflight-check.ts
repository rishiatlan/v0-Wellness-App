"use server"

import { createServiceRoleClient } from "@/lib/server-auth"

export async function runPreflightChecks(userId: string) {
  const serviceClient = createServiceRoleClient()
  const results = {
    userExists: false,
    activitiesExist: false,
    rlsPoliciesSet: false,
    streakCalculationWorks: false,
    pointsCalculationWorks: false,
    issues: [] as string[],
    fixes: [] as string[],
  }

  try {
    // 1. Check if user exists
    const { data: user, error: userError } = await serviceClient
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (userError) {
      results.issues.push(`Error checking user: ${userError.message}`)
    } else if (!user) {
      results.issues.push("User does not exist in the database")
    } else {
      results.userExists = true
    }

    // 2. Check if activities exist
    const { data: activities, error: activitiesError } = await serviceClient.from("activities").select("count").limit(1)

    if (activitiesError) {
      results.issues.push(`Error checking activities: ${activitiesError.message}`)
    } else if (!activities || activities.length === 0) {
      results.issues.push("No activities found in the database")
    } else {
      results.activitiesExist = true
    }

    // 3. Check RLS policies
    try {
      const { data: policies, error: policiesError } = await serviceClient.rpc("execute_sql", {
        sql_query: "SELECT * FROM pg_policies WHERE tablename = 'daily_logs';",
      })

      if (policiesError) {
        results.issues.push(`Error checking RLS policies: ${policiesError.message}`)
      } else if (!policies || policies.length < 4) {
        results.issues.push("RLS policies not properly set up for daily_logs table")
        // Fix RLS policies
        await setupRLSPolicies()
        results.fixes.push("RLS policies have been set up")
      } else {
        results.rlsPoliciesSet = true
      }
    } catch (rlsError: any) {
      results.issues.push(`Error checking RLS policies: ${rlsError.message}`)
    }

    // 4. Test streak calculation
    if (results.userExists) {
      try {
        const { recalculateUserStreak } = await import("@/app/actions/streak-actions")
        const streakResult = await recalculateUserStreak(userId)

        if (streakResult.success) {
          results.streakCalculationWorks = true
        } else {
          results.issues.push(`Streak calculation failed: ${streakResult.error}`)
        }
      } catch (streakError: any) {
        results.issues.push(`Error testing streak calculation: ${streakError.message}`)
      }
    }

    // 5. Test points calculation
    if (results.userExists) {
      try {
        const { recalculateUserPoints } = await import("@/app/actions/user-actions")
        const pointsResult = await recalculateUserPoints(userId)

        if (pointsResult.success) {
          results.pointsCalculationWorks = true
        } else {
          results.issues.push(`Points calculation failed: ${pointsResult.error}`)
        }
      } catch (pointsError: any) {
        results.issues.push(`Error testing points calculation: ${pointsError.message}`)
      }
    }

    return {
      success: results.issues.length === 0,
      results,
    }
  } catch (error: any) {
    console.error("Error running pre-flight checks:", error)
    return {
      success: false,
      error: error.message,
      results,
    }
  }
}

// Helper function to set up RLS policies
async function setupRLSPolicies() {
  const serviceClient = createServiceRoleClient()

  try {
    // Enable RLS on daily_logs table
    await serviceClient.rpc("execute_sql", {
      sql_query: "ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;",
    })

    // Create policy for users to view their own logs
    await serviceClient.rpc("execute_sql", {
      sql_query: `
        DROP POLICY IF EXISTS "Users can view their own logs" ON daily_logs;
        CREATE POLICY "Users can view their own logs"
        ON daily_logs
        FOR SELECT
        USING (auth.uid() = user_id);
      `,
    })

    // Create policy for users to insert their own logs
    await serviceClient.rpc("execute_sql", {
      sql_query: `
        DROP POLICY IF EXISTS "Users can insert their own logs" ON daily_logs;
        CREATE POLICY "Users can insert their own logs"
        ON daily_logs
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
      `,
    })

    // Create policy for users to delete their own logs
    await serviceClient.rpc("execute_sql", {
      sql_query: `
        DROP POLICY IF EXISTS "Users can delete their own logs" ON daily_logs;
        CREATE POLICY "Users can delete their own logs"
        ON daily_logs
        FOR DELETE
        USING (auth.uid() = user_id);
      `,
    })

    // Create policy for service role to manage all logs
    await serviceClient.rpc("execute_sql", {
      sql_query: `
        DROP POLICY IF EXISTS "Service role can manage all logs" ON daily_logs;
        CREATE POLICY "Service role can manage all logs"
        ON daily_logs
        USING (auth.role() = 'service_role');
      `,
    })

    return true
  } catch (error) {
    console.error("Error setting up RLS policies:", error)
    return false
  }
}
