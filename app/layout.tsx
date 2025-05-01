import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { PreLaunchBanner } from "@/components/pre-launch-banner"
import { getChallengeStatus } from "@/app/actions/challenge-actions"
import Header from "@/components/header" // Make sure to import the Header component

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Spring into Wellness",
  description: "Atlan's Spring Wellness Challenge",
    generator: 'v0.dev'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get challenge status
  const { started, startDate } = await getChallengeStatus()

  // Default to tomorrow if no start date is set
  const launchDate = startDate ? new Date(startDate) : new Date(Date.now() + 24 * 60 * 60 * 1000)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              {/* Show pre-launch banner if challenge hasn't started */}
              <PreLaunchBanner launchDate={launchDate} isChallengeLive={started} />

              {/* Always include the Header component */}
              <Header />

              {children}
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
