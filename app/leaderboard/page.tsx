import { Suspense } from "react"
import { getIndividualLeaderboard, getTeamLeaderboard } from "@/app/actions/leaderboard-actions"
import LeaderboardClient from "./leaderboard-client"
import LeaderboardLoading from "./loading"

// This enables ISR - the page will be regenerated after 5 minutes (300 seconds)
export const revalidate = 300

export default async function LeaderboardPage() {
  // Fetch data at build/revalidation time
  const individualsPromise = getIndividualLeaderboard()
  const teamsPromise = getTeamLeaderboard()

  // Wait for both promises to resolve
  const [individuals, teams] = await Promise.all([individualsPromise, teamsPromise])

  return (
    <Suspense fallback={<LeaderboardLoading />}>
      <LeaderboardClient initialIndividuals={individuals} initialTeams={teams} />
    </Suspense>
  )
}
