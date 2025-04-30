"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, Award, Calendar } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUserProfileClient } from "@/lib/api-client"
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils"

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const profileData = await getUserProfileClient(user.id)
        setProfile(profileData)
      } catch (err: any) {
        console.error("Error fetching profile:", err)
        setError(err.message || "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchProfile()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-8">
        <Card className="bg-navy-950 border-navy-800">
          <CardHeader>
            <CardTitle className="text-white">Not Logged In</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card className="bg-navy-950 border-navy-800">
          <CardHeader>
            <CardTitle className="text-white">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">View and manage your wellness profile</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-navy-950 border-navy-800">
          <CardHeader className="border-b border-navy-800">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-navy-700">
                <AvatarImage
                  src={profile?.avatar_url || getAvatarUrl(user.id || user.email, "user")}
                  alt={profile?.full_name || user.email}
                />
                <AvatarFallback className="bg-navy-700 text-white">
                  {getInitials(profile?.full_name || user.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-white">{profile?.full_name || user.email?.split("@")[0]}</CardTitle>
                <CardDescription className="text-slate-400">{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-blue-900/20 p-4 text-center border border-blue-800">
                <div className="text-2xl font-bold text-blue-400">{profile?.total_points || 0}</div>
                <div className="text-sm text-blue-300">Total Points</div>
              </div>
              <div className="rounded-lg bg-teal-900/20 p-4 text-center border border-teal-800">
                <div className="text-2xl font-bold text-teal-400">{profile?.current_tier || 0}</div>
                <div className="text-sm text-teal-300">Current Tier</div>
              </div>
              <div className="rounded-lg bg-emerald-900/20 p-4 text-center border border-emerald-800">
                <div className="text-2xl font-bold text-emerald-400">{profile?.current_streak || 0}</div>
                <div className="text-sm text-emerald-300">Day Streak</div>
              </div>
              <div className="rounded-lg bg-purple-900/20 p-4 text-center border border-purple-800">
                <div className="text-2xl font-bold text-purple-400">{profile?.team_id ? "Yes" : "No"}</div>
                <div className="text-sm text-purple-300">Team Member</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-950 border-navy-800">
          <CardHeader className="border-b border-navy-800">
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span>Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="rounded-lg border border-navy-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-amber-500/20 p-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="font-medium text-white">First Activity</div>
                    <div className="text-xs text-slate-400">Completed your first wellness activity</div>
                  </div>
                  <Badge className="ml-auto bg-blue-900/20 text-blue-400 border-blue-700">+10 pts</Badge>
                </div>
              </div>

              <div className="rounded-lg border border-navy-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-500/20 p-2">
                    <Calendar className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="font-medium text-white">3-Day Streak</div>
                    <div className="text-xs text-slate-400">Completed activities for 3 days in a row</div>
                  </div>
                  <Badge className="ml-auto bg-blue-900/20 text-blue-400 border-blue-700">+15 pts</Badge>
                </div>
              </div>

              <div className="rounded-lg border border-navy-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-purple-500/20 p-2">
                    <Award className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="font-medium text-white">Tier 1 Reached</div>
                    <div className="text-xs text-slate-400">Reached Tier 1 in the wellness program</div>
                  </div>
                  <Badge className="ml-auto bg-blue-900/20 text-blue-400 border-blue-700">+25 pts</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
