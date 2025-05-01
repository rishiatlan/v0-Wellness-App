import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This lightweight middleware only adds the pathname to headers
// It's much more efficient than doing auth checks in middleware
export function middleware(req: NextRequest) {
  const response = NextResponse.next()

  // Add the pathname to headers for server components
  response.headers.set("x-pathname", req.nextUrl.pathname)

  return response
}

// Run on all routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
