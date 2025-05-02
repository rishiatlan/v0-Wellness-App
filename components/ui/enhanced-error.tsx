"use client"

import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EnhancedErrorProps {
  title?: string
  message: string
  retryAction?: () => void
  retryText?: string
  className?: string
}

export function EnhancedError({
  title = "Error",
  message,
  retryAction,
  retryText = "Retry",
  className,
}: EnhancedErrorProps) {
  return (
    <div className={cn("container py-8", className)}>
      <Alert variant="destructive" className="mb-4 border-red-800 bg-red-950/30">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="font-semibold mb-1">{title}</AlertTitle>
        <AlertDescription className="text-red-200">{message}</AlertDescription>
      </Alert>
      {retryAction && (
        <div className="text-center mt-4">
          <Button onClick={retryAction} variant="outline" className="border-red-800 hover:bg-red-900/20">
            {retryText}
          </Button>
        </div>
      )}
    </div>
  )
}
