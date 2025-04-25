"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getUserActivityHistory, getUserMonthlyStats } from "@/app/actions/activity-history-actions"

export default function CalendarView() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1) // 1-12
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [activityData, setActivityData] = useState<Record<string, { totalPoints: number; activities: string[] }>>({})
  const [monthlyStats, setMonthlyStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivityData = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Try to fetch history and stats
        const [history, stats] = await Promise.all([
          getUserActivityHistory(user.id, currentMonth, currentYear),
          getUserMonthlyStats(user.id, currentMonth, currentYear),
        ])

        setActivityData(history)
        setMonthlyStats(stats)
      } catch (error) {
        console.error("Error fetching activity history:", error)
        // Don't show error toast for new users, just set empty data
        setActivityData({})
        setMonthlyStats({
          totalDaysLogged: 0,
          perfectDays: 0,
          totalPoints: 0,
          daysInMonth: new Date(currentYear, currentMonth, 0).getDate(),
        })
      } finally {
        setLoading(false)
      }
    }

    fetchActivityData()
  }, [user, currentMonth, currentYear, toast])

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const renderCalendar = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    const today = new Date()
    const isCurrentMonth = today.getMonth() + 1 === currentMonth && today.getFullYear() === currentYear
    const currentDate = today.getDate()

    // Create array of day names
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    // Create calendar grid
    const calendarDays = []
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(null)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day)
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {dayNames.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-12 rounded-md bg-muted/20" />
            }

            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const dayData = activityData[dateStr]
            const hasActivities = !!dayData
            const isToday = isCurrentMonth && day === currentDate
            const isPast = new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0))
            const isFuture = !isPast && !isToday

            // Determine the background color based on points
            let bgColorClass = "bg-muted/20"
            let textColorClass = ""

            if (hasActivities) {
              const points = dayData.totalPoints
              if (points === 30) {
                bgColorClass = "bg-green-100 dark:bg-green-900/30"
                textColorClass = "text-green-800 dark:text-green-300"
              } else if (points >= 20) {
                bgColorClass = "bg-teal-100 dark:bg-teal-900/30"
                textColorClass = "text-teal-800 dark:text-teal-300"
              } else if (points >= 10) {
                bgColorClass = "bg-blue-100 dark:bg-blue-900/30"
                textColorClass = "text-blue-800 dark:text-blue-300"
              } else {
                bgColorClass = "bg-amber-100 dark:bg-amber-900/30"
                textColorClass = "text-amber-800 dark:text-amber-300"
              }
            }

            if (isToday) {
              bgColorClass = hasActivities ? bgColorClass : "bg-primary/10"
              textColorClass = hasActivities ? textColorClass : "text-primary font-medium"
            }

            return (
              <div
                key={`day-${day}`}
                className={`relative h-12 rounded-md ${bgColorClass} flex flex-col items-center justify-center ${textColorClass}`}
              >
                <div className="text-sm">{day}</div>
                {hasActivities && <div className="text-xs font-medium">{dayData.totalPoints}pts</div>}
                {isToday && (
                  <div className="absolute -top-1 -right-1">
                    <span className="flex h-2 w-2 rounded-full bg-primary"></span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Calendar</CardTitle>
          <CardDescription>There was an error loading your calendar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Activity Calendar</CardTitle>
          <CardDescription>Track your daily wellness activities</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </Button>
          <div className="text-sm font-medium">
            {new Date(currentYear, currentMonth - 1).toLocaleString("default", { month: "long" })} {currentYear}
          </div>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {renderCalendar()}

            {monthlyStats && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-900/20">
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {monthlyStats.totalDaysLogged || 0}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">Days Logged</div>
                </div>
                <div className="rounded-lg bg-teal-50 p-3 text-center dark:bg-teal-900/20">
                  <div className="text-xl font-bold text-teal-700 dark:text-teal-300">
                    {monthlyStats.perfectDays || 0}
                  </div>
                  <div className="text-xs text-teal-700 dark:text-teal-300">Perfect Days</div>
                </div>
                <div className="rounded-lg bg-purple-50 p-3 text-center dark:bg-purple-900/20">
                  <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                    {monthlyStats.totalPoints || 0}
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">Total Points</div>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                30 pts - Perfect Day
              </Badge>
              <Badge variant="outline" className="bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                20-29 pts - Great Day
              </Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                10-19 pts - Good Day
              </Badge>
              <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                1-9 pts - Started Day
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
