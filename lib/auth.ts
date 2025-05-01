// This file is for use in the app directory only
// DO NOT IMPORT THIS FILE IN THE PAGES DIRECTORY

import { supabase } from "./supabase"
import { isAtlanEmail as isAtlanEmailOriginal } from "@/lib/is-atlan-email"

// Re-export the isAtlanEmail function for backward compatibility
export const isAtlanEmail = isAtlanEmailOriginal

// Sign up with email and password
export async function signUp(email: string, password: string, fullName: string) {
  if (!isAtlanEmail(email)) {
    throw new Error("Only @atlan.com email addresses are allowed to register")
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    return data
  } catch (error: any) {
    throw new Error(error.message)
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  console.log("Authentication attempt in progress")

  try {
    // Use signInWithPassword for email/password auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Supabase auth error:", error.message, error)

      // Check for specific error types to provide better user feedback
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password. Please try again.")
      } else if (error.message.includes("Email not confirmed")) {
        throw new Error("Please verify your email address before logging in.")
      } else if (error.message.includes("rate limit")) {
        throw new Error("Too many login attempts. Please try again later.")
      } else {
        // If using a VPN, this might be the issue
        throw new Error("Authentication failed. If you're using a VPN, please try disabling it.")
      }
    }

    // Verify the session was created
    if (!data.session) {
      console.error("No session created after successful authentication")
      throw new Error("Authentication succeeded but no session was created")
    }

    return data
  } catch (error: any) {
    console.error("Sign in function caught error:", error)
    throw new Error(error.message || "Authentication failed")
  }
}

// Sign out
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error signing out:", error)
      throw error
    }

    // Redirect to home page after sign out
    window.location.href = "/"
    return { success: true }
  } catch (error) {
    console.error("Exception during sign out:", error)
    return { success: false, error }
  }
}

// Reset password
export async function resetPassword(email: string) {
  if (!isAtlanEmail(email)) {
    throw new Error("Only @atlan.com email addresses are allowed")
  }

  try {
    // Update the redirectTo URL to match the exact path we've created
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
    })

    if (error) throw error
  } catch (error: any) {
    throw new Error(error.message)
  }
}

// Get user profile
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle()

    if (error) {
      console.error("Error fetching user profile:", error)
      throw error
    }

    return data
  } catch (error: any) {
    console.error("Exception in getUserProfile:", error)
    throw new Error(error.message)
  }
}

// Test Supabase connection
export async function testSupabaseConnection() {
  try {
    console.log("Testing Supabase connection...")
    const { data, error } = await supabase.from("users").select("count").limit(1)

    if (error) {
      console.error("Supabase connection test error:", error)
      return { success: false, error: error.message }
    }

    console.log("Supabase connection successful:", data)
    return { success: true, data }
  } catch (error: any) {
    console.error("Supabase connection test exception:", error)
    return { success: false, error: error.message }
  }
}

// Get user profile - client safe version
export async function getUserProfileClientSafe(userId: string) {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle()

    if (error) {
      console.error("Error fetching user profile:", error)
      throw error
    }

    return data
  } catch (error: any) {
    console.error("Exception in getUserProfile:", error)
    throw new Error(error.message)
  }
}

export async function isAuthenticated() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error("Error checking authentication:", error)
      return false
    }
    return !!data.session
  } catch (error) {
    console.error("Exception checking authentication:", error)
    return false
  }
}
