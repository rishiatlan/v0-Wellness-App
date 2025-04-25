"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Trophy,
  Calendar,
  ArrowUp,
  Loader2,
  Camera,
  AlertCircle,
  Shuffle,
  Clock,
  Crown,
  UserPlus,
} from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getUserTeam,
  createTeam,
  getTeamAchievements,
  getWellnessWednesdays,
  uploadTeamImage,
  assignRandomTeam,
  leaveTeam,
  getTeamRank,
  getTopTeams,
  getAllTeamsWithMembers,
  checkWellnessWednesdayBonus,
  sendTeamInvite,
  removeTeamMember,
  transferTeamOwnership,
} from "@/app/actions/team-actions"

export default function TeamChallenge() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamData, setTeamData] = useState<any>(null)
  const [teamName, setTeamName] = useState("")
  const [teamBanner, setTeamBanner] = useState("/flourishing-team.png")
  const [creating, setCreating] = useState(false)
  const [achievements, setAchievements] = useState<any[]>([])
  const [wednesdayData, setWednesdayData] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [teamRank, setTeamRank] = useState<any>(null)
  const [topTeams, setTopTeams] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [joiningRandom, setJoiningRandom] = useState(false)
  const [leavingTeam, setLeavingTeam] = useState(false)
  const [checkingWednesday, setCheckingWednesday] = useState(false)
  const [wednesdayResult, setWednesdayResult] = useState<any>(null)
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [transferringOwnership, setTransferringOwnership] = useState(false)
  const [newOwnerEmail, setNewOwnerEmail] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [allTeams, setAllTeams] = useState<any[]>([])

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!user) return

      try {
        setError(null)
        setLoading(true)
        console.log("Fetching team data for user:", user.id)

        const team = await getUserTeam(user.id)
        setTeamData(team)
        console.log("Team data fetched:", team ? "found" : "not found")

        if (team) {
          // Fetch team achievements
          console.log("Fetching team achievements for team:", team.id)
          const achievementsData = await getTeamAchievements(team.id)
          setAchievements(achievementsData)
          console.log("Team achievements fetched:", achievementsData.length)

          // Fetch wellness wednesday data
          console.log("Fetching wellness wednesday data for team:", team.id)
          const wednesdayData = await getWellnessWednesdays(team.id)
          setWednesdayData(wednesdayData)
          console.log("Wellness wednesday data fetched:", wednesdayData.length)

          // Fetch team rank
          const rankData = await getTeamRank(team.id)
          setTeamRank(rankData)
          console.log("Team rank fetched:", rankData)
        }

        // Fetch top teams regardless of whether user has a team
        const topTeamsData = await getTopTeams(5)
        setTopTeams(topTeamsData)
        console.log("Top teams fetched:", topTeamsData.length)

        // Fetch all teams with members
        const allTeamsData = await getAllTeamsWithMembers()
        setAllTeams(allTeamsData)
        console.log("All teams fetched:", allTeamsData.length)
      } catch (error: any) {
        console.error("Error fetching team data:", error)
        setError(error.message || "Failed to load team data. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load team data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [user, toast])

  const createNewTeam = async () => {
    if (!user) return
    if (!teamName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a team name",
        variant: "destructive",
      })
      return
    }

    setCreating(true)

    try {
      const result = await createTeam(user.id, teamName, teamBanner)

      if (result.success) {
        toast({
          title: "Team Created",
          description:
            result.message ||
            (result.earlyBonus
              ? "Your team has been created successfully with a 50 point early formation bonus!"
              : "Your team has been created successfully!"),
        })

        // Add success message state
        setSuccessMessage(
          result.earlyBonus
            ? "Team created successfully with a 50 point early formation bonus! You are now the team creator."
            : "Team created successfully! You are now the team creator.",
        )

        setTeamData(result.team)

        // Fetch achievements for the new team
        const achievementsData = await getTeamAchievements(result.team.id)
        setAchievements(achievementsData)

        // Initialize empty wednesday data for the new team
        setWednesdayData([])

        // Fetch team rank
        const rankData = await getTeamRank(result.team.id)
        setTeamRank(rankData)

        // Refresh top teams
        const topTeamsData = await getTopTeams(5)
        setTopTeams(topTeamsData)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error creating team:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create team. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleJoinRandomTeam = async () => {
    if (!user) return

    setJoiningRandom(true)

    try {
      const result = await assignRandomTeam(user.id)

      if (result.success) {
        toast({
          title: "Team Assigned",
          description: "You have been assigned to a team!",
        })

        // Refresh team data
        const team = await getUserTeam(user.id)
        setTeamData(team)

        if (team) {
          // Fetch team achievements
          const achievementsData = await getTeamAchievements(team.id)
          setAchievements(achievementsData)

          // Fetch wellness wednesday data
          const wednesdayData = await getWellnessWednesdays(team.id)
          setWednesdayData(wednesdayData)

          // Fetch team rank
          const rankData = await getTeamRank(team.id)
          setTeamRank(rankData)
        }

        // Refresh top teams
        const topTeamsData = await getTopTeams(5)
        setTopTeams(topTeamsData)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error joining random team:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to join a random team. Please try again.",
        variant: "destructive",
      })
    } finally {
      setJoiningRandom(false)
    }
  }

  const handleLeaveTeam = async () => {
    if (!user || !teamData) return

    setLeavingTeam(true)

    try {
      const result = await leaveTeam(user.id)

      if (result.success) {
        toast({
          title: "Team Left",
          description: "You have left your team.",
        })

        // Reset team data
        setTeamData(null)
        setAchievements([])
        setWednesdayData([])
        setTeamRank(null)

        // Refresh top teams
        const topTeamsData = await getTopTeams(5)
        setTopTeams(topTeamsData)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error leaving team:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to leave team. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLeavingTeam(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!user || !teamData || !teamData.isCreator) return

    setRemovingMember(memberId)

    try {
      const result = await removeTeamMember(user.id, memberId, teamData.id)

      if (result.success) {
        toast({
          title: "Member Removed",
          description: "Team member has been removed successfully.",
        })

        // Refresh team data
        const team = await getUserTeam(user.id)
        setTeamData(team)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error removing team member:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove team member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRemovingMember(null)
    }
  }

  const handleTransferOwnership = async (newOwnerId: string) => {
    if (!user || !teamData || !teamData.isCreator) return

    setTransferringOwnership(true)

    try {
      const result = await transferTeamOwnership(user.id, newOwnerId, teamData.id)

      if (result.success) {
        toast({
          title: "Ownership Transferred",
          description: "Team ownership has been transferred successfully.",
        })

        // Refresh team data
        const team = await getUserTeam(user.id)
        setTeamData(team)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error transferring ownership:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to transfer ownership. Please try again.",
        variant: "destructive",
      })
    } finally {
      setTransferringOwnership(false)
    }
  }

  const handleSendInvite = async () => {
    if (!user || !teamData || !inviteEmail.trim()) return

    // Validate email
    if (!inviteEmail.endsWith("@atlan.com")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid @atlan.com email address.",
        variant: "destructive",
      })
      return
    }

    setInviting(true)

    try {
      const result = await sendTeamInvite(teamData.id, user.id, inviteEmail)

      if (result.success) {
        toast({
          title: "Invite Sent",
          description: result.message || "Team invitation sent successfully!",
        })
        setInviteEmail("")

        // Refresh team data to show new member
        const team = await getUserTeam(user.id)
        setTeamData(team)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error sending invite:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send invite. Please try again.",
        variant: "destructive",
      })
    } finally {
      setInviting(false)
    }
  }

  const handleCheckWednesdayBonus = async () => {
    if (!user || !teamData) return

    setCheckingWednesday(true)
    setWednesdayResult(null)

    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0]

      const result = await checkWellnessWednesdayBonus(teamData.id, today)
      setWednesdayResult(result)

      if (result.eligible && !result.alreadyAwarded) {
        toast({
          title: "Bonus Awarded!",
          description: `Your team earned a ${result.bonusPoints} point Wellness Wednesday bonus!`,
        })

        // Refresh team data
        const team = await getUserTeam(user.id)
        setTeamData(team)

        // Refresh achievements
        const achievementsData = await getTeamAchievements(teamData.id)
        setAchievements(achievementsData)

        // Refresh wednesday data
        const wednesdayData = await getWellnessWednesdays(teamData.id)
        setWednesdayData(wednesdayData)

        // Refresh team rank
        const rankData = await getTeamRank(team.id)
        setTeamRank(rankData)
      } else if (result.eligible && result.alreadyAwarded) {
        toast({
          title: "Already Awarded",
          description: "Your team has already received the Wellness Wednesday bonus for today.",
        })
      } else {
        toast({
          title: "Not Eligible",
          description: result.reason || "Your team is not eligible for the Wellness Wednesday bonus today.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error checking Wednesday bonus:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to check Wellness Wednesday bonus. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCheckingWednesday(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !teamData) return

    setUploading(true)

    try {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size exceeds 5MB limit")
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image files are allowed")
      }

      const result = await uploadTeamImage(teamData.id, file)

      if (result.success) {
        toast({
          title: "Image Uploaded",
          description: "Team banner has been updated successfully!",
        })

        // Update the team data with the new banner URL
        setTeamData({
          ...teamData,
          banner_url: result.url,
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    window.location.reload()
  }

  // Helper function to get next Wednesday date and countdown
  function getNextWednesdayCountdown() {
    const now = new Date()
    const day = now.getDay()
    const daysUntilWednesday = (3 - day + 7) % 7

    if (daysUntilWednesday === 0) {
      // It's Wednesday, calculate hours remaining
      const hoursRemaining = 23 - now.getHours()
      const minutesRemaining = 59 - now.getMinutes()

      if (hoursRemaining <= 0 && minutesRemaining <= 0) {
        return "Less than a minute left today!"
      }

      return `${hoursRemaining}h ${minutesRemaining}m remaining today`
    }

    return `${daysUntilWednesday} days until next Wellness Wednesday`
  }

  // Helper function to get next Wednesday date
  function getNextWednesday() {
    const today = new Date()
    const day = today.getDay()
    const daysUntilWednesday = (3 - day + 7) % 7
    const nextWednesday = new Date(today)
    nextWednesday.setDate(today.getDate() + daysUntilWednesday)
    return nextWednesday.toLocaleDateString()
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
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Team Challenge</CardTitle>
            <CardDescription>You need to be logged in to view team challenges</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/auth/login">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const teamMembers = teamData?.members || []
  const teamTotalPoints = teamData?.total_points || 0
  const teamAvgPoints = teamData?.avgPoints || 0
  const maxPossiblePoints = 1830 // Maximum possible team points

  return (
    <div className="container px-4 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Team Challenge</h1>
        <p className="text-muted-foreground">Join a team and earn bonus points together.</p>
      </div>

      {!teamData ? (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Join the Team Challenge</CardTitle>
                <CardDescription>
                  Teams of 5 members can earn bonus points on Wellness Wednesdays and compete for team prizes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">Team Bonus</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Teams get a 50-point bonus for being among the first 10 teams to form, and all team members earn +10
                    points on Wellness Wednesdays when everyone logs 20+ points.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Create Your Own Team</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="team-name" className="block text-sm font-medium mb-2">
                          Team Name
                        </label>
                        <Input
                          id="team-name"
                          placeholder="Enter a team name"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Team Banner</label>
                        <div className="rounded-lg border overflow-hidden">
                          <Image
                            src={teamBanner || "/placeholder.svg?height=200&width=600&query=team wellness banner"}
                            width={600}
                            height={200}
                            alt="Team Banner"
                            className="w-full h-40 object-cover"
                          />
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          Default banner provided. You can customize this after team creation.
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground mt-2 mb-4">
                        Note: Each user can only be part of one team. Once you create or join a team, you cannot join
                        another without leaving your current team first.
                      </div>

                      <Button onClick={createNewTeam} disabled={creating || !teamName.trim()} className="w-full">
                        {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {creating ? "Creating Team..." : "Create Team"}
                      </Button>

                      {successMessage && (
                        <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 text-center">
                          {successMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Join a Random Team</h3>
                    <div className="space-y-4">
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shuffle className="h-5 w-5 text-purple-500" />
                          <span className="font-medium">Random Assignment</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Get randomly assigned to a team with open spots. This promotes cross-functional interaction
                          and helps teams reach the 5-member limit.
                        </p>
                      </div>

                      <Button
                        onClick={handleJoinRandomTeam}
                        disabled={joiningRandom}
                        variant="outline"
                        className="w-full"
                      >
                        {joiningRandom ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Shuffle className="mr-2 h-4 w-4" />
                        )}
                        {joiningRandom ? "Joining Team..." : "Join Random Team"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span>Top Teams</span>
                </CardTitle>
                <CardDescription>Current team rankings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topTeams.length > 0 ? (
                    topTeams.map((team, index) => (
                      <div key={team.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            {index + 1}
                          </div>
                          <Avatar>
                            <AvatarImage src={team.banner_url || "/placeholder.svg"} alt={team.name} />
                            <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{team.name}</div>
                            <div className="text-xs text-muted-foreground">{team.members} members</div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                        >
                          {team.total_points} pts
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No teams found</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span>All Teams</span>
                </CardTitle>
                <CardDescription>Browse all available teams and their members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                  {allTeams.length > 0 ? (
                    allTeams.map((team) => (
                      <div key={team.id} className="rounded-lg border p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar>
                            <AvatarImage src={team.banner_url || "/placeholder.svg"} alt={team.name} />
                            <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{team.name}</div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                              >
                                {team.total_points} pts
                              </Badge>
                              <span className="text-xs text-muted-foreground">{team.memberCount} of 5 members</span>
                            </div>
                          </div>
                        </div>

                        {team.members && team.members.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            <h4 className="text-xs font-medium text-muted-foreground">Team Members:</h4>
                            <div className="grid grid-cols-1 gap-2">
                              {team.members.map((member: any) => (
                                <div key={member.id} className="flex items-center gap-2 text-sm">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">{member.full_name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="flex-1 truncate">
                                    {member.full_name}
                                    {team.creator_id === member.id && (
                                      <Crown className="inline-block h-3 w-3 text-amber-500 ml-1" />
                                    )}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {member.total_points} pts
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-muted-foreground">No members yet</div>
                        )}

                        {team.memberCount < 5 && (
                          <div className="mt-3 text-xs text-green-600 dark:text-green-400">
                            This team has open spots! Join using the random team option or ask a team member for an
                            invite.
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No teams found</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <span>Wellness Wednesday</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-purple-50 p-4 text-center dark:bg-purple-900/20">
                  <Clock className="h-5 w-5 text-purple-700 dark:text-purple-300 mx-auto mb-2" />
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {getNextWednesdayCountdown()}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Next: {getNextWednesday()}</div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>
                    On Wellness Wednesdays, teams earn +10 bonus points per member when all 5 members complete at least
                    20 points of activities.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-0">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{teamData.name}</CardTitle>
                    <CardDescription>
                      Your wellness team of {teamMembers.length} members
                      {teamData.isCreator && (
                        <Badge className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          Team Admin
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  {teamData.isCreator && (
                    <Badge className="flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      <Crown className="h-3 w-3" /> Team Creator
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-4 rounded-lg overflow-hidden relative group">
                  <Image
                    src={teamData.banner_url || "/placeholder.svg?height=200&width=600&query=team wellness banner"}
                    width={800}
                    height={200}
                    alt="Team Banner"
                    className="w-full h-48 object-cover"
                  />

                  {/* Upload overlay - only visible to team creator */}
                  {teamData.isCreator && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                        id="team-banner-upload"
                      />
                      <Button
                        variant="outline"
                        className="bg-white/90 hover:bg-white"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="mr-2 h-4 w-4" />
                        )}
                        {uploading ? "Uploading..." : "Change Banner"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Team Progress */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-medium">Team Progress</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current: {teamTotalPoints} points</span>
                      <span>Maximum: {maxPossiblePoints} points</span>
                    </div>
                    <Progress value={(teamTotalPoints / maxPossiblePoints) * 100} className="h-3" />
                    <div className="text-xs text-muted-foreground text-center">
                      {Math.round((teamTotalPoints / maxPossiblePoints) * 100)}% of maximum possible points
                    </div>
                  </div>

                  {teamRank && (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Your team is ranked <span className="font-bold">#{teamRank.rank}</span> out of{" "}
                        {teamRank.totalTeams} teams
                        {teamRank.rank > 1 && (
                          <span className="block mt-1 text-xs">
                            {teamRank.pointsToNextRank} points needed to reach rank #{teamRank.rank - 1}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Invite Members Section - only visible to team creator */}
                {teamData.isCreator && teamMembers.length < 5 && (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="text-sm font-medium mb-3">Invite Team Members</h3>
                    <div className="flex gap-2">
                      <Input
                        placeholder="colleague@atlan.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                      <Button
                        onClick={handleSendInvite}
                        disabled={inviting || !inviteEmail.trim() || !inviteEmail.includes("@")}
                      >
                        {inviting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        {inviting ? "Inviting..." : "Invite"}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">{5 - teamMembers.length} spots remaining</div>
                  </div>
                )}

                {/* Leave Team Button */}
                <div className="mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLeaveTeam}
                    disabled={leavingTeam}
                  >
                    {leavingTeam ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {leavingTeam ? "Leaving..." : "Leave Team"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <span>Wellness Wednesday Tracker</span>
                </CardTitle>
                <CardDescription>Earn bonus points when all team members log 20+ points on Wednesdays.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Wellness Wednesday Countdown */}
                  <div className="rounded-lg bg-purple-50 p-4 text-center dark:bg-purple-900/20">
                    <Clock className="h-5 w-5 text-purple-700 dark:text-purple-300 mx-auto mb-2" />
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      {getNextWednesdayCountdown()}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      Remember: All team members need 20+ points on Wednesday for bonus!
                    </div>
                  </div>

                  {/* Check Wednesday Bonus Button */}
                  <Button
                    onClick={handleCheckWednesdayBonus}
                    disabled={checkingWednesday || teamMembers.length < 5}
                    className="w-full"
                  >
                    {checkingWednesday ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {checkingWednesday ? "Checking..." : "Check Today's Bonus Eligibility"}
                  </Button>

                  {/* Wednesday Bonus Result */}
                  {wednesdayResult && (
                    <div
                      className={`rounded-lg p-4 text-center ${
                        wednesdayResult.eligible
                          ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                      }`}
                    >
                      {wednesdayResult.eligible ? (
                        wednesdayResult.alreadyAwarded ? (
                          <p>Your team has already received the {wednesdayResult.bonusPoints} point bonus today!</p>
                        ) : (
                          <p>Congratulations! Your team earned a {wednesdayResult.bonusPoints} point bonus!</p>
                        )
                      ) : (
                        <p>{wednesdayResult.reason}</p>
                      )}
                    </div>
                  )}

                  {/* Past Wednesday Bonuses */}
                  <h3 className="text-sm font-medium mt-6">Past Bonuses</h3>
                  {wednesdayData.length > 0 ? (
                    wednesdayData.map((wednesday, i) => (
                      <div key={i} className="rounded-lg border p-4">
                        <div className="flex justify-between mb-2">
                          <div className="font-medium">{new Date(wednesday.date).toLocaleDateString()}</div>
                          <Badge
                            variant="outline"
                            className={
                              wednesday.bonus_achieved
                                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                            }
                          >
                            {wednesday.bonus_achieved ? "Completed" : "Incomplete"}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">
                            {wednesday.bonus_achieved
                              ? `All team members logged 20+ points. Bonus: ${wednesday.bonus_points} points!`
                              : "Not all team members logged 20+ points"}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border p-4">
                      <div className="flex justify-between mb-2">
                        <div className="font-medium">Next: {getNextWednesday()}</div>
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                        >
                          Upcoming
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Remind your team to log activities on Wednesday!
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{teamTotalPoints}</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Total Points</div>
                  </div>
                  <div className="rounded-lg bg-teal-50 p-4 text-center dark:bg-teal-900/20">
                    <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{teamAvgPoints}</div>
                    <div className="text-sm text-teal-700 dark:text-teal-300">Avg Points</div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-4 text-center dark:bg-emerald-900/20">
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {teamMembers.length}/5
                    </div>
                    <div className="text-sm text-emerald-700 dark:text-emerald-300">Members</div>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-4 text-center dark:bg-purple-900/20">
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {wednesdayData.filter((w) => w.bonus_achieved).length}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">Bonus Days</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUp className="h-5 w-5 text-green-500" />
                  <span>Team Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievements.length > 0 ? (
                    achievements.map((achievement, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                        <div className="text-2xl">
                          {achievement.achievement_type === "TEAM_FORMED" ||
                          achievement.achievement_type === "EARLY_TEAM_FORMATION"
                            ? "🚀"
                            : achievement.achievement_type === "WEDNESDAY_BONUS"
                              ? "🔥"
                              : "⭐"}
                        </div>
                        <div>
                          <div className="font-medium">{achievement.achievement_description}</div>
                          <div className="text-sm text-muted-foreground">
                            +{achievement.points_awarded} bonus points
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border p-3 opacity-60">
                      <div className="text-2xl">🏆</div>
                      <div>
                        <div className="font-medium">No achievements yet</div>
                        <div className="text-sm text-muted-foreground">
                          Complete team activities to earn achievements
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span>Top Teams</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topTeams.length > 0 ? (
                    topTeams.map((team, index) => (
                      <div
                        key={team.id}
                        className={`flex items-center justify-between rounded-lg border p-3 ${
                          team.id === teamData.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            {index + 1}
                          </div>
                          <Avatar>
                            <AvatarImage src={team.banner_url || "/placeholder.svg"} alt={team.name} />
                            <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{team.name}</div>
                            <div className="text-xs text-muted-foreground">{team.members} members</div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                        >
                          {team.total_points} pts
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No teams found</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
