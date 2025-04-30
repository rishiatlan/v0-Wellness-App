"use client"

import { CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils"
import { Badge } from "@/components/ui/badge"

export const TeamDetails = ({ team, users }: { team: any; users: any[] }) => {
  const teamMembers = users.filter((user) => user.team_id === team.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Details</CardTitle>
        <CardDescription>Details for {team.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Team Members</h3>
          <Badge variant="outline">{teamMembers.length} / 5 members</Badge>
        </div>

        {teamMembers.length > 0 ? (
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-md border bg-card">
                <Avatar>
                  <AvatarImage
                    src={getAvatarUrl(member.full_name, member.avatar_url) || "/placeholder.svg"}
                    alt={member.full_name}
                  />
                  <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{member.full_name}</div>
                  <div className="text-sm text-muted-foreground">{member.email}</div>
                </div>
                <Badge variant="secondary">{member.total_points || 0} pts</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-4 text-center">No members in this team</p>
        )}

        <div className="flex justify-between pt-4 border-t">
          <p>Total Points:</p>
          <p className="font-bold">{team.total_points}</p>
        </div>
      </CardContent>
    </Card>
  )
}
