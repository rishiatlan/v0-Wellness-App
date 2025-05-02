import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { isAtlanEmail } from "@/lib/is-atlan-email"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default async function Register({
  searchParams,
}: {
  searchParams: { message: string; callbackUrl: string }
}) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If the user is already logged in, redirect them
    if (session) {
      return redirect(searchParams.callbackUrl || "/")
    }
  } catch (error) {
    console.error("Error getting session:", error)
    // Continue to registration page if there's an error getting the session
  }

  const signUp = async (formData: FormData) => {
    "use server"

    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://v0-spring-wellness-app.vercel.app"
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string
    const cookieStore = cookies()

    try {
      // Validate inputs
      if (!email || !password || !fullName) {
        return redirect(
          `/auth/register?message=${encodeURIComponent("All fields are required.")}${
            searchParams.callbackUrl ? `&callbackUrl=${encodeURIComponent(searchParams.callbackUrl)}` : ""
          }`,
        )
      }

      // Check if it's an Atlan email
      if (!isAtlanEmail(email)) {
        return redirect(
          `/auth/register?message=${encodeURIComponent("Only Atlan email addresses are allowed to register.")}${
            searchParams.callbackUrl ? `&callbackUrl=${encodeURIComponent(searchParams.callbackUrl)}` : ""
          }`,
        )
      }

      // Validate password strength
      if (password.length < 6) {
        return redirect(
          `/auth/register?message=${encodeURIComponent("Password must be at least 6 characters long.")}${
            searchParams.callbackUrl ? `&callbackUrl=${encodeURIComponent(searchParams.callbackUrl)}` : ""
          }`,
        )
      }

      // Create Supabase client
      const supabase = createServerClient(cookieStore)

      // Attempt to sign up the user
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        console.error("Signup error:", error)
        return redirect(
          `/auth/register?message=${encodeURIComponent(error.message)}${
            searchParams.callbackUrl ? `&callbackUrl=${encodeURIComponent(searchParams.callbackUrl)}` : ""
          }`,
        )
      }

      return redirect("/auth/login?message=Check your email to confirm your account")
    } catch (error: any) {
      console.error("Error signing up:", error)
      return redirect(
        `/auth/register?message=${encodeURIComponent("An unexpected error occurred. Please try again.")}${
          searchParams.callbackUrl ? `&callbackUrl=${encodeURIComponent(searchParams.callbackUrl)}` : ""
        }`,
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="border-navy-800 bg-navy-900 text-white shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/wellness-logo.png"
                width={64}
                height={64}
                alt="Spring into Wellness Logo"
                className="object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
            <CardDescription className="text-gray-400">Enter your details to get started</CardDescription>
            {searchParams?.message && (
              <Alert variant="destructive" className="mt-2 bg-destructive/15 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{searchParams.message}</AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <form action={signUp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  required
                  className="border-navy-700 bg-navy-800 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="name@atlan.com"
                  required
                  type="email"
                  className="border-navy-700 bg-navy-800 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary"
                />
                <p className="text-xs text-gray-400">Only Atlan email addresses are allowed to register.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  required
                  type="password"
                  className="border-navy-700 bg-navy-800 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary"
                />
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Password requirements:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>At least 6 characters long</li>
                    <li>Include at least one uppercase letter</li>
                    <li>Include at least one number</li>
                    <li>Special characters are recommended</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
              >
                Sign Up
              </Button>
              <div className="text-center text-sm text-gray-400">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
