import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a Supabase client with the service role key for admin operations
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase service role credentials")
    throw new Error("Server configuration error: Missing Supabase service role credentials")
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Initialize user profile in the database with retry mechanism
export async function initializeUserProfile(userId: string, email: string, fullName?: string) {
  console.log(`Initializing user profile for ${email} (${userId})`)

  const supabase = createServiceRoleClient()
  let retries = 3

  while (retries > 0) {
    try {
      // Check if user already exists in the database
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle()

      if (checkError) {
        console.error("Error checking if user exists:", checkError)
        throw new Error("Failed to check if user exists")
      }

      // If user doesn't exist, create them
      if (!existingUser) {
        console.log(`User ${userId} doesn't exist in database, creating user record`)

        // Create user in the database using the provided information
        const { error: insertError } = await supabase.from("users").insert({
          id: userId,
          email: email,
          full_name: fullName || email.split("@")[0] || "User",
          total_points: 0,
          current_tier: 0,
          current_streak: 0,
        })

        if (insertError) {
          console.error("Error creating user:", insertError)

          // If it's a unique constraint violation, the user might have been created in a race condition
          if (insertError.code === "23505") {
            console.log("User profile appears to have been created in a race condition, considering successful")
            return true
          }

          throw new Error("Failed to create user profile")
        }

        console.log(`User profile created successfully for ${email}`)
      } else {
        console.log(`User ${userId} already exists in database`)
      }

      return true
    } catch (error: any) {
      retries--
      console.error(`Error in initializeUserProfile (${retries} retries left):`, error)

      if (retries <= 0) {
        throw new Error(`Failed to initialize user profile after multiple attempts: ${error.message}`)
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}
