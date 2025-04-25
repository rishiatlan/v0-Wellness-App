"use client"

import { CardDescription } from "@/components/ui/card"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const TeamDetails = ({ team, users }: { team: any; users: any[] }) => {
  const teamMembers = users.filter((user) => user.team_id === team.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Details</CardTitle>
        <CardDescription>Details for {team.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="text-lg font-medium">Team Members</h3>
        {teamMembers.length > 0 ? (
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.avatar_url || "/placeholder.svg"} alt={member.full_name} />
                  <AvatarFallback>{member.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{member.full_name}</div>
                  <div className="text-sm text-muted-foreground">{member.email}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No members in this team</p>
        )}
        <div className="flex justify-between">
          <p>Total Points: {team.total_points}</p>
        </div>
      </CardContent>
    </Card>
  )
}
