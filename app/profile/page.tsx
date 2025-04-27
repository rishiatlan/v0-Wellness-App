"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserProfile } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { Shield } from "lucide-react"

const isAdmin = (email: string | null | undefined) => {
  if (!email) return false
  const adminEmails = ["admin@example.com", "test@example.com"] // Replace with your actual admin emails
  return adminEmails.includes(email)
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const userProfile = await getUserProfile(user.id)
          setProfile(userProfile)
        } catch (error) {
          console.error("Error fetching profile:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchProfile()
  }, [user])

  if (loading) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>You need to be logged in to view your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Your Profile</h1>
        <p className="text-muted-foreground">Manage your account and view your progress</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal information and account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {user.user_metadata?.full_name
                    ? user.user_metadata.full_name.charAt(0).toUpperCase()
                    : user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-medium">{user.user_metadata?.full_name || user.email?.split("@")[0]}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {profile?.team_id && (
                  <Badge className="mt-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                    Team Member
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email Verified</span>
                <span>{user.email_confirmed_at ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Account Created</span>
                <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Sign In</span>
                <span>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wellness Summary</CardTitle>
            <CardDescription>Your challenge progress and achievements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{profile?.total_points || 0}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Total Points</div>
              </div>
              <div className="rounded-lg bg-teal-50 p-4 text-center dark:bg-teal-900/20">
                <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                  {profile?.current_tier === 0
                    ? "Getting Started"
                    : profile?.current_tier === 1
                      ? "Seedling"
                      : profile?.current_tier === 2
                        ? "Bloomer"
                        : "Champion"}
                </div>
                <div className="text-sm text-teal-700 dark:text-teal-300">Current Tier</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Quick Links</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" asChild size="sm">
                  <Link href="/daily-tracker">Daily Tracker</Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href="/my-progress">My Progress</Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href="/team-challenge">Team Challenge</Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href="/leaderboard">Leaderboard</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {user && isAdmin(user.email) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                <span>Admin Access</span>
              </CardTitle>
              <CardDescription>Manage users, teams and system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm">
                You have administrator privileges. Use the admin dashboard to manage the wellness challenge.
              </p>
              <Button asChild className="w-full">
                <Link href="/admin">Access Admin Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
