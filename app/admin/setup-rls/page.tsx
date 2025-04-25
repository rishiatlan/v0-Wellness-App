"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function SetupRLSPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const setupRLS = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Enable RLS on daily_logs table
      const { error: enableRLSError } = await supabase.rpc("execute_sql", {
        sql_query: "ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;",
      })

      if (enableRLSError) throw enableRLSError

      // Create policy for users to view their own logs
      const { error: viewPolicyError } = await supabase.rpc("execute_sql", {
        sql_query: `
          DROP POLICY IF EXISTS "Users can view their own logs" ON daily_logs;
          CREATE POLICY "Users can view their own logs"
          ON daily_logs
          FOR SELECT
          USING (auth.uid() = user_id);
        `,
      })

      if (viewPolicyError) throw viewPolicyError

      // Create policy for users to insert their own logs
      const { error: insertPolicyError } = await supabase.rpc("execute_sql", {
        sql_query: `
          DROP POLICY IF EXISTS "Users can insert their own logs" ON daily_logs;
          CREATE POLICY "Users can insert their own logs"
          ON daily_logs
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
        `,
      })

      if (insertPolicyError) throw insertPolicyError

      // Create policy for users to delete their own logs
      const { error: deletePolicyError } = await supabase.rpc("execute_sql", {
        sql_query: `
          DROP POLICY IF EXISTS "Users can delete their own logs" ON daily_logs;
          CREATE POLICY "Users can delete their own logs"
          ON daily_logs
          FOR DELETE
          USING (auth.uid() = user_id);
        `,
      })

      if (deletePolicyError) throw deletePolicyError

      // Create policy for service role to manage all logs
      const { error: servicePolicyError } = await supabase.rpc("execute_sql", {
        sql_query: `
          DROP POLICY IF EXISTS "Service role can manage all logs" ON daily_logs;
          CREATE POLICY "Service role can manage all logs"
          ON daily_logs
          USING (auth.jwt() ->> 'role' = 'service_role');
        `,
      })

      if (servicePolicyError) throw servicePolicyError

      setResult({
        success: true,
        message: "RLS policies set up successfully!",
      })
    } catch (error: any) {
      console.error("Error setting up RLS:", error)
      setResult({
        success: false,
        message: `Error setting up RLS: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Setup Row Level Security</CardTitle>
          <CardDescription>
            Configure RLS policies for the daily_logs table to allow users to manage their own logs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className={result.success ? "bg-green-50 dark:bg-green-900/20" : ""}
            >
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={setupRLS} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Setting up RLS..." : "Setup RLS Policies"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
