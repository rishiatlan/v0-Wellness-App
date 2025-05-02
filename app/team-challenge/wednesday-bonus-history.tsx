"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface WednesdayBonusHistoryProps {
  teamId: string
}

interface WellnessWednesday {
  id: string
  date: string
  bonus_achieved: boolean
  bonus_points: number
}

export function WednesdayBonusHistory({ teamId }: WednesdayBonusHistoryProps) {
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<WellnessWednesday[]>([])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { getWellnessWednesdays } = await import("@/app/actions/team-actions")
        const data = await getWellnessWednesdays(teamId)
        setHistory(data)
      } catch (error) {
        console.error("Error fetching Wednesday bonus history:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [teamId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wellness Wednesday History</CardTitle>
          <CardDescription>Loading bonus history...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wellness Wednesday History</CardTitle>
          <CardDescription>Track your team's Wednesday bonus achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No Wednesday bonuses earned yet. Complete all activities with your team on Wednesdays!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wellness Wednesday History</CardTitle>
        <CardDescription>Your team's Wednesday bonus achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-medium">
                  {new Date(item.date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-muted-foreground">{item.bonus_achieved ? "Bonus achieved" : "No bonus"}</p>
              </div>
              {item.bonus_achieved && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                >
                  +{item.bonus_points} points
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
