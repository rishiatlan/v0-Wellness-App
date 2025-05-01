"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function AuthDebugPage() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [cookies, setCookies] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState<any>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true)

        // Get current user
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        setUser(userData.user)

        // Get current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        setSession(sessionData.session)

        // Get cookies (limited to what JS can access)
        const availableCookies = document.cookie.split(";").map((c) => c.trim())
        setCookies(availableCookies)
      } catch (err: any) {
        console.error("Auth debug error:", err)
        setError(err.message || "Failed to check authentication")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase])

  const runDbTest = async () => {
    try {
      // Simple test query to check if DB access works
      const { data, error } = await supabase.from("users").select("id, email").limit(1)

      if (error) throw error

      setTestResult({
        success: true,
        message: "Successfully queried database",
        data,
      })
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to query database",
        error: err,
      })
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>

      {loading ? (
        <div className="flex items-center justify-center p-10">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <Tabs defaultValue="session">
          <TabsList className="mb-4">
            <TabsTrigger value="session">Session</TabsTrigger>
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="cookies">Cookies</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="session">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Session Info
                  {session ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800">
                      Missing
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Current authentication session details</CardDescription>
              </CardHeader>
              <CardContent>
                {session ? (
                  <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                ) : (
                  <Alert variant="destructive">
                    <AlertTitle>No active session</AlertTitle>
                    <AlertDescription>
                      No authentication session was found. This means you are not logged in or the session is invalid.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  User Info
                  {user ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Found
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800">
                      Missing
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Current authenticated user details</CardDescription>
              </CardHeader>
              <CardContent>
                {user ? (
                  <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96">{JSON.stringify(user, null, 2)}</pre>
                ) : (
                  <Alert variant="destructive">
                    <AlertTitle>No user found</AlertTitle>
                    <AlertDescription>
                      No authenticated user was found. This means you are not logged in or the authentication is
                      invalid.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cookies">
            <Card>
              <CardHeader>
                <CardTitle>Cookies</CardTitle>
                <CardDescription>Browser cookies (limited to JavaScript accessible ones)</CardDescription>
              </CardHeader>
              <CardContent>
                {cookies.length > 0 ? (
                  <ul className="space-y-2">
                    {cookies.map((cookie, i) => (
                      <li key={i} className="bg-muted p-2 rounded-md">
                        {cookie}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Alert>
                    <AlertTitle>No cookies found</AlertTitle>
                    <AlertDescription>No cookies were found that are accessible to JavaScript.</AlertDescription>
                  </Alert>
                )}
                <p className="text-sm text-muted-foreground mt-4">
                  Note: HttpOnly cookies used for authentication are not visible here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests">
            <Card>
              <CardHeader>
                <CardTitle>Database Access Test</CardTitle>
                <CardDescription>Test if your current session can access the database</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={runDbTest} className="mb-4">
                  Run DB Test
                </Button>

                {testResult && (
                  <div className="mt-4">
                    {testResult.success ? (
                      <Alert className="bg-green-50 border-green-200">
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>
                          {testResult.message}
                          <pre className="bg-muted p-2 rounded-md mt-2 text-xs overflow-auto">
                            {JSON.stringify(testResult.data, null, 2)}
                          </pre>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          {testResult.message}
                          <pre className="bg-muted p-2 rounded-md mt-2 text-xs overflow-auto">
                            {JSON.stringify(testResult.error, null, 2)}
                          </pre>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <div className="mt-6 flex gap-4">
        <Button onClick={() => (window.location.href = "/auth/login")} variant="outline">
          Go to Login
        </Button>
        {user && (
          <Button onClick={signOut} variant="destructive">
            Sign Out
          </Button>
        )}
      </div>
    </div>
  )
}
