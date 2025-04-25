"use server"

import { createServiceRoleClient } from "@/lib/server-auth"

export async function setupRLSPolicies() {
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

    return { success: true }
  } catch (error) {
    console.error("Error setting up RLS policies:", error)
    return { success: false, error: "Failed to set up RLS policies" }
  }
}
