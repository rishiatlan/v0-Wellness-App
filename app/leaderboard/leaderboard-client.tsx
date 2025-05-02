"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getIndividualLeaderboard, getTeamLeaderboard } from "@/app/actions/leaderboard-actions"
import { useAuth } from "@/lib/auth-context"

// Define types for leaderboard data
type IndividualLeaderboardItem = {
  id: string
  user_id: string
  display_name: string
  points: number
  tier: string
  avatar_url?: string
}

type TeamLeaderboardItem = {
  id: string
  team_name: string
  points: number
  member_count: number
  logo_url?: string
}

interface LeaderboardClientProps {
  initialIndividuals: IndividualLeaderboardItem[]
  initialTeams: TeamLeaderboardItem[]
}

export default function LeaderboardClient({ initialIndividuals, initialTeams }: LeaderboardClientProps) {
  const [activeTab, setActiveTab] = useState("individuals")
  const { user } = useAuth()

  // Use React Query for data fetching with initial data
  const { data: individuals } = useQuery({
    queryKey: ["individualLeaderboard"],
    queryFn: getIndividualLeaderboard,
    initialData: initialIndividuals,
    refetchInterval: 60000, // Refetch every minute
  })

  const { data: teams } = useQuery({
    queryKey: ["teamLeaderboard"],
    queryFn: getTeamLeaderboard,
    initialData: initialTeams,
    refetchInterval: 60000, // Refetch every minute
  })

  // Find current user's rank if authenticated
  const currentUserRank = user ? individuals.findIndex((item) => item.user_id === user.id) + 1 : null

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col items-center justify-center mb-8">
        <h1 className="text-3xl font-bold text-center">Spring Wellness Challenge Leaderboard</h1>
        <p className="text-muted-foreground text-center mt-2">Track your progress and see how you compare to others!</p>
      </div>

      {currentUserRank && (
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-center font-medium">
              Your current rank: <span className="font-bold text-primary">{currentUserRank}</span> of{" "}
              {individuals.length} participants
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="individuals" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="individuals">Individual Leaderboard</TabsTrigger>
          <TabsTrigger value="teams">Team Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="individuals">
          <Card>
            <CardHeader>
              <CardTitle>Individual Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {individuals.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center p-3 rounded-lg ${
                      user && item.user_id === user.id ? "bg-primary/10 border border-primary/30" : "bg-card"
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-bold">{index + 1}</div>
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden ml-3">
                      {item.avatar_url ? (
                        <img
                          src={item.avatar_url || "/placeholder.svg"}
                          alt={item.display_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `/placeholder.svg?height=40&width=40`
                          }}
                        />
                      ) : (
                        <span className="text-xl font-bold">{item.display_name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="ml-4 flex-grow">
                      <p className="font-medium">{item.display_name}</p>
                      <p className="text-sm text-muted-foreground">Tier: {item.tier}</p>
                    </div>
                    <div className="flex-shrink-0 font-bold text-lg">{item.points} pts</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Team Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teams.map((team, index) => (
                  <div key={team.id} className="flex items-center p-3 rounded-lg bg-card">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-bold">{index + 1}</div>
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden ml-3">
                      {team.logo_url ? (
                        <img
                          src={team.logo_url || "/placeholder.svg"}
                          alt={team.team_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `/placeholder.svg?height=40&width=40`
                          }}
                        />
                      ) : (
                        <span className="text-xl font-bold">{team.team_name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="ml-4 flex-grow">
                      <p className="font-medium">{team.team_name}</p>
                      <p className="text-sm text-muted-foreground">{team.member_count} members</p>
                    </div>
                    <div className="flex-shrink-0 font-bold text-lg">{team.points} pts</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {!user && (
        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-center">
              <a href="/auth/login" className="text-primary font-medium hover:underline">
                Sign in
              </a>{" "}
              to track your progress and participate in the challenge!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
