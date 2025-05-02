"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function DebugAuthButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const checkAuthStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-auth-status")
      const data = await response.json()
      setResult(data)
      console.log("Auth debug info:", data)
    } catch (error) {
      console.error("Error checking auth status:", error)
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <Button variant="outline" size="sm" onClick={checkAuthStatus} disabled={loading} className="w-full text-xs">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Checking...
          </>
        ) : (
          "Debug Auth Status"
        )}
      </Button>

      {result && (
        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
