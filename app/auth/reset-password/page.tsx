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
import { AtSign, AlertCircle } from "lucide-react"
import Image from "next/image"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!isAtlanEmail(email)) {
      setError("Only @atlan.com email addresses are allowed")
      return
    }

    setLoading(true)

    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex h-screen flex-col items-center justify-center max-w-md mx-auto px-4">
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
              {email && !isAtlanEmail(email) && (
                <p className="text-xs text-red-500">Only @atlan.com email addresses are allowed</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading || success}>
              {loading ? "Sending..." : "Send Reset Link"}
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
