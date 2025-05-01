import { CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export default async function Login({
  searchParams,
}: {
  searchParams: { message: string; error: string; callbackUrl: string }
}) {
  const cookieStore = cookies()

  // Create a server client directly
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => cookieStore.set(name, value, options),
        remove: (name, options) => cookieStore.set(name, "", { ...options, maxAge: 0 }),
      },
    },
  )

  // Default callback URL to daily-tracker if not specified
  const callbackUrl = searchParams?.callbackUrl || "/daily-tracker"

  // Display error message from searchParams if available
  const errorMessage = searchParams?.error || searchParams?.message || null

  // Wrap this in a try/catch to handle potential errors
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If the user is already logged in, redirect them
    if (session) {
      return redirect(callbackUrl)
    }
  } catch (error) {
    console.error("Error getting session:", error)
    // Continue to login page if there's an error getting the session
  }

  const signIn = async (formData: FormData) => {
    "use server"

    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const cookieStore = cookies()
    const redirectUrl = (formData.get("callbackUrl") as string) || "/daily-tracker"

    try {
      // Create a server client directly
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get: (name) => cookieStore.get(name)?.value,
            set: (name, value, options) => {
              // Set cookies with appropriate settings for auth
              cookieStore.set(name, value, {
                ...options,
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
              })
            },
            remove: (name, options) => cookieStore.set(name, "", { ...options, maxAge: 0 }),
          },
        },
      )

      // Improved error logging
      console.log(`Attempting to sign in user: ${email}`)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Authentication error:", error.message, error)

        // More specific error messages based on error type
        let errorMessage = error.message
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please try again."
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please check your email to confirm your account before logging in."
        }

        return redirect(
          `/auth/login?error=${encodeURIComponent(errorMessage)}&callbackUrl=${encodeURIComponent(redirectUrl)}`,
        )
      }

      // Verify we have a session
      if (!data.session) {
        console.error("No session created after successful authentication")
        return redirect(
          `/auth/login?error=${encodeURIComponent("Authentication succeeded but session creation failed. Please try again.")}&callbackUrl=${encodeURIComponent(redirectUrl)}`,
        )
      }

      console.log("User authenticated successfully, redirecting to:", redirectUrl)
      return redirect(redirectUrl)
    } catch (error: any) {
      console.error("Unexpected error during sign in:", error)
      return redirect(
        `/auth/login?error=${encodeURIComponent("An unexpected error occurred. Please try again later.")}&callbackUrl=${encodeURIComponent(redirectUrl)}`,
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
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-gray-400">Sign in to your account to continue</CardDescription>
            {errorMessage && (
              <p className="mt-2 rounded-lg bg-destructive/15 p-3 text-center text-sm text-destructive">
                {errorMessage}
                {errorMessage.includes("VPN") && (
                  <span className="block mt-1 font-semibold">
                    Note: VPN connections may interfere with authentication. Try disabling your VPN.
                  </span>
                )}
              </p>
            )}
          </CardHeader>
          <form action={signIn}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  required
                  type="email"
                  className="border-navy-700 bg-navy-800 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-300">
                    Password
                  </Label>
                  <Link href="/auth/reset-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  required
                  type="password"
                  className="border-navy-700 bg-navy-800 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary"
                />
              </div>
              {/* Hidden input to pass the callback URL */}
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
              >
                Sign In
              </Button>
              <div className="text-center text-sm text-gray-400">
                Don&apos;t have an account?{" "}
                <Link
                  href={`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                  className="text-primary hover:underline"
                >
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
