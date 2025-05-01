"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export function AppInitializer() {
  const [initialized, setInitialized] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function initializeApp() {
      try {
        // Check database setup
        const dbSetupResponse = await fetch("/api/ensure-db-setup")
        const dbSetupData = await dbSetupResponse.json()

        if (dbSetupData.errors && dbSetupData.errors.length > 0) {
          console.warn("Database setup warnings:", dbSetupData.errors)
        }

        // Check auth status
        const authStatusResponse = await fetch("/api/debug-auth-status")
        const authStatusData = await authStatusResponse.json()

        if (authStatusData.user?.exists) {
          console.log("User is authenticated:", authStatusData.user.email)
        }

        // Force a router refresh to ensure all components have the latest data
        router.refresh()

        setInitialized(true)
      } catch (error) {
        console.error("Error initializing app:", error)
        toast({
          title: "App Initialization",
          description: "There was an issue initializing the app. Some features may not work correctly.",
          variant: "destructive",
        })
        setInitialized(true) // Still mark as initialized to avoid blocking the UI
      }
    }

    initializeApp()
  }, [router, toast])

  // This component doesn't render anything visible
  return null
}
