"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Home, RefreshCw } from "lucide-react"
import Link from "next/link"

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [errorInfo, setErrorInfo] = useState<string>("")

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Application error caught:", event.error)
      setHasError(true)
      setError(event.error)

      // Log to a monitoring service in production
      if (process.env.NODE_ENV === "production") {
        // This is where you would send to a monitoring service
        // Example: sendToMonitoring(event.error)
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason)
      setHasError(true)
      setError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)))
      setErrorInfo("Unhandled Promise Rejection")

      // Log to a monitoring service in production
      if (process.env.NODE_ENV === "production") {
        // This is where you would send to a monitoring service
        // Example: sendToMonitoring(event.reason)
      }
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  if (hasError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span>Something went wrong</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the
              problem persists.
            </p>
            {process.env.NODE_ENV !== "production" && error && (
              <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">
                <p className="font-medium">Error details (visible in development only):</p>
                <p className="mt-1 font-mono text-xs">{error.message || "Unknown error"}</p>
                {errorInfo && <p className="mt-1 font-mono text-xs">{errorInfo}</p>}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={() => window.location.reload()} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
