import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminDashboard from "./admin-dashboard-client"
import { ChallengeSettings } from "./challenge-settings"
import { TeamAssignmentTool } from "./team-assignment-tool"
import { createServiceRoleClient } from "@/utils/supabase/service"

export default async function AdminPage() {
  const serviceClient = createServiceRoleClient()

  // Fetch users
  const { data: users, error: usersError } = await serviceClient.from("users").select("*").order("full_name")

  // Fetch teams
  const { data: teamsData, error: teamsError } = await serviceClient.from("teams").select("*").order("name")

  // Get member count for each team
  const teams = await Promise.all(
    (teamsData || []).map(async (team) => {
      const { count, error: countError } = await serviceClient
        .from("users")
        .select("id", { count: "exact" })
        .eq("team_id", team.id)

      return {
        ...team,
        member_count: count || 0,
      }
    }),
  )

  // Fetch admins
  const { data: adminsData, error: adminsError } = await serviceClient
    .from("admin_users")
    .select("email")
    .order("email")

  const admins = adminsData?.map((admin) => admin.email) || []

  // Get current user
  const {
    data: { session },
  } = await serviceClient.auth.getSession()
  const currentUser = session?.user || null

  return (
    <Tabs defaultValue="dashboard">
      <TabsList className="mb-4">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="challenge">Challenge Settings</TabsTrigger>
        <TabsTrigger value="teams">Team Assignments</TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard">
        <AdminDashboard
          initialUsers={users || []}
          initialTeams={teams || []}
          initialAdmins={admins}
          currentUser={currentUser}
        />
      </TabsContent>

      <TabsContent value="challenge">
        <ChallengeSettings />
      </TabsContent>

      <TabsContent value="teams">
        <TeamAssignmentTool />
      </TabsContent>
    </Tabs>
  )
}
