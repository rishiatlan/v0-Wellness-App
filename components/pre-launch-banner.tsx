"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getUserTimezone } from "@/lib/time-utils"
import { startChallengeForTeam, getTeamChallengeStatus } from "@/app/actions/challenge-actions"

interface PreLaunchBannerProps {
  launchDate: Date
  isChallengeLive?: boolean
}

export function PreLaunchBanner({ launchDate, isChallengeLive = false }: PreLaunchBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [dismissed, setDismissed] = useState<boolean>(false)
  const [teamChallengeStarted, setTeamChallengeStarted] = useState<boolean>(false)
  const [isStartingTeamChallenge, setIsStartingTeamChallenge] = useState<boolean>(false)
  const [midnightReached, setMidnightReached] = useState<boolean>(false)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Check if team challenge has started
  useEffect(() => {
    const checkTeamChallengeStatus = async () => {
      try {
        // Get user's team ID
        const response = await fetch("/api/user/team")
        const data = await response.json()

        if (data.teamId) {
          setTeamId(data.teamId)
          setUserId(data.userId)

          const status = await getTeamChallengeStatus(data.teamId)
          setTeamChallengeStarted(status.started)
        }
      } catch (error) {
        console.error("Error checking team challenge status:", error)
      }
    }

    checkTeamChallengeStatus()
  }, [])

  useEffect(() => {
    // If challenge is already live globally or for the team, don't show the banner
    if (isChallengeLive || teamChallengeStarted) {
      setDismissed(true)
      return
    }

    // Check if user has dismissed the banner
    const isDismissed = localStorage.getItem("preLaunchBannerDismissed")
    if (isDismissed) {
      setDismissed(true)
    }

    // Convert launch date to user's local timezone for midnight
    const userTimezone = getUserTimezone()

    // Set the target date to midnight on the launch date in user's local timezone
    const targetDate = new Date(launchDate)
    targetDate.setHours(0, 0, 0, 0) // Set to midnight

    // Store the target timestamp to ensure consistency between page loads
    const targetTimestamp = targetDate.getTime()
    localStorage.setItem("challengeStartTimestamp", targetTimestamp.toString())

    // Update countdown timer
    const updateCountdown = () => {
      const now = new Date()
      // Use the stored timestamp for consistency
      const storedTimestamp = localStorage.getItem("challengeStartTimestamp")
      const targetTime = storedTimestamp ? Number.parseInt(storedTimestamp) : targetDate.getTime()

      const diff = targetTime - now.getTime()

      if (diff <= 0) {
        setTimeRemaining("Challenge is starting now!")
        setMidnightReached(true)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [launchDate, isChallengeLive, teamChallengeStarted])

  const handleDismiss = () => {
    localStorage.setItem("preLaunchBannerDismissed", "true")
    setDismissed(true)
  }

  const handleStartTeamChallenge = async () => {
    if (!teamId || !userId) {
      alert("You must be logged in and part of a team to start the team challenge")
      return
    }

    setIsStartingTeamChallenge(true)

    try {
      // Start the challenge for the team
      const result = await startChallengeForTeam(teamId, userId)

      if (result.success) {
        alert("You've started the challenge for your team!")
        setTeamChallengeStarted(true)
        setDismissed(true)
      } else {
        alert(result.error || "Failed to start team challenge")
      }
    } catch (error) {
      console.error("Error starting team challenge:", error)
      alert("An unexpected error occurred")
    } finally {
      setIsStartingTeamChallenge(false)
    }
  }

  if (dismissed || isChallengeLive || teamChallengeStarted) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4 border-red-600 bg-red-100 dark:bg-red-900/20">
      <AlertCircle className="h-5 w-5" />
      <div className="flex-1">
        <AlertTitle className="text-lg font-semibold">🚨 Challenge hasn't started yet!</AlertTitle>
        <AlertDescription className="mt-1">
          <p className="mb-2">
            You can log in, but the challenge hasn't started yet! All points and teams go live at midnight on the first
            day.
          </p>
          <div className="flex items-center gap-2 font-mono text-sm font-bold">
            <Clock className="h-4 w-4" />
            <span>Countdown: {timeRemaining}</span>
          </div>

          {midnightReached && teamId && (
            <div className="mt-3">
              <p className="mb-2 text-sm font-medium">
                It's midnight in your timezone! As the first team member to reach midnight, you can start the challenge
                for your entire team.
              </p>
              <Button
                onClick={handleStartTeamChallenge}
                disabled={isStartingTeamChallenge}
                variant="outline"
                className="bg-white text-red-600 hover:bg-red-50 border-red-300"
              >
                {isStartingTeamChallenge ? "Starting..." : "Start Team Challenge"}
              </Button>
            </div>
          )}
        </AlertDescription>
      </div>
      <Button variant="outline" size="sm" onClick={handleDismiss} className="ml-auto">
        Dismiss
      </Button>
    </Alert>
  )
}
