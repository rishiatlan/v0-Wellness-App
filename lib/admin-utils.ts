"use client"

import { useState, useEffect } from "react"
import { supabase } from "./supabase"
import { createClient } from "@supabase/supabase-js"

// CRITICAL FIX: Make sure this list includes your email
export const INITIAL_ADMIN_EMAILS = ["rishi.banerjee@atlan.com", "steven.hloros@atlan.com", "sucharita.tuer@atlan.com"]

/**
 * Checks if a user is an admin based on their email
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false

  // First check the initial list (for first-time setup)
  const emailLower = email.toLowerCase()
  if (INITIAL_ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === emailLower)) {
    console.log("User is in INITIAL_ADMIN_EMAILS:", email)
    return true
  }

  // Then check local storage for cached admin list
  try {
    const cachedAdmins = localStorage.getItem("admin_emails")
    if (cachedAdmins) {
      const adminList = JSON.parse(cachedAdmins)
      const isInCachedList = adminList.some((adminEmail: string) => adminEmail.toLowerCase() === emailLower)
      if (isInCachedList) {
        console.log("User is in cached admin list:", email)
        return true
      }
    }
  } catch (error) {
    console.error("Error checking cached admin list:", error)
  }

  return false
}

/**
 * Hook to get and cache the list of admin users
 */
export function useAdminUsers() {
  const [admins, setAdmins] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true)

        // In a real app, this would fetch from a database table
        // For now, we'll use the user_metadata.is_admin field
        const { data, error } = await supabase.from("admin_users").select("email")

        if (error) throw error

        const adminEmails = data?.map((item) => item.email.toLowerCase()) || []

        // Include the initial admins
        const allAdmins = [...new Set([...INITIAL_ADMIN_EMAILS.map((email) => email.toLowerCase()), ...adminEmails])]

        setAdmins(allAdmins)

        // Cache the admin list in localStorage
        try {
          localStorage.setItem("admin_emails", JSON.stringify(allAdmins))
        } catch (e) {
          console.error("Error caching admin list:", e)
        }
      } catch (err: any) {
        console.error("Error fetching admin users:", err)
        setError(err.message)

        // Fallback to initial list
        setAdmins(INITIAL_ADMIN_EMAILS.map((email) => email.toLowerCase()))
      } finally {
        setLoading(false)
      }
    }

    fetchAdmins()
  }, [])

  return { admins, loading, error }
}

/**
 * Gets the list of admin emails (client-side)
 */
export function getAdminsClient(): string[] {
  // First check local storage
  try {
    const cachedAdmins = localStorage.getItem("admin_emails")
    if (cachedAdmins) {
      return JSON.parse(cachedAdmins)
    }
  } catch (error) {
    console.error("Error getting cached admin list:", error)
  }

  // Fallback to initial list
  return [...INITIAL_ADMIN_EMAILS.map((email) => email.toLowerCase())]
}

export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase service role credentials")
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
