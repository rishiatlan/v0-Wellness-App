"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Trophy, Users, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getIndividualLeaderboard,
  getTeamLeaderboard,
  searchUsers,
  searchTeams,
} from "@/app/actions/leaderboard-actions"
import { Button } from "@/components/ui/button"

export default function Leaderboard() {
  const { toast } = useToast()
  const [timeFilter, setTimeFilter] = useState("all-time")
  const [searchQuery, setSearchQuery] = useState("")
  const [individuals, setIndividuals] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [filteredIndividuals, setFilteredIndividuals] = useState<any[]>([])
  const [filteredTeams, setFilteredTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [activeTab, setActiveTab] = useState("individuals")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true)
        const [individualsData, teamsData] = await Promise.all([getIndividualLeaderboard(), getTeamLeaderboard()])

        setIndividuals(individualsData)
        setFilteredIndividuals(individualsData)
        setTeams(teamsData)
        setFilteredTeams(teamsData)
      } catch (error) {
        console.error("Error fetching leaderboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load leaderboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboardData()
  }, [toast])

  useEffect(() => {
    const handleSearch = async () => {
      if (!searchQuery.trim()) {
        setFilteredIndividuals(individuals)
        setFilteredTeams(teams)
        return
      }

      setSearching(true)

      try {
        if (activeTab === "individuals") {
          const results = await searchUsers(searchQuery)
          setFilteredIndividuals(
            results.map((user, index) => ({
              ...user,
              rank: index + 1,
              badge: index < 3 ? ["🥇", "🥈", "🥉"][index] : null,
            })),
          )
        } else {
          const results = await searchTeams(searchQuery)
          setFilteredTeams(
            results.map((team, index) => ({
              ...team,
              rank: index + 1,
              badge: index < 3 ? ["🥇", "🥈", "🥉"][index] : null,
            })),
          )
        }
      } catch (error) {
        console.error("Error searching:", error)
      } finally {
        setSearching(false)
      }
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, activeTab, individuals, teams])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const [individualsData, teamsData] = await Promise.all([getIndividualLeaderboard(), getTeamLeaderboard()])

      setIndividuals(individualsData)
      setFilteredIndividuals(individualsData)
      setTeams(teamsData)
      setFilteredTeams(teamsData)

      toast({
        title: "Refreshed",
        description: "Leaderboard data has been updated.",
      })
    } catch (error) {
      console.error("Error refreshing leaderboard data:", error)
      toast({
        title: "Error",
        description: "Failed to refresh leaderboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container px-4 py-8">
      <div className="mb-8 space-y-2 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Leaderboard</h1>
          <p className="text-muted-foreground">See who's leading the wellness challenge.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="individuals" onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="individuals" className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span>Individuals</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Teams</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8 w-full sm:w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searching && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-primary" />}
            </div>

            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="all-time">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="individuals">
          <Card>
            <CardHeader>
              <CardTitle>Individual Leaderboard</CardTitle>
              <CardDescription>Top performers in the wellness challenge.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredIndividuals.map((individual) => (
                  <div
                    key={individual.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      individual.rank <= 3 ? "bg-amber-50 dark:bg-amber-900/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {individual.rank}
                      </div>
                      <Avatar>
                        <AvatarImage src={individual.avatar_url || "/placeholder.svg"} alt={individual.full_name} />
                        <AvatarFallback>{individual.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          {individual.full_name}
                          {individual.badge && <span>{individual.badge}</span>}
                        </div>
                        <div className="text-sm text-muted-foreground">{individual.email}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                      >
                        {individual.total_points} pts
                      </Badge>
                      <span className="text-xs text-muted-foreground mt-1">
                        Tier: {getTierName(individual.current_tier)}
                      </span>
                    </div>
                  </div>
                ))}

                {filteredIndividuals.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No results found for "{searchQuery}"</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Team Leaderboard</CardTitle>
              <CardDescription>Top performing teams in the wellness challenge.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTeams.map((team) => (
                  <div
                    key={team.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      team.rank <= 3 ? "bg-amber-50 dark:bg-amber-900/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">{team.rank}</div>
                      <Avatar>
                        <AvatarImage src={team.banner_url || "/placeholder.svg"} alt={team.name} />
                        <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          {team.name}
                          {team.badge && <span>{team.badge}</span>}
                        </div>
                        <div className="text-sm text-muted-foreground">{team.members} members</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                      >
                        {team.total_points} pts
                      </Badge>
                      <span className="text-xs text-muted-foreground mt-1">
                        Avg: {Math.round(team.total_points / (team.members || 1))} pts/member
                      </span>
                    </div>
                  </div>
                ))}

                {filteredTeams.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No results found for "{searchQuery}"</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to get tier name
function getTierName(tier: number): string {
  switch (tier) {
    case 1:
      return "Seedling 🌱"
    case 2:
      return "Bloomer 🌿"
    case 3:
      return "Champion 🌳"
    default:
      return "Getting Started"
  }
}
