"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { INITIAL_ADMIN_EMAILS } from "@/lib/admin-utils"

export function DebugAdmin() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkAdminStatus = async () => {
    if (!user?.email) {
      setError("No user email found")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Check if user is in INITIAL_ADMIN_EMAILS
      const isInInitialList = INITIAL_ADMIN_EMAILS.some(
        (adminEmail) => adminEmail.toLowerCase() === user.email?.toLowerCase(),
      )

      // Check cached admin list
      let isInCachedList = false
      let cachedAdmins: string[] = []
      try {
        const cached = localStorage.getItem("admin_emails")
        if (cached) {
          cachedAdmins = JSON.parse(cached)
          isInCachedList = cachedAdmins.some((adminEmail) => adminEmail.toLowerCase() === user.email?.toLowerCase())
        }
      } catch (e) {
        console.error("Error checking cached admin list:", e)
      }

      // Check admin_users table
      const response = await fetch("/api/debug-admin")
      const data = await response.json()

      setResult({
        email: user.email,
        isInInitialList,
        isInCachedList,
        cachedAdmins,
        databaseCheck: data,
      })
    } catch (err: any) {
      console.error("Error checking admin status:", err)
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const forceSetAdmin = async () => {
    if (!user?.email) {
      setError("No user email found")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/setup-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          message: "Admin status set successfully",
          details: data,
        })

        // Update cached admin list
        try {
          const cached = localStorage.getItem("admin_emails")
          const cachedAdmins: string[] = cached ? JSON.parse(cached) : []

          if (!cachedAdmins.includes(user.email.toLowerCase())) {
            cachedAdmins.push(user.email.toLowerCase())
            localStorage.setItem("admin_emails", JSON.stringify(cachedAdmins))
          }
        } catch (e) {
          console.error("Error updating cached admin list:", e)
        }
      } else {
        setError(data.error || "Failed to set admin status")
      }
    } catch (err: any) {
      console.error("Error setting admin status:", err)
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Debug Tools</CardTitle>
        <CardDescription>Troubleshoot admin access issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <pre className="mt-2 w-full overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Button onClick={checkAdminStatus} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Check Admin Status
          </Button>

          <Button onClick={forceSetAdmin} disabled={loading} variant="secondary" className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Force Set Admin Status
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
