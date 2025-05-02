import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getActivitiesClientSafe, toggleActivityClientSafe } from "@/lib/api-client-safe"

// Query key factory for better type safety and organization
const queryKeys = {
  activities: ["activities"],
  dailyLogs: (userId: string, date: string) => ["dailyLogs", userId, date],
  userProfile: (userId: string) => ["userProfile", userId],
}

export function useActivities() {
  return useQuery({
    queryKey: queryKeys.activities,
    queryFn: () => getActivitiesClientSafe(),
    // Activities rarely change, so we can set a longer stale time
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useToggleActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      activityId,
      date,
      points,
      userEmail,
      userName,
    }: {
      userId: string
      activityId: string
      date: string
      points: number
      userEmail: string
      userName: string
    }) => {
      return toggleActivityClientSafe(userId, activityId, date, points, userEmail, userName)
    },
    // When the mutation succeeds, invalidate related queries
    onSuccess: (_, variables) => {
      const { userId, date } = variables

      // Invalidate daily logs for this user and date
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyLogs(userId, date) })

      // Invalidate user profile to update points
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) })
    },
  })
}
