import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { PreLaunchBanner } from "@/components/pre-launch-banner"
import { getChallengeStatus } from "@/app/actions/challenge-actions"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { AssetPreloader } from "@/components/asset-preloader"
import { AppInitializer } from "@/components/app-initializer"
import { APP_VERSION, APP_URL } from "@/lib/env-vars"

// Use Inter with expanded subset for better language support
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata = {
  title: "Spring into Wellness",
  description: "Atlan's Spring Wellness Challenge - Track your daily wellness activities and compete with colleagues",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#0c1425",
  version: APP_VERSION,
    generator: 'v0.dev'
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
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AssetPreloader />
          <AuthProvider>
            <AppInitializer />
            <div className="min-h-screen flex flex-col">
              {/* Header is now always visible on all pages */}
              <Header />

              {/* Show pre-launch banner if challenge hasn't started */}
              <PreLaunchBanner launchDate={startDate} isChallengeLive={started} />

              {/* Main content with flex-grow to push footer down */}
              <main className="flex-grow">{children}</main>

              {/* Footer always visible at the bottom */}
              <Footer />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
