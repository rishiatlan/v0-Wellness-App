"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import { isAtlanEmail } from "./is-atlan-email"

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  error: Error | null
  isAtlanEmail: (email: string) => boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  isAtlanEmail: () => false,
  refreshSession: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [authInitialized, setAuthInitialized] = useState(false)

  // This will prevent unnecessary error messages during normal authentication flows
  const clearAuthErrors = useCallback(() => {
    // Clear any URL parameters that might cause error messages
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      if (url.searchParams.has("error") && url.searchParams.get("error")?.includes("authentication code")) {
        url.searchParams.delete("error")
        window.history.replaceState({}, "", url.toString())
      }
    }
  }, [])

  // Function to refresh the session - memoized with useCallback
  const refreshSession = useCallback(async () => {
    try {
      console.log("Refreshing session")
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Error refreshing session:", error)
        setError(error)
        return
      }

      if (data.session) {
        console.log("Session refreshed successfully for:", data.session.user.email)
        console.log("Session expires at:", new Date(data.session.expires_at! * 1000).toLocaleString())
        setSession(data.session)
        setUser(data.session.user)
      } else {
        console.log("No session found during refresh")
        setSession(null)
        setUser(null)
      }
    } catch (e: any) {
      console.error("Exception in refreshSession:", e)
      setError(e)
    }
  }, [])

  // Get initial session - only run once
  useEffect(() => {
    // Clear any authentication error parameters that might be in the URL
    clearAuthErrors()

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Auth initialization timed out")
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    // Get session from local storage
    const getInitialSession = async () => {
      console.log("Getting initial session")
      try {
        setLoading(true)

        // First try to get the session from the browser storage
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setError(error)
        } else if (data.session) {
          console.log("Initial session found for:", data.session.user.email)
          console.log("Session expires at:", new Date(data.session.expires_at! * 1000).toLocaleString())
          setSession(data.session)
          setUser(data.session.user)
        } else {
          console.log("No initial session found")
        }
      } catch (e: any) {
        console.error("Exception in getInitialSession:", e)
        setError(e)
      } finally {
        setLoading(false)
        setAuthInitialized(true)
        clearTimeout(timeoutId)
      }
    }

    getInitialSession()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [clearAuthErrors])

  // Set up auth state change listener
  useEffect(() => {
    if (!authInitialized) return

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event)

      if (session) {
        console.log("New session for:", session.user.email)
        console.log("Session expires at:", new Date(session.expires_at! * 1000).toLocaleString())
        setSession(session)
        setUser(session.user)
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out")
        setSession(null)
        setUser(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [authInitialized])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      user,
      session,
      loading,
      error,
      isAtlanEmail,
      refreshSession,
    }),
    [user, session, loading, error, refreshSession],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
