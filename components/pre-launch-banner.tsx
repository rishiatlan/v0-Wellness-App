"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface PreLaunchBannerProps {
  launchDate: Date | string
  isChallengeLive?: boolean
}

export function PreLaunchBanner({ launchDate, isChallengeLive = false }: PreLaunchBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState("")
  const [days, setDays] = useState(0)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)

  // Convert string to Date if needed
  const parsedLaunchDate = launchDate instanceof Date ? launchDate : new Date(launchDate)

  // Handle invalid date
  const isValidDate = !isNaN(parsedLaunchDate.getTime())

  useEffect(() => {
    // Don't show banner if challenge is live or date is invalid
    if (isChallengeLive || !isValidDate) {
      setDismissed(true)
      return
    }

    const calculateTimeRemaining = () => {
      const now = new Date()
      const difference = parsedLaunchDate.getTime() - now.getTime()

      if (difference <= 0) {
        // Challenge has started, refresh the page
        setDismissed(true)
        window.location.reload()
        return
      }

      // Calculate time components
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setDays(days)
      setHours(hours)
      setMinutes(minutes)
      setSeconds(seconds)

      // Format for screen readers
      setTimeRemaining(`${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds`)
    }

    // Calculate immediately and then set interval
    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [isChallengeLive, parsedLaunchDate, isValidDate])

  // Don't render if dismissed, challenge is live, or date is invalid
  if (dismissed || isChallengeLive || !isValidDate) {
    return null
  }

  // Format the launch date for display
  const formattedDate = parsedLaunchDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedTime = parsedLaunchDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="w-full bg-primary/10 border-b border-primary/20 py-2 px-4">
      <Card className="border-primary/20 bg-transparent shadow-none">
        <CardContent className="p-2 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span className="font-semibold text-primary">
              Challenge starts on {formattedDate} at {formattedTime}
            </span>

            <div className="flex gap-2 items-center" aria-live="polite" aria-atomic="true">
              <span className="sr-only">Time remaining: {timeRemaining}</span>

              <div className="bg-primary/10 rounded px-2 py-1">
                <span className="font-mono text-lg font-bold">{days.toString().padStart(2, "0")}</span>
                <span className="text-xs">days</span>
              </div>

              <div className="bg-primary/10 rounded px-2 py-1">
                <span className="font-mono text-lg font-bold">{hours.toString().padStart(2, "0")}</span>
                <span className="text-xs">hrs</span>
              </div>

              <div className="bg-primary/10 rounded px-2 py-1">
                <span className="font-mono text-lg font-bold">{minutes.toString().padStart(2, "0")}</span>
                <span className="text-xs">min</span>
              </div>

              <div className="bg-primary/10 rounded px-2 py-1">
                <span className="font-mono text-lg font-bold">{seconds.toString().padStart(2, "0")}</span>
                <span className="text-xs">sec</span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss countdown"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
