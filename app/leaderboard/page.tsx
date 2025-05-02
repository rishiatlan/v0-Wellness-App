"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { OptimizedAvatar } from "@/components/optimized-avatar"

// Helper function to extract name from email
function extractNameFromEmail(email: string): string {
  if (!email) return "Unknown User"

  // Handle user-xxx@atlan.com format
  if (email.startsWith("user-")) {
    return "Atlan User"
  }

  // Extract name from standard email format
  const namePart = email.split("@")[0]
  return namePart
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

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

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        if (loading) {
          setLoading(false)
          toast({
            title: "Loading timed out",
            description: "Please try refreshing the page",
            variant: "destructive",
          })
        }
      }, 15000) // 15 seconds timeout

      return () => clearTimeout(timeout)
    }
  }, [loading, toast])

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
    <div className="container px-4 py-8 text-white">
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
          className="flex items-center gap-1 bg-navy-900 border-navy-800 text-white hover:bg-navy-800"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="individuals" onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <TabsList className="w-full sm:w-auto bg-navy-900 border border-navy-800">
            <TabsTrigger value="individuals" className="flex items-center gap-1 data-[state=active]:bg-navy-800">
              <Trophy className="h-4 w-4" />
              <span>Individuals</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-1 data-[state=active]:bg-navy-800">
              <Users className="h-4 w-4" />
              <span>Teams</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8 w-full sm:w-[200px] bg-navy-900 border-navy-800 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searching && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-blue-400" />}
            </div>

            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-navy-900 border-navy-800 text-white">
                <SelectValue placeholder="Filter by time" />
              </SelectTrigger>
              <SelectContent className="bg-navy-900 border-navy-800 text-white">
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="all-time">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="individuals">
          <Card className="bg-navy-950 border-navy-800">
            <CardHeader className="border-b border-navy-800">
              <CardTitle className="text-white">Individual Leaderboard</CardTitle>
              <CardDescription className="text-slate-400">Top performers in the wellness challenge.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {filteredIndividuals.map((individual) => (
                  <div
                    key={individual.id}
                    className={`flex items-center justify-between rounded-lg p-4 ${
                      individual.rank <= 3
                        ? "bg-gradient-to-r from-navy-900 to-navy-800 border border-navy-700"
                        : "bg-navy-900/60 border border-navy-800"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                          individual.rank === 1
                            ? "bg-amber-500 text-black"
                            : individual.rank === 2
                              ? "bg-slate-300 text-black"
                              : individual.rank === 3
                                ? "bg-amber-700 text-white"
                                : "bg-navy-800 text-white"
                        }`}
                      >
                        {individual.rank}
                      </div>
                      <OptimizedAvatar
                        userId={individual.id}
                        email={individual.email}
                        name={individual.full_name || extractNameFromEmail(individual.email)}
                        fallbackUrl={individual.avatar_url}
                        className="border-2 border-navy-700"
                      />
                      <div>
                        <div className="font-medium text-white flex items-center gap-1">
                          {individual.full_name || extractNameFromEmail(individual.email)}
                          {individual.badge && <span className="ml-1">{individual.badge}</span>}
                        </div>
                        <div className="text-sm text-slate-400">{individual.email}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-700">
                        {individual.total_points} pts
                      </Badge>
                      <span className="text-xs text-slate-400 mt-1">Tier: {getTierName(individual.current_tier)}</span>
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
          <Card className="bg-navy-950 border-navy-800">
            <CardHeader className="border-b border-navy-800">
              <CardTitle className="text-white">Team Leaderboard</CardTitle>
              <CardDescription className="text-slate-400">
                Top performing teams in the wellness challenge.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {filteredTeams.map((team, index) => (
                  <div
                    key={team.id}
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      index < 3
                        ? "bg-gradient-to-r from-navy-900 to-navy-800 border-navy-700"
                        : "bg-navy-900/60 border-navy-800"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                          index === 0
                            ? "bg-amber-500 text-black"
                            : index === 1
                              ? "bg-slate-300 text-black"
                              : index === 2
                                ? "bg-amber-700 text-white"
                                : "bg-navy-800 text-white"
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
                      />
                      <div>
                        <div className="font-medium text-white flex items-center gap-1">
                          {team.name || `Team ${index + 1}`}
                          {index < 3 && <span className="ml-1">{["🥇", "🥈", "🥉"][index]}</span>}
                        </div>
                        <div className="text-sm text-slate-400">{team.members || 0} members</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-700">
                        {team.total_points || 0} pts
                      </Badge>
                      <span className="text-xs text-slate-400 mt-1">
                        Avg: {Math.round(team.total_points / (team.members || 1))} pts/member
                      </span>
                    </div>
                  </div>
                ))}

                {filteredTeams.length === 0 && (
                  <div className="text-center py-8 text-slate-400">No results found for "{searchQuery}"</div>
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
