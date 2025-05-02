import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { isPublicRoute } from "@/lib/public-routes"

export default async function ProtectedLayout({
  children,
  currentPath,
}: {
  children: React.ReactNode
  currentPath: string
}) {
  // If it's a public route, render the children directly
  if (isPublicRoute(currentPath)) {
    return <>{children}</>
  }

  // For protected routes, check for authentication
  try {
    const cookieStore = cookies()
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

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If no session, redirect to login
    if (!session) {
      // Include the current path as a callback URL
      const callbackUrl = encodeURIComponent(currentPath)
      redirect(`/auth/login?callbackUrl=${callbackUrl}`)
    }

    // If authenticated, render the children
    return <>{children}</>
  } catch (error) {
    console.error("Error in protected layout:", error)
    // If there's an error, redirect to login as a fallback
    redirect("/auth/login")
  }
}
