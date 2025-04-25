"use client"

import Cookies from "js-cookie"

// Cookie name for storing the user's timezone offset
const TIMEZONE_COOKIE = "user_timezone_offset"

// Cookie name for storing the last activity date
const LAST_ACTIVITY_DATE_COOKIE = "last_activity_date"

// Get the user's timezone offset in minutes
export function getUserTimezoneOffset(): number {
  // Try to get from cookie first
  const storedOffset = Cookies.get(TIMEZONE_COOKIE)

  if (storedOffset) {
    return Number.parseInt(storedOffset, 10)
  }

  // If not in cookie, get from browser and store it
  const offset = new Date().getTimezoneOffset()
  Cookies.set(TIMEZONE_COOKIE, offset.toString(), { expires: 365 })

  return offset
}

// Get the current date in GMT (YYYY-MM-DD format)
export function getUserLocalDate(): string {
  // Get current date in GMT
  const now = new Date()
  return now.toISOString().split("T")[0]
}

// Check if it's a new day compared to the last activity
export function isNewDay(): boolean {
  const lastActivityDate = Cookies.get(LAST_ACTIVITY_DATE_COOKIE)
  const currentDate = getUserLocalDate()

  if (!lastActivityDate) {
    // First time, set the cookie and return true
    Cookies.set(LAST_ACTIVITY_DATE_COOKIE, currentDate)
    return true
  }

  // If the date has changed, update the cookie and return true
  if (lastActivityDate !== currentDate) {
    Cookies.set(LAST_ACTIVITY_DATE_COOKIE, currentDate)
    return true
  }

  return false
}

// Get the time until midnight in GMT (in milliseconds)
export function getTimeUntilMidnight(): number {
  const now = new Date()

  // Calculate time until next midnight in GMT
  const tomorrow = new Date(now)
  tomorrow.setUTCHours(24, 0, 0, 0) // Set to next midnight in GMT

  return tomorrow.getTime() - now.getTime()
}
