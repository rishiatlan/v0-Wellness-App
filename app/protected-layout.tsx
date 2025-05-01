"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

// Cache authentication results to prevent unnecessary checks
const authCache = new Map<string, boolean>()

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  // Memoized function to check if a route is public
  const isPublicRoute = useCallback((path: string) => {
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

    return publicRoutes.some((route) => path === route || path.startsWith(route + "/"))
  }, [])

  useEffect(() => {
    // Check if we've already verified this path
    if (authCache.has(pathname)) {
      const isAuthenticated = authCache.get(pathname)
      if (isAuthenticated) {
        setIsChecking(false)
        return
      }
    }

    // If it's a public route, no need to check authentication
    if (isPublicRoute(pathname)) {
      authCache.set(pathname, true)
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
      setRedirecting(true)
      authCache.set(pathname, false)

      // Use a timeout to ensure state updates before navigation
      const timer = setTimeout(() => {
        router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`)
      }, 100)

      return () => clearTimeout(timer)
    } else {
      // User is authenticated, allow access
      authCache.set(pathname, true)
      setIsChecking(false)
    }
  }, [user, session, loading, pathname, router, isPublicRoute])

  // Show loading state while checking authentication
  if (redirecting) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Redirecting to login...</p>
        </div>
      </div>
    )
  }

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
