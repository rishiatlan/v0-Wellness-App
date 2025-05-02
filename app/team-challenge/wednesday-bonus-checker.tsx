"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { getUserLocalDate } from "@/lib/time-utils"

interface WednesdayBonusCheckerProps {
  teamId: string
  teamName: string
  memberCount: number
}

export function WednesdayBonusChecker({ teamId, teamName, memberCount }: WednesdayBonusCheckerProps) {
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Check if today is Wednesday
  const today = new Date()
  const isWednesday = today.getDay() === 3 // 0 is Sunday, 3 is Wednesday

  const checkBonus = async () => {
    setChecking(true)
    setResult(null)

    try {
      const { checkWellnessWednesdayBonus } = await import("@/app/actions/team-actions")
      const localDate = getUserLocalDate()
      const result = await checkWellnessWednesdayBonus(teamId, localDate)
      setResult(result)
    } catch (error) {
      console.error("Error checking Wednesday bonus:", error)
      setResult({
        success: false,
        message: "An error occurred while checking for the bonus",
      })
    } finally {
      setChecking(false)
    }
  }

  if (!isWednesday) {
    return null // Don't show the component if it's not Wednesday
  }

  return (
    <Card className="border-dashed border-2 border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">🎯</span> Wellness Wednesday Bonus
        </CardTitle>
        <CardDescription>
          If all 5 team members complete their activities and earn 30 points each today, your team gets a 25 point
          bonus!
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result ? (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success!" : "Not Yet"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        ) : (
          <p className="text-sm text-muted-foreground">
            Today is Wednesday! Check if your team qualifies for the bonus.
            {memberCount < 5 && (
              <span className="block mt-2 text-amber-600 dark:text-amber-400">
                Note: Your team currently has {memberCount}/5 members required for the bonus.
              </span>
            )}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={checkBonus} disabled={checking || memberCount < 5} className="w-full">
          {checking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Check Bonus Eligibility"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
