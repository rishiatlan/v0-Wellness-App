import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { PreLaunchBanner } from "@/components/pre-launch-banner"
import { getChallengeStatus } from "@/app/actions/challenge-actions"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { AppInitializer } from "@/components/app-initializer"
import { APP_URL } from "@/lib/env-vars"
import { ClientOnly } from "@/components/client-only"

// Use Inter with expanded subset for better language support
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Spring into Wellness",
  description: "Atlan's Spring Wellness Challenge - Track your daily wellness activities and compete with colleagues",
    generator: 'v0.dev'
}

// Separate viewport export to fix Next.js metadata warning
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c1425",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get challenge status with error handling
  let started = false
  let startDate = new Date(2025, 4, 5, 0, 0, 0, 0) // Default to May 5, 2025

  try {
    const challengeStatus = await getChallengeStatus()
    started = challengeStatus.started
    startDate = challengeStatus.startDate || startDate
  } catch (error) {
    console.error("Error fetching challenge status:", error)
    // Continue with default values
  }

  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Add preconnect for Supabase */}
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mqvcdyzqegzqfwvesoiz.supabase.co"}
        />

        {/* Add canonical URL */}
        <link rel="canonical" href={APP_URL} />

        {/* Preload critical assets with proper attributes */}
        <link rel="preload" as="image" href="/wellness.png" crossOrigin="anonymous" />
        <link rel="preload" as="image" href="/wellness-logo.png" crossOrigin="anonymous" />
        <link rel="preload" as="image" href="/abstract-geometric-logo.png" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <AppInitializer />
            <div className="min-h-screen flex flex-col">
              {/* Wrap components that might cause hydration mismatches */}
              <ClientOnly>
                <Header />
              </ClientOnly>

              {/* Show pre-launch banner if challenge hasn't started */}
              <ClientOnly>
                <PreLaunchBanner launchDate={startDate} isChallengeLive={started} />
              </ClientOnly>

              {/* Main content with flex-grow to push footer down */}
              <main className="flex-grow">{children}</main>

              {/* Footer always visible at the bottom */}
              <ClientOnly>
                <Footer />
              </ClientOnly>
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
