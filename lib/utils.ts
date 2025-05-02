import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Combine class names with Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a display name from an email address
export function generateNameFromEmail(email: string): string {
  if (!email) return "Unknown User"

  // Extract name from email
  const namePart = email.split("@")[0]

  // Handle user-xxx@atlan.com format
  if (namePart.startsWith("user-")) {
    return "Atlan User " + namePart.substring(5, 9)
  }

  // Format standard email
  return namePart
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

// Format date to locale string
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}
