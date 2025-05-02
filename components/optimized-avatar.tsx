"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getEmailAssetUrl, getFallbackAssetUrl } from "@/lib/asset-utils"

interface OptimizedAvatarProps {
  userId?: string
  email?: string
  name?: string
  fallbackUrl?: string
  type?: "user" | "team"
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  priority?: boolean
}

export function OptimizedAvatar({
  userId,
  email,
  name,
  fallbackUrl,
  type = "user",
  className,
  size = "md",
  priority = false,
}: OptimizedAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Get initials from name or email
  const getInitials = () => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return type === "team" ? "TM" : "US"
  }

  // Get avatar URL
  useEffect(() => {
    const fetchAvatarUrl = async () => {
      setIsLoading(true)
      try {
        // Try to get avatar from email assets
        if (fallbackUrl) {
          setAvatarUrl(fallbackUrl)
        } else if (email) {
          // Use email for Gravatar or similar service
          const emailHash = email.trim().toLowerCase()
          setAvatarUrl(`https://www.gravatar.com/avatar/${emailHash}?d=mp&s=200`)
        } else if (type === "team") {
          // Use a default team avatar
          setAvatarUrl(getEmailAssetUrl("team-avatar.png") || getFallbackAssetUrl("team-avatar.png"))
        } else {
          // Use a default user avatar
          setAvatarUrl(getEmailAssetUrl("user-avatar.png") || getFallbackAssetUrl("user-avatar.png"))
        }
      } catch (error) {
        console.error("Error fetching avatar:", error)
        setImageError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvatarUrl()
  }, [email, fallbackUrl, type])

  // Size classes
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  }

  // Background color based on initials (for consistent colors per user)
  const getBackgroundColor = () => {
    if (!name && !email) return "bg-navy-700"

    const str = name || email || ""
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }

    const colors = [
      "bg-blue-700",
      "bg-teal-700",
      "bg-emerald-700",
      "bg-purple-700",
      "bg-amber-700",
      "bg-pink-700",
      "bg-indigo-700",
      "bg-rose-700",
    ]

    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  return (
    <Avatar className={cn(sizeClasses[size], "ring-2 ring-navy-700 bg-navy-800", className)}>
      <AvatarImage
        src={avatarUrl || ""}
        alt={name || email || "Avatar"}
        onError={() => setImageError(true)}
        loading={priority ? "eager" : "lazy"}
        className={cn(isLoading ? "opacity-0" : "opacity-100", "transition-opacity duration-300")}
      />
      <AvatarFallback className={cn(getBackgroundColor(), "text-white")}>
        {isLoading ? "..." : getInitials()}
      </AvatarFallback>
    </Avatar>
  )
}
