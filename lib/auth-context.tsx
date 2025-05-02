"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "./supabase-client"

// Define the shape of the auth context
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: Error | null
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create a provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Use null as initial state to prevent hydration mismatch
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const authChangeProcessed = useRef(false)

  // Function to refresh the session
  const refreshSession = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        throw error
      }

      setSession(data.session)
      setUser(data.session?.user ?? null)
    } catch (err: any) {
      console.error("Error refreshing session:", err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)

      // Force a page reload to clear all state
      window.location.href = "/"
    } catch (err: any) {
      console.error("Error signing out:", err)
      setError(err)
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    if (typeof window === "undefined") return

    let mounted = true

    // Set loading to true when the component mounts
    if (mounted) setLoading(true)

    // Get the initial session
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting initial session:", error)
          if (mounted) setError(error)
          return
        }

        if (mounted) {
          setSession(data.session)
          setUser(data.session?.user ?? null)
        }
      } catch (err) {
        console.error("Exception during auth initialization:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    // Subscribe to auth changes only after initial load
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event)

      // Prevent multiple auth change handlers from firing
      if (authChangeProcessed.current && event === "SIGNED_IN") {
        console.log("Auth change already processed, skipping")
        return
      }

      if (mounted) {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        setLoading(false)

        // Mark that we've processed an auth change
        if (event === "SIGNED_IN") {
          authChangeProcessed.current = true
        }
      }
    })

    // Clean up the subscription
    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  const value = {
    user,
    session,
    loading,
    error,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Create a hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
