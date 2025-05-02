"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Eye, EyeOff, KeyRound, Check, X } from "lucide-react"

// Password requirements component
const PasswordRequirements = ({ password }: { password: string }) => {
  // Define password requirements
  const requirements = [
    {
      text: "At least 8 characters long",
      met: password.length >= 8,
    },
    {
      text: "Contains at least one uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      text: "Contains at least one lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      text: "Contains at least one number",
      met: /[0-9]/.test(password),
    },
    {
      text: "Contains at least one special character",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ]

  // Calculate overall strength
  const metCount = requirements.filter((req) => req.met).length
  const strength = metCount === 0 ? 0 : metCount / requirements.length

  // Determine strength color and label
  let strengthColor = "bg-red-500"
  let strengthLabel = "Weak"

  if (strength >= 0.8) {
    strengthColor = "bg-green-500"
    strengthLabel = "Strong"
  } else if (strength >= 0.5) {
    strengthColor = "bg-yellow-500"
    strengthLabel = "Medium"
  } else if (strength > 0) {
    strengthColor = "bg-red-500"
    strengthLabel = "Weak"
  }

  return (
    <div className="mt-2 space-y-3">
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Password strength: {strengthLabel}</div>
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${strengthColor} transition-all duration-300 ease-in-out`}
            style={{ width: `${strength * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Your password must include:</p>
        <ul className="space-y-1">
          {requirements.map((req, index) => (
            <li key={index} className="flex items-center text-xs">
              {req.met ? (
                <Check className="h-3.5 w-3.5 mr-2 text-green-500" />
              ) : (
                <X className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              )}
              <span className={req.met ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
                {req.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function ResetPasswordConfirmPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [tokenVerified, setTokenVerified] = useState(false)
  const [verifyingToken, setVerifyingToken] = useState(true)

  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for token on page load
  useEffect(() => {
    const verifyToken = async () => {
      try {
        setVerifyingToken(true)

        // Check if we have a session already
        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData?.session) {
          console.log("Session found, token is valid")
          setTokenVerified(true)
          setVerifyingToken(false)
          return
        }

        // If we don't have a session, check for tokens in the URL
        const access_token = searchParams.get("access_token")
        const refresh_token = searchParams.get("refresh_token")
        const type = searchParams.get("type")

        if (access_token && refresh_token) {
          console.log("Found tokens in URL, setting session")

          // Set the session with the tokens
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          })

          if (error) {
            console.error("Error setting session:", error)
            setError("Your password reset link has expired. Please request a new one.")
            setVerifyingToken(false)
            return
          }

          // Token is valid
          setTokenVerified(true)

          // Clean up the URL by removing the tokens
          // This is important for security reasons
          if (window.history.replaceState) {
            const newUrl = window.location.pathname
            window.history.replaceState({}, document.title, newUrl)
          }
        } else {
          // No tokens found, check if we're in the callback flow
          // In this case, the token might have been processed by the callback route
          const { data } = await supabase.auth.getSession()

          if (data.session) {
            setTokenVerified(true)
          } else {
            setError("No valid reset token found. Please request a new password reset link.")
          }
        }
      } catch (error: any) {
        console.error("Error verifying token:", error)
        setError("Failed to verify your reset token. Please try again or request a new link.")
      } finally {
        setVerifyingToken(false)
      }
    }

    verifyToken()
  }, [searchParams])

  // Check if password meets all requirements
  const passwordMeetsRequirements = () => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate password meets all requirements
    if (!passwordMeetsRequirements()) {
      setError("Your password doesn't meet all the requirements")
      return
    }

    // Confirm passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        throw error
      }

      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login?message=Your password has been reset successfully")
      }, 3000)
    } catch (error: any) {
      setError(error.message || "Failed to reset password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex h-screen flex-col items-center justify-center max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <Image
          src="/wellness-logo.png"
          width={80}
          height={80}
          alt="Spring into Wellness Logo"
          className="object-contain"
        />
        <h1 className="mt-4 text-3xl font-bold">Spring into Wellness</h1>
        <p className="text-muted-foreground">Create a new password</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>Enter a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {verifyingToken ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="sr-only">Verifying your reset link...</span>
            </div>
          ) : !tokenVerified ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || "Invalid or expired reset link. Please request a new one."}</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your password has been reset successfully! Redirecting to login...
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className="pl-9"
                    placeholder="Enter new password"
                    required
                    disabled={loading || success}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || success}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>

                {/* Show password requirements when password field is focused or has content */}
                {(passwordFocused || password.length > 0) && <PasswordRequirements password={password} />}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                    placeholder="Confirm new password"
                    required
                    disabled={loading || success}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading || success}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || success || !passwordMeetsRequirements() || password !== confirmPassword}
              >
                {loading ? "Resetting Password..." : "Reset Password"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
