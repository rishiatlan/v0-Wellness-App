"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function AdminDebugButton() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const checkAdminStatus = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    setResult(null)

    try {
      const response = await fetch("/api/debug-admin")
      const data = await response.json()

      if (response.ok) {
        setResult(data)

        // Check if user is an admin based on the debug results
        const isAdmin =
          data.initialAdminCheck.isInitialAdmin ||
          data.adminTableChecks.exactMatch.found ||
          data.adminTableChecks.caseInsensitive.found ||
          (data.adminTableChecks.sqlQuery.result && data.adminTableChecks.sqlQuery.result.length > 0) ||
          data.adminTableChecks.isAdminFunction.result

        if (isAdmin) {
          setSuccess("You are an admin according to at least one check method.")
        } else {
          setError("You are not an admin according to any check method.")
        }
      } else {
        setError(data.error || "Failed to check admin status")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const setupAdminTable = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    setResult(null)

    try {
      const response = await fetch("/api/setup-admin")
      const data = await response.json()

      if (response.ok) {
        setResult(data)
        setSuccess("Admin table setup completed. Check the results for details.")
      } else {
        setError(data.error || "Failed to set up admin table")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-4 mt-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Admin Debug Tools</h3>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button onClick={checkAdminStatus} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Check Admin Status
        </Button>

        <Button onClick={setupAdminTable} disabled={loading} variant="outline">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Setup Admin Table
        </Button>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-muted rounded-lg overflow-auto max-h-96">
          <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
