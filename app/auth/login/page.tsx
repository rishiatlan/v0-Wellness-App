"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Info } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, session } = useAuth()

  // Get parameters from URL
  const errorParam = searchParams?.get("error")
  const messageParam = searchParams?.get("message")
  const callbackUrl = searchParams?.get("callbackUrl") || "/daily-tracker"

  // Set error or message from URL parameters
  useEffect(() => {
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
    if (messageParam) {
      setMessage(decodeURIComponent(messageParam))
    }
  }, [errorParam, messageParam])

  // Redirect if already logged in
  useEffect(() => {
    if (user && session) {
      console.log("User already logged in, redirecting to:", callbackUrl)
      router.push(callbackUrl)
    }
  }, [user, session, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate email format
      if (!email.includes("@") || !email.includes(".")) {
        setError("Please enter a valid email address")
        setLoading(false)
        return
      }

      // Validate password length
      if (password.length < 6) {
        setError("Password must be at least 6 characters")
        setLoading(false)
        return
      }

      console.log("Attempting login for:", email)
      const { session, user } = await signIn(email, password)

      // Replace the current router.push with this implementation
      if (session && user) {
        console.log("Login successful, redirecting to:", callbackUrl)

        // Store last login date for streak calculation
        localStorage.setItem("lastLogin", new Date().toISOString().split("T")[0])

        // Use window.location for a hard redirect instead of router.push
        window.location.href = callbackUrl
      } else {
        console.error("Login succeeded but no session or user returned")
        setError("Authentication succeeded but session creation failed. Please try again.")
      }
    } catch (err: any) {
      console.error("Login error:", err)

      // Provide more user-friendly error messages
      if (err.message?.includes("Invalid login")) {
        setError("Invalid email or password. Please check your credentials and try again.")
      } else if (err.message?.includes("Email not confirmed")) {
        setError("Please verify your email address before logging in.")
      } else if (err.message?.includes("rate limit")) {
        setError("Too many login attempts. Please try again later.")
      } else {
        setError(err.message || "Failed to sign in. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>Enter your email and password to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="mb-4 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              <Info className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@atlan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/reset-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
