"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PreLaunchBannerProps {
  launchDate: Date
  isChallengeLive?: boolean
}

export function PreLaunchBanner({ launchDate, isChallengeLive = false }: PreLaunchBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [dismissed, setDismissed] = useState<boolean>(false)

  useEffect(() => {
    // If challenge is already live, don't show the banner
    if (isChallengeLive) {
      setDismissed(true)
      return
    }

    // Check if user has dismissed the banner
    const isDismissed = localStorage.getItem("preLaunchBannerDismissed")
    if (isDismissed) {
      setDismissed(true)
    }

    // Update countdown timer
    const updateCountdown = () => {
      const now = new Date()
      const diff = launchDate.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining("Challenge is starting now!")
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
  }, [launchDate, isChallengeLive])

  const handleDismiss = () => {
    localStorage.setItem("preLaunchBannerDismissed", "true")
    setDismissed(true)
  }

  if (dismissed || isChallengeLive) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4 border-red-600 bg-red-100 dark:bg-red-900/20">
      <AlertCircle className="h-5 w-5" />
      <div className="flex-1">
        <AlertTitle className="text-lg font-semibold">🚨 Challenge hasn't started yet!</AlertTitle>
        <AlertDescription className="mt-1">
          <p className="mb-2">
            You can log in, but the challenge hasn't started yet! All points and teams go live soon.
          </p>
          <div className="flex items-center gap-2 font-mono text-sm font-bold">
            <Clock className="h-4 w-4" />
            <span>Countdown: {timeRemaining}</span>
          </div>
        </AlertDescription>
      </div>
      <Button variant="outline" size="sm" onClick={handleDismiss} className="ml-auto">
        Dismiss
      </Button>
    </Alert>
  )
}
