"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, Trophy, Loader2, AlertCircle, Info, RefreshCw } from "lucide-react"
import confetti from "canvas-confetti"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { getUserLocalDate, isNewDay, getTimeUntilMidnight } from "@/lib/time-utils"

// Import client-safe functions from our new module
import {
  getActivitiesClientSafe,
  getDailyLogsClientSafe,
  getUserProfileClientSafe,
  updateUserStreakClientSafe,
  getActivityHistoryClientSafe,
  recalculateUserPointsClientSafe,
  getTodayPointsClientSafe,
  createDefaultActivitiesClientSafe,
  getWeeklyStreakDataClientSafe,
  recalculateUserStreakClientSafe,
  checkActivityAlreadyLoggedClientSafe,
} from "@/lib/api-client-safe"

// Add this to the imports
import { verifyActivityPoints } from "@/app/actions/client-safe-actions"

type Activity = {
  id: string
  name: string
  emoji: string
  points: number
  description: string | null
  completed: boolean
}

// Default activities for new users
const DEFAULT_ACTIVITIES = [
  { name: "Mindfulness", emoji: "🧘", points: 5, description: "10 min meditation/yoga/deep breathing" },
  { name: "Hydration", emoji: "💧", points: 5, description: "80oz (2.36 liters) water" },
  { name: "Movement", emoji: "👣", points: 5, description: "7,000 steps" },
  { name: "Sleep", emoji: "😴", points: 5, description: "7+ hours" },
  { name: "Sunshine", emoji: "☀️", points: 5, description: "15 min outdoors" },
  { name: "Exercise", emoji: "💪", points: 5, description: "20 min workout" },
]

