"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  AlertCircle,
  Users,
  UserX,
  UserPlus,
  Shield,
  RefreshCw,
  Trash2,
  UserCog,
  CheckCircle,
  Search,
  Plus,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { isAdmin } from "@/lib/admin-utils"

// Import server actions
import {
  resetUser,
  deleteUser,
  resetTeam,
  deleteTeam,
  createTeam,
  addAdminUser,
  removeAdminUser,
  addUserToTeam,
  removeUserFromTeam,
  checkIsAdmin,
  addUser,
} from "@/app/actions/admin-actions"
import { TeamDetails } from "@/app/team-challenge/team-details"

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [admins, setAdmins] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [newTeamName, setNewTeamName] = useState("")
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [filteredTeams, setFilteredTeams] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [isAdminMap, setIsAdminMap] = useState<Record<string, boolean>>({})
  const [selectedTeamForUser, setSelectedTeamForUser] = useState<string | null>(null)
  const [selectedUserForTeam, setSelectedUserForTeam] = useState<string | null>(null)
  const [isUserAdmin, setIsUserAdmin] = useState(false)
  const [adminCheckComplete, setAdminCheckComplete] = useState(false)
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<any | null>(null)

  // New state for adding users
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.email) {
        setAdminCheckComplete(true)
        return
      }

      try {
        // First check client-side
        if (isAdmin(user.email)) {
          console.log("User is admin according to client-side check:", user.email)
          setIsUserAdmin(true)
          setAdminCheckComplete(true)
          return
        }

        // Then verify with server
        const result = await checkIsAdmin(user.email)
        console.log("Server admin check result:", result)
        setIsUserAdmin(result.isAdmin)
      } catch (error) {
        console.error("Error checking admin status:", error)
      } finally {
        setAdminCheckComplete(true)
      }
    }

    checkAdminStatus()
  }, [user])

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !isUserAdmin) return

      setLoading(true)
      setError(null)

      try {
        // Fetch users
        const { data: usersData, error: usersError } = await supabase.from("users").select("*").order("full_name")

        if (usersError) throw usersError
        setUsers(usersData || [])
        setFilteredUsers(usersData || [])

        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase.from("teams").select("*").order("name")

        if (teamsError) throw teamsError

        // Get member count for each team
        const teamsWithMemberCount = await Promise.all(
          (teamsData || []).map(async (team) => {
            const { count, error: countError } = await supabase
              .from("users")
              .select("id", { count: "exact" })
              .eq("team_id", team.id)

            if (countError) throw countError

            return {
              ...team,
              member_count: count || 0,
            }
          }),
        )

        setTeams(teamsWithMemberCount)
        setFilteredTeams(teamsWithMemberCount)

        // Fetch admins
        const { data: adminsData, error: adminsError } = await supabase
          .from("admin_users")
          .select("email")
          .order("email")

        if (adminsError) throw adminsError
        const adminEmails = adminsData?.map((admin) => admin.email.toLowerCase()) || []
        setAdmins(adminEmails)

        // Create a map of user emails to admin status
        const adminMap: Record<string, boolean> = {}
        usersData?.forEach((user) => {
          adminMap[user.email] = adminEmails.includes(user.email.toLowerCase())
        })
        setIsAdminMap(adminMap)
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, isUserAdmin])

  // Filter users and teams based on search query and filters
  useEffect(() => {
    // Filter users
    let filtered = [...users]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (user) => user.full_name?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query),
      )
    }

    if (teamFilter !== "all") {
      if (teamFilter === "with-team") {
        filtered = filtered.filter((user) => user.team_id)
      } else if (teamFilter === "without-team") {
        filtered = filtered.filter((user) => !user.team_id)
      }
    }

    setFilteredUsers(filtered)

    // Filter teams
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      setFilteredTeams(teams.filter((team) => team.name?.toLowerCase().includes(query)))
    } else {
      setFilteredTeams(teams)
    }
  }, [searchQuery, teamFilter, users, teams])

  const handleToggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleToggleTeamSelection = (teamId: string) => {
    setSelectedTeams((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]))
  }

  const handleToggleAdminStatus = async (email: string, currentStatus: boolean) => {
    setActionInProgress(`toggle-admin-${email}`)
    setError(null)
    setSuccess(null)

    try {
      let result

      if (currentStatus) {
        // Remove admin
        result = await removeAdminUser(email)
      } else {
        // Add admin
        result = await addAdminUser(email)
      }

      if (result.success) {
        setSuccess(`Admin status ${currentStatus ? "removed from" : "granted to"} ${email}`)

        // Update admin list
        if (currentStatus) {
          setAdmins(admins.filter((a) => a !== email.toLowerCase()))
        } else {
          setAdmins([...admins, email.toLowerCase()])
        }

        // Update admin status map
        setIsAdminMap((prev) => ({
          ...prev,
          [email]: !currentStatus,
        }))
      } else {
        setError(result.error || `Failed to ${currentStatus ? "remove" : "add"} admin`)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleResetUser = async (userId: string) => {
    setActionInProgress(`reset-user-${userId}`)
    setError(null)
    setSuccess(null)

    try {
      const result = await resetUser(userId)
      if (result.success) {
        setSuccess(`User reset successfully: ${result.email}`)

        // Update user in the list
        setUsers(
          users.map((user) => {
            if (user.id === userId) {
              return {
                ...user,
                team_id: null,
                total_points: 0,
                current_tier: 0,
                current_streak: 0,
              }
            }
            return user
          }),
        )
      } else {
        setError(result.error || "Failed to reset user")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setActionInProgress(`delete-user-${userId}`)
    setError(null)
    setSuccess(null)

    try {
      const result = await deleteUser(userId)
      if (result.success) {
        setSuccess(`User deleted successfully: ${result.email}`)

        // Remove user from the list
        setUsers(users.filter((user) => user.id !== userId))
        setFilteredUsers(filteredUsers.filter((user) => user.id !== userId))
      } else {
        setError(result.error || "Failed to delete user")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleAddNewUser = async () => {
    if (!newUserEmail.trim() || !newUserEmail.includes("@atlan.com")) {
      setError("Please enter a valid @atlan.com email address")
      return
    }

    setActionInProgress("add-user")
    setError(null)
    setSuccess(null)

    try {
      const result = await addUser(newUserEmail, newUserName)
      if (result.success) {
        setSuccess(`User added successfully: ${newUserEmail}`)

        // Add new user to the list
        setUsers([...users, result.user])

        // Reset form
        setNewUserEmail("")
        setNewUserName("")
        setAddUserDialogOpen(false)
      } else {
        setError(result.error || "Failed to add user")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleResetTeam = async (teamId: string) => {
    setActionInProgress(`reset-team-${teamId}`)
    setError(null)
    setSuccess(null)

    try {
      const result = await resetTeam(teamId)
      if (result.success) {
        setSuccess(`Team reset successfully: ${result.name}`)

        // Update team in the list
        setTeams(
          teams.map((team) => {
            if (team.id === teamId) {
              return {
                ...team,
                total_points: 0,
              }
            }
            return team
          }),
        )

        // Update users that were in this team
        setUsers(
          users.map((user) => {
            if (user.team_id === teamId) {
              return {
                ...user,
                team_id: null,
              }
            }
            return user
          }),
        )
      } else {
        setError(result.error || "Failed to reset team")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    setActionInProgress(`delete-team-${teamId}`)
    setError(null)
    setSuccess(null)

    try {
      const result = await deleteTeam(teamId)
      if (result.success) {
        setSuccess(`Team deleted successfully: ${result.name}`)

        // Remove team from the list
        setTeams(teams.filter((team) => team.id !== teamId))

        // Update users that were in this team
        setUsers(
          users.map((user) => {
            if (user.team_id === teamId) {
              return {
                ...user,
                team_id: null,
              }
            }
            return user
          }),
        )
      } else {
        setError(result.error || "Failed to delete team")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      setError("Team name is required")
      return
    }

    setActionInProgress("create-team")
    setError(null)
    setSuccess(null)

    try {
      const result = await createTeam(newTeamName)
      if (result.success) {
        setSuccess(`Team created successfully: ${result.name}`)
        setNewTeamName("")

        // Add new team to the list
        setTeams([
          ...teams,
          {
            id: result.id,
            name: result.name,
            total_points: 0,
            member_count: 0,
          },
        ])
      } else {
        setError(result.error || "Failed to create team")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim() || !newAdminEmail.includes("@")) {
      setError("Valid email is required")
      return
    }

    setActionInProgress("add-admin")
    setError(null)
    setSuccess(null)

    try {
      const result = await addAdminUser(newAdminEmail)
      if (result.success) {
        setSuccess(`Admin added successfully: ${result.email}`)
        setNewAdminEmail("")

        // Add to admin list
        setAdmins([...admins, newAdminEmail.toLowerCase()])
      } else {
        setError(result.error || "Failed to add admin")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleAddUserToTeam = async () => {
    if (!selectedUserForTeam || !selectedTeamForUser) {
      setError("Both user and team must be selected")
      return
    }

    setActionInProgress("add-user-to-team")
    setError(null)
    setSuccess(null)

    try {
      const result = await addUserToTeam(selectedUserForTeam, selectedTeamForUser)
      if (result.success) {
        setSuccess(`Added ${result.userName} to team ${result.teamName}`)
        setSelectedUserForTeam(null)
        setSelectedTeamForUser(null)

        // Update user in the list
        setUsers(
          users.map((user) => {
            if (user.id === selectedUserForTeam) {
              return {
                ...user,
                team_id: selectedTeamForUser,
              }
            }
            return user
          }),
        )

        // Update team member count
        setTeams(
          teams.map((team) => {
            if (team.id === selectedTeamForUser) {
              return {
                ...team,
                member_count: team.member_count + 1,
              }
            }
            return team
          }),
        )
      } else {
        setError(result.error || "Failed to add user to team")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleRemoveUserFromTeam = async (userId: string) => {
    setActionInProgress(`remove-from-team-${userId}`)
    setError(null)
    setSuccess(null)

    try {
      const user = users.find((u) => u.id === userId)
      const teamId = user?.team_id

      const result = await removeUserFromTeam(userId)
      if (result.success) {
        setSuccess(`Removed ${result.userName} from team`)

        // Update user in the list
        setUsers(
          users.map((user) => {
            if (user.id === userId) {
              return {
                ...user,
                team_id: null,
              }
            }
            return user
          }),
        )

        // Update team member count
        if (teamId) {
          setTeams(
            teams.map((team) => {
              if (team.id === teamId) {
                return {
                  ...team,
                  member_count: Math.max(0, team.member_count - 1),
                }
              }
              return team
            }),
          )
        }
      } else {
        setError(result.error || "Failed to remove user from team")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setActionInProgress(null)
    }
  }

  const refreshData = async () => {
    setActionInProgress("refresh")
    setError(null)
    setSuccess(null)

    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase.from("users").select("*").order("full_name")

      if (usersError) throw usersError
      setUsers(usersData || [])
      setFilteredUsers(usersData || [])

      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase.from("teams").select("*").order("name")

      if (teamsError) throw teamsError

      // Get member count for each team
      const teamsWithMemberCount = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { count, error: countError } = await supabase
            .from("users")
            .select("id", { count: "exact" })
            .eq("team_id", team.id)

          if (countError) throw countError

          return {
            ...team,
            member_count: count || 0,
          }
        }),
      )

      setTeams(teamsWithMemberCount)
      setFilteredTeams(teamsWithMemberCount)

      // Fetch admins
      const { data: adminsData, error: adminsError } = await supabase.from("admin_users").select("email").order("email")

      if (adminsError) throw adminsError
      const adminEmails = adminsData?.map((admin) => admin.email.toLowerCase()) || []
      setAdmins(adminEmails)

      // Create a map of user emails to admin status
      const adminMap: Record<string, boolean> = {}
      usersData?.forEach((user) => {
        adminMap[user.email] = adminEmails.includes(user.email.toLowerCase())
      })
      setIsAdminMap(adminMap)

      setSuccess("Data refreshed successfully")
    } catch (err: any) {
      setError(err.message || "Failed to refresh data")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleSelectTeamDetails = (team: any) => {
    setSelectedTeamDetails(team)
  }

  // Show loading state while checking admin status
  if (!adminCheckComplete) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Redirect if not admin
  if (!isUserAdmin) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>You don't have permission to access this page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container px-4 py-8">
      <div className="mb-8 space-y-2 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, teams, and system settings</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={actionInProgress === "refresh"}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${actionInProgress === "refresh" ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users or teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="with-team">With Team</SelectItem>
              <SelectItem value="without-team">Without Team</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Teams</span>
          </TabsTrigger>
          <TabsTrigger value="team-management" className="flex items-center gap-1">
            <UserPlus className="h-4 w-4" />
            <span>Team Management</span>
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span>Admins</span>
          </TabsTrigger>
          <TabsTrigger value="team-details" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Team Details</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users in the system</CardDescription>
              </div>
              <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="ml-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the system. Only @atlan.com email addresses are allowed.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        placeholder="user@atlan.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                      />
                      {newUserEmail && !newUserEmail.endsWith("@atlan.com") && (
                        <p className="text-xs text-red-500">Only @atlan.com email addresses are allowed</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Full Name (Optional)
                      </label>
                      <Input
                        id="name"
                        placeholder="Full Name"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleAddNewUser}
                      disabled={
                        actionInProgress === "add-user" || !newUserEmail.trim() || !newUserEmail.endsWith("@atlan.com")
                      }
                    >
                      {actionInProgress === "add-user" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      {actionInProgress === "add-user" ? "Adding..." : "Add User"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers(filteredUsers.map((user) => user.id))
                            } else {
                              setSelectedUsers([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => handleToggleUserSelection(user.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{user.full_name || "Unnamed User"}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.team_id ? (
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                {teams.find((t) => t.id === user.team_id)?.name || "Unknown Team"}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">No Team</span>
                            )}
                          </TableCell>
                          <TableCell>{user.total_points}</TableCell>
                          <TableCell>
                            <Checkbox
                              checked={isAdminMap[user.email] || false}
                              onCheckedChange={() =>
                                handleToggleAdminStatus(user.email, isAdminMap[user.email] || false)
                              }
                              disabled={actionInProgress === `toggle-admin-${user.email}`}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {user.team_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveUserFromTeam(user.id)}
                                  disabled={actionInProgress === `remove-from-team-${user.id}`}
                                >
                                  {actionInProgress === `remove-from-team-${user.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Remove from Team"
                                  )}
                                </Button>
                              )}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <UserX className="h-4 w-4 mr-1" />
                                    Reset
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reset User</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to reset this user? This will remove them from their team
                                      and reset their points.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <p>
                                      <strong>Name:</strong> {user.full_name || "Unnamed User"}
                                    </p>
                                    <p>
                                      <strong>Email:</strong> {user.email}
                                    </p>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleResetUser(user.id)}
                                      disabled={actionInProgress === `reset-user-${user.id}`}
                                    >
                                      {actionInProgress === `reset-user-${user.id}` ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      ) : null}
                                      {actionInProgress === `reset-user-${user.id}` ? "Resetting..." : "Reset User"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete User</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete this user? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <p>
                                      <strong>Name:</strong> {user.full_name || "Unnamed User"}
                                    </p>
                                    <p>
                                      <strong>Email:</strong> {user.email}
                                    </p>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleDeleteUser(user.id)}
                                      disabled={actionInProgress === `delete-user-${user.id}`}
                                    >
                                      {actionInProgress === `delete-user-${user.id}` ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      ) : null}
                                      {actionInProgress === `delete-user-${user.id}` ? "Deleting..." : "Delete User"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchQuery ? "No users found matching your search" : "No users found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>View and manage teams in the system</CardDescription>
              </div>
              <Button onClick={handleCreateTeam} disabled={actionInProgress === "create-team"} className="ml-auto">
                {actionInProgress === "create-team" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {actionInProgress === "create-team" ? "Creating..." : "Create Team"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="teamName" className="text-sm font-medium">
                    Team Name
                  </label>
                  <Input
                    id="teamName"
                    placeholder="Team Awesome"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                  />
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedTeams.length === filteredTeams.length && filteredTeams.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTeams(filteredTeams.map((team) => team.id))
                            } else {
                              setSelectedTeams([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.length > 0 ? (
                      filteredTeams.map((team) => (
                        <TableRow key={team.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTeams.includes(team.id)}
                              onCheckedChange={() => handleToggleTeamSelection(team.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell>{team.total_points}</TableCell>
                          <TableCell>{team.member_count}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="secondary" size="sm" onClick={() => handleSelectTeamDetails(team)}>
                                Details
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <UserX className="h-4 w-4 mr-1" />
                                    Reset
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reset Team</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to reset this team? This will reset the team's points and
                                      remove all users from the team.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <p>
                                      <strong>Name:</strong> {team.name}
                                    </p>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleResetTeam(team.id)}
                                      disabled={actionInProgress === `reset-team-${team.id}`}
                                    >
                                      {actionInProgress === `reset-team-${team.id}` ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      ) : null}
                                      {actionInProgress === `reset-team-${team.id}` ? "Resetting..." : "Reset Team"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete Team</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete this team? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <p>
                                      <strong>Name:</strong> {team.name}
                                    </p>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleDeleteTeam(team.id)}
                                      disabled={actionInProgress === `delete-team-${team.id}`}
                                    >
                                      {actionInProgress === `delete-team-${team.id}` ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      ) : null}
                                      {actionInProgress === `delete-team-${team.id}` ? "Deleting..." : "Delete Team"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {searchQuery ? "No teams found matching your search" : "No teams found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team-management">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Add or remove users from teams</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="user" className="text-sm font-medium">
                    User
                  </label>
                  <Select value={selectedUserForTeam} onValueChange={setSelectedUserForTeam}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="team" className="text-sm font-medium">
                    Team
                  </label>
                  <Select value={selectedTeamForUser} onValueChange={setSelectedTeamForUser}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddUserToTeam} disabled={actionInProgress === "add-user-to-team"}>
                  {actionInProgress === "add-user-to-team" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  {actionInProgress === "add-user-to-team" ? "Adding..." : "Add User to Team"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Admin Management</CardTitle>
                <CardDescription>Add or remove admins</CardDescription>
              </div>
              <Button onClick={handleAddAdmin} disabled={actionInProgress === "add-admin"} className="ml-auto">
                {actionInProgress === "add-admin" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" />
                )}
                {actionInProgress === "add-admin" ? "Adding..." : "Add Admin"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="adminEmail" className="text-sm font-medium">
                    Admin Email
                  </label>
                  <Input
                    id="adminEmail"
                    placeholder="admin@example.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.length > 0 ? (
                      admins.map((admin) => (
                        <TableRow key={admin}>
                          <TableCell className="font-medium">{admin}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleToggleAdminStatus(admin, true)}
                              disabled={actionInProgress === `toggle-admin-${admin}`}
                            >
                              {actionInProgress === `toggle-admin-${admin}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserCog className="h-4 w-4 mr-1" />
                              )}
                              Remove Admin
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                          No admins found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team-details">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Team Details</CardTitle>
                <CardDescription>View details for a selected team</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {selectedTeamDetails ? (
                <TeamDetails team={selectedTeamDetails} />
              ) : (
                <p className="text-muted-foreground">Select a team to view details</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
