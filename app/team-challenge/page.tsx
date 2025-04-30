"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Trophy, Award, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUserTeam, getTopTeams, getAllTeamsWithMembers } from "@/app/actions/team-actions"

export default function TeamChallenge() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userTeam, setUserTeam] = useState<any>(null)
  const [allTeams, setAllTeams] = useState<any[]>([])
  const [topTeams, setTopTeams] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("all-teams")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all teams with members
        const teamsData = await getAllTeamsWithMembers()
        setAllTeams(teamsData || [])

        // Fetch top teams
        const topTeamsData = await getTopTeams(5)
        setTopTeams(topTeamsData || [])

        // If user is logged in, fetch their team
        if (user?.id) {
          try {
            const userTeamData = await getUserTeam(user.id)
            setUserTeam(userTeamData)

            // If user has a team, set the active tab to "my-team"
            if (userTeamData) {
              setActiveTab("my-team")
            }
          } catch (userTeamError) {
            console.error("Error fetching user team:", userTeamError)
            // Don't set error here, just log it
          }
        }
      } catch (error) {
        console.error("Error fetching team data:", error)
        setError("Failed to load team data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    // Only fetch data if auth is not loading
    if (!authLoading) {
      fetchTeamData()
    }
  }, [user, authLoading])

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

  if (error) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Team Challenge</h1>
        <p className="text-muted-foreground">Teams competing in the Spring Wellness Challenge</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-teams">All Teams</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="my-team" disabled={!user || !userTeam}>
            My Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-teams" className="space-y-4">
          {allTeams.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {allTeams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Teams Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p>There are currently no teams in the challenge.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span>Team Leaderboard</span>
              </CardTitle>
              <CardDescription>Top performing teams in the wellness challenge</CardDescription>
            </CardHeader>
            <CardContent>
              {allTeams.length > 0 ? (
                <div className="space-y-4">
                  {allTeams
                    .sort((a, b) => b.total_points - a.total_points)
                    .map((team, index) => (
                      <div
                        key={team.id}
                        className={`flex items-center justify-between rounded-lg border p-4 ${
                          index < 3 ? "bg-gradient-to-r from-navy-900/50 to-navy-800/50" : ""
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
                          <div>
                            <div className="font-medium">{team.name}</div>
                            <div className="text-xs text-muted-foreground">{team.memberCount} members</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-900/20 text-blue-400">
                            {team.total_points} pts
                          </Badge>
                          {index === 0 && <Trophy className="h-4 w-4 text-amber-500" />}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p>No teams available for the leaderboard.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-team">
          {user ? (
            userTeam ? (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{userTeam.name}</CardTitle>
                    <CardDescription>Your wellness team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        <span className="font-medium">Team Points:</span>
                      </div>
                      <Badge className="bg-blue-900/20 text-blue-400">{userTeam.total_points} points</Badge>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Team Members</h3>
                      {userTeam.members && userTeam.members.length > 0 ? (
                        userTeam.members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{member.full_name?.charAt(0) || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.full_name || "Unknown User"}</div>
                                <div className="text-xs text-muted-foreground">{member.email}</div>
                              </div>
                            </div>
                            <Badge variant="outline">{member.total_points} pts</Badge>
                          </div>
                        ))
                      ) : (
                        <p>No team members found.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <span>Team Stats</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-blue-900/20 p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">{userTeam.total_points}</div>
                        <div className="text-sm text-blue-300">Total Points</div>
                      </div>
                      <div className="rounded-lg bg-teal-900/20 p-4 text-center">
                        <div className="text-2xl font-bold text-teal-400">{userTeam.avgPoints}</div>
                        <div className="text-sm text-teal-300">Avg Points</div>
                      </div>
                      <div className="rounded-lg bg-emerald-900/20 p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">{userTeam.members?.length || 0}/5</div>
                        <div className="text-sm text-emerald-300">Members</div>
                      </div>
                      <div className="rounded-lg bg-purple-900/20 p-4 text-center">
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
              <Card>
                <CardHeader>
                  <CardTitle>No Team Found</CardTitle>
                  <CardDescription>You are not currently part of any team</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Contact your administrator to be assigned to a team.</p>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Not Logged In</CardTitle>
                <CardDescription>Please log in to view your team</CardDescription>
              </CardHeader>
              <CardContent>
                <p>You need to be logged in to view your team information.</p>
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{team.name}</span>
          <Badge className="bg-blue-900/20 text-blue-400">{team.total_points} pts</Badge>
        </CardTitle>
        <CardDescription>{team.memberCount} team members</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {team.members && team.members.length > 0 ? (
            team.members.map((member) => (
              <div key={member.id} className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">{member.full_name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-sm">{member.full_name || "Unknown User"}</span>
                  <span className="text-xs text-muted-foreground">{member.total_points} pts</span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
              <Users className="mr-2 h-4 w-4" />
              No members
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
