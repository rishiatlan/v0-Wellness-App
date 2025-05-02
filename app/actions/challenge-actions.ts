"use server"

import { createServiceRoleClient } from "@/utils/supabase/service"
import { revalidatePath } from "next/cache"

export async function getChallengeStatus() {
  try {
    const serviceClient = createServiceRoleClient()

    // Get challenge status directly from the columns instead of using key/value
    const { data, error } = await serviceClient
      .from("app_settings")
      .select("challenge_started, challenge_start_date")
      .limit(1)
      .single()

    if (error) {
      console.error("Error getting challenge status:", error)
      return { started: false, error: error.message }
    }

    // Get values directly from the columns
    const started = data?.challenge_started === true

    // Use the fixed May 5, 2025 date if no date is set in the database
    // Month is 0-indexed in JavaScript Date, so 4 = May
    const defaultStartDate = new Date(2025, 4, 5, 0, 0, 0, 0)
    const startDate = data?.challenge_start_date ? new Date(data.challenge_start_date) : defaultStartDate

    return { started, startDate }
  } catch (error: any) {
    console.error("Error in getChallengeStatus:", error)
    // Return a default date if there's an error
    return {
      started: false,
      startDate: new Date(2025, 4, 5, 0, 0, 0, 0),
      error: error.message,
    }
  }
}

export async function setChallengeStatus(started: boolean) {
  try {
    const serviceClient = createServiceRoleClient()

    // Update challenge_started directly
    const { error } = await serviceClient.from("app_settings").update({ challenge_started: started }).limit(1)

    if (error) {
      console.error("Error setting challenge status:", error)
      return { success: false, error: error.message }
    }

    // If starting the challenge, log it
    if (started) {
      await serviceClient.from("system_logs").insert({
        event_type: "challenge_started",
        description: "Challenge was started",
        metadata: { timestamp: new Date().toISOString() },
      })
    }

    revalidatePath("/")
    revalidatePath("/daily-tracker")
    revalidatePath("/leaderboard")
    revalidatePath("/team-challenge")

    return { success: true }
  } catch (error: any) {
    console.error("Error in setChallengeStatus:", error)
    return { success: false, error: error.message }
  }
}

export async function setChallengeStartDate(startDate: Date) {
  try {
    const serviceClient = createServiceRoleClient()

    // Update challenge_start_date directly
    const { error } = await serviceClient
      .from("app_settings")
      .update({ challenge_start_date: startDate.toISOString() })
      .limit(1)

    if (error) {
      console.error("Error setting challenge start date:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")

    return { success: true }
  } catch (error: any) {
    console.error("Error in setChallengeStartDate:", error)
    return { success: false, error: error.message }
  }
}
