// This file is for use in the app directory only
// DO NOT IMPORT THIS FILE IN THE PAGES DIRECTORY

import { supabase } from "./supabase"
import { isAtlanEmail as isAtlanEmailOriginal } from "@/lib/is-atlan-email"
import { logAuthEvent } from "./auth-utils"

// Re-export the isAtlanEmail function for backward compatibility
export const isAtlanEmail = isAtlanEmailOriginal

// Sign up with email and password
export async function signUp(email: string, password: string, fullName: string) {
  if (!isAtlanEmail(email)) {
    throw new Error("Only @atlan.com email addresses are allowed to register")
  }

  try {
    logAuthEvent("Attempting to sign up user", { email })

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

    if (error) {
      logAuthEvent("Supabase signup error", { error: error.message })
      throw error
    }

    logAuthEvent("Signup successful", { userId: data.user?.id })
    return data
  } catch (error: any) {
    logAuthEvent("Exception during signup", { error: error.message })
    throw new Error(error.message)
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  logAuthEvent("Authentication attempt in progress", { email })

  try {
    // Clear any existing sessions first to prevent conflicts
    await supabase.auth.signOut()

    // Use signInWithPassword for email/password auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Add this after the authentication attempt in the signIn function
    console.log("Authentication response:", {
      session: !!data.session,
      user: !!data.user,
      expiresAt: data.session?.expires_at,
    })

    if (error) {
      logAuthEvent("Supabase auth error", { error: error.message })

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
      logAuthEvent("No session created after successful authentication")
      throw new Error("Authentication succeeded but no session was created")
    }

    logAuthEvent("Authentication successful", {
      email,
      expiresAt: new Date(data.session.expires_at! * 1000).toLocaleString(),
    })

    // Also log the redirect attempt
    logAuthEvent("Attempting redirect after login", { callbackUrl: window.location.origin + "/daily-tracker" })

    return data
  } catch (error: any) {
    logAuthEvent("Sign in function caught error", { error: error.message })
    throw new Error(error.message || "Authentication failed")
  }
}

// Sign out
export async function signOut() {
  try {
    logAuthEvent("Signing out user")
    const { error } = await supabase.auth.signOut()
    if (error) {
      logAuthEvent("Error signing out", { error: error.message })
      throw error
    }

    // Redirect to home page after sign out
    window.location.href = "/"
    return { success: true }
  } catch (error: any) {
    logAuthEvent("Exception during sign out", { error: error.message })
    return { success: false, error }
  }
}

// Reset password
export async function resetPassword(email: string) {
  if (!isAtlanEmail(email)) {
    throw new Error("Only @atlan.com email addresses are allowed")
  }

  try {
    logAuthEvent("Password reset requested", { email })

    // Update the redirectTo URL to match the exact path we've created
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
    })

    if (error) {
      logAuthEvent("Password reset error", { error: error.message })
      throw error
    }

    logAuthEvent("Password reset email sent", { email })
    return { success: true }
  } catch (error: any) {
    logAuthEvent("Exception during password reset", { error: error.message })
    throw new Error(error.message)
  }
}

// Get user profile
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle()

    if (error) {
      logAuthEvent("Error fetching user profile", { error: error.message, userId })
      throw error
    }

    return data
  } catch (error: any) {
    logAuthEvent("Exception in getUserProfile", { error: error.message, userId })
    throw new Error(error.message)
  }
}

// Test Supabase connection
export async function testSupabaseConnection() {
  try {
    logAuthEvent("Testing Supabase connection")
    const { data, error } = await supabase.from("users").select("count").limit(1)

    if (error) {
      logAuthEvent("Supabase connection test error", { error: error.message })
      return { success: false, error: error.message }
    }

    logAuthEvent("Supabase connection successful", { data })
    return { success: true, data }
  } catch (error: any) {
    logAuthEvent("Supabase connection test exception", { error: error.message })
    return { success: false, error: error.message }
  }
}

// Get user profile - client safe version
export async function getUserProfileClientSafe(userId: string) {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle()

    if (error) {
      logAuthEvent("Error fetching user profile (client safe)", { error: error.message, userId })
      throw error
    }

    return data
  } catch (error: any) {
    logAuthEvent("Exception in getUserProfile (client safe)", { error: error.message, userId })
    throw new Error(error.message)
  }
}

export async function isAuthenticated() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      logAuthEvent("Error checking authentication", { error: error.message })
      return false
    }
    return !!data.session
  } catch (error: any) {
    logAuthEvent("Exception checking authentication", { error: error.message })
    return false
  }
}
