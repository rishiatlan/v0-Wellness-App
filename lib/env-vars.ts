// Default environment variables with fallbacks

/**
 * Application version
 * Used for tracking which version is deployed and in error reports
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"

/**
 * Error logging endpoint
 * Where client-side errors are sent
 */
export const ERROR_ENDPOINT = process.env.NEXT_PUBLIC_ERROR_ENDPOINT || "/api/log-error"

/**
 * Supabase URL
 * URL of the Supabase instance
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL

/**
 * Supabase Anon Key
 * Anonymous API key for Supabase
 */
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

/**
 * Application URL
 * Used for generating absolute URLs
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://v0-spring-wellness-app.vercel.app"

/**
 * Environment
 * Current environment (development, production, etc.)
 */
export const NODE_ENV = process.env.NODE_ENV || "development"

/**
 * Is Production
 * Helper to check if we're in production
 */
export const IS_PRODUCTION = NODE_ENV === "production"

/**
 * Is Development
 * Helper to check if we're in development
 */
export const IS_DEVELOPMENT = NODE_ENV === "development"
