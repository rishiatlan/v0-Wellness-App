"use client"

export function getUserLocalDate(): string {
  const now = new Date()
  return now.toISOString().split("T")[0]
}

export function isNewDay(): boolean {
  const lastLogin = localStorage.getItem("lastLogin")
  const today = getUserLocalDate()
  return lastLogin !== today
}

export function getTimeUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setDate(now.getDate() + 1)
  midnight.setHours(0, 0, 0, 0)
  return midnight.getTime() - now.getTime()
}
