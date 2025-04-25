"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
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
        setSession(data.session)
        setUser(data.session.user)
      } else {
        console.log("No session found during refresh")
        setSession(null)
        setUser(null)
      }
      // Minimal logging in production
      if (process.env.NODE_ENV !== "production") {
        console.log("Auth: Session refresh", data.session ? "successful" : "no session found")
      }
    } catch (e: any) {
      console.error("Exception in refreshSession:", e)
      setError(e)
    }
  }, [])

  useEffect(() => {
    // Get session from local storage
    const getInitialSession = async () => {
      console.log("Getting initial session")
      try {
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
        // Minimal logging in production
        if (process.env.NODE_ENV !== "production") {
          console.log("Auth: Initial session", data.session ? "found" : "not found")
        }
      } catch (e: any) {
        console.error("Exception in getInitialSession:", e)
        setError(e)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

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
      // Minimal logging in production
      if (process.env.NODE_ENV !== "production") {
        console.log("Auth: State changed to", event)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading, error, isAtlanEmail, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}
