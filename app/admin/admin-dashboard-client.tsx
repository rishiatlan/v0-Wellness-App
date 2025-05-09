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
import {
  resetUser,
  resetTeam,
  deleteTeam,
  createTeam,
  addAdminUser,
  removeAdminUser,
  addUserToTeam,
  removeUserFromTeam,
} from "@/app/actions/admin-actions"

export default function AdminDashboardClient({
  initialUsers,
  initialTeams,
  initialAdmins,
  currentUser,
}: {
  initialUsers: any[]
  initialTeams: any[]
  initialAdmins: string[]
  currentUser: any
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>(initialUsers)
  const [teams, setTeams] = useState<any[]>(initialTeams)
  const [admins, setAdmins] = useState<string[]>(initialAdmins)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [newTeamName, setNewTeamName] = useState("")
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [filteredUsers, setFilteredUsers] = useState<any[]>(initialUsers)
  const [filteredTeams, setFilteredTeams] = useState<any[]>(initialTeams)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [isAdminMap, setIsAdminMap] = useState<Record<string, boolean>>({})
  const [selectedTeamForUser, setSelectedTeamForUser] = useState<string | null>(null)
  const [selectedUserForTeam, setSelectedUserForTeam] = useState<string | null>(null)

  // Create admin status map
  useEffect(() => {
    const adminMap: Record<string, boolean> = {}
    users.forEach((user) => {
      adminMap[user.email] = admins.includes(user.email.toLowerCase())
    })
    setIsAdminMap(adminMap)
  }, [users, admins])

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
    setLoading(true)
    router.refresh()
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
          disabled={loading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
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
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all users in the system</CardDescription>
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
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>View and manage all teams in the system</CardDescription>
              </CardHeader>
              <CardContent>
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
                        <TableHead>Members</TableHead>
                        <TableHead>Points</TableHead>
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
                            <TableCell>{team.member_count}</TableCell>
                            <TableCell>{team.total_points}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
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
                                        Are you sure you want to reset this team? This will remove all members from the
                                        team and reset team points.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                      <p>
                                        <strong>Team:</strong> {team.name}
                                      </p>
                                      <p>
                                        <strong>Members:</strong> {team.member_count}
                                      </p>
                                      <p>
                                        <strong>Points:</strong> {team.total_points}
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
                                        <strong>Team:</strong> {team.name}
                                      </p>
                                      <p>
                                        <strong>Members:</strong> {team.member_count}
                                      </p>
                                      <p>
                                        <strong>Points:</strong> {team.total_points}
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

            <Card>
              <CardHeader>
                <CardTitle>Create New Team</CardTitle>
                <CardDescription>Create a new team in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="team-name" className="text-sm font-medium">
                      Team Name
                    </label>
                    <Input
                      id="team-name"
                      placeholder="Enter team name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleCreateTeam}
                    disabled={actionInProgress === "create-team" || !newTeamName.trim()}
                    className="w-full"
                  >
                    {actionInProgress === "create-team" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {actionInProgress === "create-team" ? "Creating..." : "Create Team"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team-management">
          <Card>
            <CardHeader>
              <CardTitle>Assign Users to Teams</CardTitle>
              <CardDescription>Add users to teams or remove them from teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select User</label>
                    <Select value={selectedUserForTeam || ""} onValueChange={setSelectedUserForTeam}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter((user) => !user.team_id) // Only show users without a team
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || user.email}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Team</label>
                    <Select value={selectedTeamForUser || ""} onValueChange={setSelectedTeamForUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name} ({team.member_count}/5 members)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleAddUserToTeam}
                    disabled={actionInProgress === "add-user-to-team" || !selectedUserForTeam || !selectedTeamForUser}
                    className="w-full"
                  >
                    {actionInProgress === "add-user-to-team" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {actionInProgress === "add-user-to-team" ? "Adding..." : "Add User to Team"}
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Users with Teams</h3>
                  <div className="rounded-md border max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users
                          .filter((user) => user.team_id)
                          .map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>{user.full_name || user.email}</TableCell>
                              <TableCell>{teams.find((t) => t.id === user.team_id)?.name || "Unknown Team"}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveUserFromTeam(user.id)}
                                  disabled={actionInProgress === `remove-from-team-${user.id}`}
                                >
                                  {actionInProgress === `remove-from-team-${user.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  ) : (
                                    <UserX className="h-4 w-4 mr-1" />
                                  )}
                                  Remove
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        {users.filter((user) => user.team_id).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                              No users with teams found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Admin Users</CardTitle>
                <CardDescription>View and manage admin users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.length > 0 ? (
                        admins.map((email, index) => (
                          <TableRow key={index}>
                            <TableCell>{email}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                Admin
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                            No admin users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Admin User</CardTitle>
                <CardDescription>Grant admin privileges to a user</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="admin-email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <Input
                      id="admin-email"
                      placeholder="user@atlan.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleAddAdmin}
                    disabled={actionInProgress === "add-admin" || !newAdminEmail.trim() || !newAdminEmail.includes("@")}
                    className="w-full"
                  >
                    {actionInProgress === "add-admin" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserCog className="h-4 w-4 mr-2" />
                    )}
                    {actionInProgress === "add-admin" ? "Adding..." : "Add Admin"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
