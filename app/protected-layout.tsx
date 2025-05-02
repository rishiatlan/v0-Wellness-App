import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { isPublicRoute } from "@/lib/public-routes"

export default async function ProtectedLayout({
  children,
  currentPath,
}: {
  children: React.ReactNode
  currentPath: string
}) {
  // Skip auth check for public routes
  if (isPublicRoute(currentPath)) {
    return <>{children}</>
  }

  // Check for authentication
  const cookieStore = cookies()
  const authToken = cookieStore.get("sb-auth-token")

  if (!authToken) {
    // Redirect to login with callback URL
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`)
  }

  return <>{children}</>
}
