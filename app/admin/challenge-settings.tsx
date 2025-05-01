"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getChallengeStatus, setChallengeStatus, setChallengeStartDate } from "@/app/actions/challenge-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ChallengeSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [challengeStarted, setChallengeStarted] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function loadChallengeStatus() {
      try {
        const { started, startDate } = await getChallengeStatus()
        setChallengeStarted(started)
        if (startDate) {
          setStartDate(new Date(startDate))
        }
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadChallengeStatus()
  }, [])

  const handleToggleChallenge = async () => {
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const newStatus = !challengeStarted
      const result = await setChallengeStatus(newStatus)

      if (result.success) {
        setChallengeStarted(newStatus)
        setSuccess(`Challenge ${newStatus ? "started" : "paused"} successfully`)
      } else {
        setError(result.error || "Failed to update challenge status")
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStartDate = async () => {
    if (!startDate) return

    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const result = await setChallengeStartDate(startDate)

      if (result.success) {
        setSuccess("Challenge start date updated successfully")
      } else {
        setError(result.error || "Failed to update start date")
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Challenge Settings</CardTitle>
        <CardDescription>Manage the wellness challenge settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="challenge-status" className="flex flex-col space-y-1">
            <span>Challenge Status</span>
            <span className="font-normal text-sm text-muted-foreground">
              {challengeStarted
                ? "Challenge is active. Users can log activities and earn points."
                : "Challenge is inactive. Users cannot log activities or earn points."}
            </span>
          </Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="challenge-status"
              checked={challengeStarted}
              onCheckedChange={handleToggleChallenge}
              disabled={saving}
            />
            <span className={challengeStarted ? "text-green-600" : "text-red-600"}>
              {challengeStarted ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Challenge Start Date</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-[240px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
            <Button onClick={handleUpdateStartDate} disabled={!startDate || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Date
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            This date is used for the countdown timer and to determine when the challenge officially begins.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Note: When the challenge is inactive, users can still log in and view the app, but they cannot log activities
          or earn points.
        </p>
      </CardFooter>
    </Card>
  )
}
