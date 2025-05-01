"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, AlertCircle, CheckCircle } from "lucide-react"
import { assignTeamsFromCSV } from "@/app/actions/team-assignment-actions"

interface TeamAssignment {
  team_name: string
  full_name: string
  email: string
}

export function TeamAssignmentTool() {
  const [csvData, setCsvData] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<TeamAssignment[]>([])
  const [isParsed, setIsParsed] = useState(false)

  const parseCSV = () => {
    setError(null)
    setSuccess(null)

    try {
      // Simple CSV parsing
      const lines = csvData.split("\n").filter((line) => line.trim() !== "")

      // Check if there's a header row
      const hasHeader =
        lines[0].toLowerCase().includes("team_name") ||
        lines[0].toLowerCase().includes("team name") ||
        lines[0].toLowerCase().includes("email")

      const startIndex = hasHeader ? 1 : 0

      const assignments: TeamAssignment[] = []

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const columns = line.split(",").map((col) => col.trim())

        // Expect: team_name, full_name, email
        if (columns.length < 3) {
          setError(`Line ${i + 1} has invalid format. Expected: team_name, full_name, email`)
          return
        }

        assignments.push({
          team_name: columns[0],
          full_name: columns[1],
          email: columns[2],
        })
      }

      setParsedData(assignments)
      setIsParsed(true)
      setSuccess(`Successfully parsed ${assignments.length} team assignments`)
    } catch (error: any) {
      setError(`Error parsing CSV: ${error.message}`)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setSuccess(null)
    setIsParsed(false)

    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCsvData(content)
    }
    reader.onerror = () => {
      setError("Error reading file")
    }
    reader.readAsText(file)
  }

  const applyTeamAssignments = async () => {
    if (!isParsed || parsedData.length === 0) {
      setError("Please parse the CSV data first")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await assignTeamsFromCSV(parsedData)

      if (result.success) {
        setSuccess(`Successfully assigned ${parsedData.length} users to teams`)
      } else {
        setError(result.error || "Failed to assign teams")
      }
    } catch (error: any) {
      setError(`Error assigning teams: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Assignment Tool</CardTitle>
        <CardDescription>Upload a CSV file with team assignments or paste the data directly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium">Upload CSV File</label>
          <div className="flex items-center gap-2">
            <Input type="file" accept=".csv" onChange={handleFileUpload} className="flex-1" />
          </div>
          <p className="text-xs text-muted-foreground">CSV format: team_name, full_name, email</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Or Paste CSV Data</label>
          <Textarea
            value={csvData}
            onChange={(e) => {
              setCsvData(e.target.value)
              setIsParsed(false)
            }}
            placeholder="team_name, full_name, email"
            className="min-h-[200px]"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={parseCSV} disabled={!csvData.trim() || loading}>
            <Upload className="mr-2 h-4 w-4" />
            Parse CSV
          </Button>

          <Button
            onClick={applyTeamAssignments}
            disabled={!isParsed || loading || parsedData.length === 0}
            variant="default"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Apply Team Assignments
          </Button>
        </div>

        {isParsed && parsedData.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Preview ({parsedData.length} assignments)</h3>
            <div className="max-h-[200px] overflow-y-auto rounded border p-2">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Team</th>
                    <th className="py-2 px-4 text-left">Name</th>
                    <th className="py-2 px-4 text-left">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 10).map((assignment, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4">{assignment.team_name}</td>
                      <td className="py-2 px-4">{assignment.full_name}</td>
                      <td className="py-2 px-4">{assignment.email}</td>
                    </tr>
                  ))}
                  {parsedData.length > 10 && (
                    <tr>
                      <td colSpan={3} className="py-2 px-4 text-center text-muted-foreground">
                        ... and {parsedData.length - 10} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Note: This tool will create teams if they don't exist and assign users to teams based on the CSV data. Existing
        team assignments will be overwritten.
      </CardFooter>
    </Card>
  )
}

// Missing Input component
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${props.className}`}
    />
  )
}
