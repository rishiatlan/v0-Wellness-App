// List of public routes that don't require authentication
export const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/auth/callback",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/health",
  "/leaderboard",
]

// Helper function to check if a path is public
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.includes(path) || path.startsWith("/api/") || path.startsWith("/_next/") || path.includes(".")
}
