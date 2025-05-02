"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "./supabase-client"

// Define the shape of our auth context
type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void> // Add this function back
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {}, // Add default implementation
})

// Provider component that wraps the app and makes auth available
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasInitialized = useRef(false)
  const authChangeProcessed = useRef(false)

  // Initialize auth state from Supabase
  useEffect(() => {
    // Skip on server-side rendering
    if (typeof window === "undefined") return

    // Prevent multiple initializations
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession()

        if (data.session) {
          console.log("Initial session exists, expires at:", new Date(data.session.expires_at! * 1000).toLocaleString())
          setUser(data.session.user)
          setSession(data.session)
        } else {
          console.log("No initial session found")
          setUser(null)
          setSession(null)
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event)

      // Prevent duplicate processing of the same auth event
      if (authChangeProcessed.current && event === "SIGNED_IN") return
      authChangeProcessed.current = true

      if (newSession) {
        setUser(newSession.user)
        setSession(newSession)
      } else {
        setUser(null)
        setSession(null)
      }

      setIsLoading(false)
    })

    // Clean up subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Add refreshSession function
  const refreshSession = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Error refreshing session:", error)
        return
      }

      setSession(data.session)
      setUser(data.session?.user ?? null)
    } catch (error) {
      console.error("Exception refreshing session:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Provide auth context to children
  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext)