// Helper debounce function
function debounce(func, wait) {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

export default function DailyTracker() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [savingActivity, setSavingActivity] = useState<string | null>(null)
  const [activityError, setActivityError] = useState<string | null>(null)
  const [showRLSHelp, setShowFKHelp] = useState(false)
  const [showFKHelp, setShowRLSHelp] = useState(false)
  // Initialize localDate with today's date
  const [localDate, setLocalDate] = useState<string>(getUserLocalDate())
  const [timeUntilReset, setTimeUntilReset] = useState<string>("")
  const [activityHistory, setActivityHistory] = useState<Record<string, any[]>>({})
  const [historyLoading, setHistoryLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("today")
  const [todayPoints, setTodayPoints] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [creatingDefaultActivities, setCreatingDefaultActivities] = useState(false)
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false) // Add this state to track fetch attempts
  const [retryCount, setRetryCount] = useState(0) // Track retry attempts
  const maxRetries = 3 // Maximum number of retry attempts
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Reference to store timeout ID
  const initialLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Reference for initial load timeout

  // Add this state and function to the component
  const [weeklyStreak, setWeeklyStreak] = useState<any>({
    weekDays: Array(7)
      .fill(null)
      .map((_, i) => ({
        date: "",
        dayOfWeek: i,
        hasActivity: false,
        isToday: i === (new Date().getDay() + 6) % 7,
        isPast: i < (new Date().getDay() + 6) % 7,
      })),
    currentStreak: 0,
  })

  // Function to fetch weekly streak data
  const fetchWeeklyStreakData = useCallback(async () => {
    if (!user) return

    try {
      const data = await getWeeklyStreakDataClientSafe(user.id)
      setWeeklyStreak(data)
    } catch (error) {
      console.error("Error fetching weekly streak data:", error)
    }
  }, [user])

  // Add this function to the component
  const checkAndFixExerciseActivity = async () => {
    try {
      const { checkAndFixExerciseActivity } = await import("@/app/actions/client-safe-actions")
      const result = await checkAndFixExerciseActivity()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Exercise activity checked and fixed if needed.",
        })
        // Refresh the page to load the fixed activity
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to check Exercise activity",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error checking Exercise activity:", error)
      toast({
        title: "Error",
        description: "Failed to check Exercise activity. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update the setupRLSPolicies function
  const setupRLSPolicies = async () => {
    try {
      const { setupRLSPolicies } = await import("@/app/actions/setup-rls-action")
      const result = await setupRLSPolicies()

      if (result.success) {
        toast({
          title: "Success",
          description: "RLS policies set up successfully. Please try again.",
        })
        // Refresh the page after setting up RLS
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to set up RLS policies",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error setting up RLS:", error)
      toast({
        title: "Error",
        description: "Failed to set up RLS policies. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Function to calculate today's points directly from completed activities
  const calculateTodayPoints = useCallback((activityList: Activity[]) => {
    // Count completed activities for verification
    const completedCount = activityList.filter((a) => a.completed).length
    console.log(`Total completed activities: ${completedCount}`)

    const points = activityList.reduce((sum, activity) => {
      const pointsToAdd = activity.completed ? activity.points : 0
      console.log(`Activity ${activity.name}: ${pointsToAdd} points (completed: ${activity.completed})`)
      return sum + pointsToAdd
    }, 0)

    console.log(`Total points calculated: ${points}`)

    // Verify the calculation is correct
    if (completedCount * 5 !== points) {
      console.error(`Point calculation mismatch! Expected ${completedCount * 5} but got ${points}`)
    }

    setTodayPoints(points)
    return points
  }, [])

  // Function to fetch today's points directly from the database
  const fetchTodayPoints = useCallback(async () => {
    if (!user || !localDate) return

    try {
      const result = await getTodayPointsClientSafe(user.id, localDate)
      if (result.success) {
        setTodayPoints(result.points)
        console.log(`Today's points updated from database: ${result.points}`)
      }
    } catch (error) {
      console.error("Error fetching today's points:", error)
    }
  }, [user, localDate])

  // Function to create default activities for new users
  const createDefaultActivities = useCallback(async () => {
    if (!user) return

    try {
      setCreatingDefaultActivities(true)

      // Create default activities for the user
      const result = await createDefaultActivitiesClientSafe(user.id, DEFAULT_ACTIVITIES)

      if (result.success) {
        // Fetch the newly created activities
        try {
          const activitiesData = await getActivitiesClientSafe()

          // Get today's logs to mark completed activities
          const logsData = await getDailyLogsClientSafe(user.id, getUserLocalDate())

          // Mark activities as completed if they have been logged today
          const completedActivityIds = logsData.map((log) => log.activity_id)
          const activitiesWithCompletionStatus = activitiesData.map((activity) => ({
            ...activity,
            completed: completedActivityIds.includes(activity.id),
          }))

          setActivities(activitiesWithCompletionStatus)
          calculateTodayPoints(activitiesWithCompletionStatus)

          toast({
            title: "Welcome!",
            description: "We've set up your default wellness activities. Start tracking now!",
          })
        } catch (fetchError) {
          console.error("Error fetching new activities:", fetchError)
          // Create local activities as fallback
          const localActivities = DEFAULT_ACTIVITIES.map((activity, index) => ({
            ...activity,
            id: `temp-${index}`,
            completed: false,
          }))
          setActivities(localActivities)
          toast({
            title: "Welcome!",
            description: "We've set up your default wellness activities. Start tracking now!",
          })
        }
      } else if (result.error) {
        console.error("Error creating default activities:", result.error)
        // Create local activities as fallback
        const localActivities = DEFAULT_ACTIVITIES.map((activity, index) => ({
          ...activity,
          id: `temp-${index}`,
          completed: false,
        }))
        setActivities(localActivities)
        toast({
          title: "Welcome!",
          description: "We've set up temporary activities for you to get started.",
        })
      }
    } catch (error) {
      console.error("Error creating default activities:", error)
      // Create local activities as fallback
      const localActivities = DEFAULT_ACTIVITIES.map((activity, index) => ({
        ...activity,
        id: `temp-${index}`,
        completed: false,
      }))
      setActivities(localActivities)
      toast({
        title: "Welcome!",
        description: "We've set up temporary activities for you to get started.",
      })
    } finally {
      setCreatingDefaultActivities(false)
    }
  }, [user, toast, calculateTodayPoints])

  // Function to fetch activities and logs with retry logic
  const fetchActivitiesAndLogs = useCallback(async () => {
    if (!user) return

    try {
      setError(null)
      setLoading(true)

      // Get the user's local date
      const userLocalDate = getUserLocalDate()
      setLocalDate(userLocalDate)

      // Use individual try/catch blocks for each request to handle partial failures
      let profileData, activitiesData, logsData

      try {
        profileData = await getUserProfileClientSafe(user.id)
      } catch (profileError) {
        console.error("Error fetching user profile:", profileError)
        profileData = {
          id: user.id,
          email: user.email || "user@example.com",
          full_name: user.user_metadata?.full_name || "New User",
          total_points: 0,
          current_tier: 0,
          current_streak: 0,
        }
      }

      try {
        activitiesData = await getActivitiesClientSafe()
      } catch (activitiesError) {
        console.error("Error fetching activities:", activitiesError)
        activitiesData = []
      }

      try {
        // Use the server action directly for more reliable data
        const { getDailyLogs } = await import("@/app/actions/activity-actions")
        logsData = await getDailyLogs(user.id, userLocalDate)
      } catch (logsError) {
        console.error("Error fetching daily logs:", logsError)
        logsData = []
      }

      setUserProfile(profileData)

      // If no activities found, we'll handle this case
      if (!activitiesData || activitiesData.length === 0) {
        // We'll create default activities later
        setActivities([])
      } else {
        // Mark completed activities based on logs
        const completedActivityIds = logsData.map((log) => log.activity_id)
        const activitiesWithCompletionStatus = activitiesData.map((activity) => ({
          ...activity,
          completed: completedActivityIds.includes(activity.id),
        }))

        setActivities(activitiesWithCompletionStatus)
        calculateTodayPoints(activitiesWithCompletionStatus)
      }

      // Reset retry count on successful fetch
      setRetryCount(0)
    } catch (error: any) {
      console.error("Error fetching data:", error)
      // Don't set error for new users, we'll handle this case
      if (error.message && (error.message.includes("not found") || error.message.includes("does not exist"))) {
        setActivities([])
      } else {
        // Don't show error to user, just log it and continue with empty data
        console.error("Error in fetchActivitiesAndLogs:", error)
        setActivities([])

        // Implement retry logic
        if (retryCount < maxRetries) {
          console.log(`Retrying data fetch (attempt ${retryCount + 1} of ${maxRetries})...`)
          setRetryCount((prev) => prev + 1)

          // Clear any existing timeout
          if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current)
          }

          // Set a new timeout for retry with exponential backoff
          fetchTimeoutRef.current = setTimeout(() => {
            fetchActivitiesAndLogs()
          }, 1000 * Math.pow(2, retryCount)) // Exponential backoff: 1s, 2s, 4s

          return // Exit early to prevent setting loading to false
        }
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
      setDataFetchAttempted(true) // Mark that we've attempted to fetch data

      // Clear the timeout reference
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }
    }
  }, [user, calculateTodayPoints, retryCount])

  // Update time until reset
  const updateTimeUntilReset = useCallback(() => {
    const msUntilMidnight = getTimeUntilMidnight()
    const hours = Math.floor(msUntilMidnight / (1000 * 60 * 60))
    const minutes = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60))

    setTimeUntilReset(`${hours}h ${minutes}m until midnight`)

    // Schedule the next update in 1 minute
    setTimeout(updateTimeUntilReset, 60000)
  }, [])

  // Check for new day and set up timer for midnight reset
  useEffect(() => {
    if (isNewDay()) {
      // It's a new day, refresh activities
      fetchActivitiesAndLogs()
    }

    // Set up timer to check for midnight reset
    updateTimeUntilReset()

    // Set up a timer to refresh the page at midnight
    const msUntilMidnight = getTimeUntilMidnight()
    const midnightTimer = setTimeout(() => {
      // Refresh the page at midnight
      window.location.reload()
    }, msUntilMidnight)

    return () => {
      clearTimeout(midnightTimer)
    }
  }, [fetchActivitiesAndLogs, updateTimeUntilReset])

  // Initial data fetch with improved timeout handling
  useEffect(() => {
    // Only fetch if we have a user
    if (user) {
      fetchActivitiesAndLogs()
      fetchWeeklyStreakData()

      // Set a longer timeout (30 seconds) for initial load
      initialLoadTimeoutRef.current = setTimeout(() => {
        if (loading && !dataFetchAttempted) {
          setLoading(false)
          setError("Loading timed out. Please try again by clicking the refresh button below.")
        }
      }, 30000) // 30 seconds timeout - increased from 10 seconds
    } else {
      // If no user, stop loading state
      setLoading(false)
    }

    return () => {
      // Clean up timeouts on unmount
      if (initialLoadTimeoutRef.current) {
        clearTimeout(initialLoadTimeoutRef.current)
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [fetchActivitiesAndLogs, fetchWeeklyStreakData, user, loading, dataFetchAttempted])

  // Create default activities if none exist
  useEffect(() => {
    if (!loading && activities.length === 0 && user && dataFetchAttempted) {
      createDefaultActivities()
    }
  }, [loading, activities, user, createDefaultActivities, dataFetchAttempted])

  // Update the useEffect hook that updates today's points whenever activities change
  useEffect(() => {
    if (activities.length > 0) {
      const points = calculateTodayPoints(activities)
      console.log(`Updated today's points to ${points} based on ${activities.length} activities`)
    }
  }, [activities, calculateTodayPoints])

  const maxDailyPoints = 30
  const progressPercentage = (todayPoints / maxDailyPoints) * 100

  // Get tier emoji based on points
  const getTierEmoji = (points: number) => {
    if (points >= 1373) return "🌳"
    if (points >= 916) return "🌿"
    if (points >= 640) return "🌱"
    return "🌱"
  }

  // Function to recalculate points
  const recalculatePoints = useCallback(async () => {
    if (!user) return

    try {
      const result = await recalculateUserPointsClientSafe(user.id)
      if (result.success) {
        // Refresh user profile to get updated points
        const profileData = await getUserProfileClientSafe(user.id)
        setUserProfile(profileData)

        // Also recalculate today's points from current activities
        calculateTodayPoints(activities)
      }
    } catch (error) {
      console.error("Error recalculating points:", error)
    }
  }, [user, activities, calculateTodayPoints])

  // Function to fetch activity history
  const fetchActivityHistory = useCallback(async () => {
    if (!user) return

    try {
      setHistoryLoading(true)
      const history = await getActivityHistoryClientSafe(user.id, 14) // Get last 14 days
      setActivityHistory(history)
    } catch (error) {
      console.error("Error fetching activity history:", error)
    } finally {
      setHistoryLoading(false)
    }
  }, [user])

  // Add a debounced version of the toggle function
  const debouncedToggleActivity = useCallback(
    debounce(async (activity, originalActivity) => {
      setSavingActivity(activity.id)
      setActivityError(null)
      setShowRLSHelp(false)
      setShowFKHelp(false)

      // Log the activity being processed
      console.log(`Processing activity in debounced function: ${activity.name} (${activity.id})`)

      // Move the actual API call here
      try {
        // Only allow logging activities, not unlogging
        // We know we're only logging (not unlogging) because we prevent toggling completed activities
        const { logActivity } = await import("@/app/actions/activity-actions")
        const result = await logActivity(
          user.id,
          activity.id,
          localDate,
          activity.points,
          user.email || "",
          user.user_metadata?.full_name || "",
        )

        if (!result.success) {
          throw new Error(result.error || "Failed to log activity")
        }

        // Show confetti when completing an activity
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })

        toast({
          title: `${activity.emoji} ${activity.name} completed!`,
          description: `You earned ${activity.points} points`,
        })

        // Update streak when completing an activity
        updateUserStreakClientSafe(user.id).catch((err) => {
          console.error("Error updating streak:", err)
        })

        // Refresh user profile to get updated points
        try {
          const profileData = await getUserProfileClientSafe(user.id)
          setUserProfile(profileData)

          // Refresh history if we're on the history tab
          if (activeTab === "history") {
            fetchActivityHistory()
          }

          // Fetch today's points directly from the database to ensure accuracy
          const pointsResult = await getTodayPointsClientSafe(user.id, localDate)
          if (pointsResult.success) {
            setTodayPoints(pointsResult.points)
            console.log(`Today's points updated from database: ${pointsResult.points}`)
          }

          // Force a UI update for the progress bar
          setActivities((prevActivities) => {
            // Make sure the activity state is correct
            const updatedActivities = prevActivities.map((a) => {
              if (a.id === activity.id) {
                return { ...a, completed: true }
              }
              return a
            })

            // Recalculate points from the updated activities
            const newPoints = updatedActivities.reduce((sum, act) => {
              return sum + (act.completed ? act.points : 0)
            }, 0)

            console.log(`Recalculated points after toggle: ${newPoints}`)
            setTodayPoints(newPoints)

            return updatedActivities
          })
        } catch (profileError: any) {
          console.error("Error refreshing profile:", profileError)
        }

        // Recalculate points
        await recalculatePoints()

        // Force another UI update after all operations are complete
        setActivities((prevActivities) => {
          const updatedActivities = [...prevActivities]
          // Recalculate points again to be sure
          const finalPoints = updatedActivities.reduce((sum, act) => {
            return sum + (act.completed ? act.points : 0)
          }, 0)
          console.log(`Final points calculation: ${finalPoints}`)
          setTodayPoints(finalPoints)
          return updatedActivities
        })

        // Recalculate streak when completing an activity
        try {
          const streakResult = await recalculateUserStreakClientSafe(user.id)
          if (streakResult.success) {
            console.log(`Streak recalculated: ${streakResult.streak} days`)
          }
        } catch (streakError) {
          console.error("Error recalculating streak:", streakError)
        }

        // Refresh streak data
        fetchWeeklyStreakData()
      } catch (error: any) {
        console.error("Error logging activity:", error)

        // Revert the UI change if there was an error
        setActivities((prevActivities) => {
          return prevActivities.map((a) => {
            if (a.id === activity.id) {
              return originalActivity // Restore original activity state
            }
            return a
          })
        })

        // Recalculate today's points after reverting
        calculateTodayPoints(activities)

        // Check if it's a duplicate entry error (RLS policy violation)
        if (error.message.includes("row-level security policy")) {
          setShowRLSHelp(true)
          setActivityError("You have already logged this activity for today.")
          toast({
            title: "Already logged",
            description: "You have already logged this activity for today.",
            variant: "default",
          })
        }
        // Check if it's a foreign key error
        else if (error.message.includes("foreign key constraint")) {
          setShowFKHelp(true)
          setActivityError("Your profile is being set up. Please refresh the page to continue.")

          // Try to refresh the page to create the user profile
          window.location.reload()
        }
        // Check if it's an auth session error
        else if (error.message.includes("Auth session missing")) {
          setActivityError("Your session has expired. Please refresh the page or sign in again to continue.")
        } else {
          setActivityError("We couldn't update your activity. Please try again in a moment.")
        }
      } finally {
        setSavingActivity(null)
      }
    }, 300),
    [
      user,
      localDate,
      toast,
      calculateTodayPoints,
      fetchTodayPoints,
      fetchActivityHistory,
      recalculatePoints,
      fetchWeeklyStreakData,
      activities,
    ],
  )

  // Function to handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "history" && Object.keys(activityHistory).length === 0) {
      fetchActivityHistory()
    }
  }

  // Function to handle manual refresh
  const forceRefreshAllData = async () => {
    if (!user) return

    setRefreshing(true)
    setError(null) // Clear any existing errors

    try {
      // Recalculate user points
      await recalculateUserPointsClientSafe(user.id)

      // Recalculate user streak
      await recalculateUserStreakClientSafe(user.id)

      // Fetch fresh data
      await fetchActivitiesAndLogs()
      await fetchWeeklyStreakData()

      if (activeTab === "history") {
        await fetchActivityHistory()
      }

      toast({
        title: "Refresh Complete",
        description: "All your data has been refreshed",
      })
    } catch (error) {
      console.error("Error during force refresh:", error)
      toast({
        title: "Refresh Error",
        description: "There was a problem refreshing your data",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Replace the handleRefresh function with our improved version
  const handleRefresh = () => {
    forceRefreshAllData()
  }

  const [isVerifyingPoints, setIsVerifyingPoints] = useState(false)

  const handleVerifyAndFixPoints = async () => {
    setIsVerifyingPoints(true)
    try {
      const result = await verifyActivityPoints()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        // Refresh the page to load the fixed activities
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to verify activity points",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error verifying activity points:", error)
      toast({
        title: "Error",
        description: "Failed to verify activity points. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifyingPoints(false)
    }
  }

  // Function to toggle activity completion status
  const handleToggleActivity = async (activity: Activity) => {
    const handleRetry = () => {
      window.location.reload()
    }

    if (!user) return

    // Prevent toggling if already saving
    if (savingActivity) {
      console.log("Already saving an activity, please wait...")
      return
    }

    // Find the original activity in the activities array
    const originalActivity = activities.find((a) => a.id === activity.id)

    if (!originalActivity) {
      console.error("Original activity not found")
      return
    }

    // If the activity is already completed, don't allow toggling it off
    if (originalActivity.completed) {
      console.log("Activity already completed, cannot toggle off")
      return
    }

    // Set the saving state immediately to prevent double-clicks
    setSavingActivity(activity.id)

    try {
      // Check if this activity has already been logged today
      const alreadyLogged = await checkActivityAlreadyLoggedClientSafe(user.id, activity.id, localDate)

      if (alreadyLogged) {
        toast({
          title: "Already Logged",
          description: "This activity has already been logged today",
          variant: "destructive",
        })
        setSavingActivity(null)
        return
      }

      // Optimistically update the UI
      setActivities((prevActivities) => {
        const updatedActivities = prevActivities.map((a) => {
          if (a.id === activity.id) {
            return { ...a, completed: true }
          }
          return a
        })

        // Recalculate today's points with the updated activities
        const newPoints = updatedActivities.reduce((sum, act) => {
          return sum + (act.completed ? act.points : 0)
        }, 0)

        console.log(`Recalculated points after toggle: ${newPoints}`)
        setTodayPoints(newPoints)

        return updatedActivities
      })

      // Call the server action directly for more reliable logging
      const { logActivity } = await import("@/app/actions/activity-actions")
      const result = await logActivity(
        user.id,
        activity.id,
        localDate,
        activity.points,
        user.email || "",
        user.user_metadata?.full_name || "",
      )

      if (!result.success) {
        throw new Error(result.error || "Failed to log activity")
      }

      // Show confetti when completing an activity
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      toast({
        title: `${activity.emoji} ${activity.name} completed!`,
        description: `You earned ${activity.points} points`,
      })

      // Update streak when completing an activity
      updateUserStreakClientSafe(user.id).catch((err) => {
        console.error("Error updating streak:", err)
      })

      // Refresh user profile to get updated points
      try {
        const profileData = await getUserProfileClientSafe(user.id)
        setUserProfile(profileData)

        // Refresh history if we're on the history tab
        if (activeTab === "history") {
          fetchActivityHistory()
        }

        // Fetch today's points directly from the database to ensure accuracy
        const pointsResult = await getTodayPointsClientSafe(user.id, localDate)
        if (pointsResult.success) {
          setTodayPoints(pointsResult.points)
          console.log(`Today's points updated from database: ${pointsResult.points}`)
        }

        // Recalculate streak when completing an activity
        try {
          const streakResult = await recalculateUserStreakClientSafe(user.id)
          if (streakResult.success) {
            console.log(`Streak recalculated: ${streakResult.streak} days`)
          }
        } catch (streakError) {
          console.error("Error recalculating streak:", streakError)
        }

        // Refresh streak data
        fetchWeeklyStreakData()
      } catch (error) {
        console.error("Error refreshing data after activity completion:", error)
      }
    } catch (error: any) {
      console.error("Error logging activity:", error)

      // Revert the UI change if there was an error
      setActivities((prevActivities) => {
        const revertedActivities = prevActivities.map((a) => {
          if (a.id === activity.id) {
            return originalActivity // Restore original activity state
          }
          return a
        })

        // Recalculate today's points after reverting
        const revertedPoints = revertedActivities.reduce((sum, act) => {
          return sum + (act.completed ? act.points : 0)
        }, 0)

        console.log(`Reverted points calculation: ${revertedPoints}`)
        setTodayPoints(revertedPoints)

        return revertedActivities
      })

      // Show appropriate error message
      if (error.message.includes("row-level security policy")) {
        setShowRLSHelp(true)
        setActivityError("You have already logged this activity for today.")
        toast({
          title: "Already logged",
          description: "You have already logged this activity for today.",
          variant: "destructive",
        })
      } else if (error.message.includes("foreign key constraint")) {
        setShowFKHelp(true)
        setActivityError("Your profile is being set up. Please refresh the page to continue.")
      } else {
        setActivityError("We couldn't update your activity. Please try again in a moment.")
        toast({
          title: "Error",
          description: "Failed to log activity. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setSavingActivity(null)
    }
  }

  if (loading) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your activities...</p>
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
        <div className="text-center mt-4">
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Daily Tracker</CardTitle>
            <CardDescription>You need to be logged in to view your daily tracker</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/auth/login?callbackUrl=/daily-tracker">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading state when creating default activities
  if (creatingDefaultActivities) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Setting Up Your Activities</CardTitle>
            <CardDescription>We're creating your wellness activities. This will only take a moment.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Creating your wellness activities...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If no activities, show a message and button to create default activities
  if (activities.length === 0) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Your Daily Tracker</CardTitle>
            <CardDescription>Let's get started with your wellness journey!</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="mb-4">
              You don't have any activities set up yet. Let's create some default activities to get started.
            </p>
            <Button onClick={createDefaultActivities} disabled={creatingDefaultActivities}>
              {creatingDefaultActivities ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Up Activities...
                </>
              ) : (
                "Set Up My Activities"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8">
      <div className="mb-8 space-y-2 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Daily Tracker</h1>
          <p className="text-muted-foreground">
            Track your daily wellness activities and earn points. Activities reset at midnight.
          </p>
          <p className="text-sm text-muted-foreground">
            Today's date: {new Date(localDate).toLocaleDateString()} · {timeUntilReset}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {activityError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {activityError}
            {activityError.includes("Exercise") && (
              <Button variant="outline" size="sm" className="mt-2" onClick={checkAndFixExerciseActivity}>
                Fix Exercise Activity
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {showRLSHelp && (
        <Alert className="mb-4 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p>The database needs Row-Level Security (RLS) policies to be set up.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={setupRLSPolicies}>
              Set Up RLS Policies
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {showFKHelp && (
        <Alert className="mb-4 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p>Your user profile needs to be created in the database. Please try:</p>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li>Refreshing the page</li>
              <li>Signing out and signing back in</li>
              <li>Visiting your profile page first</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Tabs defaultValue="today" onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="today" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Activities</CardTitle>
                  <CardDescription>Complete these activities to earn points toward your wellness tier.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className={`flex items-center space-x-4 rounded-lg border p-4 transition-colors ${
                          activity.completed
                            ? "border-teal-200 bg-teal-50 dark:border-teal-900/50 dark:bg-teal-900/20"
                            : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
                        }`}
                      >
                        <div className="text-2xl">{activity.emoji}</div>
                        <div className="flex-1">
                          <div className="font-medium">{activity.name}</div>
                          <div className="text-xs text-muted-foreground">{activity.description}</div>
                          <div className="text-sm text-muted-foreground mt-1">{activity.points} points</div>
                        </div>
                        {savingActivity === activity.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : activity.completed ? (
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        ) : (
                          <Checkbox
                            checked={false}
                            onCheckedChange={() => handleToggleActivity(activity)}
                            className="h-6 w-6 border-2"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                  <CardDescription>View your past activity and point history.</CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="flex h-48 items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : Object.keys(activityHistory).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(activityHistory).map(([date, logs]) => {
                        const totalPointsForDay = logs.reduce((sum, log) => sum + log.points, 0)
                        return (
                          <div key={date} className="rounded-lg border p-4">
                            <h3 className="font-medium mb-2">{new Date(date).toLocaleDateString()}</h3>
                            <div className="space-y-2">
                              {logs.map((log) => (
                                <div key={log.id} className="flex items-center gap-2">
                                  <div className="text-lg">{log.activities?.emoji || "✅"}</div>
                                  <div className="flex-1">{log.activities?.name || "Activity"}</div>
                                  <div className="text-sm text-muted-foreground">{log.points} pts</div>
                                </div>
                              ))}
                              <div className="pt-2 mt-2 border-t flex justify-between">
                                <span className="font-medium">Total</span>
                                <span className="font-medium">{totalPointsForDay} pts</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No activity history found for the past 14 days.</p>
                      <Button variant="outline" className="mt-4" onClick={fetchActivityHistory}>
                        Refresh History
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Progress</CardTitle>
              <CardDescription>
                You've earned {todayPoints} out of {maxDailyPoints} possible points today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>0 pts</span>
                  <span>{maxDailyPoints} pts</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />

                {todayPoints === maxDailyPoints && (
                  <div className="mt-4 rounded-lg bg-teal-50 p-3 text-center text-teal-700 dark:bg-teal-900/20 dark:text-teal-300">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>You've completed all activities today!</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Streak</CardTitle>
              <CardDescription>Track your daily activity throughout the week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => {
                  const dayData = weeklyStreak.weekDays[i]
                  return (
                    <div
                      key={i}
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        dayData?.hasActivity
                          ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                          : dayData?.isPast
                            ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                            : "bg-gray-50 text-gray-300 dark:bg-gray-900 dark:text-gray-600"
                      } ${dayData?.isToday ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900" : ""}`}
                      title={dayData?.date ? new Date(dayData.date).toLocaleDateString() : ""}
                    >
                      {day}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Current streak: <span className="font-medium text-foreground">{weeklyStreak.currentStreak} days</span>
              </div>
              <div className="mt-2 text-center text-xs text-muted-foreground">
                Days with at least one activity are highlighted
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span>Your Tier Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🌱</div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Wellness Seedling</span>
                      <span className="text-xs text-muted-foreground">640–915 pts</span>
                    </div>
                    <Progress
                      value={userProfile?.total_points >= 640 ? 100 : (userProfile?.total_points / 640) * 100 || 0}
                      className="h-2"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-2xl">🌿</div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Wellness Bloomer</span>
                      <span className="text-xs text-muted-foreground">916–1,372 pts</span>
                    </div>
                    <Progress
                      value={
                        userProfile?.total_points >= 916
                          ? 100
                          : userProfile?.total_points >= 640
                            ? ((userProfile?.total_points - 640) / (916 - 640)) * 100
                            : 0
                      }
                      className="h-2"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-2xl">🌳</div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Wellness Champion</span>
                      <span className="text-xs text-muted-foreground">1,373+ pts</span>
                    </div>
                    <Progress
                      value={
                        userProfile?.total_points >= 1373
                          ? 100
                          : userProfile?.total_points >= 916
                            ? ((userProfile?.total_points - 916) / (1373 - 916)) * 100
                            : 0
                      }
                      className="h-2"
                    />
                  </div>
                </div>
              </div>

              {userProfile?.total_points >= 640 && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-center">
                  <div className="text-2xl mb-1">{getTierEmoji(userProfile.total_points)}</div>
                  <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    {userProfile?.total_points >= 1373
                      ? "Wellness Champion Tier Achieved!"
                      : userProfile?.total_points >= 916
                        ? "Wellness Bloomer Tier Achieved!"
                        : "Wellness Seedling Tier Achieved!"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
