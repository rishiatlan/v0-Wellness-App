"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Trophy, Award, Users, AlertCircle, RefreshCcw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUserTeam } from "@/app/actions/team-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { OptimizedAvatar } from "@/components/optimized-avatar"

export default function TeamChallenge() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userTeam, setUserTeam] = useState<any>(null)
  const [allTeams, setAllTeams] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("all-teams")
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchTeamData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setDebugInfo("Starting to fetch team data...")

      // Try to fetch teams from the API endpoint
      try {
        setDebugInfo("Fetching teams from API endpoint...")
        const response = await fetch(`/api/teams?cache=${Date.now()}`) // Add cache-busting parameter

        if (!response.ok) {
          const errorText = await response.text()
          setDebugInfo(`API error: ${response.status} - ${errorText}`)
          throw new Error(`API returned status ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        setDebugInfo(`Teams data received: ${data.teams ? data.teams.length : 0} teams`)
        console.log("Teams data:", data)

        if (data.teams && data.teams.length > 0) {
          setAllTeams(data.teams)
        } else {
          setDebugInfo("No teams data received from API")

          // Try fallback to server action
          setDebugInfo("Trying fallback to server action...")
          const { getAllTeamsWithMembers } = await import("@/app/actions/team-actions")
          const teamsData = await getAllTeamsWithMembers()

          if (teamsData && teamsData.length > 0) {
            setAllTeams(teamsData)
            setDebugInfo(`Fallback successful: ${teamsData.length} teams loaded`)
          } else {
            setAllTeams([])
            setError("No teams found in the database. Please contact your administrator.")
          }
        }
      } catch (teamsError: any) {
        console.error("Error fetching teams:", teamsError)
        setDebugInfo(`Error fetching teams: ${teamsError.message}`)

        // Try fallback to server action
        try {
          setDebugInfo("Trying fallback to server action...")
          const { getAllTeamsWithMembers } = await import("@/app/actions/team-actions")
          const teamsData = await getAllTeamsWithMembers()

          if (teamsData && teamsData.length > 0) {
            setAllTeams(teamsData)
            setDebugInfo(`Fallback successful: ${teamsData.length} teams loaded`)
          } else {
            setAllTeams([])
            setError(`Failed to load teams: ${teamsError.message}`)
          }
        } catch (fallbackError: any) {
          setAllTeams([])
          setError(`Failed to load teams: ${teamsError.message}. Fallback also failed: ${fallbackError.message}`)
        }
      }

      // If user is logged in, fetch their team
      if (user?.id) {
        try {
          setDebugInfo(`Fetching team for user ${user.id}...`)
          const userTeamData = await getUserTeam(user.id)

          if (userTeamData) {
            setDebugInfo(`User team found: ${userTeamData.name}`)
            setUserTeam(userTeamData)
            setActiveTab("my-team")
          } else {
            setDebugInfo("No team found for user")
          }
        } catch (userTeamError: any) {
          console.error("Error fetching user team:", userTeamError)
          setDebugInfo(`Error fetching user team: ${userTeamError.message}`)
          // Don't set main error for this, just log it
        }
      }
    } catch (error: any) {
      console.error("Error in fetchTeamData:", error)
      setDebugInfo(`General error: ${error.message}`)
      setError(`Failed to load team data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [user, retryCount]) // Add retryCount to dependencies

  useEffect(() => {
    // Only fetch data if auth is not loading
    if (!authLoading) {
      fetchTeamData()
    }
  }, [fetchTeamData, authLoading])

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        if (loading) {
          setLoading(false)
          setError("Loading timed out. Please try refreshing the page.")
        }
      }, 15000) // 15 seconds timeout

      return () => clearTimeout(timeout)
    }
  }, [loading])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    setError(null)
    setLoading(true)
    fetchTeamData()
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Challenge</h1>
          <p className="text-muted-foreground">Teams competing in the Spring Wellness Challenge</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {debugInfo && (
        <Alert className="mb-6 bg-blue-900/20 border-blue-800">
          <AlertTitle>Debug Info</AlertTitle>
          <AlertDescription className="text-blue-300">{debugInfo}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-teams">All Teams ({allTeams.length})</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="my-team" disabled={!user || !userTeam}>
            My Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-teams" className="space-y-4">
          {allTeams && allTeams.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {allTeams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          ) : (
            <Card className="bg-navy-950 border-navy-800">
              <CardHeader>
                <CardTitle className="text-white">No Teams Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">There are currently no teams in the challenge.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card className="bg-navy-950 border-navy-800">
            <CardHeader className="border-b border-navy-800">
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span>Team Leaderboard</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Top performing teams in the wellness challenge
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {allTeams && allTeams.length > 0 ? (
                <div className="space-y-4">
                  {allTeams
                    .sort((a, b) => b.total_points - a.total_points)
                    .map((team, index) => (
                      <div
                        key={team.id}
                        className={`flex items-center justify-between rounded-lg border p-4 ${
                          index < 3
                            ? "bg-gradient-to-r from-navy-900/50 to-navy-800/50 border-navy-700"
                            : "border-navy-800"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              index === 0
                                ? "bg-amber-500/20 text-amber-500"
                                : index === 1
                                  ? "bg-slate-400/20 text-slate-400"
                                  : index === 2
                                    ? "bg-amber-700/20 text-amber-700"
                                    : "bg-navy-700/20 text-navy-300"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <OptimizedAvatar
                            userId={team.id}
                            name={team.name || `Team ${index + 1}`}
                            type="team"
                            fallbackUrl={team.banner_url}
                            className="border-2 border-navy-700"
                            size="md"
                          />
                          <div>
                            <div className="font-medium text-white">{team.name || "Team " + (index + 1)}</div>
                            <div className="text-xs text-slate-400">{team.memberCount || 0} members</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-700">
                            {team.total_points || 0} pts
                          </Badge>
                          {index === 0 && <Trophy className="h-4 w-4 text-amber-500" />}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center py-8 text-slate-400">No teams available for the leaderboard.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-team">
          {user ? (
            userTeam ? (
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-navy-950 border-navy-800">
                  <CardHeader className="border-b border-navy-800">
                    <div className="flex items-center gap-4">
                      <OptimizedAvatar
                        userId={userTeam.id}
                        name={userTeam.name}
                        type="team"
                        fallbackUrl={userTeam.banner_url}
                        className="border-2 border-navy-700"
                        size="lg"
                      />
                      <div>
                        <CardTitle className="text-white">{userTeam.name}</CardTitle>
                        <CardDescription className="text-slate-400">Your wellness team</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        <span className="font-medium text-white">Team Points:</span>
                      </div>
                      <Badge className="bg-blue-900/20 text-blue-400 border-blue-700">
                        {userTeam.total_points} points
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-white">Team Members</h3>
                      {userTeam.members && userTeam.members.length > 0 ? (
                        userTeam.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between rounded-lg border border-navy-800 p-3"
                          >
                            <div className="flex items-center gap-3">
                              <OptimizedAvatar
                                userId={member.id}
                                email={member.email}
                                name={member.full_name}
                                fallbackUrl={member.avatar_url}
                                size="sm"
                              />
                              <div>
                                <div className="font-medium text-white">{member.full_name || "Unknown User"}</div>
                                <div className="text-xs text-slate-400">{member.email}</div>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-700">
                              {member.total_points} pts
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400">No team members found.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-navy-950 border-navy-800">
                  <CardHeader className="border-b border-navy-800">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Award className="h-5 w-5 text-primary" />
                      <span>Team Stats</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-blue-900/20 p-4 text-center border border-blue-800">
                        <div className="text-2xl font-bold text-blue-400">{userTeam.total_points}</div>
                        <div className="text-sm text-blue-300">Total Points</div>
                      </div>
                      <div className="rounded-lg bg-teal-900/20 p-4 text-center border border-teal-800">
                        <div className="text-2xl font-bold text-teal-400">{userTeam.avgPoints}</div>
                        <div className="text-sm text-teal-300">Avg Points</div>
                      </div>
                      <div className="rounded-lg bg-emerald-900/20 p-4 text-center border border-emerald-800">
                        <div className="text-2xl font-bold text-emerald-400">{userTeam.members?.length || 0}/5</div>
                        <div className="text-sm text-emerald-300">Members</div>
                      </div>
                      <div className="rounded-lg bg-purple-900/20 p-4 text-center border border-purple-800">
                        <div className="text-2xl font-bold text-purple-400">
                          {allTeams.findIndex((t) => t.id === userTeam.id) + 1 || "-"}
                        </div>
                        <div className="text-sm text-purple-300">Rank</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-navy-950 border-navy-800">
                <CardHeader>
                  <CardTitle className="text-white">No Team Found</CardTitle>
                  <CardDescription className="text-slate-400">You are not currently part of any team</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">Contact your administrator to be assigned to a team.</p>
                </CardContent>
              </Card>
            )
          ) : (
            <Card className="bg-navy-950 border-navy-800">
              <CardHeader>
                <CardTitle className="text-white">Not Logged In</CardTitle>
                <CardDescription className="text-slate-400">Please log in to view your team</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">You need to be logged in to view your team information.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TeamCard({ team }) {
  return (
    <Card className="bg-navy-950 border-navy-800">
      <CardHeader className="pb-2 border-b border-navy-800">
        <div className="flex items-center gap-3 mb-2">
          <OptimizedAvatar
            userId={team.id}
            name={team.name || "Team"}
            type="team"
            fallbackUrl={team.banner_url}
            className="border-2 border-navy-700"
            size="md"
          />
          <CardTitle className="flex items-center justify-between text-white">
            <span>{team.name || "Unnamed Team"}</span>
          </CardTitle>
        </div>
        <div className="flex items-center justify-between">
          <CardDescription className="text-slate-400">{team.memberCount || 0} team members</CardDescription>
          <Badge className="bg-blue-900/20 text-blue-400 border-blue-700">{team.total_points || 0} pts</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          {team.members && team.members.length > 0 ? (
            team.members.map((member) => (
              <div key={member.id} className="flex items-center gap-2">
                <OptimizedAvatar
                  userId={member.id}
                  email={member.email}
                  name={member.full_name}
                  fallbackUrl={member.avatar_url}
                  size="sm"
                />
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-sm text-white">{member.full_name || "Unknown User"}</span>
                  <span className="text-xs text-slate-400">{member.total_points || 0} pts</span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center py-2 text-sm text-slate-400">
              <Users className="mr-2 h-4 w-4" />
              No members
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
