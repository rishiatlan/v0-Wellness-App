"use client"

import Cookies from "js-cookie"

// Cookie name for storing the user's timezone
const TIMEZONE_COOKIE = "user_timezone"

// Cookie name for storing the last activity date
const LAST_ACTIVITY_DATE_COOKIE = "last_activity_date"

// Get the user's timezone
export function getUserTimezone(): string {
  // Try to get from cookie first
  const storedTimezone = Cookies.get(TIMEZONE_COOKIE)

  if (storedTimezone) {
    return storedTimezone
  }

  // If not in cookie, get from browser and store it
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  Cookies.set(TIMEZONE_COOKIE, timezone, { expires: 365 })

  return timezone
}

// Get the current date in user's local timezone (YYYY-MM-DD format)
export function getUserLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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

// Get the time until midnight in user's local timezone (in milliseconds)
export function getTimeUntilMidnight(): number {
  const now = new Date()

  // Calculate time until next midnight in local time
  const tomorrow = new Date(now)
  tomorrow.setHours(24, 0, 0, 0) // Set to next midnight in local time

  return tomorrow.getTime() - now.getTime()
}

// Format time until midnight in a human-readable format
export function formatTimeUntilMidnight(): string {
  const msUntilMidnight = getTimeUntilMidnight()
  const hours = Math.floor(msUntilMidnight / (1000 * 60 * 60))
  const minutes = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60))

  return `${hours}h ${minutes}m until local midnight`
}

// Get user's timezone offset in minutes
export function getUserTimezoneOffset(): number {
  return new Date().getTimezoneOffset()
}

// Convert a date to user's local timezone
export function convertToUserTimezone(date: Date): Date {
  return new Date(date)
}
