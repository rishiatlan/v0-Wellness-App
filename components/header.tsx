"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut, User, Shield } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/lib/auth-context"
import { signOut } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useEffect } from "react"
import { isAdmin } from "@/lib/admin-utils"

const getNavigation = (userEmail) => {
  const baseNavigation = [
    { name: "Home", href: "/" },
    { name: "Daily Tracker", href: "/daily-tracker" },
    { name: "My Progress", href: "/my-progress" },
    // Team Challenge link removed
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
  const { user, loading, refreshSession } = useAuth()
  const router = useRouter()

  // Redirect from team challenge page
  useEffect(() => {
    if (pathname === "/team-challenge") {
      router.push("/")
    }
  }, [pathname, router])

  // Refresh session when header mounts to ensure we have the latest auth state
  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const handleSignOut = async () => {
    try {
      await signOut()
      // The signOut function now handles the redirect
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const isAuthPage = pathname.startsWith("/auth/")

  // Don't show navigation on auth pages
  if (isAuthPage) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-navy-800 bg-navy-950/95 backdrop-blur supports-[backdrop-filter]:bg-navy-950/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/wellness-logo.png"
                width={32}
                height={32}
                alt="Spring into Wellness Logo"
                className="object-contain"
              />
              <span className="font-bold text-white">Spring into Wellness</span>
            </Link>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-navy-800 bg-navy-950/95 backdrop-blur supports-[backdrop-filter]:bg-navy-950/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/wellness-logo.png"
              width={32}
              height={32}
              alt="Spring into Wellness Logo"
              className="object-contain"
            />
            <span className="hidden font-bold text-white sm:inline-block">Spring into Wellness</span>
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
                {getNavigation(user?.email).map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center py-2 text-lg font-medium",
                      pathname === item.href ? "text-primary" : "text-gray-300 hover:text-white",
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
                      className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
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
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-primary" : "text-gray-300",
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
          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-r from-teal-500 to-blue-500 text-white">
                          {user.user_metadata?.full_name
                            ? user.user_metadata.full_name.charAt(0).toUpperCase()
                            : user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="border-navy-800 bg-navy-900 text-white">
                    <DropdownMenuLabel>{user.user_metadata?.full_name || user.email?.split("@")[0]}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-navy-800" />
                    <DropdownMenuItem asChild className="hover:bg-navy-800 focus:bg-navy-800">
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="hover:bg-navy-800 focus:bg-navy-800">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  size="sm"
                  asChild
                  className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
                >
                  <Link href="/auth/login">Log In</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
