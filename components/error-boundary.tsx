"use client"

import type React from "react"
import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Home, RefreshCw } from "lucide-react"
import Link from "next/link"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: "",
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo: errorInfo.componentStack,
    })

    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to console
    console.error("Error caught by ErrorBoundary:", error, errorInfo)

    // Log to a monitoring service in production
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ERROR_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ERROR_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: error.toString(),
          componentStack: errorInfo.componentStack,
          location: window.location.href,
          timestamp: new Date().toISOString(),
          appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
        }),
      }).catch((err) => {
        console.error("Failed to report error:", err)
      })
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
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
              {process.env.NODE_ENV !== "production" && this.state.error && (
                <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">
                  <p className="font-medium">Error details (visible in development only):</p>
                  <p className="mt-1 font-mono text-xs">{this.state.error.message || "Unknown error"}</p>
                  {this.state.errorInfo && <p className="mt-1 font-mono text-xs">{this.state.errorInfo}</p>}
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

    return this.props.children
  }
}

// Client component wrapper for error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void,
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
