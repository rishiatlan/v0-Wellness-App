"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import Link from "next/link"
import { getUserTeam } from "@/app/actions/team-actions"
import { useAuth } from "@/lib/auth-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TeamIndicatorProps {
  className?: string
  showTooltip?: boolean
}

export function TeamIndicator({ className = "", showTooltip = true }: TeamIndicatorProps) {
  const { user } = useAuth()
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeam = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const teamData = await getUserTeam(user.id)
        setTeam(teamData)
      } catch (err) {
        console.error("Error fetching team:", err)
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchTeam()
    }
  }, [user?.id])

  if (loading) {
    return (
      <Badge variant="outline" className={`animate-pulse bg-navy-800 text-white ${className}`}>
        <Users className="h-3 w-3 mr-1" />
        Loading...
      </Badge>
    )
  }

  if (!team) {
    return (
      <Badge variant="outline" className={`bg-navy-800 text-yellow-400 hover:bg-navy-700 ${className}`}>
        <Link href="/team-challenge" className="flex items-center">
          <Users className="h-3 w-3 mr-1" />
          No Team - Join Now
        </Link>
      </Badge>
    )
  }

  const indicator = (
    <Badge
      className={`bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white ${className}`}
    >
      <Link href="/team-challenge" className="flex items-center">
        <Users className="h-3 w-3 mr-1" />
        {team.name}
      </Link>
    </Badge>
  )

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{indicator}</TooltipTrigger>
          <TooltipContent className="bg-navy-900 border-navy-700 text-white">
            <div className="text-xs">
              <div className="font-medium mb-1">{team.name}</div>
              <div className="text-slate-300">Members: {team.members?.length || 0}/5</div>
              <div className="text-slate-300">Team Points: {team.total_points || 0}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return indicator
}
