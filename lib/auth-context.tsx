"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useMemo } from "react"
import { createContext, useContextSelector } from "use-context-selector"
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
  // Use refs for state to prevent unnecessary re-renders
  const userRef = useRef<User | null>(null)
  const sessionRef = useRef<Session | null>(null)
  const loadingRef = useRef<boolean>(true)
  const errorRef = useRef<Error | null>(null)
  const authListenerRef = useRef<{ subscription: { unsubscribe: () => void } } | null>(null)

  // Function to refresh the session
  const refreshSession = useCallback(async () => {
    try {
      loadingRef.current = true
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        throw error
      }

      sessionRef.current = data.session
      userRef.current = data.session?.user ?? null
    } catch (err: any) {
      console.error("Error refreshing session:", err)
      errorRef.current = err
    } finally {
      loadingRef.current = false
    }
  }, [])

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      userRef.current = null
      sessionRef.current = null
    } catch (err: any) {
      console.error("Error signing out:", err)
      errorRef.current = err
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    // Set loading to true when the component mounts
    loadingRef.current = true

    // Get the initial session
    refreshSession()

    // Subscribe to auth changes - ensure we only have one listener
    if (authListenerRef.current) {
      authListenerRef.current.subscription.unsubscribe()
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event)

      // Update refs directly to avoid unnecessary re-renders
      sessionRef.current = newSession
      userRef.current = newSession?.user ?? null
      loadingRef.current = false
    })

    authListenerRef.current = authListener

    // Clean up the subscription
    return () => {
      if (authListenerRef.current) {
        authListenerRef.current.subscription.unsubscribe()
      }
    }
  }, [refreshSession])

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user: userRef.current,
      session: sessionRef.current,
      loading: loadingRef.current,
      error: errorRef.current,
      signOut,
      refreshSession,
    }),
    [signOut, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Create hooks to use the auth context with selectors for better performance
export function useUser() {
  return useContextSelector(AuthContext, (state) => state.user)
}

export function useSession() {
  return useContextSelector(AuthContext, (state) => state.session)
}

export function useAuthLoading() {
  return useContextSelector(AuthContext, (state) => state.loading)
}

export function useAuthError() {
  return useContextSelector(AuthContext, (state) => state.error)
}

export function useSignOut() {
  return useContextSelector(AuthContext, (state) => state.signOut)
}

export function useRefreshSession() {
  return useContextSelector(AuthContext, (state) => state.refreshSession)
}

// Legacy hook for backward compatibility
export function useAuth() {
  const user = useUser()
  const session = useSession()
  const loading = useAuthLoading()
  const error = useAuthError()
  const signOut = useSignOut()
  const refreshSession = useRefreshSession()

  return { user, session, loading, error, signOut, refreshSession }
}
