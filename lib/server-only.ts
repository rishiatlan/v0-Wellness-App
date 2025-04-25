// This file contains imports that should NEVER be imported in client components
// that might be used in the Pages Router

// Mark this file as server-only to prevent it from being imported in client components
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Export the server-only imports
export { cookies } from "next/headers"
export { createServerClient } from "@supabase/ssr"
export { revalidatePath } from "next/cache"
