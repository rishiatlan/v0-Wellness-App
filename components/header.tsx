"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut, User, Shield, RefreshCw, Users } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { OptimizedAvatar } from "@/components/optimized-avatar"
import { useEffect, useState, useRef } from "react" // Added useRef
import { isAdmin } from "@/lib/admin-utils"
import { Badge } from "@/components/ui/badge"
import { getUserTeam } from "@/app/actions/team-actions"
import { ClientOnly } from "@/components/client-only"

const getNavigation = (userEmail) => {
  const baseNavigation = [
    { name: "Home", href: "/" },
    { name: "Daily Tracker", href: "/daily-tracker" },
    { name: "My Progress", href: "/my-progress" },
    { name: "Team Challenge", href: "/team-challenge" },
    { name: "Leaderboard", href: "/leaderboard" },
  ]

  // Add admin link if user is an admin
  if (userEmail && isAdmin(userEmail)) {
    baseNavigation.push({ name: "Admin", href: "/admin" })
  }

  return baseNavigation
}

export default function Header() {
  const pathname = usePathname()
  const isMobile = useMobile()
  const { user, isLoading, refreshSession, signOut } = useAuth()
  const [imageError, setImageError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userTeam, setUserTeam] = useState<any>(null)
  const [loadingTeam, setLoadingTeam] = useState(false)
  const hasRefreshed = useRef(false) // Add ref to track if we've already refreshed

  // Define multiple possible logo URLs
  const logoUrls = ["/wellness.png", "/wellness-logo.png", "/abstract-geometric-logo.png"]

  const [currentLogoIndex, setCurrentLogoIndex] = useState(0)
  const logoUrl = logoUrls[currentLogoIndex]

  // Refresh session when header mounts to ensure we have the latest auth state
  // But only do it once to prevent infinite refreshes
  useEffect(() => {
    const doRefresh = async () => {
      if (hasRefreshed.current) return // Skip if we've already refreshed

      try {
        hasRefreshed.current = true // Mark as refreshed before the async call
        console.log("Refreshing session in header...")
        await refreshSession()
        console.log("Session refresh complete")
      } catch (error) {
        console.error("Error refreshing session:", error)
      }
    }

    doRefresh()
  }, [refreshSession]) // Only depends on refreshSession function reference

  // Fetch user's team information
  useEffect(() => {
    const fetchUserTeam = async () => {
      if (!user?.id) return

      try {
        setLoadingTeam(true)
        const team = await getUserTeam(user.id)
        setUserTeam(team)
      } catch (error) {
        console.error("Error fetching user team:", error)
      } finally {
        setLoadingTeam(false)
      }
    }

    if (user?.id) {
      fetchUserTeam()
    }
  }, [user?.id]) // Only depends on user.id

  // Handle logo loading error
  const handleLogoError = () => {
    setImageError(true)
    // Try the next logo in the array
    if (currentLogoIndex < logoUrls.length - 1) {
      setCurrentLogoIndex(currentLogoIndex + 1)
    }
  }

  const handleRefreshLogo = () => {
    setIsRefreshing(true)
    setImageError(false)
    setRetryCount(retryCount + 1)
    setCurrentLogoIndex(0)

    // Reset refreshing state after a short delay
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      // Redirect will be handled by the auth context
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const isAuthPage = pathname?.startsWith("/auth/")

  // Don't show navigation on auth pages
  if (isAuthPage) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-navy-800 bg-navy-950/95 backdrop-blur supports-[backdrop-filter]:bg-navy-950/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-full border border-navy-700 bg-navy-900 shadow-lg">
                <Image
                  src={logoUrl || "/placeholder.svg"}
                  width={36}
                  height={36}
                  alt="Spring into Wellness Logo"
                  className="object-contain p-0.5"
                  onError={handleLogoError}
                  priority
                  key={`logo-${retryCount}-${currentLogoIndex}`}
                />
                {imageError && currentLogoIndex >= logoUrls.length - 1 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-navy-800 text-white text-sm font-bold rounded-full">
                    SW
                  </div>
                )}
              </div>
              <span className="font-bold text-white text-lg tracking-tight">Spring into Wellness</span>
            </Link>
          </div>
        </div>
      </header>
    )
  }

  // Render team badge if user has a team
  const TeamBadge = () => {
    if (loadingTeam) {
      return (
        <Badge variant="outline" className="animate-pulse bg-navy-800 text-white">
          Loading team...
        </Badge>
      )
    }

    if (userTeam) {
      return (
        <Badge className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white">
          <Users className="h-3 w-3 mr-1" />
          {userTeam.name}
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="bg-navy-800 text-white">
        <Link href="/team-challenge">No Team - Join Now</Link>
      </Badge>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-navy-800 bg-navy-950/95 backdrop-blur supports-[backdrop-filter]:bg-navy-950/60 shadow-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-navy-700 bg-navy-900 shadow-lg">
              <Image
                src={logoUrl || "/placeholder.svg"}
                width={36}
                height={36}
                alt="Spring into Wellness Logo"
                className={`object-contain p-0.5 ${isRefreshing ? "animate-spin" : ""}`}
                onError={handleLogoError}
                priority
                key={`logo-${retryCount}-${currentLogoIndex}`}
              />
              {imageError && currentLogoIndex >= logoUrls.length - 1 && (
                <div className="absolute inset-0 flex items-center justify-center bg-navy-800 text-white text-sm font-bold rounded-full">
                  SW
                </div>
              )}
              {imageError && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-navy-800 p-0"
                  onClick={handleRefreshLogo}
                >
                  <RefreshCw className="h-3 w-3 text-white" />
                </Button>
              )}
            </div>
            <span className="hidden font-bold text-white text-lg tracking-tight sm:inline-block">
              Spring into Wellness
            </span>
          </Link>
        </div>

        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-navy-700 bg-navy-900 hover:bg-navy-800">
                <Menu className="h-5 w-5 text-white" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-navy-800 bg-navy-950 text-white">
              <div className="grid gap-2 py-6">
                {user && !isLoading && (
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <OptimizedAvatar
                        userId={user.id}
                        email={user.email}
                        name={user.user_metadata?.full_name}
                        size="sm"
                      />
                      <span className="text-sm font-medium">
                        {user.user_metadata?.full_name || user.email?.split("@")[0]}
                      </span>
                    </div>
                    <TeamBadge />
                  </div>
                )}

                {getNavigation(user?.email).map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center py-3 px-2 text-lg font-medium rounded-md transition-colors",
                      pathname === item.href
                        ? "bg-navy-800 text-primary"
                        : "text-gray-300 hover:bg-navy-900 hover:text-white",
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
                {user?.email && isAdmin(user.email) && (
                  <Button
                    variant="outline"
                    className="mt-2 w-full justify-start border-navy-700 bg-navy-900 text-white hover:bg-navy-800"
                    asChild
                  >
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  </Button>
                )}
                <div className="mt-4 border-t border-navy-800 pt-4">
                  {user ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start border-navy-700 bg-navy-900 text-white hover:bg-navy-800"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 font-medium"
                    >
                      <Link href="/auth/login">Sign In</Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="flex items-center gap-6">
            {getNavigation(user?.email).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors px-3 py-2 rounded-md",
                  pathname === item.href
                    ? "bg-navy-800 text-primary"
                    : "text-gray-300 hover:bg-navy-900/50 hover:text-white",
                )}
              >
                {item.name}
              </Link>
            ))}
            {!isMobile && user?.email && isAdmin(user.email) && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="ml-2 border-navy-700 bg-navy-900 text-white hover:bg-navy-800"
              >
                <Link href="/admin" className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </Button>
            )}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {!isLoading && user && (
            <div className="hidden md:block mr-2">
              <TeamBadge />
            </div>
          )}

          <ClientOnly>
            {!isLoading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <OptimizedAvatar
                          userId={user.id}
                          email={user.email}
                          name={user.user_metadata?.full_name}
                          priority={true}
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-navy-800 bg-navy-900 text-white w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.user_metadata?.full_name || user.email?.split("@")[0]}
                          </p>
                          <p className="text-xs leading-none text-slate-400">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>

                      {/* Team information section */}
                      <DropdownMenuSeparator className="bg-navy-800" />
                      <div className="px-2 py-1.5">
                        <div className="text-xs text-slate-400 mb-1">Team</div>
                        {loadingTeam ? (
                          <div className="animate-pulse h-6 bg-navy-800 rounded"></div>
                        ) : userTeam ? (
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">{userTeam.name}</div>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                              <Link href="/team-challenge">View</Link>
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-yellow-400">No team joined</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs bg-blue-900/30 hover:bg-blue-900/50"
                              asChild
                            >
                              <Link href="/team-challenge">Join Team</Link>
                            </Button>
                          </div>
                        )}
                      </div>

                      <DropdownMenuSeparator className="bg-navy-800" />
                      <DropdownMenuItem asChild className="hover:bg-navy-800 focus:bg-navy-800">
                        <Link href="/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="hover:bg-navy-800 focus:bg-navy-800 cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    size="sm"
                    asChild
                    className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 font-medium"
                  >
                    <Link href="/auth/login">Log In</Link>
                  </Button>
                )}
              </>
            )}
          </ClientOnly>
        </div>
      </div>
    </header>
  )
}
