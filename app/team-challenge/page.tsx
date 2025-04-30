"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Trophy, Award, Users, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUserTeam } from "@/app/actions/team-actions"
import { getTeamsClient } from "@/lib/api-client"
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function TeamChallenge() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userTeam, setUserTeam] = useState<any>(null)
  const [allTeams, setAllTeams] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("all-teams")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch teams using client-side function
        try {
          console.log("Fetching teams data...")
          const teamsData = await getTeamsClient()
          console.log("Teams data received:", teamsData)

          if (teamsData && teamsData.length > 0) {
            // Process the teams data to add member counts
            const processedTeams = teamsData.map((team) => ({
              ...team,
              // We'll fetch member counts separately if needed
              memberCount: 0,
            }))
            setAllTeams(processedTeams)
          } else {
            console.log("No teams data received")
            setAllTeams([])
          }
        } catch (teamsError: any) {
          console.error("Error fetching teams:", teamsError)
          setError(`Failed to load teams: ${teamsError.message}`)
          setAllTeams([])
        }

        // If user is logged in, fetch their team
        if (user?.id) {
          try {
            const userTeamData = await getUserTeam(user.id)
            setUserTeam(userTeamData)

            // If user has a team, set the active tab to "my-team"
            if (userTeamData) {
              setActiveTab("my-team")
            }
          } catch (userTeamError: any) {
            console.error("Error fetching user team:", userTeamError)
            // Don't set main error for this, just log it
          }
        }
      } catch (error: any) {
        console.error("Error in fetchTeamData:", error)
        setError(`Failed to load team data: ${error.message}`)
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

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Team Challenge</h1>
        <p className="text-muted-foreground">Teams competing in the Spring Wellness Challenge</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-teams">All Teams</TabsTrigger>
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
                          <Avatar className="h-10 w-10 border-2 border-navy-700">
                            <AvatarImage
                              src={team.banner_url || getAvatarUrl(team.id || `team-${index}`, "team")}
                              alt={team.name || `Team ${index + 1}`}
                            />
                            <AvatarFallback className="bg-navy-700 text-white">
                              {getInitials(team.name || `T${index + 1}`)}
                            </AvatarFallback>
                          </Avatar>
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
                      <Avatar className="h-12 w-12 border-2 border-navy-700">
                        <AvatarImage
                          src={userTeam.banner_url || getAvatarUrl(userTeam.id, "team")}
                          alt={userTeam.name}
                        />
                        <AvatarFallback className="bg-navy-700 text-white">{getInitials(userTeam.name)}</AvatarFallback>
                      </Avatar>
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
                              <Avatar>
                                <AvatarImage
                                  src={member.avatar_url || getAvatarUrl(member.id || member.email, "user")}
                                  alt={member.full_name || "User"}
                                />
                                <AvatarFallback className="bg-navy-700 text-white">
                                  {getInitials(member.full_name || member.email)}
                                </AvatarFallback>
                              </Avatar>
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
          <Avatar className="h-10 w-10 border-2 border-navy-700">
            <AvatarImage
              src={team.banner_url || getAvatarUrl(team.id || team.name, "team")}
              alt={team.name || "Team"}
            />
            <AvatarFallback className="bg-navy-700 text-white">{getInitials(team.name || "Team")}</AvatarFallback>
          </Avatar>
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
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={member.avatar_url || getAvatarUrl(member.id || member.email, "user")}
                    alt={member.full_name || "User"}
                  />
                  <AvatarFallback className="text-xs bg-navy-700 text-white">
                    {getInitials(member.full_name || member.email)}
                  </AvatarFallback>
                </Avatar>
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
