"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [redirecting, setRedirecting] = useState(false)

  // Handle the "Start" button click
  const handleStart = () => {
    setRedirecting(true)
    if (user) {
      // User is authenticated, redirect to daily-tracker
      router.push("/daily-tracker")
    } else {
      // User is not authenticated, redirect to login with callback
      router.push(`/auth/login?callbackUrl=${encodeURIComponent("/daily-tracker")}`)
    }
  }

  // If user is already authenticated, we can optionally auto-redirect
  useEffect(() => {
    // Uncomment this if you want to auto-redirect authenticated users
    // if (!loading && user) {
    //   router.push("/daily-tracker")
    // }
  }, [user, loading, router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
            Spring into Wellness
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            Track your daily wellness activities and compete with your team
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="overflow-hidden">
            <div className="h-48 relative">
              <Image src="/flourishing-wellbeing.png" alt="Wellness activities" fill className="object-cover" />
            </div>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-2">Track Daily Activities</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Log your daily wellness activities and build healthy habits.
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="h-48 relative">
              <Image src="/flourishing-team.png" alt="Team challenge" fill className="object-cover" />
            </div>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-2">Team Challenge</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Compete with your colleagues in our team wellness challenge.
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="h-48 relative">
              <Image src="/colorful-gift-cards.png" alt="Rewards" fill className="object-cover" />
            </div>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-2">Earn Rewards</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Reach wellness tiers and earn exciting rewards for your achievements.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Button
            onClick={handleStart}
            disabled={redirecting || loading}
            className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white px-8 py-6 text-lg"
          >
            {redirecting || loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loading ? "Loading..." : "Redirecting..."}
              </>
            ) : (
              "Start Now"
            )}
          </Button>
        </div>

        <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
          <p>
            Track your hydration (80oz/2.36L), movement, mindfulness, and more to earn points and reach wellness tiers.
          </p>
        </div>
      </div>
    </main>
  )
}
