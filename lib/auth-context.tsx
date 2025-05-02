"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import type React from "react"
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

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  signOut: async () => {},
  refreshSession: async () => {},
})

// Create a provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [authListener, setAuthListener] = useState<{ subscription: { unsubscribe: () => void } } | null>(null)

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
    } catch (err: any) {
      console.error("Error signing out:", err)
      setError(err)
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    // Set loading to true when the component mounts
    setLoading(true)

    // Get the initial session
    refreshSession()

    // Subscribe to auth changes
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event)
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setLoading(false)
    })

    // Store the listener
    setAuthListener(data)

    // Clean up the subscription
    return () => {
      if (data && data.subscription) {
        data.subscription.unsubscribe()
      }
    }
  }, [refreshSession]) // Only depend on refreshSession

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      error,
      signOut,
      refreshSession,
    }),
    [user, session, loading, error, signOut, refreshSession],
  )

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
