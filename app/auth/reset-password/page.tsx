"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { resetPassword, isAtlanEmail } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AtSign, AlertCircle, Info, Loader2 } from "lucide-react"
import Image from "next/image"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [emailValid, setEmailValid] = useState(true)

  const validateEmail = (email: string) => {
    setEmailValid(isAtlanEmail(email) || email === "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!email) {
      setError("Email is required")
      return
    }

    if (!isAtlanEmail(email)) {
      setError("Only @atlan.com email addresses are allowed")
      return
    }

    setLoading(true)

    try {
      await resetPassword(email)
      setSuccess(true)
      // Clear the form
      setEmail("")
    } catch (error: any) {
      console.error("Password reset error:", error)
      if (error.message?.includes("rate limit")) {
        setError("Too many reset attempts. Please try again later.")
      } else {
        setError(error.message || "Failed to send reset email. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex h-screen flex-col items-center justify-center max-w-md mx-auto px-4">
      <div className="mb-8 flex flex-col items-center text-center">
        <Image
          src="/wellness-logo.png"
          width={80}
          height={80}
          alt="Spring into Wellness Logo"
          className="object-contain"
        />
        <h1 className="mt-4 text-3xl font-bold">Spring into Wellness</h1>
        <p className="text-muted-foreground">Reset your password</p>
      </div>

      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your Atlan email to receive a password reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Password reset email sent! Please check your inbox for further instructions.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@atlan.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    validateEmail(e.target.value)
                  }}
                  className={`pl-9 ${!emailValid ? "border-red-500 focus:border-red-500" : ""}`}
                  required
                  disabled={loading || success}
                />
              </div>
              {!emailValid && <p className="text-xs text-red-500">Only @atlan.com email addresses are allowed</p>}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>When you reset your password, please remember:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Password must be at least 6 characters long</li>
                <li>Include at least one uppercase letter</li>
                <li>Include at least one number</li>
                <li>Special characters are recommended for better security</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading || success || !emailValid}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : success ? (
                "Email Sent"
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
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
