"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Public routes that don't require authentication
    const publicRoutes = [
      "/",
      "/auth/login",
      "/auth/register",
      "/auth/reset-password",
      "/auth/callback",
      "/terms",
      "/privacy",
      "/health",
      "/contact",
    ]

    const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))

    // If it's a public route, no need to check authentication
    if (isPublicRoute) {
      setIsChecking(false)
      return
    }

    // If still loading auth state, wait
    if (loading) {
      return
    }

    // If not a public route and no user is logged in, redirect to login
    if (!user && !session) {
      console.log("No authenticated user, redirecting to login from:", pathname)
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`)
    } else {
      // User is authenticated, allow access
      setIsChecking(false)
    }
  }, [user, session, loading, pathname, router])

  // Show loading state while checking authentication
  if (isChecking && !loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // If we're still loading the auth state, show a loading indicator
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading authentication state...</p>
        </div>
      </div>
    )
  }

  // Render children once authentication is verified
  return <>{children}</>
}
