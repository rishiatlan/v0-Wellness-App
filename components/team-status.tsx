"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Trophy, ArrowRight } from "lucide-react"
import Link from "next/link"
import { getUserTeam } from "@/app/actions/team-actions"
import { useAuth } from "@/lib/auth-context"
import { OptimizedAvatar } from "@/components/optimized-avatar"

interface TeamStatusProps {
  variant?: "compact" | "full"
  className?: string
}

export function TeamStatus({ variant = "full", className = "" }: TeamStatusProps) {
  const { user } = useAuth()
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeam = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const teamData = await getUserTeam(user.id)
        setTeam(teamData)
      } catch (err: any) {
        console.error("Error fetching team:", err)
        setError(err.message || "Failed to load team information")
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchTeam()
    }
  }, [user?.id])

  if (variant === "compact") {
    return (
      <Card className={`bg-navy-950 border-navy-800 ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-400" />
              Team Status
            </CardTitle>
            <Link href="/team-challenge">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-blue-400 hover:text-blue-300 hover:bg-navy-800"
              >
                Details
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4 bg-navy-800" />
              <Skeleton className="h-4 w-1/2 bg-navy-800" />
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : team ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-white">{team.name}</div>
                <Badge className="bg-blue-900/20 text-blue-400 border-blue-700">
                  {team.members?.length || 0} members
                </Badge>
              </div>
              <div className="text-xs text-slate-400">Team Rank: {team.rank || "Calculating..."}</div>
            </div>
          ) : (
            <div className="text-center py-1">
              <div className="text-yellow-400 text-sm mb-2">You're not part of a team yet</div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 w-full"
                asChild
              >
                <Link href="/team-challenge">Join a Team</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-navy-950 border-navy-800 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-400" />
          Team Status
        </CardTitle>
        <CardDescription>Your team membership and performance</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4 bg-navy-800" />
            <Skeleton className="h-20 w-full bg-navy-800" />
            <Skeleton className="h-6 w-1/2 bg-navy-800" />
          </div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : team ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="mr-3">
                  <Trophy className="h-8 w-8 text-amber-500" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{team.name}</div>
                  <div className="text-sm text-slate-400">
                    Rank: {team.rank || "Calculating..."} of {team.totalTeams || "?"}
                  </div>
                </div>
              </div>
              <Badge className="bg-blue-900/20 text-blue-400 border-blue-700">
                {team.members?.length || 0} / 5 members
              </Badge>
            </div>

            <div className="rounded-lg border border-navy-800 p-3 mb-4">
              <div className="text-sm font-medium text-white mb-2">Team Members</div>
              <div className="flex flex-wrap gap-2">
                {team.members?.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-1.5 bg-navy-900 rounded-full px-2 py-1">
                    <OptimizedAvatar userId={member.id} email={member.email} name={member.full_name} size="xs" />
                    <span className="text-xs text-slate-300 truncate max-w-[100px]">
                      {member.full_name || member.email?.split("@")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg bg-blue-900/20 p-3 text-center border border-blue-800">
                <div className="text-2xl font-bold text-blue-400">{team.total_points || 0}</div>
                <div className="text-xs text-blue-300">Team Points</div>
              </div>
              <div className="rounded-lg bg-emerald-900/20 p-3 text-center border border-emerald-800">
                <div className="text-2xl font-bold text-emerald-400">{team.avgPoints || 0}</div>
                <div className="text-xs text-emerald-300">Avg. Points</div>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
              asChild
            >
              <Link href="/team-challenge">View Team Dashboard</Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-yellow-400 mb-3">You're not part of a team yet</div>
            <p className="text-sm text-slate-400 mb-4">
              Join a team to participate in team challenges and earn bonus points!
            </p>
            <Button
              className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
              asChild
            >
              <Link href="/team-challenge">Join a Team</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
