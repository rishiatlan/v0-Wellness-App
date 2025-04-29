"use client"

import { CardFooter } from "@/components/ui/card"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AtSign, AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, session } = useAuth()

  // Check for error parameter in URL
  useEffect(() => {
    const errorParam = searchParams?.get("error")
    const errorDescription = searchParams?.get("error_description")

    // Only set errors from actual authentication failures, not from URL patterns
    if (errorParam && errorParam !== "unauthorized_client" && !errorParam.includes("No authentication code provided")) {
      setError(decodeURIComponent(errorParam))
    } else if (errorDescription && errorDescription.includes("expired")) {
      setError("Your session has expired. Please log in again.")
    }

    // Clear any "No authentication code provided" errors that might appear
    if (error.includes("No authentication code provided")) {
      setError("")
    }
  }, [searchParams])

  // Helper function to check if we're in a callback flow that's missing a code
  // const isInvalidCallbackFlow = () => {
  //   // Check if we're in a callback URL pattern but missing the code
  //   const path = window.location.pathname
  //   const hasCallbackPattern = path.includes("callback") || path.includes("confirm")
  //   const hasNoCode = !searchParams?.get("code")

  //   return hasCallbackPattern && hasNoCode
  // }

  // Check if user is already logged in - only run once
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get the session directly from Supabase to ensure it's current
        const { data } = await supabase.auth.getSession()

        if (data.session) {
          console.log("User already logged in, preparing to redirect...")
          setRedirecting(true)

          // Get the callback URL from the query parameters or use a default
          const callbackUrl = searchParams?.get("callbackUrl") || "/daily-tracker"
          console.log("Redirecting to:", callbackUrl)

          // Use router.push for client-side navigation
          router.push(callbackUrl)
        }
      } catch (error) {
        console.error("Error checking session:", error)
      } finally {
        setSessionChecked(true)
      }
    }

    if (!sessionChecked) {
      checkSession()
    }
  }, [router, searchParams, sessionChecked])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Check if we're in an invalid callback flow
    // if (isInvalidCallbackFlow()) {
    //   setError("Your authentication link has expired or is invalid. Please try logging in directly.")
    //   return
    // }

    setLoading(true)

    console.log("Form submitted with email:", email)

    try {
      console.log("Attempting to sign in...")
      const result = await signIn(email, password)
      console.log("Sign in successful:", result)

      // Check if we have a session
      if (result.session) {
        console.log("Session created, redirecting...")
        setRedirecting(true)

        // Get the callback URL from the query parameters or use a default
        const callbackUrl = searchParams?.get("callbackUrl") || "/daily-tracker"
        console.log("Redirecting to:", callbackUrl)

        // Use router.push for client-side navigation
        router.push(callbackUrl)
      } else {
        throw new Error("Authentication succeeded but no session was created")
      }
    } catch (error: any) {
      console.error("Sign in error:", error)
      setError(error.message || "Failed to sign in. Please try again.")
      setRedirecting(false)
    } finally {
      setLoading(false)
    }
  }

  // If already logged in or redirecting, show loading
  if (redirecting) {
    return (
      <div className="container flex h-screen flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Redirecting to dashboard...</p>
          <Button variant="outline" size="sm" onClick={() => (window.location.href = "/daily-tracker")}>
            Click here if not redirected
          </Button>
        </div>
      </div>
    )
  }

  // Show loading while checking session
  if (!sessionChecked) {
    return (
      <div className="container flex h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4">Checking authentication status...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="https://mqvcdyzqegzqfwvesoiz.supabase.co/storage/v1/object/public/email-assets//wellness.png"
            width={80}
            height={80}
            alt="Spring into Wellness Logo"
            className="object-contain"
            unoptimized
          />
          <h1 className="mt-4 text-3xl font-bold">Spring into Wellness</h1>
          <p className="text-muted-foreground">Sign in to track your wellness journey</p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your email to sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/auth/reset-password" className="text-xs text-muted-foreground hover:text-primary">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
