"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import CalendarView from "./calendar-view"

// Assume getUserProfileClientSafe is defined in "@/lib/auth" or a similar module
import { getUserProfileClientSafe } from "@/lib/auth" // Adjust the import path as needed

export default function MyProgress() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return

      try {
        setLoading(true)
        const profile = await getUserProfileClientSafe(user.id)
        setUserProfile(profile)
      } catch (error) {
        console.error("Error fetching user profile:", error)
        // Don't show error for new users, just create a default profile
        setUserProfile({
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          total_points: 0,
          current_tier: 0,
          current_streak: 0,
          team_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [user, toast])

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="text-center">
          <Button onClick={handleRetry}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">My Progress</h1>
          <p className="mt-4 text-muted-foreground">Please sign in to view your progress.</p>
          <Button className="mt-4" asChild>
            <a href="/auth/login">Sign In</a>
          </Button>
        </div>
      </div>
    )
  }

  // Always have a userProfile object, even for new users
  const profile = userProfile || {
    total_points: 0,
    current_tier: 0,
    current_streak: 0,
  }

  const totalPoints = profile.total_points || 0
  const currentTier = profile.current_tier || 0

  // Update the tiers array to use a different emoji for the "Getting Started" tier

  // Tier thresholds
  const tiers = [
    {
      name: "Getting Started",
      emoji: "🔰", // Changed from 🌱 to 🔰 (beginner symbol)
      min: 0,
      max: 639,
      color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    },
    {
      name: "Wellness Seedling",
      emoji: "🌱",
      min: 640,
      max: 915,
      color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    {
      name: "Wellness Bloomer",
      emoji: "🌿",
      min: 916,
      max: 1372,
      color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    },
    {
      name: "Wellness Champion",
      emoji: "🌳",
      min: 1373,
      max: Number.POSITIVE_INFINITY,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    },
  ]

  // Calculate progress to next tier
  const currentTierObj = tiers[currentTier === 0 ? 1 : currentTier]
  const nextTierObj = tiers[currentTier + 1] || tiers[tiers.length - 1]

  const progressToNextTier = () => {
    if (currentTier === 0) {
      return (totalPoints / currentTierObj.min) * 100
    } else if (currentTier === tiers.length - 1) {
      return 100
    } else {
      const pointsInCurrentTier = totalPoints - currentTierObj.min
      const tierRange = currentTierObj.max - currentTierObj.min
      return (pointsInCurrentTier / tierRange) * 100
    }
  }

  return (
    <div className="container px-4 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">My Progress</h1>
        <p className="text-muted-foreground">Track your wellness journey and tier progress.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span>Your Wellness Journey</span>
              </CardTitle>
              <CardDescription>You've earned {totalPoints} points on your wellness journey.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current: {currentTierObj?.name || "Getting Started"}</span>
                    <span>Next: {nextTierObj?.name}</span>
                  </div>
                  <Progress value={progressToNextTier()} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{totalPoints} points</span>
                    <span>{nextTierObj?.min} points needed</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {tiers.slice(1).map((tier, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border p-4 text-center ${
                        currentTier > i + 1
                          ? "border-teal-200 bg-teal-50 dark:border-teal-900/50 dark:bg-teal-900/20"
                          : ""
                      }`}
                    >
                      <div className="text-3xl mb-2">{tier.emoji}</div>
                      <div className="font-medium">{tier.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {tier.min}–{tier.max === Number.POSITIVE_INFINITY ? "+" : tier.max} pts
                      </div>
                      {currentTier > i + 1 && (
                        <Badge
                          variant="outline"
                          className="mt-2 bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                        >
                          Achieved
                        </Badge>
                      )}
                      {currentTier === i + 1 && (
                        <Badge
                          variant="outline"
                          className="mt-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          Current Tier
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <CalendarView />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span>Stats Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalPoints}</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Total Points</div>
                </div>
                <div className="rounded-lg bg-teal-50 p-4 text-center dark:bg-teal-900/20">
                  <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                    {profile.current_streak || 0}
                  </div>
                  <div className="text-sm text-teal-700 dark:text-teal-300">Day Streak</div>
                </div>
                <div className="rounded-lg bg-emerald-50 p-4 text-center dark:bg-emerald-900/20">
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {currentTier === 0 ? "🔰" : currentTier === 1 ? "🌱" : currentTier === 2 ? "🌿" : "🌳"}
                  </div>
                  <div className="text-sm text-emerald-700 dark:text-emerald-300">Current Tier</div>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 text-center dark:bg-purple-900/20">
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {currentTier < 3 ? nextTierObj.min - totalPoints : 0}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    {currentTier < 3 ? "Points to Next Tier" : "Max Tier Reached!"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
