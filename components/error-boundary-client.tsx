"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export function ErrorBoundaryClient({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error("Client error caught by boundary:", event.error)
      setError(event.error)
      setHasError(true)

      // Prevent the error from bubbling up
      event.preventDefault()
    }

    // Add global error handler
    window.addEventListener("error", errorHandler)

    // Clean up
    return () => {
      window.removeEventListener("error", errorHandler)
    }
  }, [])

  if (hasError) {
    return (
      <Card className="mx-auto my-8 max-w-md border-red-200">
        <CardHeader className="bg-red-50 text-red-700">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600">{error?.message || "An unexpected error occurred"}</p>
          {error?.stack && (
            <pre className="mt-4 max-h-40 overflow-auto rounded bg-gray-100 p-2 text-xs">{error.stack}</pre>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => {
              setHasError(false)
              setError(null)
              window.location.reload()
            }}
          >
            Try again
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return <>{children}</>
}
