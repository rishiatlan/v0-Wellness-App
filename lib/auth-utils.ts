import { supabase } from "@/lib/supabase"

/**
 * Validates a password reset token by attempting to set a session with it
 * @param accessToken The access token from the reset link
 * @param refreshToken The refresh token from the reset link
 * @returns An object indicating if the token is valid and any error message
 */
export async function validateResetToken(accessToken: string, refreshToken: string) {
  try {
    if (!accessToken || !refreshToken) {
      return { valid: false, error: "Missing token information" }
    }

    // Try to set the session with the tokens
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (error) {
      console.error("Error validating reset token:", error)
      return { valid: false, error: "Your password reset link has expired. Please request a new one." }
    }

    return { valid: true, error: null }
  } catch (error: any) {
    console.error("Exception validating reset token:", error)
    return { valid: false, error: "Failed to validate your reset token. Please try again." }
  }
}

/**
 * Checks if the current user has a valid session
 * @returns An object indicating if the user is authenticated and the user data
 */
export async function checkAuthentication() {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error checking authentication:", error)
      return { authenticated: false, user: null, error: error.message }
    }

    return {
      authenticated: !!data.session,
      user: data.session?.user || null,
      error: null,
    }
  } catch (error: any) {
    console.error("Exception checking authentication:", error)
    return { authenticated: false, user: null, error: error.message }
  }
}

/**
 * Logs authentication events for debugging
 * @param event The event name
 * @param details Additional details about the event
 */
export function logAuthEvent(event: string, details?: any) {
  console.log(`[Auth] ${event}`, details || "")

  // In production, you might want to send these logs to a monitoring service
  if (process.env.NODE_ENV === "production") {
    // Send to monitoring service
  }
}
