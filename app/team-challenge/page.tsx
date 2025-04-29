"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TeamChallenge() {
  const router = useRouter()

  // Redirect to home page
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.push("/")
    }, 3000)

    return () => clearTimeout(redirectTimer)
  }, [router])

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Team Challenge</CardTitle>
          <CardDescription>This feature is currently unavailable</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The Team Challenge feature is temporarily hidden. You will be redirected to the home page.
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/")} className="mt-2">
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
