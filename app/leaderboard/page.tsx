"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils"
import { dataCache } from "@/lib/data-cache"

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
  const isMounted = useRef(true)
  const initialLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchLeaderboardData = useCallback(async () => {
    if (!isMounted.current) return

    try {
      setLoading(true)

      // Check cache first
      const individualsCacheKey = `individuals-leaderboard-${timeFilter}`
      const teamsCacheKey = `teams-leaderboard-${timeFilter}`

      let individualsData, teamsData

      if (dataCache.has(individualsCacheKey)) {
        individualsData = dataCache.get(individualsCacheKey)
      } else {
        individualsData = await getIndividualLeaderboard()
        dataCache.set(individualsCacheKey, individualsData, 2 * 60 * 1000) // Cache for 2 minutes
      }

      if (dataCache.has(teamsCacheKey)) {
        teamsData = dataCache.get(teamsCacheKey)
      } else {
        teamsData = await getTeamLeaderboard()
        dataCache.set(teamsCacheKey, teamsData, 2 * 60 * 1000) // Cache for 2 minutes
      }

      if (isMounted.current) {
        setIndividuals(individualsData)
        setFilteredIndividuals(individualsData)
        setTeams(teamsData)
        setFilteredTeams(teamsData)
        setLoading(false)
      }
    } catch (error) {
      console.error("Error fetching leaderboard data:", error)
      if (isMounted.current) {
        toast({
          title: "Error",
          description: "Failed to load leaderboard data. Please try again.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }
  }, [toast, timeFilter])

  useEffect(() => {
    isMounted.current = true

    fetchLeaderboardData()

    // Set a timeout to stop showing loading state after 3 seconds
    initialLoadTimeoutRef.current = setTimeout(() => {
      if (isMounted.current && loading) {
        setLoading(false)
      }
    }, 3000) // 3 seconds timeout

    return () => {
      isMounted.current = false
      if (initialLoadTimeoutRef.current) {
        clearTimeout(initialLoadTimeoutRef.current)
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [fetchLeaderboardData])

  useEffect(() => {
    const handleSearch = async () => {
      if (!searchQuery.trim()) {
        setFilteredIndividuals(individuals)
        setFilteredTeams(teams)
        return
      }

      if (!isMounted.current) return

      setSearching(true)

      try {
        // Check cache first
        const searchCacheKey = `search-${activeTab}-${searchQuery}`

        if (dataCache.has(searchCacheKey)) {
          const cachedResults = dataCache.get(searchCacheKey)
          if (activeTab === "individuals") {
            setFilteredIndividuals(cachedResults)
          } else {
            setFilteredTeams(cachedResults)
          }
          setSearching(false)
          return
        }

        if (activeTab === "individuals") {
          const results = await searchUsers(searchQuery)
          const rankedResults = results.map((user, index) => ({
            ...user,
            rank: index + 1,
            badge: index < 3 ? ["🥇", "🥈", "🥉"][index] : null,
          }))

          if (isMounted.current) {
            setFilteredIndividuals(rankedResults)
            dataCache.set(searchCacheKey, rankedResults, 60 * 1000) // Cache for 1 minute
          }
        } else {
          const results = await searchTeams(searchQuery)
          const rankedResults = results.map((team, index) => ({
            ...team,
            rank: index + 1,
            badge: index < 3 ? ["🥇", "🥈", "🥉"][index] : null,
          }))

          if (isMounted.current) {
            setFilteredTeams(rankedResults)
            dataCache.set(searchCacheKey, rankedResults, 60 * 1000) // Cache for 1 minute
          }
        }
      } catch (error) {
        console.error("Error searching:", error)
      } finally {
        if (isMounted.current) {
          setSearching(false)
        }
      }
    }

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch()
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, activeTab, individuals, teams])

  const handleRefresh = async () => {
    if (!isMounted.current) return

    setRefreshing(true)
    try {
      // Clear cache
      dataCache.clear(`individuals-leaderboard-${timeFilter}`)
      dataCache.clear(`teams-leaderboard-${timeFilter}`)

      const [individualsData, teamsData] = await Promise.all([getIndividualLeaderboard(), getTeamLeaderboard()])

      if (isMounted.current) {
        setIndividuals(individualsData)
        setFilteredIndividuals(individualsData)
        setTeams(teamsData)
        setFilteredTeams(teamsData)

        toast({
          title: "Refreshed",
          description: "Leaderboard data has been updated.",
        })
      }
    } catch (error) {
      console.error("Error refreshing leaderboard data:", error)
      if (isMounted.current) {
        toast({
          title: "Error",
          description: "Failed to refresh leaderboard data. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (isMounted.current) {
        setRefreshing(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading leaderboard data...</p>
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
                      <Avatar className="h-10 w-10 border-2 border-navy-700">
                        <AvatarImage
                          src={individual.avatar_url || getAvatarUrl(individual.id || individual.email, "user")}
                          alt={individual.full_name || extractNameFromEmail(individual.email)}
                        />
                        <AvatarFallback className="bg-navy-700 text-white">
                          {getInitials(individual.full_name || individual.email)}
                        </AvatarFallback>
                      </Avatar>
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
